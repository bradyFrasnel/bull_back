import { IsString, IsDate, IsEmail, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEtudiantDto {
  @ApiProperty({ description: 'Nom de famille', example: 'Moukoma' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom', example: 'Brady' })
  @IsString()
  prenom: string;

  @ApiProperty({ description: 'Matricule unique', example: '2024ASUR001' })
  @IsString()
  matricule: string;

  @ApiProperty({ description: 'Email', example: 'brady.moukoma@asur.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe (minimum 6 caractères)', example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Date de naissance', example: '2000-05-15' })
  @IsDate()
  @Type(() => Date)
  date_naissance: Date;

  @ApiProperty({ description: 'Lieu de naissance', example: 'Libreville' })
  @IsString()
  lieu_naissance: string;

  @ApiProperty({ description: 'Type de bac', example: 'C' })
  @IsString()
  bac_type: string;

  @ApiProperty({ description: 'Année du bac', example: 2022 })
  @IsInt()
  annee_bac: number;

  @ApiProperty({ description: 'Provenance / établissement d\'origine', example: 'Lycée National Léon MBA' })
  @IsString()
  provenance: string;
}
