import { IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Identifiant de connexion (prénom ou matricule)',
    example: 'jdupont',
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
  @MinLength(6)
  password: string;
}
