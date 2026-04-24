import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdminDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur administrateur',
    example: 'admin01',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Email de l\'administrateur',
    example: 'admin@asur.fr',
    type: String
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'administrateur',
    example: 'password123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
