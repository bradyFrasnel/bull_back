import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginSecretariatDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur du secrétariat',
    example: 'admin',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Mot de passe du secrétariat',
    example: 'admin',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
