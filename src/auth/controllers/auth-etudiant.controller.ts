import { Controller, Post, Body, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginEtudiantDto } from '../dto/login-etudiant.dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Authentification - Étudiants')
@Controller('auth/etudiant')
export class AuthEtudiantController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion étudiant' })
  @ApiBody({ type: LoginEtudiantDto, description: 'Identifiants de connexion étudiant' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      etudiant: {
        id: 'cm123',
        nom: 'Martin',
        prenom: 'Marie',
        matricule: '2024ASUR001',
        email: 'marie.martin@asur.fr'
      }
    }
  }})
  async loginEtudiant(@Body() loginEtudiantDto: LoginEtudiantDto) {
    return this.authService.loginEtudiant(loginEtudiantDto);
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe étudiant' })
  @ApiBody({ 
    description: 'Ancien et nouveau mot de passe',
    schema: {
      example: {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword456'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  async changePassword(@Body() body: { oldPassword: string; newPassword: string }) {
    // Logique à implémenter
    return { message: 'Mot de passe changé avec succès' };
  }
}
