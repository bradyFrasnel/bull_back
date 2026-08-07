import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { FilieresService } from './filieres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Filieres')
@ApiBearerAuth()
@Controller('filieres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilieresController {
  constructor(private readonly filieresService: FilieresService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiOperation({ summary: 'Créer une filière' })
  create(@Body() createDto: any) {
    return this.filieresService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Lister toutes les filières' })
  findAll() {
    return this.filieresService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT, UserRole.ENSEIGNANT, UserRole.ETUDIANT)
  @ApiOperation({ summary: 'Détails d\'une filière' })
  findOne(@Param('id') id: string) {
    return this.filieresService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiOperation({ summary: 'Mettre à jour une filière' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.filieresService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiOperation({ summary: 'Supprimer une filière' })
  remove(@Param('id') id: string) {
    return this.filieresService.remove(id);
  }
}
