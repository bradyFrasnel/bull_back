import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEtudiantDto } from './dto/login-etudiant.dto';
import { LoginEnseignantDto } from './dto/login-enseignant.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BasicAuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async loginEtudiant(loginDto: LoginEtudiantDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { etudiant: true }
    });

    if (user && user.role === 'ETUDIANT') {
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (isPasswordValid) {
        const payload = { 
          sub: user.id, 
          email: user.email, 
          role: user.role,
          type: 'etudiant'
        };
        
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
    }

    throw new Error('Identifiants invalides');
  }

  async loginEnseignant(loginDto: LoginEnseignantDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { enseignant: true }
    });

    if (user && user.role === 'ENSEIGNANT') {
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (isPasswordValid) {
        const payload = { 
          sub: user.id, 
          email: user.email, 
          role: user.role,
          type: 'enseignant'
        };
        
        return {
          access_token: this.jwtService.sign(payload),
          enseignant: {
            id: user.id,
            nom: user.nom,
            prenom: user.enseignant?.prenom,
            matricule: user.enseignant?.matricule,
            specialite: user.enseignant?.specialite,
            email: user.email
          }
        };
      }
    }

    throw new Error('Identifiants invalides');
  }

  async loginAdmin(loginDto: LoginAdminDto) {
    // Vérifier admin
    const admin = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { admin: true }
    });

    if (admin && admin.role === 'ADMINISTRATEUR') {
      const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
      if (isPasswordValid) {
        const payload = { 
          sub: admin.id, 
          email: admin.email, 
          role: admin.role,
          type: 'admin'
        };
        
        return {
          access_token: this.jwtService.sign(payload),
          admin: {
            id: admin.id,
            nom: admin.nom,
            email: admin.email,
            role: admin.role
          }
        };
      }
    }

    // Vérifier secrétariat
    const secretariat = await this.prisma.utilisateur.findUnique({
      where: { nom: loginDto.nom },
      include: { secretariat: true }
    });

    if (secretariat && secretariat.role === 'SECRETARIAT') {
      const isPasswordValid = await bcrypt.compare(loginDto.password, secretariat.password);
      if (isPasswordValid) {
        const payload = { 
          sub: secretariat.id, 
          email: secretariat.email, 
          role: secretariat.role,
          type: 'secretariat'
        };
        
        return {
          access_token: this.jwtService.sign(payload),
          admin: {
            id: secretariat.id,
            nom: secretariat.nom,
            email: secretariat.email,
            role: secretariat.role
          }
        };
      }
    }

    throw new Error('Identifiants invalides');
  }
}
