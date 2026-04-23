import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SemestresService } from './semestres.service';
import { CreateSemestreDto } from './dto/create-semestre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Semestres')
@Controller('semestres')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SemestresController {
  constructor(private readonly semestresService: SemestresService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer un semestre' })
  @ApiBody({ type: CreateSemestreDto, description: 'Données pour créer un semestre' })
  @ApiResponse({ status: 201, description: 'Semestre créé avec succès' })
  create(@Body() createSemestreDto: CreateSemestreDto) {
    return this.semestresService.create(createSemestreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les semestres' })
  @ApiResponse({ status: 200, description: 'Liste des semestres' })
  findAll() {
    return this.semestresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un semestre par son ID' })
  @ApiResponse({ status: 200, description: 'Semestre trouvé' })
  findOne(@Param('id') id: string) {
    return this.semestresService.findOne(id);
  }

  @Get('annee/:annee')
  @ApiOperation({ summary: 'Lister les semestres d\'une année universitaire' })
  @ApiResponse({ status: 200, description: 'Liste des semestres de l\'année' })
  findByAnnee(@Param('annee') annee: string) {
    return this.semestresService.findByAnnee(annee);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour un semestre' })
  @ApiResponse({ status: 200, description: 'Semestre mis à jour' })
  update(@Param('id') id: string, @Body() updateSemestreDto: Partial<CreateSemestreDto>) {
    return this.semestresService.update(id, updateSemestreDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Supprimer un semestre' })
  @ApiResponse({ status: 200, description: 'Semestre supprimé' })
  remove(@Param('id') id: string) {
    return this.semestresService.remove(id);
  }
}
