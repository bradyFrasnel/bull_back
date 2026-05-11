# 🚀 Guide d'Intégration Frontend React — Bull ASUR

> **Backend prêt** ✅ — Ce guide contient tout ce qu'il faut pour démarrer le frontend.

**URL Production** : `https://bull-back-z97c.onrender.com`  
**Swagger** : `https://bull-back-z97c.onrender.com/api/docs`

---

## 1. Configuration Axios

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bull-back-z97c.onrender.com',
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rediriger vers /login si token expiré
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

---

## 2. Authentification

### Endpoints de connexion

```
POST /auth/etudiant/login
POST /auth/enseignant/login
POST /auth/admin/login
POST /auth/secretariat/login
```

### Body

```json
{ "nom": "string", "password": "string" }
```

### Réponse

```typescript
interface LoginResponse {
  access_token: string;
  // Selon le rôle : admin | secretariat | etudiant | enseignant
  admin?: { id: string; nom: string; email: string; role: string; };
}
```

### Exemple

```typescript
// src/services/auth.service.ts
import api from './api';

export const login = async (nom: string, password: string, role: string) => {
  const { data } = await api.post(`/auth/${role}/login`, { nom, password });
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data[role] ?? data.admin));
  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
```

### Hook useAuth

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
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading };
};
```

---

## 3. Endpoints par Module

### Profil utilisateur connecté

```typescript
GET /profil
// Réponse : { id, nom, email, role, ... }
```

### Semestres

```typescript
GET    /semestres                        // Lister
GET    /semestres/:id                    // Détails
GET    /semestres/annee/:annee           // Par année universitaire
POST   /semestres                        // Créer — Admin/Secretariat
PUT    /semestres/:id                    // Modifier — Admin/Secretariat
DELETE /semestres/:id                    // Supprimer — Admin/Secretariat

// Body POST/PUT
{ code: string; libelle: string; anneeUniversitaire: string; }
```

### Unités d'Enseignement

```typescript
GET    /unites-enseignement
GET    /unites-enseignement/:id
GET    /unites-enseignement/semestre/:semestreId
POST   /unites-enseignement              // Admin/Secretariat
PUT    /unites-enseignement/:id
DELETE /unites-enseignement/:id

// Body POST/PUT
{ code: string; libelle: string; semestreId: string; }
```

### Matières

```typescript
GET    /matieres
GET    /matieres/:id
GET    /matieres/ue/:ueId
POST   /matieres                         // Admin/Secretariat
PUT    /matieres/:id
DELETE /matieres/:id

// Body POST/PUT
{ libelle: string; coefficient: number; credits: number; uniteEnseignementId: string; }
```

### Étudiants

```typescript
GET    /etudiants
GET    /etudiants/:id
GET    /etudiants/matricule/:matricule
POST   /etudiants                        // Admin/Secretariat
PUT    /etudiants/:id
DELETE /etudiants/:id                    // Admin uniquement

// Body POST
{
  nom: string; prenom: string; matricule: string;
  email: string; password: string;
  date_naissance: string;               // "YYYY-MM-DD"
  lieu_naissance: string; bac_type: string;
  annee_bac: number; mention_bac: string;
  telephone?: string; adresse?: string;
}
```

### Enseignants

```typescript
GET    /enseignants
GET    /enseignants/:id
POST   /enseignants                      // Admin/Secretariat
PUT    /enseignants/:id
DELETE /enseignants/:id                  // Admin uniquement
POST   /enseignants/:id/matieres/:matiereId   // Assigner matière
DELETE /enseignants/:id/matieres/:matiereId   // Retirer matière
GET    /enseignants/:id/matieres              // Matières d'un enseignant

// Body POST
{ nom: string; prenom: string; matricule: string; email: string; password: string; specialite?: string; }
```

### Évaluations

```typescript
GET    /evaluations
GET    /evaluations/etudiant/:etudiantId
GET    /evaluations/matiere/:matiereId
GET    /evaluations/etudiant/:etudiantId/matiere/:matiereId
POST   /evaluations                      // Secretariat/Enseignant
PUT    /evaluations/:id
DELETE /evaluations/:id

// Body POST
{
  utilisateurId: string;               // ID de l'étudiant
  matiereId: string;
  type: 'CC' | 'EXAMEN' | 'RATTRAPAGE';
  note: number;                        // 0 à 20
  saisiePar: string;                   // ID de l'utilisateur qui saisit
}
```

### Calculs

```typescript
// Déclencher après chaque saisie de note
POST /calculs/etudiant/:etudiantId/matiere/:matiereId
POST /calculs/etudiant/:etudiantId/ue/:ueId
POST /calculs/etudiant/:etudiantId/semestre/:semestreId
POST /calculs/etudiant/:etudiantId/recalculer-tout    // Admin/Secretariat
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details
```

---

## 4. Bulletins — Données pour génération PDF

### Bulletin Semestre

```typescript
GET /bulletins/etudiant/:etudiantId/semestre/:semestreId
```

**Réponse complète :**

```typescript
{
  etudiant: {
    id: string; nom: string; prenom: string; matricule: string;
    dateNaissance: string; lieuNaissance: string; email: string;
  };
  semestre: { id: string; code: string; libelle: string; anneeUniversitaire: string; };
  ues: Array<{
    id: string; code: string; libelle: string;
    creditsTotal: number; moyenne: number | null;
    creditsAcquis: number; acquise: boolean; compensee: boolean;
    matieres: Array<{
      id: string; libelle: string; coefficient: number; credits: number;
      noteCC: number | null; noteExamen: number | null; noteRattrapage: number | null;
      moyenne: number | null; rattrapageUtilise: boolean; absences: number;
    }>;
  }>;
  resultat: { moyenneSemestre: number; creditsTotal: number; valide: boolean; } | null;
  statistiques: {
    moyenneClasse: number; noteMin: number; noteMax: number;
    ecartType: number; nbEtudiants: number;
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
  etudiant: { ... };
  semestres: Array<{ semestre, ues, resultat, statistiques }>;
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
  semestre: { ... };
  statistiques: { moyenneClasse, noteMin, noteMax, ecartType, nbEtudiants };
  nbEtudiants: number; nbValides: number; tauxReussite: number;
  etudiants: Array<{
    rang: number; etudiantId: string; nom: string; prenom: string;
    matricule: string; moyenneSemestre: number; creditsTotal: number;
    valide: boolean; mention: string | null;
  }>;
}
```

---

## 5. Génération PDF (Frontend)

```bash
npm install @react-pdf/renderer
```

```typescript
// src/components/BulletinSemestrePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  table: { display: 'flex', flexDirection: 'column' },
  row: { flexDirection: 'row', borderBottom: '1px solid #ccc', padding: 4 },
});

export const BulletinSemestrePDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>
        Bulletin — {data.semestre.code} — {data.semestre.anneeUniversitaire}
      </Text>
      <Text>Étudiant : {data.etudiant.prenom} {data.etudiant.nom}</Text>
      <Text>Matricule : {data.etudiant.matricule}</Text>

      {data.ues.map((ue) => (
        <View key={ue.id}>
          <Text>{ue.code} — {ue.libelle} — Moyenne : {ue.moyenne?.toFixed(2)}</Text>
          {ue.matieres.map((m) => (
            <View key={m.id} style={styles.row}>
              <Text>{m.libelle}</Text>
              <Text>CC: {m.noteCC ?? '-'}</Text>
              <Text>Exam: {m.noteExamen ?? '-'}</Text>
              <Text>Moy: {m.moyenne?.toFixed(2) ?? '-'}</Text>
            </View>
          ))}
        </View>
      ))}

      {data.resultat && (
        <Text>
          Moyenne semestre : {data.resultat.moyenneSemestre.toFixed(2)} —
          Crédits : {data.resultat.creditsTotal} —
          {data.resultat.valide ? 'VALIDÉ' : 'NON VALIDÉ'}
        </Text>
      )}
    </Page>
  </Document>
);
```

```typescript
// Utilisation dans un composant
import { PDFDownloadLink } from '@react-pdf/renderer';

<PDFDownloadLink
  document={<BulletinSemestrePDF data={bulletinData} />}
  fileName={`bulletin_${data.etudiant.matricule}_${data.semestre.code}.pdf`}
>
  {({ loading }) => loading ? 'Génération...' : 'Télécharger le bulletin'}
</PDFDownloadLink>
```

---

## 6. Permissions par Rôle

| Fonctionnalité | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|----------------|-------|-------------|------------|----------|
| Créer admin/secretariat | ✅ | ❌ | ❌ | ❌ |
| Créer enseignant/étudiant | ✅ | ✅ | ❌ | ❌ |
| CRUD Référentiels | ✅ | ✅ | Lecture | Lecture |
| CRUD Étudiants | ✅ | ✅ | Lecture | Soi |
| CRUD Évaluations | ✅ | ✅ | ✅ | Lecture |
| Calculs | ✅ | ✅ | Matière/UE | ❌ |
| Bulletin semestre/annuel | ✅ | ✅ | ✅ | Soi |
| Recap promotion | ✅ | ✅ | ❌ | ❌ |

---

## 7. Gestion des Erreurs

```typescript
// src/utils/handleApiError.ts
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return Array.isArray(error.response.data.message)
      ? error.response.data.message.join(', ')
      : error.response.data.message;
  }
  return 'Une erreur est survenue';
};
```

| Code | Signification |
|------|---------------|
| 400 | Champs invalides ou règle métier (ex: rattrapage non autorisé) |
| 401 | Token manquant ou expiré → rediriger vers /login |
| 403 | Rôle insuffisant |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## 8. Variables d'Environnement Frontend

```env
# .env (Vite)
VITE_API_URL=https://bull-back-z97c.onrender.com

# .env.local (développement)
VITE_API_URL=http://localhost:3000
```

---

## 9. Dépendances Recommandées

```bash
npm create vite@latest bull-asur-frontend -- --template react-ts
cd bull-asur-frontend

npm install axios react-router-dom react-hook-form
npm install @react-pdf/renderer          # Génération PDF bulletins
npm install @tanstack/react-query        # Gestion des requêtes API (optionnel)
```

---

## 10. Checklist Intégration

- [ ] Configurer `api.ts` avec l'URL de base et les intercepteurs
- [ ] Implémenter la page de connexion (4 rôles)
- [ ] Implémenter `useAuth` hook
- [ ] Créer les routes protégées par rôle
- [ ] Dashboard Admin/Secretariat : CRUD étudiants, enseignants, référentiels
- [ ] Dashboard Enseignant : saisie des notes + calcul
- [ ] Dashboard Étudiant : consultation notes + téléchargement bulletin
- [ ] Composant `BulletinSemestrePDF` + `BulletinAnnuelPDF`
- [ ] Page récapitulatif promotion (Admin/Secretariat)

---

**Référence complète** : [API_ENDPOINTS.md](./API_ENDPOINTS.md)  
**Vue d'ensemble** : [README.md](./README.md)
