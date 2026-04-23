import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EnseignantsService } from './enseignats.service';
import { CreateEnseignantDto } from './dto/create-enseignats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Enseignants')
@Controller('enseignants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnseignantsController {
  constructor(private readonly enseignantsService: EnseignantsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer un enseignant' })
  @ApiBody({ type: CreateEnseignantDto, description: 'Données pour créer un enseignant' })
  @ApiResponse({ status: 201, description: 'Enseignant créé avec succès', schema: {
    example: {
      id: 'cm123',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@asur.fr',
      matricule: 'ENS2024001',
      specialite: 'Développement Web',
      createdAt: '2024-01-15T10:30:00.000Z'
    }
  }})
  create(@Body() createEnseignantDto: CreateEnseignantDto) {
    return this.enseignantsService.create(createEnseignantDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Lister tous les enseignants' })
  @ApiResponse({ status: 200, description: 'Liste des enseignants' })
  findAll() {
    return this.enseignantsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Obtenir un enseignant par son ID' })
  @ApiResponse({ status: 200, description: 'Enseignant trouvé' })
  findOne(@Param('id') id: string) {
    return this.enseignantsService.findOne(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Obtenir un enseignant par son ID utilisateur' })
  @ApiResponse({ status: 200, description: 'Enseignant trouvé' })
  findByUserId(@Param('userId') userId: string) {
    return this.enseignantsService.findByUserId(userId);
  }

  @Post(':enseignantId/matieres/:matiereId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Assigner une matière à un enseignant' })
  @ApiResponse({ status: 201, description: 'Matière assignée avec succès' })
  assignMatiere(
    @Param('enseignantId') enseignantId: string,
    @Param('matiereId') matiereId: string,
  ) {
    return this.enseignantsService.assignMatiere(enseignantId, matiereId);
  }

  @Delete(':enseignantId/matieres/:matiereId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Retirer une matière à un enseignant' })
  @ApiResponse({ status: 200, description: 'Matière retirée avec succès' })
  removeMatiere(
    @Param('enseignantId') enseignantId: string,
    @Param('matiereId') matiereId: string,
  ) {
    return this.enseignantsService.removeMatiere(enseignantId, matiereId);
  }

  @Get(':enseignantId/matieres')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Lister les matières d\'un enseignant' })
  @ApiResponse({ status: 200, description: 'Liste des matières de l\'enseignant' })
  getEnseignantMatieres(@Param('enseignantId') enseignantId: string) {
    return this.enseignantsService.getTeacherMatieres(enseignantId);
  }

  @Get('matieres/:matiereId/enseignants')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Lister les enseignants d\'une matière' })
  @ApiResponse({ status: 200, description: 'Liste des enseignants de la matière' })
  getMatiereEnseignants(@Param('matiereId') matiereId: string) {
    return this.enseignantsService.getMatiereTeachers(matiereId);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour un enseignant' })
  @ApiResponse({ status: 200, description: 'Enseignant mis à jour' })
  update(@Param('id') id: string, @Body() updateEnseignantDto: Partial<CreateEnseignantDto>) {
    return this.enseignantsService.update(id, updateEnseignantDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiOperation({ summary: 'Supprimer un enseignant' })
  @ApiResponse({ status: 200, description: 'Enseignant supprimé' })
  remove(@Param('id') id: string) {
    return this.enseignantsService.remove(id);
  }
}
