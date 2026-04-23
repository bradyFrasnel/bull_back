import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSemestreDto {
  @ApiProperty({
    description: 'Code du semestre',
    example: 'S5',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Libellé du semestre',
    example: 'Semestre 5',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  libelle: string;

  @ApiProperty({
    description: 'Année universitaire',
    example: '2024-2025',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  anneeUniversitaire: string;
}
