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
})
export class AppModule {}
