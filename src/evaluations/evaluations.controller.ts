import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto, TypeEvaluation } from './dto/create-evaluation.dto';
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
}
