import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUEDto {
  @ApiProperty({
    description: 'Code de l\'unité d\'enseignement',
    example: 'UE5-1',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Libellé de l\'unité d\'enseignement',
    example: 'Mathématiques Appliquées',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  libelle: string;

  @ApiProperty({
    description: 'ID du semestre',
    example: 'sem123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  semestreId: string;
}
