# 📚 Documentation Bull ASUR - API Backend

## 🎯 Vue d'ensemble

API REST NestJS pour la gestion des bulletins de notes de la Licence Professionnelle ASUR (Administration et Sécurité des Réseaux).

**URL Production**: `https://bull-back-z97c.onrender.com`  
**Documentation Swagger**: `https://bull-back-z97c.onrender.com/api/docs`

---

## 📖 Documentation Disponible

### 1. [Guide d'Intégration React](./GUIDE_INTEGRATION_REACT.md)
**Pour les développeurs frontend**

Guide concis avec les éléments essentiels pour connecter un frontend React :
- Configuration Axios et gestion JWT
- Endpoints principaux avec exemples
- Hooks React (useAuth)
- Composants de base
- Gestion des erreurs
- Permissions par rôle

### 2. [API Endpoints Complet](./API_ENDPOINTS.md)
**Référence complète de l'API**

Documentation exhaustive de tous les endpoints :
- 64 endpoints détaillés
- Corps de requêtes et réponses
- Codes d'erreur
- Tests validés en production
- Exemples curl et Postman

### 3. [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
**Guide détaillé d'intégration**

Guide complet avec structure de projet complète :
- Architecture du projet React
- Services et types TypeScript
- Composants avancés
- Routes protégées
- Configuration TailwindCSS
- Déploiement

---

## 🚀 Démarrage Rapide

### Pour les développeurs frontend React

1. **Lire le [Guide d'Intégration React](./GUIDE_INTEGRATION_REACT.md)** (recommandé)
   - Contient l'essentiel pour démarrer rapidement
   - Exemples de code prêts à l'emploi
   - Configuration minimale

2. **Tester l'API avec Swagger**
   - Accéder à `https://bull-back-z97c.onrender.com/api/docs`
   - Tester les endpoints avec les identifiants de test
   - Comprendre les structures de données

3. **Consulter [API Endpoints](./API_ENDPOINTS.md)** pour les détails
   - Référence complète des endpoints
   - Exemples de requêtes/réponses
   - Gestion des erreurs

---

## 🔐 Authentification

### Endpoints de connexion

```
POST /auth/etudiant/login
POST /auth/enseignant/login
POST /auth/admin/login
POST /auth/secretariat/login
```

### Identifiants de test

| Rôle | Nom | Mot de passe |
|------|-----|--------------|
| Admin | root | root |
| Secrétariat | admin | admin |
| Étudiant | mmartin2024 | password123 |
| Enseignant | jdupontweb | password123 |

### Utilisation du token JWT

```typescript
// 1. Connexion
const response = await fetch('/auth/etudiant/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nom: 'mmartin2024', password: 'password123' })
});
const { access_token } = await response.json();

// 2. Utiliser le token
const data = await fetch('/profil', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

---

## 📊 Structure de l'API

### Modules principaux

1. **Authentification** (11 endpoints)
   - Connexion par rôle
   - Changement de mot de passe
   - Création de comptes

2. **Gestion Utilisateurs** (17 endpoints)
   - Étudiants (CRUD)
   - Enseignants (CRUD + matières)
   - Profil utilisateur

3. **Référentiel Académique** (18 endpoints)
   - Semestres
   - Unités d'Enseignement (UE)
   - Matières

4. **Évaluations** (9 endpoints)
   - Saisie des notes (CC, Examen, Rattrapage)
   - Consultation par étudiant/matière

5. **Calculs** (5 endpoints)
   - Moyennes matières
   - Moyennes UE
   - Résultats semestre

**Total : 64 endpoints**

---

## 🔒 Permissions

| Rôle | Authentification | Gestion Étudiants | Gestion Enseignants | Référentiel | Évaluations | Calculs |
|------|-----------------|-------------------|---------------------|-------------|-------------|---------|
| **ADMIN** | ✅ | CRUD | CRUD | CRUD | CRUD | Tous |
| **SECRETARIAT** | ✅ | CRUD | CRUD | CRUD | CRUD | Tous |
| **ENSEIGNANT** | ✅ | Lecture | Lecture (soi) | Lecture | CRUD | Matière/UE |
| **ETUDIANT** | ✅ | Lecture (soi) | - | Lecture | Lecture (soi) | - |

---

## 🛠️ Technologies

- **Framework**: NestJS 11
- **Base de données**: PostgreSQL
- **ORM**: Prisma 6
- **Authentification**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Déploiement**: Render

---

## 📁 Structure du Projet Backend

```
src/
├── auth/                    # Authentification JWT
│   ├── controllers/         # Contrôleurs par rôle
│   ├── dto/                 # DTOs de login/register
│   ├── guards/              # Guards JWT
│   └── strategies/          # Stratégies Passport
├── common/                  # Éléments partagés
│   ├── decorators/          # Décorateurs personnalisés
│   ├── enums/               # Énumérations (rôles, types)
│   └── guards/              # Guards de rôles
├── etudiants/               # Gestion étudiants
├── enseignants/             # Gestion enseignants
├── semestres/               # Gestion semestres
├── unites-enseignement/     # Gestion UE
├── matieres/                # Gestion matières
├── evaluations/             # Gestion évaluations
├── calculs/                 # Calculs académiques
├── profil/                  # Profil utilisateur
└── prisma/                  # Service Prisma
```

---

## 🔄 Workflow d'Intégration

### 1. Configuration initiale

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bull-back-z97c.onrender.com'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### 2. Authentification

```typescript
// services/auth.ts
import api from './api';

export const login = async (nom: string, password: string, role: string) => {
  const { data } = await api.post(`/auth/${role}/login`, { nom, password });
  localStorage.setItem('token', data.access_token);
  return data;
};
```

### 3. Appels API

```typescript
// Récupérer les semestres
const { data } = await api.get('/semestres');

// Créer un étudiant
const { data } = await api.post('/etudiants', {
  nom: 'Dupont',
  prenom: 'Marie',
  matricule: '2024ASUR001',
  email: 'marie.dupont@asur.fr',
  password: 'password123',
  date_naissance: '2000-05-15',
  lieu_naissance: 'Paris',
  bac_type: 'S',
  annee_bac: 2018,
  mention_bac: 'Bien'
});
```

---

## 🚨 Gestion des Erreurs

### Codes HTTP

- **200/201**: Succès
- **400**: Requête invalide
- **401**: Non authentifié
- **403**: Accès refusé
- **404**: Ressource non trouvée
- **500**: Erreur serveur

### Format des erreurs

```json
{
  "statusCode": 401,
  "message": "Identifiants invalides",
  "error": "Unauthorized"
}
```

---

## 📞 Support

### Documentation interactive
- **Swagger UI**: `https://bull-back-z97c.onrender.com/api/docs`
- Tester tous les endpoints directement
- Voir les schémas de données
- Exemples de requêtes/réponses

### Guides disponibles
1. [Guide d'Intégration React](./GUIDE_INTEGRATION_REACT.md) - Démarrage rapide
2. [API Endpoints](./API_ENDPOINTS.md) - Référence complète
3. [Frontend Integration](./FRONTEND_INTEGRATION.md) - Guide détaillé

---

## 🎯 Prochaines Étapes

### Pour les développeurs frontend

1. ✅ Lire le [Guide d'Intégration React](./GUIDE_INTEGRATION_REACT.md)
2. ✅ Configurer Axios avec intercepteurs JWT
3. ✅ Implémenter l'authentification
4. ✅ Créer les composants de base
5. ✅ Tester avec les identifiants de test
6. ✅ Consulter [API Endpoints](./API_ENDPOINTS.md) pour les détails

### Pour les développeurs backend

1. ✅ Consulter le schéma Prisma (`prisma/schema.prisma`)
2. ✅ Voir les contrôleurs dans `src/*/controllers`
3. ✅ Comprendre les DTOs dans `src/*/dto`
4. ✅ Tester avec Swagger

---

**Dernière mise à jour**: Avril 2026  
**Version API**: 1.0.0
