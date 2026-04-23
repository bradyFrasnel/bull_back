import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // Accepter toutes les origines en développement
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
    API d'authentification pour la gestion des bulletins de notes LP ASUR.
    
    ## Identifiants de test
    - **Admin (root)** : identifiant \`root\`, mot de passe \`root\`
    - **Secretariat (admin)** : identifiant \`admin\`, mot de passe \`admin\`
    - **Étudiant** : identifiant \`mmartin2024\`, mot de passe \`password123\`
    - **Enseignant** : identifiant \`jdupontweb\`, mot de passe \`password123\`
    
    ## Endpoints disponibles
    - \`/auth/etudiant/login\` - Connexion étudiant
    - \`/auth/enseignant/login\` - Connexion enseignant  
    - \`/auth/admin/login\` - Connexion admin/secretariat
    - \`/auth/etudiant/change-password\` - Changer mot de passe étudiant
    - \`/auth/enseignant/change-password\` - Changer mot de passe enseignant
    
    ## Authentification
    1. Testez la connexion avec les identifiants ci-dessus
    2. Copiez le token JWT retourné
    3. Cliquez sur le bouton "Authorize" en haut à droite
    4. Collez le token avec le préfixe \`Bearer\`
    `)
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
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger documentation available at: http://0.0.0.0:${port}/api/docs`);
  console.log(`Local access: http://localhost:${port}`);
  console.log(`Network access: http://0.0.0.0:${port}`);
}
bootstrap();
