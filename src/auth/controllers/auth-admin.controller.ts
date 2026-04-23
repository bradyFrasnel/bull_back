import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { CreateEnseignantDto } from '../../enseignats/dto/create-enseignats.dto';
import { CreateEtudiantDto } from '../../etudiants/dto/create-etudiant.dto';

@ApiTags('Authentification - Administration')
@Controller('auth/admin')
export class AuthAdminController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion administrateur' })
  @ApiBody({ type: LoginAdminDto, description: 'Identifiants de connexion administrateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      admin: {
        id: 'admin123',
        identifiant: 'admin',
        role: 'ADMINISTRATEUR'
      }
    }
  }})
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }

  @Post('create-enseignant')
  @ApiOperation({ summary: 'Créer un enseignant (droits admin)' })
  @ApiBody({ type: CreateEnseignantDto, description: 'Données pour créer un enseignant' })
  @ApiResponse({ status: 201, description: 'Enseignant créé avec succès' })
  async createEnseignant(@Body() createEnseignantDto: CreateEnseignantDto) {
    return this.authService.createEnseignant(createEnseignantDto);
  }

  @Post('create-etudiant')
  @ApiOperation({ summary: 'Créer un étudiant (droits admin)' })
  @ApiBody({ type: CreateEtudiantDto, description: 'Données pour créer un étudiant' })
  @ApiResponse({ status: 201, description: 'Étudiant créé avec succès' })
  async createEtudiant(@Body() createEtudiantDto: CreateEtudiantDto) {
    return this.authService.createEtudiant(createEtudiantDto);
  }
}
