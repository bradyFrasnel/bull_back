# 📚 Documentation Bull ASUR — API Backend

## 🎯 Vue d'ensemble

API REST NestJS pour la gestion des bulletins de notes de la Licence Professionnelle ASUR (Administration et Sécurité des Réseaux) — INPTIC.

**URL Production** : `https://bull-back-z97c.onrender.com`  
**Documentation Swagger** : `https://bull-back-z97c.onrender.com/api/docs`  
**Health Check** : `https://bull-back-z97c.onrender.com/health`

---

## ✅ État du Backend — Prêt pour l'intégration Frontend

| Domaine | Statut |
|---------|--------|
| Authentification JWT | ✅ Opérationnel |
| Gestion des rôles (RBAC) | ✅ Opérationnel |
| CRUD Référentiels (Semestres, UE, Matières) | ✅ Opérationnel |
| CRUD Étudiants / Enseignants | ✅ Opérationnel |
| Saisie des évaluations (CC, Examen, Rattrapage) | ✅ Opérationnel |
| Calculs automatiques (moyennes, crédits) | ✅ Opérationnel |
| Endpoints Bulletins (agrégation données PDF) | ✅ Opérationnel |
| Sécurité (Guards, Helmet, CORS, bcrypt) | ✅ Opérationnel |
| Déploiement Render + Supabase | ✅ Opérationnel |

---

## 📖 Documentation Disponible

### 1. [Guide d'Intégration React](./GUIDE_INTEGRATION_REACT.md) ← **Commencer ici**
Guide concis avec tout ce qu'il faut pour connecter le frontend :
- Configuration Axios + JWT
- Tous les endpoints avec exemples
- Endpoints bulletins (données agrégées pour PDF)
- Permissions par rôle
- Gestion des erreurs

### 2. [API Endpoints Complet](./API_ENDPOINTS.md)
Référence exhaustive des 67 endpoints.

### 3. [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
Guide détaillé avec structure de projet React complète.

---

## 🔐 Authentification

### Endpoints de connexion

```
POST /auth/etudiant/login
POST /auth/enseignant/login
POST /auth/admin/login
POST /auth/secretariat/login
```

### Endpoints de création de comptes (protégés)

```
POST /auth/admin/register          → Admin uniquement (token requis)
POST /auth/secretariat/register    → Admin uniquement (token requis)
POST /auth/admin/create-enseignant → Admin + Secretariat (token requis)
POST /auth/admin/create-etudiant   → Admin + Secretariat (token requis)
```

### Format de connexion

```json
{ "nom": "string", "password": "string" }
```

### Réponse

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "nom": "...", "email": "...", "role": "ADMINISTRATEUR" }
}
```

### Utilisation du token

```http
Authorization: Bearer <access_token>
```

---

## 📊 Structure de l'API — 67 Endpoints

### 1. Authentification (11 endpoints)
- Connexion par rôle (4)
- Création de comptes protégée (4)
- Changement de mot de passe (2)
- Profil secrétariat (1)

### 2. Gestion Utilisateurs (17 endpoints)
- Étudiants CRUD (7)
- Enseignants CRUD + gestion matières (10)

### 3. Profil (5 endpoints)
- Profil connecté, mise à jour, changement mot de passe, préférences

### 4. Référentiel Académique (18 endpoints)
- Semestres (6)
- Unités d'Enseignement (6)
- Matières (6)

### 5. Évaluations (9 endpoints)
- Saisie CC / Examen / Rattrapage
- Consultation par étudiant, matière, type

### 6. Calculs (5 endpoints)
- Moyenne matière, UE, semestre
- Recalcul complet

### 7. Bulletins (3 endpoints) ← Clé pour le frontend
- `GET /bulletins/etudiant/:id/semestre/:id` — Données bulletin S5 ou S6
- `GET /bulletins/etudiant/:id/annuel` — Données bulletin annuel
- `GET /bulletins/promotion/semestre/:id` — Récapitulatif promotion

---

## 🔒 Sécurité

### Mesures en place
- ✅ JWT avec expiration 24h
- ✅ Bcrypt (hash mots de passe, 10 rounds)
- ✅ Guards JWT + RBAC sur tous les endpoints sensibles
- ✅ Helmet (headers de sécurité HTTP)
- ✅ CORS avec whitelist d'origines
- ✅ ValidationPipe global (whitelist, forbidNonWhitelisted)
- ✅ Endpoints register/create protégés par rôle

### Permissions par rôle

| Endpoint | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|----------|-------|-------------|------------|----------|
| Créer admin/secretariat | ✅ | ❌ | ❌ | ❌ |
| Créer enseignant/étudiant | ✅ | ✅ | ❌ | ❌ |
| CRUD Référentiels | ✅ | ✅ | Lecture | Lecture |
| CRUD Étudiants | ✅ | ✅ | Lecture | Soi |
| CRUD Évaluations | ✅ | ✅ | ✅ | Lecture |
| Calculs | ✅ | ✅ | Matière/UE | ❌ |
| Bulletins | ✅ | ✅ | ✅ | Soi |
| Recap promotion | ✅ | ✅ | ❌ | ❌ |

---

## 🛠️ Technologies

- **Framework** : NestJS 11
- **Base de données** : PostgreSQL (Supabase)
- **ORM** : Prisma 6
- **Auth** : JWT + Passport
- **Sécurité** : Helmet, bcrypt, CORS whitelist
- **Validation** : class-validator
- **Documentation** : Swagger/OpenAPI
- **Déploiement** : Render

---

## 🚀 Démarrage Rapide Frontend

### 1. Configurer Axios

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bull-back-z97c.onrender.com',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Se connecter

```typescript
const { data } = await api.post('/auth/admin/login', {
  nom: 'root',
  password: 'BradyRoot1'
});
localStorage.setItem('token', data.access_token);
```

### 3. Récupérer les données d'un bulletin

```typescript
const { data } = await api.get(`/bulletins/etudiant/${etudiantId}/semestre/${semestreId}`);
// → Toutes les données prêtes pour générer le PDF
```

### 4. Générer le PDF (frontend)

```bash
npm install @react-pdf/renderer
```

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BulletinPDF } from './components/BulletinPDF';

<PDFDownloadLink
  document={<BulletinPDF data={bulletinData} />}
  fileName={`bulletin_${matricule}_${semestre}.pdf`}
>
  Télécharger
</PDFDownloadLink>
```

---

## 🚨 Codes d'Erreur

| Code | Signification |
|------|---------------|
| 200/201 | Succès |
| 400 | Requête invalide (champs manquants, règle métier) |
| 401 | Token manquant ou expiré |
| 403 | Permissions insuffisantes |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

```json
{ "statusCode": 401, "message": "Identifiants invalides", "error": "Unauthorized" }
```

---

## ⚠️ Notes importantes

- Les comptes étudiants/enseignants créés **avant le 12/05/2026** ont leur mot de passe stocké en clair (bug corrigé). Ces comptes doivent être **supprimés et recréés** pour pouvoir se connecter.
- Le hashage bcrypt est maintenant appliqué sur tous les endpoints de création : `POST /etudiants`, `POST /enseignants`, `POST /auth/admin/create-etudiant`, `POST /auth/admin/create-enseignant`.

---

## 📋 Ce qui reste à faire (Frontend)

| Fonctionnalité | Responsabilité |
|----------------|----------------|
| Interface de connexion par rôle | Frontend |
| Dashboard par rôle | Frontend |
| Formulaires CRUD étudiants/enseignants | Frontend |
| Saisie des notes | Frontend |
| Déclenchement des calculs | Frontend → `POST /calculs/...` |
| Modélisation et génération bulletins PDF | Frontend (`@react-pdf/renderer`) |
| Tableau récapitulatif promotion | Frontend → `GET /bulletins/promotion/...` |
| Import Excel des notes | À implémenter (backend + frontend) |

---

**Dernière mise à jour** : Mai 2026 — v1.1.0  
**Backend** : ✅ Prêt pour l'intégration frontend
