const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Historique des messages en mémoire (limité à 100)
let messages = [];
const MAX_MESSAGES = 100;

// Fonction simple pour nettoyer texte (supprimer balises HTML)
function sanitize(text) {
  return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Validation simple des données
function isValidMessage(data) {
  if (typeof data !== 'object') return false;
  if (typeof data.username !== 'string' || typeof data.text !== 'string') return false;
  if (!data.username.trim() || !data.text.trim()) return false;
  if (data.username.length > 30 || data.text.length > 500) return false; // limites arbitraires
  return true;
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Nouvel utilisateur connecté:', socket.id);

  // Envoyer historique au nouvel utilisateur
  socket.emit('messageHistory', messages);

  socket.on('message', (data) => {
    if (!isValidMessage(data)) {
      console.log('Message mal formé ou invalide reçu:', data);
      return;
    }

    // Nettoyer données
    data.username = sanitize(data.username.trim());
    data.text = sanitize(data.text.trim());

    // Générer un ID si absent
    if (!data.id) {
      data.id = Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    // Éviter doublons par ID
    if (messages.some(msg => msg.id === data.id)) {
      console.log('Message dupliqué ignoré:', data.id);
      return;
    }

    console.log(`${data.username}: ${data.text}`);

    // Ajouter au tableau et limiter taille
    messages.push(data);
    if (messages.length > MAX_MESSAGES) {
      messages.shift(); // supprimer le plus ancien message
    }

    // Diffuser à tous les clients
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
