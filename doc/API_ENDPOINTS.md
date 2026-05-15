# 📡 API Endpoints — Bull ASUR

## 🌐 URLs

| Environnement | URL |
|---------------|-----|
| **Production** | `https://bull-back-z97c.onrender.com` |
| **Swagger** | `https://bull-back-z97c.onrender.com/api/docs` |
| **Health** | `https://bull-back-z97c.onrender.com/health` |
| **Développement** | `http://localhost:3000` |
| **Swagger local** | `http://localhost:3000/api/docs` |

> ⚠️ Le port par défaut en développement est **3000** (défini dans `.env` via `PORT=3000`).  
> En production sur Render, le port est **3002** (défini dans `render.yaml`).

---

## 🔐 Authentification

Tous les endpoints protégés nécessitent le header :
```
Authorization: Bearer <access_token>
```

### Body de connexion (tous les rôles)
```json
{ "nom": "string", "password": "string" }
```

---

## 1. AUTH — Étudiants
**Base** : `/auth/etudiant`

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/auth/etudiant/login` | ❌ | Connexion étudiant |
| PUT | `/auth/etudiant/change-password` | ❌ | Changer mot de passe (non implémenté) |

**Réponse login :**
```json
{
  "access_token": "eyJ...",
  "etudiant": { "id": "...", "nom": "...", "prenom": "...", "email": "...", "role": "ETUDIANT" }
}
```

---

## 2. AUTH — Enseignants
**Base** : `/auth/enseignant`

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/auth/enseignant/login` | ❌ | Connexion enseignant |
| PUT | `/auth/enseignant/change-password` | ❌ | Changer mot de passe (non implémenté) |

**Réponse login :**
```json
{
  "access_token": "eyJ...",
  "enseignant": { "id": "...", "nom": "...", "prenom": "...", "email": "...", "role": "ENSEIGNANT" }
}
```

---

## 3. AUTH — Administration
**Base** : `/auth/admin`

| Méthode | Endpoint | Auth | Rôle requis | Description |
|---------|----------|------|-------------|-------------|
| POST | `/auth/admin/login` | ❌ | — | Connexion admin |
| POST | `/auth/admin/register` | ✅ | ADMIN | Créer un compte admin |
| POST | `/auth/admin/create-enseignant` | ✅ | ADMIN, SECRETARIAT | Créer un enseignant |
| POST | `/auth/admin/create-etudiant` | ✅ | ADMIN, SECRETARIAT | Créer un étudiant |

**Réponse login :**
```json
{
  "access_token": "eyJ...",
  "admin": { "id": "...", "nom": "...", "email": "...", "role": "ADMINISTRATEUR" }
}
```

**Body register/create-enseignant :**
```json
{ "nom": "string", "prenom": "string", "matricule": "string", "email": "string", "password": "string", "specialite": "string (optionnel)" }
```

**Body create-etudiant :**
```json
{
  "nom": "string", "prenom": "string", "matricule": "string",
  "email": "string", "password": "string",
  "date_naissance": "YYYY-MM-DD", "lieu_naissance": "string",
  "bac_type": "string", "annee_bac": 2020,
  "provenance": "string"
}
```

---

## 4. AUTH — Secrétariat
**Base** : `/auth/secretariat`

| Méthode | Endpoint | Auth | Rôle requis | Description |
|---------|----------|------|-------------|-------------|
| POST | `/auth/secretariat/login` | ❌ | — | Connexion secrétariat |
| POST | `/auth/secretariat/register` | ✅ | ADMIN | Créer un compte secrétariat |
| GET | `/auth/secretariat/profile` | ✅ | SECRETARIAT | Profil secrétariat connecté |

**Réponse login :**
```json
{
  "access_token": "eyJ...",
  "secretariat": { "id": "...", "utilisateurId": "...", "nom": "...", "email": "...", "role": "SECRETARIAT" }
}
```

---

## 5. Profil Utilisateur
**Base** : `/profil` — Auth JWT requis (tous rôles)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/profil` | Profil de l'utilisateur connecté |
| PUT | `/profil` | Mettre à jour le profil |
| POST | `/profil/change-password` | Changer le mot de passe |
| GET | `/profil/preferences` | Obtenir les préférences |
| PUT | `/profil/preferences` | Mettre à jour les préférences |

**Body change-password :**
```json
{ "oldPassword": "string", "newPassword": "string" }
```

---

## 6. Semestres
**Base** : `/semestres` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/semestres` | Tous | Lister tous les semestres |
| GET | `/semestres/:id` | Tous | Détails d'un semestre |
| GET | `/semestres/annee/:annee` | Tous | Par année universitaire |
| POST | `/semestres` | ADMIN, SECRETARIAT | Créer un semestre |
| PUT | `/semestres/:id` | ADMIN, SECRETARIAT | Modifier un semestre |
| DELETE | `/semestres/:id` | ADMIN, SECRETARIAT | Supprimer un semestre |

**Body POST/PUT :**
```json
{ "code": "S5", "libelle": "Semestre 5", "anneeUniversitaire": "2024-2025" }
```

---

## 7. Unités d'Enseignement
**Base** : `/unites-enseignement` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/unites-enseignement` | Tous | Lister toutes les UE |
| GET | `/unites-enseignement/:id` | Tous | Détails d'une UE |
| GET | `/unites-enseignement/semestre/:semestreId` | Tous | UE d'un semestre |
| POST | `/unites-enseignement` | ADMIN, SECRETARIAT | Créer une UE |
| PUT | `/unites-enseignement/:id` | ADMIN, SECRETARIAT | Modifier une UE |
| DELETE | `/unites-enseignement/:id` | ADMIN, SECRETARIAT | Supprimer une UE |

**Body POST/PUT :**
```json
{ "code": "UE5-1", "libelle": "Enseignement Général", "semestreId": "string" }
```

---

## 8. Matières
**Base** : `/matieres` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/matieres` | Tous | Lister toutes les matières |
| GET | `/matieres/:id` | Tous | Détails d'une matière |
| GET | `/matieres/ue/:ueId` | Tous | Matières d'une UE |
| POST | `/matieres` | ADMIN, SECRETARIAT | Créer une matière |
| PUT | `/matieres/:id` | ADMIN, SECRETARIAT | Modifier une matière |
| DELETE | `/matieres/:id` | ADMIN, SECRETARIAT | Supprimer une matière |

**Body POST/PUT :**
```json
{ "libelle": "Anglais technique", "coefficient": 1, "credits": 2, "uniteEnseignementId": "string" }
```

---

## 9. Étudiants
**Base** : `/etudiants` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/etudiants` | ADMIN, SECRETARIAT, ENSEIGNANT | Lister tous les étudiants |
| GET | `/etudiants/:id` | Tous | Étudiant par ID utilisateur |
| GET | `/etudiants/matricule/:matricule` | Tous | Étudiant par matricule |
| GET | `/etudiants/user/:userId` | Tous | Étudiant par userId |
| POST | `/etudiants` | ADMIN, SECRETARIAT | Créer un étudiant |
| PUT | `/etudiants/:id` | ADMIN, SECRETARIAT | Modifier un étudiant |
| DELETE | `/etudiants/:id` | ADMIN | Supprimer un étudiant |

> ⚠️ Le paramètre `:id` correspond à `utilisateurId` (pas un ID séparé).

**Body POST :**
```json
{
  "nom": "string", "prenom": "string", "matricule": "string",
  "email": "string", "password": "string",
  "date_naissance": "YYYY-MM-DD", "lieu_naissance": "string",
  "bac_type": "string", "annee_bac": 2020,
  "provenance": "string"
}
```

---

## 10. Enseignants
**Base** : `/enseignants` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/enseignants` | ADMIN, SECRETARIAT | Lister tous les enseignants |
| GET | `/enseignants/:id` | ADMIN, SECRETARIAT, ENSEIGNANT | Enseignant par ID |
| GET | `/enseignants/user/:userId` | ADMIN, SECRETARIAT, ENSEIGNANT | Par userId |
| GET | `/enseignants/:enseignantId/matieres` | ADMIN, SECRETARIAT, ENSEIGNANT | Matières d'un enseignant |
| GET | `/enseignants/matieres/:matiereId/enseignants` | ADMIN, SECRETARIAT | Enseignants d'une matière |
| POST | `/enseignants` | ADMIN, SECRETARIAT | Créer un enseignant |
| POST | `/enseignants/:enseignantId/matieres/:matiereId` | ADMIN, SECRETARIAT | Assigner une matière |
| PUT | `/enseignants/:id` | ADMIN, SECRETARIAT | Modifier un enseignant |
| DELETE | `/enseignants/:id` | ADMIN | Supprimer un enseignant |
| DELETE | `/enseignants/:enseignantId/matieres/:matiereId` | ADMIN, SECRETARIAT | Retirer une matière |

**Body POST :**
```json
{ "nom": "string", "prenom": "string", "matricule": "string", "email": "string", "password": "string", "specialite": "string (optionnel)" }
```

---

## 11. Évaluations
**Base** : `/evaluations` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/evaluations` | SECRETARIAT, ENSEIGNANT | Lister toutes |
| GET | `/evaluations/:id` | Tous | Par ID |
| GET | `/evaluations/etudiant/:etudiantId` | Tous | Par étudiant |
| GET | `/evaluations/matiere/:matiereId` | SECRETARIAT, ENSEIGNANT | Par matière |
| GET | `/evaluations/type/:type` | SECRETARIAT, ENSEIGNANT | Par type (CC/EXAMEN/RATTRAPAGE) |
| GET | `/evaluations/etudiant/:etudiantId/matiere/:matiereId` | Tous | Étudiant + matière |
| GET | `/evaluations/releve/matiere/:matiereId` | ADMIN, SECRETARIAT, ENSEIGNANT | **Relevé complet** (étudiants : notes + absences) |
| POST | `/evaluations` | SECRETARIAT, ENSEIGNANT | Créer une évaluation |
| PUT | `/evaluations/:id` | SECRETARIAT, ENSEIGNANT | Modifier |
| PUT | `/evaluations/releve/matiere/:matiereId` | ADMIN, SECRETARIAT, ENSEIGNANT | **Sauvegarder relevé en masse** (notes + absences) |
| DELETE | `/evaluations/:id` | SECRETARIAT, ENSEIGNANT | Supprimer |

**Body POST (note individuelle) :**
```json
{
  "utilisateurId": "string",
  "matiereId": "string",
  "type": "CC | EXAMEN | RATTRAPAGE",
  "note": 15.5,
  "saisiePar": "string"
}
```

**Body PUT relevé (toute la classe en une requête) :**

Chaque entrée de `notes` peut contenir des champs de notes et/ou d'absences. Seuls les champs **présents** sont mis à jour (omission = pas de changement pour ce champ).

| Champ | Type | Description |
|-------|------|-------------|
| `utilisateurId` | string | **Requis** — id utilisateur de l'étudiant |
| `noteCC` | number | Note CC (0–20), optionnel |
| `noteExamen` | number | Note examen (0–20), optionnel |
| `noteRattrapage` | number | Note rattrapage (0–20), optionnel |
| `absences` | number | Heures d'absence pour cette matière, optionnel |
| `heuresAbsence` | number | Alias accepté de `absences` |

```json
{
  "saisiePar": "string",
  "notes": [
    { "utilisateurId": "cm123", "noteCC": 14, "noteExamen": 16, "absences": 2 },
    { "utilisateurId": "cm124", "noteCC": 10, "noteExamen": 12, "noteRattrapage": 13, "absences": 0 }
  ]
}
```

**Réponse GET relevé :**
```json
{
  "matiere": { "id", "libelle", "coefficient", "credits", "ue", "semestre" },
  "releve": [
    {
      "utilisateurId": "cm123", "nom": "Martin", "prenom": "Sophie", "matricule": "2024ASUR001",
      "noteCC": 14, "noteExamen": 16, "noteRattrapage": null,
      "evalIdCC": "eval1", "evalIdExamen": "eval2", "evalIdRattrapage": null,
      "absences": 2, "absenceId": "abs1"
    }
  ]
}
```

**Réponse PUT relevé :**
```json
{
  "sauvegardes": 4,
  "absencesSauvegardees": 2,
  "erreurs": 0,
  "details": []
}
```

> ⚠️ Règle rattrapage : la note de rattrapage n'est autorisée que si la moyenne CC+Examen < 6/20.  
> ⚠️ `absences` doit être ≥ 0 si fourni.  
> ✅ Les notes déclenchent la cascade : moyenne matière → UE → semestre. Les absences sont enregistrées sans recalcul de moyenne (pénalité éventuelle côté bulletin / paramétrage).

---

## 12. Calculs
**Base** : `/calculs` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| POST | `/calculs/etudiant/:etudiantId/matiere/:matiereId` | SECRETARIAT, ENSEIGNANT | Calculer moyenne matière |
| POST | `/calculs/etudiant/:etudiantId/ue/:ueId` | SECRETARIAT, ENSEIGNANT | Calculer moyenne UE |
| POST | `/calculs/etudiant/:etudiantId/semestre/:semestreId` | ADMIN, SECRETARIAT | Calculer résultat semestre |
| POST | `/calculs/etudiant/:etudiantId/recalculer-tout` | ADMIN, SECRETARIAT | Recalculer tout |
| GET | `/calculs/etudiant/:etudiantId/matiere/:matiereId/details` | SECRETARIAT, ENSEIGNANT | Détails calcul matière |

> ✅ **Recalcul automatique en cascade** : toute création, modification ou suppression d'évaluation déclenche automatiquement le recalcul dans cet ordre :
> 1. Moyenne matière (`MoyenneMatiere`)
> 2. Moyenne UE (`MoyenneUE`)
> 3. Résultat semestre (`ResultatSemestre`)
>
> Les endpoints `/calculs` restent disponibles pour forcer un recalcul manuel si nécessaire.

---

## 13. Bulletins
**Base** : `/bulletins` — Auth JWT requis

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| GET | `/bulletins/etudiant/:etudiantId/semestre/:semestreId` | Tous | Données bulletin semestre |
| GET | `/bulletins/etudiant/:etudiantId/annuel` | Tous | Données bulletin annuel |
| GET | `/bulletins/promotion/semestre/:semestreId` | ADMIN, SECRETARIAT | Récapitulatif promotion |

Ces endpoints agrègent toutes les données nécessaires à la génération PDF côté frontend.

**Réponse bulletin semestre :**
```json
{
  "etudiant": { "id", "nom", "prenom", "matricule", "dateNaissance", "lieuNaissance", "email" },
  "semestre": { "id", "code", "libelle", "anneeUniversitaire" },
  "ues": [{
    "id", "code", "libelle", "creditsTotal", "moyenne",
    "creditsAcquis", "acquise", "compensee",
    "matieres": [{ "id", "libelle", "coefficient", "credits", "noteCC", "noteExamen", "noteRattrapage", "moyenne", "rattrapageUtilise", "absences" }]
  }],
  "resultat": { "moyenneSemestre", "creditsTotal", "valide" },
  "statistiques": { "moyenneClasse", "noteMin", "noteMax", "ecartType", "nbEtudiants" }
}
```

---

## 14. Health Check

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/health` | ❌ | État du serveur |

```json
{ "status": "OK", "timestamp": "...", "service": "Bull ASUR API", "version": "1.0.0", "uptime": 123.45 }
```

---

## 🔒 Récapitulatif des Permissions

| Module | ADMIN | SECRETARIAT | ENSEIGNANT | ETUDIANT |
|--------|-------|-------------|------------|----------|
| Créer admin | ✅ | ❌ | ❌ | ❌ |
| Créer secrétariat | ✅ | ❌ | ❌ | ❌ |
| Créer enseignant/étudiant | ✅ | ✅ | ❌ | ❌ |
| Semestres / UE / Matières | CRUD | CRUD | Lecture | Lecture |
| Étudiants | CRUD | CRUD | Lecture | Lecture |
| Enseignants | CRUD | CRUD | Lecture (soi) | ❌ |
| Évaluations | CRUD | CRUD | CRUD | Lecture |
| Calculs semestre/tout | ✅ | ✅ | ❌ | ❌ |
| Calculs matière/UE | ✅ | ✅ | ✅ | ❌ |
| Bulletins | ✅ | ✅ | ✅ | Soi |
| Recap promotion | ✅ | ✅ | ❌ | ❌ |

---

## 🚨 Codes d'Erreur

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | Succès | — |
| 201 | Créé | — |
| 400 | Requête invalide | Champs manquants, rattrapage non autorisé |
| 401 | Non authentifié | Token manquant ou expiré |
| 403 | Accès refusé | Rôle insuffisant |
| 404 | Non trouvé | Étudiant ou semestre inexistant |
| 500 | Erreur serveur | — |

```json
{ "statusCode": 401, "message": "Identifiants invalides", "error": "Unauthorized" }
```

---

**Total : 70 endpoints**  
**Dernière mise à jour** : Mai 2026 — v1.1.0
