import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`\n\n=== Bull_ASUR Auth API ===`);
  console.log(`\n\n`);
  console.log(`\n\n`);
  console.log(`\n\n`);
  console.log(`\n\n`);
}

bootstrap();
