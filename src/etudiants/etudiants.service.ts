import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EtudiantsService {
  constructor(private prisma: PrismaService) {}

  async create(createEtudiantDto: CreateEtudiantDto) {
    // Hasher le mot de passe avant stockage
    const hashedPassword = await bcrypt.hash(createEtudiantDto.password, 10);

    // Créer d'abord l'utilisateur avec le rôle ETUDIANT
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEtudiantDto.nom,
        password: hashedPassword,
        email: createEtudiantDto.email,
        role: 'ETUDIANT',
      },
    });

    // Puis créer l'étudiant avec l'ID de l'utilisateur
    return this.prisma.etudiant.create({
      data: {
        utilisateurId: utilisateur.id,
        prenom: createEtudiantDto.prenom,
        matricule: createEtudiantDto.matricule,
        date_naissance: createEtudiantDto.date_naissance,
        lieu_naissance: createEtudiantDto.lieu_naissance,
        bac_type: createEtudiantDto.bac_type,
        annee_bac: createEtudiantDto.annee_bac,
        provenance: createEtudiantDto.provenance,
      } as any,
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
    return this.prisma.etudiant.findMany({
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
    return this.prisma.etudiant.findUnique({
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

  async update(utilisateurId: string, updateEtudiantDto: any) {
    return this.prisma.etudiant.update({
      where: { utilisateurId },
      data: updateEtudiantDto,
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
    // Vérifier que l'utilisateur existe avant de supprimer
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Étudiant avec l'ID "${utilisateurId}" non trouvé`);
    }

    // Supprime l'utilisateur ; en base, CASCADE efface étudiant + évaluations, absences, moyennes, résultats, affectations matière.
    return this.prisma.utilisateur.delete({
      where: { id: utilisateurId },
    });
  }

  async findByMatricule(matricule: string) {
    return this.prisma.etudiant.findFirst({
      where: { matricule },
      include: { utilisateur: true },
    });
  }

  async findByUserId(utilisateurId: string) {
    return this.prisma.etudiant.findUnique({
      where: { utilisateurId },
      include: { utilisateur: true },
    });
  }

  async findByNom(nom: string) {
    return this.prisma.utilisateur.findUnique({
      where: { nom },
      include: { etudiant: true },
    });
  }
}
