import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion étudiant' })
  @ApiBody({ type: LoginEtudiantDto, description: 'Identifiants de connexion étudiant' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', schema: {
    example: {
      access_token: '<jwt_access_token>',
      etudiant: {
        id: 'cm123',
        nom: 'MOUK',
        prenom: 'Brady',
        matricule: '2024ASUR001',
        email: 'moukbrady@gmail.com'
      }
    }
  }})
  async loginEtudiant(@Body() loginEtudiantDto: LoginEtudiantDto) {
    return this.authService.loginEtudiant(loginEtudiantDto);
  }
}
