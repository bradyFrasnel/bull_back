import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginEnseignantDto {
  @ApiProperty({
    description: 'Nom de l\'enseignant (utilisé comme identifiant)',
    example: 'Martin',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Mot de passe de l\'enseignant',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
