import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import * as bcrypt from 'bcrypt';

// Payload accepté pour la mise à jour
interface UpdateEtudiantPayload {
  // Champs de la table étudiant
  prenom?: string;
  matricule?: string;
  date_naissance?: Date | string;
  lieu_naissance?: string;
  bac_type?: string;
  annee_bac?: number;
  provenance?: string;
  // Champs remontés de la table utilisateur parente
  nom?: string;
  email?: string;
  password?: string;
  // Nouveaux champs
  classeId?: string;
  statut?: any;
}

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
        date_naissance: typeof createEtudiantDto.date_naissance === 'string'
          ? new Date(createEtudiantDto.date_naissance).toISOString()
          : createEtudiantDto.date_naissance,
        lieu_naissance: createEtudiantDto.lieu_naissance,
        bac_type: createEtudiantDto.bac_type,
        annee_bac: createEtudiantDto.annee_bac,
        provenance: createEtudiantDto.provenance,
        classeId: createEtudiantDto.classeId,
        statut: createEtudiantDto.statut,
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
        classe: { select: { id: true, nom: true, code: true } },
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
        classe: { select: { id: true, nom: true, code: true } },
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
        classe: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async update(utilisateurId: string, payload: UpdateEtudiantPayload) {
    // Séparer les champs de l'utilisateur parent des champs propres à l'étudiant
    const { nom, email, password, ...etudiantData } = payload;

    // Vérifier que l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur) throw new NotFoundException(`Étudiant avec l'ID "${utilisateurId}" non trouvé`);

    // Construire la mise à jour utilisateur (nom, email, mot de passe si fourni)
    const utilisateurUpdate: any = {};
    if (nom) utilisateurUpdate.nom = nom;
    if (email) utilisateurUpdate.email = email;
    if (password) utilisateurUpdate.password = await bcrypt.hash(password, 10);

    // Assurer que date_naissance est au format ISO-8601 pour Prisma
    if (etudiantData.date_naissance && typeof etudiantData.date_naissance === 'string') {
      etudiantData.date_naissance = new Date(etudiantData.date_naissance).toISOString() as any;
    }

    // Exécuter en transaction : utilisateur d'abord, puis étudiant
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(utilisateurUpdate).length > 0) {
        await tx.utilisateur.update({ where: { id: utilisateurId }, data: utilisateurUpdate });
      }
      return tx.etudiant.update({
        where: { utilisateurId },
        data: etudiantData as any,
        include: {
          utilisateur: { select: { id: true, email: true, nom: true, role: true } },
          classe: { select: { id: true, nom: true, code: true } },
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
