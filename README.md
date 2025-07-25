# Roll RPG Platform

Plateforme de jeu de rôle en ligne avec création d'aventures interactives, dés virtuels, chat en temps réel et lecteur audio.

## 🏗️ Architecture

```
roll/
├── api/                 # Backend Express + MongoDB
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── front/              # Frontend Next.js + MUI
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── utils/
│   ├── package.json
│   └── README.md
├── shared/             # Types et utilitaires partagés
├── docker-compose.yml  # Déploiement Docker
└── package.json        # Scripts globaux
```

## 🚀 Démarrage Rapide

### Option 1 : Développement Local

```bash
# Installer toutes les dépendances
npm run install-all

# Copier les fichiers d'environnement
cp api/env.example api/.env
cp front/env.example front/.env.local

# Démarrer MongoDB (si pas déjà fait)
# Sur Windows : démarrer MongoDB comme service
# Sur Mac/Linux : mongod

# Démarrer l'API et le frontend
npm run dev
```

### Option 2 : Docker (Recommandé)

```bash
# Démarrer avec Docker Compose
npm run docker:dev

# Ou en arrière-plan
npm run docker
```

## 📡 URLs

- **Frontend** : http://localhost:3000
- **API** : http://localhost:5000
- **MongoDB** : mongodb://localhost:27017

## 🎮 Fonctionnalités

### ✅ Implémentées
- **Authentification** : Inscription/connexion avec JWT
- **Gestion des parties** : Création, codes d'invitation, rejoindre
- **Interface de jeu** : Chat temps réel, dés virtuels, lecteur audio
- **Socket.io** : Communication en temps réel
- **Design moderne** : Material-UI avec thème sombre

### 🔄 En Cours
- **Synchronisation audio** : Partage d'ambiance sonore
- **WebRTC** : Webcam et audio entre joueurs
- **Éditeur d'aventures** : Création d'histoires interactives

### 📋 À Développer
- **Gestion des personnages** : Feuilles de personnage
- **Système de combat** : Règles automatisées
- **Cartes interactives** : Plans et cartes cliquables
- **Notes partagées** : Système de prise de notes

## 🛠️ Technologies

### Backend (api/)
- **Express.js** - Framework web
- **MongoDB** - Base de données
- **Socket.io** - Communication temps réel
- **JWT** - Authentification
- **Multer** - Upload de fichiers

### Frontend (front/)
- **Next.js 13+** - Framework React
- **Material-UI** - Composants UI
- **Socket.io-client** - Client temps réel
- **Axios** - Requêtes HTTP
- **TypeScript** - Typage statique

## 🧪 Tests

```bash
# Tests API
cd api && npm test

# Lint frontend
cd front && npm run lint
```

## 🚀 Déploiement

### Production avec Docker
```bash
# Build et déploiement
docker-compose -f docker-compose.yml up -d

# Logs
docker-compose logs -f
```

### Production manuelle
```bash
# Build frontend
cd front && npm run build

# Démarrer API
cd api && npm start

# Démarrer frontend
cd front && npm start
```

## 📁 Structure Détaillée

### API (`api/`)
```
src/
├── controllers/     # Logique métier
├── models/         # Modèles MongoDB
├── routes/         # Définition des endpoints
├── middleware/     # Middleware personnalisés
└── index.js        # Point d'entrée
```

### Frontend (`front/`)
```
src/
├── app/            # Pages Next.js 13+
│   ├── dashboard/  # Dashboard utilisateur
│   ├── game/       # Interface de jeu
│   └── layout.tsx  # Layout principal
├── components/     # Composants réutilisables
│   ├── DiceRoller.tsx
│   └── AudioPlayer.tsx
└── utils/         # Utilitaires
```

## 🔧 Configuration

### Variables d'environnement API (`api/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roll-rpg
JWT_SECRET=votre_secret_jwt_tres_securise_ici
CORS_ORIGIN=http://localhost:3000
```

### Variables d'environnement Frontend (`front/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 🐛 Dépannage

### Problèmes courants
1. **MongoDB non démarré** : Vérifiez que MongoDB est en cours d'exécution
2. **Ports occupés** : Vérifiez que les ports 3000 et 5000 sont libres
3. **Erreurs CORS** : Vérifiez les URLs dans les fichiers .env

### Logs
```bash
# Logs API
cd api && npm run dev

# Logs frontend
cd front && npm run dev

# Logs Docker
docker-compose logs -f
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 