import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSemestreDto } from './dto/create-semestre.dto';

@Injectable()
export class SemestresService {
  constructor(private prisma: PrismaService) {}

  async create(createSemestreDto: CreateSemestreDto) {
    return this.prisma.semestre.create({
      data: createSemestreDto,
    });
  }

  async findAll() {
    return this.prisma.semestre.findMany({
      include: {
        ues: {
          include: {
            matieres: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.semestre.findUnique({
      where: { id },
      include: {
        ues: {
          include: {
            matieres: true,
          },
        },
      },
    });
  }

  async update(id: string, updateSemestreDto: Partial<CreateSemestreDto>) {
    return this.prisma.semestre.update({
      where: { id },
      data: updateSemestreDto,
    });
  }

  async remove(id: string) {
    return this.prisma.semestre.delete({
      where: { id },
    });
  }

  async findByAnnee(anneeUniversitaire: string) {
    return this.prisma.semestre.findMany({
      where: { anneeUniversitaire },
      include: {
        ues: {
          include: {
            matieres: true,
          },
        },
      },
    });
  }
}
