import { IsString, IsDate, IsOptional, IsEmail, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEtudiantDto {
  @ApiProperty({
    description: 'Nom de famille',
    example: 'mouk',
    type: String
  })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Prénom',
    example: 'brad',
    type: String
  })
  @IsString()
  prenom: string;

  @ApiProperty({
    description: 'Matricule unique',
    example: '2024ASUR001',
    type: String
  })
  @IsString()
  matricule: string;

  @ApiProperty({
    description: 'Identifiant pour connexion',
    example: 'mmartin2024',
    type: String
  })
  @IsString()
  identifiant: string;

  @ApiProperty({
    description: 'Email',
    example: 'brad.martin@asur.fr',
    type: String
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 6 caractères)',
    example: 'password123',
    minLength: 6,
    type: String
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Date de naissance',
    example: '2000-05-15',
    type: Date
  })
  @IsDate()
  @Type(() => Date)
  date_naissance: Date;

  @ApiProperty({
    description: 'Lieu de naissance',
    example: 'mouila',
    type: String
  })
  @IsString()
  lieu_naissance: string;

  @ApiProperty({
    description: 'Type de bac',
    example: 'Général',
    type: String
  })
  @IsString()
  bac_type: string;

  @ApiProperty({
    description: 'Année du bac',
    example: 2022,
    type: Number
  })
  @IsInt()
  annee_bac: number;

  @ApiProperty({
    description: 'Mention du bac',
    example: 'Bien',
    type: String
  })
  @IsString()
  mention_bac: string;

  @ApiProperty({
    description: 'Téléphone',
    example: '06123456789',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiProperty({
    description: 'Adresse',
    example: '123 rue de la République, 75001 Paris',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  adresse?: string;
}

