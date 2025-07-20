const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

// 🔒 Pour éviter de créer plusieurs serveurs (problème courant sur Vercel)
let io;

if (!global.io) {
  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Utilisateur connecté :", socket.id);

    // Réception d’un message
    socket.on("message", (data) => {
      console.log("📩 Message reçu :", data);
      socket.broadcast.emit("message", data); // Envoie au second utilisateur
    });

    socket.on("disconnect", () => {
      console.log("❌ Utilisateur déconnecté :", socket.id);
    });
  });

  global.io = io;
} else {
  io = global.io;
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
