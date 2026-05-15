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

  private assertMatiereExistsSync(matiere: { id: string } | null, matiereId: string): asserts matiere is { id: string } {
    if (!matiere) {
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

    const [evaluations, absencesRows, matiere] = await Promise.all([
      this.prisma.evaluation.findMany({ where: { matiereId } }),
      this.prisma.absence.findMany({ where: { matiereId } }),
      this.prisma.matiere.findUnique({
        where: { id: matiereId },
        include: { uniteEnseignement: { include: { semestre: true } } },
      }),
    ]);

    const releve = etudiants.map((etudiant) => {
      const evals = evaluations.filter(
        (e) => e.utilisateurId === etudiant.utilisateurId,
      );
      const absence = absencesRows.find(
        (a) => a.utilisateurId === etudiant.utilisateurId,
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
        absences: absence?.heures ?? null,
        absenceId: absence?.id ?? null,
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
  // Précharge les évaluations, traite les étudiants en parallèle (lots), puis
  // recalculs en parallèle bornée — évite N×(findMany + cascade) séquentiels.
  // ─────────────────────────────────────────────────────────────────────────
  async saveReleveMatiere(matiereId: string, saveReleveDto: SaveReleveDto) {
    const { saisiePar, notes } = saveReleveDto;
    const resultats: unknown[] = [];
    const absencesSauvegardees: unknown[] = [];
    const erreurs: Array<{
      utilisateurId: string;
      type?: TypeEvaluation | 'ABSENCE';
      erreur: string;
    }> = [];

    const utilisateurIds = [...new Set(notes.map((n) => n.utilisateurId))];
    const [matiereRow, users] = await Promise.all([
      this.prisma.matiere.findUnique({
        where: { id: matiereId },
        select: { id: true },
      }),
      this.prisma.utilisateur.findMany({
        where: { id: { in: utilisateurIds } },
        select: { id: true, etudiant: { select: { utilisateurId: true } } },
      }),
    ]);
    this.assertMatiereExistsSync(matiereRow, matiereId);
    const sansProfilEtudiant = utilisateurIds.filter((id) => {
      const u = users.find((x) => x.id === id);
      return !u || !u.etudiant;
    });
    if (sansProfilEtudiant.length > 0) {
      throw new BadRequestException(
        `Identifiants invalides ou non étudiants : ${sansProfilEtudiant.join(', ')}`,
      );
    }

    const existingEvals = await this.prisma.evaluation.findMany({
      where: { matiereId, utilisateurId: { in: utilisateurIds } },
      select: { utilisateurId: true, type: true, note: true },
    });
    const noteState = new Map<string, number | null>();
    for (const e of existingEvals) {
      noteState.set(`${e.utilisateurId}:${e.type}`, e.note);
    }

    const touched = new Set<string>();
    /** Étudiants en parallèle ; par étudiant CC et EXAMEN en parallèle puis RATTRAPAGE. */
    const STUDENT_CONCURRENCY = 16;
    const RECALC_CONCURRENCY = 8;

    const upsertAbsence = async (utilisateurId: string, heures: number): Promise<void> => {
      const row = await this.prisma.absence.upsert({
        where: {
          utilisateurId_matiereId: { utilisateurId, matiereId },
        },
        update: { heures },
        create: { utilisateurId, matiereId, heures },
      });
      absencesSauvegardees.push(row);
    };

    const upsertOne = async (
      utilisateurId: string,
      type: TypeEvaluation,
      note: number,
    ): Promise<void> => {
      const evaluation = await this.prisma.evaluation.upsert({
        where: {
          utilisateurId_matiereId_type: { utilisateurId, matiereId, type },
        },
        update: { note, saisiePar },
        create: { utilisateurId, matiereId, type, note, saisiePar },
      });
      noteState.set(`${utilisateurId}:${type}`, note);
      resultats.push(evaluation);
      touched.add(utilisateurId);
    };

    const processStudent = async (noteEtudiant: (typeof notes)[number]) => {
      const { utilisateurId, noteCC, noteExamen, noteRattrapage } = noteEtudiant;
      const heuresAbsence =
        noteEtudiant.absences ?? noteEtudiant.heuresAbsence;

      const getEffective = (t: TypeEvaluation): number | null => {
        if (t === TypeEvaluation.CC && noteCC !== undefined && noteCC !== null) return noteCC;
        if (t === TypeEvaluation.EXAMEN && noteExamen !== undefined && noteExamen !== null) {
          return noteExamen;
        }
        return noteState.get(`${utilisateurId}:${t}`) ?? null;
      };

      const early: Array<Promise<void>> = [];
      if (noteCC !== undefined && noteCC !== null) {
        early.push(
          upsertOne(utilisateurId, TypeEvaluation.CC, noteCC).catch((error) => {
            erreurs.push({
              utilisateurId,
              type: TypeEvaluation.CC,
              erreur: error instanceof Error ? error.message : String(error),
            });
          }),
        );
      }
      if (noteExamen !== undefined && noteExamen !== null) {
        early.push(
          upsertOne(utilisateurId, TypeEvaluation.EXAMEN, noteExamen).catch((error) => {
            erreurs.push({
              utilisateurId,
              type: TypeEvaluation.EXAMEN,
              erreur: error instanceof Error ? error.message : String(error),
            });
          }),
        );
      }
      await Promise.all(early);

      if (noteRattrapage === undefined || noteRattrapage === null) return;

      const ncc = getEffective(TypeEvaluation.CC);
      const nex = getEffective(TypeEvaluation.EXAMEN);
      let moyenneInitiale = 0;
      if (ncc !== null) moyenneInitiale += ncc * 0.6;
      if (nex !== null) moyenneInitiale += nex * 0.4;

      if (moyenneInitiale >= 6) {
        erreurs.push({
          utilisateurId,
          type: TypeEvaluation.RATTRAPAGE,
          erreur: `Rattrapage non autorisé : moyenne initiale (${moyenneInitiale.toFixed(2)}) ≥ 6/20`,
        });
        return;
      }

      try {
        await upsertOne(utilisateurId, TypeEvaluation.RATTRAPAGE, noteRattrapage);
      } catch (error) {
        erreurs.push({
          utilisateurId,
          type: TypeEvaluation.RATTRAPAGE,
          erreur: error instanceof Error ? error.message : String(error),
        });
      }

      if (heuresAbsence !== undefined && heuresAbsence !== null) {
        if (heuresAbsence < 0) {
          erreurs.push({
            utilisateurId,
            type: 'ABSENCE',
            erreur: "Les heures d'absence ne peuvent pas être négatives",
          });
        } else {
          try {
            await upsertAbsence(utilisateurId, heuresAbsence);
          } catch (error) {
            erreurs.push({
              utilisateurId,
              type: 'ABSENCE',
              erreur: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    };

    for (let i = 0; i < notes.length; i += STUDENT_CONCURRENCY) {
      const chunk = notes.slice(i, i + STUDENT_CONCURRENCY);
      await Promise.all(chunk.map((row) => processStudent(row)));
    }

    const idsToRecalc = [...touched];
    for (let i = 0; i < idsToRecalc.length; i += RECALC_CONCURRENCY) {
      const chunk = idsToRecalc.slice(i, i + RECALC_CONCURRENCY);
      await Promise.all(chunk.map((uid) => this.recalculerCascade(uid, matiereId)));
    }

    return {
      sauvegardes: resultats.length,
      absencesSauvegardees: absencesSauvegardees.length,
      erreurs: erreurs.length,
      details: erreurs.length > 0 ? erreurs : undefined,
    };
  }
}
