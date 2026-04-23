import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BasicAuthModule } from './auth/basic-auth.module';
import { MatieresModule } from './matieres/matieres.module';
import { UnitesEnseignementModule } from './unites-enseignement/unites-enseignement.module';
import { SemestresModule } from './semestres/semestres.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { CalculsModule } from './calculs/calculs.module';
import { ProfilModule } from './profil/profil.module';

// Controller Health pour Render
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Vérifier l\'état de l\'application' })
  getHealth() {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Bull ASUR API',
      version: '1.0.0',
      uptime: process.uptime()
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    BasicAuthModule,
    MatieresModule,
    UnitesEnseignementModule,
    SemestresModule,
    EvaluationsModule,
    CalculsModule,
    ProfilModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
