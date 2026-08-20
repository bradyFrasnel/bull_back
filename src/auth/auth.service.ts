/**
 * ============================================================
 * Service d'authentification — Bull ASUR
 * ============================================================
 *
 * Ce service gère toute la logique d'authentification :
 * - Login par rôle (étudiant, enseignant, admin, secrétariat)
 * - Création de comptes (register) pour chaque rôle
 * - Hashage des mots de passe avec bcrypt (10 rounds)
 * - Génération de tokens JWT avec payload (sub, email, role)
 *
 * Schéma d'héritage utilisateur :
 *   Utilisateur (table mère) ──┐
 *   ├── Admin        (1:1)     │
 *   ├── Secretariat  (1:1)     │ Relations polymorphiques
 *   ├── Enseignant   (1:1)     │
 *   └── Etudiant     (1:1)     ┘
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEtudiantDto } from './dto/login-etudiant.dto';
import { LoginEnseignantDto } from './dto/login-enseignant.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EtudiantsService } from '../etudiants/etudiants.service';
import { CreateEtudiantDto } from '../etudiants/dto/create-etudiant.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private async verifyPassword(passwordEnClair: string, passwordHash: string, nom: string, userId: string): Promise<boolean> {
    if (passwordHash.startsWith('$import$')) {
      const sel = 'bull_asur_import_2026';
      const expectedHash = '$import$' + crypto
        .createHash('sha256')
        .update(`${passwordEnClair}_${nom.toLowerCase()}_${sel}`)
        .digest('hex')
        .substring(0, 40);
        
      if (passwordHash === expectedHash) {
        const newHash = await bcrypt.hash(passwordEnClair, 10);
        await this.prisma.utilisateur.update({
          where: { id: userId },
          data: { password: newHash }
        });
        return true;
      }
      return false;
    }
    return bcrypt.compare(passwordEnClair, passwordHash);
  }
  constructor(
    private prisma: PrismaService,   // Service Prisma pour accéder à la BDD
    private jwtService: JwtService,  // Service JWT pour signer les tokens
    private etudiantsService: EtudiantsService,
    private mailService: MailService,
  ) {}

  private async authenticateUser(nom: string, passwordEnClair: string, allowedRoles: string[], includeRelations: any = {}) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom },
      include: includeRelations
    });

    if (!user || !allowedRoles.includes(user.role)) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await this.verifyPassword(passwordEnClair, user.password, user.nom, user.id);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return user;
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN ÉTUDIANT
  // ──────────────────────────────────────────────────────────
  async loginEtudiant(loginDto: LoginEtudiantDto) {
    const user = await this.authenticateUser(loginDto.nom, loginDto.password, ['ETUDIANT'], { etudiant: true });
    const payload = { sub: user.id, email: user.email, role: user.role, type: 'etudiant' };
    return {
      access_token: this.jwtService.sign(payload),
      etudiant: {
        id: user.id,
        nom: user.nom,
        prenom: (user as any).etudiant?.prenom,
        email: user.email,
        role: user.role
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN ENSEIGNANT
  // ──────────────────────────────────────────────────────────
  async loginEnseignant(loginDto: LoginEnseignantDto) {
    const user = await this.authenticateUser(loginDto.nom, loginDto.password, ['ENSEIGNANT'], { enseignant: true });
    const payload = { sub: user.id, email: user.email, role: user.role, type: 'enseignant' };
    return {
      access_token: this.jwtService.sign(payload),
      enseignant: {
        id: user.id,
        nom: user.nom,
        prenom: (user as any).enseignant?.prenom,
        email: user.email,
        role: user.role
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN ADMINISTRATEUR
  // ──────────────────────────────────────────────────────────
  async loginAdmin(loginDto: LoginAdminDto) {
    const user = await this.authenticateUser(loginDto.nom, loginDto.password, ['ADMINISTRATEUR', 'SECRETARIAT']);
    const payload = { sub: user.id, email: user.email, role: user.role, type: user.role.toLowerCase() };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // CRÉATION DE COMPTES
  // ──────────────────────────────────────────────────────────

  /**
   * Crée un compte étudiant (Utilisateur + profil Etudiant).
   *
   * Étapes :
   * 1. Hash du mot de passe avec bcrypt (10 rounds de salage)
   * 2. Création de l'enregistrement Utilisateur (table mère) avec rôle ETUDIANT
   * 3. Création du profil Etudiant lié (table fille) avec les données spécifiques
   *
   * @param createEtudiantDto - { nom, password, email, prenom, matricule, date_naissance, ... }
   * @returns Le profil Etudiant créé
   */
  async createEtudiant(createEtudiantDto: CreateEtudiantDto) {
    const etudiant = await this.etudiantsService.create(createEtudiantDto);
    
    // Le mot de passe par défaut est défini dans EtudiantsService ('pass1234') s'il n'est pas fourni.
    const password = createEtudiantDto.password || 'pass1234';
    
    // On envoie l'email avec le mot de passe en clair (seulement à la création)
    const emailToUse = createEtudiantDto.email || etudiant.utilisateur?.email;
    if (emailToUse) {
      await this.mailService.sendCredentials(
        emailToUse,
        etudiant.utilisateur?.nom || createEtudiantDto.nom,
        etudiant.prenom,
        password,
        'Étudiant'
      );
    }
    
    // On retourne l'étudiant avec le mot de passe généré pour l'afficher sur le frontend
    return { ...etudiant, generatedPassword: password };
  }

  /**
   * Crée un compte enseignant (Utilisateur + profil Enseignant).
   * Même logique que createEtudiant mais pour le rôle ENSEIGNANT.
   *
   * @param createEnseignantDto - { nom, password, email, prenom, matricule, specialite }
   * @returns Le profil Enseignant créé
   */
  async createEnseignant(createEnseignantDto: any) {
    const hashedPassword = await bcrypt.hash(createEnseignantDto.password, 10);
    
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEnseignantDto.nom,
        password: hashedPassword,
        email: createEnseignantDto.email,
        role: 'ENSEIGNANT',
      },
    });

    const enseignant = await this.prisma.enseignant.create({
      data: {
        utilisateurId: utilisateur.id,
        prenom: createEnseignantDto.prenom,
        matricule: createEnseignantDto.matricule,
        specialite: createEnseignantDto.specialite,
      },
      include: {
        utilisateur: true
      }
    });

    if (createEnseignantDto.email) {
      await this.mailService.sendCredentials(
        createEnseignantDto.email,
        createEnseignantDto.nom,
        createEnseignantDto.prenom,
        createEnseignantDto.password,
        'Enseignant'
      );
    }

    // On retourne l'enseignant avec le mot de passe pour l'afficher sur le frontend
    return { ...enseignant, generatedPassword: createEnseignantDto.password };
  }

  /**
   * Enregistre un enseignant (auto-inscription).
   * Différent de createEnseignant car ne nécessite pas de droits admin.
   */
  async registerEnseignant(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: registerDto.nom,
        password: hashedPassword,
        email: registerDto.email,
        role: 'ENSEIGNANT',
      },
    });

    return this.prisma.enseignant.create({
      data: {
        utilisateurId: utilisateur.id,
        prenom: registerDto.prenom,
        matricule: registerDto.matricule,
        specialite: registerDto.specialite,
      },
    });
  }

  /**
   * Enregistre un administrateur. Protégé par guard — seul un admin existant
   * peut créer un autre admin.
   */
  async registerAdmin(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: registerDto.nom,
        password: hashedPassword,
        email: registerDto.email,
        role: 'ADMINISTRATEUR',
      },
    });

    // La table Admin n'a pas de champs supplémentaires, juste la liaison
    return this.prisma.admin.create({
      data: {
        utilisateurId: utilisateur.id,
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN SECRÉTARIAT
  // ──────────────────────────────────────────────────────────
  /**
   * Authentifie un secrétariat par son nom et mot de passe.
   * Le profil secrétariat est optionnel (peut ne pas encore exister).
   *
   * @param loginDto - { nom, password }
   * @returns { access_token, secretariat: { id, utilisateurId, nom, email, role, createdAt } }
   * @throws UnauthorizedException si identifiants invalides
   */
  async loginSecretariat(loginDto: any) {
    const user = await this.authenticateUser(loginDto.nom, loginDto.password, ['SECRETARIAT']);

    let secretariatProfile = null;
    try {
      secretariatProfile = await this.prisma.secretariat.findUnique({
        where: { utilisateurId: user.id },
      });
    } catch (error) {
    }

    const payload = { sub: user.id, email: user.email, role: user.role, type: 'secretariat' };
    return {
      access_token: this.jwtService.sign(payload),
      secretariat: {
        id: secretariatProfile?.id || user.id,
        utilisateurId: secretariatProfile?.utilisateurId || user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  }

  /**
   * Enregistre un compte secrétariat.
   * Protégé par guard admin dans le controller.
   */
  async registerSecretariat(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: registerDto.nom,
        password: hashedPassword,
        email: registerDto.email,
        role: 'SECRETARIAT',
      },
    });

    return this.prisma.secretariat.create({
      data: {
        utilisateurId: utilisateur.id,
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // PROFIL SECRÉTARIAT
  // ──────────────────────────────────────────────────────────
  /**
   * Récupère le profil complet d'un secrétariat avec les infos utilisateur.
   * Utilisé par le module profil pour afficher les données du secrétariat connecté.
   *
   * @param utilisateurId - ID de l'utilisateur connecté
   * @returns Profil secrétariat avec données utilisateur (nom, email, role, createdAt)
   */
  async getSecretariatProfile(utilisateurId: string) {
    return this.prisma.secretariat.findUnique({
      where: { utilisateurId },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
            createdAt: true,
          }
        }
      }
    });
  }
}
