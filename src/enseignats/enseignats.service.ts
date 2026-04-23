import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnseignantDto } from './dto/create-enseignats.dto';

@Injectable()
export class EnseignantsService {
  constructor(private prisma: PrismaService) {}

  async create(createEnseignantDto: CreateEnseignantDto) {
    // Créer d'abord l'utilisateur avec le rôle ENSEIGNANT
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEnseignantDto.nom,
        password: createEnseignantDto.password,
        email: createEnseignantDto.email,
        role: 'ENSEIGNANT',
      },
    });

    // Puis créer l'enseignant avec l'ID de l'utilisateur
    return this.prisma.enseignant.create({
      data: {
        utilisateurId: utilisateur.id,
        prenom: createEnseignantDto.prenom,
        matricule: createEnseignantDto.matricule,
        specialite: createEnseignantDto.specialite,
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.enseignant.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(utilisateurId: string) {
    return this.prisma.enseignant.findUnique({
      where: { utilisateurId },
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
        matieresEnseignees: {
          include: {
            matiere: true,
          },
        },
      },
    });
  }

  async update(utilisateurId: string, updateEnseignantDto: any) {
    return this.prisma.enseignant.update({
      where: { utilisateurId },
      data: updateEnseignantDto,
      include: {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(utilisateurId: string) {
    return this.prisma.enseignant.delete({
      where: { utilisateurId },
    });
  }

  async findByNom(nom: string) {
    return this.prisma.utilisateur.findUnique({
      where: { nom },
      include: { enseignant: true },
    });
  }

  async findByUserId(utilisateurId: string) {
    return this.prisma.enseignant.findUnique({
      where: { utilisateurId },
      include: { utilisateur: true },
    });
  }

  async assignMatiere(enseignantId: string, matiereId: string) {
    return this.prisma.matiereEnseignant.create({
      data: {
        utilisateurId: enseignantId,
        matiereId,
      },
      include: {
        matiere: true,
        utilisateur: {
          include: { enseignant: true },
        },
      },
    });
  }

  async removeMatiere(enseignantId: string, matiereId: string) {
    return this.prisma.matiereEnseignant.deleteMany({
      where: {
        utilisateurId: enseignantId,
        matiereId,
      },
    });
  }

  async getTeacherMatieres(enseignantId: string) {
    return this.prisma.matiereEnseignant.findMany({
      where: { utilisateurId: enseignantId },
      include: {
        matiere: true,
      },
    });
  }

  async getMatiereTeachers(matiereId: string) {
    return this.prisma.matiereEnseignant.findMany({
      where: { matiereId },
      include: {
        utilisateur: {
          include: { enseignant: true },
        },
      },
    });
  }

  async findMatieresEnseignees(utilisateurId: string) {
    return this.prisma.matiereEnseignant.findMany({
      where: { utilisateurId }, // Vérifier le nom exact de la FK dans le schéma
      include: {
        matiere: true,
        utilisateur: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }
}
