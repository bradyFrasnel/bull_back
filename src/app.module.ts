/**
 * ============================================================
 * Module racine de l'application Bull ASUR
 * ============================================================
 *
 * Ce module importe et orchestre tous les modules fonctionnels :
 * - ConfigModule : chargement des variables d'environnement (.env)
 * - PrismaModule : connexion à la base de données PostgreSQL
 * - AuthModule : authentification JWT multi-rôles
 * - Modules métier : matières, UE, semestres, évaluations, calculs, bulletins
 * - ProfilModule : gestion du profil utilisateur connecté
 *
 * Le HealthController est défini ici pour le monitoring (Render.com).
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MatieresModule } from './matieres/matieres.module';
import { UnitesEnseignementModule } from './unites-enseignement/unites-enseignement.module';
import { SemestresModule } from './semestres/semestres.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { CalculsModule } from './calculs/calculs.module';
import { ProfilModule } from './profil/profil.module';
import { BulletinsModule } from './bulletins/bulletins.module';
import { ClassesModule } from './classes/classes.module';
import { FilieresModule } from './filieres/filieres.module';
import { ImportModule } from './import/import.module';
import { MailModule } from './mail/mail.module';
import { AppController } from './app.controller';

import { HealthController } from './health/health.controller';
import { DashboardController } from './dashboard/dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard/dashboard.service';

/**
 * AppModule — Module racine de l'application.
 *
 * Hiérarchie des modules :
 * ┌─ AppModule (racine)
 * ├── ConfigModule      → Variables d'environnement globales
 * ├── PrismaModule      → Service ORM (base de données)
 * ├── AuthModule        → JWT, login, register, guards
 * ├── MatieresModule    → CRUD matières
 * ├── UnitesEnseignementModule → CRUD UE
 * ├── SemestresModule   → CRUD semestres
 * ├── EvaluationsModule → Saisie et gestion des notes
 * ├── CalculsModule     → Calculs des moyennes et résultats
 * ├── ProfilModule      → Profil utilisateur connecté
 * └── BulletinsModule   → Génération des bulletins
 */
@Module({
  imports: [
    // Charge les variables .env et les rend disponibles dans toute l'application
    ConfigModule.forRoot({
      isGlobal: true,  // Disponible dans tous les modules sans ré-import
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,              // Connexion base de données PostgreSQL via Prisma
    AuthModule,                // Authentification JWT + guards + stratégies
    MatieresModule,            // Gestion des matières (coefficient, crédits, UE)
    UnitesEnseignementModule,  // Gestion des Unités d'Enseignement
    SemestresModule,           // Gestion des semestres (S5, S6)
    EvaluationsModule,         // Saisie des notes (CC, Examen, Rattrapage) + Absences
    CalculsModule,             // Calcul des moyennes matière/UE/semestre/annuel
    ProfilModule,              // Profil utilisateur + changement de mot de passe
    BulletinsModule,           // Génération des bulletins S5, S6, annuel
    ClassesModule,             // Gestion des classes / promotions scolaires
    FilieresModule,            // Gestion des filières
    ImportModule,              // Import Excel (liste étudiants + relevé de notes)
    MailModule,                // Envoi d'emails (identifiants, etc.)
  ],
  controllers: [
    HealthController,  // GET /health — monitoring
    AppController, DashboardController,     // GET / — message d'accueil
  ],
  providers: [
    DashboardService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
