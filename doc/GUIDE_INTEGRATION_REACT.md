# 🚀 Guide d'Intégration Frontend React - Bull ASUR

## 📋 Vue d'ensemble

API REST pour la gestion des bulletins de notes LP ASUR avec authentification JWT et gestion des rôles.

**URL Production** : `https://bull-back-z97c.onrender.com`  
**Documentation Swagger** : `https://bull-back-z97c.onrender.com/api/docs`

---

## 🔐 Authentification

### Endpoints de connexion

```typescript
POST /auth/etudiant/login
POST /auth/enseignant/login
POST /auth/admin/login
POST /auth/secretariat/login
```

### Requête / Réponse

```typescript
// Requête
{ nom: string; password: string; }

// Réponse
{
  access_token: string;
  user: {
    id: string;
    nom: string;
    email: string;
    role: 'ADMINISTRATEUR' | 'SECRETARIAT' | 'ENSEIGNANT' | 'ETUDIANT';
  };
}
```

---

## 🔑 Configuration Axios

```typescript
// services/api.ts
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

---

## 👤 Profil Utilisateur

```typescript
GET /profil
// Réponse : { id, nom, email, role, ... }
```

---

## 📚 Endpoints Principaux

### Semestres

```typescript
GET    /semestres                        // Lister tous
GET    /semestres/:id                    // Détails
GET    /semestres/annee/:annee           // Par année universitaire
POST   /semestres                        // Créer (Admin/Secretariat)
PUT    /semestres/:id                    // Modifier (Admin/Secretariat)
DELETE /semestres/:id                    // Supprimer (Admin/Secretariat)

// Body création
{ code: string; libelle: string; anneeUniversitaire: string; }
```

### Unités d'Enseignement

```typescript
GET    /unites-enseignement                          // Lister toutes
GET    /unites-enseignement/:id                      // Détails
GET    /unites-enseignement/semestre/:semestreId     // Par semestre
POST   /unites-enseignement                          // Créer (Admin/Secretariat)
PUT    /unites-enseignement/:id                      // Modifier
DELETE /unites-enseignement/:id                      // Supprimer

// Body création
{ code: string; libelle: string; semestreId: string; }
```

### Matières

```typescript
GET    /matieres                  // Lister toutes
GET    /matieres/:id              // Détails
GET    /matieres/ue/:ueId         // Par UE
POST   /matieres                  // Créer (Admin/Secretariat)
PUT    /matieres/:id              // Modifier
DELETE /matieres/:id              // Supprimer

// Body création
{ libelle: string; coefficient: number; credits: number; uniteEnseignementId: string; }
```

### Étudiants

```typescript
GET    /etudiants                            // Lister tous
GET    /etudiants/:id                        // Détails
GET    /etudiants/matricule/:matricule       // Par matricule
POST   /etudiants                            // Créer (Admin/Secretariat)
PUT    /etudiants/:id                        // Modifier
DELETE /etudiants/:id                        // Supprimer (Admin)

// Body création
{
  nom: string; prenom: string; matricule: string;
  email: string; password: string;
  date_naissance: string;   // "YYYY-MM-DD"
  lieu_naissance: string; bac_type: string;
  annee_bac: number; mention_bac: string;
  telephone?: string; adresse?: string;
}
```

### Enseignants

```typescript
GET    /enseignants                                          // Lister tous
GET    /enseignants/:id                                      // Détails
POST   /enseignants                                          // Créer (Admin/Secretariat)
PUT    /enseignants/:id                                      // Modifier
DELETE /enseignants/:id                                      // Supprimer (Admin)
POST   /enseignants/:enseignantId/matieres/:matiereId        // Assigner matière
DELETE /enseignants/:enseignantId/matieres/:matiereId        // Retirer matière
GET    /enseignants/:enseignantId/matieres                   // Matières d'un enseignant

// Body création
{ nom: string; prenom: string; matricule: string; email: string; password: string; specialite?: string; }
```

### Évaluations

```typescript
GET    /evaluations                                          // Lister toutes
GET    /evaluations/etudiant/:etudiantId                     // Par étudiant
GET    /evaluations/matiere/:matiereId                       // Par matière
GET    /evaluations/etudiant/:etudiantId/matiere/:matiereId  // Étudiant + matière
POST   /evaluations                                          // Créer (Secretariat/Enseignant)
PUT    /evaluations/:id                                      // Modifier
DELETE /evaluations/:id                                      // Supprimer

// Body création
{
  utilisateurId: string;   // ID de l'étudiant
  matiereId: string;
  type: 'CC' | 'EXAMEN' | 'RATTRAPAGE';
  note: number;            // 0 à 20
  saisiePar: string;       // ID de l'utilisateur qui saisit
}
```

### Calculs

```typescript
POST /calculs/etudiant/:etudiantId/matiere/:matiereId           // Calculer moyenne matière
POST /calculs/etudiant/:etudiantId/ue/:ueId                     // Calculer moyenne UE
POST /calculs/etudiant/:etudiantId/semestre/:semestreId         // Calculer résultat semestre
POST /calculs/etudiant/:etudiantId/recalculer-tout              // Recalculer tout
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details   // Détails calcul
```

---

## 📄 Bulletins (Nouveau)

Ces endpoints agrègent toutes les données nécessaires à la génération des bulletins côté frontend.

### Bulletin Semestre

```typescript
GET /bulletins/etudiant/:etudiantId/semestre/:semestreId
```

**Réponse :**
```typescript
{
  etudiant: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    lieuNaissance: string;
    email: string;
  };
  semestre: {
    id: string;
    code: string;           // "S5"
    libelle: string;
    anneeUniversitaire: string;
  };
  ues: [
    {
      id: string;
      code: string;         // "UE5-1"
      libelle: string;
      creditsTotal: number;
      moyenne: number | null;
      creditsAcquis: number;
      acquise: boolean;
      compensee: boolean;
      matieres: [
        {
          id: string;
          libelle: string;
          coefficient: number;
          credits: number;
          noteCC: number | null;
          noteExamen: number | null;
          noteRattrapage: number | null;
          moyenne: number | null;
          rattrapageUtilise: boolean;
          absences: number;   // heures
        }
      ];
    }
  ];
  resultat: {
    moyenneSemestre: number;
    creditsTotal: number;
    valide: boolean;
  } | null;
  statistiques: {
    moyenneClasse: number;
    noteMin: number;
    noteMax: number;
    ecartType: number;
    nbEtudiants: number;
  };
}
```

### Bulletin Annuel

```typescript
GET /bulletins/etudiant/:etudiantId/annuel
```

**Réponse :**
```typescript
{
  etudiant: { id, nom, prenom, matricule, dateNaissance, lieuNaissance, email };
  semestres: [
    {
      semestre: { id, code, libelle, anneeUniversitaire };
      ues: [ ... ];          // même structure que bulletin semestre
      resultat: { moyenneSemestre, creditsTotal, valide };
      statistiques: { moyenneClasse, noteMin, noteMax, ecartType, nbEtudiants };
    }
  ];
  resultatAnnuel: {
    moyenneAnnuelle: number | null;
    mention: 'PASSABLE' | 'ASSEZ_BIEN' | 'BIEN' | 'TRES_BIEN' | null;
    decisionJury: 'DIPLOME' | 'REPRISE_SOUTENANCE' | 'REDOUBLANCE' | 'ADMISSIBLE_S6' | null;
    creditsTotal: number;
    annee: string | null;
  };
}
```

### Récapitulatif Promotion

```typescript
GET /bulletins/promotion/semestre/:semestreId
// Accès : Admin / Secretariat uniquement
```

**Réponse :**
```typescript
{
  semestre: { id, code, libelle, anneeUniversitaire };
  statistiques: { moyenneClasse, noteMin, noteMax, ecartType, nbEtudiants };
  nbEtudiants: number;
  nbValides: number;
  tauxReussite: number;   // pourcentage
  etudiants: [
    {
      rang: number;
      etudiantId: string;
      nom: string;
      prenom: string;
      matricule: string;
      moyenneSemestre: number;
      creditsTotal: number;
      valide: boolean;
      mention: string | null;
    }
  ];
}
```

---

## 🔒 Permissions par Rôle

| Endpoint | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|----------|-------|-------------|------------|----------|
| Semestres | CRUD | CRUD | Lecture | Lecture |
| UE | CRUD | CRUD | Lecture | Lecture |
| Matières | CRUD | CRUD | Lecture | Lecture |
| Étudiants | CRUD | CRUD | Lecture | Lecture (soi) |
| Enseignants | CRUD | CRUD | Lecture (soi) | — |
| Évaluations | CRUD | CRUD | CRUD | Lecture (soi) |
| Calculs | Tous | Tous | Matière/UE | — |
| Bulletin semestre | ✅ | ✅ | ✅ | ✅ (soi) |
| Bulletin annuel | ✅ | ✅ | ✅ | ✅ (soi) |
| Recap promotion | ✅ | ✅ | — | — |

---

## 🎯 Workflow Génération de Bulletin (Frontend)

```typescript
// 1. Récupérer les données du bulletin
const { data } = await api.get(`/bulletins/etudiant/${etudiantId}/semestre/${semestreId}`);

// 2. Générer le PDF avec @react-pdf/renderer
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BulletinPDF } from './components/BulletinPDF';

<PDFDownloadLink
  document={<BulletinPDF data={data} />}
  fileName={`bulletin_${data.etudiant.matricule}_${data.semestre.code}.pdf`}
>
  Télécharger le bulletin
</PDFDownloadLink>
```

---

## 🎯 Hook d'authentification

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
        } catch {
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

---

## 🚨 Gestion des Erreurs

| Code | Signification |
|------|---------------|
| 200/201 | Succès |
| 400 | Requête invalide (champs manquants, rattrapage non autorisé) |
| 401 | Token manquant ou expiré |
| 403 | Permissions insuffisantes |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

```typescript
// Format erreur
{ statusCode: number; message: string; error: string; }
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

## 📦 Dépendances Recommandées (Frontend)

```bash
npm install axios react-router-dom react-hook-form
npm install @react-pdf/renderer          # Génération PDF
npm install @types/react @types/react-dom -D
```

---

**Documentation complète** : [API_ENDPOINTS.md](./API_ENDPOINTS.md)
