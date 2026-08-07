import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ClassesService } from './classes.service';
import { CreateClasseDto } from './dto/create-classe.dto';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) { }

  // POST /classes
  @Post()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Créer une nouvelle classe' })
  @ApiResponse({ status: 201, description: 'Classe créée' })
  create(@Body() createClasseDto: CreateClasseDto) {
    return this.classesService.create(createClasseDto);
  }

  // GET /classes
  @Get()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Récupérer toutes les classes' })
  findAll() {
    return this.classesService.findAll();
  }

  // GET /classes/:id
  @Get(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Récupérer une classe par son ID' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  //  PUT /classes/:id 
  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Mettre à jour une classe' })
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateClasseDto>) {
    return this.classesService.update(id, updateDto);
  }

  //  DELETE /classes/:id
  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une classe' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  //  POST /classes/:id/semestres/:semestreId
  @Post(':id/semestres/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Assigner un semestre à une classe' })
  assignSemestre(@Param('id') id: string, @Param('semestreId') semestreId: string) {
    return this.classesService.assignSemestre(id, semestreId);
  }

  //  DELETE /classes/:id/semestres/:semestreId
  @Delete(':id/semestres/:semestreId')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un semestre d\'une classe' })
  removeSemestre(@Param('id') id: string, @Param('semestreId') semestreId: string) {
    return this.classesService.removeSemestre(id, semestreId);
  }

  // GET /classes/:id/etudiants
  @Get(':id/etudiants')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT)
  @ApiOperation({ summary: 'Récupérer les étudiants d\'une classe' })
  getEtudiants(@Param('id') id: string) {
    return this.classesService.getEtudiants(id);
  }
}
