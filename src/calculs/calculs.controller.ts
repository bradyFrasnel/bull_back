import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CalculsService } from './calculs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Calculs')
@Controller('calculs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CalculsController {
  constructor(private readonly calculsService: CalculsService) {}

  @Post('etudiant/:etudiantId/matiere/:matiereId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Calculer la moyenne d\'une matière pour un étudiant' })
  @ApiResponse({ status: 200, description: 'Moyenne calculée avec succès' })
  async calculerMoyenneMatiere(
    @Param('etudiantId') etudiantId: string,
    @Param('matiereId') matiereId: string,
  ) {
    return this.calculsService.calculerMoyenneMatiere(etudiantId, matiereId);
  }

  @Post('etudiant/:etudiantId/ue/:ueId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Calculer la moyenne d\'une UE pour un étudiant' })
  @ApiResponse({ status: 200, description: 'Moyenne UE calculée avec succès' })
  async calculerMoyenneUE(
    @Param('etudiantId') etudiantId: string,
    @Param('ueId') ueId: string,
  ) {
    return this.calculsService.calculerMoyenneUE(etudiantId, ueId);
  }

  @Post('etudiant/:etudiantId/semestre/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Calculer le résultat d\'un semestre pour un étudiant' })
  @ApiResponse({ status: 200, description: 'Résultat semestre calculé avec succès' })
  async calculerResultatSemestre(
    @Param('etudiantId') etudiantId: string,
    @Param('semestreId') semestreId: string,
  ) {
    return this.calculsService.calculerResultatSemestre(etudiantId, semestreId);
  }

  @Post('etudiant/:etudiantId/recalculer-tout')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Recalculer toutes les moyennes pour un étudiant' })
  @ApiResponse({ status: 200, description: 'Toutes les moyennes recalculées' })
  async recalculerToutPourEtudiant(@Param('etudiantId') etudiantId: string) {
    await this.calculsService.recalculerToutPourEtudiant(etudiantId);
    return { message: 'Toutes les moyennes ont été recalculées avec succès' };
  }

  @Get('etudiant/:etudiantId/matiere/:matiereId/details')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Voir les détails de calcul d\'une matière' })
  @ApiResponse({ status: 200, description: 'Détails du calcul' })
  async voirDetailsCalculMatiere(
    @Param('etudiantId') etudiantId: string,
    @Param('matiereId') matiereId: string,
  ) {
    return this.calculsService.calculerMoyenneMatiere(etudiantId, matiereId);
  }
}
