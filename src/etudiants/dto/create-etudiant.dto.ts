import { IsString, IsDate, IsEmail, IsInt, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Création d'un étudiant.
 *
 * Champs obligatoires (alignés sur le modèle Excel DAR_A) :
 *   nom, prenom, date_naissance
 *
 * Champs facultatifs à la création (complétables via PUT /etudiants/:id) :
 *   email, password, matricule, lieu_naissance, bac_type, annee_bac, provenance, classeId, statut
 */
export class CreateEtudiantDto {
  @ApiProperty({ description: 'Nom de famille', example: 'Moukoma' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom', example: 'Brady' })
  @IsString()
  prenom: string;

  @ApiPropertyOptional({ description: 'Matricule unique (auto-généré si absent)', example: '2024ASUR001' })
  @IsOptional()
  @IsString()
  matricule?: string;

  @ApiPropertyOptional({ description: 'Email (auto-généré si absent)', example: 'brady.moukoma@asur.fr' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Mot de passe (défaut: pass1234)', example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Date de naissance (optionnelle en import)', example: '2000-05-15' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_naissance?: Date;

  @ApiPropertyOptional({ description: 'Lieu de naissance (extrait du champ Excel combiné)', example: 'Libreville' })
  @IsOptional()
  @IsString()
  lieu_naissance?: string;

  @ApiPropertyOptional({ description: 'Type de bac (complétable ultérieurement)', example: 'C' })
  @IsOptional()
  @IsString()
  bac_type?: string;

  @ApiPropertyOptional({ description: 'Année du bac (complétable ultérieurement)', example: 2022 })
  @IsOptional()
  @IsInt()
  annee_bac?: number;

  @ApiPropertyOptional({ description: 'Provenance / établissement d\'origine', example: 'Lycée National Léon MBA' })
  @IsOptional()
  @IsString()
  provenance?: string;

  @ApiPropertyOptional({ description: 'ID de la classe', example: 'cuid...' })
  @IsOptional()
  @IsString()
  classeId?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'étudiant', enum: ['INSCRIT', 'REDOUBLANT', 'DIPLOME', 'ABANDONNE'] })
  @IsOptional()
  @IsEnum(['INSCRIT', 'REDOUBLANT', 'DIPLOME', 'ABANDONNE'])
  statut?: any;
}
