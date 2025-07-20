const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesContainer = document.getElementById('messages');

// 1. Demander le nom d'utilisateur une seule fois
let username = localStorage.getItem('username');
if (!username) {
  username = prompt('Quel est ton nom ?')?.trim();
  if (!username) username = "Anonyme";
  localStorage.setItem('username', username);
}

// 2. Affichage local des messages
function addMessage(data, self = false) {
  const div = document.createElement('div');
  div.classList.add('bubble');
  div.classList.add(self ? 'sent' : 'received');
  div.textContent = `${data.username} : ${data.text}`;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 3. Historique
socket.on('messageHistory', (history) => {
  history.forEach((msg) => addMessage(msg, msg.username === username));
});

// 4. Nouveaux messages
socket.on('message', (msg) => {
  addMessage(msg, msg.username === username);
  if (msg.username !== username) {
    notifyNewMessage(msg);
  }
});

// 5. Envoi
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text !== '') {
    socket.emit('message', { username, text });
    input.value = '';
  }
});

// Icône SVG en base64 pour notification
const svgIcon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzhlNDRhZCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij4KICA8cGF0aCBkPSJNMiAyaDIwdjE2SDZsLTQgNHoiLz4KPC9zdmc+Cg==`;

// Demande la permission de notification
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Fonction pour afficher notification
function notifyNewMessage(msg) {
  if (Notification.permission === "granted") {
    new Notification("Pandore", {
      body: `${msg.username}: ${msg.text}`,
      icon: svgIcon,
      tag: "new-message"
    });
  }
}
