import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProfilService } from './profil.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Profil Utilisateur')
@Controller('profil')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProfilController {
  constructor(private readonly profilService: ProfilService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les informations du profil utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Informations du profil' })
  async getProfil(@Req() req: any) {
    const user = req.user;
    return this.profilService.getProfilComplet(user.id, user.role);
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour les informations du profil' })
  @ApiBody({ description: 'Données à mettre à jour' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  async updateProfil(@Req() req: any, @Body() updateData: any) {
    const user = req.user;
    return this.profilService.updateProfil(user.id, user.role, updateData);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Mot de passe changé' })
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const user = req.user;
    return this.profilService.changePassword(user.id, user.role, changePasswordDto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Obtenir les préférences utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences utilisateur' })
  async getPreferences(@Req() req: any) {
    const user = req.user;
    return this.profilService.getPreferences(user.id, user.role);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences' })
  @ApiBody({ description: 'Préférences à mettre à jour' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour' })
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    const user = req.user;
    return this.profilService.updatePreferences(user.id, user.role, preferences);
  }
}
