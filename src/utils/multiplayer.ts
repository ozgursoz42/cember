// WebRTC Peer-to-Peer Real-Time Multiplayer Manager for ÇEMBER
// Operates serverless on Vercel and AI Studio using PeerJS WebRTC DataChannels

import Peer, { DataConnection } from 'peerjs';
import { CountryTeam, GameScore, GameStats, ActivePowerUpStatus } from '../types';

export type MultiplayerRole = 'host' | 'guest';

export type ConnectionStatus =
  | 'idle'
  | 'initializing'
  | 'waiting_for_peer'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface PlayerProfile {
  name: string;
  team: CountryTeam;
  isReady: boolean;
}

export interface NetworkBallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  lastHitter: 'player' | 'opponent' | 'none';
  isSmash?: boolean;
  isFireball?: boolean;
  isSlowMo?: boolean;
  isMini?: boolean;
  deflectedBySensor?: boolean;
}

export interface NetworkSensorState {
  x: number;
  y: number;
  radius: number;
  isFrozen: boolean;
  hitFlash?: number;
  rotationAngle?: number;
  isScorched?: boolean;
  glowColor?: string;
}

export interface NetworkPowerUpState {
  id: string;
  type: string;
  isHarmful: boolean;
  x: number;
  y: number;
  radius?: number;
  symbol?: string;
}

export interface NetworkPaddleState {
  x: number;
  y: number;
  width: number;
  hitFlash?: number;
  isFrozen: boolean;
  freezeTimer?: number;
  isRocketPowered: boolean;
  isFiery: boolean;
  isMegaPaddle?: boolean;
  megaPaddleTimer?: number;
  yellowCards?: number;
  isEjected?: boolean;
}

export interface NetworkGameStatePayload {
  t: number; // timestamp
  score: GameScore;
  rally: number;
  combo: number;
  isRoundResetting: boolean;
  roundBanner: string;
  balls: NetworkBallState[];
  hostPaddle: NetworkPaddleState;
  guestPaddle: NetworkPaddleState;
  sensors: NetworkSensorState[];
  powerUps: NetworkPowerUpState[];
  activePowerUps: ActivePowerUpStatus[];
  toast?: { title: string; subtitle: string; color: string; icon: string } | null;
  soundEvent?: string;
  gameOver?: { winner: 'player' | 'opponent'; stats: GameStats } | null;
}

export interface NetworkInputPayload {
  t: number;
  targetX: number;
  targetY: number;
  isSmash?: boolean;
}

export type NetMessage =
  | { type: 'HANDSHAKE'; profile: PlayerProfile; targetScore?: number }
  | { type: 'LOBBY_READY'; isReady: boolean }
  | { type: 'START_GAME' }
  | { type: 'STATE'; data: NetworkGameStatePayload }
  | { type: 'INPUT'; data: NetworkInputPayload }
  | { type: 'PING'; sentAt: number }
  | { type: 'PONG'; sentAt: number }
  | { type: 'REMATCH_REQ' }
  | { type: 'REMATCH_ACCEPT' }
  | { type: 'LEAVE' };

export class MultiplayerManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public role: MultiplayerRole | null = null;
  public roomCode: string = '';
  public status: ConnectionStatus = 'idle';
  public errorMessage: string = '';
  public ping: number = 0;

  public myProfile: PlayerProfile;
  public opponentProfile: PlayerProfile | null = null;
  public targetScore: number = 5;

  private pingInterval: number | null = null;
  private listeners: Set<(status: ConnectionStatus, data?: unknown) => void> = new Set();
  private stateListeners: Set<(state: NetworkGameStatePayload) => void> = new Set();
  private inputListeners: Set<(input: NetworkInputPayload) => void> = new Set();

  constructor(initialProfile: PlayerProfile) {
    this.myProfile = initialProfile;
  }

  public setMyProfile(profile: Partial<PlayerProfile>) {
    this.myProfile = { ...this.myProfile, ...profile };
    if (this.conn && this.conn.open) {
      this.send({ type: 'HANDSHAKE', profile: this.myProfile, targetScore: this.targetScore });
    }
  }

  // Create a 6-digit unique Room Code
  public static generateRoomCode(): string {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getPeerId(roomCode: string): string {
    // Unique deterministic prefix for Çember app
    return `cember-v2-room-${roomCode.trim()}`;
  }

  // Host: Create room and listen for incoming connection
  public createRoom(roomCode: string, targetScore: number = 5): Promise<string> {
    this.role = 'host';
    this.roomCode = roomCode;
    this.targetScore = targetScore;
    this.setStatus('initializing');
    this.errorMessage = '';

    return new Promise((resolve, reject) => {
      this.cleanup();

      const peerId = this.getPeerId(roomCode);
      const peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer = peer;

      peer.on('open', () => {
        this.setStatus('waiting_for_peer');
        resolve(roomCode);
      });

      peer.on('connection', (incomingConn) => {
        // Accept the incoming player
        this.conn = incomingConn;
        this.setupConnectionHandlers(incomingConn);
      });

      peer.on('error', (err) => {
        console.error('Peer host error:', err);
        if (err.type === 'unavailable-id') {
          this.errorMessage = 'Bu oda kodu zaten kullanımda. Lütfen yeni bir kod deneyin.';
        } else {
          this.errorMessage = `Bağlantı hatası: ${err.type}`;
        }
        this.setStatus('error');
        reject(err);
      });
    });
  }

  // Guest: Join room with 6-digit code
  public joinRoom(roomCode: string): Promise<void> {
    this.role = 'guest';
    this.roomCode = roomCode;
    this.setStatus('initializing');
    this.errorMessage = '';

    return new Promise((resolve, reject) => {
      this.cleanup();

      // Guest creates random peer ID
      const guestPeerId = `cember-guest-${Math.random().toString(36).substring(2, 9)}`;
      const peer = new Peer(guestPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer = peer;

      peer.on('open', () => {
        this.setStatus('connecting');
        const hostPeerId = this.getPeerId(roomCode);
        const connection = peer.connect(hostPeerId, { reliable: false });
        this.conn = connection;
        this.setupConnectionHandlers(connection);
        resolve();
      });

      peer.on('error', (err) => {
        console.error('Peer guest error:', err);
        if (err.type === 'peer-unavailable') {
          this.errorMessage = 'Oda bulunamadı! Lütfen oda kodunu kontrol edin veya kurucunun odayı açtığından emin olun.';
        } else {
          this.errorMessage = `Bağlantı hatası: ${err.type}`;
        }
        this.setStatus('error');
        reject(err);
      });
    });
  }

  private setupConnectionHandlers(connection: DataConnection) {
    connection.on('open', () => {
      this.setStatus('connected');
      // Send handshake immediately
      this.send({
        type: 'HANDSHAKE',
        profile: this.myProfile,
        targetScore: this.targetScore,
      });

      // Start ping loop
      this.startPingLoop();
    });

    connection.on('data', (raw: unknown) => {
      this.handleIncomingMessage(raw as NetMessage);
    });

    connection.on('close', () => {
      this.setStatus('disconnected');
    });

    connection.on('error', (err) => {
      console.warn('DataConnection error:', err);
      this.setStatus('error');
    });
  }

  private handleIncomingMessage(msg: NetMessage) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'HANDSHAKE': {
        this.opponentProfile = msg.profile;
        if (msg.targetScore && this.role === 'guest') {
          this.targetScore = msg.targetScore;
        }
        this.notify('handshake_received', msg.profile);
        break;
      }

      case 'LOBBY_READY': {
        if (this.opponentProfile) {
          this.opponentProfile.isReady = msg.isReady;
        }
        this.notify('ready_changed', msg.isReady);
        break;
      }

      case 'START_GAME': {
        this.notify('game_started');
        break;
      }

      case 'STATE': {
        this.stateListeners.forEach((fn) => fn(msg.data));
        break;
      }

      case 'INPUT': {
        this.inputListeners.forEach((fn) => fn(msg.data));
        break;
      }

      case 'PING': {
        this.send({ type: 'PONG', sentAt: msg.sentAt });
        break;
      }

      case 'PONG': {
        const roundTrip = Date.now() - msg.sentAt;
        this.ping = Math.round(roundTrip / 2);
        this.notify('ping', this.ping);
        break;
      }

      case 'REMATCH_REQ': {
        this.notify('rematch_requested');
        break;
      }

      case 'REMATCH_ACCEPT': {
        this.notify('rematch_accepted');
        break;
      }

      case 'LEAVE': {
        this.setStatus('disconnected');
        break;
      }
    }
  }

  public send(msg: NetMessage) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch (err) {
        console.warn('Send message failed:', err);
      }
    }
  }

  // Fast broadcast game state (Host -> Guest)
  public sendGameState(state: NetworkGameStatePayload) {
    if (this.role === 'host') {
      this.send({ type: 'STATE', data: state });
    }
  }

  // Fast broadcast paddle input (Guest -> Host)
  public sendInput(input: NetworkInputPayload) {
    if (this.role === 'guest') {
      this.send({ type: 'INPUT', data: input });
    }
  }

  public startGame() {
    if (this.role === 'host') {
      this.send({ type: 'START_GAME' });
      this.notify('game_started');
    }
  }

  public requestRematch() {
    this.send({ type: 'REMATCH_REQ' });
  }

  public acceptRematch() {
    this.send({ type: 'REMATCH_ACCEPT' });
    this.notify('rematch_accepted');
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      if (this.conn && this.conn.open) {
        this.send({ type: 'PING', sentAt: Date.now() });
      }
    }, 2000);
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.notify('status_change', status);
  }

  public onState(fn: (state: NetworkGameStatePayload) => void): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  public onInput(fn: (input: NetworkInputPayload) => void): () => void {
    this.inputListeners.add(fn);
    return () => this.inputListeners.delete(fn);
  }

  public subscribe(cb: (status: ConnectionStatus, data?: unknown) => void): () => void {
    this.listeners.add(cb);
    cb(this.status);
    return () => this.listeners.delete(cb);
  }

  private notify(event: string, data?: unknown) {
    this.listeners.forEach((cb) => cb(this.status, { event, data }));
  }

  public cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.conn) {
      try {
        this.send({ type: 'LEAVE' });
        this.conn.close();
      } catch {
        // ignore
      }
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
    this.role = null;
    this.opponentProfile = null;
    this.status = 'idle';
  }
}
