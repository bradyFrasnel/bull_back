import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO pour la création d'une classe
export class CreateClasseDto {
  @ApiProperty({ description: 'Nom complet de la classe', example: 'LP ASUR 2025' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Code unique de la classe', example: 'ASUR-2025' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Année universitaire', example: '2025-2026' })
  @IsString()
  anneeUniversitaire: string;

  @ApiPropertyOptional({ description: 'Capacité maximale d\'étudiants', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capaciteMax?: number;

  @ApiPropertyOptional({ description: 'ID de la filière', example: 'cuid...' })
  @IsOptional()
  @IsString()
  filiereId?: string;
}
