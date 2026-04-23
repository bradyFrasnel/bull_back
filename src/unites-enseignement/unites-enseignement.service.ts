import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUEDto } from './dto/create-ue.dto';

@Injectable()
export class UnitesEnseignementService {
  constructor(private prisma: PrismaService) {}

  async create(createUEDto: CreateUEDto) {
    return this.prisma.uniteEnseignement.create({
      data: createUEDto,
      include: {
        semestre: true,
      },
    });
  }

  async findAll() {
    return this.prisma.uniteEnseignement.findMany({
      include: {
        semestre: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.uniteEnseignement.findUnique({
      where: { id },
      include: {
        semestre: true,
        matieres: true,
      },
    });
  }

  async update(id: string, updateUEDto: Partial<CreateUEDto>) {
    return this.prisma.uniteEnseignement.update({
      where: { id },
      data: updateUEDto,
      include: {
        semestre: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.uniteEnseignement.delete({
      where: { id },
    });
  }

  async findBySemestre(semestreId: string) {
    return this.prisma.uniteEnseignement.findMany({
      where: { semestreId },
      include: {
        semestre: true,
        matieres: true,
      },
    });
  }
}
