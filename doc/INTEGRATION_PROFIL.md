# 🔗 Intégration Service Profil - Bull ASUR

## 🎯 Objectif

Guide complet pour intégrer le service profil dans le frontend Bull ASUR.

---

## 🛠️ Prérequis

### **Backend**
- Service profil déployé sur `http://localhost:5000`
- Token JWT valide requis
- Utilisateur connecté

### **Frontend**
- Projet React configuré
- Axios installé pour les appels API
- React Router pour la navigation

---

## 🔧 Configuration

### **1. Variables d'environnement**
```bash
# .env (frontend)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_PROFIL_ENDPOINT=/profil
```

### **2. Service API**
```javascript
// src/services/profilService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const profilApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
profilApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erreur API Profil:', error);
    return Promise.reject(error);
  }
);

export default profilApi;
```

---

## 🎨 Composants React

### **1. ProfilContainer.jsx**
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profilApi } from '../../services/profilService';

const ProfilContainer = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('informations');
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({});
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Charger les informations du profil au montage
  useEffect(() => {
    if (user) {
      loadProfil();
    }
  }, [user]);

  const loadProfil = async () => {
    try {
      const response = await profilApi.get('/');
      setFormData(response.data);
    } catch (error) {
      setMessage('Erreur lors du chargement du profil');
    }
  };

  const handleProfilSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage('');

    try {
      const response = await profilApi.put('/', formData);
      setMessage('Profil mis à jour avec succès');
      setFormData(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage('');

    try {
      const response = await profilApi.post('/change-password', passwordData);
      setMessage('Mot de passe changé avec succès');
      setPasswordData({});
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informations':
        return <ProfilForm 
          formData={formData} 
          setFormData={setFormData}
          onSubmit={handleProfilSubmit}
          loading={submitLoading}
          user={user}
        />;
      case 'password':
        return <PasswordForm 
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          onSubmit={handlePasswordSubmit}
          loading={submitLoading}
        />;
      case 'preferences':
        return <PreferencesForm 
          user={user} 
        />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="profil-container">
      <div className="profil-header">
        <h2>Mon Profil</h2>
        <div className="profil-tabs">
          <button 
            className={`tab ${activeTab === 'informations' ? 'active' : ''}`}
            onClick={() => setActiveTab('informations')}
          >
            Informations
          </button>
          <button 
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Mot de passe
          </button>
          <button 
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Préférences
          </button>
        </div>
      </div>

      <div className="profil-content">
        {renderTabContent()}
      </div>

      {message && (
        <div className={`alert ${message.includes('succès') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfilContainer;
```

### **2. ProfilForm.jsx**
```jsx
import React from 'react';

const ProfilForm = ({ formData, setFormData, onSubmit, loading, user }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderSpecificFields = () => {
    switch (user.role) {
      case 'ETUDIANT':
        return (
          <>
            <div className="form-group">
              <label>Prénom:</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Matricule:</label>
              <input
                type="text"
                name="matricule"
                value={formData.matricule || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </>
        );
      case 'ENSEIGNANT':
        return (
          <>
            <div className="form-group">
              <label>Prénom:</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Matricule:</label>
              <input
                type="text"
                name="matricule"
                value={formData.matricule || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Spécialité:</label>
              <input
                type="text"
                name="specialite"
                value={formData.specialite || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={onSubmit} className="profil-form">
      <h3>Informations Personnelles</h3>
      
      <div className="form-group">
        <label>Nom:</label>
        <input
          type="text"
          name="nom"
          value={formData.nom || user.nom}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email || user.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {renderSpecificFields()}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
      </button>
    </form>
  );
};

export default ProfilForm;
```

### **3. PasswordForm.jsx**
```jsx
import React, { useState, useEffect } from 'react';

const PasswordForm = ({ passwordData, setPasswordData, onSubmit, loading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Valider en temps réel
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'currentPassword':
        if (!value) {
          newErrors.currentPassword = 'Mot de passe actuel requis';
        } else {
          delete newErrors.currentPassword;
        }
        break;
      case 'newPassword':
        if (!value || value.length < 8) {
          newErrors.newPassword = 'Minimum 8 caractères';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.newPassword = 'Doit contenir majuscule, minuscule et chiffre';
        } else {
          delete newErrors.newPassword;
        }
        break;
      case 'newPasswordConfirmation':
        if (value !== passwordData.newPassword) {
          newErrors.newPasswordConfirmation = 'Les mots de passe ne correspondent pas';
        } else {
          delete newErrors.newPasswordConfirmation;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={onSubmit} className="password-form">
      <h3>Changement de Mot de passe</h3>
      
      <div className="form-group">
        <label>Mot de passe actuel:</label>
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            name="currentPassword"
            value={passwordData.currentPassword || ''}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button 
            type="button" 
            onClick={togglePasswordVisibility}
            className="password-toggle"
          >
            {showPassword ? '👁' : '👁'}
          </button>
        </div>
        {errors.currentPassword && (
          <span className="error">{errors.currentPassword}</span>
        )}
      </div>

      <div className="form-group">
        <label>Nouveau mot de passe:</label>
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={passwordData.newPassword || ''}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button 
            type="button" 
            onClick={togglePasswordVisibility}
            className="password-toggle"
          >
            {showPassword ? '👁' : '👁'}
          </button>
        </div>
        {errors.newPassword && (
          <span className="error">{errors.newPassword}</span>
        )}
      </div>

      <div className="form-group">
        <label>Confirmation nouveau mot de passe:</label>
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            name="newPasswordConfirmation"
            value={passwordData.newPasswordConfirmation || ''}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        {errors.newPasswordConfirmation && (
          <span className="error">{errors.newPasswordConfirmation}</span>
        )}
      </div>

      <div className="password-requirements">
        <h4>Exigences:</h4>
        <ul>
          <li>Minimum 8 caractères</li>
          <li>Au moins une majuscule</li>
          <li>Au moins une minuscule</li>
          <li>Au moins un chiffre</li>
        </ul>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
      </button>
    </form>
  );
};

export default PasswordForm;
```

---

## 🎨 Styles CSS

### **profil.css**
```css
.profil-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.profil-header {
  margin-bottom: 30px;
}

.profil-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 15px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.tab.active {
  background: #007bff;
  color: white;
  border-bottom: 2px solid #007bff;
}

.profil-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.profil-form, .password-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.password-input {
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  margin-right: 10px;
}

.password-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
}

.password-requirements {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.password-requirements h4 {
  margin-bottom: 10px;
  color: #333;
}

.password-requirements ul {
  margin: 0;
  padding-left: 20px;
}

.password-requirements li {
  margin-bottom: 5px;
  color: #666;
}

.btn-primary {
  width: 100%;
  padding: 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.alert {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

---

## 🔄 Intégration dans l'App

### **App.jsx**
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilContainer from './components/ProfilContainer';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/profil/*" 
          element={
            <ProtectedRoute>
              <ProfilContainer />
            </ProtectedRoute>
          } 
        />
        {/* Autres routes... */}
      </Routes>
    </Router>
  );
};

export default App;
```

---

## 🧪 Tests

### **Tests unitaires**
```javascript
// __tests__/services/profilService.test.js
import { ProfilService } from '../../src/services/profilService';

describe('ProfilService', () => {
  test('devrait récupérer le profil complet', async () => {
    // Test de récupération du profil
  });

  test('devrait mettre à jour le profil', async () => {
    // Test de mise à jour
  });

  test('devrait changer le mot de passe', async () => {
    // Test de changement de mot de passe
  });
});
```

### **Tests d'intégration**
```javascript
// __tests__/e2e/profil.e2e.js
const { test, expect } = require('@playwright/test');

test('flux complet de gestion de profil', async ({ page }) => {
  // 1. Se connecter
  await page.goto('/login');
  await page.fill('[name="nom"]', 'mmartin2024');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  // 2. Accéder au profil
  await page.goto('/profil');
  await expect(page.locator('h2')).toContainText('Mon Profil');

  // 3. Mettre à jour le profil
  await page.fill('[name="prenom"]', 'Sophie');
  await page.click('[type="submit"]');

  // 4. Changer le mot de passe
  await page.click('button:has-text("Mot de passe")');
  await page.fill('[name="currentPassword"]', 'password123');
  await page.fill('[name="newPassword"]', 'newPassword456');
  await page.fill('[name="newPasswordConfirmation"]', 'newPassword456');
  await page.click('[type="submit"]');

  // 5. Vérifier le succès
  await expect(page.locator('.alert.success')).toBeVisible();
});
```

---

## 🚀 Déploiement

### **Configuration production**
```bash
# .env.production
REACT_APP_API_URL=https://api.bull-asur.fr
REACT_APP_PROFIL_ENDPOINT=/profil
```

### **Build**
```bash
npm run build
```

### **Déploiement**
```bash
# Déploiement sur le serveur de production
npm run deploy

# Ou avec Docker
docker build -t bull-asur-frontend .
docker run -p 3000:3000 bull-asur-frontend
```

---

## 📱 Monitoring

### **Logs du service**
```bash
# Logs du backend
npm run start:dev --verbose

# Logs du frontend
REACT_APP_DEBUG=true npm start
```

### **Métriques**
```javascript
// Analytics d'utilisation du profil
const trackProfilUpdate = () => {
  // Envoyer des métriques d'utilisation
  analytics.track('profil_updated', {
    role: user.role,
    timestamp: new Date().toISOString()
  });
};
```

---

## 🎯 Checklist d'Intégration

- [ ] Service profil configuré dans le backend
- [ ] Routes profil accessibles via Swagger
- [ ] Composants React créés
- [ ] Service API frontend implémenté
- [ ] Formulaire de mise à jour fonctionnel
- [ ] Changement de mot de passe sécurisé
- [ ] Validation des entrées
- [ ] Gestion des erreurs
- [ ] Tests unitaires écrits
- [ ] Tests E2E créés
- [ ] Documentation utilisateur
- [ ] Déploiement configuré

---

## 📞 Support

### **Documentation API**
- **Endpoints profil** : `/profil` dans Swagger
- **Référence complète** : `doc/SERVICE_PROFIL.md`

### **Aide développement**
- **Backend** : Port 5000
- **Frontend** : Port 3000
- **Base de données** : PostgreSQL

---

**Service profil prêt pour l'intégration complète !** 👤✨
