import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { LoginEnseignantDto } from '../dto/login-enseignant.dto';

@ApiTags('Authentification - Enseignants')
@Controller('auth/enseignant')
export class AuthEnseignantController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000, blockDuration: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion enseignant' })
  @ApiBody({ type: LoginEnseignantDto, description: 'Identifiants de connexion enseignant' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', schema: {
    example: {
      access_token: '<jwt_access_token>',
      enseignant: {
        id: 'cm456',
        nom: 'MOUK',
        prenom: 'Brady',
        matricule: 'ENS2024001',
        specialite: 'Développement Web',
        email: 'moukbrady@email.com'
      }
    }
  }})
  async loginEnseignant(@Body() loginEnseignantDto: LoginEnseignantDto) {
    return this.authService.loginEnseignant(loginEnseignantDto);
  }
}
