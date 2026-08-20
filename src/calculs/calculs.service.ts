import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TypeEvaluation } from '../evaluations/dto/create-evaluation.dto';

@Injectable()
export class CalculsService {
  constructor(private prisma: PrismaService) {}

  async calculerMoyenneMatiere(utilisateurId: string, matiereId: string): Promise<{
    moyenne: number;
    notesUtilisees: number[];
    noteIgnored: number | null;
    rattrapageUtilise: boolean;
  }> {
    // Récupérer toutes les évaluations de l'étudiant pour cette matière
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        utilisateurId,
        matiereId,
      },
      orderBy: {
        dateSaisie: 'asc',
      },
    });

    // Extraire les notes par type
    const notes: { [key in TypeEvaluation]?: number } = {};
    
    evaluations.forEach(evaluation => {
      if (evaluation.note !== null && evaluation.note !== undefined) {
        notes[evaluation.type] = evaluation.note;
      }
    });

    // Calculer la moyenne initiale (CC + Examen)
    let moyenneInitiale = 0;
    let nbNotesInitiales = 0;
    
    if (notes.CC !== undefined) {
      moyenneInitiale += notes.CC * 0.6;
      nbNotesInitiales++;
    }
    if (notes.EXAMEN !== undefined) {
      moyenneInitiale += notes.EXAMEN * 0.4;
      nbNotesInitiales++;
    }
    
    if (nbNotesInitiales > 0) {
      moyenneInitiale = nbNotesInitiales === 1 ? moyenneInitiale : moyenneInitiale;
    }

    // Vérifier l'accès au rattrapage (règle : moyenne < 6)
    const accesRattrapage = moyenneInitiale < 6;

    // Si rattrapage existe mais pas autorisé
    if (notes.RATTRAPAGE !== undefined && !accesRattrapage) {
      throw new BadRequestException(
        `Rattrapage non autorisé : moyenne initiale (${moyenneInitiale.toFixed(2)}) ≥ 6/20`
      );
    }

    // Appliquer la règle des 2 meilleures notes
    const toutesLesNotes = [];
    if (notes.CC !== undefined) toutesLesNotes.push(notes.CC);
    if (notes.EXAMEN !== undefined) toutesLesNotes.push(notes.EXAMEN);
    if (notes.RATTRAPAGE !== undefined && accesRattrapage) toutesLesNotes.push(notes.RATTRAPAGE);

    // Trier par ordre décroissant et prendre les 2 meilleures
    toutesLesNotes.sort((a, b) => b - a);
    const deuxMeilleures = toutesLesNotes.slice(0, 2);
    const noteIgnored = toutesLesNotes.length > 2 ? toutesLesNotes[2] : null;

    // Calculer la moyenne finale (50% chacune des 2 meilleures notes)
    const moyenneFinale = deuxMeilleures.length === 2 
      ? (deuxMeilleures[0] + deuxMeilleures[1]) / 2 
      : deuxMeilleures[0] || 0;

    // Mettre à jour la table MoyenneMatiere
    await this.prisma.moyenneMatiere.upsert({
      where: {
        utilisateurId_matiereId: {
          utilisateurId,
          matiereId,
        },
      },
      update: {
        moyenne: moyenneFinale,
        rattrapageUtilise: notes.RATTRAPAGE !== undefined && accesRattrapage && notes.RATTRAPAGE > moyenneInitiale,
      },
      create: {
        utilisateurId,
        matiereId,
        moyenne: moyenneFinale,
        rattrapageUtilise: notes.RATTRAPAGE !== undefined && accesRattrapage && notes.RATTRAPAGE > moyenneInitiale,
      },
    });

    return {
      moyenne: moyenneFinale,
      notesUtilisees: deuxMeilleures,
      noteIgnored,
      rattrapageUtilise: notes.RATTRAPAGE !== undefined && accesRattrapage && notes.RATTRAPAGE > moyenneInitiale,
    };
  }

  async calculerMoyenneUE(utilisateurId: string, uniteEnseignementId: string): Promise<{
    moyenne: number;
    creditsAcquis: number;
    compense: boolean;
  }> {
    // Récupérer toutes les matières de l'UE avec leurs moyennes
    const matieres = await this.prisma.matiere.findMany({
      where: {
        uniteEnseignementId,
      },
      include: {
        moyenneMatieres: {
          where: {
            utilisateurId,
          },
        },
      },
    });

    if (matieres.length === 0) {
      throw new BadRequestException('Aucune matière trouvée pour cette UE');
    }

    // Calculer la moyenne pondérée de l'UE
    let sommePonderee = 0;
    let sommeCoefficients = 0;
    let creditsAcquis = 0;

    for (const matiere of matieres) {
      const moyenneMatiere = matiere.moyenneMatieres[0];
      if (moyenneMatiere) {
        sommePonderee += moyenneMatiere.moyenne * matiere.coefficient;
        sommeCoefficients += matiere.coefficient;
        
        // Si la moyenne matière ≥ 10, les crédits sont acquis
        if (moyenneMatiere.moyenne >= 10) {
          creditsAcquis += matiere.credits;
        }
      }
    }

    const moyenneUE = sommeCoefficients > 0 ? sommePonderee / sommeCoefficients : 0;
    const compense = moyenneUE >= 10; // Compensation si moyenne UE ≥ 10

    // Mettre à jour la table MoyenneUE
    await this.prisma.moyenneUE.upsert({
      where: {
        utilisateurId_uniteEnseignementId: {
          utilisateurId,
          uniteEnseignementId,
        },
      },
      update: {
        moyenne: moyenneUE,
        creditsAcquis,
        compense,
      },
      create: {
        utilisateurId,
        uniteEnseignementId,
        moyenne: moyenneUE,
        creditsAcquis,
        compense,
      },
    });

    return {
      moyenne: moyenneUE,
      creditsAcquis,
      compense,
    };
  }

  async calculerResultatSemestre(utilisateurId: string, semestreId: string): Promise<{
    moyenneSemestre: number;
    creditsTotal: number;
    creditsAcquis: number;
    valide: boolean;
  }> {
    // Récupérer toutes les UE du semestre avec leurs moyennes
    const ues = await this.prisma.uniteEnseignement.findMany({
      where: {
        semestreId,
      },
      include: {
        moyenneUEs: {
          where: {
            utilisateurId,
          },
        },
      },
    });

    if (ues.length === 0) {
      throw new BadRequestException('Aucune UE trouvée pour ce semestre');
    }

    // 1. Calculer la moyenne pondérée du semestre
    let sommePonderee = 0;
    let sommeCoefficients = 0;
    let semestreCreditsTotal = 0;

    for (const ue of ues) {
      const moyenneUE = ue.moyenneUEs[0];
      const coef = ue.coefficient ?? ue.credits ?? 1;
      const credits = ue.credits ?? 0;
      semestreCreditsTotal += credits;

      if (moyenneUE) {
        sommePonderee += moyenneUE.moyenne * coef;
        sommeCoefficients += coef;
      }
    }

    const moyenneSemestre = sommeCoefficients > 0 ? sommePonderee / sommeCoefficients : 0;
    const valide = moyenneSemestre >= 10; // Semestre valide si moyenne ≥ 10

    // 2. Mettre à jour la compensation pour chaque UE et calculer les crédits acquis
    let totalCreditsAcquis = 0;
    for (const ue of ues) {
      const moyenneUE = ue.moyenneUEs[0];
      if (moyenneUE) {
        const creditsUE = ue.credits ?? 0;
        const acquiseDirecte = moyenneUE.moyenne >= 10;
        const compense = !acquiseDirecte && valide;
        const acquise = acquiseDirecte || compense;
        const creditsAcquis = acquise ? creditsUE : 0;
        totalCreditsAcquis += creditsAcquis;

        await this.prisma.moyenneUE.update({
          where: { id: moyenneUE.id },
          data: {
            creditsAcquis,
            compense,
          },
        });
      }
    }

    // 3. Mettre à jour la table ResultatSemestre
    await this.prisma.resultatSemestre.upsert({
      where: {
        utilisateurId_semestreId: {
          utilisateurId,
          semestreId,
        },
      },
      update: {
        moyenneSemestre,
        creditsTotal: semestreCreditsTotal,
        creditsAcquis: totalCreditsAcquis,
        valide,
      },
      create: {
        utilisateurId,
        semestreId,
        moyenneSemestre,
        creditsTotal: semestreCreditsTotal,
        creditsAcquis: totalCreditsAcquis,
        valide,
      },
    });

    return {
      moyenneSemestre,
      creditsTotal: semestreCreditsTotal,
      creditsAcquis: totalCreditsAcquis,
      valide,
    };
  }

  async recalculerToutPourEtudiant(utilisateurId: string): Promise<void> {
    // Récupérer toutes les évaluations de l'étudiant
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        utilisateurId,
      },
      distinct: ['matiereId'],
      select: {
        matiereId: true,
      },
    });

    // Recalculer pour chaque matière
    for (const evaluation of evaluations) {
      await this.calculerMoyenneMatiere(utilisateurId, evaluation.matiereId);
    }

    // Récupérer toutes les UE concernées
    const matieres = await this.prisma.matiere.findMany({
      where: {
        id: {
          in: evaluations.map(evaluation => evaluation.matiereId),
        },
      },
      distinct: ['uniteEnseignementId'],
      select: {
        uniteEnseignementId: true,
      },
    });

    // Recalculer pour chaque UE
    for (const matiere of matieres) {
      await this.calculerMoyenneUE(utilisateurId, matiere.uniteEnseignementId);
    }

    // Récupérer tous les semestres concernés
    const ues = await this.prisma.uniteEnseignement.findMany({
      where: {
        id: {
          in: matieres.map(m => m.uniteEnseignementId),
        },
      },
      distinct: ['semestreId'],
      select: {
        semestreId: true,
      },
    });

    // Recalculer pour chaque semestre
    for (const ue of ues) {
      await this.calculerResultatSemestre(utilisateurId, ue.semestreId);
    }

    // Recalculer le résultat annuel
    await this.calculerResultatAnnuel(utilisateurId);
  }

  async calculerResultatAnnuel(utilisateurId: string): Promise<void> {
    // Récupérer les résultats des semestres
    const resultatsSemestres = await this.prisma.resultatSemestre.findMany({
      where: { utilisateurId },
      include: { semestre: true },
    });

    if (resultatsSemestres.length === 2) {
      const rS5 = resultatsSemestres.find(r => r.semestre.code.includes('S5'));
      const rS6 = resultatsSemestres.find(r => r.semestre.code.includes('S6'));

      if (rS5 && rS6) {
        const moyenneAnnuelle = (rS5.moyenneSemestre + rS6.moyenneSemestre) / 2;
        const totalCreditsAcquis = rS5.creditsAcquis + rS6.creditsAcquis;
        const annee = rS5.semestre.anneeUniversitaire;

        // Mention
        let mention: any = null;
        if (moyenneAnnuelle >= 16) mention = 'TRES_BIEN';
        else if (moyenneAnnuelle >= 14) mention = 'BIEN';
        else if (moyenneAnnuelle >= 12) mention = 'ASSEZ_BIEN';
        else if (moyenneAnnuelle >= 10) mention = 'PASSABLE';

        // Décision du Jury
        let decisionJury: any = 'REDOUBLE';
        if (rS5.valide && rS6.valide) {
          decisionJury = 'DIPLOME';
        } else if (rS5.valide && !rS6.valide) {
          // Reprise de soutenance : S5 validé (30 crédits) + UE6-1 validé (22 crédits) et UE6-2 non validé.
          // Ce qui donne 52 crédits.
          if (totalCreditsAcquis === 52) {
            decisionJury = 'REPRISE_SOUTENANCE';
          }
        }

        // Upsert ResultatAnnuel
        await this.prisma.resultatAnnuel.upsert({
          where: { utilisateurId },
          update: {
            moyenneAnnuelle,
            annee,
            decisionJury,
            mention,
          },
          create: {
            utilisateurId,
            moyenneAnnuelle,
            annee,
            decisionJury,
            mention,
          },
        });
      }
    }
  }

  async recalculerToutPourClasse(classeId: string) {
    const etudiants = await this.prisma.etudiant.findMany({
      where: { classeId },
      select: { utilisateurId: true },
    });

    for (const etudiant of etudiants) {
      await this.recalculerToutPourEtudiant(etudiant.utilisateurId);
    }
    
    return { 
      message: `Toutes les moyennes ont été recalculées pour les ${etudiants.length} étudiants de la classe`,
      count: etudiants.length 
    };
  }
}
