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
import { AppController } from './app.controller';

// Imports pour le HealthController inline
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * HealthController — Endpoint de vérification de l'état du serveur.
 *
 * Utilisé par Render.com pour monitorer la disponibilité de l'application.
 * Retourne le statut, le timestamp, la version et l'uptime du serveur.
 *
 * GET /health → { status: 'OK', timestamp, service, version, uptime }
 */
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
      uptime: process.uptime()  // Temps de fonctionnement en secondes
    };
  }
}

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
  ],
  controllers: [
    HealthController,  // GET /health — monitoring
    AppController,     // GET / — message d'accueil
  ],
})
export class AppModule {}
