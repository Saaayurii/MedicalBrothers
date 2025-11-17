# WebSocket Server Setup Guide

This application uses WebSocket for real-time chat functionality. You have several options to set up the WebSocket server:

## Option 1: Standalone WebSocket Server (Recommended for Production)

Create a separate server file `server.js` in the root directory:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

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

  // WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  const rooms = new Map(); // roomId -> Set of client connections
  const users = new Map(); // ws -> { userId, userName, roomId }

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid message:', error);
      }
    });

    ws.on('close', () => {
      const user = users.get(ws);
      if (user && user.roomId) {
        leaveRoom(ws, user.roomId);
      }
      users.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function handleMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'join-room':
        joinRoom(ws, message.roomId, message.userId, message.userName);
        break;

      case 'leave-room':
        leaveRoom(ws, message.roomId);
        break;

      case 'message':
        broadcastToRoom(message.data.roomId, {
          type: 'message',
          data: message.data,
        }, ws);
        break;

      case 'typing':
        broadcastToRoom(message.data.roomId, {
          type: 'typing',
          data: message.data,
        }, ws);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  function joinRoom(ws, roomId, userId, userName) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(ws);
    users.set(ws, { userId, userName, roomId });

    // Notify others
    broadcastToRoom(roomId, {
      type: 'user-joined',
      userId,
      userName,
    }, ws);

    console.log(`User ${userId} joined room ${roomId}`);
  }

  function leaveRoom(ws, roomId) {
    const user = users.get(ws);
    if (!user) return;

    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(ws);

      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }

      // Notify others
      broadcastToRoom(roomId, {
        type: 'user-left',
        userId: user.userId,
      }, ws);
    }

    console.log(`User ${user.userId} left room ${roomId}`);
  }

  function broadcastToRoom(roomId, message, excludeWs = null) {
    if (!rooms.has(roomId)) return;

    const data = JSON.stringify(message);
    rooms.get(roomId).forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) {
        client.send(data);
      }
    });
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server on ws://${hostname}:${port}/ws`);
  });
});
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "ws": "^8.14.0"
  }
}
```

## Option 2: Pusher (Easiest for Development/Production)

1. Sign up at https://pusher.com
2. Create a new app
3. Get your credentials

Add to `.env`:

```bash
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

Client setup:

```typescript
import { createWebSocketClient } from '@/lib/websocket';

const ws = createWebSocketClient({
  provider: 'pusher',
  pusher: {
    appKey: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  },
}, {
  onConnect: () => console.log('Connected'),
  onMessage: (msg) => console.log('Message:', msg),
});

await ws.connect(userId, userName);
ws.joinRoom('room-123');
```

## Option 3: Ably

1. Sign up at https://ably.com
2. Get your API key

Add to `.env`:

```bash
NEXT_PUBLIC_ABLY_API_KEY=your_api_key
```

Client setup similar to Pusher.

## Option 4: Local Development (Native WebSocket)

For local development, use the standalone server (Option 1):

```typescript
const ws = createWebSocketClient({
  provider: 'native',
  url: 'ws://localhost:3000/ws',
}, {
  onConnect: () => console.log('Connected'),
  onMessage: (msg) => console.log('Message:', msg),
});
```

## Docker Setup

If using Docker, expose the WebSocket port:

```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "3000:3000"  # HTTP and WebSocket
```

## Production Deployment

### Vercel

Vercel doesn't support WebSocket directly. Use Pusher or Ably.

### Custom Server (AWS, DigitalOcean, etc.)

Use Option 1 (standalone server) with PM2 or similar:

```bash
pm2 start server.js --name medical-chat
```

## Environment Variables

Add to `.env.example`:

```bash
# WebSocket Configuration
WEBSOCKET_PROVIDER=native  # or pusher, ably
WEBSOCKET_URL=ws://localhost:3000/ws

# Pusher (if using)
NEXT_PUBLIC_PUSHER_APP_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Ably (if using)
NEXT_PUBLIC_ABLY_API_KEY=
```

## Testing

Test WebSocket connection:

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000/ws

# Send message
{"type":"join-room","roomId":"test","userId":"user1","userName":"Test User"}
```

## Security Considerations

1. **Authentication**: Add JWT verification to WebSocket connections
2. **Rate Limiting**: Implement message rate limiting
3. **Input Validation**: Sanitize all incoming messages
4. **SSL/TLS**: Use `wss://` in production
5. **CORS**: Configure allowed origins

## Monitoring

Add logging for:
- Connection events
- Message throughput
- Error rates
- Active connections count

Example with structured logging:

```javascript
import { logger } from '@/lib/logger';

wss.on('connection', (ws) => {
  logger.info('WebSocket connection established', {
    totalConnections: wss.clients.size,
  });
});
```
