import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { RegisterAdminDto } from '../dto/register-admin.dto';
import { CreateEnseignantDto } from '../../enseignats/dto/create-enseignats.dto';
import { CreateEtudiantDto } from '../../etudiants/dto/create-etudiant.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Authentification - Administration')
@Controller('auth/admin')
export class AuthAdminController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion administrateur' })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un compte administrateur (Admin uniquement)' })
  @ApiBody({ type: RegisterAdminDto })
  @ApiResponse({ status: 201, description: 'Administrateur créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async register(@Body() registerAdminDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerAdminDto);
  }

  @Post('create-enseignant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un enseignant (Admin/Secretariat)' })
  @ApiBody({ type: CreateEnseignantDto })
  @ApiResponse({ status: 201, description: 'Enseignant créé avec succès' })
  async createEnseignant(@Body() createEnseignantDto: CreateEnseignantDto) {
    return this.authService.createEnseignant(createEnseignantDto);
  }

  @Post('create-etudiant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un étudiant (Admin/Secretariat)' })
  @ApiBody({ type: CreateEtudiantDto })
  @ApiResponse({ status: 201, description: 'Étudiant créé avec succès' })
  async createEtudiant(@Body() createEtudiantDto: CreateEtudiantDto) {
    return this.authService.createEtudiant(createEtudiantDto);
  }
}
