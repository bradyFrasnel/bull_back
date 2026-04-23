# 🚀 Déploiement Render.com - Bull ASUR

## 🎯 Objectif

Guide complet pour déployer l'application Bull ASUR sur Render.com avec NestJS + Prisma + PostgreSQL.

---

## 📋 Prérequis

- ✅ **Dépôt GitHub** : `https://github.com/bradyFrasnel/bull_back.git`
- ✅ **Compte Render.com** : Créé et connecté à GitHub
- ✅ **Code prêt** : Package.json optimisé pour Render

---

## 🛠 Configuration Optimisée

### **1. package.json - Scripts Render**
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/src/main",
    "build:render": "npm install && npx prisma generate && npx prisma migrate deploy && npm run build"
  }
}
```

### **2. render.yaml - Configuration automatique**
```yaml
services:
  - type: web
    name: bull-back-api
    runtime: node
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3002
      - key: DATABASE_URL
        fromDatabase:
          name: bull-back-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://bull-back-api.onrender.com

databases:
  - name: bull-back-db
    plan: free
```

---

## 🚀 Étapes de Déploiement

### **Option A : Manuel (Dashboard Render)**

#### **1. Créer la base de données**
1. **Dashboard Render** → "New" → "PostgreSQL"
2. **Name** : `bull-back-db`
3. **Plan** : `Free`
4. **Region** : Choisissez la plus proche
5. **Create Database**

#### **2. Créer le Web Service**
1. **Dashboard Render** → "New" → "Web Service"
2. **Connect Repository** → Choisissez `bull_back`
3. **Configuration** :
   ```
   Name: bull-back-api
   Runtime: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   Start Command: npm run start:prod
   Instance Type: Free
   ```

#### **3. Variables d'environnement**
Ajoutez dans **Environment > Environment Variables** :
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...   # URL fournie par Render
JWT_SECRET=ton_secret_jwt_unique
PORT=3002
FRONTEND_URL=https://bull-back-api.onrender.com
```

#### **4. Déployer**
- **Create Web Service**
- Render va automatiquement builder et déployer

### **Option B : Automatique (render.yaml)**

1. **Pousser render.yaml** sur GitHub :
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Dashboard Render** → "New" → "Web Service"
3. **Connect Repository** → Choisissez `bull_back`
4. Render détectera automatiquement `render.yaml`
5. **Create Web Service**

---

## 🔧 Configuration Technique

### **Build Command Explained**
```bash
npm install                    # Install dependencies
npx prisma generate            # Generate Prisma client
npx prisma migrate deploy      # Run database migrations
npm run build                   # Build NestJS application
```

### **Start Command Explained**
```bash
npm run start:prod             # Start production server
# Exécute: node dist/src/main
```

### **Variables d'environnement critiques**
```bash
NODE_ENV=production            # Mode production
DATABASE_URL=postgresql://...  # Connexion PostgreSQL
JWT_SECRET=clé_secrète_unique   # Sécurité JWT
PORT=3002                      # Port d'écoute
FRONTEND_URL=https://...       # CORS configuration
```

---

## 📊 Architecture sur Render

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│   Render Build  │───▶│   Render App    │
│   bull_back     │    │   npm install   │    │   Node.js       │
│   main branch   │    │   prisma gen    │    │   Port 3002     │
└─────────────────┘    │   prisma migrate │    └─────────────────┘
                       │   nest build    │              │
                       └─────────────────┘              │
                                                        ▼
                                              ┌─────────────────┐
                                              │ Render PostgreSQL│
                                              │ bull-back-db    │
                                              │ Port 5432       │
                                              └─────────────────┘
```

---

## 🎯 Points d'Accès Post-Déploiement ✅ **DÉPLOYÉ**

### **URLs Production**
```
🌐 API:          https://bull-back-z97c.onrender.com
📚 Swagger:      https://bull-back-z97c.onrender.com/api/docs
💓 Health Check: https://bull-back-z97c.onrender.com/health
```

### **Test d'authentification**
```bash
curl -X POST https://bull-back-z97c.onrender.com/auth/etudiant/login \
  -H "Content-Type: application/json" \
  -d '{"nom":"mmartin2024","password":"password123"}'
```

---

## 🔍 Monitoring et Logs

### **Dashboard Render**
- **Logs** : Voir les logs de build et runtime
- **Metrics** : CPU, mémoire, requêtes
- **Events** : Déploiements, erreurs, redémarrages

### **Health Check**
L'application inclut un endpoint health :
```typescript
@Get('health')
getHealth() {
  return { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bull ASUR API'
  };
}
```

---

## 🚨 Dépannage Commun

### **Build Failed**
1. **Vérifier les logs** dans Render Dashboard
2. **Prisma generate** : Assurez-vous que le schéma est valide
3. **Dependencies** : Vérifiez package.json
4. **TypeScript** : Vérifiez tsconfig.json

### **Database Connection Failed**
1. **DATABASE_URL** : Copiez exactement depuis Render PostgreSQL
2. **SSL** : Render utilise SSL automatiquement
3. **Migrations** : `prisma migrate deploy` doit réussir

### **Application Not Starting**
1. **Start Command** : `npm run start:prod`
2. **Port** : Render utilise automatiquement le port configuré
3. **Environment** : Vérifiez toutes les variables

### **CORS Issues**
```bash
# En production, configurez correctement
FRONTEND_URL=https://votredomaine-frontend.com
```

---

## 📱 Tests Post-Déploiement

### **1. Test de base**
```bash
curl https://bull-back-z97c.onrender.com/health
```

### **2. Test Swagger**
```bash
curl https://bull-back-z97c.onrender.com/api/docs
```

### **3. Test authentification**
```bash
curl -X POST https://bull-back-z97c.onrender.com/auth/etudiant/login \
  -H "Content-Type: application/json" \
  -d '{"nom":"mmartin2024","password":"password123"}'
```

### **4. Test profil utilisateur**
```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  https://bull-back-z97c.onrender.com/profil
```

---

## 🔄 Mises à Jour

### **Déployer une nouvelle version**
1. **Pousser sur main** :
   ```bash
   git add .
   git commit -m "Nouvelle fonctionnalité"
   git push origin main
   ```

2. **Render déploie automatiquement** :
   - Détection du push
   - Build automatique
   - Déploiement progressif

### **Rollback**
1. **Revenir à un commit précédent** :
   ```bash
   git reset --hard <commit_hash>
   git push --force origin main
   ```

---

## 🎯 Checklist Déploiement

- [ ] **Dépôt GitHub** : `bull_back` avec branch `main`
- [ ] **Package.json** : Scripts build et start configurés
- [ ] **render.yaml** : Configuration automatique
- [ ] **Base PostgreSQL** : Créée sur Render
- [ ] **Variables d'environnement** : Configurées
- [ ] **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- [ ] **Start Command** : `npm run start:prod`
- [ ] **Tests API** : Authentification fonctionnelle
- [ ] **Documentation** : Swagger accessible

---

## 📞 Support Render

### **Liens utiles**
- **Documentation** : https://render.com/docs
- **Status** : https://status.render.com
- **Support** : https://render.com/support

### **Commandes utiles**
```bash
# Vérifier la configuration locale
npm run build:render

# Tester localement comme Render
NODE_ENV=production npm run start:prod
```

---

**🚀 Votre application Bull ASUR est maintenant prête pour le déploiement sur Render.com !**

Suivez ce guide pour un déploiement réussi. L'application sera accessible via HTTPS avec une base de données PostgreSQL gérée. ✨
