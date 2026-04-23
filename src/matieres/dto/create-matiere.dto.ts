import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatiereDto {
  @ApiProperty({
    description: 'Libellé de la matière',
    example: 'Développement Web',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  libelle: string;

  @ApiProperty({
    description: 'Coefficient de la matière',
    example: 2.5,
    type: Number
  })
  @IsNumber()
  coefficient: number;

  @ApiProperty({
    description: 'Nombre de crédits ECTS',
    example: 6,
    type: Number
  })
  @IsNumber()
  credits: number;

  @ApiProperty({
    description: 'ID de l\'unité d\'enseignement',
    example: 'ue123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  uniteEnseignementId: string;
}
