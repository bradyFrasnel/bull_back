import { Controller, Get, Param, Res, UseGuards, Req, ForbiddenException, Body, Post } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
    @Req() req: any,
  ) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== etudiantId) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres bulletins');
    }
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
  getBulletinAnnuel(@Param('etudiantId') etudiantId: string, @Req() req: any) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== etudiantId) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres bulletins');
    }
    return this.bulletinsService.getBulletinAnnuel(etudiantId);
  }

  @Get('promotion/semestre/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Obtenir le récapitulatif de toute la promotion pour un semestre' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({ status: 200, description: 'Tableau récapitulatif de la promotion' })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  getRecapPromotion(@Param('semestreId') semestreId: string) {
    return this.bulletinsService.getRecapPromotion(semestreId);
  }

  // ─────────────────────────────────────────────
  // PDF — BULLETIN INDIVIDUEL
  // ─────────────────────────────────────────────
  @Get('pdf/etudiant/:etudiantId/semestre/:semestreId')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Générer le bulletin PDF d\'un étudiant pour un semestre' })
  @ApiParam({ name: 'etudiantId', description: 'ID utilisateur de l\'étudiant' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({ status: 200, description: 'Fichier PDF du bulletin' })
  async getPdfBulletinEtudiant(
    @Param('etudiantId') etudiantId: string,
    @Param('semestreId') semestreId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== etudiantId) {
      throw new ForbiddenException('Vous ne pouvez télécharger que vos propres bulletins');
    }
    const pdf = await this.bulletinsService.getPdfBulletinEtudiant(etudiantId, semestreId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bulletin-${etudiantId}-${semestreId}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  // ─────────────────────────────────────────────
  // PDF — BULLETINS PAR CLASSE
  // ─────────────────────────────────────────────
  @Get('pdf/classe/:classeId/semestre/:semestreId')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Générer les bulletins PDF de toute une classe pour un semestre' })
  @ApiParam({ name: 'classeId', description: 'ID de la classe' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({ status: 200, description: 'PDF multi-pages contenant tous les bulletins de la classe' })
  async getPdfBulletinsClasse(
    @Param('classeId') classeId: string,
    @Param('semestreId') semestreId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const pdf = await this.bulletinsService.getPdfBulletinsClasse(classeId, semestreId, req.user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bulletins-classe-${classeId}-${semestreId}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  // ─────────────────────────────────────────────
  // PDF — BULLETINS PAR FILIÈRE
  // ─────────────────────────────────────────────
  @Get('pdf/filiere/:filiereId/semestre/:semestreId')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Générer les bulletins PDF de toute une filière pour un semestre' })
  @ApiParam({ name: 'filiereId', description: 'ID de la filière' })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre' })
  @ApiResponse({ status: 200, description: 'PDF multi-pages contenant tous les bulletins de la filière' })
  async getPdfBulletinsFiliere(
    @Param('filiereId') filiereId: string,
    @Param('semestreId') semestreId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const pdf = await this.bulletinsService.getPdfBulletinsFiliere(filiereId, semestreId, req.user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bulletins-filiere-${filiereId}-${semestreId}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  // ─────────────────────────────────────────────
  // ARCHIVES DE BULLETINS
  // ─────────────────────────────────────────────
  @Get('archives/:etudiantId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir les archives de bulletins d\'un étudiant' })
  @ApiParam({ name: 'etudiantId', description: 'ID utilisateur de l\'étudiant' })
  async getArchives(@Param('etudiantId') etudiantId: string, @Req() req: any) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== etudiantId) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres archives de bulletins');
    }
    return this.bulletinsService.getArchives(etudiantId);
  }

  @Post('archives')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Archiver un bulletin généré' })
  async archiveBulletin(@Body() data: { utilisateurId: string, semestreId?: string, type: string, donneesJson: any }) {
    return this.bulletinsService.archiveBulletin(data);
  }
}
