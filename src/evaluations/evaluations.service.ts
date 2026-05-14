import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto, TypeEvaluation } from './dto/create-evaluation.dto';
import { SaveReleveDto } from './dto/releve-matiere.dto';
import { CalculsService } from '../calculs/calculs.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private calculsService: CalculsService,
  ) {}

  /** Évite P2003 opaque : matière inexistante (IDs obsolètes, mauvaise clé côté client). */
  private async assertMatiereExists(matiereId: string): Promise<void> {
    const exists = await this.prisma.matiere.findUnique({
      where: { id: matiereId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(
        `Matière introuvable (id: ${matiereId}). Vérifiez l'identifiant ou rechargez les matières depuis l'API (référentiel modifié ou cache obsolète).`,
      );
    }
  }

  private async assertEtudiantUtilisateur(utilisateurId: string): Promise<void> {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, etudiant: { select: { utilisateurId: true } } },
    });
    if (!u) {
      throw new NotFoundException(`Utilisateur introuvable (id: ${utilisateurId}).`);
    }
    if (!u.etudiant) {
      throw new BadRequestException(
        "Une évaluation ne peut être liée qu'à un compte étudiant (profil étudiant requis).",
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASCADE COMPLÈTE : matière → UE → semestre
  // Appelée après chaque create / update / remove d'évaluation
  // ─────────────────────────────────────────────────────────────────────────
  private async recalculerCascade(utilisateurId: string, matiereId: string): Promise<void> {
    try {
      // 1. Recalculer la moyenne de la matière
      await this.calculsService.calculerMoyenneMatiere(utilisateurId, matiereId);

      // 2. Récupérer l'UE de la matière
      const matiere = await this.prisma.matiere.findUnique({
        where: { id: matiereId },
        select: { uniteEnseignementId: true },
      });
      if (!matiere) return;

      // 3. Recalculer la moyenne de l'UE
      await this.calculsService.calculerMoyenneUE(utilisateurId, matiere.uniteEnseignementId);

      // 4. Récupérer le semestre de l'UE
      const ue = await this.prisma.uniteEnseignement.findUnique({
        where: { id: matiere.uniteEnseignementId },
        select: { semestreId: true },
      });
      if (!ue) return;

      // 5. Recalculer le résultat du semestre
      await this.calculsService.calculerResultatSemestre(utilisateurId, ue.semestreId);

    } catch (error) {
      // Ne jamais bloquer la réponse si le calcul échoue
      console.warn(
        `[Cascade] Recalcul échoué pour utilisateur=${utilisateurId} matière=${matiereId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────
  async create(createEvaluationDto: CreateEvaluationDto) {
    // Validation rattrapage
    if (createEvaluationDto.type === TypeEvaluation.RATTRAPAGE) {
      const evaluationsInitiales = await this.prisma.evaluation.findMany({
        where: {
          utilisateurId: createEvaluationDto.utilisateurId,
          matiereId: createEvaluationDto.matiereId,
          type: { in: [TypeEvaluation.CC, TypeEvaluation.EXAMEN] },
        },
      });

      if (evaluationsInitiales.length < 2) {
        throw new BadRequestException('Rattrapage non autorisé : CC ou Examen manquant');
      }

      let moyenneInitiale = 0;
      evaluationsInitiales.forEach((ev) => {
        if (ev.note !== null && ev.note !== undefined) {
          if (ev.type === TypeEvaluation.CC) moyenneInitiale += ev.note * 0.6;
          else if (ev.type === TypeEvaluation.EXAMEN) moyenneInitiale += ev.note * 0.4;
        }
      });

      if (moyenneInitiale >= 6) {
        throw new BadRequestException(
          `Rattrapage non autorisé : moyenne initiale (${moyenneInitiale.toFixed(2)}) ≥ 6/20`,
        );
      }
    }

    await this.assertMatiereExists(createEvaluationDto.matiereId);
    await this.assertEtudiantUtilisateur(createEvaluationDto.utilisateurId);

    // Créer l'évaluation
    const evaluation = await this.prisma.evaluation.create({
      data: createEvaluationDto,
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });

    // Cascade complète : matière → UE → semestre
    await this.recalculerCascade(
      createEvaluationDto.utilisateurId,
      createEvaluationDto.matiereId,
    );

    return evaluation;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  async update(id: string, updateEvaluationDto: Partial<CreateEvaluationDto>) {
    // Récupérer l'évaluation avant modification pour avoir utilisateurId + matiereId
    const existing = await this.prisma.evaluation.findUnique({
      where: { id },
      select: { utilisateurId: true, matiereId: true },
    });

    const evaluation = await this.prisma.evaluation.update({
      where: { id },
      data: updateEvaluationDto,
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });

    // Cascade complète après modification
    if (existing) {
      await this.recalculerCascade(existing.utilisateurId, existing.matiereId);
    }

    return evaluation;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────
  async remove(id: string) {
    // Récupérer avant suppression pour pouvoir recalculer après
    const existing = await this.prisma.evaluation.findUnique({
      where: { id },
      select: { utilisateurId: true, matiereId: true },
    });

    const evaluation = await this.prisma.evaluation.delete({ where: { id } });

    // Cascade complète après suppression
    if (existing) {
      await this.recalculerCascade(existing.utilisateurId, existing.matiereId);
    }

    return evaluation;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────────────────
  async findAll() {
    return this.prisma.evaluation.findMany({
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  async findByEtudiant(utilisateurId: string) {
    return this.prisma.evaluation.findMany({
      where: { utilisateurId },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  async findByMatiere(matiereId: string) {
    return this.prisma.evaluation.findMany({
      where: { matiereId },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  async findByType(type: TypeEvaluation) {
    return this.prisma.evaluation.findMany({
      where: { type },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  async findByEtudiantAndMatiere(utilisateurId: string, matiereId: string) {
    return this.prisma.evaluation.findMany({
      where: { utilisateurId, matiereId },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true, role: true } },
        matiere: { include: { uniteEnseignement: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RELEVÉ MATIÈRE — GET
  // Retourne tous les étudiants avec leurs notes pour une matière donnée
  // ─────────────────────────────────────────────────────────────────────────
  async getReleveMatiere(matiereId: string) {
    // Récupérer tous les étudiants
    const etudiants = await this.prisma.etudiant.findMany({
      include: {
        utilisateur: { select: { id: true, nom: true } },
      },
      orderBy: { matricule: 'asc' },
    });

    // Récupérer toutes les évaluations existantes pour cette matière
    const evaluations = await this.prisma.evaluation.findMany({
      where: { matiereId },
    });

    // Récupérer la matière
    const matiere = await this.prisma.matiere.findUnique({
      where: { id: matiereId },
      include: { uniteEnseignement: { include: { semestre: true } } },
    });

    // Construire le relevé : un objet par étudiant avec ses notes
    const releve = etudiants.map((etudiant) => {
      const evals = evaluations.filter(
        (e) => e.utilisateurId === etudiant.utilisateurId,
      );
      return {
        utilisateurId: etudiant.utilisateurId,
        nom: etudiant.utilisateur.nom,
        prenom: etudiant.prenom,
        matricule: etudiant.matricule,
        noteCC: evals.find((e) => e.type === 'CC')?.note ?? null,
        noteExamen: evals.find((e) => e.type === 'EXAMEN')?.note ?? null,
        noteRattrapage: evals.find((e) => e.type === 'RATTRAPAGE')?.note ?? null,
        evalIdCC: evals.find((e) => e.type === 'CC')?.id ?? null,
        evalIdExamen: evals.find((e) => e.type === 'EXAMEN')?.id ?? null,
        evalIdRattrapage: evals.find((e) => e.type === 'RATTRAPAGE')?.id ?? null,
      };
    });

    return {
      matiere: {
        id: matiere?.id,
        libelle: matiere?.libelle,
        coefficient: matiere?.coefficient,
        credits: matiere?.credits,
        ue: matiere?.uniteEnseignement?.libelle,
        semestre: matiere?.uniteEnseignement?.semestre?.libelle,
      },
      releve,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RELEVÉ MATIÈRE — SAVE (upsert en masse)
  // Sauvegarde toutes les notes d'une matière en une seule requête
  // ─────────────────────────────────────────────────────────────────────────
  async saveReleveMatiere(matiereId: string, saveReleveDto: SaveReleveDto) {
    const { saisiePar, notes } = saveReleveDto;
    const resultats: any[] = [];
    const erreurs: any[] = [];

    await this.assertMatiereExists(matiereId);

    const utilisateurIds = [...new Set(notes.map((n) => n.utilisateurId))];
    const users = await this.prisma.utilisateur.findMany({
      where: { id: { in: utilisateurIds } },
      select: { id: true, etudiant: { select: { utilisateurId: true } } },
    });
    const sansProfilEtudiant = utilisateurIds.filter((id) => {
      const u = users.find((x) => x.id === id);
      return !u || !u.etudiant;
    });
    if (sansProfilEtudiant.length > 0) {
      throw new BadRequestException(
        `Identifiants invalides ou non étudiants : ${sansProfilEtudiant.join(', ')}`,
      );
    }

    for (const noteEtudiant of notes) {
      const { utilisateurId, noteCC, noteExamen, noteRattrapage } = noteEtudiant;

      // Traiter chaque type de note
      const typesNotes = [
        { type: TypeEvaluation.CC, note: noteCC },
        { type: TypeEvaluation.EXAMEN, note: noteExamen },
        { type: TypeEvaluation.RATTRAPAGE, note: noteRattrapage },
      ];

      for (const { type, note } of typesNotes) {
        if (note === undefined || note === null) continue; // ignorer les champs vides

        try {
          // Validation rattrapage
          if (type === TypeEvaluation.RATTRAPAGE) {
            const evalsInitiales = await this.prisma.evaluation.findMany({
              where: {
                utilisateurId,
                matiereId,
                type: { in: [TypeEvaluation.CC, TypeEvaluation.EXAMEN] },
              },
            });

            let moyenneInitiale = 0;
            evalsInitiales.forEach((ev) => {
              if (ev.note !== null) {
                if (ev.type === TypeEvaluation.CC) moyenneInitiale += ev.note * 0.6;
                else if (ev.type === TypeEvaluation.EXAMEN) moyenneInitiale += ev.note * 0.4;
              }
            });

            if (moyenneInitiale >= 6) {
              erreurs.push({
                utilisateurId,
                type,
                erreur: `Rattrapage non autorisé : moyenne initiale (${moyenneInitiale.toFixed(2)}) ≥ 6/20`,
              });
              continue;
            }
          }

          // Upsert : créer ou mettre à jour
          const evaluation = await this.prisma.evaluation.upsert({
            where: {
              utilisateurId_matiereId_type: { utilisateurId, matiereId, type },
            },
            update: { note, saisiePar },
            create: { utilisateurId, matiereId, type, note, saisiePar },
          });

          resultats.push(evaluation);
        } catch (error) {
          erreurs.push({
            utilisateurId,
            type,
            erreur: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Cascade complète pour cet étudiant après toutes ses notes
      await this.recalculerCascade(utilisateurId, matiereId);
    }

    return {
      sauvegardes: resultats.length,
      erreurs: erreurs.length,
      details: erreurs.length > 0 ? erreurs : undefined,
    };
  }
}
