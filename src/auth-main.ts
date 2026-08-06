import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BasicAuthModule } from './auth/basic-auth.module';

async function bootstrap() {
  const app = await NestFactory.create(BasicAuthModule);

  // Configuration CORS
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',  // Vite dev (port alternatif)
      'http://localhost:4173',  // Vite preview
      'http://localhost:4174',  // Vite preview (port alternatif)
      'https://bull-react.vercel.app'
    ];

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, mobile, etc.)
      if (!origin) return callback(null, true);
      // En développement : autoriser tous les localhost
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      // En production : whitelist stricte
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
    .setTitle('Bull_ASUR - API Authentification')
    .setDescription(`
    API d'authentification pour la gestion des bulletins de notes.
    
    ## Identifiants de test
    - **Étudiant**: identifiant \`mmartin2024\`, mot de passe \`password123\`
    - **Enseignant**: identifiant \`jdupontweb\`, mot de passe \`password123\`
    - **Admin**: identifiant \`root\`, mot de passe \`root\`
    - **Secretariat**: identifiant \`admin\`, mot de passe \`admin\`
    
    ## Authentification
    Copiez le token JWT et utilisez-le dans l'en-tête Authorization.
    `)
    .setVersion('2.2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Auth API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs at: http://localhost:${port}/api/docs`);
}

bootstrap();
