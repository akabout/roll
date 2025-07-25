const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Roll API is running!' });
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Gestion des lancers de dés
  socket.on('dice-roll', (data) => {
    console.log('Lancement de dés reçu:', data);
    
    // Diffuser le résultat à tous les clients
    socket.broadcast.emit('dice-roll-result', {
      ...data,
      timestamp: new Date(),
      socketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Port par défaut
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur Roll API démarré sur le port ${PORT}`);
  console.log(`📡 Socket.io disponible sur ws://localhost:${PORT}`);
}); 