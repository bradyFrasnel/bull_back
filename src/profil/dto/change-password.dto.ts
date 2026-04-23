import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    example: 'oldPassword123',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'newPassword456',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/, {
    message: 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre'
  })
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Confirmation du nouveau mot de passe',
    example: 'newPassword456',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  newPasswordConfirmation: string;
}
