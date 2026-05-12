# 🚀 Guide d'Intégration Frontend React — Bull ASUR

> **Backend prêt** ✅ — Ce guide est la référence pour l'intégration frontend.

## URLs

| Environnement | URL |
|---------------|-----|
| Production | `https://bull-back-z97c.onrender.com` |
| Développement | `http://localhost:3000` |
| Swagger local | `http://localhost:3000/api/docs` |

---

## 1. Configuration Axios

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bull-back-z97c.onrender.com',
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
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**.env.local**
```env
VITE_API_URL=http://localhost:3000
```

**.env.production**
```env
VITE_API_URL=https://bull-back-z97c.onrender.com
```

---

## 2. Authentification — 4 pages distinctes

Chaque page de connexion appelle son propre endpoint. Body identique pour tous :

```json
{ "nom": "string", "password": "string" }
```

| Page | Endpoint | Réponse |
|------|----------|---------|
| `/login/admin` | `POST /auth/admin/login` | `{ access_token, admin: { id, nom, email, role } }` |
| `/login/secretariat` | `POST /auth/secretariat/login` | `{ access_token, secretariat: { id, utilisateurId, nom, email, role } }` |
| `/login/enseignant` | `POST /auth/enseignant/login` | `{ access_token, enseignant: { id, nom, prenom, email, role } }` |
| `/login/etudiant` | `POST /auth/etudiant/login` | `{ access_token, etudiant: { id, nom, prenom, email, role } }` |

```typescript
// src/services/auth.service.ts
import api from './api';

export const login = async (nom: string, password: string, role: string) => {
  const { data } = await api.post(`/auth/${role}/login`, { nom, password });
  localStorage.setItem('token', data.access_token);
  // Extraire l'objet utilisateur selon le rôle
  const user = data.admin ?? data.secretariat ?? data.enseignant ?? data.etudiant;
  localStorage.setItem('user', JSON.stringify(user));
  return { token: data.access_token, user };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
```

---

## 3. Hook useAuth

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/profil')
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading, isAuthenticated: !!user };
};
```

---

## 4. Création de comptes (Admin uniquement)

Ces endpoints nécessitent un token admin dans le header.

```typescript
// Créer un secrétariat
POST /auth/secretariat/register
{ "nom": "string", "email": "string", "password": "string" }

// Créer un enseignant
POST /auth/admin/create-enseignant
{ "nom": "string", "prenom": "string", "matricule": "string", "email": "string", "password": "string", "specialite": "string?" }

// Créer un étudiant
POST /auth/admin/create-etudiant
{
  "nom": "string", "prenom": "string", "matricule": "string",
  "email": "string", "password": "string",
  "date_naissance": "YYYY-MM-DD", "lieu_naissance": "string",
  "bac_type": "string", "annee_bac": 2020,
  "provenance": "string"
}
```

---

## 5. Référentiel Académique

```typescript
// Semestres
GET  /semestres                          // Lister
GET  /semestres/:id                      // Détails
GET  /semestres/annee/:annee             // Par année ex: "2024-2025"
POST /semestres                          // { code, libelle, anneeUniversitaire }
PUT  /semestres/:id
DEL  /semestres/:id

// Unités d'Enseignement
GET  /unites-enseignement
GET  /unites-enseignement/:id
GET  /unites-enseignement/semestre/:semestreId
POST /unites-enseignement                // { code, libelle, semestreId }
PUT  /unites-enseignement/:id
DEL  /unites-enseignement/:id

// Matières
GET  /matieres
GET  /matieres/:id
GET  /matieres/ue/:ueId
POST /matieres                           // { libelle, coefficient, credits, uniteEnseignementId }
PUT  /matieres/:id
DEL  /matieres/:id
```

---

## 6. Étudiants & Enseignants

```typescript
// Étudiants
GET  /etudiants                          // ADMIN, SECRETARIAT, ENSEIGNANT
GET  /etudiants/:id                      // id = utilisateurId
GET  /etudiants/matricule/:matricule
GET  /etudiants/user/:userId
POST /etudiants                          // ADMIN, SECRETARIAT
PUT  /etudiants/:id                      // ADMIN, SECRETARIAT
DEL  /etudiants/:id                      // ADMIN uniquement

// Body POST /etudiants
// {
//   "nom": "string", "prenom": "string", "matricule": "string",
//   "email": "string", "password": "string",
//   "date_naissance": "YYYY-MM-DD", "lieu_naissance": "string",
//   "bac_type": "string", "annee_bac": 2020,
//   "provenance": "string"
// }

// Enseignants
GET  /enseignants                        // ADMIN, SECRETARIAT
GET  /enseignants/:id
GET  /enseignants/user/:userId
GET  /enseignants/:id/matieres           // Matières d'un enseignant
GET  /enseignants/matieres/:matiereId/enseignants
POST /enseignants                        // ADMIN, SECRETARIAT
POST /enseignants/:id/matieres/:matiereId  // Assigner matière
PUT  /enseignants/:id
DEL  /enseignants/:id                    // ADMIN uniquement
DEL  /enseignants/:id/matieres/:matiereId  // Retirer matière
```

---

## 7. Évaluations

```typescript
GET  /evaluations                        // SECRETARIAT, ENSEIGNANT
GET  /evaluations/:id
GET  /evaluations/etudiant/:etudiantId
GET  /evaluations/matiere/:matiereId     // SECRETARIAT, ENSEIGNANT
GET  /evaluations/type/:type             // CC | EXAMEN | RATTRAPAGE
GET  /evaluations/etudiant/:etudiantId/matiere/:matiereId
POST /evaluations                        // SECRETARIAT, ENSEIGNANT
PUT  /evaluations/:id
DEL  /evaluations/:id
```

**Body POST :**
```json
{
  "utilisateurId": "string",
  "matiereId": "string",
  "type": "CC | EXAMEN | RATTRAPAGE",
  "note": 15.5,
  "saisiePar": "string"
}
```

> ⚠️ Rattrapage autorisé uniquement si moyenne CC+Examen < 6/20. Sinon → erreur 400.

---

## 8. Calculs

```typescript
// Déclencher après chaque saisie de note
POST /calculs/etudiant/:etudiantId/matiere/:matiereId     // SECRETARIAT, ENSEIGNANT
POST /calculs/etudiant/:etudiantId/ue/:ueId               // SECRETARIAT, ENSEIGNANT
POST /calculs/etudiant/:etudiantId/semestre/:semestreId   // ADMIN, SECRETARIAT
POST /calculs/etudiant/:etudiantId/recalculer-tout        // ADMIN, SECRETARIAT
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details
```

> ℹ️ Le calcul matière est déclenché automatiquement à chaque création d'évaluation.

---

## 9. Bulletins — Données pour PDF

```typescript
// Bulletin semestre (S5 ou S6)
GET /bulletins/etudiant/:etudiantId/semestre/:semestreId

// Bulletin annuel
GET /bulletins/etudiant/:etudiantId/annuel

// Récapitulatif promotion — ADMIN, SECRETARIAT uniquement
GET /bulletins/promotion/semestre/:semestreId
```

**Structure réponse bulletin semestre :**
```typescript
{
  etudiant: { id, nom, prenom, matricule, dateNaissance, lieuNaissance, email };
  semestre: { id, code, libelle, anneeUniversitaire };
  ues: [{
    id, code, libelle, creditsTotal, moyenne, creditsAcquis, acquise, compensee,
    matieres: [{ id, libelle, coefficient, credits, noteCC, noteExamen, noteRattrapage, moyenne, rattrapageUtilise, absences }]
  }];
  resultat: { moyenneSemestre, creditsTotal, valide } | null;
  statistiques: { moyenneClasse, noteMin, noteMax, ecartType, nbEtudiants };
}
```

**Structure réponse bulletin annuel :**
```typescript
{
  etudiant: { ... };
  semestres: [{ semestre, ues, resultat, statistiques }];
  resultatAnnuel: {
    moyenneAnnuelle: number | null;
    mention: 'PASSABLE' | 'ASSEZ_BIEN' | 'BIEN' | 'TRES_BIEN' | null;
    decisionJury: 'DIPLOME' | 'REPRISE_SOUTENANCE' | 'REDOUBLANCE' | 'ADMISSIBLE_S6' | null;
    creditsTotal: number;
    annee: string | null;
  };
}
```

---

## 10. Génération PDF

```bash
npm install @react-pdf/renderer
```

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BulletinPDF } from './components/BulletinPDF';

// Récupérer les données
const { data } = await api.get(`/bulletins/etudiant/${etudiantId}/semestre/${semestreId}`);

// Générer le PDF
<PDFDownloadLink
  document={<BulletinPDF data={data} />}
  fileName={`bulletin_${data.etudiant.matricule}_${data.semestre.code}.pdf`}
>
  {({ loading }) => loading ? 'Génération...' : 'Télécharger'}
</PDFDownloadLink>
```

---

## 11. Profil

```typescript
GET  /profil                             // Profil utilisateur connecté
PUT  /profil                             // Mettre à jour
POST /profil/change-password             // { oldPassword, newPassword }
GET  /profil/preferences
PUT  /profil/preferences
```

---

## 12. Permissions par Rôle

| Fonctionnalité | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|----------------|-------|-------------|------------|----------|
| Créer admin | ✅ | ❌ | ❌ | ❌ |
| Créer secrétariat | ✅ | ❌ | ❌ | ❌ |
| Créer enseignant/étudiant | ✅ | ✅ | ❌ | ❌ |
| CRUD Référentiels | ✅ | ✅ | Lecture | Lecture |
| CRUD Étudiants | ✅ | ✅ | Lecture | Lecture |
| CRUD Enseignants | ✅ | ✅ | Lecture (soi) | ❌ |
| CRUD Évaluations | ✅ | ✅ | ✅ | Lecture |
| Calculs semestre/tout | ✅ | ✅ | ❌ | ❌ |
| Calculs matière/UE | ✅ | ✅ | ✅ | ❌ |
| Bulletins | ✅ | ✅ | ✅ | Soi |
| Recap promotion | ✅ | ✅ | ❌ | ❌ |

---

## 13. Gestion des Erreurs

```typescript
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return 'Une erreur est survenue';
};
```

| Code | Cause fréquente |
|------|-----------------|
| 400 | Champs manquants, rattrapage non autorisé |
| 401 | Token manquant ou expiré |
| 403 | Rôle insuffisant |
| 404 | Ressource inexistante |
| 500 | Erreur serveur |

---

## 14. Dépendances Recommandées

```bash
npm create vite@latest bull-asur-frontend -- --template react-ts
cd bull-asur-frontend
npm install axios react-router-dom react-hook-form @react-pdf/renderer
```

---

**Référence complète des endpoints** : [API_ENDPOINTS.md](./API_ENDPOINTS.md)
