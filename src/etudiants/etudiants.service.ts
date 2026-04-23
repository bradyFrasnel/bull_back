import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';

@Injectable()
export class EtudiantsService {
  constructor(private prisma: PrismaService) {}

  async create(createEtudiantDto: CreateEtudiantDto) {
    // Créer d'abord l'utilisateur avec le rôle ETUDIANT
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEtudiantDto.nom,
        password: createEtudiantDto.password,
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
        mention_bac: createEtudiantDto.mention_bac,
        telephone: createEtudiantDto.telephone,
        adresse: createEtudiantDto.adresse,
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
        evaluations: true,
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
    return this.prisma.etudiant.delete({
      where: { utilisateurId },
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
