import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminDto {
  @ApiProperty({
    description: 'Nom de l\'admin (utilisé comme identifiant)',
    example: 'Administrateur',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Mot de passe de l\'admin',
    example: 'admin123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
