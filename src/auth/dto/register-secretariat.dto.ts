import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterSecretariatDto {
  @ApiProperty({ description: 'Nom d\'utilisateur', example: 'secretariat01' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Email', example: 'secretariat@asur.fr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mot de passe (min 6 caractères)', example: 'Secret123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
