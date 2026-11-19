import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Import Excel')
@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('excel')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const ext = file.originalname.toLowerCase();
        if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Seuls les fichiers .xlsx et .xls sont acceptés.'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
    }),
  )
  @ApiOperation({
    summary: 'Importer un fichier Excel (liste étudiants ou relevé de notes)',
    description:
      'Détecte automatiquement le type de fichier et crée : filière, classe, semestre, UE, matières, étudiants, notes et calcule les moyennes.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Fichier Excel (.xlsx ou .xls)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import réussi — résumé des créations et erreurs ignorées',
  })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou non reconnu' })
  async importerExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('classeId') classeId?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni.');
    return this.importService.importerFichierExcel(file.buffer, file.originalname, classeId);
  }
}
