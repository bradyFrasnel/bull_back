import { Controller, Post, Body, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginEnseignantDto } from '../dto/login-enseignant.dto';

@ApiTags('Authentification - Enseignants')
@Controller('auth/enseignant')
export class AuthEnseignantController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion enseignant' })
  @ApiBody({ type: LoginEnseignantDto, description: 'Identifiants de connexion enseignant' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      enseignant: {
        id: 'cm456',
        nom: 'Dupont',
        prenom: 'Jean',
        matricule: 'ENS2024001',
        specialite: 'Développement Web',
        email: 'jean.dupont@asur.fr'
      }
    }
  }})
  async loginEnseignant(@Body() loginEnseignantDto: LoginEnseignantDto) {
    return this.authService.loginEnseignant(loginEnseignantDto);
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe enseignant' })
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
    return { message: 'Mot de passe changé avec succès' };
  }
}
