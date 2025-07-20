const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

// Initialiser les données globales
if (!global.io) {
  global.messages = global.messages || [];              // [{ user: "Enzo", text: "..." }]
  global.connectedUsers = global.connectedUsers || new Set();

  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Utilisateur connecté :", socket.id);
    global.connectedUsers.add(socket.id);

    // Envoyer l'historique
    socket.emit("history", global.messages);

    // Statut des utilisateurs
    io.emit("status", { online: global.connectedUsers.size });

    // Réception message
    socket.on("message", (data) => {
      console.log(`📩 Message reçu de ${data.user} : ${data.text}`);

      global.messages.push(data);

      // Broadcast à tous sauf l’envoyeur
      socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", () => {
      global.connectedUsers.delete(socket.id);
      console.log("❌ Déconnecté :", socket.id);

      io.emit("status", { online: global.connectedUsers.size });
    });
  });

  global.io = io;
}

// Trick Vercel
module.exports = (req, res) => {
  if (!server.listening) {
    server.listen(0, () => {
      console.log("✅ Serveur prêt");
    });
  }
  server.emit("request", req, res);
};
