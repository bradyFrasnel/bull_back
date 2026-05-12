import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Headers de sécurité HTTP
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Nécessaire pour Swagger UI
    contentSecurityPolicy: false,     // Désactivé pour Swagger UI
  }));

  // Configuration CORS
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:5174',  // Vite dev (port alternatif)
        'http://localhost:4173',  // Vite preview
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, mobile, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Configuration globale de validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration Swagger
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
      'JWT',
    )
    .addTag('Authentification - Étudiants', 'Connexion et gestion étudiants')
    .addTag('Authentification - Enseignants', 'Connexion et gestion enseignants')
    .addTag('Authentification - Administration', 'Connexion admin et secrétariat')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  
  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`L'application est lancée sur: http://0.0.0.0:${port}`);
  console.log(`La documentation Swagger accessible sur: http://0.0.0.0:${port}/api/docs`);
  console.log(`Accès local: http://localhost:${port}`);
  console.log(`Accès réseau: http://0.0.0.0:${port}`);
}
bootstrap();
