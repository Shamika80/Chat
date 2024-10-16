const express = require('express');
const app = express();
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // For generating message IDs

app.use(express.static('public'));

const server = app.listen(3000, () => {
  console.log('HTTP server started on port 3000');
});

const wss = new WebSocket.Server({ server });

const clients = new Map();
const rooms = new Map();
const messages = new Map();

wss.on('connection', function connection(ws, req) {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:3000']; // Add your allowed origins

  if (!allowedOrigins.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }

  console.log('Client connected');

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        const { username, room } = data;

        // Sanitize username and room name (replace with more robust sanitization if needed)
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '');
        const sanitizedRoom = room.replace(/[^a-zA-Z0-9]/g, '');

        if (!sanitizedUsername || !sanitizedRoom) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid username or room name.' }));
          return;
        }

        clients.set(ws, { username: sanitizedUsername, room: sanitizedRoom });
        if (!rooms.has(sanitizedRoom)) {
          rooms.set(sanitizedRoom, new Set());
          messages.set(sanitizedRoom, []);
        }
        rooms.get(sanitizedRoom).add(ws);

        messages.get(sanitizedRoom).forEach(msg => {
          ws.send(JSON.stringify(msg));
        });

        const joinMessage = JSON.stringify({
          type: 'user_joined',
          user: sanitizedUsername,
          message: `${sanitizedUsername} joined the room`
        });
        rooms.get(sanitizedRoom).forEach(client => {
          if (client !== ws) {
            client.send(joinMessage);
          }
        });

        ws.send(JSON.stringify({
          type: 'joined_room',
          room: sanitizedRoom,
          message: `You joined ${sanitizedRoom}`
        }));
      } else if (data.type === 'chat') {
        const { username, room, message } = data;

        // Sanitize message content (replace with more robust sanitization if needed)
        const sanitizedMessage = message.replace(/<[^>]+>/g, ''); 

        if (!sanitizedMessage) {
          return; // Ignore empty or invalid messages
        }

        const messageId = uuidv4();
        const chatMessage = {
          type: 'chat',
          id: messageId,
          user: username,
          message: sanitizedMessage
        };

        messages.get(room).push(chatMessage);

        rooms.get(room).forEach(client => client.send(JSON.stringify(chatMessage)));
      } else if (data.type === 'edit_message') {
        const { messageId, username, room, newMessage } = data;

        // Sanitize newMessage (replace with more robust sanitization if needed)
        const sanitizedNewMessage = newMessage.replace(/<[^>]+>/g, ''); 

        const roomMessages = messages.get(room);
        const messageIndex = roomMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1 && roomMessages[messageIndex].user === username) { // Authorization check
          roomMessages[messageIndex].message = sanitizedNewMessage;

          const editMessage = JSON.stringify({
            type: 'message_edited',
            id: messageId,
            user: username,
            message: sanitizedNewMessage
          });
          rooms.get(room).forEach(client => client.send(editMessage));
        }
      } else if (data.type === 'delete_message') {
        const { messageId, username, room } = data;
        const roomMessages = messages.get(room);
        const messageIndex = roomMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1 && roomMessages[messageIndex].user === username) { // Authorization check
          roomMessages.splice(messageIndex, 1);

          const deleteMessage = JSON.stringify({
            type: 'message_deleted',
            id: messageId
          });
          rooms.get(room).forEach(client => client.send(deleteMessage));
        }
      } else {
        console.error('Invalid message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
    if (clients.has(ws)) {
      const clientData = clients.get(ws);
      const { room, username } = clientData;
      rooms.get(room).delete(ws);
      clients.delete(ws);

      // Notify other users in the room about the disconnection
      const leaveMessage = JSON.stringify({
        type: 'user_left',
        user: username,
        message: `${username} left the room`
      });
      rooms.get(room).forEach(client => client.send(leaveMessage));
    }
  });

  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
    // Handle different WebSocket errors here (e.g., connection reset, invalid data)
  });
});