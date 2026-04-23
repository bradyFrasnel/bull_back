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
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async loginEtudiant(loginDto: LoginEtudiantDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { etudiant: true }
    });

    if (!user || user.role !== 'ETUDIANT') {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

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

  async loginAdmin(loginDto: LoginAdminDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom }
    });

    if (!user || (user.role !== 'ADMINISTRATEUR' && user.role !== 'SECRETARIAT')) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

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

  async createEtudiant(createEtudiantDto: any) {
    const hashedPassword = await bcrypt.hash(createEtudiantDto.password, 10);
    
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: createEtudiantDto.nom,
        password: hashedPassword,
        email: createEtudiantDto.email,
        role: 'ETUDIANT',
      },
    });

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
    });
  }

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
}
