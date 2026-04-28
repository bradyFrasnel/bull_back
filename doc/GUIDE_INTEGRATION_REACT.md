# 🚀 Guide d'Intégration Frontend React - Bull ASUR

## 📋 Vue d'ensemble

API REST pour la gestion des bulletins de notes LP ASUR avec authentification JWT et gestion des rôles.

**URL Production**: `https://bull-back-z97c.onrender.com`  
**Documentation Swagger**: `https://bull-back-z97c.onrender.com/api/docs`

---

## 🔐 Authentification

### Endpoints de connexion

```typescript
POST /auth/etudiant/login
POST /auth/enseignant/login
POST /auth/admin/login
POST /auth/secretariat/login
```

### Requête de connexion

```typescript
interface LoginRequest {
  nom: string;        // Identifiant utilisateur
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    nom: string;
    email: string;
    role: 'ADMINISTRATEUR' | 'SECRETARIAT' | 'ENSEIGNANT' | 'ETUDIANT';
  };
}
```

### Exemple d'appel

```typescript
const response = await fetch('https://bull-back-z97c.onrender.com/auth/etudiant/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nom: 'mmartin2024', password: 'password123' })
});

const { access_token, user } = await response.json();
localStorage.setItem('token', access_token);
```

---

## 🔑 Gestion du Token JWT

### Configuration Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bull-back-z97c.onrender.com',
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs 401
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

---

## 👤 Profil Utilisateur

### Récupérer le profil connecté

```typescript
GET /profil
Authorization: Bearer <token>

// Réponse
{
  id: string;
  nom: string;
  email: string;
  role: string;
  // Données spécifiques selon le rôle (étudiant, enseignant, etc.)
}
```

---

## 📚 Endpoints Principaux

### 1. Semestres

```typescript
GET    /semestres                    // Lister tous
GET    /semestres/:id                // Détails
POST   /semestres                    // Créer (Admin/Secretariat)
PUT    /semestres/:id                // Modifier (Admin/Secretariat)
DELETE /semestres/:id                // Supprimer (Admin/Secretariat)

// Création
{
  code: string;              // Ex: "S1-2024"
  libelle: string;           // Ex: "Semestre 1"
  anneeUniversitaire: string; // Ex: "2024-2025"
}
```

### 2. Unités d'Enseignement (UE)

```typescript
GET    /unites-enseignement                    // Lister toutes
GET    /unites-enseignement/:id                // Détails
GET    /unites-enseignement/semestre/:semestreId // Par semestre
POST   /unites-enseignement                    // Créer (Admin/Secretariat)
PUT    /unites-enseignement/:id                // Modifier (Admin/Secretariat)
DELETE /unites-enseignement/:id                // Supprimer (Admin/Secretariat)

// Création
{
  code: string;        // Ex: "UE01"
  libelle: string;     // Ex: "Algorithmique"
  semestreId: string;
}
```

### 3. Matières

```typescript
GET    /matieres           // Lister toutes
GET    /matieres/:id       // Détails
GET    /matieres/ue/:ueId  // Par UE
POST   /matieres           // Créer (Admin/Secretariat)
PUT    /matieres/:id       // Modifier (Admin/Secretariat)
DELETE /matieres/:id       // Supprimer (Admin/Secretariat)

// Création
{
  libelle: string;              // Ex: "Développement Web"
  coefficient: number;          // Ex: 2.5
  credits: number;              // Ex: 6
  uniteEnseignementId: string;
}
```

### 4. Étudiants

```typescript
GET    /etudiants                    // Lister tous
GET    /etudiants/:id                // Détails
GET    /etudiants/matricule/:matricule // Par matricule
POST   /etudiants                    // Créer (Admin/Secretariat)
PUT    /etudiants/:id                // Modifier (Admin/Secretariat)
DELETE /etudiants/:id                // Supprimer (Admin)

// Création
{
  nom: string;
  prenom: string;
  matricule: string;
  email: string;
  password: string;
  date_naissance: string;    // Format: "YYYY-MM-DD"
  lieu_naissance: string;
  bac_type: string;
  annee_bac: number;
  mention_bac: string;
  telephone?: string;
  adresse?: string;
}
```

### 5. Enseignants

```typescript
GET    /enseignants                    // Lister tous
GET    /enseignants/:id                // Détails
POST   /enseignants                    // Créer (Admin/Secretariat)
PUT    /enseignants/:id                // Modifier (Admin/Secretariat)
DELETE /enseignants/:id                // Supprimer (Admin)

// Gestion des matières
POST   /enseignants/:enseignantId/matieres/:matiereId  // Assigner
DELETE /enseignants/:enseignantId/matieres/:matiereId  // Retirer
GET    /enseignants/:enseignantId/matieres             // Lister

// Création
{
  nom: string;
  prenom: string;
  matricule: string;
  email: string;
  password: string;
  specialite?: string;
}
```

### 6. Évaluations

```typescript
GET    /evaluations                              // Lister toutes
GET    /evaluations/:id                          // Détails
GET    /evaluations/etudiant/:etudiantId         // Par étudiant
GET    /evaluations/matiere/:matiereId           // Par matière
POST   /evaluations                              // Créer (Secretariat/Enseignant)
PUT    /evaluations/:id                          // Modifier (Secretariat/Enseignant)
DELETE /evaluations/:id                          // Supprimer (Secretariat/Enseignant)

// Création
{
  utilisateurId: string;  // ID de l'étudiant
  matiereId: string;
  type: 'CC' | 'EXAMEN' | 'RATTRAPAGE';
  note: number;           // Entre 0 et 20
  saisiePar: string;      // ID de l'utilisateur qui saisit
}
```

### 7. Calculs

```typescript
POST /calculs/etudiant/:etudiantId/matiere/:matiereId     // Calculer moyenne matière
POST /calculs/etudiant/:etudiantId/ue/:ueId               // Calculer moyenne UE
POST /calculs/etudiant/:etudiantId/semestre/:semestreId   // Calculer résultat semestre
POST /calculs/etudiant/:etudiantId/recalculer-tout        // Recalculer tout
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details // Détails calcul

// Permissions: Secretariat/Enseignant (sauf recalculer-tout: Admin/Secretariat)
```

---

## 🔒 Permissions par Rôle

| Endpoint | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|----------|-------|-------------|------------|----------|
| Semestres | CRUD | CRUD | Lecture | Lecture |
| UE | CRUD | CRUD | Lecture | Lecture |
| Matières | CRUD | CRUD | Lecture | Lecture |
| Étudiants | CRUD | CRUD | Lecture | Lecture (soi) |
| Enseignants | CRUD | CRUD | Lecture (soi) | - |
| Évaluations | CRUD | CRUD | CRUD | Lecture (soi) |
| Calculs | Tous | Tous | Matière/UE | - |

---

## 🎯 Exemples d'Intégration React

### Hook d'authentification

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/profil');
          setUser(data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (nom: string, password: string, role: string) => {
    const { data } = await api.post(`/auth/${role}/login`, { nom, password });
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, loading, login, logout };
};
```

### Composant de liste

```typescript
// components/SemesterList.tsx
import { useEffect, useState } from 'react';
import api from '../services/api';

export const SemesterList = () => {
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    const fetchSemesters = async () => {
      const { data } = await api.get('/semestres');
      setSemesters(data);
    };
    fetchSemesters();
  }, []);

  return (
    <div>
      {semesters.map((sem) => (
        <div key={sem.id}>
          <h3>{sem.libelle}</h3>
          <p>{sem.anneeUniversitaire}</p>
        </div>
      ))}
    </div>
  );
};
```

### Formulaire de création

```typescript
// components/CreateStudent.tsx
import { useForm } from 'react-hook-form';
import api from '../services/api';

export const CreateStudent = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/etudiants', data);
      alert('Étudiant créé avec succès');
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('nom')} placeholder="Nom" required />
      <input {...register('prenom')} placeholder="Prénom" required />
      <input {...register('matricule')} placeholder="Matricule" required />
      <input {...register('email')} type="email" placeholder="Email" required />
      <input {...register('password')} type="password" placeholder="Mot de passe" required />
      <input {...register('date_naissance')} type="date" required />
      <input {...register('lieu_naissance')} placeholder="Lieu de naissance" required />
      <input {...register('bac_type')} placeholder="Type de bac" required />
      <input {...register('annee_bac')} type="number" placeholder="Année du bac" required />
      <input {...register('mention_bac')} placeholder="Mention" required />
      <button type="submit">Créer</button>
    </form>
  );
};
```

---

## 🚨 Gestion des Erreurs

### Codes HTTP

- **200**: Succès
- **201**: Créé avec succès
- **400**: Requête invalide (champs manquants)
- **401**: Non authentifié (token manquant/invalide)
- **403**: Accès refusé (permissions insuffisantes)
- **404**: Ressource non trouvée
- **500**: Erreur serveur

### Format des erreurs

```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

---

## 🧪 Identifiants de Test

| Rôle | Nom | Mot de passe |
|------|-----|--------------|
| Admin | root | root |
| Secrétariat | admin | admin |
| Étudiant | mmartin2024 | password123 |
| Enseignant | jdupontweb | password123 |

---

## 📦 Dépendances Recommandées

```bash
npm install axios react-router-dom react-hook-form
npm install -D @types/react @types/react-dom
```

---

## 🔄 Workflow Type

1. **Connexion** → Stocker le token JWT
2. **Récupérer le profil** → Afficher les infos utilisateur
3. **Appels API** → Ajouter le token dans les headers
4. **Gestion des erreurs** → Rediriger si 401

---

**Documentation complète**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
