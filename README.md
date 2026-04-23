# 🎓 Bull ASUR - Gestion des Bulletins de Notes

Backend Nest.js complet pour la gestion des bulletins de notes de la Licence Professionnelle ASUR de l'INPTIC.

## 🚀 Fonctionnalités Complètes

### **🔐 Authentification Multi-rôles**
- JWT sécurisé avec tokens Bearer
- 4 rôles : Étudiant, Enseignant, Secretariat, Administrateur
- Changement de mot de passe sécurisé
- Guards et validation par rôle

### **👥 Gestion Utilisateurs**
- CRUD complet pour tous les rôles
- Profils adaptés selon le rôle
- Service profil utilisateur
- Préférences personnalisables

### **📚 Référentiel Académique**
- CRUD Matières/UE/Semestres
- Structure hiérarchique complète
- Coefficients et crédits

### **📝 Système d'Évaluations**
- Saisie notes : CC, Examen, Rattrapage
- **Règle rattrapage** : Uniquement si moyenne < 6
- **Calcul intelligent** : 2 meilleures notes
- Validation automatique

### **🧮 Calculs Académiques**
- Recalcul en cascade automatique
- Moyennes matière/UE/semestre
- Résultats académiques
- Service de calculs complet

### **📊 API Complète**
- **68 endpoints** RESTful
- Documentation Swagger interactive
- Validation robuste des entrées
- Gestion des erreurs

## 🛠 Stack Technique

- **Framework**: Nest.js avec TypeScript
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: JWT avec guards et rôles
- **Validation**: class-validator et class-transformer
- **Documentation**: Swagger/OpenAPI
- **Sécurité**: bcrypt, CORS configuré
- **Réseau**: Écoute 0.0.0.0 (tous réseaux)

## 🚀 Installation

### **1. Cloner le projet**
```bash
git clone https://github.com/votre-username/bull-asur.git
cd bull-asur
```

### **2. Installer les dépendances**
```bash
npm install
```

### **3. Configurer la base de données**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables
DATABASE_URL="postgresql://username:password@localhost:5432/bull_asur_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3002
```

### **4. Initialiser Prisma**
```bash
npx prisma generate
npx prisma db push
```

### **5. Démarrer l'application**
```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🌐 Accès

### **API**
- **Local** : http://localhost:3002
- **Réseau** : http://0.0.0.0:3002
- **Swagger** : http://localhost:3002/api/docs

### **Identifiants de test**
| Rôle | Nom | Mot de passe |
|-------|------|-------------|
| Admin | root | root |
| Secretariat | admin | admin |
| Étudiant | mmartin2024 | password123 |
| Enseignant | jdupontweb | password123 |

## 📚 Documentation

- **[API Endpoints](./doc/API_ENDPOINTS.md)** : Référence complète des 68 endpoints
- **[Connexion Frontend](./doc/CONNEXION_FRONTEND.md)** : Guide d'intégration JWT
- **[Service Profil](./doc/SERVICE_PROFIL.md)** : Gestion des profils utilisateurs
- **[Configuration Réseau](./doc/NETWORK_CONFIGURATION.md)** : Accès multi-appareils

## 🚀 Déploiement

### **Render.com**
1. **Créer un compte** sur [Render](https://render.com)
2. **Connecter GitHub** au compte Render
3. **Créer un Web Service**
   - Repository : bull-asur
   - Runtime : Node
   - Build Command : `npm install && npm run build`
   - Start Command : `npm run start:prod`
4. **Configurer les variables d'environnement**
   - `DATABASE_URL` : URL de la base de données PostgreSQL
   - `JWT_SECRET` : Clé secrète JWT
   - `PORT` : 3002
   - `NODE_ENV` : production
   - `FRONTEND_URL` : URL du frontend en production

### **Variables d'environnement Production**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=votre-cle-secrete-production
PORT=3002
FRONTEND_URL=https://votredomaine.com
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Couverture de code
npm run test:cov
```

## 📊 Statistiques

- **68 endpoints** API
- **4 rôles** utilisateurs
- **5 modules** fonctionnels
- **100%** TypeScript
- **Sécurité** JWT + bcrypt
- **Documentation** Swagger complète

1. Cloner le projet
2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

4. Générer le client Prisma :
```bash
npx prisma generate
```

5. Appliquer le schéma de base de données :
```bash
npx prisma db push
# ou pour un environnement de développement avec migrations
npx prisma migrate dev
```

## Démarrage

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

## Documentation API

Une fois l'application démarrée, accédez à la documentation Swagger :
- URL : http://localhost:3001/api

## Modules Principaux

### Authentification
- Login/Register
- JWT tokens
- Guards par rôles (Admin, Enseignant, Secrétariat, Étudiant)

### Utilisateurs
- CRUD utilisateurs
- Gestion des rôles

### Étudiants
- Gestion des fiches étudiants
- Liaison avec comptes utilisateurs

### Référentiel Académique
- Semestres (S5, S6)
- Unités d'Enseignement (UE)
- Matières avec coefficients et crédits

### Évaluations
- Saisie des notes (CC, Examen, Rattrapage)
- Contrôle de cohérence
- Historique des modifications

### Calculs
- Moyennes de matière (CC 40% + Examen 60%)
- Moyennes d'UE avec coefficients
- Moyennes de semestre
- Règles de compensation
- Crédits acquis

### Bulletins
- Génération PDF des bulletins S5, S6 et annuel
- Export HTML
- Statistiques de promotion

### Import/Export
- Import Excel des notes
- Export des relevés
- Format compatible avec le fichier de référence

## Règles Métier Implémentées

### Calcul des moyennes
- **Matière** : (Note CC × 40%) + (Note Examen × 60%)
- **Rattrapage** : remplace la moyenne de la matière
- **UE** : moyenne pondérée des matières
- **Semestre** : moyenne pondérée des UE
- **Annuel** : (Moyenne S5 + Moyenne S6) / 2

### Validation et Crédits
- **UE acquise** si moyenne ≥ 10/20
- **Compensation** si moyenne semestre ≥ 10/20
- **Semestre validé** si ≥ 30 crédits acquis
- **Diplôme** si 60 crédits acquis (2 semestres)

### Mentions
- Passable : 10 ≤ moyenne < 12
- Assez Bien : 12 ≤ moyenne < 14
- Bien : 14 ≤ moyenne < 16
- Très Bien : moyenne ≥ 16

## Structure du Projet

```
src/
├── auth/                 # Authentification et JWT
├── users/               # Gestion des utilisateurs
├── students/            # Gestion des étudiants
├── academic/            # Référentiel pédagogique
├── evaluations/         # Gestion des notes
├── calculations/        # Service de calcul des moyennes
├── bulletins/           # Génération PDF
├── imports/             # Import/Export Excel
├── common/              # Guards, décorateurs, enums
├── prisma/              # Service Prisma
└── main.ts              # Point d'entrée
```

## Scripts Disponibles

```bash
# Développement
npm run start:dev        # Démarrer avec hot reload
npm run start:debug      # Démarrer en mode debug

# Production
npm run build           # Compiler le projet
npm run start:prod      # Démarrer en production

# Tests
npm run test            # Lancer les tests
npm run test:cov        # Tests avec couverture
npm run test:e2e        # Tests end-to-end

# Prisma
npm run prisma:generate  # Générer le client
npm run prisma:push     # Appliquer le schéma
npm run prisma:migrate   # Créer des migrations
npm run prisma:studio    # Ouvrir Prisma Studio
```

## Configuration

Variables d'environnement requises :

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bull_asur_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Server
PORT=3001
```

## Sécurité

- Authentification JWT
- Guards par rôles
- Validation des entrées
- Hashage des mots de passe (bcrypt)
- CORS configuré

## Performance

- Calculs optimisés avec Prisma
- Mise en cache possible avec Redis
- Requêtes batch pour les promotions

## Déploiement

Le projet est prêt pour le déploiement sur :
- Docker (containerisation)
- Heroku, Railway, Vercel
- Serveur dédié avec PM2

## Contribuer

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Créer une Pull Request

## Licence

Projet réalisé dans le cadre pédagogique de l'INPTIC - LP ASUR.
