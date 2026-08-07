import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnseignantDto } from './dto/create-enseignats.dto';
import * as bcrypt from 'bcrypt';

// Payload accepté pour la mise à jour
interface UpdateEnseignantPayload {
  // Champs de la table enseignant
  prenom?: string;
  matricule?: string;
  specialite?: string;
  // Champs remontés de la table utilisateur parente
  nom?: string;
  email?: string;
  password?: string;
}

@Injectable()
export class EnseignantsService {
  constructor(private prisma: PrismaService) { }

  async create(createEnseignantDto: CreateEnseignantDto) {
    // Hasher le mot de passe avant stockage
    const hashedPassword = await bcrypt.hash(createEnseignantDto.password, 10);

    // Créer d'abord l'utilisateur avec le rôle ENSEIGNANT
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEnseignantDto.nom,
        password: hashedPassword,
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
      },
    });
  }

  async update(utilisateurId: string, payload: UpdateEnseignantPayload) {
    // Séparer les champs utilisateur parent des champs propres à l'enseignant
    const { nom, email, password, ...enseignantData } = payload;

    // Vérifier que l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur) throw new NotFoundException(`Enseignant avec l'ID "${utilisateurId}" non trouvé`);

    // Construire la mise à jour utilisateur
    const utilisateurUpdate: any = {};
    if (nom) utilisateurUpdate.nom = nom;
    if (email) utilisateurUpdate.email = email;
    if (password) utilisateurUpdate.password = await bcrypt.hash(password, 10);

    // Exécuter en transaction
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(utilisateurUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id: utilisateurId }, data: utilisateurUpdate });
      }
      return tx.enseignant.update({
        where: { utilisateurId },
        data: enseignantData as any,
        include: {
          utilisateur: { select: { id: true, email: true, nom: true, role: true } },
        },
      });
    });
  }

  async remove(utilisateurId: string) {
    // Vérifier que l'utilisateur existe avant de supprimer
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Enseignant avec l'ID "${utilisateurId}" non trouvé`);
    }

    // Supprimer l'utilisateur parent — cascade supprime automatiquement l'enseignant
    return this.prisma.utilisateur.delete({
      where: { id: utilisateurId },
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
    // upsert : crée si n'existe pas, ignore si déjà assigné
    return this.prisma.matiereEnseignant.upsert({
      where: {
        utilisateurId_matiereId: {
          utilisateurId: enseignantId,
          matiereId,
        },
      },
      update: {}, // rien à mettre à jour
      create: {
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
      where: { utilisateurId },
      include: {
        matiere: true,
        utilisateur: {
          select: {
            nom: true,
          },
        },
      },
    });
  }
}
