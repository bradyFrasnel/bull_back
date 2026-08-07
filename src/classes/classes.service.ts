import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClasseDto } from './dto/create-classe.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) { }

  // Créer une nouvelle classe
  async create(createClasseDto: CreateClasseDto) {
    // Vérifier que le code n'est pas déjà utilisé
    const existing = await this.prisma.classe.findUnique({
      where: { code: createClasseDto.code },
    });
    if (existing) {
      throw new ConflictException(`Une classe avec le code "${createClasseDto.code}" existe déjà`);
    }

    return this.prisma.classe.create({
      data: createClasseDto,
      include: {
        _count: { select: { etudiants: true, semestres: true } },
      },
    });
  }

  // Récupérer toutes les classes
  async findAll() {
    return this.prisma.classe.findMany({
      include: {
        _count: { select: { etudiants: true, semestres: true } },
        filiere: true,
        // Semestres liés via la table de liaison
        semestres: {
          include: {
            semestre: { select: { id: true, code: true, libelle: true, anneeUniversitaire: true } },
          },
        },
      },
      orderBy: [{ anneeUniversitaire: 'desc' }, { nom: 'asc' }],
    });
  }

  // Récupérer une classe par ID
  async findOne(id: string) {
    const classe = await this.prisma.classe.findUnique({
      where: { id },
      include: {
        _count: { select: { etudiants: true, semestres: true } },
        filiere: true,
        semestres: {
          include: {
            semestre: {
              include: {
                ues: {
                  include: {
                    matieres: true,
                  },
                },
              },
            },
          },
        },
        etudiants: {
          include: {
            utilisateur: { select: { nom: true, email: true } },
          },
        },
      },
    });
    if (!classe) throw new NotFoundException(`Classe "${id}" non trouvée`);
    return classe;
  }

  // Mettre à jour une classe
  async update(id: string, updateDto: Partial<CreateClasseDto>) {
    await this.findOne(id); // Vérifie l'existence

    if (updateDto.code) {
      const conflict = await this.prisma.classe.findFirst({
        where: { code: updateDto.code, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Le code "${updateDto.code}" est déjà utilisé`);
    }

    return this.prisma.classe.update({
      where: { id },
      data: updateDto,
      include: {
        _count: { select: { etudiants: true, semestres: true } },
      },
    });
  }

  // Supprimer une classe
  async remove(id: string) {
    await this.findOne(id);
    // La cascade Prisma détache les étudiants (classeId → SetNull) et supprime les SemestreClasse
    return this.prisma.classe.delete({ where: { id } });
  }

  // Assigner un semestre à une classe
  async assignSemestre(classeId: string, semestreId: string) {
    await this.findOne(classeId);
    return this.prisma.semestreClasse.upsert({
      where: { semestreId_classeId: { semestreId, classeId } },
      create: { semestreId, classeId },
      update: {},
    });
  }

  // Retirer un semestre d'une classe
  async removeSemestre(classeId: string, semestreId: string) {
    return this.prisma.semestreClasse.delete({
      where: { semestreId_classeId: { semestreId, classeId } },
    });
  }

  // Récupérer les étudiants d'une classe
  async getEtudiants(classeId: string) {
    await this.findOne(classeId);
    return this.prisma.etudiant.findMany({
      where: { classeId },
      include: {
        utilisateur: { select: { nom: true, email: true } },
      },
    });
  }
}
