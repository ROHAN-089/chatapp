import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://your-production-url.com"],
  },
});

export function getRecieverSocketId(userId) {
  return userSocketMap[userId] || null;
}

const userSocketMap = {}

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('disconnect', () => {
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
    console.log('Client disconnected:', socket.id);

  });


  socket.on('message', (message) => {
    console.log('Message received:', message);
    io.emit('message', message);
  });
})

export { io , server , app};

