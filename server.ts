import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PlayerProfile {
  name: string;
  team: any;
  isReady: boolean;
}

interface Room {
  code: string;
  hostProfile: PlayerProfile;
  guestProfile: PlayerProfile | null;
  targetScore: number;
  hostClients: Set<Response>;
  guestClients: Set<Response>;
  lastActive: number;
  createdAt: number;
}

const rooms = new Map<string, Room>();

// Auto-cleanup rooms older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > 30 * 60 * 1000) {
      // Close all SSE streams
      room.hostClients.forEach((res) => {
        try {
          res.end();
        } catch {}
      });
      room.guestClients.forEach((res) => {
        try {
          res.end();
        } catch {}
      });
      rooms.delete(code);
    }
  }
}, 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // 1. Create Room (Host)
  app.post('/api/multiplayer/room/create', (req: Request, res: Response) => {
    const { code, profile, targetScore } = req.body;
    const cleanCode = String(code || '').trim().replace(/[^0-9]/g, '').slice(0, 6);

    if (!cleanCode || cleanCode.length < 4) {
      res.status(400).json({ success: false, error: 'Geçersiz oda kodu.' });
      return;
    }

    // If room exists, cleanup previous connections
    const existing = rooms.get(cleanCode);
    if (existing) {
      existing.hostClients.forEach((client) => {
        try {
          client.end();
        } catch {}
      });
      existing.guestClients.forEach((client) => {
        try {
          client.end();
        } catch {}
      });
    }

    const newRoom: Room = {
      code: cleanCode,
      hostProfile: profile || { name: 'Ev Sahibi', team: null, isReady: true },
      guestProfile: null,
      targetScore: targetScore || 5,
      hostClients: new Set(),
      guestClients: new Set(),
      lastActive: Date.now(),
      createdAt: Date.now(),
    };

    rooms.set(cleanCode, newRoom);
    console.log(`[Multiplayer] Room created: ${cleanCode}`);
    res.json({ success: true, code: cleanCode });
  });

  // 2. Join Room (Guest)
  app.post('/api/multiplayer/room/join', (req: Request, res: Response) => {
    const { code, profile } = req.body;
    const cleanCode = String(code || '').trim().replace(/[^0-9]/g, '').slice(0, 6);

    const room = rooms.get(cleanCode);
    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Oda bulunamadı! Lütfen kurucunun "Oda Kur" ekranında beklediğinden ve kodu doğru girdiğinizden emin olun.',
      });
      return;
    }

    room.guestProfile = profile || { name: 'Misafir', team: null, isReady: true };
    room.lastActive = Date.now();

    // Broadcast guest profile to host SSE clients
    const payload = JSON.stringify({
      type: 'HANDSHAKE',
      profile: room.guestProfile,
      targetScore: room.targetScore,
    });

    room.hostClients.forEach((client) => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.warn('Error writing to host SSE client:', err);
      }
    });

    console.log(`[Multiplayer] Guest joined room: ${cleanCode}`);
    res.json({
      success: true,
      code: cleanCode,
      hostProfile: room.hostProfile,
      targetScore: room.targetScore,
    });
  });

  // 3. Update Profile / Target Score (Host or Guest)
  app.post('/api/multiplayer/room/update', (req: Request, res: Response) => {
    const { code, role, profile, targetScore } = req.body;
    const cleanCode = String(code || '').trim().replace(/[^0-9]/g, '').slice(0, 6);
    const room = rooms.get(cleanCode);

    if (!room) {
      res.status(404).json({ success: false, error: 'Oda bulunamadı.' });
      return;
    }

    room.lastActive = Date.now();
    if (role === 'host') {
      if (profile) room.hostProfile = { ...room.hostProfile, ...profile };
      if (targetScore) room.targetScore = targetScore;
      const payload = JSON.stringify({
        type: 'HANDSHAKE',
        profile: room.hostProfile,
        targetScore: room.targetScore,
      });
      room.guestClients.forEach((client) => {
        try {
          client.write(`data: ${payload}\n\n`);
        } catch {}
      });
    } else if (role === 'guest') {
      if (profile) room.guestProfile = { ...room.guestProfile, ...profile };
      const payload = JSON.stringify({
        type: 'HANDSHAKE',
        profile: room.guestProfile,
        targetScore: room.targetScore,
      });
      room.hostClients.forEach((client) => {
        try {
          client.write(`data: ${payload}\n\n`);
        } catch {}
      });
    }

    res.json({ success: true });
  });

  // 4. SSE Stream (Host and Guest)
  app.get('/api/multiplayer/room/:code/events', (req: Request, res: Response) => {
    const rawCode = req.params.code;
    const role = (req.query.role as string) || 'guest';
    const cleanCode = String(rawCode || '').trim().replace(/[^0-9]/g, '').slice(0, 6);

    const room = rooms.get(cleanCode);
    if (!room) {
      res.status(404).json({ error: 'Oda bulunamadı.' });
      return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    room.lastActive = Date.now();

    if (role === 'host') {
      room.hostClients.add(res);
      // If guest already present, notify host immediately
      if (room.guestProfile) {
        const payload = JSON.stringify({
          type: 'HANDSHAKE',
          profile: room.guestProfile,
          targetScore: room.targetScore,
        });
        res.write(`data: ${payload}\n\n`);
      }
    } else {
      room.guestClients.add(res);
      // Send host profile to guest immediately
      if (room.hostProfile) {
        const payload = JSON.stringify({
          type: 'HANDSHAKE',
          profile: room.hostProfile,
          targetScore: room.targetScore,
        });
        res.write(`data: ${payload}\n\n`);
      }
    }

    // Send connection confirmed ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', code: cleanCode })}\n\n`);

    // Keep-alive heartbeat interval
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 10000);

    req.on('close', () => {
      clearInterval(heartbeat);
      if (role === 'host') {
        room.hostClients.delete(res);
      } else {
        room.guestClients.delete(res);
      }
    });
  });

  // 5. Send Fast Relay Message (START_GAME, STATE, INPUT, REMATCH, etc.)
  app.post('/api/multiplayer/room/:code/send', (req: Request, res: Response) => {
    const rawCode = req.params.code;
    const cleanCode = String(rawCode || '').trim().replace(/[^0-9]/g, '').slice(0, 6);
    const { role, message } = req.body;

    const room = rooms.get(cleanCode);
    if (!room) {
      res.status(404).json({ success: false, error: 'Oda bulunamadı.' });
      return;
    }

    room.lastActive = Date.now();
    const payload = `data: ${JSON.stringify(message)}\n\n`;

    if (role === 'host') {
      // Forward to guest
      room.guestClients.forEach((client) => {
        try {
          client.write(payload);
        } catch {}
      });
    } else {
      // Forward to host
      room.hostClients.forEach((client) => {
        try {
          client.write(payload);
        } catch {}
      });
    }

    res.json({ success: true });
  });

  // 6. Leave Room
  app.post('/api/multiplayer/room/:code/leave', (req: Request, res: Response) => {
    const rawCode = req.params.code;
    const cleanCode = String(rawCode || '').trim().replace(/[^0-9]/g, '').slice(0, 6);
    const { role } = req.body;

    const room = rooms.get(cleanCode);
    if (room) {
      const payload = `data: ${JSON.stringify({ type: 'LEAVE' })}\n\n`;
      if (role === 'host') {
        room.guestClients.forEach((client) => {
          try {
            client.write(payload);
          } catch {}
        });
        rooms.delete(cleanCode);
      } else {
        room.hostClients.forEach((client) => {
          try {
            client.write(payload);
          } catch {}
        });
        room.guestProfile = null;
      }
    }

    res.json({ success: true });
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ÇEMBER Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
