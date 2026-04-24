# 📚 Documentation Connexion Frontend - Bull ASUR

## � URLs de l'API

**Production** ✅ : `https://bull-back-z97c.onrender.com`
**Documentation** : `https://bull-back-z97c.onrender.com/api/docs`
**Health** : `https://bull-back-z97c.onrender.com/health`

**Développement** : `http://localhost:5000`
**Réseau** : `http://0.0.0.0:5000`

---

## �🎯 Objectif

Guide complet pour intégrer l'authentification JWT dans le frontend Bull ASUR.

---

## 🔐 Flux d'Authentification

### 1. **Connexion de l'utilisateur**
```
POST /auth/{role}/login
Content-Type: application/json

{
  "nom": "nom_utilisateur",
  "password": "mot_de_passe"
}
```

### 2. **Réponse du serveur**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "etudiant" | "enseignant" | "admin": {
    "id": "cm123",
    "nom": "nom_utilisateur",
    "prenom": "prénom",
    "email": "email@asur.fr",
    "role": "ETUDIANT" | "ENSEIGNANT" | "ADMINISTRATEUR"
  }
}
```

### 3. **Stockage du token**
```javascript
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('user_info', JSON.stringify(response.etudiant || response.enseignant || response.admin));
```

---

## 🛠️ Implémentation Frontend

### **Configuration Axios**

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

### **Service d'Authentification**

```javascript
// src/services/auth.js
import api from './api';

export const authService = {
  // Connexion
  async login(role, credentials) {
    try {
      const response = await api.post(`/auth/${role}/login`, credentials);
      const { access_token, ...user } = response.data;
      
      // Stocker le token et les infos utilisateur
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_info', JSON.stringify(user));
      localStorage.setItem('user_role', role);
      
      return { success: true, user, token: access_token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  },

  // Déconnexion
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_role');
  },

  // Vérifier si connecté
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // Obtenir les infos utilisateur
  getCurrentUser() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Obtenir le rôle actuel
  getCurrentRole() {
    return localStorage.getItem('user_role');
  },

  // Obtenir le token
  getToken() {
    return localStorage.getItem('access_token');
  }
};
```

### **Composant de Connexion (React)**

```jsx
// src/components/Login.jsx
import React, { useState } from 'react';
import { authService } from '../services/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    nom: '',
    password: '',
    role: 'etudiant' // etudiant, enseignant, admin
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(formData.role, {
      nom: formData.nom,
      password: formData.password
    });

    if (result.success) {
      // Rediriger selon le rôle
      switch (formData.role) {
        case 'etudiant':
          window.location.href = '/student/dashboard';
          break;
        case 'enseignant':
          window.location.href = '/teacher/dashboard';
          break;
        case 'admin':
          window.location.href = '/admin/dashboard';
          break;
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion Bull ASUR</h2>
      
      {/* Sélection du rôle */}
      <div className="form-group">
        <label>Rôle:</label>
        <select 
          name="role" 
          value={formData.role} 
          onChange={handleInputChange}
          className="form-control"
        >
          <option value="etudiant">Étudiant</option>
          <option value="enseignant">Enseignant</option>
          <option value="admin">Administration</option>
        </select>
      </div>

      {/* Formulaire de connexion */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom d'utilisateur:</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {/* Identifiants de test */}
      <div className="test-credentials">
        <h4>Identifiants de test:</h4>
        <div className="credentials-list">
          <div>
            <strong>Admin:</strong> root / root
          </div>
          <div>
            <strong>Secretariat:</strong> admin / admin
          </div>
          <div>
            <strong>Étudiant:</strong> mmartin2024 / password123
          </div>
          <div>
            <strong>Enseignant:</strong> jdupontweb / password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

---

## 🔐 Protection des Routes

### **Guard d'Authentification**

```jsx
// src/components/ProtectedRoute.jsx
import React from 'react';
import { authService } from '../services/auth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentRole = authService.getCurrentRole();

  if (!isAuthenticated) {
    return <div>Vous devez être connecté pour accéder à cette page.</div>;
  }

  if (requiredRole && currentRole !== requiredRole) {
    return <div>Vous n'avez pas les droits pour accéder à cette page.</div>;
  }

  return children;
};

export default ProtectedRoute;
```

### **Utilisation**

```jsx
// Route protégée pour les admins seulement
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// Route protégée pour tous les utilisateurs connectés
<ProtectedRoute>
  <CommonDashboard />
</ProtectedRoute>
```

---

## 🎨 Styles CSS

```css
/* src/styles/login.css */
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.test-credentials {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.credentials-list div {
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}
```

---

## 📱 Points d'Accès API

### **URL de base**
```
Development: http://localhost:5000
Production: https://api.bull-asur.fr
```

### **Endpoints d'authentification**
```
POST /auth/etudiant/login     - Connexion étudiant
POST /auth/enseignant/login  - Connexion enseignant
POST /auth/admin/login         - Connexion admin/secretariat
```

### **Headers requis**
```http
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

---

## 🔄 Gestion des Tokens

### **Structure du Token JWT**
```json
{
  "sub": "user_id",
  "email": "user@email.com",
  "role": "ETUDIANT",
  "iat": 1640000000,
  "exp": 1640003600
}
```

### **Durée de vie**
- **Expiration** : 24 heures par défaut
- **Rafraîchissement** : Implémenter un refresh token si nécessaire

---

## 🚨 Gestion des Erreurs

### **Codes d'erreur courants**
```javascript
const handleApiError = (error) => {
  switch (error.response?.status) {
    case 401:
      return 'Identifiants incorrects';
    case 403:
      return 'Accès non autorisé';
    case 404:
      return 'Ressource non trouvée';
    case 500:
      return 'Erreur serveur';
    default:
      return error.response?.data?.message || 'Erreur inconnue';
  }
};
```

### **Messages utilisateur**
```javascript
const showUserMessage = (message, type = 'info') => {
  // Implémenter selon votre framework de notifications
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Exemples:
  // toast.info(message);
  // notification.success(message);
  // alert(message);
};
```

---

## 🎯 Checklist Intégration

- [ ] Configurer les variables d'environnement
- [ ] Implémenter le service d'authentification
- [ ] Créer le composant de connexion
- [ ] Ajouter la protection des routes
- [ ] Gérer le stockage des tokens
- [ ] Implémenter la déconnexion
- [ ] Ajouter la gestion des erreurs
- [ ] Tester avec tous les rôles
- [ ] Valider l'expiration des tokens

---

## � Connexion Frontend - Bull ASUR

## 🌐 Configuration de l'API

**URL Production** ✅ : `https://bull-back-z97c.onrender.com`
**URL Développement** : `http://localhost:3002`
**Documentation Swagger** : `https://bull-back-z97c.onrender.com/api/docs`
- **Postman** : Importer la collection depuis Swagger

### **Identifiants de test**
| Rôle | Nom d'utilisateur | Mot de passe |
|-------|----------------|-------------|
| Admin | `root` | `root` |
| Secretariat | `admin` | `admin` |
| Étudiant | `mmartin2024` | `password123` |
| Enseignant | `jdupontweb` | `password123` |

---

## �� Support

### **Documentation API complète**
- **Swagger** : http://localhost:5000/api/docs
- **Postman** : Importer la collection depuis Swagger

### **Identifiants de test**
| Rôle | Nom d'utilisateur | Mot de passe |
|-------|----------------|-------------|
| Admin | `root` | `root` |
| Secretariat | `admin` | `admin` |
| Étudiant | `mmartin2024` | `password123` |
| Enseignant | `jdupontweb` | `password123` |

---

## 🎓 Conclusion

Cette documentation fournit tous les éléments nécessaires pour intégrer l'authentification JWT Bull ASUR dans n'importe quel frontend JavaScript/React/Vue/Angular.

**Points clés** :
- JWT Bearer Token
- Rôles différenciés
- Protection des routes
- Gestion des erreurs
- Identifiants de test intégrés

**Pour toute question** : consulter la documentation Swagger ou contacter l'équipe développement.
