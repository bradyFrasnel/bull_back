import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginEtudiantDto {
  @ApiProperty({
    description: 'Nom de l\'étudiant (utilisé comme identifiant)',
    example: 'Dupont',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Mot de passe de l\'étudiant',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
