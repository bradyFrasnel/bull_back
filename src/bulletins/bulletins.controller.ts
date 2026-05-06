import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BulletinsService } from './bulletins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Bulletins')
@Controller('bulletins')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BulletinsController {
  constructor(private readonly bulletinsService: BulletinsService) {}

  @Get('etudiant/:etudiantId/semestre/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir le bulletin d\'un étudiant pour un semestre' })
  @ApiParam({ name: 'etudiantId', description: 'ID utilisateur de l\'étudiant' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({
    status: 200,
    description: 'Bulletin semestre avec notes, moyennes, crédits et statistiques de promotion',
  })
  @ApiResponse({ status: 404, description: 'Étudiant ou semestre non trouvé' })
  getBulletinSemestre(
    @Param('etudiantId') etudiantId: string,
    @Param('semestreId') semestreId: string,
  ) {
    return this.bulletinsService.getBulletinSemestre(etudiantId, semestreId);
  }

  @Get('etudiant/:etudiantId/annuel')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir le bulletin annuel d\'un étudiant (S5 + S6 + décision jury)' })
  @ApiParam({ name: 'etudiantId', description: 'ID utilisateur de l\'étudiant' })
  @ApiResponse({
    status: 200,
    description: 'Bulletin annuel avec les deux semestres, moyenne annuelle, mention et décision jury',
  })
  @ApiResponse({ status: 404, description: 'Étudiant non trouvé' })
  getBulletinAnnuel(@Param('etudiantId') etudiantId: string) {
    return this.bulletinsService.getBulletinAnnuel(etudiantId);
  }

  @Get('promotion/semestre/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Obtenir le récapitulatif de toute la promotion pour un semestre' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({
    status: 200,
    description: 'Tableau récapitulatif de la promotion avec classement, statistiques et taux de réussite',
  })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  getRecapPromotion(@Param('semestreId') semestreId: string) {
    return this.bulletinsService.getRecapPromotion(semestreId);
  }
}
