import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnseignantDto {
  @ApiProperty({
    description: 'Nom de famille de l\'enseignant',
    example: 'Dupont',
    type: String
  })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Prénom de l\'enseignant',
    example: 'Jean',
    type: String
  })
  @IsString()
  prenom: string;

  @ApiProperty({
    description: 'Email professionnel',
    example: 'jean.dupont@asur.fr',
    type: String
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Matricule unique',
    example: 'ENS2024001',
    type: String
  })
  @IsString()
  matricule: string;

  @ApiPropertyOptional({
    description: 'Spécialité de l\'enseignant',
    example: 'Développement Web',
    type: String
  })
  @IsString()
  @IsOptional()
  specialite?: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'password123',
    type: String
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'ID utilisateur associé',
    example: 'cm123',
    type: String
  })
  @IsString()
  @IsOptional()
  utilisateurId?: string;
}
