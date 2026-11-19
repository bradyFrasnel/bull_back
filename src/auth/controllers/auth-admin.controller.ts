import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { AuthService } from '../auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { RegisterAdminDto } from '../dto/register-admin.dto';
import { CreateEnseignantDto } from '../../enseignants/dto/create-enseignants.dto';
import { CreateEtudiantDto } from '../../etudiants/dto/create-etudiant.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import * as XLSX from 'xlsx';

export interface UploadedExcelFile {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
}

const excelUploadOptions = {
  storage: memoryStorage(),
  fileFilter: (_req: any, file: UploadedExcelFile, cb: any) => {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Seuls les fichiers Excel (.xlsx et .xls) sont acceptés.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
};

@ApiTags('Authentification - Administration')
@Controller('auth/admin')
export class AuthAdminController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion administrateur' })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un compte administrateur (Admin uniquement)' })
  @ApiBody({ type: RegisterAdminDto })
  @ApiResponse({ status: 201, description: 'Administrateur créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async register(@Body() registerAdminDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerAdminDto);
  }

  @Post('create-enseignant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un enseignant (Admin/Secretariat)' })
  @ApiBody({ type: CreateEnseignantDto })
  @ApiResponse({ status: 201, description: 'Enseignant créé avec succès' })
  async createEnseignant(@Body() createEnseignantDto: CreateEnseignantDto) {
    return this.authService.createEnseignant(createEnseignantDto);
  }

  @Post('create-etudiant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un étudiant (Admin/Secretariat)' })
  @ApiBody({ type: CreateEtudiantDto })
  @ApiResponse({ status: 201, description: 'Étudiant créé avec succès' })
  async createEtudiant(@Body() createEtudiantDto: CreateEtudiantDto) {
    return this.authService.createEtudiant(createEtudiantDto);
  }

  // ──────────────────────────────────────────────────────────
  // IMPORT EN LOT — ÉTUDIANTS (via fichier Excel)
  // ──────────────────────────────────────────────────────────
  @Post('import-etudiants')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', excelUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importer des étudiants depuis un fichier Excel (Admin/Secretariat)' })
  @ApiResponse({ status: 201, description: 'Import terminé — rapport retourné' })
  async importEtudiants(
    @UploadedFile() file: UploadedExcelFile,
    @Body('classeId') classeId?: string,
    @Body('defaultPassword') defaultPassword?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni. Envoyez un fichier Excel (.xlsx)');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = this.extractRowsFromSheet(sheet);

    if (!data || data.length === 0) {
      throw new BadRequestException('Le fichier Excel est vide ou mal formaté');
    }

    return this.authService.bulkCreateEtudiants(data, classeId, defaultPassword || 'etudiant2026');
  }

  // ──────────────────────────────────────────────────────────
  // IMPORT EN LOT — ENSEIGNANTS (via fichier Excel)
  // ──────────────────────────────────────────────────────────
  @Post('import-enseignants')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATEUR, UserRole.SECRETARIAT)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', excelUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importer des enseignants depuis un fichier Excel (Admin/Secretariat)' })
  @ApiResponse({ status: 201, description: 'Import terminé — rapport retourné' })
  async importEnseignants(
    @UploadedFile() file: UploadedExcelFile,
    @Body('defaultPassword') defaultPassword?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni. Envoyez un fichier Excel (.xlsx)');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = this.extractRowsFromSheet(sheet);

    if (!data || data.length === 0) {
      throw new BadRequestException('Le fichier Excel est vide ou mal formaté');
    }

    return this.authService.bulkCreateEnseignants(data, defaultPassword || 'enseignant2026');
  }

  /**
   * Extrait les lignes de données d'une feuille Excel même si un en-tête institutionnel
   * précède la ligne des colonnes ("Nom", "Nom (s)", "Prénom", etc.).
   */
  private extractRowsFromSheet(sheet: XLSX.WorkSheet): any[] {
    const rows2D: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    for (let r = 0; r < Math.min(25, rows2D.length); r++) {
      const cells = (rows2D[r] || []).map((c) => String(c ?? '').trim().toLowerCase());
      const hasNom = cells.some((c) => c === 'nom' || c.startsWith('nom ') || c.startsWith('nom('));
      const hasPrenom = cells.some((c) => c.startsWith('prénom') || c.startsWith('prenom'));
      if (hasNom && hasPrenom) {
        return XLSX.utils.sheet_to_json(sheet, { range: r, defval: '' });
      }
    }
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }
}

