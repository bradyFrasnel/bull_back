# 📡 API Endpoints Complet - Bull ASUR

## 🌐 URLs de l'API

**Production** ✅ : `https://bull-back-z97c.onrender.com`
**Documentation** : `https://bull-back-z97c.onrender.com/api/docs`
**Health** : `https://bull-back-z97c.onrender.com/health`

**Développement** : `http://localhost:5000`
**Réseau** : `http://0.0.0.0:5000`

---

## 🔐 Authentification (11 endpoints)

### **Connexion**
```http
POST /auth/etudiant/login       - Connexion étudiant (nom)
POST /auth/enseignant/login    - Connexion enseignant (nom)
POST /auth/admin/login           - Connexion admin (nom)
POST /auth/secretariat/login    - Connexion secrétariat (nom)
```

### **Création de comptes (register)**
```http
POST /auth/secretariat/register  - Créer compte secrétariat
POST /auth/admin/register       - Créer compte admin
```

### **Gestion mots de passe**
```http
PUT /auth/etudiant/change-password    - Changer mot de passe étudiant
PUT /auth/enseignant/change-password  - Changer mot de passe enseignant
```

### **Création par administrateur (create-)**
```http
POST /auth/admin/create-enseignant  - Créer enseignant (admin)
POST /auth/admin/create-etudiant    - Créer étudiant (admin)
```

### **Règles de création**
- **Étudiants** : Admin + Secretariat (CRUD)
- **Secretariat** : Auto-inscription uniquement  
- **Enseignants** : Admin + Secretariat (CRUD)
- **Admins** : Auto-inscription uniquement

*Note: Les endpoints register étudiants/enseignants sont désactivés. Utiliser les endpoints CRUD avec permissions appropriées.*

---

## 🧪 **RÉCAPITULATIF DES TESTS VALIDÉS**

### **✅ Tests de création validés sur production**

#### **1. Semestre**
- **Endpoint** : `POST /semestres`
- **DTO** : `{ libelle, anneeUniversitaire, code }`
- **Statut** : ✅ Validé

#### **2. Unité d'Enseignement (UE)**
- **Endpoint** : `POST /unites-enseignement`
- **DTO** : `{ code, libelle, semestreId }`
- **Statut** : ✅ Validé

#### **3. Matière**
- **Endpoint** : `POST /matieres`
- **DTO** : `{ libelle, coefficient, credits, uniteEnseignementId }`
- **Statut** : ✅ Validé

#### **4. Enseignant**
- **Endpoint** : `POST /enseignants`
- **DTO** : `{ nom, prenom, matricule, specialite, email, password }`
- **Statut** : ✅ Validé

#### **5. Étudiant**
- **Endpoint** : `POST /etudiants`
- **DTO** : `{ nom, prenom, matricule, identifiant, email, password, date_naissance, lieu_naissance, bac_type, annee_bac, mention_bac, telephone?, adresse? }`
- **Statut** : ✅ Validé

#### **6. Profil Utilisateur**
- **Endpoint** : `GET /profil`
- **Auth** : Token JWT requis (utilisateur connecté)
- **Statut** : ✅ Validé

#### **7. Listes Complètes**
- **GET /semestres** : Lister tous les semestres avec UE incluses ✅
- **GET /unites-enseignement** : Lister toutes les UE avec semestre inclus ✅
- **GET /etudiants** : Lister tous les étudiants avec utilisateur inclus ✅
- **GET /enseignants** : Lister tous les enseignants avec utilisateur inclus ✅

### **📊 Hiérarchie validée**
```
Semestre → Unité d'Enseignement → Matière
   ↓              ↓                    ↓
   ID            ID                   ID
```

### **🔐 Permissions confirmées**
- **Admin + Secretariat** : Création complète validée
- **Tokens JWT** : Authentification fonctionnelle
- **Relations** : Inclusion automatique des données parentes

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

### **Évaluations (8 endpoints)**
```http
POST   /evaluations                    - Créer évaluation (Secretariat/Enseignant)
GET    /evaluations                    - Lister évaluations (Secretariat/Enseignant)
GET    /evaluations/:id               - Détails évaluation
GET    /evaluations/etudiant/:etudiantId - Par étudiant
GET    /evaluations/matiere/:matiereId  - Par matière
GET    /evaluations/type/:type          - Par type
PUT    /evaluations/:id               - MAJ évaluation (Secretariat/Enseignant)
DELETE /evaluations/:id               - Supprimer évaluation (Secretariat/Enseignant)
```

### **Calculs (6 endpoints)**
```http
POST /calculs/etudiant/:etudiantId/matiere/:matiereId      - Calculer matière (Secretariat/Enseignant)
POST /calculs/etudiant/:etudiantId/ue/:ueId              - Calculer UE (Secretariat/Enseignant)
POST /calculs/etudiant/:etudiantId/semestre/:semestreId    - Calculer semestre (Secretariat/Enseignant)
POST /calculs/etudiant/:etudiantId/recalculer-tout          - Recalculer tout (Secretariat)
GET  /calculs/etudiant/:etudiantId/matiere/:matiereId/details - Détails calcul (Secretariat/Enseignant)
```

### **Matières (6 endpoints)**
```http
GET    /matieres                    - Lister toutes les matières
GET    /matieres/:id               - Détails matière
GET    /matieres/ue/:ueId         - Par UE
POST   /matieres                    - Créer matière
PUT    /matieres/:id               - MAJ matière
DELETE /matieres/:id               - Supprimer matière
```

#### **🧪 Test de création de matière**
**Endpoint** : `POST https://bull-back-z97c.onrender.com/matieres`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "libelle": "Algorithmique avancée",
  "coefficient": 3,
  "credits": 6,
  "uniteEnseignementId": "cmoefidda0001ff1qifa55jcw"
}
```

**Réponse succès (201)** :
```json
{
  "id": "cmoefnl8x0003ff1qn19p0s1r",
  "libelle": "Algorithmique avancée",
  "coefficient": 3,
  "credits": 6,
  "uniteEnseignementId": "cmoefidda0001ff1qifa55jcw",
  "createdAt": "2026-04-25T14:26:47.505Z",
  "updatedAt": "2026-04-25T14:26:47.505Z",
  "uniteEnseignement": {
    "id": "cmoefidda0001ff1qifa55jcw",
    "code": "UE01",
    "libelle": "Algorithmique et Programmation",
    "semestreId": "cmoee0x3v0000e41qudrzryev",
    "createdAt": "2026-04-25T14:22:44.015Z",
    "updatedAt": "2026-04-25T14:22:44.015Z"
  }
}
```

**Erreurs possibles** :
- `400` : Champs manquants (`libelle`, `coefficient`, `credits`, `uniteEnseignementId`)
- `404` : `uniteEnseignementId` inexistant
- `401/403` : Problèmes d'authentification/autorisation

### **Unités Enseignement (6 endpoints)**
```http
GET    /unites-enseignement                    - Lister toutes les UE
GET    /unites-enseignement/:id               - Détails UE
GET    /unites-enseignement/semestre/:semestreId - Par semestre
POST   /unites-enseignement                    - Créer UE
PUT    /unites-enseignement/:id               - MAJ UE
DELETE /unites-enseignement/:id               - Supprimer UE
```

#### **🧪 Test de création d'UE**
**Endpoint** : `POST https://bull-back-z97c.onrender.com/unites-enseignement`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "code": "UE01",
  "libelle": "Algorithmique et Programmation",
  "semestreId": "cmoee0x3v0000e41qudrzryev"
}
```

**Réponse succès (201)** :
```json
{
  "id": "cmoefidda0001ff1qifa55jcw",
  "code": "UE01",
  "libelle": "Algorithmique et Programmation",
  "semestreId": "cmoee0x3v0000e41qudrzryev",
  "createdAt": "2026-04-25T14:22:44.015Z",
  "updatedAt": "2026-04-25T14:22:44.015Z",
  "semestre": {
    "id": "cmoee0x3v0000e41qudrzryev",
    "code": "S1-2024",
    "libelle": "Semestre 1",
    "anneeUniversitaire": "2024-2025"
  }
}
```

**Erreurs possibles** :
- `400` : Champs manquants (`code`, `libelle`, `semestreId`)
- `404` : `semestreId` inexistant
- `401/403` : Problèmes d'authentification/autorisation

#### **🧪 Test de création d'enseignant**
**Endpoint** : `POST https://bull-back-z97c.onrender.com/enseignants`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "nom": "Martin",
  "prenom": "Jean",
  "matricule": "ENS2024001",
  "specialite": "Développement Web",
  "email": "jean.martin@asur.fr",
  "password": "password123"
}
```

**Réponse succès (201)** :
```json
{
  "utilisateurId": "cmoeftcc70004ff1q6dlj4x5a",
  "prenom": "Jean",
  "matricule": "ENS2024001",
  "specialite": "Développement Web",
  "utilisateur": {
    "id": "cmoeftcc70004ff1q6dlj4x5a",
    "email": "jean.martin@asur.fr",
    "nom": "Martin",
    "role": "ENSEIGNANT"
  }
}
```

**Erreurs possibles** :
- `400` : Champs manquants ou invalides
- `409` : Email ou matricule déjà existant
- `401/403` : Problèmes d'authentification/autorisation

#### **🧪 Test de création d'étudiant**
**Endpoint** : `POST https://bull-back-z97c.onrender.com/etudiants`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "nom": "Arron",
  "prenom": "mba",
  "matricule": "2024ASUR001",
  "identifiant": "mba2024",
  "email": "marie.durand@asur.ga",
  "password": "password123",
  "date_naissance": "2000-05-15",
  "lieu_naissance": "azertyu",
  "bac_type": "C",
  "annee_bac": 2012,
  "mention_bac": "Bien",
  "telephone": "0612345678",
  "adresse": "123 Rue de la République"
}
```

**Réponse succès (201)** :
```json
{
  "utilisateurId": "cmoei3vnr0005et295nn8ys7v",
  "prenom": "mba",
  "matricule": "2024ASUR001",
  "date_naissance": "2000-05-15T00:00:00.000Z",
  "lieu_naissance": "azertyu",
  "bac_type": "C",
  "annee_bac": 2012,
  "mention_bac": "Bien",
  "telephone": "0612345678",
  "adresse": "123 Rue de la République",
  "utilisateur": {
    "id": "cmoei3vnr0005et295nn8ys7v",
    "email": "marie.durand@asur.ga",
    "nom": "Arron",
    "role": "ETUDIANT"
  }
}
```

**Erreurs possibles** :
- `400` : Champs manquants ou format invalide (date_naissance)
- `409` : Email ou identifiant déjà existant
- `401/403` : Problèmes d'authentification/autorisation

#### **🧪 Test de récupération profil utilisateur**
**Endpoint** : `GET https://bull-back-z97c.onrender.com/profil`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_utilisateur_connecté>
Content-Type: application/json
```

**Réponse succès (200)** :
```json
{
  "id": "cmod9w3j20000gf1ro0ccql88",
  "nom": "admin0",
  "email": "secretariat3@render.fr",
  "role": "SECRETARIAT",
  "createdAt": "2026-04-24T18:57:40.551Z",
  "utilisateurId": "cmod9w3j20000gf1ro0ccql88",
  "utilisateur": {
    "email": "secretariat3@render.fr",
    "createdAt": "2026-04-24T18:57:40.551Z"
  }
}
```

**Erreurs possibles** :
- `401` : Token manquant ou invalide
- `403` : Permissions insuffisantes
- `500` : Erreur serveur (si DB inaccessible)

**Note** : L'endpoint utilise l'utilisateur connecté via le token JWT, pas un ID spécifique.

#### **🧪 Tests de listing complets**
**Endpoints** : `GET /semestres`, `GET /unites-enseignement`, `GET /etudiants`, `GET /enseignants`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Réponses succès (200)** :

**Semestres avec UE incluses** :
```json
{
  "id": "cmoee0x3v0000e41qudrzryev",
  "code": "S1-2024",
  "libelle": "Semestre 1",
  "anneeUniversitaire": "2024-2025",
  "ues": [
    {
      "id": "cmoefidda0001ff1qifa55jcw",
      "code": "UE01",
      "libelle": "Algorithmique et Programmation",
      "matieres": [...]
    }
  ]
}
```

**Étudiants avec utilisateur inclus** :
```json
{
  "utilisateurId": "cmoei3vnr0005et295nn8ys7v",
  "prenom": "mba",
  "matricule": "2024ASUR001",
  "utilisateur": {
    "id": "cmoei3vnr0005et295nn8ys7v",
    "email": "marie.durand@asur.ga",
    "nom": "Arron",
    "role": "ETUDIANT"
  }
}
```

**Erreurs possibles** :
- `401/403` : Permissions insuffisantes
- `500` : Erreur serveur (si DB inaccessible)

### **Semestres (6 endpoints)**
```http
GET    /semestres                    - Lister tous les semestres
GET    /semestres/:id               - Détails semestre
GET    /semestres/annee/:annee       - Par année
POST   /semestres                    - Créer semestre
PUT    /semestres/:id               - MAJ semestre
DELETE /semestres/:id               - Supprimer semestre
```

#### **🧪 Test de création de semestre**
**Endpoint** : `POST https://bull-back-z97c.onrender.com/semestres`

**Headers requis** :
```http
Authorization: Bearer <jwt_token_admin_ou_secretariat>
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "libelle": "Semestre 1",
  "anneeUniversitaire": "2024-2025",
  "code": "S1-2024"
}
```

**Réponse succès (201)** :
```json
{
  "id": "cmoee0x3v0000e41qudrzryev",
  "code": "S1-2024",
  "libelle": "Semestre 1",
  "anneeUniversitaire": "2024-2025"
}
```

**Erreurs possibles** :
- `400` : Champs manquants (`libelle`, `anneeUniversitaire`, `code`)
- `401` : Token manquant ou invalide
- `403` : Permissions insuffisantes (rôle non autorisé)

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

## Configuration

### **URL de base**
```
Développement : http://localhost:5000
Production    : https://bull-back-z97c.onrender.com
```

### **Documentation**
```
Swagger UI : https://bull-back-z97c.onrender.com/api/docs
OpenAPI    : https://bull-back-z97c.onrender.com/api/docs-json
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
