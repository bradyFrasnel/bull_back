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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,   // Service Prisma pour accéder à la BDD
    private jwtService: JwtService,  // Service JWT pour signer les tokens
  ) {}

  // ──────────────────────────────────────────────────────────
  // LOGIN ÉTUDIANT
  // ──────────────────────────────────────────────────────────
  /**
   * Authentifie un étudiant par son nom d'utilisateur et son mot de passe.
   *
   * Flux :
   * 1. Recherche l'utilisateur par nom (unique) avec inclusion du profil étudiant
   * 2. Vérifie que le rôle est bien ETUDIANT
   * 3. Compare le mot de passe avec le hash bcrypt stocké
   * 4. Génère un JWT avec { sub: userId, email, role, type }
   * 5. Retourne le token + les infos de l'étudiant
   *
   * @param loginDto - { nom, password }
   * @returns { access_token, etudiant: { id, nom, prenom, email, role } }
   * @throws UnauthorizedException si identifiants invalides
   */
  async loginEtudiant(loginDto: LoginEtudiantDto) {
    // Recherche de l'utilisateur par son nom unique, avec le profil étudiant associé
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { etudiant: true }
    });

    // Vérification : l'utilisateur existe et a bien le rôle ETUDIANT
    if (!user || user.role !== 'ETUDIANT') {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Comparaison du mot de passe en clair avec le hash bcrypt
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Création du payload JWT (sub = subject = ID de l'utilisateur)
    const payload = { sub: user.id, email: user.email, role: user.role, type: 'etudiant' };
    return {
      access_token: this.jwtService.sign(payload),
      etudiant: {
        id: user.id,
        nom: user.nom,
        prenom: user.etudiant?.prenom,
        email: user.email,
        role: user.role
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN ENSEIGNANT
  // ──────────────────────────────────────────────────────────
  /**
   * Authentifie un enseignant par son nom d'utilisateur et son mot de passe.
   * Même logique que loginEtudiant mais vérifie le rôle ENSEIGNANT.
   *
   * @param loginDto - { nom, password }
   * @returns { access_token, enseignant: { id, nom, prenom, email, role } }
   * @throws UnauthorizedException si identifiants invalides
   */
  async loginEnseignant(loginDto: LoginEnseignantDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { enseignant: true }
    });

    if (!user || user.role !== 'ENSEIGNANT') {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, type: 'enseignant' };
    return {
      access_token: this.jwtService.sign(payload),
      enseignant: {
        id: user.id,
        nom: user.nom,
        prenom: user.enseignant?.prenom,
        email: user.email,
        role: user.role
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN ADMINISTRATEUR
  // ──────────────────────────────────────────────────────────
  /**
   * Authentifie un administrateur par son nom et mot de passe.
   * Accepte les rôles ADMINISTRATEUR et SECRETARIAT (connexion admin unifiée).
   * Retourne toujours la clé "admin" dans la réponse, quel que soit le rôle.
   *
   * @param loginDto - { nom, password }
   * @returns { access_token, admin: { id, nom, email, role } }
   * @throws UnauthorizedException si identifiants invalides
   */
  async loginAdmin(loginDto: LoginAdminDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom }
    });

    // Accepte ADMINISTRATEUR ou SECRETARIAT pour la connexion admin
    if (!user || (user.role !== 'ADMINISTRATEUR' && user.role !== 'SECRETARIAT')) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Le type dans le payload correspond au rôle en minuscules
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
  async createEtudiant(createEtudiantDto: any) {
    // Hashage du mot de passe — 10 rounds de bcrypt pour un bon compromis sécurité/performance
    const hashedPassword = await bcrypt.hash(createEtudiantDto.password, 10);
    
    // Création de l'utilisateur dans la table mère
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEtudiantDto.nom,
        password: hashedPassword,
        email: createEtudiantDto.email,
        role: 'ETUDIANT',
      },
    });

    // Création du profil étudiant lié via l'utilisateurId
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
        classeId: createEtudiantDto.classeId || null,
      } as any,
    });
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

    return this.prisma.enseignant.create({
      data: {
        utilisateurId: utilisateur.id,
        prenom: createEnseignantDto.prenom,
        matricule: createEnseignantDto.matricule,
        specialite: createEnseignantDto.specialite,
      },
    });
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
    // Recherche de l'utilisateur par nom
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
    });

    // Vérification : l'utilisateur existe et a bien le rôle SECRETARIAT
    if (!user || user.role !== 'SECRETARIAT') {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Tentative de récupération du profil secrétariat (peut ne pas exister)
    let secretariatProfile = null;
    try {
      secretariatProfile = await this.prisma.secretariat.findUnique({
        where: { utilisateurId: user.id },
      });
    } catch (error) {
      // Le profil secrétariat n'existe pas encore — ce n'est pas bloquant
    }

    // Génération du JWT et renvoi des informations
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
