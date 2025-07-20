const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const messagesFile = path.join(__dirname, "messages.json");

// Charger l'historique depuis le fichier JSON
let messageHistory = [];
try {
  if (fs.existsSync(messagesFile)) {
    const rawData = fs.readFileSync(messagesFile);
    messageHistory = JSON.parse(rawData);
  }
} catch (err) {
  console.error("Erreur lors du chargement de messages.json :", err);
}

// Initialiser Socket.io
if (!global.io) {
  global.connectedUsers = global.connectedUsers || new Set();

  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Utilisateur connecté :", socket.id);
    global.connectedUsers.add(socket.id);

    // Envoyer l’historique au nouveau client
    socket.emit("history", messageHistory);

    io.emit("status", { online: global.connectedUsers.size });

    // Réception d’un message avec { sender, text }
    socket.on("message", (data) => {
      console.log("📩 Message reçu :", data);

      const newMessage = {
        sender: data.sender,
        text: data.text,
        timestamp: new Date().toISOString()
      };

      messageHistory.push(newMessage);

      // Sauvegarde dans le fichier
      fs.writeFile(messagesFile, JSON.stringify(messageHistory, null, 2), (err) => {
        if (err) console.error("Erreur de sauvegarde JSON :", err);
      });

      // Diffusion à tous sauf l’expéditeur
      socket.broadcast.emit("message", newMessage);
    });

    socket.on("disconnect", () => {
      global.connectedUsers.delete(socket.id);
      io.emit("status", { online: global.connectedUsers.size });
      console.log("❌ Utilisateur déconnecté :", socket.id);
    });
  });

  global.io = io;
}

module.exports = (req, res) => {
  if (!server.listening) {
    server.listen(0, () => {
      console.log("✅ Serveur Socket.io prêt");
    });
  }
  server.emit("request", req, res);
};
