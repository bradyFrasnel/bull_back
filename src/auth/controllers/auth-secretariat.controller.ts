import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { LoginSecretariatDto } from '../dto/login-secretariat.dto';
import { RegisterSecretariatDto } from '../dto/register-secretariat.dto';

@ApiTags('Authentification - Secretariat')
@Controller('auth/secretariat')
export class AuthSecretariatController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion secrétariat' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginSecretariatDto) {
    return this.authService.loginSecretariat(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Enregistrement secrétariat' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async register(@Body() registerDto: RegisterSecretariatDto) {
    return this.authService.registerSecretariat(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil secrétariat connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré' })
  async getProfile(@Req() req: any) {
    const user = req.user;
    return this.authService.getSecretariatProfile(user.id);
  }
}
