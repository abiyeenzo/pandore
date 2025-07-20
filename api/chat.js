const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

// Initialiser les données globales si non définies
if (!global.io) {
  global.messages = global.messages || [];              // Historique des messages
  global.connectedUsers = global.connectedUsers || new Set(); // Liste des utilisateurs connectés

  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Utilisateur connecté :", socket.id);
    global.connectedUsers.add(socket.id);

    // Envoyer l'historique des messages au nouvel utilisateur
    socket.emit("history", global.messages);

    // Mettre à jour le nombre de personnes en ligne
    io.emit("status", { online: global.connectedUsers.size });

    // Réception d’un message
    socket.on("message", (data) => {
      console.log("📩 Message reçu :", data);

      // Ajouter à l'historique
      global.messages.push(data);

      // Transmettre aux autres
      socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", () => {
      global.connectedUsers.delete(socket.id);
      console.log("❌ Utilisateur déconnecté :", socket.id);

      // Mise à jour du statut en ligne
      io.emit("status", { online: global.connectedUsers.size });
    });
  });

  global.io = io;
}

// 🔁 Trick pour supporter Vercel (serverless)
module.exports = (req, res) => {
  if (!server.listening) {
    server.listen(0, () => {
      console.log("✅ Serveur Socket.io prêt");
    });
  }
  server.emit("request", req, res);
};
