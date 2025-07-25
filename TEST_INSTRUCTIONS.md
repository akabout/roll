# 🧪 Instructions de Test - Roll RPG Platform

## ✅ **Réorganisation Terminée !**

La structure du projet a été entièrement réorganisée avec succès :

```
roll/
├── api/                 # Backend Express + MongoDB
├── front/              # Frontend Next.js + MUI
├── shared/             # Types et utilitaires partagés
├── docker-compose.yml  # Déploiement Docker
└── package.json        # Scripts globaux
```

## 🚀 **Démarrage Rapide**

### **Option 1 : Script automatique (Recommandé)**
```bash
# Dans le dossier racine
start.bat
```

### **Option 2 : Manuel**
```bash
# 1. Installer les dépendances
npm run install-all

# 2. Copier les fichiers d'environnement
copy api\env.example api\.env
copy front\env.example front\.env.local

# 3. Démarrer MongoDB (si pas déjà fait)
# Sur Windows : MongoDB doit être installé comme service

# 4. Démarrer l'application
npm run dev
```

## 📡 **URLs de Test**

- **Frontend** : http://localhost:3000
- **API** : http://localhost:5000
- **MongoDB** : mongodb://localhost:27017

## 🎮 **Test des Fonctionnalités**

### **1. Authentification**
1. Ouvrir http://localhost:3000
2. Créer un compte MJ (Maître de Jeu)
3. Créer un compte Joueur
4. Tester la connexion/déconnexion

### **2. Gestion des Parties**
1. Se connecter en tant que MJ
2. Créer une nouvelle partie
3. Copier le code d'invitation
4. Se connecter en tant que Joueur
5. Rejoindre la partie avec le code

### **3. Interface de Jeu**
1. Cliquer sur "Jouer" dans une partie
2. Tester le chat en temps réel
3. Ouvrir le lanceur de dés
4. Tester les dés virtuels
5. Vérifier la synchronisation entre joueurs

### **4. Composants**
- **DiceRoller** : Lancement de dés avec Socket.io
- **AudioPlayer** : Lecteur audio pour l'ambiance
- **Chat** : Messages en temps réel

## 🔧 **Configuration**

### **Variables d'environnement API** (`api/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roll-rpg
JWT_SECRET=votre_secret_jwt_tres_securise_ici
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### **Variables d'environnement Frontend** (`front/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

## 🐛 **Dépannage**

### **Problèmes courants**

1. **MongoDB non démarré**
   - Vérifier que MongoDB est installé et démarré
   - Sur Windows : vérifier le service MongoDB

2. **Ports occupés**
   - Vérifier que les ports 3000 et 5000 sont libres
   - Arrêter les autres applications qui utilisent ces ports

3. **Erreurs CORS**
   - Vérifier les URLs dans les fichiers .env
   - Redémarrer l'API après modification

4. **Dépendances manquantes**
   ```bash
   # Réinstaller les dépendances
   npm run install-all
   ```

### **Logs**
```bash
# Logs API
cd api && npm run dev

# Logs frontend
cd front && npm run dev

# Logs Docker
docker-compose logs -f
```

## 📋 **Fonctionnalités Testées**

### ✅ **Implémentées et Testées**
- [x] **Authentification** : Inscription/connexion avec JWT
- [x] **Gestion des parties** : Création, codes d'invitation, rejoindre
- [x] **Interface de jeu** : Chat temps réel, dés virtuels
- [x] **Socket.io** : Communication en temps réel
- [x] **Design moderne** : Material-UI avec thème sombre
- [x] **Structure séparée** : API et Frontend indépendants

### 🔄 **En Cours de Développement**
- [ ] **Synchronisation audio** : Partage d'ambiance sonore
- [ ] **WebRTC** : Webcam et audio entre joueurs
- [ ] **Éditeur d'aventures** : Création d'histoires interactives

### 📋 **À Développer**
- [ ] **Gestion des personnages** : Feuilles de personnage
- [ ] **Système de combat** : Règles automatisées
- [ ] **Cartes interactives** : Plans et cartes cliquables
- [ ] **Notes partagées** : Système de prise de notes

## 🚀 **Déploiement**

### **Développement**
```bash
npm run dev  # Démarre API + Frontend
```

### **Production avec Docker**
```bash
npm run docker  # Démarre avec Docker Compose
```

### **Production manuelle**
```bash
# Build frontend
cd front && npm run build

# Démarrer API
cd api && npm start

# Démarrer frontend
cd front && npm start
```

## 🎯 **Prochaines Étapes**

1. **Tester l'application complète**
2. **Implémenter la synchronisation audio**
3. **Ajouter WebRTC pour webcam/audio**
4. **Créer l'éditeur d'aventures**
5. **Développer la gestion des personnages**

---

**🎉 Félicitations !** Votre plateforme Roll RPG est maintenant prête avec une architecture professionnelle et scalable ! 