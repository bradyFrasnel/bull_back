import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';

@Injectable()
export class MatieresService {
  constructor(private prisma: PrismaService) {}

  async create(createMatiereDto: CreateMatiereDto) {
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
