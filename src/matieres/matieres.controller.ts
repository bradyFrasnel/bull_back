import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MatieresService } from './matieres.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Matières')
@Controller('matieres')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MatieresController {
  constructor(private readonly matieresService: MatieresService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer une matière' })
  @ApiBody({ type: CreateMatiereDto, description: 'Données pour créer une matière' })
  @ApiResponse({ status: 201, description: 'Matière créée avec succès' })
  create(@Body() createMatiereDto: CreateMatiereDto) {
    return this.matieresService.create(createMatiereDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les matières' })
  @ApiResponse({ status: 200, description: 'Liste des matières' })
  findAll() {
    return this.matieresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une matière par son ID' })
  @ApiResponse({ status: 200, description: 'Matière trouvée' })
  findOne(@Param('id') id: string) {
    return this.matieresService.findOne(id);
  }

  @Get('ue/:ueId')
  @ApiOperation({ summary: 'Lister les matières d\'une unité d\'enseignement' })
  @ApiResponse({ status: 200, description: 'Liste des matières de l\'UE' })
  findByUE(@Param('ueId') ueId: string) {
    return this.matieresService.findByUE(ueId);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour une matière' })
  @ApiResponse({ status: 200, description: 'Matière mise à jour' })
  update(@Param('id') id: string, @Body() updateMatiereDto: Partial<CreateMatiereDto>) {
    return this.matieresService.update(id, updateMatiereDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Supprimer une matière' })
  @ApiResponse({ status: 200, description: 'Matière supprimée' })
  remove(@Param('id') id: string) {
    return this.matieresService.remove(id);
  }
}
