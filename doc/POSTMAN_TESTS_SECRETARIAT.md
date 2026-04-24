# 🧪 Tests Postman - Sécrétariat Bull ASUR

## 🌐 Configuration

**Base URL Render** : `https://bull-back-z97c.onrender.com`

---

## 🔐 Tests Authentification Sécrétariat

### **1. Créer un compte secrétariat**
```http
POST https://bull-back-z97c.onrender.com/auth/secretariat/register
Content-Type: application/json

{
  "nom": "secretariat01",
  "email": "secretariat01@asur.fr",
  "password": "password123"
}
```

**Réponse attendue (201)** :
```json
{
  "id": "cm123abc",
  "utilisateurId": "cm456def",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### **2. Créer un deuxième compte avec même nom**
```http
POST https://bull-back-z97c.onrender.com/auth/secretariat/register
Content-Type: application/json

{
  "nom": "secretariat01",  // MÊME NOM ✅
  "email": "secretariat02@asur.fr",  // EMAIL DIFFÉRENT ✅
  "password": "password123"
}
```

### **3. Connexion secrétariat**
```http
POST https://bull-back-z97c.onrender.com/auth/secretariat/login
Content-Type: application/json

{
  "nom": "secretariat01",
  "password": "password123"
}
```

**Réponse attendue (200)** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "secretariat": {
    "id": "cm123abc",
    "nom": "secretariat01",
    "email": "secretariat01@asur.fr",
    "role": "SECRETARIAT"
  }
}
```

---

## 👤 Tests Profil Utilisateur

### **4. Voir profil (avec token)**
```http
GET https://bull-back-z97c.onrender.com/profil
Authorization: Bearer {token_du_login}
```

### **5. Modifier profil**
```http
PUT https://bull-back-z97c.onrender.com/profil
Authorization: Bearer {token_du_login}
Content-Type: application/json

{
  "email": "nouveau.email@asur.fr"
}
```

### **6. Changer mot de passe**
```http
POST https://bull-back-z97c.onrender.com/profil/change-password
Authorization: Bearer {token_du_login}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

---

## 📚 Tests Gestion Académique

### **7. Lister les étudiants**
```http
GET https://bull-back-z97c.onrender.com/etudiants
Authorization: Bearer {token_du_login}
```

### **8. Créer un étudiant**
```http
POST https://bull-back-z97c.onrender.com/etudiants
Authorization: Bearer {token_du_login}
Content-Type: application/json

{
  "utilisateur": {
    "nom": "martin",
    "email": "martin@asur.fr",
    "password": "password123"
  },
  "prenom": "Pierre",
  "matricule": "2024ASUR010"
}
```

### **9. Lister les enseignants**
```http
GET https://bull-back-z97c.onrender.com/enseignats
Authorization: Bearer {token_du_login}
```

### **10. Créer une évaluation**
```http
POST https://bull-back-z97c.onrender.com/evaluations
Authorization: Bearer {token_du_login}
Content-Type: application/json

{
  "utilisateurId": "cm123abc",
  "matiereId": "cm456def",
  "type": "CC",
  "note": 15.5,
  "dateEvaluation": "2024-01-20T10:00:00Z"
}
```

---

## 🧮 Tests Calculs

### **11. Recalculer tout pour un étudiant**
```http
POST https://bull-back-z97c.onrender.com/calculs/etudiant/{etudiantId}/recalculer-tout
Authorization: Bearer {token_du_login}
```

---

## 🎯 Points de validation

### **✅ Tests validés - 24/04/2026**
- **Création secrétariat** : ✅ `https://bull-back-z97c.onrender.com/auth/secretariat/register`
- **Réponse attendue** : ✅ `{ "utilisateurId": "cmod5ok300000hb1qtl21no97" }`
- **Connexion par nom** : ✅ (comme autres rôles)
- **Token JWT** valide
- **CRUD académique** complet
- **Calculs automatiques**

### **🔍 Codes d'erreur attendus**
- **400** : Données invalides
- **401** : Identifiants incorrects
- **403** : Permissions insuffisantes
- **404** : Ressource non trouvée

---

## 🚀 Workflow complet

1. **Créer compte** → Obtenir `utilisateurId`
2. **Se connecter** → Obtenir `access_token`
3. **Utiliser token** → Accéder aux endpoints protégés
4. **Gérer données** → CRUD académique
5. **Calculer** → Moyennes automatiques

**Tous les tests sont prêts pour Postman !** 🎉
