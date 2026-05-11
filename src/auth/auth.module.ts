import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthEtudiantController } from './controllers/auth-etudiant.controller';
import { AuthEnseignantController } from './controllers/auth-enseignant.controller';
import { AuthAdminController } from './controllers/auth-admin.controller';
import { AuthSecretariatController } from './controllers/auth-secretariat.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EnseignantsModule } from '../enseignats/enseignats.module';
import { EtudiantsModule } from '../etudiants/etudiants.module';

@Module({
  imports: [
    EnseignantsModule,
    EtudiantsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '24h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthEtudiantController,
    AuthEnseignantController,
    AuthAdminController,
    AuthSecretariatController
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
