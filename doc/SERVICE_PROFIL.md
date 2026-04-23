# 👤 Service Profil Utilisateur - Bull ASUR

## 🎯 Objectif

Service complet pour gérer les profils utilisateurs et permettre le changement de mot de passe.

---

## 🔐 Endpoints Disponibles

### **Informations profil**
```http
GET /profil
Authorization: Bearer <token>
```

### **Mise à jour profil**
```http
PUT /profil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "martin",
  "email": "martin@asur.fr",
  "prenom": "Sophie",
  "matricule": "2024ASUR005"
}
```

### **Changement mot de passe**
```http
POST /profil/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456",
  "newPasswordConfirmation": "newPassword456"
}
```

### **Préférences utilisateur**
```http
GET /profil/preferences
Authorization: Bearer <token>
```

```http
PUT /profil/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "dark",
  "langue": "en",
  "notifications": {
    "email": true,
    "sms": false
  }
}
```

---

## 🛠️ Implémentation Technique

### **Structure des données**
```typescript
// Profil complet selon le rôle
interface ProfilComplet {
  // Informations communes
  id: string;
  nom: string;
  email: string;
  role: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR' | 'SECRETARIAT';
  createdAt: Date;
  
  // Spécifiques Étudiant
  prenom?: string;
  matricule?: string;
  
  // Spécifiques Enseignant
  prenom?: string;
  matricule?: string;
  specialite?: string;
  
  // Spécifiques Admin/Secretariat
  // Pas de champs supplémentaires
}
```

### **Validation du mot de passe**
```typescript
// Vérification du mot de passe actuel
const isCurrentPasswordValid = await bcrypt.compare(
  changePasswordDto.currentPassword, 
  utilisateur.password
);

// Hashage du nouveau mot de passe
const hashedNewPassword = await bcrypt.hash(
  changePasswordDto.newPassword, 
  10
);
```

---

## 🔐 Sécurité

### **Autorisation requise**
Toutes les routes nécessitent un token JWT valide dans le header :
```http
Authorization: Bearer <votre_token_jwt>
```

### **Validation des entrées**
```typescript
// Mot de passe actuel requis
if (!changePasswordDto.currentPassword) {
  throw new BadRequestException('Mot de passe actuel requis');
}

// Nouveau mot de passe minimum 8 caractères
@MinLength(8)
newPassword: string;

// Complexité du mot de passe
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
newPassword: string;
```

---

## 📊 Réponses API

### **Succès**
```json
// GET /profil
{
  "id": "cm123",
  "nom": "martin",
  "email": "martin@asur.fr",
  "role": "ETUDIANT",
  "prenom": "Sophie",
  "matricule": "2024ASUR005",
  "createdAt": "2024-01-15T10:30:00Z"
}

// PUT /profil
{
  "message": "Profil mis à jour avec succès",
  "profil": { ... }
}

// POST /profil/change-password
{
  "message": "Mot de passe changé avec succès"
}
```

### **Erreurs**
```json
// 400 - Mot de passe actuel incorrect
{
  "statusCode": 400,
  "message": "Mot de passe actuel incorrect",
  "error": "BadRequestException"
}

// 404 - Utilisateur non trouvé
{
  "statusCode": 404,
  "message": "Utilisateur non trouvé",
  "error": "NotFoundException"
}

// 401 - Non authentifié
{
  "statusCode": 401,
  "message": "Accès non autorisé",
  "error": "Unauthorized"
}
```

---

## 🎨 Cas d'Utilisation

### **1. Étudiant met à jour son profil**
```javascript
const updateProfil = async () => {
  const token = localStorage.getItem('access_token');
  const updateData = {
    prenom: "Sophie",
    email: "sophie.martin@asur.fr"
  };

  const response = await fetch('/profil', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  const updatedProfil = await response.json();
  console.log('Profil mis à jour:', updatedProfil);
};
```

### **2. Enseignant change son mot de passe**
```javascript
const changePassword = async () => {
  const token = localStorage.getItem('access_token');
  const passwordData = {
    currentPassword: "oldPassword123",
    newPassword: "newPassword456",
    newPasswordConfirmation: "newPassword456"
  };

  const response = await fetch('/profil/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(passwordData)
  });

  const result = await response.json();
  console.log('Résultat:', result.message);
};
```

### **3. Obtenir les préférences**
```javascript
const getPreferences = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('/profil/preferences', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const preferences = await response.json();
  console.log('Préférences:', preferences);
  
  // Appliquer les préférences
  if (preferences.theme === 'dark') {
    document.body.classList.add('dark-theme');
  }
};
```

---

## 🔧 Configuration

### **Variables d'environnement**
```bash
# .env
# Profil service settings
PROFILE_PASSWORD_MIN_LENGTH=8
PROFILE_PASSWORD_REQUIRE_UPPERCASE=true
PROFILE_PASSWORD_REQUIRE_LOWERCASE=true
PROFILE_PASSWORD_REQUIRE_NUMBERS=true
PROFILE_PASSWORD_REQUIRE_SPECIAL=true
```

### **Dépendances**
```json
{
  "dependencies": {
    "bcrypt": "^5.0.0",
    "class-validator": "^0.14.0",
    "@nestjs/swagger": "^7.0.0"
  }
}
```

---

## 🔄 Workflow Frontend

### **1. Page Profil**
```jsx
// src/components/Profil.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Profil = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Charger les informations de l'utilisateur
    if (user) {
      setFormData({
        nom: user.nom,
        email: user.email,
        prenom: user.prenom,
        matricule: user.matricule
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/profil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      setMessage('Profil mis à jour avec succès');
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profil-container">
      <h2>Mon Profil</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom:</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
            disabled={loading}
          />
        </div>

        {/* Champs spécifiques selon le rôle */}
        {user.role === 'ETUDIANT' && (
          <>
            <div className="form-group">
              <label>Prénom:</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Matricule:</label>
              <input
                type="text"
                name="matricule"
                value={formData.matricule}
                onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                disabled={loading}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </form>

      {message && <div className="message">{message}</div>}
    </div>
  );
};
```

---

## 🎯 Avantages

### **✅ Sécurité renforcée**
- Validation robuste des mots de passe
- Hashage bcrypt
- Vérification du mot de passe actuel
- Tokens JWT sécurisés

### **✅ Flexibilité**
- Profil adaptable selon le rôle
- Préférences personnalisables
- Mise à jour partielle possible

### **✅ Bonnes pratiques**
- Séparation des responsabilités
- Validation des entrées
- Gestion des erreurs appropriée
- Documentation complète

---

## 📞 Support

### **Tests**
```bash
# Tester le service profil
npm run test:profil

# Tests E2E
npm run test:e2e:profil
```

### **Débogage**
```bash
# Logs du service
npm run start:dev --verbose
```

---

**Service profil prêt pour l'intégration !** 👤✨
