import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdminDto {
  @ApiProperty({ description: 'Nom d\'utilisateur', example: 'admin01' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Email', example: 'admin@asur.fr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mot de passe (min 6 caractères)', example: 'Admin123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
