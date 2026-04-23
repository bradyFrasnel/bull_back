# 🚀 Guide Démarrage Rapide Frontend - Bull ASUR

## ⚡ Setup en 5 minutes

### 1. **Cloner le projet**
```bash
git clone <repository-url>
cd bull-asur-frontend
npm install
```

### 2. **Variables d'environnement**
```bash
# .env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_VERSION=v1
```

### 3. **Service API**
```javascript
// src/services/api.js
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN_ETUDIANT: '/auth/etudiant/login',
    LOGIN_ENSEIGNANT: '/auth/enseignant/login', 
    LOGIN_ADMIN: '/auth/admin/login',
    CHANGE_PASSWORD_ETUDIANT: '/auth/etudiant/change-password',
    CHANGE_PASSWORD_ENSEIGNANT: '/auth/enseignant/change-password'
  },
  STUDENTS: '/etudiants',
  TEACHERS: '/enseignants',
  SUBJECTS: '/matieres',
  EVALUATIONS: '/evaluations'
};
```

### 4. **Hook d'authentification**
```javascript
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (role, credentials) => {
    setLoading(true);
    const result = await authService.login(role, credentials);
    if (result.success) {
      setUser(result.user);
    }
    setLoading(false);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: authService.isAuthenticated() };
};
```

### 5. **Démarrage**
```bash
npm start
# L'application sera disponible sur http://localhost:3000
```

---

## 🔐 Test Rapide

### **Connexion admin**
```javascript
// Dans la console du navigateur
fetch('http://localhost:5000/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nom: 'root', password: 'root' })
})
.then(res => res.json())
.then(data => console.log('Token:', data.access_token));
```

### **Lister les étudiants**
```javascript
// Avec le token obtenu
fetch('http://localhost:5000/etudiants', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(res => res.json())
.then(data => console.log('Étudiants:', data));
```

---

## 📱 Structure React Recommandée

```
src/
├── components/
│   ├── Login.jsx
│   ├── ProtectedRoute.jsx
│   └── Layout.jsx
├── services/
│   ├── api.js
│   └── auth.js
├── hooks/
│   ├── useAuth.js
│   └── useApi.js
├── pages/
│   ├── Student/
│   ├── Teacher/
│   └── Admin/
├── styles/
│   └── global.css
└── App.jsx
```

---

## 🎨 Composants Essentiels

### **App.jsx principal**
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/Student/Dashboard';
import TeacherDashboard from './pages/Teacher/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/*" 
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};
```

---

## 🔄 Workflow Développement

### 1. **Authentification**
```bash
# Tester la connexion avec les 4 rôles
npm run test:auth
```

### 2. **Dashboard par rôle**
- **Étudiant** : Voir ses notes, évaluations
- **Enseignant** : Saisir les notes, voir sa classe
- **Admin** : Gestion complète

### 3. **Déploiement**
```bash
npm run build
npm run deploy
```

---

## 🛠️ Outils Recommandés

### **Pour le développement**
- **VS Code** + Extensions React
- **Postman** : Tester les API
- **React DevTools** : Debug

### **Librairies**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "react-query": "^3.0.0"
  }
}
```

---

## 📞 Aide Rapide

### **Problèmes courants**
```bash
# CORS error → Vérifier que le backend tourne sur localhost:5000
# Token invalide → Vider localStorage et se reconnecter
# 401/403 → Vérifier les droits de l'utilisateur
```

### **Support**
- **API Docs** : http://localhost:5000/api/docs
- **Backend** : Port 5000
- **Frontend** : Port 3000

---

## 🎯 Checklist Production

- [ ] Variables d'environnement configurées
- [ ] HTTPS en production
- [ ] Token refresh implémenté
- [ ] Gestion des erreurs réseau
- [ ] Tests E2E écrits
- [ ] Documentation utilisateur

---

**Prêt à développer !** 🚀

En suivant ce guide, vous aurez une application frontend fonctionnelle en moins d'une heure.
