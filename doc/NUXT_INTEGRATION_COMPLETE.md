# 🚀 Intégration Nuxt.js Complète - Bull ASUR API

## 🎯 Objectif

Guide complet pour intégrer l'API Bull ASUR dans une application Nuxt.js avec tous les détails nécessaires.

---

## 🌐 Configuration de base

### **1. Variables d'environnement Nuxt.js**

```env
# .env
NUXT_PUBLIC_API_URL=https://bull-back-z97c.onrender.com
NUXT_PUBLIC_API_LOCAL=http://localhost:5000
```

### **2. Configuration API (composables/api.ts)**

```typescript
// composables/api.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiUrl

  const $fetch = $fetch.create({
    baseURL,
    onRequestError({ error }) {
      console.error('Request error:', error)
    },
    onResponseError({ error }) {
      console.error('Response error:', error)
    }
  })

  return { $fetch }
}
```

---

## 🔐 Authentification Sécrétariat

### **1. DTO Complet**

```typescript
// types/auth.ts
export interface LoginSecretariatDto {
  nom: string
  password: string
}

export interface RegisterSecretariatDto {
  nom: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  secretariat: {
    id: string
    utilisateurId: string
    nom: string
    email: string
    role: 'SECRETARIAT'
    createdAt: string
  }
}
```

### **2. Store Pinia Auth**

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: null as string | null,
    isAuthenticated: false
  }),

  actions: {
    async loginSecretariat(credentials: LoginSecretariatDto) {
      const { $fetch } = useApi()
      
      try {
        const response = await $fetch<AuthResponse>('/auth/secretariat/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: credentials
        })

        this.token = response.access_token
        this.user = response.secretariat
        this.isAuthenticated = true

        // Sauvegarder dans localStorage
        localStorage.setItem('auth_token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.secretariat))

        return response
      } catch (error) {
        throw error
      }
    },

    async registerSecretariat(data: RegisterSecretariatDto) {
      const { $fetch } = useApi()
      
      try {
        const response = await $fetch('/auth/secretariat/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: data
        })

        return response
      } catch (error) {
        throw error
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    },

    initAuth() {
      const token = localStorage.getItem('auth_token')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
      }
    }
  }
})
```

---

## 📚 CRUD Complet - Étudiants

### **1. Types Étudiants**

```typescript
// types/etudiant.ts
export interface CreateEtudiantDto {
  utilisateur: {
    nom: string
    email: string
    password: string
  }
  prenom: string
  matricule: string
}

export interface Etudiant {
  id: string
  utilisateurId: string
  prenom: string
  matricule: string
  utilisateur: {
    id: string
    nom: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}
```

### **2. Composable Étudiants**

```typescript
// composables/etudiants.ts
export const useEtudiants = () => {
  const { $fetch } = useApi()
  const authStore = useAuthStore()

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${authStore.token}`
  })

  return {
    // Lister tous les étudiants
    async getEtudiants(): Promise<Etudiant[]> {
      return await $fetch('/etudiants', {
        headers: getAuthHeaders()
      })
    },

    // Créer un étudiant
    async createEtudiant(data: CreateEtudiantDto): Promise<Etudiant> {
      return await $fetch('/etudiants', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data
      })
    },

    // Mettre à jour un étudiant
    async updateEtudiant(id: string, data: Partial<Etudiant>): Promise<Etudiant> {
      return await $fetch(`/etudiants/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: data
      })
    },

    // Supprimer un étudiant
    async deleteEtudiant(id: string): Promise<void> {
      await $fetch(`/etudiants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    },

    // Détails étudiant
    async getEtudiant(id: string): Promise<Etudiant> {
      return await $fetch(`/etudiants/${id}`, {
        headers: getAuthHeaders()
      })
    }
  }
}
```

---

## 📝 CRUD Complet - Évaluations

### **1. Types Évaluations**

```typescript
// types/evaluation.ts
export interface CreateEvaluationDto {
  utilisateurId: string
  matiereId: string
  type: 'CC' | 'EXAMEN' | 'RATTRAPAGE'
  note: number
  dateEvaluation: string
}

export interface Evaluation {
  id: string
  utilisateurId: string
  matiereId: string
  type: 'CC' | 'EXAMEN' | 'RATTRAPAGE'
  note: number
  dateEvaluation: string
  createdAt: string
  updatedAt: string
}
```

### **2. Composable Évaluations**

```typescript
// composables/evaluations.ts
export const useEvaluations = () => {
  const { $fetch } = useApi()
  const authStore = useAuthStore()

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${authStore.token}`
  })

  return {
    // Lister toutes les évaluations
    async getEvaluations(): Promise<Evaluation[]> {
      return await $fetch('/evaluations', {
        headers: getAuthHeaders()
      })
    },

    // Créer une évaluation
    async createEvaluation(data: CreateEvaluationDto): Promise<Evaluation> {
      return await $fetch('/evaluations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data
      })
    },

    // Évaluations par étudiant
    async getEvaluationsEtudiant(etudiantId: string): Promise<Evaluation[]> {
      return await $fetch(`/evaluations/etudiant/${etudiantId}`, {
        headers: getAuthHeaders()
      })
    },

    // Évaluations par matière
    async getEvaluationsMatiere(matiereId: string): Promise<Evaluation[]> {
      return await $fetch(`/evaluations/matiere/${matiereId}`, {
        headers: getAuthHeaders()
      })
    }
  }
}
```

---

## 🧮 Calculs et Moyennes

### **1. Types Calculs**

```typescript
// types/calculs.ts
export interface CalculMatiereResponse {
  etudiantId: string
  matiereId: string
  moyenne: number
  creditsAcquis: number
  valide: boolean
  details: {
    evaluations: Array<{
      type: string
      note: number
      coefficient: number
    }>
    moyenneCalculee: number
  }
}

export interface CalculSemestreResponse {
  etudiantId: string
  semestreId: string
  moyenneGenerale: number
  creditsTotal: number
  valide: boolean
  ues: Array<{
    ueId: string
    moyenne: number
    credits: number
    valide: boolean
  }>
}
```

### **2. Composable Calculs**

```typescript
// composables/calculs.ts
export const useCalculs = () => {
  const { $fetch } = useApi()
  const authStore = useAuthStore()

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${authStore.token}`
  })

  return {
    // Calculer moyenne matière
    async calculerMatiere(etudiantId: string, matiereId: string): Promise<CalculMatiereResponse> {
      return await $fetch(`/calculs/etudiant/${etudiantId}/matiere/${matiereId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    },

    // Calculer moyenne UE
    async calculerUE(etudiantId: string, ueId: string): Promise<any> {
      return await $fetch(`/calculs/etudiant/${etudiantId}/ue/${ueId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    },

    // Calculer moyenne semestre
    async calculerSemestre(etudiantId: string, semestreId: string): Promise<CalculSemestreResponse> {
      return await $fetch(`/calculs/etudiant/${etudiantId}/semestre/${semestreId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    },

    // Recalculer tout
    async toutRecalculer(etudiantId: string): Promise<any> {
      return await $fetch(`/calculs/etudiant/${etudiantId}/recalculer-tout`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    },

    // Détails calculs matière
    async getDetailsMatiere(etudiantId: string, matiereId: string): Promise<any> {
      return await $fetch(`/calculs/etudiant/${etudiantId}/matiere/${matiereId}/details`, {
        headers: getAuthHeaders()
      })
    }
  }
}
```

---

## 📱 Pages Nuxt.js

### **1. Page Login (pages/login.vue)**

```vue
<template>
  <div class="container">
    <form @submit.prevent="handleLogin">
      <div>
        <label for="nom">Nom</label>
        <input v-model="form.nom" type="text" id="nom" required>
      </div>
      <div>
        <label for="password">Mot de passe</label>
        <input v-model="form.password" type="password" id="password" required>
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>

<script setup>
const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  nom: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.loginSecretariat(form.value)
    router.push('/dashboard')
  } catch (error) {
    console.error('Erreur de connexion:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

### **2. Middleware Auth (middleware/auth.ts)**

```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

---

## 🚨 Gestion des Erreurs

### **1. Plugin d'interception d'erreurs**

```typescript
// plugins/api-error-handler.client.ts
export default defineNuxtPlugin(() => {
  const {$fetch} = useNuxtApp()

  $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        return navigateTo('/login')
      }
      
      if (response.status >= 500) {
        throw createError({
          statusCode: response.status,
          statusMessage: 'Erreur serveur'
        })
      }
    }
  })
})
```

### **2. Types d'erreurs**

```typescript
// types/errors.ts
export interface ApiError {
  statusCode: number
  message: string
  error: string
}

export interface ValidationError {
  statusCode: 400
  message: string[]
  error: 'Bad Request'
}
```

---

## 🎯 Checklist Intégration Nuxt.js

### **✅ Configuration**
- [ ] Variables d'environnement configurées
- [ ] Composable API créé
- [ ] Store Pinia auth configuré
- [ ] Middleware auth installé

### **✅ Authentification**
- [ ] Login secrétariat fonctionnel
- [ ] Register secrétariat fonctionnel
- [ ] Token JWT géré
- [ ] Logout implémenté

### **✅ CRUD**
- [ ] Étudiants (GET/POST/PUT/DELETE)
- [ ] Enseignants (GET/POST/PUT/DELETE)
- [ ] Matières (GET/POST/PUT/DELETE)
- [ ] Évaluations (GET/POST/PUT/DELETE)

### **✅ Calculs**
- [ ] Calculs matière
- [ ] Calculs UE
- [ ] Calculs semestre
- [ ] Recalculer tout

### **✅ Gestion erreurs**
- [ ] 401 → Redirection login
- [ ] 400 → Validation formulaire
- [ ] 500 → Page erreur
- [ ] 404 → Page non trouvée

---

## 🚀 Déploiement

### **1. Build Nuxt.js**

```bash
npm run build
```

### **2. Variables production**

```env
NUXT_PUBLIC_API_URL=https://bull-back-z97c.onrender.com
```

---

**🎯 L'intégration Nuxt.js est maintenant complète avec tous les détails nécessaires !**
