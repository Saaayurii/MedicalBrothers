// Custom server for Socket.IO (for local development and dedicated hosting)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Store active rooms
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', ({ roomId, userId, userName }) => {
      console.log(`User ${userName} (${userId}) joining room ${roomId}`);

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });

      // Send current participants to the new user
      const participants = Array.from(rooms.get(roomId));
      socket.emit('room-participants', participants.filter(id => id !== socket.id));
    });

    socket.on('offer', ({ roomId, offer }) => {
      console.log(`Offer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ roomId, answer }) => {
      console.log(`Answer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      console.log(`ICE candidate from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('leave-room', ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      handleLeaveRoom(socket, roomId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from all rooms
      rooms.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          handleLeaveRoom(socket, roomId);
        }
      });
    });

    function handleLeaveRoom(socket, roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { socketId: socket.id });
    }
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO ready on path /api/socket`);
    });
});
