import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EtudiantsService } from './etudiants.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Étudiants')
@Controller('etudiants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EtudiantsController {
  constructor(private readonly etudiantsService: EtudiantsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer un étudiant' })
  @ApiResponse({ status: 201, description: 'successful' })
  create(@Body() createEtudiantDto: CreateEtudiantDto) {
    return this.etudiantsService.create(createEtudiantDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Lister les étudiants (filtrés automatiquement pour un enseignant selon ses matières/classes)' })
  @ApiResponse({ status: 200, description: 'Liste des étudiants' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('matiereId') matiereId?: string,
    @Query('classeId') classeId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    if (req.user?.role === UserRole.ENSEIGNANT) {
      return this.etudiantsService.findForEnseignant(req.user.id, matiereId, classeId);
    }
    return this.etudiantsService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir un étudiant par son ID' })
  @ApiResponse({ status: 200, description: 'Étudiant trouvé' })
  findOne(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== id) {
      throw new ForbiddenException('Accès non autorisé au dossier d\'un autre étudiant');
    }
    return this.etudiantsService.findOne(id);
  }

  @Get('matricule/:matricule')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Obtenir un étudiant par son matricule' })
  @ApiResponse({ status: 200, description: 'Étudiant trouvé' })
  findByMatricule(@Param('matricule') matricule: string) {
    return this.etudiantsService.findByMatricule(matricule);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour un étudiant' })
  @ApiResponse({ status: 200, description: 'Étudiant mis à jour' })
  update(@Param('id') id: string, @Body() updateEtudiantDto: Partial<CreateEtudiantDto>) {
    return this.etudiantsService.update(id, updateEtudiantDto as any);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiOperation({ summary: 'Supprimer un étudiant' })
  @ApiResponse({ status: 200, description: 'Étudiant supprimé' })
  remove(@Param('id') id: string) {
    return this.etudiantsService.remove(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir un étudiant par son ID utilisateur' })
  @ApiResponse({ status: 200, description: 'Étudiant trouvé' })
  findByUserId(@Param('userId') userId: string, @Req() req: any) {
    if (req.user?.role === UserRole.ETUDIANT && req.user.id !== userId) {
      throw new ForbiddenException('Accès non autorisé au dossier d\'un autre étudiant');
    }
    return this.etudiantsService.findByUserId(userId);
  }
}
