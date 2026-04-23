import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfilService {
  constructor(private prisma: PrismaService) {}

  async getProfilComplet(utilisateurId: string, role: string) {
    let profilComplet: any = {};

    // Informations de base de l'utilisateur
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    profilComplet = { ...utilisateur };

    // Informations spécifiques selon le rôle
    switch (role) {
      case 'ETUDIANT':
        const etudiant = await this.prisma.etudiant.findUnique({
          where: { utilisateurId },
          include: {
            utilisateur: {
              select: {
                email: true,
                createdAt: true,
              }
            }
          }
        });
        profilComplet = { ...profilComplet, ...etudiant };
        break;

      case 'ENSEIGNANT':
        const enseignant = await this.prisma.enseignant.findUnique({
          where: { utilisateurId },
          include: {
            utilisateur: {
              select: {
                email: true,
                createdAt: true,
              }
            }
          }
        });
        profilComplet = { ...profilComplet, ...enseignant };
        break;

      case 'ADMINISTRATEUR':
        const admin = await this.prisma.admin.findUnique({
          where: { utilisateurId },
          include: {
            utilisateur: {
              select: {
                email: true,
                createdAt: true,
              }
            }
          }
        });
        profilComplet = { ...profilComplet, ...admin };
        break;

      case 'SECRETARIAT':
        const secretariat = await this.prisma.secretariat.findUnique({
          where: { utilisateurId },
          include: {
            utilisateur: {
              select: {
                email: true,
                createdAt: true,
              }
            }
          }
        });
        profilComplet = { ...profilComplet, ...secretariat };
        break;
    }

    return profilComplet;
  }

  async updateProfil(utilisateurId: string, role: string, updateData: any) {
    // Mettre à jour les informations de base
    const updatedUtilisateur = await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        nom: updateData.nom,
        email: updateData.email,
      }
    });

    // Mettre à jour les informations spécifiques au rôle
    switch (role) {
      case 'ETUDIANT':
        if (updateData.prenom || updateData.matricule) {
          await this.prisma.etudiant.update({
            where: { utilisateurId },
            data: {
              prenom: updateData.prenom,
              matricule: updateData.matricule,
            }
          });
        }
        break;

      case 'ENSEIGNANT':
        if (updateData.prenom || updateData.matricule || updateData.specialite) {
          await this.prisma.enseignant.update({
            where: { utilisateurId },
            data: {
              prenom: updateData.prenom,
              matricule: updateData.matricule,
              specialite: updateData.specialite,
            }
          });
        }
        break;

      case 'ADMINISTRATEUR':
        // Admin n'a pas de champs supplémentaires
        break;

      case 'SECRETARIAT':
        // Secretariat n'a pas de champs supplémentaires
        break;
    }

    return this.getProfilComplet(utilisateurId, role);
  }

  async changePassword(utilisateurId: string, role: string, changePasswordDto: any) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Récupérer l'utilisateur pour vérifier le mot de passe actuel
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId }
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, utilisateur.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        password: hashedNewPassword,
      }
    });

    return { message: 'Mot de passe changé avec succès' };
  }

  async getPreferences(utilisateurId: string, role: string) {
    // Pour l'instant, retourner des préférences par défaut
    // Peut être étendu plus tard avec des préférences personnalisées
    const defaultPreferences = {
      theme: 'light',
      langue: 'fr',
      notifications: {
        email: true,
        sms: false,
        evaluations: true,
      },
      dashboard: {
        widgets: ['notes', 'emplois_du_temps'],
        defaultView: 'tableau',
      }
    };

    // Vérifier s'il existe des préférences personnalisées en base
    // TODO: Ajouter une table preferences dans la base de données
    
    return defaultPreferences;
  }

  async updatePreferences(utilisateurId: string, role: string, preferences: any) {
    // TODO: Sauvegarder les préférences en base de données
    // Pour l'instant, juste retourner les préférences mises à jour
    return {
      message: 'Préférences mises à jour',
      preferences
    };
  }
}
