import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'etudiant@asur.fr',
    type: String
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Identifiant de connexion unique',
    example: 'mmartin',
    type: String
  })
  @IsString()
  identifiant: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 6 caractères)',
    example: 'password123',
    minLength: 6,
    type: String
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Nom de famille',
    example: 'Martin',
    type: String
  })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Prénom',
    example: 'Marie',
    type: String
  })
  @IsString()
  prenom: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    enum: UserRole,
    example: 'ETUDIANT'
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Matricule (obligatoire pour enseignants et étudiants)',
    example: '2024ASUR001',
    type: String
  })
  @IsOptional()
  matricule?: string;
}
