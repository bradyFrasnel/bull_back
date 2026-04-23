import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UnitesEnseignementService } from './unites-enseignement.service';
import { CreateUEDto } from './dto/create-ue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Unités d\'Enseignement')
@Controller('unites-enseignement')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnitesEnseignementController {
  constructor(private readonly unitesEnseignementService: UnitesEnseignementService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer une unité d\'enseignement' })
  @ApiBody({ type: CreateUEDto, description: 'Données pour créer une UE' })
  @ApiResponse({ status: 201, description: 'UE créée avec succès' })
  create(@Body() createUEDto: CreateUEDto) {
    return this.unitesEnseignementService.create(createUEDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les unités d\'enseignement' })
  @ApiResponse({ status: 200, description: 'Liste des UE' })
  findAll() {
    return this.unitesEnseignementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une UE par son ID' })
  @ApiResponse({ status: 200, description: 'UE trouvée' })
  findOne(@Param('id') id: string) {
    return this.unitesEnseignementService.findOne(id);
  }

  @Get('semestre/:semestreId')
  @ApiOperation({ summary: 'Lister les UE d\'un semestre' })
  @ApiResponse({ status: 200, description: 'Liste des UE du semestre' })
  findBySemestre(@Param('semestreId') semestreId: string) {
    return this.unitesEnseignementService.findBySemestre(semestreId);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour une UE' })
  @ApiResponse({ status: 200, description: 'UE mise à jour' })
  update(@Param('id') id: string, @Body() updateUEDto: Partial<CreateUEDto>) {
    return this.unitesEnseignementService.update(id, updateUEDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Supprimer une UE' })
  @ApiResponse({ status: 200, description: 'UE supprimée' })
  remove(@Param('id') id: string) {
    return this.unitesEnseignementService.remove(id);
  }
}
