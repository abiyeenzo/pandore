const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const messagesFile = path.join(__dirname, 'messages.json');

// Charger messages depuis fichier
let messages = [];
try {
  if (fs.existsSync(messagesFile)) {
    const raw = fs.readFileSync(messagesFile);
    messages = JSON.parse(raw);
  }
} catch (err) {
  console.error('Erreur lecture messages.json:', err);
}

app.use(express.static(path.join(__dirname, 'public')));

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

    console.log(`${data.username}: ${data.text}`);

    // Ajouter à l'historique
    messages.push(data);

    // Sauvegarder sur disque
    fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (err) => {
      if (err) console.error('Erreur sauvegarde messages:', err);
    });

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
