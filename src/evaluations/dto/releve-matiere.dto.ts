import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeEvaluation } from './create-evaluation.dto';

export class NoteEtudiantDto {
  @ApiProperty({ description: 'ID utilisateur de l\'étudiant', example: 'cm123' })
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @ApiPropertyOptional({ description: 'Note CC (0-20)', example: 14 })
  @IsNumber()
  @IsOptional()
  noteCC?: number;

  @ApiPropertyOptional({ description: 'Note Examen (0-20)', example: 16 })
  @IsNumber()
  @IsOptional()
  noteExamen?: number;

  @ApiPropertyOptional({ description: 'Note Rattrapage (0-20)', example: 12 })
  @IsNumber()
  @IsOptional()
  noteRattrapage?: number;
}

export class SaveReleveDto {
  @ApiProperty({ description: 'ID de l\'utilisateur qui saisit', example: 'cm456' })
  @IsString()
  @IsNotEmpty()
  saisiePar: string;

  @ApiProperty({ type: [NoteEtudiantDto], description: 'Notes de tous les étudiants' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteEtudiantDto)
  notes: NoteEtudiantDto[];
}
