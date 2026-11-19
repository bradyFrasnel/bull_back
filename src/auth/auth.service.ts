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
      const sel = process.env.IMPORT_PASSWORD_SALT || 'bull_asur_import_2026';
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

  private async authenticateUser(identifiantRaw: string, passwordEnClair: string, allowedRoles: string[], includeRelations: any = {}) {
    const identifiant = (identifiantRaw || '').trim();
    if (!identifiant) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Recherche souple et insensible à la casse : Nom, Email, Matricule (enseignant/étudiant) ou Prénom
    const users = await this.prisma.utilisateur.findMany({
      where: {
        role: { in: allowedRoles as any },
        OR: [
          { nom: { equals: identifiant, mode: 'insensitive' } },
          { email: { equals: identifiant, mode: 'insensitive' } },
          { enseignant: { matricule: { equals: identifiant, mode: 'insensitive' } } },
          { enseignant: { prenom: { equals: identifiant, mode: 'insensitive' } } },
          { etudiant: { matricule: { equals: identifiant, mode: 'insensitive' } } },
          { etudiant: { prenom: { equals: identifiant, mode: 'insensitive' } } },
        ],
      },
      include: includeRelations,
    });

    if (!users || users.length === 0) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Tester le mot de passe contre chaque utilisateur correspondant (supporte les homonymes)
    for (const user of users) {
      const isPasswordValid = await this.verifyPassword(passwordEnClair, user.password, user.nom, user.id);
      if (isPasswordValid) {
        return user;
      }
    }

    throw new UnauthorizedException('Identifiants invalides');
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
    
    // Le mot de passe par défaut est lu depuis l'environnement (fallback dans EtudiantsService).
    const password = createEtudiantDto.password || process.env.DEFAULT_ETUDIANT_PASSWORD || 'pass1234';
    
    // On envoie l'email avec le mot de passe en clair en tâche de fond (ne bloque pas les imports en masse)
    const emailToUse = createEtudiantDto.email || etudiant.utilisateur?.email;
    if (emailToUse) {
      this.mailService.sendCredentials(
        emailToUse,
        etudiant.utilisateur?.nom || createEtudiantDto.nom,
        etudiant.prenom,
        password,
        'Étudiant'
      ).catch(() => {});
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
        utilisateur: {
          select: { id: true, nom: true, email: true, role: true },
        },
      }
    });

    if (createEnseignantDto.email) {
      this.mailService.sendCredentials(
        createEnseignantDto.email,
        createEnseignantDto.nom,
        createEnseignantDto.prenom,
        createEnseignantDto.password,
        'Enseignant'
      ).catch(() => {});
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

  // ──────────────────────────────────────────────────────────
  // IMPORT EN LOT — ÉTUDIANTS
  // ──────────────────────────────────────────────────────────
  /**
   * Crée plusieurs étudiants à partir de données extraites d'un fichier Excel.
   * Chaque étudiant reçoit un mot de passe par défaut et un email avec ses identifiants.
   *
   * @param data - Tableau d'objets avec les infos étudiants
   * @param classeId - ID de la classe (optionnel)
   * @param defaultPassword - Mot de passe par défaut (défaut: 'etudiant2026')
   * @returns Rapport d'import { created, failed, details }
   */
  async bulkCreateEtudiants(
    data: any[],
    classeId?: string,
    defaultPassword: string = 'etudiant2026',
  ) {
    const results = { created: 0, failed: 0, details: [] as any[] };

    for (const row of data) {
      try {
        const nom = (row.nom || row.Nom || row.NOM || row['Nom (s)'] || row['Nom(s)'] || '').toString().trim();
        const prenom = (row.prenom || row.Prenom || row.Prénom || row.PRENOM || row['Prénom (s)'] || row['Prénom(s)'] || row['Prenom (s)'] || '').toString().trim();
        const email = (row.email || row.Email || row.EMAIL || '').toString().trim() || undefined;
        let dateNaissance: any = row.date_naissance || row['Date de naissance'];
        let lieuNaissance = (row.lieu_naissance || row['Lieu de naissance'] || '').toString().trim() || undefined;
        const combinedDateLieu = (row['Date et Lieu de naissance'] || row['Date et lieu de naissance'] || '').toString().trim();
        if (!dateNaissance && combinedDateLieu) {
          const parts = combinedDateLieu.split(/\s+[àaÀ]\s+/);
          dateNaissance = parts[0]?.trim();
          if (!lieuNaissance && parts.length > 1) {
            lieuNaissance = parts.slice(1).join(' ').trim();
          }
        }
        let parsedDate: Date | undefined = undefined;
        if (dateNaissance) {
          if (dateNaissance instanceof Date && !isNaN(dateNaissance.getTime())) {
            parsedDate = dateNaissance;
          } else {
            const s = String(dateNaissance).trim();
            const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            const d = dmy ? new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`) : new Date(s);
            if (!isNaN(d.getTime())) parsedDate = d;
          }
        }
        const bacType = (row.bac_type || row['Type Bac'] || row.bac || '').toString().trim() || undefined;
        const anneeBac = row.annee_bac || row['Année Bac'];
        const provenance = (row.provenance || row.Provenance || row['Établissement d\'origine'] || '').toString().trim() || undefined;
        const matricule = (row.matricule || row.Matricule || '').toString().trim() || undefined;

        if (!nom && !prenom) {
          continue; // Ligne vide ignorée
        }
        if (!nom || !prenom) {
          results.failed++;
          results.details.push({ nom: nom || '?', prenom: prenom || '?', error: 'Nom et prénom requis' });
          continue;
        }

        const etudiant = await this.createEtudiant({
          nom,
          prenom,
          email,
          password: defaultPassword,
          date_naissance: parsedDate,
          lieu_naissance: lieuNaissance,
          bac_type: bacType,
          annee_bac: anneeBac ? parseInt(String(anneeBac), 10) : undefined,
          provenance,
          matricule,
          classeId: classeId || undefined,
        });

        results.created++;
        results.details.push({
          nom, prenom,
          matricule: etudiant.matricule || matricule,
          email: etudiant.utilisateur?.email || email,
          status: 'created',
          emailSent: true,
        });
      } catch (err: any) {
        results.failed++;
        results.details.push({
          nom: row.nom || row.Nom || '?',
          prenom: row.prenom || row.Prenom || '?',
          error: err.message || 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  // ──────────────────────────────────────────────────────────
  // IMPORT EN LOT — ENSEIGNANTS
  // ──────────────────────────────────────────────────────────
  /**
   * Crée plusieurs enseignants à partir de données extraites d'un fichier Excel.
   */
  async bulkCreateEnseignants(
    data: any[],
    defaultPassword: string = 'enseignant2026',
  ) {
    const results = { created: 0, failed: 0, details: [] as any[] };

    for (const row of data) {
      try {
        const nom = (row.nom || row.Nom || row.NOM || row['Nom (s)'] || row['Nom(s)'] || '').toString().trim();
        const prenom = (row.prenom || row.Prenom || row.Prénom || row.PRENOM || row['Prénom (s)'] || row['Prénom(s)'] || row['Prenom (s)'] || '').toString().trim();
        const rawEmail = (row.email || row.Email || row.EMAIL || '').toString().trim();
        const cleanNom = nom.toLowerCase().replace(/[^a-z0-9]/g, '') || 'enseignant';
        const cleanPrenom = prenom.toLowerCase().replace(/[^a-z0-9]/g, '') || 'inconnu';
        const email = rawEmail || `${cleanNom}.${cleanPrenom}.${Date.now().toString().slice(-5)}@inptic.ga`;
        const matricule = (row.matricule || row.Matricule || '').toString().trim() || `ENS${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
        const specialite = (row.specialite || row.Spécialité || row.Specialite || '').toString().trim() || undefined;

        if (!nom && !prenom) {
          continue;
        }
        if (!nom || !prenom) {
          results.failed++;
          results.details.push({ nom: nom || '?', prenom: prenom || '?', error: 'Nom et prénom requis' });
          continue;
        }

        const enseignant = await this.createEnseignant({
          nom,
          prenom,
          email,
          password: defaultPassword,
          matricule,
          specialite,
        });

        results.created++;
        results.details.push({
          nom, prenom,
          matricule: enseignant.matricule || matricule,
          email,
          status: 'created',
          emailSent: true,
        });
      } catch (err: any) {
        results.failed++;
        results.details.push({
          nom: row.nom || row.Nom || '?',
          prenom: row.prenom || row.Prenom || '?',
          error: err.message || 'Erreur inconnue',
        });
      }
    }

    return results;
  }
}
