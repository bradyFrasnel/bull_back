import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BasicAuthService } from './basic-auth.service';
import { AuthService } from './auth.service';
import { AuthEtudiantController } from './controllers/auth-etudiant.controller';
import { AuthEnseignantController } from './controllers/auth-enseignant.controller';
import { AuthAdminController } from './controllers/auth-admin.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthEtudiantController,
    AuthEnseignantController,
    AuthAdminController
  ],
  providers: [BasicAuthService, AuthService],
  exports: [BasicAuthService],
})
export class BasicAuthModule {}
