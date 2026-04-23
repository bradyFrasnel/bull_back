# 🌐 Configuration Réseau - Bull ASUR

## 🎯 Objectif

Guide pour configurer l'application Bull ASUR afin d'être accessible depuis tous les réseaux.

---

## 🔧 Configuration Actuelle

### **Écoute sur toutes les interfaces**
```typescript
// src/main.ts
const port = process.env.PORT || 3002;
await app.listen(port, '0.0.0.0');
```

### **CORS configuré pour toutes les origines**
```typescript
// src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || true, // Accepte toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

---

## 🌍 Accès Réseau

### **Localhost**
```
http://localhost:3002
http://127.0.0.1:3002
```

### **Réseau Local**
```
http://0.0.0.0:3002
http://[IP_LOCALE]:3002
```

### **Réseau Externe**
```
http://[IP_PUBLIQUE]:3002
```

---

## 📱 Points d'Accès

### **API Backend**
```
Local:     http://localhost:3002
Réseau:    http://0.0.0.0:3002
Swagger:   http://0.0.0.0:3002/api/docs
```

### **Frontend (si sur même machine)**
```
Local:     http://localhost:3000
Réseau:    http://0.0.0.0:3000
```

---

## 🔍 Trouver son IP Locale

### **Windows**
```bash
ipconfig
# Chercher "Adresse IPv4"
# Ex: 192.168.1.100
```

### **Linux/Mac**
```bash
ifconfig
# ou
ip addr show
# Chercher "inet" dans l'interface réseau
```

### **Node.js**
```javascript
const os = require('os');
const interfaces = os.networkInterfaces();

Object.keys(interfaces).forEach(name => {
  interfaces[name].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`IP Locale: ${iface.address}`);
    }
  });
});
```

---

## 🛠️ Configuration Développement

### **1. Variables d'environnement**
```bash
# .env
PORT=3002
FRONTEND_URL=true
```

### **2. Démarrer l'application**
```bash
npm run start:dev
```

### **3. Vérifier l'écoute**
```bash
netstat -an | findstr :3002
# ou
lsof -i :3002
```

---

## 🔥 Configuration Pare-feu

### **Windows Defender**
1. Ouvrir "Pare-feu Windows Defender"
2. "Autoriser une application"
3. Ajouter "Node.js" ou le port 3002

### **Linux (ufw)**
```bash
sudo ufw allow 3002/tcp
sudo ufw reload
```

### **Mac**
```bash
sudo pfctl -f /etc/pf.conf
# ou utiliser les préférences système
```

---

## 📱 Accès Mobile

### **Depuis un téléphone/tablette**
1. **Trouver l'IP du serveur**
   ```bash
   ipconfig # Windows
   # ou
   ifconfig # Linux/Mac
   ```

2. **Accéder à l'API**
   ```
   http://[IP_SERVEUR]:3002/api/docs
   ```

3. **Tester l'authentification**
   ```javascript
   fetch('http://[IP_SERVEUR]:3002/auth/etudiant/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       nom: 'mmartin2024',
       password: 'password123'
     })
   })
   .then(res => res.json())
   .then(data => console.log(data));
   ```

---

## 🌐 Accès Internet

### **Pour le déploiement externe**
1. **Configurer le routeur**
   - Port forwarding: 3002 → IP locale du serveur
   - Activer UPnP si disponible

2. **Obtenir l'IP publique**
   ```bash
   curl ifconfig.me
   # ou visiter https://www.whatismyip.com/
   ```

3. **Accès depuis l'extérieur**
   ```
   http://[IP_PUBLIQUE]:3002/api/docs
   ```

---

## 🔐 Sécurité

### **⚠️ Attention en production**
```typescript
// Ne PAS utiliser en production
app.enableCors({
  origin: true, // Dangereux en production
});

// Utiliser en production
app.enableCors({
  origin: ['https://votredomaine.com', 'https://app.votredomaine.com'],
  credentials: true,
});
```

### **Variables d'environnement production**
```bash
# .env.production
FRONTEND_URL="https://votredomaine.com"
PORT=3002
NODE_ENV=production
```

---

## 📊 Tests Réseau

### **1. Test local**
```bash
curl http://localhost:3002/api/docs
```

### **2. Test réseau local**
```bash
curl http://[IP_LOCALE]:3002/api/docs
```

### **3. Test depuis mobile**
```javascript
// Dans la console du navigateur mobile
fetch('http://[IP_SERVEUR]:3002/health')
  .then(res => res.json())
  .then(data => console.log('Connecté!', data));
```

---

## 🚨 Dépannage

### **Problèmes courants**

#### **1. "EADDRINUSE: address already in use"**
```bash
# Trouver le processus
netstat -ano | findstr :3002

# Tuer le processus
taskkill /PID [PID] /F
```

#### **2. "CORS error"**
```bash
# Vérifier les variables d'environnement
echo $FRONTEND_URL

# Redémarrer avec les bonnes variables
FRONTEND_URL=true npm run start:dev
```

#### **3. "Connection refused"**
```bash
# Vérifier si le service écoute
netstat -an | findstr :3002

# Vérifier le pare-feu
# Windows: wf.msc
# Linux: sudo ufw status
```

#### **4. "Timeout"**
```bash
# Vérifier la connectivité réseau
ping [IP_SERVEUR]

# Vérifier le port
telnet [IP_SERVEUR] 3002
```

---

## 📱 Applications Mobile

### **React Native**
```javascript
const API_BASE_URL = 'http://192.168.1.100:3002'; // IP du serveur

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le token
api.interceptors.request.use(config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Flutter**
```dart
class ApiService {
  static const String _baseUrl = 'http://192.168.1.100:3002';
  
  static Future<LoginResponse> login(String nom, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/etudiant/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'nom': nom, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      return LoginResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Login failed');
    }
  }
}
```

---

## 🎯 Checklist Déploiement Réseau

- [ ] **Écoute 0.0.0.0** configurée
- [ ] **CORS** accepte les origines nécessaires
- [ ] **Pare-feu** autorise le port 3002
- [ ] **IP locale** identifiée
- [ ] **Port forwarding** configuré (si accès externe)
- [ ] **Tests** depuis différents appareils
- [ ] **HTTPS** configuré (production)
- [ ] **Sécurité** CORS restrictive (production)

---

## 📞 Support

### **Commandes utiles**
```bash
# Vérifier les ports ouverts
netstat -an | findstr LISTENING

# Tests réseau
ping localhost
ping [IP_LOCALE]

# Logs de l'application
npm run start:dev --verbose
```

### **Documentation**
- **API complète** : `http://0.0.0.0:3002/api/docs`
- **Guide frontend** : `doc/CONNEXION_FRONTEND.md`
- **Endpoints** : `doc/API_ENDPOINTS.md`

---

**Configuration réseau terminée ! L'application est maintenant accessible depuis tous les réseaux.** 🌐✨
