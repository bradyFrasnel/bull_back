import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEtudiantDto } from './dto/login-etudiant.dto';
import { LoginEnseignantDto } from './dto/login-enseignant.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SimpleAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async loginEtudiant(loginDto: LoginEtudiantDto) {
    // 1. Chercher par NOM dans Utilisateur (pas dans Etudiant)
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { etudiant: true },
    });

    // 2. Vérifier existence + rôle
    if (!user || user.role !== 'ETUDIANT') {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // 3. Comparer mot de passe (DTO = password, DB = password)
    const isValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // 4. Générer JWT avec données de Utilisateur (pas Etudiant)
    const payload = {
      sub: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      prenom: user.etudiant?.prenom,   // prenom vient de la table fille
    };
    
    return { access_token: this.jwtService.sign(payload) };
  }

  async loginEnseignant(loginDto: LoginEnseignantDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { enseignant: true },
    });

    if (!user || user.role !== 'ENSEIGNANT') {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const payload = {
      sub: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      prenom: user.enseignant?.prenom,
    };
    
    return { access_token: this.jwtService.sign(payload) };
  }

  async loginAdmin(loginDto: LoginAdminDto) {
    // Vérifier admin
    const admin = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { admin: true },
    });

    if (admin && admin.role === 'ADMINISTRATEUR') {
      const isValid = await bcrypt.compare(loginDto.password, admin.password);
      if (isValid) {
        const payload = {
          sub: admin.id,
          nom: admin.nom,
          email: admin.email,
          role: admin.role,
        };
        
        return { access_token: this.jwtService.sign(payload) };
      }
    }

    // Vérifier secrétariat
    const secretariat = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { secretariat: true },
    });

    if (secretariat && secretariat.role === 'SECRETARIAT') {
      const isValid = await bcrypt.compare(loginDto.password, secretariat.password);
      if (isValid) {
        const payload = {
          sub: secretariat.id,
          nom: secretariat.nom,
          email: secretariat.email,
          role: secretariat.role,
        };
        
        return { access_token: this.jwtService.sign(payload) };
      }
    }

    throw new UnauthorizedException('Identifiants incorrects');
  }
}
