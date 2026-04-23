import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto, TypeEvaluation } from './dto/create-evaluation.dto';
import { CalculsService } from '../calculs/calculs.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private calculsService: CalculsService,
  ) {}

  async create(createEvaluationDto: CreateEvaluationDto) {
    // Validation spécifique pour le rattrapage
    if (createEvaluationDto.type === TypeEvaluation.RATTRAPAGE) {
      // Calculer la moyenne initiale (CC + Examen)
      const evaluationsInitiales = await this.prisma.evaluation.findMany({
        where: {
          utilisateurId: createEvaluationDto.utilisateurId,
          matiereId: createEvaluationDto.matiereId,
          type: {
            in: [TypeEvaluation.CC, TypeEvaluation.EXAMEN]
          }
        }
      });

      if (evaluationsInitiales.length < 2) {
        throw new BadRequestException(
          'Rattrapage non autorisé : CC ou Examen manquant'
        );
      }

      // Calculer la moyenne initiale
      let moyenneInitiale = 0;
      let nbNotes = 0;
      
      evaluationsInitiales.forEach(evaluation => {
        if (evaluation.note !== null && evaluation.note !== undefined) {
          if (evaluation.type === TypeEvaluation.CC) {
            moyenneInitiale += evaluation.note * 0.6;
            nbNotes++;
          } else if (evaluation.type === TypeEvaluation.EXAMEN) {
            moyenneInitiale += evaluation.note * 0.4;
            nbNotes++;
          }
        }
      });

      if (nbNotes === 2) {
        moyenneInitiale = moyenneInitiale;
      }

      // Vérifier la règle : moyenne < 6 pour accès rattrapage
      if (moyenneInitiale >= 6) {
        throw new BadRequestException(
          `Rattrapage non autorisé : moyenne initiale (${moyenneInitiale.toFixed(2)}) ≥ 6/20`
        );
      }
    }

    // Créer l'évaluation
    const evaluation = await this.prisma.evaluation.create({
      data: createEvaluationDto,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });

    // Déclencher le recalcul automatique des moyennes
    try {
      await this.calculsService.calculerMoyenneMatiere(
        createEvaluationDto.utilisateurId,
        createEvaluationDto.matiereId
      );
    } catch (error) {
      // Ne pas échouer la création si le calcul échoue
      console.warn('Erreur lors du recalcul automatique:', error instanceof Error ? error.message : String(error));
    }

    return evaluation;
  }

  async findAll() {
    return this.prisma.evaluation.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEvaluationDto: Partial<CreateEvaluationDto>) {
    return this.prisma.evaluation.update({
      where: { id },
      data: updateEvaluationDto,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.evaluation.delete({
      where: { id },
    });
  }

  async findByEtudiant(utilisateurId: string) {
    return this.prisma.evaluation.findMany({
      where: { utilisateurId },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async findByMatiere(matiereId: string) {
    return this.prisma.evaluation.findMany({
      where: { matiereId },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async findByType(type: TypeEvaluation) {
    return this.prisma.evaluation.findMany({
      where: { type },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }

  async findByEtudiantAndMatiere(utilisateurId: string, matiereId: string) {
    return this.prisma.evaluation.findMany({
      where: {
        utilisateurId,
        matiereId,
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
        matiere: {
          include: {
            uniteEnseignement: true,
          },
        },
      },
    });
  }
}
