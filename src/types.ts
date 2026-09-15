export type GameScreen =
  | 'menu'
  | 'adventure_map'
  | 'adventure_roadmap'
  | 'tournament_select'
  | 'tournament_roadmap'
  | 'multiplayer_lobby'
  | 'playing'
  | 'gameover';

export type GameDifficulty = 'easiest' | 'easy' | 'casual' | 'pro' | 'chaos';

export type GameMode = 'quick' | 'adventure' | 'tournament';

export interface CountryTeam {
  id: string;
  name: string;
  flag: string;
  code: string;
  flagCode?: string;
  paddleColor: string;
  secondaryColor?: string;
  glowColor: string;
  accentColor: string;
  confederation?: string;
  flagColors?: string[];
}

export interface TournamentMatch {
  matchNumber: number; // 1 to 40
  opponentTeam: CountryTeam;
  difficulty: GameDifficulty;
  completed: boolean;
  playerScore?: number;
  opponentScore?: number;
}

export interface TournamentProgress {
  playerTeamId: string;
  currentMatchIndex: number;
  completedMatches: number;
  isChampion: boolean;
  matches: {
    matchNumber: number;
    opponentId: string;
    playerScore: number;
    opponentScore: number;
    completed: boolean;
  }[];
}

export interface CardPenaltyState {
  playerYellowCards: number;
  playerIsEjected: boolean;
  opponentYellowCards: number;
  opponentIsEjected: boolean;
  playerHardStrikes: number;
  opponentHardStrikes: number;
}

export type PowerUpType =
  | 'extend_paddle'
  | 'shrink_paddle'
  | 'mega_paddle'
  | 'rocket'
  | 'multi_paddle'
  | 'freeze_sensor'
  | 'freeze_opponent'
  | 'ice_wall'
  | 'slow_ball'
  | 'fireball'
  | 'split_ball'
  | 'multi_ball';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  isHarmful: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  name: string;
  symbol: string;
  hasBounced?: boolean;
}

export interface MultiPaddleInstance {
  id: string;
  yOffset: number;
  remainingTime: number;
  totalTime: number;
  alpha: number;
  dissolving: boolean;
}

export interface GoaliePaddleInstance {
  id: string;
  x: number;
  y: number;
  targetX: number;
  vx: number;
  width: number;
  height: number;
  speed: number;
  remainingTime: number;
  totalTime: number;
  alpha: number;
  dissolving: boolean;
  color: string;
  glowColor: string;
}

export interface IceWallState {
  active: boolean;
  remainingTime: number;
  totalTime: number;
  y: number;
  height: number;
  alpha: number;
  hitFlash: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  id?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  lastHitter: 'player' | 'opponent' | 'none';
  trail: { x: number; y: number; alpha: number; radius: number; color?: string }[];
  spin: number;
  deflectedBySensor: boolean;
  isSmash?: boolean;
  isFireball?: boolean;
  isSlowMo?: boolean;
  isMini?: boolean;
}

export interface SensorCircle {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  angle: number;
  angularSpeed: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  centerOriginX: number;
  centerOriginY: number;
  movementType: 'orbit' | 'figure8' | 'bounce' | 'erratic';
  pulsePhase: number;
  glowColor: string;
  rotationAngle: number;
  deflectionCount: number;
  hitFlash: number; // 0 to 1 decay
  isFrozen: boolean;
  freezeTimer: number;
  isScorched: boolean;
  scorchTimer: number;
}

export interface Paddle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  width: number;
  baseWidth: number;
  height: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  secondaryColor?: string;
  glowColor: string;
  isPlayer: boolean;
  hitFlash: number;
  flagColors?: string[];
  // Power-up states
  isFrozen: boolean;
  freezeTimer: number;
  isRocketPowered: boolean;
  rocketTimer: number;
  isFiery: boolean;
  fireTimer: number;
  extensionLevel: number; // 0 to 3 max
  shrinkLevel: number; // 0 or 1 max
  isMegaPaddle?: boolean;
  megaPaddleTimer?: number;
  // Card penalty states
  yellowCards?: number;
  isEjected?: boolean;
  hardStrikesCount?: number;
  lastHardStrikeTime?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring' | 'smoke' | 'flame' | 'ice';
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface GameScore {
  player: number;
  opponent: number;
  targetScore: number;
}

export interface GameStats {
  maxCombo: number;
  totalVolleys: number;
  sensorHits: number;
  matchDurationSec: number;
  winner: 'player' | 'opponent' | null;
  powerUpsCollected?: number;
}

export interface ActivePowerUpStatus {
  id: string;
  type: PowerUpType;
  name: string;
  isHarmful: boolean;
  remainingTime?: number;
  totalTime?: number;
  count?: number;
}

