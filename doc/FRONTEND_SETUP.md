# 🚀 **GUIDE D'INSTALLATION FRONT-END REACT**

## 📋 **Stack Technique**

### **Front-end**
- **React 18** avec **TypeScript**
- **TailwindCSS** pour le style
- **Axios** pour les appels API
- **React Router** pour la navigation
- **React Hook Form** pour les formulaires
- **JWT** pour l'authentification

### **Back-end**
- **NestJS** avec **TypeScript**
- **API REST** déjà documentée
- **JWT** authentification

---

## 🛠️ **INSTALLATION**

### **1. Créer le projet React**
```bash
npx create-react-app bull-asur-frontend --template typescript
cd bull-asur-frontend
```

### **2. Installer les dépendances**
```bash
npm install axios react-router-dom react-hook-form @hookform/resolvers yup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### **3. Configurer TailwindCSS**
**tailwind.config.js** :
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css** :
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 📁 **STRUCTURE DES DOSSIERS**

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── academic/
│   │   ├── SemesterList.tsx
│   │   ├── UEList.tsx
│   │   └── MatiereList.tsx
│   └── users/
│       ├── StudentList.tsx
│       ├── TeacherList.tsx
│       └── UserProfile.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Academics.tsx
│   ├── Users.tsx
│   └── Profile.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── academics.ts
│   └── users.ts
├── types/
│   ├── auth.types.ts
│   ├── academic.types.ts
│   └── user.types.ts
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── utils/
│   ├── constants.ts
│   └── helpers.ts
└── App.tsx
```

---

## 🔐 **CONFIGURATION AUTHENTIFICATION**

### **Types (auth.types.ts)**
```typescript
export interface LoginResponse {
  access_token: string;
  role: string;
  user?: any;
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: 'ADMINISTRATEUR' | 'SECRETARIAT' | 'ENSEIGNANT' | 'ETUDIANT';
}
```

### **Service API (api.ts)**
```typescript
import axios from 'axios';

const API_BASE_URL = 'https://bull-back-z97c.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Service Auth (auth.ts)**
```typescript
import { api } from './api';

export const authService = {
  async login(email: string, password: string, role: string) {
    const endpoint = `/auth/${role.toLowerCase()}/login`;
    const response = await api.post(endpoint, { email, password });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/profil');
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  }
};
```

---

## 📚 **EXEMPLES DE COMPOSANTS**

### **LoginForm.tsx**
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth';

interface LoginFormData {
  email: string;
  password: string;
  role: string;
}

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data.email, data.password, data.role);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_role', response.secretariat?.role || response.user?.role);
      // Rediriger vers le dashboard
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Email</label>
        <input {...register('email', { required: true })} type="email" />
        {errors.email && <span>Email requis</span>}
      </div>
      
      <div>
        <label>Mot de passe</label>
        <input {...register('password', { required: true })} type="password" />
        {errors.password && <span>Mot de passe requis</span>}
      </div>
      
      <div>
        <label>Rôle</label>
        <select {...register('role', { required: true })}>
          <option value="administrateur">Administrateur</option>
          <option value="secretariat">Secrétariat</option>
          <option value="enseignant">Enseignant</option>
          <option value="etudiant">Étudiant</option>
        </select>
      </div>
      
      <button type="submit">Se connecter</button>
    </form>
  );
};
```

### **SemesterList.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Semester {
  id: string;
  code: string;
  libelle: string;
  anneeUniversitaire: string;
  ues: any[];
}

export const SemesterList: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await api.get('/semestres');
        setSemesters(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <h2>Liste des Semestres</h2>
      {semesters.map((semester) => (
        <div key={semester.id} className="border p-4 rounded">
          <h3>{semester.libelle}</h3>
          <p>{semester.code} - {semester.anneeUniversitaire}</p>
          <p>UEs: {semester.ues.length}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## 🚀 **DÉMARRAGE**

### **1. Démarrer le serveur de développement**
```bash
npm start
```

### **2. Accéder à l'application**
```
http://localhost:3000
```

---

## 📊 **INTÉGRATION AVEC L'API**

### **Endpoints disponibles**
- **Authentification** : `/auth/{role}/login`
- **Profil** : `/profil`
- **Académique** : `/semestres`, `/unites-enseignement`, `/matieres`
- **Utilisateurs** : `/etudiants`, `/enseignants`
- **CRUD** : POST, PUT, DELETE sur tous les endpoints

### **Exemple d'appel API**
```typescript
// Créer un étudiant
const createStudent = async (studentData: any) => {
  const response = await api.post('/etudiants', studentData);
  return response.data;
};

// Lister les semestres
const getSemesters = async () => {
  const response = await api.get('/semestres');
  return response.data;
};
```

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Configurer le routing** avec React Router
2. **Créer les pages** principales (Dashboard, Academics, Users)
3. **Implémenter les formulaires** de création
4. **Ajouter la gestion des erreurs**
5. **Optimiser l'UX** avec des loaders et notifications

---

## 📚 **RESSOURCES**

- **Documentation React** : https://react.dev
- **TailwindCSS** : https://tailwindcss.com
- **React Hook Form** : https://react-hook-form.com
- **API Documentation** : `doc/API_ENDPOINTS.md`

**Prêt à développer le front-end !** 🚀
