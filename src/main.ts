/**
 * 
 * Point d'entrée principal de l'application Bull ASUR (Backend)
 * 
 *
 * Ce fichier configure et démarre le serveur NestJS avec :
 * - Helmet pour les headers de sécurité HTTP
 * - CORS pour autoriser les requêtes du frontend React
 * - ValidationPipe globale pour valider toutes les entrées DTO
 * - Swagger/OpenAPI pour la documentation interactive de l'API
 * - Écoute sur toutes les interfaces réseau (0.0.0.0)
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  // Création de l'application NestJS à partir du module racine
  const app = await NestFactory.create(AppModule);

  // 
  // 1. SÉCURITÉ — Headers HTTP via Helmet

  // Helmet ajoute automatiquement des headers de sécurité (X-Content-Type-Options,
  // X-Frame-Options, etc.) pour protéger contre les attaques courantes.
  // crossOriginEmbedderPolicy et contentSecurityPolicy sont désactivés
  // car ils bloquent le chargement de Swagger UI.
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Nécessaire pour Swagger UI
    contentSecurityPolicy: false,     // Désactivé pour Swagger UI
  }));

  // 2. CORS — Cross-Origin Resource Sharing
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:4174',
    'https://bull-react.vercel.app'
  ];


  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/^"|"$/g, '').replace(/\/$/, ''))
    : [];


  const allowedOrigins = [...defaultOrigins, ...envOrigins];

  // Configuration CORS avec vérification dynamique de l'origine
  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, mobile, curl, etc.)
      if (!origin) return callback(null, true);

      // En mode développement : autoriser automatiquement tous les localhost
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
        return callback(null, true);
      }

      // Vérification souple : compare l'origin avec ou sans slash final
      if (allowedOrigins.some(allowed => origin === allowed || origin === allowed + '/')) {
        return callback(null, true);
      }

      // Si aucune correspondance, bloquer la requête CORS
      callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
    },
    credentials: true,  // Autoriser l'envoi de cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // 3. VALIDATION GLOBALE — ValidationPipe
  // whitelist: supprime automatiquement les propriétés non déclarées dans les DTO
  // forbidNonWhitelisted: rejette la requête si des propriétés inconnues sont envoyées
  // transform: convertit automatiquement les types (string → number, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 
  // 4. SWAGGER — Documentation API interactive
  // La documentation Swagger est uniquement disponible en mode développement.
  // En production, elle est désactivée pour des raisons de sécurité.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Bull_ASUR - API')
      .setDescription('API de gestion des bulletins de notes LP ASUR — INPTIC.')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Format: Bearer <votre_token_jwt>',
        },
        'JWT',  // Nom du schéma de sécurité référencé par @ApiBearerAuth()
      )
      .addTag('Authentification - Étudiants', 'Connexion et gestion étudiants')
      .addTag('Authentification - Enseignants', 'Connexion et gestion enseignants')
      .addTag('Authentification - Administration', 'Connexion admin et secrétariat')
      .build();

    // Génère le document OpenAPI et le monte sur /api/docs
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 
  // 5. DÉMARRAGE DU SERVEUR
  // 
  // Le serveur écoute sur 0.0.0.0 pour être accessible depuis
  // d'autres appareils sur le même réseau (mobile, tablette...).
  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');

  // Affichage des URLs d'accès en mode développement
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n Bull ASUR — Serveur démarré en mode développement`);
    console.log(``);
    console.log(`Local:      http://localhost:${port}`);
    console.log(`Réseau:     http://0.0.0.0:${port}`);
    console.log(`Swagger:    http://localhost:${port}/api/docs`);
    console.log(`Health:     http://localhost:${port}/health`);
    console.log(`\n`);
  } else {
    console.log(`Application démarrée en mode production sur le port ${port}`);
  }
}

// Lancement de l'application
bootstrap();
