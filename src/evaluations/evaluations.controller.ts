import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto, TypeEvaluation } from './dto/create-evaluation.dto';
import { SaveReleveDto } from './dto/releve-matiere.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Évaluations')
@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Créer une évaluation' })
  @ApiBody({ type: CreateEvaluationDto, description: 'Données pour créer une évaluation' })
  @ApiResponse({ status: 201, description: 'Évaluation créée avec succès' })
  create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return this.evaluationsService.create(createEvaluationDto);
  }

  @Get()
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Lister toutes les évaluations' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations' })
  findAll() {
    return this.evaluationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une évaluation par son ID' })
  @ApiResponse({ status: 200, description: 'Évaluation trouvée' })
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @Get('etudiant/:etudiantId')
  @ApiOperation({ summary: 'Lister les évaluations d\'un étudiant' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations de l\'étudiant' })
  findByEtudiant(@Param('etudiantId') etudiantId: string) {
    return this.evaluationsService.findByEtudiant(etudiantId);
  }

  @Get('matiere/:matiereId')
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Lister les évaluations d\'une matière' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations de la matière' })
  findByMatiere(@Param('matiereId') matiereId: string) {
    return this.evaluationsService.findByMatiere(matiereId);
  }

  @Get('type/:type')
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Lister les évaluations par type' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations du type' })
  findByType(@Param('type') type: TypeEvaluation) {
    return this.evaluationsService.findByType(type);
  }

  @Get('etudiant/:etudiantId/matiere/:matiereId')
  @ApiOperation({ summary: 'Lister les évaluations d\'un étudiant pour une matière' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations de l\'étudiant pour la matière' })
  findByEtudiantAndMatiere(
    @Param('etudiantId') etudiantId: string,
    @Param('matiereId') matiereId: string,
  ) {
    return this.evaluationsService.findByEtudiantAndMatiere(etudiantId, matiereId);
  }

  @Put(':id')
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Mettre à jour une évaluation' })
  @ApiResponse({ status: 200, description: 'Évaluation mise à jour' })
  update(@Param('id') id: string, @Body() updateEvaluationDto: Partial<CreateEvaluationDto>) {
    return this.evaluationsService.update(id, updateEvaluationDto);
  }

  @Delete(':id')
  @Roles(UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Supprimer une évaluation' })
  @ApiResponse({ status: 200, description: 'Évaluation supprimée' })
  remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RELEVÉ MATIÈRE
  // ─────────────────────────────────────────────────────────────────────────

  @Get('releve/matiere/:matiereId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({
    summary: 'Obtenir le relevé complet d\'une matière (notes et absences par étudiant)',
  })
  @ApiResponse({
    status: 200,
    description: 'Relevé avec notes CC/Examen/Rattrapage et heures d\'absence par étudiant',
    schema: {
      example: {
        matiere: { id: 'mat123', libelle: 'Anglais technique', coefficient: 1, credits: 2, ue: 'UE5-1', semestre: 'Semestre 5' },
        releve: [
          {
            utilisateurId: 'cm123', nom: 'Martin', prenom: 'Sophie', matricule: '2024ASUR001',
            noteCC: 14, noteExamen: 16, noteRattrapage: null,
            evalIdCC: 'eval1', evalIdExamen: 'eval2', evalIdRattrapage: null,
            absences: 2, absenceId: 'abs1',
          },
        ],
      },
    },
  })
  getReleveMatiere(@Param('matiereId') matiereId: string) {
    return this.evaluationsService.getReleveMatiere(matiereId);
  }

  @Put('releve/matiere/:matiereId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({
    summary: 'Sauvegarder le relevé complet d\'une matière (notes et absences, upsert en masse)',
  })
  @ApiBody({
    type: SaveReleveDto,
    description: 'Notes et heures d\'absence de tous les étudiants pour cette matière',
    examples: {
      exemple: {
        value: {
          saisiePar: 'cm456',
          notes: [
            { utilisateurId: 'cm123', noteCC: 14, noteExamen: 16, absences: 2 },
            { utilisateurId: 'cm124', noteCC: 10, noteExamen: 12, absences: 0 },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relevé sauvegardé avec cascade de calculs automatique',
    schema: {
      example: { sauvegardes: 4, absencesSauvegardees: 2, erreurs: 0 },
    },
  })
  saveReleveMatiere(
    @Param('matiereId') matiereId: string,
    @Body() saveReleveDto: SaveReleveDto,
  ) {
    return this.evaluationsService.saveReleveMatiere(matiereId, saveReleveDto);
  }
}
