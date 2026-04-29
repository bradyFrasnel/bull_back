# 📮 Collection Postman - Bull ASUR API

## 🔐 **Authentication Endpoints**

### **1. Login Étudiant**
```
POST {{BASE_URL}}/auth/etudiant/login
Content-Type: application/json

{
  "nom": "test_student",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "etudiant": {
    "id": "user123",
    "nom": "test_student",
    "email": "student@example.com",
    "role": "ETUDIANT",
    "prenom": "Test",
    "matricule": "2024TEST001",
    "adresse": "123 Test Street",
    "telephone": "0612345678",
    "date_naissance": "2000-01-01",
    "lieu_naissance": "Test City",
    "bac_type": "C",
    "annee_bac": 2022,
    "mention_bac": "Bien"
  }
}
```

---

### **2. Login Enseignant**
```
POST {{BASE_URL}}/auth/enseignant/login
Content-Type: application/json

{
  "nom": "test_teacher",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "enseignant": {
    "id": "user123",
    "nom": "test_teacher",
    "email": "teacher@example.com",
    "role": "ENSEIGNANT",
    "prenom": "Test",
    "matricule": "ENS2024001",
    "specialite": "Mathématiques"
  }
}
```

---

### **3. Login Admin**
```
POST {{BASE_URL}}/auth/admin/login
Content-Type: application/json

{
  "nom": "root",
  "password": "root"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "user123",
    "nom": "root",
    "email": "admin@example.com",
    "role": "ADMINISTRATEUR"
  }
}
```

---

### **4. Login Secrétariat**
```
POST {{BASE_URL}}/auth/secretariat/login
Content-Type: application/json

{
  "nom": "admin",
  "password": "admin"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "secretariat": {
    "id": "user123",
    "nom": "admin",
    "email": "secretariat@example.com",
    "role": "SECRETARIAT"
  }
}
```

---

## 👤 **Profile Endpoints** ( nécessitent authentification)

### **5. Get Profile**
```
GET {{BASE_URL}}/profil
Authorization: Bearer {{TOKEN}}
```

**Response (200)**:
```json
{
  "id": "user123",
  "nom": "test_student",
  "email": "student@example.com",
  "role": "ETUDIANT",
  "prenom": "Test",
  "matricule": "2024TEST001",
  "adresse": "123 Test Street",
  "telephone": "0612345678",
  "date_naissance": "2000-01-01",
  "lieu_naissance": "Test City",
  "bac_type": "C",
  "annee_bac": 2022,
  "mention_bac": "Bien"
}
```

---

### **6. Update Profile**
```
PUT {{BASE_URL}}/profil
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "nom": "Updated Name",
  "email": "updated@example.com",
  "prenom": "Updated Prenom",
  "matricule": "2024UPDATED001",
  "adresse": "456 Updated Street",
  "telephone": "0698765432"
}
```

**Response (200)**:
```json
{
  "id": "user123",
  "nom": "Updated Name",
  "email": "updated@example.com",
  "role": "ETUDIANT",
  "prenom": "Updated Prenom",
  "matricule": "2024UPDATED001",
  "adresse": "456 Updated Street",
  "telephone": "0698765432",
  "date_naissance": "2000-01-01",
  "lieu_naissance": "Test City",
  "bac_type": "C",
  "annee_bac": 2022,
  "mention_bac": "Bien"
}
```

---

### **7. Change Password**
```
PUT {{BASE_URL}}/profil/change-password
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response (200)**:
```json
{
  "message": "Mot de passe changé avec succès"
}
```

---

## 🎓 **CRUD Endpoints - Étudiants** (Admin/Secrétariat)

### **8. Create Student**
```
POST {{BASE_URL}}/etudiants
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "new_student",
  "email": "newstudent@example.com",
  "password": "password123",
  "prenom": "New",
  "matricule": "2024NEW001",
  "adresse": "789 New Street",
  "telephone": "0611223344",
  "date_naissance": "2001-05-15",
  "lieu_naissance": "New City",
  "bac_type": "C",
  "annee_bac": 2023,
  "mention_bac": "Très Bien"
}
```

---

### **9. Get All Students**
```
GET {{BASE_URL}}/etudiants
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

### **10. Get Student by ID**
```
GET {{BASE_URL}}/etudiants/{{STUDENT_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

### **11. Update Student**
```
PUT {{BASE_URL}}/etudiants/{{STUDENT_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "Updated Student",
  "email": "updatedstudent@example.com",
  "prenom": "Updated",
  "matricule": "2024UPD001"
}
```

---

### **12. Delete Student**
```
DELETE {{BASE_URL}}/etudiants/{{STUDENT_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## 👨‍🏫 **CRUD Endpoints - Enseignants** (Admin/Secrétariat)

### **13. Create Teacher**
```
POST {{BASE_URL}}/enseignats
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "new_teacher",
  "email": "newteacher@example.com",
  "password": "password123",
  "prenom": "New",
  "matricule": "ENS2024NEW001",
  "specialite": "Physique"
}
```

---

### **14. Get All Teachers**
```
GET {{BASE_URL}}/enseignats
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

### **15. Get Teacher by ID**
```
GET {{BASE_URL}}/enseignats/{{TEACHER_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

### **16. Update Teacher**
```
PUT {{BASE_URL}}/enseignats/{{TEACHER_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "Updated Teacher",
  "email": "updatedteacher@example.com",
  "prenom": "Updated",
  "specialite": "Chimie"
}
```

---

### **17. Delete Teacher**
```
DELETE {{BASE_URL}}/enseignats/{{TEACHER_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## 📚 **Academic Structure Endpoints** (Admin/Secrétariat)

### **18. Create Semester**
```
POST {{BASE_URL}}/semestres
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "Semestre 3",
  "code": "S3",
  "annee_academique": "2024-2025"
}
```

---

### **19. Create Unité d'Enseignement (UE)**
```
POST {{BASE_URL}}/unites-enseignement
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "Algorithmique Avancée",
  "code": "UE301",
  "credits": 6,
  "semestre_id": "{{SEMESTRE_ID}}"
}
```

---

### **20. Create Matière**
```
POST {{BASE_URL}}/matieres
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "nom": "Structures de Données",
  "code": "MAT301",
  "coefficient": 3,
  "ue_id": "{{UE_ID}}",
  "enseignant_id": "{{TEACHER_ID}}"
}
```

---

## 📊 **Evaluation Endpoints** (Enseignant/Admin)

### **21. Create Evaluation**
```
POST {{BASE_URL}}/evaluations
Authorization: Bearer {{TEACHER_TOKEN}}
Content-Type: application/json

{
  "nom": "Examen Partiel",
  "type": "EXAMEN",
  "coefficient": 0.3,
  "matiere_id": "{{MATIERE_ID}}",
  "semestre_id": "{{SEMESTRE_ID}}"
}
```

---

### **22. Get All Evaluations**
```
GET {{BASE_URL}}/evaluations
Authorization: Bearer {{TEACHER_TOKEN}}
```

---

### **23. Get Evaluations by Teacher**
```
GET {{BASE_URL}}/evaluations/teacher/{{TEACHER_ID}}
Authorization: Bearer {{TEACHER_TOKEN}}
```

---

## 🏥 **Health Check**

### **24. API Health**
```
GET {{BASE_URL}}/
```

**Response (200)**:
```json
{
  "message": "Bull ASUR API is running",
  "version": "1.0.0",
  "timestamp": "2024-04-29T10:00:00.000Z"
}
```

---

## 🔧 **Variables Postman**

### **Environment Variables**:
```
BASE_URL = https://bull-back-z97c.onrender.com
TOKEN = {{login_etudiant_response.access_token}}
ADMIN_TOKEN = {{login_admin_response.access_token}}
TEACHER_TOKEN = {{login_enseignant_response.access_token}}
STUDENT_ID = {{create_student_response.id}}
TEACHER_ID = {{create_teacher_response.id}}
SEMESTRE_ID = {{create_semestre_response.id}}
UE_ID = {{create_ue_response.id}}
MATIERE_ID = {{create_matiere_response.id}}
```

---

## ⚠️ **Error Responses**

### **401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### **403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 6 characters"],
  "error": "Bad Request"
}
```

---

## 🚀 **Quick Test Sequence**

1. **Login Admin** → Get `ADMIN_TOKEN`
2. **Create Student** → Get `STUDENT_ID`  
3. **Create Teacher** → Get `TEACHER_ID`
4. **Create Semester** → Get `SEMESTRE_ID`
5. **Create UE** → Get `UE_ID`
6. **Create Matière** → Get `MATIERE_ID`
7. **Login Student** → Get `TOKEN`
8. **Test Profile** → Get/Update student profile
9. **Create Evaluation** → Test teacher functionality

---

## 📝 **Notes Importantes**

- **Authentification** : Tous les endpoints (sauf login et health) nécessitent un token JWT valide
- **Rôles** : Certaines opérations CRUD nécessitent des rôles spécifiques (Admin/Secrétariat)
- **Base URL** : Remplace `{{BASE_URL}}` par l'URL de ton environnement
- **Tokens** : Les tokens expirent après 24h, renouvelez-les si nécessaire
- **Validation** : Les données sont validées selon les DTOs définis dans le backend

**Ready to test! 🎯**
