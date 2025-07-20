const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("🔗 Utilisateur connecté :", socket.id);

  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Utilisateur déconnecté :", socket.id);
  });
});

// Trick pour Vercel Serverless
module.exports = (req, res) => {
  if (!server.listening) {
    server.listen(0, () => {
      console.log("✅ Serveur Socket.io prêt");
    });
  }
  server.emit("request", req, res);
};
