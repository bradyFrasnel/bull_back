# 📡 API Endpoints Complet - Bull ASUR

## 🔐 Authentification (7 endpoints)

### **Connexion**
```http
POST /auth/etudiant/login       - Connexion étudiant
POST /auth/enseignant/login    - Connexion enseignant
POST /auth/admin/login           - Connexion admin/secretariat
```

### **Gestion mots de passe**
```http
PUT /auth/etudiant/change-password    - Changer mot de passe étudiant
PUT /auth/enseignant/change-password  - Changer mot de passe enseignant
```

### **Création utilisateurs (admin)**
```http
POST /auth/admin/create-enseignant  - Créer enseignant (admin)
POST /auth/admin/create-etudiant    - Créer étudiant (admin)
```

---

## 👥 Gestion Étudiants (7 endpoints)

### **CRUD complet**
```http
GET    /etudiants                    - Lister tous les étudiants
GET    /etudiants/:id               - Détails étudiant
GET    /etudiants/matricule/:matricule - Par matricule
GET    /etudiants/user/:userId       - Par utilisateur
POST   /etudiants                    - Créer étudiant
PUT    /etudiants/:id               - MAJ étudiant
DELETE /etudiants/:id               - Supprimer étudiant
```

---

## 👨‍🏫 Gestion Enseignants (10 endpoints)

### **CRUD complet**
```http
GET    /enseignants                    - Lister tous les enseignants
GET    /enseignants/:id               - Détails enseignant
GET    /enseignants/user/:userId       - Par utilisateur
POST   /enseignants                    - Créer enseignant
PUT    /enseignants/:id               - MAJ enseignant
DELETE /enseignants/:id               - Supprimer enseignant
```

### **Gestion Matières**
```http
POST   /enseignants/:enseignantId/matieres/:matiereId      - Assigner matière
DELETE /enseignants/:enseignantId/matieres/:matiereId   - Retirer matière
GET    /enseignants/:enseignantId/matieres               - Matières enseignées
GET    /enseignants/matieres/:matiereId/enseignants       - Enseignants d'une matière
```

---

## 📚 Référentiel Académique (30 endpoints)

### **Matières (6 endpoints)**
```http
GET    /matieres                    - Lister toutes les matières
GET    /matieres/:id               - Détails matière
GET    /matieres/ue/:ueId         - Par UE
POST   /matieres                    - Créer matière
PUT    /matieres/:id               - MAJ matière
DELETE /matieres/:id               - Supprimer matière
```

### **Unités Enseignement (6 endpoints)**
```http
GET    /unites-enseignement                    - Lister toutes les UE
GET    /unites-enseignement/:id               - Détails UE
GET    /unites-enseignement/semestre/:semestreId - Par semestre
POST   /unites-enseignement                    - Créer UE
PUT    /unites-enseignement/:id               - MAJ UE
DELETE /unites-enseignement/:id               - Supprimer UE
```

### **Semestres (6 endpoints)**
```http
GET    /semestres                    - Lister tous les semestres
GET    /semestres/:id               - Détails semestre
GET    /semestres/annee/:annee       - Par année
POST   /semestres                    - Créer semestre
PUT    /semestres/:id               - MAJ semestre
DELETE /semestres/:id               - Supprimer semestre
```

---

## 📝 Évaluations (9 endpoints)

### **CRUD complet**
```http
GET    /evaluations                              - Lister toutes les évaluations
GET    /evaluations/:id                           - Détails évaluation
GET    /evaluations/etudiant/:etudiantId          - Par étudiant
GET    /evaluations/matiere/:matiereId            - Par matière
GET    /evaluations/type/:type                     - Par type
GET    /evaluations/etudiant/:etudiantId/matiere/:matiereId - Étudiant + matière
POST   /evaluations                              - Créer évaluation
PUT    /evaluations/:id                           - MAJ évaluation
DELETE /evaluations/:id                           - Supprimer évaluation
```

---

## 🧮 Calculs (5 endpoints)

### **Calculs automatiques**
```http
POST /calculs/etudiant/:etudiantId/matiere/:matiereId           - Calcul matière
POST /calculs/etudiant/:etudiantId/ue/:ueId                 - Calcul UE
POST /calculs/etudiant/:etudiantId/semestre/:semestreId       - Calcul semestre
POST /calculs/etudiant/:etudiantId/recalculer-tout          - Recalculer tout
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details   - Détails calcul
```

---

## 🔐 Sécurité

### **Headers requis**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Droits par rôle**
| Rôle | Authentification | Étudiants | Enseignants | Matières | UE | Semestres | Évaluations | Calculs |
|-------|----------------|-----------|-------------|----------|-----|-----------|------------|---------|
| **ADMIN** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| **SECRETARIAT** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| **ENSEIGNANT** | ✅ | ✅ Lecture | ✅ CRUD | ❌ | ❌ | ❌ | ✅ CRUD | ❌ |
| **ETUDIANT** | ✅ | ✅ Lecture soi-même | ❌ | ❌ | ❌ | ❌ | ✅ Lecture | ❌ |

---

## 📊 Corps des Requêtes

### **Authentification**
```json
// Login étudiant
{
  "nom": "mmartin2024",
  "password": "password123"
}

// Login enseignant
{
  "nom": "jdupontweb", 
  "password": "password123"
}

// Login admin
{
  "nom": "root",
  "password": "root"
}
```

### **Création étudiant**
```json
{
  "nom": "martin",
  "prenom": "Sophie",
  "email": "sophie.martin@asur.fr",
  "password": "password123",
  "matricule": "2024ASUR005"
}
```

### **Création enseignant**
```json
{
  "nom": "dupont",
  "prenom": "Jean",
  "email": "jean.dupont@asur.fr",
  "password": "password123",
  "matricule": "ENS2024002",
  "specialite": "Mathématiques"
}
```

### **Création matière**
```json
{
  "libelle": "Développement Web",
  "coefficient": 2.5,
  "credits": 6,
  "uniteEnseignementId": "ue123"
}
```

### **Création évaluation**
```json
{
  "utilisateurId": "cm123",
  "matiereId": "mat456",
  "type": "CC",
  "note": 15.5,
  "saisiePar": "cm789"
}
```

---

## 🎯 Codes de Réponse

### **Succès (200)**
```json
{
  "id": "cm123",
  "nom": "martin",
  "prenom": "Sophie",
  "email": "martin@asur.fr",
  "role": "ETUDIANT"
}
```

### **Authentification réussie**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "etudiant": { ... }
}
```

### **Erreur (400/401/403/404/500)**
```json
{
  "statusCode": 401,
  "message": "Identifiants invalides",
  "error": "Unauthorized"
}
```

---

## 🚨 Gestion des Erreurs

### **Codes HTTP courants**
- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Accès refusé (rôle insuffisant)
- **404** : Ressource non trouvée
- **500** : Erreur serveur

### **Messages d'erreur spécifiques**
```json
// Rattrapage non autorisé
{
  "message": "Rattrapage non autorisé : moyenne initiale (8.40) ≥ 6/20"
}

// CC ou Examen manquant
{
  "message": "Rattrapage non autorisé : CC ou Examen manquant"
}

// Utilisateur non trouvé
{
  "message": "Identifiants invalides"
}
```

---

## 📱 Configuration

### **URL de base**
```
Développement : http://localhost:5000
Production    : https://api.bull-asur.fr
```

### **Documentation**
```
Swagger UI : http://localhost:5000/api/docs
OpenAPI    : http://localhost:5000/api/docs-json
```

---

## 🔄 Workflow Type

### **1. Connexion**
```javascript
1. POST /auth/{role}/login
2. Stocker access_token
3. Stocker user_info
4. Rediriger vers dashboard
```

### **2. CRUD Standard**
```javascript
1. GET /ressource          // Lister
2. POST /ressource         // Créer
3. GET /ressource/:id      // Détails
4. PUT /ressource/:id       // MAJ
5. DELETE /ressource/:id    // Supprimer
```

### **3. Calculs académiques**
```javascript
1. POST /evaluations           // Saisir note
2. POST /calculs/...        // Recalculer automatique
3. Règle rattrapage < 6  // Validation automatique
4. 2 meilleures notes      // Calcul intelligent
```

---

## 📞 Support

### **Identifiants de test**
| Rôle | Nom | Mot de passe |
|-------|------|-------------|
| Admin | root | root |
| Secretariat | admin | admin |
| Étudiant | mmartin2024 | password123 |
| Enseignant | jdupontweb | password123 |

### **Outils de test**
- **Postman** : Importer collection depuis Swagger
- **curl** : Commandes lignes disponibles
- **Swagger UI** : Interface interactive

---

**Total : 64 endpoints API** 🚀

Tous les endpoints sont documentés avec exemples de requêtes/réponses.
