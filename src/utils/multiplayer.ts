// WebRTC Peer-to-Peer Real-Time Multiplayer Manager for ÇEMBER
// Operates serverless using PeerJS WebRTC DataChannels with STUN fallbacks

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
  rally?: number;
  combo?: number;
  isRoundResetting: boolean;
  roundBanner: string;
  balls: NetworkBallState[];
  hostPaddle: NetworkPaddleState;
  guestPaddle: NetworkPaddleState;
  sensors: NetworkSensorState[];
  powerUps: NetworkPowerUpState[];
  activePowerUps?: ActivePowerUpStatus[];
  hostIceWallActive?: boolean;
  guestIceWallActive?: boolean;
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
  | { type: 'HANDSHAKE_ACK'; profile: PlayerProfile; targetScore?: number }
  | { type: 'LOBBY_READY'; isReady: boolean }
  | { type: 'START_GAME'; targetScore?: number }
  | { type: 'STATE'; data: NetworkGameStatePayload }
  | { type: 'INPUT'; data: NetworkInputPayload }
  | { type: 'PING'; sentAt: number }
  | { type: 'PONG'; sentAt: number }
  | { type: 'REMATCH_REQ' }
  | { type: 'REMATCH_ACCEPT' }
  | { type: 'LEAVE' };

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.services.mozilla.com' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

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
  private handshakeInterval: number | null = null;
  private connectionTimeout: number | null = null;

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

  public setTargetScore(target: number) {
    this.targetScore = target;
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

  public static normalizeRoomCode(code: string): string {
    return code.trim().replace(/[^0-9]/g, '').slice(0, 6);
  }

  private getPeerId(roomCode: string): string {
    const cleaned = MultiplayerManager.normalizeRoomCode(roomCode);
    return `cember-v2-room-${cleaned}`;
  }

  // Host: Create room and listen for incoming connection
  public createRoom(roomCode: string, targetScore: number = 5): Promise<string> {
    this.cleanup();
    this.role = 'host';
    this.roomCode = MultiplayerManager.normalizeRoomCode(roomCode);
    this.targetScore = targetScore;
    this.setStatus('initializing');
    this.errorMessage = '';

    return new Promise((resolve, reject) => {
      const peerId = this.getPeerId(this.roomCode);

      try {
        const peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: ICE_SERVERS,
          },
        });

        this.peer = peer;

        peer.on('open', () => {
          this.setStatus('waiting_for_peer');
          resolve(this.roomCode);
        });

        peer.on('connection', (incomingConn) => {
          // Accept the incoming guest player
          this.conn = incomingConn;
          this.setupConnectionHandlers(incomingConn);
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          console.error('Peer host error:', err);
          if (err.type === 'unavailable-id') {
            this.errorMessage = 'Bu oda kodu şu an meşgul. Lütfen yeni kod üretin.';
          } else {
            this.errorMessage = `Bağlantı hatası: ${err.message || err.type || 'Bilinmeyen hata'}`;
          }
          this.setStatus('error');
          reject(err);
        });
      } catch (e) {
        console.error('Peer initialization exception:', e);
        this.errorMessage = 'WebRTC başlatılamadı. Tarayıcınızı kontrol edin.';
        this.setStatus('error');
        reject(e);
      }
    });
  }

  // Guest: Join room with 6-digit code
  public joinRoom(roomCode: string): Promise<void> {
    this.cleanup();
    this.role = 'guest';
    const cleanedCode = MultiplayerManager.normalizeRoomCode(roomCode);
    this.roomCode = cleanedCode;
    this.setStatus('initializing');
    this.errorMessage = '';

    return new Promise((resolve, reject) => {
      // Guest creates random peer ID
      const guestPeerId = `cember-guest-${Math.random().toString(36).substring(2, 10)}`;

      try {
        const peer = new Peer(guestPeerId, {
          debug: 1,
          config: {
            iceServers: ICE_SERVERS,
          },
        });

        this.peer = peer;

        // Set a 12-second safety timeout for joining
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.connectionTimeout = window.setTimeout(() => {
          if (this.status !== 'connected') {
            this.errorMessage = 'Odaya bağlanılamadı. Kurucunun "Oda Kur" ekranında beklediğinden emin olun.';
            this.setStatus('error');
            reject(new Error('Connection timed out'));
          }
        }, 12000);

        peer.on('open', () => {
          this.setStatus('connecting');
          const hostPeerId = this.getPeerId(cleanedCode);

          // Connect using reliable WebRTC connection to ensure delivery
          const connection = peer.connect(hostPeerId, {
            reliable: true,
          });

          this.conn = connection;
          this.setupConnectionHandlers(connection);
          resolve();
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          console.error('Peer guest error:', err);
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          if (err.type === 'peer-unavailable') {
            this.errorMessage = 'Oda bulunamadı! Lütfen oda kodunu kontrol edin veya kurucunun odayı açtığından emin olun.';
          } else {
            this.errorMessage = `Bağlantı hatası: ${err.message || err.type || 'Bilinmeyen hata'}`;
          }
          this.setStatus('error');
          reject(err);
        });
      } catch (e) {
        console.error('Peer join exception:', e);
        this.errorMessage = 'WebRTC başlatılamadı.';
        this.setStatus('error');
        reject(e);
      }
    });
  }

  private setupConnectionHandlers(connection: DataConnection) {
    const handleOpen = () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.setStatus('connected');

      // Send initial handshake immediately
      this.send({
        type: 'HANDSHAKE',
        profile: this.myProfile,
        targetScore: this.targetScore,
      });

      // Continuous handshake resend every 500ms until opponent handshake is established
      if (this.handshakeInterval) clearInterval(this.handshakeInterval);
      this.handshakeInterval = window.setInterval(() => {
        if (!this.opponentProfile && this.conn && this.conn.open) {
          this.send({
            type: 'HANDSHAKE',
            profile: this.myProfile,
            targetScore: this.targetScore,
          });
        } else if (this.opponentProfile) {
          if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
            this.handshakeInterval = null;
          }
        }
      }, 500);

      // Start ping loop
      this.startPingLoop();
    };

    if (connection.open) {
      handleOpen();
    } else {
      connection.on('open', handleOpen);
    }

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
        // Send ACK and our profile back
        this.send({
          type: 'HANDSHAKE_ACK',
          profile: this.myProfile,
          targetScore: this.targetScore,
        });
        this.notify('handshake_received', msg.profile);
        break;
      }

      case 'HANDSHAKE_ACK': {
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
        if (msg.targetScore) {
          this.targetScore = msg.targetScore;
        }
        this.notify('game_started');
        this.notify('match_start');
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
      this.send({ type: 'START_GAME', targetScore: this.targetScore });
      // Send a second packet to ensure delivery
      setTimeout(() => {
        this.send({ type: 'START_GAME', targetScore: this.targetScore });
      }, 80);
      this.notify('game_started');
      this.notify('match_start');
    }
  }

  // Aliases for seamless compatibility
  public startMatch() {
    this.startGame();
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
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.handshakeInterval) {
      clearInterval(this.handshakeInterval);
      this.handshakeInterval = null;
    }
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

  // Alias for safety
  public destroy() {
    this.cleanup();
  }
}
