import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';

@Injectable()
export class MatieresService {
  constructor(private prisma: PrismaService) {}

  private async validerLimiteCreditsSemestre(uniteEnseignementId: string, nouveauxCredits: number, matiereIdExclue?: string) {
    const ue = await this.prisma.uniteEnseignement.findUnique({
      where: { id: uniteEnseignementId },
      select: { semestreId: true },
    });
    if (!ue || !ue.semestreId) return;

    // Récupérer toutes les UEs du même semestre avec leurs matières
    const uesDuSemestre = await this.prisma.uniteEnseignement.findMany({
      where: { semestreId: ue.semestreId },
      include: { matieres: true },
    });

    let creditTotalActuel = 0;
    for (const u of uesDuSemestre) {
      for (const m of u.matieres) {
        if (matiereIdExclue && m.id === matiereIdExclue) continue;
        creditTotalActuel += m.credits || 0;
      }
    }

    if (creditTotalActuel + nouveauxCredits > 30) {
      throw new BadRequestException(
        `Crédit du semestre > 30 (Total actuel: ${creditTotalActuel}, Ajout: ${nouveauxCredits}, Résultat: ${creditTotalActuel + nouveauxCredits}). L'opération échoue car le semestre ne peut pas dépasser 30 crédits.`,
      );
    }
  }

  async create(createMatiereDto: CreateMatiereDto) {
    if (createMatiereDto.uniteEnseignementId) {
      await this.validerLimiteCreditsSemestre(
        createMatiereDto.uniteEnseignementId,
        createMatiereDto.credits || 0,
      );
    }

    return this.prisma.matiere.create({
      data: createMatiereDto,
      include: {
        uniteEnseignement: true,
      },
    });
  }

  async findAll() {
    return this.prisma.matiere.findMany({
      include: {
        uniteEnseignement: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.matiere.findUnique({
      where: { id },
      include: {
        uniteEnseignement: true,
      },
    });
  }

  async update(id: string, updateMatiereDto: Partial<CreateMatiereDto>) {
    const matiereExistante = await this.findOne(id);
    const ueId = updateMatiereDto.uniteEnseignementId || matiereExistante?.uniteEnseignementId;
    const credits = updateMatiereDto.credits !== undefined ? updateMatiereDto.credits : matiereExistante?.credits || 0;

    if (ueId) {
      await this.validerLimiteCreditsSemestre(ueId, credits, id);
    }

    return this.prisma.matiere.update({
      where: { id },
      data: updateMatiereDto,
      include: {
        uniteEnseignement: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.matiere.delete({
      where: { id },
    });
  }

  async findByUE(uniteEnseignementId: string) {
    return this.prisma.matiere.findMany({
      where: { uniteEnseignementId },
      include: {
        uniteEnseignement: true,
      },
    });
  }
}
