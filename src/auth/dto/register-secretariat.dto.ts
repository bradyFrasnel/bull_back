import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterSecretariatDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur du secrétariat',
    example: 'secretariat01',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Email du secrétariat',
    example: 'secretariat@asur.fr',
    type: String
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mot de passe du secrétariat',
    example: 'password123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
