import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginSecretariatDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur',
    type: String
  })
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Mot de passe',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @Length(6)
  password: string;
}
