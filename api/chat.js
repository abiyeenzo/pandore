const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Historique des messages en mémoire
let messages = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Nouvel utilisateur connecté:', socket.id);

  // Envoyer historique au nouvel utilisateur
  socket.emit('messageHistory', messages);

  // Réception message
  socket.on('message', (data) => {
    if (!data.username || !data.text) {
      console.log('Message mal formé reçu:', data);
      return;
    }

    // Générer un id si absent
    if (!data.id) {
      data.id = Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    // Vérifier doublon par ID
    if (messages.some(msg => msg.id === data.id)) {
      console.log('Message dupliqué ignoré:', data.id);
      return;
    }

    console.log(`${data.username}: ${data.text}`);

    // Ajouter à l'historique en mémoire
    messages.push(data);

    // Diffuser à tous (y compris émetteur)
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
