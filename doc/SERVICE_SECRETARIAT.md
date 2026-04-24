# 📋 Service Sécrétariat - Bull ASUR

## 🎯 Objectif

Documentation complète pour la gestion des comptes et fonctionnalités secrétariat dans Bull ASUR.

---

## 🌐 URLs de l'API

**Production** ✅ : `https://bull-back-z97c.onrender.com`
**Développement** : `http://localhost:5000`
**Documentation** : `https://bull-back-z97c.onrender.com/api/docs`

---

## 🔐 Authentification Sécrétariat

### **Créer un compte secrétariat**
```http
POST /auth/secretariat/register
Content-Type: application/json

{
  "nom": "secretariat01",
  "email": "secretariat@asur.fr",
  "password": "password123"
}
```

**Réponse (201)** :
```json
{
  "id": "cm123abc",
  "utilisateurId": "cm456def",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### **Connexion secrétariat**
```http
POST /auth/secretariat/login
Content-Type: application/json

{
  "nom": "secretariat01",
  "password": "password123"
}
```

**Réponse (200)** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "secretariat": {
    "id": "cm123abc",
    "nom": "secretariat01",
    "email": "secretariat@asur.fr",
    "role": "SECRETARIAT"
  }
}
```

---

## 👤 Profil Sécrétariat

### **Voir mon profil**
```http
GET /profil
Authorization: Bearer {token}
```

### **Modifier mon profil**
```http
PUT /profil
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "nouveau.email@asur.fr"
}
```

### **Changer mot de passe**
```http
POST /profil/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "ancienMotDePasse",
  "newPassword": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

---

## 📚 Gestion Académique

### **Étudiants**
```http
GET    /etudiants                    - Lister tous les étudiants
POST   /etudiants                    - Créer un étudiant
GET    /etudiants/:id                - Voir détail étudiant
PUT    /etudiants/:id                - Modifier étudiant
DELETE /etudiants/:id                - Supprimer étudiant
```

### **Enseignants**
```http
GET    /enseignats                   - Lister tous les enseignants
POST   /enseignats                   - Créer un enseignant
GET    /enseignats/:id               - Voir détail enseignant
PUT    /enseignats/:id               - Modifier enseignant
DELETE /enseignats/:id               - Supprimer enseignant
```

### **Matières**
```http
GET    /matieres                     - Lister toutes les matières
POST   /matieres                     - Créer une matière
GET    /matieres/:id                 - Voir détail matière
PUT    /matieres/:id                 - Modifier matière
DELETE /matieres/:id                 - Supprimer matière
```

### **Évaluations**
```http
GET    /evaluations                  - Lister toutes les évaluations
POST   /evaluations                  - Créer une évaluation
GET    /evaluations/:id              - Voir détail évaluation
PUT    /evaluations/:id              - Modifier évaluation
DELETE /evaluations/:id              - Supprimer évaluation
```

---

## 🧮 Calculs et Moyennes

### **Recalculer automatiquement**
```http
POST /calculs/etudiant/:id/matiere/:matiereId     - Recalculer matière
POST /calculs/etudiant/:id/ue/:ueId              - Recalculer UE
POST /calculs/etudiant/:id/semestre/:semestreId   - Recalculer semestre
POST /calculs/etudiant/:id/recalculer-tout        - Recalculer tout
```

---

## 📱 Exemples d'utilisation

### **Créer un étudiant**
```http
POST /etudiants
Authorization: Bearer {token}
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

### **Créer une évaluation**
```http
POST /evaluations
Authorization: Bearer {token}
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

## 🔧 Permissions

Le rôle **SECRETARIAT** peut :

- ✅ **Gérer les étudiants** (CRUD complet)
- ✅ **Gérer les enseignants** (CRUD complet)
- ✅ **Gérer les matières et UE**
- ✅ **Créer et modifier les évaluations**
- ✅ **Déclencher les calculs de moyennes**
- ✅ **Voir les profils utilisateurs**
- ❌ **Accès admin** (limité aux données académiques)

---

## 🎯 Workflow Type

### **1. Connexion**
```javascript
1. POST /auth/secretariat/login
2. Stocker access_token
3. Utiliser pour toutes les requêtes
```

### **2. Gestion académique**
```javascript
1. Créer/Modifier étudiants
2. Assigner aux matières
3. Saisir évaluations
4. Calculer moyennes automatiquement
```

---

## 📊 État Actuel

### **✅ Fonctionnalités implémentées**
- Authentification secrétariat
- Gestion CRUD étudiants/enseignants
- Gestion matières/UE
- Saisie évaluations
- Calculs automatiques
- Profil utilisateur

### **🧪 Tests validés - 24/04/2026**
```http
POST https://bull-back-z97c.onrender.com/auth/secretariat/register
{
  "nom": "admin",
  "email": "secretariat2@render.fr", 
  "password": "Admin1"
}
// ✅ Réponse : { "utilisateurId": "cmod5ok300000hb1qtl21no97" }
```

### **🚀 Prêt pour l'intégration**
- API complète et documentée
- Tokens JWT fonctionnels
- Base de données synchronisée
- Tests production validés

---

**🎓 Le service secrétariat est maintenant 100% opérationnel !**
