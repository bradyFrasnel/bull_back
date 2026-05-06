import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculsService } from '../calculs/calculs.service';

@Injectable()
export class BulletinsService {
  constructor(
    private prisma: PrismaService,
    private calculsService: CalculsService,
  ) {}

  // ─────────────────────────────────────────────
  // BULLETIN SEMESTRE
  // ─────────────────────────────────────────────
  async getBulletinSemestre(etudiantId: string, semestreId: string) {
    // Vérifier que l'étudiant existe
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { utilisateurId: etudiantId },
      include: {
        utilisateur: {
          select: { id: true, nom: true, email: true },
        },
      },
    });
    if (!etudiant) throw new NotFoundException('Étudiant non trouvé');

    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
    });
    if (!semestre) throw new NotFoundException('Semestre non trouvé');

    // Récupérer les UE du semestre avec leurs matières
    const ues = await this.prisma.uniteEnseignement.findMany({
      where: { semestreId },
      include: {
        matieres: {
          include: {
            moyenneMatieres: { where: { utilisateurId: etudiantId } },
            evaluations: { where: { utilisateurId: etudiantId } },
            absences: { where: { utilisateurId: etudiantId } },
          },
        },
        moyenneUEs: { where: { utilisateurId: etudiantId } },
      },
      orderBy: { code: 'asc' },
    });

    // Récupérer le résultat semestre
    const resultatSemestre = await this.prisma.resultatSemestre.findUnique({
      where: {
        utilisateurId_semestreId: { utilisateurId: etudiantId, semestreId },
      },
    });

    // Calculer les statistiques de promotion pour ce semestre
    const statistiques = await this.calculerStatistiquesPromotion(semestreId);

    // Construire la réponse structurée
    const uesFormatees = ues.map((ue) => {
      const moyenneUE = ue.moyenneUEs[0] ?? null;
      const creditsUE = ue.matieres.reduce((sum, m) => sum + m.credits, 0);

      const matieresFormatees = ue.matieres.map((matiere) => {
        const moyenneMatiere = matiere.moyenneMatieres[0] ?? null;
        const noteCC = matiere.evaluations.find((e) => e.type === 'CC')?.note ?? null;
        const noteExamen = matiere.evaluations.find((e) => e.type === 'EXAMEN')?.note ?? null;
        const noteRattrapage = matiere.evaluations.find((e) => e.type === 'RATTRAPAGE')?.note ?? null;
        const absences = matiere.absences[0]?.heures ?? 0;

        return {
          id: matiere.id,
          libelle: matiere.libelle,
          coefficient: matiere.coefficient,
          credits: matiere.credits,
          noteCC,
          noteExamen,
          noteRattrapage,
          moyenne: moyenneMatiere?.moyenne ?? null,
          rattrapageUtilise: moyenneMatiere?.rattrapageUtilise ?? false,
          absences,
        };
      });

      return {
        id: ue.id,
        code: ue.code,
        libelle: ue.libelle,
        creditsTotal: creditsUE,
        moyenne: moyenneUE?.moyenne ?? null,
        creditsAcquis: moyenneUE?.creditsAcquis ?? 0,
        acquise: moyenneUE ? moyenneUE.moyenne >= 10 : false,
        compensee: moyenneUE?.compense ?? false,
        matieres: matieresFormatees,
      };
    });

    return {
      etudiant: {
        id: etudiant.utilisateurId,
        nom: etudiant.utilisateur.nom,
        prenom: etudiant.prenom,
        matricule: etudiant.matricule,
        dateNaissance: etudiant.date_naissance,
        lieuNaissance: etudiant.lieu_naissance,
        email: etudiant.utilisateur.email,
      },
      semestre: {
        id: semestre.id,
        code: semestre.code,
        libelle: semestre.libelle,
        anneeUniversitaire: semestre.anneeUniversitaire,
      },
      ues: uesFormatees,
      resultat: resultatSemestre
        ? {
            moyenneSemestre: resultatSemestre.moyenneSemestre,
            creditsTotal: resultatSemestre.creditsTotal,
            valide: resultatSemestre.valide,
          }
        : null,
      statistiques,
    };
  }

  // ─────────────────────────────────────────────
  // BULLETIN ANNUEL
  // ─────────────────────────────────────────────
  async getBulletinAnnuel(etudiantId: string) {
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { utilisateurId: etudiantId },
      include: {
        utilisateur: { select: { id: true, nom: true, email: true } },
      },
    });
    if (!etudiant) throw new NotFoundException('Étudiant non trouvé');

    // Récupérer tous les semestres avec leurs résultats pour cet étudiant
    const resultats = await this.prisma.resultatSemestre.findMany({
      where: { utilisateurId: etudiantId },
      include: { semestre: true },
      orderBy: { semestre: { code: 'asc' } },
    });

    // Récupérer le résultat annuel
    const resultatAnnuel = await this.prisma.resultatAnnuel.findUnique({
      where: { utilisateurId: etudiantId },
    });

    // Construire les données de chaque semestre
    const semestresData = await Promise.all(
      resultats.map(async (r) => {
        const bulletinSemestre = await this.getBulletinSemestre(
          etudiantId,
          r.semestreId,
        );
        return {
          semestre: bulletinSemestre.semestre,
          ues: bulletinSemestre.ues,
          resultat: bulletinSemestre.resultat,
          statistiques: bulletinSemestre.statistiques,
        };
      }),
    );

    // Calculer la moyenne annuelle si pas encore en DB
    let moyenneAnnuelle: number | null = resultatAnnuel?.moyenneAnnuelle ?? null;
    if (!moyenneAnnuelle && resultats.length === 2) {
      moyenneAnnuelle =
        (resultats[0].moyenneSemestre + resultats[1].moyenneSemestre) / 2;
    }

    // Déterminer la mention
    const mention = moyenneAnnuelle
      ? this.calculerMention(moyenneAnnuelle)
      : null;

    // Déterminer la décision jury
    const decisionJury = resultatAnnuel?.decisionJury ?? null;

    return {
      etudiant: {
        id: etudiant.utilisateurId,
        nom: etudiant.utilisateur.nom,
        prenom: etudiant.prenom,
        matricule: etudiant.matricule,
        dateNaissance: etudiant.date_naissance,
        lieuNaissance: etudiant.lieu_naissance,
        email: etudiant.utilisateur.email,
      },
      semestres: semestresData,
      resultatAnnuel: {
        moyenneAnnuelle,
        mention,
        decisionJury,
        creditsTotal: resultats.reduce((sum, r) => sum + r.creditsTotal, 0),
        annee: resultatAnnuel?.annee ?? null,
      },
    };
  }

  // ─────────────────────────────────────────────
  // RÉCAPITULATIF PROMOTION
  // ─────────────────────────────────────────────
  async getRecapPromotion(semestreId: string) {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
    });
    if (!semestre) throw new NotFoundException('Semestre non trouvé');

    // Récupérer tous les résultats du semestre
    const resultats = await this.prisma.resultatSemestre.findMany({
      where: { semestreId },
      include: {
        utilisateur: {
          include: {
            etudiant: true,
          },
        },
      },
      orderBy: { moyenneSemestre: 'desc' },
    });

    const statistiques = await this.calculerStatistiquesPromotion(semestreId);

    const etudiants = resultats.map((r, index) => ({
      rang: index + 1,
      etudiantId: r.utilisateurId,
      nom: r.utilisateur.nom,
      prenom: r.utilisateur.etudiant?.prenom ?? '',
      matricule: r.utilisateur.etudiant?.matricule ?? '',
      moyenneSemestre: r.moyenneSemestre,
      creditsTotal: r.creditsTotal,
      valide: r.valide,
      mention: this.calculerMention(r.moyenneSemestre),
    }));

    return {
      semestre: {
        id: semestre.id,
        code: semestre.code,
        libelle: semestre.libelle,
        anneeUniversitaire: semestre.anneeUniversitaire,
      },
      statistiques,
      nbEtudiants: etudiants.length,
      nbValides: etudiants.filter((e) => e.valide).length,
      tauxReussite:
        etudiants.length > 0
          ? Math.round(
              (etudiants.filter((e) => e.valide).length / etudiants.length) *
                100,
            )
          : 0,
      etudiants,
    };
  }

  // ─────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────
  private async calculerStatistiquesPromotion(semestreId: string) {
    const resultats = await this.prisma.resultatSemestre.findMany({
      where: { semestreId },
      select: { moyenneSemestre: true },
    });

    if (resultats.length === 0) {
      return { moyenneClasse: null, noteMin: null, noteMax: null, ecartType: null, nbEtudiants: 0 };
    }

    const moyennes = resultats.map((r) => r.moyenneSemestre);
    const moyenneClasse = moyennes.reduce((a, b) => a + b, 0) / moyennes.length;
    const noteMin = Math.min(...moyennes);
    const noteMax = Math.max(...moyennes);
    const variance =
      moyennes.reduce((sum, m) => sum + Math.pow(m - moyenneClasse, 2), 0) /
      moyennes.length;
    const ecartType = Math.sqrt(variance);

    return {
      moyenneClasse: Math.round(moyenneClasse * 100) / 100,
      noteMin: Math.round(noteMin * 100) / 100,
      noteMax: Math.round(noteMax * 100) / 100,
      ecartType: Math.round(ecartType * 100) / 100,
      nbEtudiants: moyennes.length,
    };
  }

  private calculerMention(moyenne: number): string | null {
    if (moyenne >= 16) return 'TRES_BIEN';
    if (moyenne >= 14) return 'BIEN';
    if (moyenne >= 12) return 'ASSEZ_BIEN';
    if (moyenne >= 10) return 'PASSABLE';
    return null;
  }
}
