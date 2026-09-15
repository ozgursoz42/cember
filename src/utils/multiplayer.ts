// High-Reliability Real-Time Multiplayer Manager for ÇEMBER
// Uses dedicated server SSE relay and room signaling for 100% reliable connection

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
  t: number;
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
  | { type: 'CONNECTED'; code: string }
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

export class MultiplayerManager {
  private eventSource: EventSource | null = null;
  public role: MultiplayerRole | null = null;
  public roomCode: string = '';
  public status: ConnectionStatus = 'idle';
  public errorMessage: string = '';
  public ping: number = 0;

  public myProfile: PlayerProfile;
  public opponentProfile: PlayerProfile | null = null;
  public targetScore: number = 5;

  private pingInterval: number | null = null;
  private lastStateSent: number = 0;
  private lastInputSent: number = 0;

  private listeners: Set<(status: ConnectionStatus, data?: unknown) => void> = new Set();
  private stateListeners: Set<(state: NetworkGameStatePayload) => void> = new Set();
  private inputListeners: Set<(input: NetworkInputPayload) => void> = new Set();

  constructor(initialProfile: PlayerProfile) {
    this.myProfile = initialProfile;
  }

  public setMyProfile(profile: Partial<PlayerProfile>) {
    this.myProfile = { ...this.myProfile, ...profile };
    if (this.roomCode && this.status !== 'idle') {
      this.updateRoomData();
    }
  }

  public setTargetScore(target: number) {
    this.targetScore = target;
    if (this.roomCode && this.status !== 'idle') {
      this.updateRoomData();
    }
  }

  private async updateRoomData() {
    try {
      await fetch('/api/multiplayer/room/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: this.roomCode,
          role: this.role,
          profile: this.myProfile,
          targetScore: this.targetScore,
        }),
      });
    } catch {
      // ignore
    }
  }

  public static generateRoomCode(): string {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public static normalizeRoomCode(code: string): string {
    return String(code || '').trim().replace(/[^0-9]/g, '').slice(0, 6);
  }

  // Host: Create room on server and listen via SSE
  public async createRoom(roomCode: string, targetScore: number = 5): Promise<string> {
    this.cleanup();
    this.role = 'host';
    const cleanCode = MultiplayerManager.normalizeRoomCode(roomCode);
    this.roomCode = cleanCode;
    this.targetScore = targetScore;
    this.setStatus('initializing');
    this.errorMessage = '';

    try {
      const resp = await fetch('/api/multiplayer/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          profile: this.myProfile,
          targetScore,
        }),
      });

      const data = await resp.json();
      if (!data.success) {
        this.errorMessage = data.error || 'Oda oluşturulamadı.';
        this.setStatus('error');
        throw new Error(this.errorMessage);
      }

      this.setupSSE(cleanCode, 'host');
      this.setStatus('waiting_for_peer');
      return cleanCode;
    } catch (err: any) {
      console.error('Failed to create room:', err);
      this.errorMessage = err.message || 'Sunucu bağlantı hatası.';
      this.setStatus('error');
      throw err;
    }
  }

  // Guest: Join room with 6-digit code
  public async joinRoom(roomCode: string): Promise<void> {
    this.cleanup();
    this.role = 'guest';
    const cleanCode = MultiplayerManager.normalizeRoomCode(roomCode);
    this.roomCode = cleanCode;
    this.setStatus('initializing');
    this.errorMessage = '';

    try {
      const resp = await fetch('/api/multiplayer/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          profile: this.myProfile,
        }),
      });

      const data = await resp.json();
      if (!data.success) {
        this.errorMessage = data.error || 'Odaya bağlanılamadı. Kodu kontrol edin.';
        this.setStatus('error');
        throw new Error(this.errorMessage);
      }

      if (data.hostProfile) {
        this.opponentProfile = data.hostProfile;
      }
      if (data.targetScore) {
        this.targetScore = data.targetScore;
      }

      this.setupSSE(cleanCode, 'guest');
      this.setStatus('connected');
      if (this.opponentProfile) {
        this.notify('handshake_received', this.opponentProfile);
      }
    } catch (err: any) {
      console.error('Failed to join room:', err);
      this.errorMessage = err.message || 'Odaya bağlanılamadı.';
      this.setStatus('error');
      throw err;
    }
  }

  private setupSSE(code: string, role: MultiplayerRole) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const sseUrl = `/api/multiplayer/room/${code}/events?role=${role}`;
    const es = new EventSource(sseUrl);
    this.eventSource = es;

    es.onopen = () => {
      if (role === 'guest' || (role === 'host' && this.opponentProfile)) {
        this.setStatus('connected');
      }
      this.startPingLoop();
    };

    es.onmessage = (event) => {
      try {
        if (!event.data || event.data.trim() === '') return;
        const msg = JSON.parse(event.data) as NetMessage;
        this.handleIncomingMessage(msg);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      // Reconnect handled automatically by EventSource, but update status if needed
      console.warn('SSE connection warning/reconnecting...');
    };
  }

  private handleIncomingMessage(msg: NetMessage) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'CONNECTED': {
        break;
      }

      case 'HANDSHAKE':
      case 'HANDSHAKE_ACK': {
        this.opponentProfile = msg.profile;
        if (msg.targetScore && this.role === 'guest') {
          this.targetScore = msg.targetScore;
        }
        this.setStatus('connected');
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
    if (!this.roomCode) return;
    fetch(`/api/multiplayer/room/${this.roomCode}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: this.role,
        message: msg,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  // Fast broadcast game state (Host -> Guest) with throttling (max 40 fps)
  public sendGameState(state: NetworkGameStatePayload) {
    if (this.role === 'host') {
      const now = performance.now();
      if (now - this.lastStateSent >= 20 || state.isRoundResetting || state.soundEvent || state.gameOver) {
        this.lastStateSent = now;
        this.send({ type: 'STATE', data: state });
      }
    }
  }

  // Fast broadcast paddle input (Guest -> Host) with throttling (max 40 fps)
  public sendInput(input: NetworkInputPayload) {
    if (this.role === 'guest') {
      const now = performance.now();
      if (now - this.lastInputSent >= 20 || input.isSmash) {
        this.lastInputSent = now;
        this.send({ type: 'INPUT', data: input });
      }
    }
  }

  public startGame() {
    if (this.role === 'host') {
      this.send({ type: 'START_GAME', targetScore: this.targetScore });
      this.notify('game_started');
      this.notify('match_start');
    }
  }

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
      if (this.roomCode && this.status === 'connected') {
        this.send({ type: 'PING', sentAt: Date.now() });
      }
    }, 2500);
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
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.roomCode && this.role) {
      fetch(`/api/multiplayer/room/${this.roomCode}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: this.role }),
        keepalive: true,
      }).catch(() => {});
    }
    this.role = null;
    this.opponentProfile = null;
    this.status = 'idle';
  }

  public destroy() {
    this.cleanup();
  }
}
