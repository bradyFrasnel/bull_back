import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeEvaluation {
  CC = 'CC',
  EXAMEN = 'EXAMEN',
  RATTRAPAGE = 'RATTRAPAGE'
}

export class CreateEvaluationDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur (étudiant)',
    example: 'cm123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @ApiProperty({
    description: 'ID de la matière',
    example: 'mat123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  matiereId: string;

  @ApiProperty({
    description: 'Type d\'évaluation',
    enum: TypeEvaluation,
    example: TypeEvaluation.CC
  })
  @IsEnum(TypeEvaluation)
  type: TypeEvaluation;

  @ApiPropertyOptional({
    description: 'Note obtenue (0-20)',
    example: 15.5,
    type: Number
  })
  @IsNumber()
  @IsOptional()
  note?: number;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui a saisi la note',
    example: 'cm456',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  saisiePar: string;
}
