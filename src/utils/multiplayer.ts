// High-Reliability Real-Time Multiplayer Manager for ÇEMBER
// Dual-Layer Protocol: Cloud MQTT over Secure WebSockets (HiveMQ / EMQX) + Local BroadcastChannel
// Zero backend server required. 100% works across all networks, devices, mobile 4G/5G, Wi-Fi & tabs!

import mqtt, { MqttClient } from 'mqtt';
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

export type NetworkGameEventType =
  | 'PADDLE_HIT'
  | 'SENSOR_HIT'
  | 'WALL_HIT'
  | 'GOAL'
  | 'POWERUP_COLLECT'
  | 'ICE_SHATTER'
  | 'SMASH_HIT'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'SPECIAL_EFFECT';

export interface NetworkGameEvent {
  eventId: string;
  serverTick: number;
  timestamp: number;
  type: NetworkGameEventType;
  x: number;
  y: number;
  color?: string;
  playerId?: 'host' | 'guest' | 'none';
  data?: Record<string, any>;
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
  serverTick: number;
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
  events?: NetworkGameEvent[]; // Replicated authoritative game events
  activePowerUps?: ActivePowerUpStatus[];
  hostIceWallActive?: boolean;
  guestIceWallActive?: boolean;
  toast?: { title: string; subtitle: string; color: string; icon: string } | null;
  soundEvent?: string;
  soundEvents?: string[];
  gameOver?: { winner: 'player' | 'opponent'; stats: GameStats } | null;
}

export interface NetworkInputPayload {
  seq: number;
  clientTime: number;
  inputTick?: number;
  targetX: number;
  targetY: number;
  isSmash?: boolean;
}

export type NetMessage =
  | { type: 'HOST_PRESENCE'; code: string; profile: PlayerProfile; targetScore?: number; senderId?: string }
  | { type: 'HANDSHAKE'; profile: PlayerProfile; targetScore?: number; senderId?: string }
  | { type: 'HANDSHAKE_ACK'; profile: PlayerProfile; targetScore?: number; senderId?: string }
  | { type: 'LOBBY_READY'; isReady: boolean; senderId?: string }
  | { type: 'START_GAME'; targetScore?: number; senderId?: string }
  | { type: 'STATE'; data: NetworkGameStatePayload; senderId?: string }
  | { type: 'INPUT'; data: NetworkInputPayload; senderId?: string }
  | { type: 'PING'; sentAt: number; senderId?: string }
  | { type: 'PONG'; sentAt: number; senderId?: string }
  | { type: 'REMATCH_REQ'; senderId?: string }
  | { type: 'REMATCH_ACCEPT'; senderId?: string }
  | { type: 'LEAVE'; senderId?: string };

// Public high-reliability MQTT WebSocket brokers with SSL
const PUBLIC_BROKERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
];

export class MultiplayerManager {
  public role: MultiplayerRole | null = null;
  public roomCode: string = '';
  public status: ConnectionStatus = 'idle';
  public errorMessage: string = '';
  public ping: number = 0;

  // Latency & Packet Loss Debug Simulator
  public simulatedLatencyMs: number = 0;
  public simulatedJitterMs: number = 0;
  public simulatedPacketLoss: number = 0; // e.g. 0.05 for 5% loss

  public myProfile: PlayerProfile;
  public opponentProfile: PlayerProfile | null = null;
  public targetScore: number = 5;
  public gameStarted: boolean = false;

  private clientId: string;
  private mqttClient: MqttClient | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private brokerIndex: number = 0;

  private pingInterval: number | null = null;
  private handshakeInterval: number | null = null;
  private presenceInterval: number | null = null;
  private lastStateSent: number = 0;
  private lastInputSent: number = 0;

  private listeners: Set<(status: ConnectionStatus, data?: unknown) => void> = new Set();
  private stateListeners: Set<(state: NetworkGameStatePayload) => void> = new Set();
  private inputListeners: Set<(input: NetworkInputPayload) => void> = new Set();

  constructor(initialProfile: PlayerProfile) {
    this.myProfile = initialProfile;
    this.clientId = 'cember_' + Math.random().toString(36).substring(2, 10);
  }

  public setMyProfile(profile: Partial<PlayerProfile>) {
    this.myProfile = { ...this.myProfile, ...profile };
    if (this.roomCode && this.status === 'connected') {
      this.send({
        type: 'HANDSHAKE_ACK',
        profile: this.myProfile,
        targetScore: this.targetScore,
      });
    }
  }

  public setTargetScore(target: number) {
    this.targetScore = target;
    if (this.roomCode && this.status === 'connected') {
      this.send({
        type: 'HANDSHAKE_ACK',
        profile: this.myProfile,
        targetScore: this.targetScore,
      });
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

  // Topic names based on 6-digit room code
  private getTopicPrefix(code: string): string {
    return `cember_arena_pvp_v3/${code}`;
  }

  private getHostToGuestTopic(code: string): string {
    return `${this.getTopicPrefix(code)}/h2g`;
  }

  private getGuestToHostTopic(code: string): string {
    return `${this.getTopicPrefix(code)}/g2h`;
  }

  private getLobbyTopic(code: string): string {
    return `${this.getTopicPrefix(code)}/lobby`;
  }

  // Connect to MQTT Broker with automatic fallback
  private connectToBroker(code: string): Promise<MqttClient> {
    return new Promise((resolve) => {
      const brokerUrl = PUBLIC_BROKERS[this.brokerIndex % PUBLIC_BROKERS.length];
      const client = mqtt.connect(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 4500,
        reconnectPeriod: 2000,
        keepalive: 15,
      });

      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          try {
            client.end(true);
          } catch {
            // ignore
          }
          // Try next broker
          this.brokerIndex++;
          const nextUrl = PUBLIC_BROKERS[this.brokerIndex % PUBLIC_BROKERS.length];
          const fallbackClient = mqtt.connect(nextUrl, {
            clientId: this.clientId,
            clean: true,
            connectTimeout: 4500,
            reconnectPeriod: 2000,
            keepalive: 15,
          });
          fallbackClient.on('connect', async () => {
            this.mqttClient = fallbackClient;
            await this.setupMqttSubscriptions(fallbackClient, code);
            if (!resolved) {
              resolved = true;
              resolve(fallbackClient);
            }
          });
          fallbackClient.on('message', (_topic, messageBuffer) => {
            try {
              const str = messageBuffer.toString();
              if (!str) return;
              const msg = JSON.parse(str) as NetMessage;
              if (msg && msg.senderId !== this.clientId) {
                this.handleIncomingMessage(msg);
              }
            } catch (err) {
              console.warn('MQTT parse warning:', err);
            }
          });
          fallbackClient.on('error', (err) => {
            console.warn('Fallback MQTT error:', err);
          });
        }
      }, 3500);

      client.on('connect', async () => {
        if (!resolved) {
          clearTimeout(timeout);
          this.mqttClient = client;
          await this.setupMqttSubscriptions(client, code);
          if (!resolved) {
            resolved = true;
            resolve(client);
          }
        }
      });

      client.on('message', (_topic, messageBuffer) => {
        try {
          const str = messageBuffer.toString();
          if (!str) return;
          const msg = JSON.parse(str) as NetMessage;
          if (msg && msg.senderId !== this.clientId) {
            this.handleIncomingMessage(msg);
          }
        } catch (err) {
          console.warn('MQTT parse warning:', err);
        }
      });

      client.on('error', (err) => {
        console.warn('MQTT Connection notice:', err.message);
      });
    });
  }

  private setupMqttSubscriptions(client: MqttClient, code: string): Promise<void> {
    return new Promise((resolve) => {
      const topics = [
        `${this.getTopicPrefix(code)}/#`,
        this.getLobbyTopic(code),
        this.getHostToGuestTopic(code),
        this.getGuestToHostTopic(code),
      ];
      client.subscribe(topics, { qos: 0 }, (err) => {
        if (err) {
          console.warn('Subscription warning:', err);
        }
        resolve();
      });
    });
  }

  // Setup Local BroadcastChannel for instant 0ms tab-to-tab communication
  private setupBroadcastChannel(code: string) {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (this.broadcastChannel) {
          this.broadcastChannel.close();
        }
        this.broadcastChannel = new BroadcastChannel(`cember_arena_bc_${code}`);
        this.broadcastChannel.onmessage = (event) => {
          const msg = event.data as NetMessage;
          if (msg && msg.senderId !== this.clientId) {
            this.handleIncomingMessage(msg);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel notice:', err);
      }
    }
  }

  // Host: Create room and wait for peer
  public async createRoom(roomCode: string, targetScore: number = 5): Promise<string> {
    this.cleanup();
    this.role = 'host';
    const cleanCode = MultiplayerManager.normalizeRoomCode(roomCode);
    this.roomCode = cleanCode;
    this.targetScore = targetScore;
    this.gameStarted = false;
    this.setStatus('initializing');
    this.errorMessage = '';

    try {
      this.setupBroadcastChannel(cleanCode);
      await this.connectToBroker(cleanCode);

      this.setStatus('waiting_for_peer');

      // Periodically announce presence so joining guests immediately see host
      if (this.presenceInterval) clearInterval(this.presenceInterval);
      this.presenceInterval = window.setInterval(() => {
        if (this.status === 'waiting_for_peer' && this.roomCode === cleanCode) {
          this.send({
            type: 'HOST_PRESENCE',
            code: cleanCode,
            profile: this.myProfile,
            targetScore: this.targetScore,
          });
        } else if (this.status === 'connected' && this.presenceInterval) {
          clearInterval(this.presenceInterval);
          this.presenceInterval = null;
        }
      }, 800);

      // Send immediate first presence announcement
      this.send({
        type: 'HOST_PRESENCE',
        code: cleanCode,
        profile: this.myProfile,
        targetScore: this.targetScore,
      });

      return cleanCode;
    } catch (err: any) {
      console.error('Failed to create room:', err);
      this.errorMessage = 'Oda bağlantısı kurulamadı. Lütfen tekrar deneyin.';
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
    this.gameStarted = false;
    this.setStatus('connecting');
    this.errorMessage = '';

    try {
      this.setupBroadcastChannel(cleanCode);
      await this.connectToBroker(cleanCode);

      // Start Handshake Loop: Send handshake until connected
      let attempts = 0;
      const sendHandshake = () => {
        if ((this.status as ConnectionStatus) === 'connected') {
          if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
            this.handshakeInterval = null;
          }
          return;
        }

        attempts++;
        this.send({
          type: 'HANDSHAKE',
          profile: this.myProfile,
        });

        if (attempts > 35 && (this.status as ConnectionStatus) !== 'connected') {
          if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
            this.handshakeInterval = null;
          }
          this.errorMessage = 'Odaya bağlanılamadı. Kurucunun ekranında oda numarasının açık olduğundan emin olun.';
          this.setStatus('error');
        }
      };

      sendHandshake();
      if (this.handshakeInterval) clearInterval(this.handshakeInterval);
      this.handshakeInterval = window.setInterval(sendHandshake, 350);
    } catch (err: any) {
      console.error('Failed to join room:', err);
      this.errorMessage = 'Odaya bağlanılamadı.';
      this.setStatus('error');
      throw err;
    }
  }

  private handleIncomingMessage(msg: NetMessage) {
    if (!msg || !msg.type) return;

    // Simulated packet loss testing
    if (this.simulatedPacketLoss > 0 && (msg.type === 'STATE' || msg.type === 'INPUT')) {
      if (Math.random() < this.simulatedPacketLoss) {
        return; // Drop packet
      }
    }

    // Simulated latency & jitter testing
    if (this.simulatedLatencyMs > 0 && (msg.type === 'STATE' || msg.type === 'INPUT')) {
      const jitter = (Math.random() * 2 - 1) * this.simulatedJitterMs;
      const delay = Math.max(0, this.simulatedLatencyMs + jitter);
      setTimeout(() => {
        this.processIncomingMessage(msg);
      }, delay);
      return;
    }

    this.processIncomingMessage(msg);
  }

  private processIncomingMessage(msg: NetMessage) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'HOST_PRESENCE': {
        if (this.role === 'guest' && (this.status as ConnectionStatus) !== 'connected') {
          this.opponentProfile = msg.profile;
          if (msg.targetScore) {
            this.targetScore = msg.targetScore;
          }
          if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
            this.handshakeInterval = null;
          }
          // Respond with handshake
          this.send({
            type: 'HANDSHAKE',
            profile: this.myProfile,
          });
          this.setStatus('connected');
          this.notify('handshake_received', msg.profile);
          this.startPingLoop();
        }
        break;
      }

      case 'HANDSHAKE': {
        const wasNotConnected = (this.status as ConnectionStatus) !== 'connected';
        this.opponentProfile = msg.profile;
        if (msg.targetScore && this.role === 'guest') {
          this.targetScore = msg.targetScore;
        }
        if (this.presenceInterval) {
          clearInterval(this.presenceInterval);
          this.presenceInterval = null;
        }
        // If I am host, reply with ACK and my profile
        if (this.role === 'host') {
          this.send({
            type: 'HANDSHAKE_ACK',
            profile: this.myProfile,
            targetScore: this.targetScore,
          });
        }
        this.setStatus('connected');
        if (wasNotConnected) {
          this.notify('handshake_received', msg.profile);
        }
        this.startPingLoop();
        break;
      }

      case 'HANDSHAKE_ACK': {
        const wasNotConnected = (this.status as ConnectionStatus) !== 'connected';
        this.opponentProfile = msg.profile;
        if (msg.targetScore) {
          this.targetScore = msg.targetScore;
        }
        if (this.handshakeInterval) {
          clearInterval(this.handshakeInterval);
          this.handshakeInterval = null;
        }
        if (this.presenceInterval) {
          clearInterval(this.presenceInterval);
          this.presenceInterval = null;
        }
        this.setStatus('connected');
        if (wasNotConnected) {
          this.notify('handshake_received', msg.profile);
        }
        this.startPingLoop();
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
        this.gameStarted = true;
        if (msg.targetScore) {
          this.targetScore = msg.targetScore;
        }
        this.notify('game_started');
        this.notify('match_start');
        break;
      }

      case 'STATE': {
        if (this.role === 'guest' && !this.gameStarted) {
          this.gameStarted = true;
          this.notify('game_started');
          this.notify('match_start');
        }
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
        this.ping = Math.max(5, Math.round(roundTrip / 2));
        this.notify('ping', this.ping);
        break;
      }

      case 'REMATCH_REQ': {
        this.notify('rematch_requested');
        break;
      }

      case 'REMATCH_ACCEPT': {
        this.gameStarted = true;
        this.notify('rematch_accepted');
        this.notify('game_started');
        this.notify('match_start');
        break;
      }

      case 'LEAVE': {
        this.setStatus('disconnected');
        break;
      }
    }
  }

  // Dual-dispatch: BroadcastChannel (local 0ms) + MQTT (global cloud)
  public send(msg: NetMessage) {
    if (!this.roomCode) return;
    const enrichedMsg: NetMessage = { ...msg, senderId: this.clientId };
    const serialized = JSON.stringify(enrichedMsg);

    // 1. BroadcastChannel (local tabs fast path)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(enrichedMsg);
      } catch {
        // ignore
      }
    }

    // 2. MQTT WebSocket Broker (cross-device global path)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        let topic = this.getLobbyTopic(this.roomCode);
        if (msg.type === 'STATE') {
          topic = this.getHostToGuestTopic(this.roomCode);
        } else if (msg.type === 'INPUT') {
          topic = this.getGuestToHostTopic(this.roomCode);
        }
        this.mqttClient.publish(topic, serialized, { qos: 0 });
      } catch {
        // ignore
      }
    }
  }

  // Fast broadcast game state (Host -> Guest) with ultra-low latency 60FPS rate
  public sendGameState(state: NetworkGameStatePayload) {
    if (this.role === 'host') {
      const now = performance.now();
      if (state.gameOver) {
        // Guaranteed burst delivery for game over
        const sendGameOver = () => {
          this.send({ type: 'STATE', data: state });
        };
        sendGameOver();
        setTimeout(sendGameOver, 40);
        setTimeout(sendGameOver, 100);
        setTimeout(sendGameOver, 220);
        setTimeout(sendGameOver, 450);
        return;
      }

      const hasEvents = (state.soundEvents && state.soundEvents.length > 0) || !!state.soundEvent;
      if (now - this.lastStateSent >= 16 || state.isRoundResetting || hasEvents) {
        this.lastStateSent = now;
        this.send({ type: 'STATE', data: state });
      }
    }
  }

  // Fast broadcast paddle input (Guest -> Host) at 60FPS
  public sendInput(input: NetworkInputPayload) {
    if (this.role === 'guest') {
      const now = performance.now();
      if (now - this.lastInputSent >= 16 || input.isSmash) {
        this.lastInputSent = now;
        this.send({ type: 'INPUT', data: input });
      }
    }
  }

  public startGame() {
    if (this.role === 'host') {
      this.gameStarted = true;
      // Burst START_GAME to guarantee arrival
      const sendStart = () => {
        this.send({ type: 'START_GAME', targetScore: this.targetScore });
      };
      sendStart();
      setTimeout(sendStart, 60);
      setTimeout(sendStart, 140);
      setTimeout(sendStart, 260);
      setTimeout(sendStart, 480);

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
    this.gameStarted = true;
    this.send({ type: 'REMATCH_ACCEPT' });
    this.notify('rematch_accepted');
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      if (this.roomCode && this.status === 'connected') {
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
    if (this.handshakeInterval) {
      clearInterval(this.handshakeInterval);
      this.handshakeInterval = null;
    }
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    if (this.roomCode && this.status === 'connected') {
      this.send({ type: 'LEAVE' });
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch {
        // ignore
      }
      this.mqttClient = null;
    }
    this.role = null;
    this.opponentProfile = null;
    this.status = 'idle';
  }

  public destroy() {
    this.cleanup();
  }
}
