# 🔐 Frontend Integration Guide - Bull ASUR

## 📋 Vue d'ensemble

Guide complet pour intégrer le frontend React avec l'API Bull ASUR. Authentification JWT, composants protégés, et exemples de code TypeScript.

---

## 🛠️ Configuration du Projet

### **1. Installation des Dépendances**
```bash
npx create-react-app bull-asur-frontend --template typescript
cd bull-asur-frontend

npm install axios react-router-dom react-hook-form @hookform/resolvers yup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### **2. Configuration TailwindCSS**
**tailwind.config.js**:
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**src/index.css**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 📁 Structure du Projet

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
│   └── academic/
│       ├── SemesterList.tsx
│       └── UEList.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Profile.tsx
├── services/
│   ├── api.ts
│   └── auth.ts
├── types/
│   ├── auth.types.ts
│   └── academic.types.ts
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
└── App.tsx
```

---

## 🔐 Service d'Authentification

### **Types TypeScript**
**src/types/auth.types.ts**:
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

export interface LoginFormData {
  nom: string;
  password: string;
  role: string;
}
```

### **Service API**
**src/services/api.ts**:
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bull-back-z97c.onrender.com';

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

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **Service Auth**
**src/services/auth.ts**:
```typescript
import { api } from './api';
import { LoginResponse, User } from '../types/auth.types';

export const authService = {
  async login(nom: string, password: string, role: string): Promise<LoginResponse> {
    const endpoint = `/auth/${role}/login`;
    const response = await api.post(endpoint, { nom, password });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/profil');
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }
};
```

---

## 🎯 Hook d'Authentification

**src/hooks/useAuth.ts**:
```typescript
import { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { User } from '../types/auth.types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (nom: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (nom: string, password: string, role: string) => {
    try {
      const response = await authService.login(nom, password, role);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_role', response.role);
      
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: authService.isAuthenticated(),
  };
};
```

---

## 🧩 Composants React

### **Route Protégée**
**src/components/auth/ProtectedRoute.tsx**:
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérification du rôle si requis
  if (requiredRole) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
```

### **Formulaire de Connexion**
**src/components/auth/LoginForm.tsx**:
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { LoginFormData } from '../../types/auth.types';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.nom, data.password, data.role);
      // Redirection automatique via le hook useAuth
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // Afficher un message d'erreur
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          {...register('nom', { required: 'Nom requis' })}
          type="text"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.nom && <span className="text-red-500 text-sm">{errors.nom.message}</span>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          {...register('password', { required: 'Mot de passe requis' })}
          type="password"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Rôle</label>
        <select
          {...register('role', { required: 'Rôle requis' })}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="administrateur">Administrateur</option>
          <option value="secretariat">Secrétariat</option>
          <option value="enseignant">Enseignant</option>
          <option value="etudiant">Étudiant</option>
        </select>
        {errors.role && <span className="text-red-500 text-sm">{errors.role.message}</span>}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
};
```

### **Dashboard**
**src/pages/Dashboard.tsx**:
```typescript
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>Chargement...</div>;
  }

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'ADMINISTRATEUR':
        return 'Tableau de bord Administrateur';
      case 'SECRETARIAT':
        return 'Tableau de bord Secrétariat';
      case 'ENSEIGNANT':
        return 'Tableau de bord Enseignant';
      case 'ETUDIANT':
        return 'Tableau de bord Étudiant';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {getWelcomeMessage()}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.nom} ({user.role})
              </span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cartes d'actions selon le rôle */}
          {(user.role === 'ADMINISTRATEUR' || user.role === 'SECRETARIAT') && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Gestion Étudiants</h3>
                <p className="text-gray-600 mb-4">Ajouter, modifier, supprimer des étudiants</p>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Gérer
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Gestion Enseignants</h3>
                <p className="text-gray-600 mb-4">Ajouter, modifier, supprimer des enseignants</p>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Gérer
                </button>
              </div>
            </>
          )}
          
          {user.role === 'ENSEIGNANT' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Saisir Notes</h3>
              <p className="text-gray-600 mb-4">Saisir et modifier les évaluations</p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Saisir
              </button>
            </div>
          )}
          
          {user.role === 'ETUDIANT' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Mes Notes</h3>
              <p className="text-gray-600 mb-4">Consulter mes résultats académiques</p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Consulter
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
```

---

## 🚀 Configuration Router

**src/App.tsx**:
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div>Chargement...</div>
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 📊 Exemples d'Appels API

### **Lister les Semestres**
```typescript
import { api } from '../services/api';

export const getSemesters = async () => {
  try {
    const response = await api.get('/semestres');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des semestres:', error);
    throw error;
  }
};
```

### **Créer un Étudiant**
```typescript
export const createStudent = async (studentData: any) => {
  try {
    const response = await api.post('/etudiants', studentData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'étudiant:', error);
    throw error;
  }
};
```

### **Récupérer le Profil**
```typescript
export const getUserProfile = async () => {
  try {
    const response = await api.get('/profil');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
};
```

---

## 🎨 Variables d'Environnement

**.env** (à la racine du projet frontend):
```env
REACT_APP_API_URL=https://bull-back-z97c.onrender.com
REACT_APP_ENV=production
```

**.env.development**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

---

## 🔧 Gestion des Erreurs

### **Composant d'Erreur**
```typescript
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erreur capturée:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Une erreur est survenue
            </h1>
            <p className="text-gray-600 mb-4">
              Veuillez rafraîchir la page ou contacter le support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🚀 Déploiement

### **Build de Production**
```bash
npm run build
```

### **Déploiement sur Netlify/Vercel**
1. Connecter le repository
2. Configurer les variables d'environnement
3. Déployer automatiquement sur chaque push

---

## 📞 Support

### **Identifiants de Test**
| Rôle | Nom | Mot de passe |
|-------|------|-------------|
| Admin | root | root |
| Secrétariat | admin | admin |
| Étudiant | mmartin2024 | password123 |
| Enseignant | jdupontweb | password123 |

### **Erreurs Courantes**
- **401 Unauthorized**: Vérifier le token JWT
- **403 Forbidden**: Vérifier les permissions du rôle
- **CORS**: Assurer que l'API backend est accessible
- **Network Error**: Vérifier l'URL de l'API

---

**🎯 Intégration terminée !**

Votre frontend React est maintenant prêt à communiquer avec l'API Bull ASUR.
