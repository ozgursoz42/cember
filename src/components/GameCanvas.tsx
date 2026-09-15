import React, { useRef, useEffect, useCallback } from 'react';
import {
  Ball,
  SensorCircle,
  Paddle,
  Particle,
  Shockwave,
  GameScore,
  GameStats,
  GameDifficulty,
  PowerUpItem,
  PowerUpType,
  MultiPaddleInstance,
  GoaliePaddleInstance,
  IceWallState,
  ActivePowerUpStatus,
  CountryTeam,
  CardPenaltyState,
} from '../types';
import {
  checkBallSensorCollision,
  checkBallPaddleCollision,
  checkCircleCollision,
  checkPaddleCircleCollision,
  updateSensorKinematics,
  clamp,
  lerp,
} from '../utils/physics';
import { soundEngine } from '../utils/audio';
import { StageTheme } from '../adventureData';
import { gyroController } from '../utils/gyroscope';
import { MultiplayerManager, NetworkGameStatePayload, NetworkInputPayload } from '../utils/multiplayer';

interface GameCanvasProps {
  difficulty: GameDifficulty;
  stage?: StageTheme;
  isAdventureMode?: boolean;
  isTournamentMode?: boolean;
  isPaused: boolean;
  score: GameScore;
  onScoreUpdate: (newScore: GameScore, lastScorer: 'player' | 'opponent') => void;
  onGameOver: (winner: 'player' | 'opponent', finalStats: GameStats, finalScore?: GameScore) => void;
  onComboChange: (combo: number) => void;
  onRallyChange: (rally: number) => void;
  onActivePowerUpsChange?: (powerUps: ActivePowerUpStatus[]) => void;
  playerTeam?: CountryTeam | null;
  opponentTeam?: CountryTeam | null;
  onCardStateChange?: (state: CardPenaltyState) => void;
  // Multiplayer Mode Props
  isMultiplayer?: boolean;
  multiplayerRole?: 'host' | 'guest' | null;
  multiplayerManager?: MultiplayerManager | null;
}

const createDefaultSensor = (
  x: number,
  y: number,
  angleOffset: number = 0,
  radius: number = 36,
  movementType: 'orbit' | 'figure8' | 'bounce' | 'erratic' = 'orbit',
  angularSpeed: number = 1.8,
  orbitRx: number = 65,
  orbitRy: number = 35
): SensorCircle => ({
  x,
  y,
  radius,
  baseRadius: radius,
  vx: 0,
  vy: 0,
  angle: angleOffset,
  angularSpeed,
  orbitRadiusX: orbitRx,
  orbitRadiusY: orbitRy,
  centerOriginX: x,
  centerOriginY: y,
  movementType,
  pulsePhase: angleOffset,
  glowColor: '#f59e0b',
  rotationAngle: angleOffset,
  deflectionCount: 0,
  hitFlash: 0,
  isFrozen: false,
  freezeTimer: 0,
  isScorched: false,
  scorchTimer: 0,
});

export const GameCanvas: React.FC<GameCanvasProps> = ({
  difficulty,
  stage,
  isAdventureMode,
  isTournamentMode,
  isPaused,
  score,
  onScoreUpdate,
  onGameOver,
  onComboChange,
  onRallyChange,
  onActivePowerUpsChange,
  playerTeam,
  opponentTeam,
  onCardStateChange,
  isMultiplayer,
  multiplayerRole,
  multiplayerManager,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state mutable refs for 60fps loop performance
  const gameStateRef = useRef({
    width: 360,
    height: 640,
    isRunning: true,
    isRoundResetting: false,
    resetTimer: 0,
    roundBanner: '',
    rallyCount: 0,
    comboCount: 0,
    maxCombo: 0,
    sensorHitsCount: 0,
    totalVolleysCount: 0,
    matchStartTime: Date.now(),
    screenShake: 0,
    currentScore: { ...score },
    baseTargetScore: stage?.targetScore || score.targetScore || 5,
    powerUpsCollectedCount: 0,
  });

  // Sync prop score to ref
  useEffect(() => {
    gameStateRef.current.currentScore = { ...score };
    gameStateRef.current.baseTargetScore = stage?.targetScore || score.targetScore || 5;
  }, [score, stage]);

  // Sync team paddle colors when country team changes
  useEffect(() => {
    if (playerTeam) {
      playerPaddleRef.current.color = playerTeam.paddleColor;
      playerPaddleRef.current.secondaryColor = playerTeam.secondaryColor || playerTeam.accentColor;
      playerPaddleRef.current.glowColor = playerTeam.glowColor;
    } else {
      playerPaddleRef.current.color = '#06b6d4';
      playerPaddleRef.current.secondaryColor = '#0284c7';
      playerPaddleRef.current.glowColor = '#22d3ee';
    }

    if (opponentTeam) {
      opponentPaddleRef.current.color = opponentTeam.paddleColor;
      opponentPaddleRef.current.secondaryColor = opponentTeam.secondaryColor || opponentTeam.accentColor;
      opponentPaddleRef.current.glowColor = opponentTeam.glowColor;
    } else if (stage) {
      opponentPaddleRef.current.color = stage.opponentPaddleColor;
      opponentPaddleRef.current.secondaryColor = undefined;
      opponentPaddleRef.current.glowColor = stage.opponentGlowColor;
    } else {
      opponentPaddleRef.current.color = '#f43f5e';
      opponentPaddleRef.current.secondaryColor = '#e11d48';
      opponentPaddleRef.current.glowColor = '#fb7185';
    }
  }, [playerTeam, opponentTeam, stage]);

  // Entities refs
  const ballRef = useRef<Ball>({
    x: 180,
    y: 320,
    vx: 0,
    vy: 0,
    radius: 11,
    speed: 350,
    baseSpeed: 350,
    maxSpeed: 920,
    lastHitter: 'none',
    trail: [],
    spin: 0,
    deflectedBySensor: false,
    isSmash: false,
    isFireball: false,
    isSlowMo: false,
  });

  const ballsRef = useRef<Ball[]>([ballRef.current]);

  // Çember sensors list (supports dynamic splitting to 2 at 30s and 4 at 60s)
  const sensorsRef = useRef<SensorCircle[]>([createDefaultSensor(180, 320, 0, 36)]);
  const roundActiveTimerRef = useRef<number>(0);
  const sensorSplitStageRef = useRef<number>(0); // 0: 1 circle, 1: 2 circles (30s), 2: 4 circles (60s)

  // Ice Walls (closes goal completely for 15 seconds)
  const playerIceWallRef = useRef<IceWallState>({
    active: false,
    remainingTime: 0,
    totalTime: 15,
    y: 626,
    height: 14,
    alpha: 0,
    hitFlash: 0,
  });

  const opponentIceWallRef = useRef<IceWallState>({
    active: false,
    remainingTime: 0,
    totalTime: 15,
    y: 14,
    height: 14,
    alpha: 0,
    hitFlash: 0,
  });

  // Goalie Paddles (autonomous goalkeeper paddles positioned in goal)
  const playerGoaliePaddleRef = useRef<GoaliePaddleInstance | null>(null);
  const opponentGoaliePaddleRef = useRef<GoaliePaddleInstance | null>(null);

  const playerPaddleRef = useRef<Paddle>({
    x: 180,
    y: 560,
    prevX: 180,
    prevY: 560,
    vx: 0,
    vy: 0,
    width: 84,
    baseWidth: 84,
    height: 14,
    targetX: 180,
    targetY: 560,
    speed: 16,
    color: '#06b6d4',
    glowColor: '#22d3ee',
    isPlayer: true,
    hitFlash: 0,
    isFrozen: false,
    freezeTimer: 0,
    isRocketPowered: false,
    rocketTimer: 0,
    isFiery: false,
    fireTimer: 0,
    extensionLevel: 0,
    shrinkLevel: 0,
    isMegaPaddle: false,
    megaPaddleTimer: 0,
  });

  const opponentPaddleRef = useRef<Paddle>({
    x: 180,
    y: 80,
    prevX: 180,
    prevY: 80,
    vx: 0,
    vy: 0,
    width: 84,
    baseWidth: 84,
    height: 14,
    targetX: 180,
    targetY: 80,
    speed: 10,
    color: '#f43f5e',
    glowColor: '#fb7185',
    isPlayer: false,
    hitFlash: 0,
    isFrozen: false,
    freezeTimer: 0,
    isRocketPowered: false,
    rocketTimer: 0,
    isFiery: false,
    fireTimer: 0,
    extensionLevel: 0,
    shrinkLevel: 0,
    isMegaPaddle: false,
    megaPaddleTimer: 0,
  });

  // Dynamic entities
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const multiPaddlesRef = useRef<MultiPaddleInstance[]>([]);
  const slowMoTimerRef = useRef<number>(0);
  const powerUpTimerRef = useRef<number>(5.0); // Spawns first power-up reliably 5s after game starts!
  const launcherFlashRef = useRef<number>(0);
  const powerUpToastRef = useRef<{ title: string; subtitle: string; color: string; icon: string; timer: number } | null>(null);
  const lastReportedStatusKeyRef = useRef<string>('');

  // Spawn visual particles
  const spawnHitParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 10,
    speedMul: number = 1,
    shape: 'circle' | 'spark' | 'smoke' | 'flame' | 'ice' = 'circle'
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 120) * speedMul;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: (shape === 'smoke' ? 4 : 2) + Math.random() * (shape === 'smoke' ? 4 : 3),
        color,
        alpha: 1,
        decay: (shape === 'smoke' ? 1.2 : 1.8) + Math.random() * 1.5,
        shape,
      });
    }
  };

  const spawnShockwave = (x: number, y: number, color: string, maxRadius: number = 60) => {
    shockwavesRef.current.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth: 3,
    });
  };

  const triggerToast = (title: string, subtitle: string, color: string, icon: string) => {
    powerUpToastRef.current = {
      title,
      subtitle,
      color,
      icon,
      timer: 2.2,
    };
  };

  const emitCardState = useCallback(() => {
    if (onCardStateChange) {
      onCardStateChange({
        playerYellowCards: playerPaddleRef.current.yellowCards || 0,
        playerIsEjected: !!playerPaddleRef.current.isEjected,
        opponentYellowCards: opponentPaddleRef.current.yellowCards || 0,
        opponentIsEjected: !!opponentPaddleRef.current.isEjected,
      });
    }
  }, [onCardStateChange]);

  // Schedule next random power up spawn
  const scheduleNextPowerUp = () => {
    // Spawns 5 to 8.5 seconds dynamically so power-ups appear steadily without prolonged waiting
    powerUpTimerRef.current = 5.0 + Math.random() * 3.5;
  };

  // Reset ball to center and serve
  const resetBall = useCallback((towardPlayer: boolean = true) => {
    const { width, height } = gameStateRef.current;
    const ball = ballRef.current;
    ball.x = width / 2;
    ball.y = height / 2;
    ball.trail = [];
    ball.lastHitter = 'none';
    ball.deflectedBySensor = false;
    ball.isSmash = false;
    ball.isFireball = false;
    ball.radius = 11;
    ball.isMini = false;

    // Difficulty base speed (supporting easiest, easy, casual, pro, chaos + scaled stage bonus)
    let diffBase = 280;
    let stageBonusRatio = 1.0;
    if (difficulty === 'easiest') {
      diffBase = 240;
      stageBonusRatio = 0.55;
    } else if (difficulty === 'easy') {
      diffBase = 260;
      stageBonusRatio = 0.75;
    } else if (difficulty === 'casual') {
      diffBase = 280;
      stageBonusRatio = 1.0;
    } else if (difficulty === 'pro') {
      diffBase = 330;
      stageBonusRatio = 1.0;
    } else if (difficulty === 'chaos') {
      diffBase = 375;
      stageBonusRatio = 1.15;
    }

    if (stage?.ballSpeedBonus) {
      diffBase += stage.ballSpeedBonus * stageBonusRatio;
    }

    ball.baseSpeed = diffBase;
    ball.speed = ball.isSlowMo ? diffBase * 0.48 : diffBase;
    ball.maxSpeed = 920;

    // Launch with slight random angle
    const angleOffset = (Math.random() * 0.5 - 0.25) * Math.PI;
    const dirY = towardPlayer ? 1 : -1;
    ball.vx = Math.sin(angleOffset) * ball.speed;
    ball.vy = Math.cos(angleOffset) * dirY * ball.speed;

    // Reset multi balls back to single ball
    ballsRef.current = [ball];
  }, [difficulty, stage]);

  // Adjust sensor movement type based on total points or round progression
  const updateSensorDifficulty = useCallback(() => {
    const totalPoints = gameStateRef.current.currentScore.player + gameStateRef.current.currentScore.opponent;
    const w = gameStateRef.current.width;

    sensorsRef.current.forEach((sensor) => {
      if (difficulty === 'chaos' || totalPoints >= 5 || (stage && stage.id >= 5)) {
        sensor.movementType = 'erratic';
        sensor.angularSpeed = 2.8;
        sensor.orbitRadiusX = Math.min(w * 0.28, 95);
        sensor.orbitRadiusY = 55;
      } else if (difficulty === 'pro' || totalPoints >= 2 || (stage && stage.id >= 3)) {
        sensor.movementType = 'figure8';
        sensor.angularSpeed = 2.2;
        sensor.orbitRadiusX = Math.min(w * 0.24, 80);
        sensor.orbitRadiusY = 45;
      } else {
        sensor.movementType = 'orbit';
        sensor.angularSpeed = difficulty === 'easiest' ? 1.15 : difficulty === 'easy' ? 1.4 : 1.7;
        sensor.orbitRadiusX = Math.min(w * 0.22, 70);
        sensor.orbitRadiusY = 35;
      }
    });
  }, [difficulty, stage]);

  /**
   * Immediately resets all active powers, buffs, debuffs, fireball, ice wall, goalie paddle,
   * mega paddle and resets sensor count back to 1 when a goal is scored!
   */
  const resetAllActivePowersOnGoal = useCallback(() => {
    const player = playerPaddleRef.current;
    const opponent = opponentPaddleRef.current;
    const ball = ballRef.current;
    const { width, height } = gameStateRef.current;

    // 1. Reset player paddle size and powers
    player.extensionLevel = 0;
    player.shrinkLevel = 0;
    player.isMegaPaddle = false;
    player.megaPaddleTimer = 0;
    player.width = player.baseWidth;
    player.isRocketPowered = false;
    player.rocketTimer = 0;
    player.isFiery = false;
    player.fireTimer = 0;
    if (player.isFrozen) {
      player.isFrozen = false;
      player.freezeTimer = 0;
    }

    // 2. Reset opponent paddle size and powers
    opponent.extensionLevel = 0;
    opponent.shrinkLevel = 0;
    opponent.isMegaPaddle = false;
    opponent.megaPaddleTimer = 0;
    opponent.width = opponent.baseWidth;
    opponent.isRocketPowered = false;
    opponent.rocketTimer = 0;
    opponent.isFiery = false;
    opponent.fireTimer = 0;
    if (opponent.isFrozen) {
      opponent.isFrozen = false;
      opponent.freezeTimer = 0;
    }

    // 3. Reset sensors to single 1 original circle and clear status
    roundActiveTimerRef.current = 0;
    sensorSplitStageRef.current = 0;
    sensorsRef.current = [createDefaultSensor(width / 2, height / 2, 0, 36)];

    // 4. Reset Ice Walls (15s goal closure) & Goalie Paddles
    playerIceWallRef.current.active = false;
    playerIceWallRef.current.remainingTime = 0;
    opponentIceWallRef.current.active = false;
    opponentIceWallRef.current.remainingTime = 0;
    playerGoaliePaddleRef.current = null;
    opponentGoaliePaddleRef.current = null;

    // 5. Reset ball fireball & slow-motion effects, and restore single full-size ball
    ball.isFireball = false;
    ball.isSlowMo = false;
    ball.radius = 11;
    ball.isMini = false;
    ball.speed = ball.baseSpeed;
    ballsRef.current = [ball];
    slowMoTimerRef.current = 0;

    // 6. Remove multi-paddles from arena
    multiPaddlesRef.current = [];

    // 7. Reset Ejection status upon goal (ejected paddle returns until next goal)
    player.lastHardStrikeTime = 0;
    opponent.lastHardStrikeTime = 0;
    if (player.isEjected) {
      player.isEjected = false;
      player.hardStrikesCount = 0;
      player.x = width / 2;
      player.targetX = width / 2;
    }
    if (opponent.isEjected) {
      opponent.isEjected = false;
      opponent.hardStrikesCount = 0;
      opponent.x = width / 2;
      opponent.targetX = width / 2;
    }
    emitCardState();

    // 8. Clear field power-up items and schedule next spawn reliably after 5s
    powerUpsRef.current = [];
    powerUpTimerRef.current = 5.0;

    // 9. Clear active power-ups list in HUD immediately
    if (onActivePowerUpsChange) {
      onActivePowerUpsChange([]);
    }
    lastReportedStatusKeyRef.current = '';
    powerUpToastRef.current = null;
  }, [emitCardState, onActivePowerUpsChange]);

  // Apply collected power-up to game entities (player or opponent)
  const applyPowerUp = (p: PowerUpItem, collector: 'player' | 'opponent' = 'player') => {
    const player = playerPaddleRef.current;
    const opponent = opponentPaddleRef.current;
    const ball = ballRef.current;
    const { width, height } = gameStateRef.current;
    gameStateRef.current.powerUpsCollectedCount++;

    if (collector === 'player') {
      switch (p.type) {
        case 'extend_paddle': {
          if (player.extensionLevel < 3) {
            player.extensionLevel++;
            if (!player.isMegaPaddle) {
              const newW = (player.baseWidth + player.extensionLevel * 22) / (player.shrinkLevel > 0 ? 2 : 1);
              player.width = Math.round(newW);
            }
            triggerToast('📏 ÇUBUK UZATILDI!', `Genişlik Seviye ${player.extensionLevel}/3`, '#10b981', '📏');
          }
          break;
        }

        case 'shrink_paddle': {
          if (player.shrinkLevel === 0) {
            player.shrinkLevel = 1;
            if (!player.isMegaPaddle) {
              const newW = (player.baseWidth + player.extensionLevel * 22) / 2;
              player.width = Math.max(38, Math.round(newW));
            }
            triggerToast('✂️ ÇUBUK KÜÇÜLDÜ!', 'Çubuk boyu yarıya indi!', '#ef4444', '✂️');
          }
          break;
        }

        case 'mega_paddle': {
          player.isMegaPaddle = true;
          player.megaPaddleTimer = 16;
          player.width = Math.round(width / 2);
          soundEngine.playMegaPaddle();
          triggerToast('👑 EN UZUN ÇUBUK!', 'Sahanın yarısı kadar dev çubuk (16s)!', '#a855f7', '👑');
          break;
        }

        case 'rocket': {
          player.isRocketPowered = true;
          player.rocketTimer = 16;
          soundEngine.playRocketBoost();
          triggerToast('🚀 ROKET MODU AKTİF!', 'Süper hızlı ve alevli vuruşlar!', '#06b6d4', '🚀');
          break;
        }

        case 'multi_paddle': {
          playerGoaliePaddleRef.current = {
            id: Math.random().toString(),
            x: width / 2,
            y: height - 28,
            targetX: width / 2,
            vx: 0,
            width: 82,
            height: 12,
            speed: 16,
            remainingTime: 20,
            totalTime: 20,
            alpha: 1,
            dissolving: false,
            color: '#06b6d4',
            glowColor: '#22d3ee',
          };
          soundEngine.playRocketBoost();
          triggerToast('🧤 OTONOM KALECİ (20s)!', 'Kaleye geçen bağımsız kaleci devrede!', '#06b6d4', '🧤');
          break;
        }

        case 'ice_wall': {
          playerIceWallRef.current = {
            active: true,
            remainingTime: 15,
            totalTime: 15,
            y: height - 14,
            height: 14,
            alpha: 1,
            hitFlash: 0,
          };
          soundEngine.playIceWall();
          triggerToast('🧊 BUZ DUVARI (15s)!', 'Kaleni 15 saniye buz kalkanı kapatıyor!', '#38bdf8', '🧊');
          break;
        }

        case 'freeze_sensor': {
          sensorsRef.current.forEach((s) => {
            s.isFrozen = true;
            s.freezeTimer = 15;
          });
          soundEngine.playFreezeSound();
          triggerToast('🧊 ÇEMBER DONDURULDU!', 'Çember 15 saniye hareketsiz!', '#38bdf8', '🧊');
          break;
        }

        case 'freeze_opponent': {
          opponent.isFrozen = true;
          opponent.freezeTimer = 10;
          soundEngine.playFreezeSound();
          spawnHitParticles(opponent.x, opponent.y, '#93c5fd', 25, 2.0, 'ice');
          spawnShockwave(opponent.x, opponent.y, '#93c5fd', 60);
          triggerToast('❄️ RAKİP DONDURULDU!', 'Rakip buz kesti (10s)!', '#60a5fa', '❄️');
          break;
        }

        case 'slow_ball': {
          ball.isSlowMo = true;
          slowMoTimerRef.current = 10;
          ball.speed = ball.baseSpeed * 0.48;
          const currentSpeed = Math.hypot(ball.vx, ball.vy);
          if (currentSpeed > 0) {
            ball.vx = (ball.vx / currentSpeed) * ball.speed;
            ball.vy = (ball.vy / currentSpeed) * ball.speed;
          }
          soundEngine.playSlowMoSound();
          triggerToast('⏳ UZAY YAVAŞLIĞI!', 'Top yerçekimsiz süzülüyor (10s)!', '#a855f7', '⏳');
          break;
        }

        case 'fireball': {
          player.isFiery = true;
          player.fireTimer = 18;
          soundEngine.playFireballSound();
          triggerToast('☄️ ATEŞ TOPU HAZIR!', 'Çemberi yakar, rakibi delip geçer!', '#f97316', '☄️');
          break;
        }

        case 'split_ball': {
          soundEngine.playSplitBall();
          const primary = ballsRef.current[0] || ballRef.current;
          primary.radius = 6.5;
          primary.isMini = true;

          const curAngle = Math.atan2(primary.vy, primary.vx);
          const speed = Math.hypot(primary.vx, primary.vy) || primary.speed;
          primary.vx = Math.cos(curAngle - 0.42) * speed;
          primary.vy = Math.sin(curAngle - 0.42) * speed;

          const secondBall: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x + Math.sin(curAngle) * 8,
            y: primary.y - Math.cos(curAngle) * 8,
            vx: Math.cos(curAngle + 0.42) * speed,
            vy: Math.sin(curAngle + 0.42) * speed,
            trail: [],
            isMini: true,
            radius: 6.5,
          };

          ballsRef.current = [primary, secondBall];
          triggerToast('🏐 TOP İKİYE BÖLÜNDÜ!', '2 Küçük Top oyunda! 1 tanesi gol olsa yeter!', '#38bdf8', '🏐');
          break;
        }

        case 'multi_ball': {
          soundEngine.playMultiBall();
          const primary = ballsRef.current[0] || ballRef.current;
          const curAngle = Math.atan2(primary.vy, primary.vx);
          const speed = Math.hypot(primary.vx, primary.vy) || primary.speed;

          primary.vx = Math.cos(curAngle) * speed;
          primary.vy = Math.sin(curAngle) * speed;

          const clone1: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x - 14,
            y: primary.y,
            vx: Math.cos(curAngle - 0.46) * speed,
            vy: Math.sin(curAngle - 0.46) * speed,
            trail: [],
          };

          const clone2: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x + 14,
            y: primary.y,
            vx: Math.cos(curAngle + 0.46) * speed,
            vy: Math.sin(curAngle + 0.46) * speed,
            trail: [],
          };

          ballsRef.current = [primary, clone1, clone2];
          triggerToast('🎱 3 TOP SAHADA!', 'Oyunda 3 Top! 1 tanesi gol olsa yeter!', '#f59e0b', '🎱');
          break;
        }
      }
    } else {
      // COLLECTED BY OPPONENT!
      switch (p.type) {
        case 'extend_paddle': {
          if (opponent.extensionLevel < 3) {
            opponent.extensionLevel++;
            if (!opponent.isMegaPaddle) {
              const newW = (opponent.baseWidth + opponent.extensionLevel * 22) / (opponent.shrinkLevel > 0 ? 2 : 1);
              opponent.width = Math.round(newW);
            }
            triggerToast('⚠️ RAKİP ÇUBUK UZATTI!', `Rakip Seviye ${opponent.extensionLevel}/3 genişledi!`, '#f43f5e', '📏');
          }
          break;
        }

        case 'shrink_paddle': {
          if (opponent.shrinkLevel === 0) {
            opponent.shrinkLevel = 1;
            if (!opponent.isMegaPaddle) {
              const newW = (opponent.baseWidth + opponent.extensionLevel * 22) / 2;
              opponent.width = Math.max(38, Math.round(newW));
            }
            triggerToast('✂️ RAKİP KÜÇÜLDÜ!', 'Rakibin çubuk boyu yarıya indi!', '#10b981', '✂️');
          }
          break;
        }

        case 'mega_paddle': {
          opponent.isMegaPaddle = true;
          opponent.megaPaddleTimer = 16;
          opponent.width = Math.round(width / 2);
          soundEngine.playMegaPaddle();
          triggerToast('👑 RAKİP EN UZUN ÇUBUK ALDI!', 'Rakip sahanın yarısını kaplıyor (16s)!', '#f43f5e', '👑');
          break;
        }

        case 'rocket': {
          opponent.isRocketPowered = true;
          opponent.rocketTimer = 16;
          soundEngine.playRocketBoost();
          triggerToast('🚀 RAKİP ROKET MODUNDA!', 'Rakip alevli ve ultra hızlı vuracak!', '#f43f5e', '🚀');
          break;
        }

        case 'multi_paddle': {
          const oppGoalieDuration = difficulty === 'easiest' ? 10 : difficulty === 'easy' ? 12 : difficulty === 'casual' ? 15 : 18;
          const oppGoalieWidth = difficulty === 'easiest' ? 56 : difficulty === 'easy' ? 64 : difficulty === 'casual' ? 72 : 82;
          opponentGoaliePaddleRef.current = {
            id: Math.random().toString(),
            x: width / 2,
            y: 28,
            targetX: width / 2,
            vx: 0,
            width: oppGoalieWidth,
            height: 12,
            speed: 16,
            remainingTime: oppGoalieDuration,
            totalTime: oppGoalieDuration,
            alpha: 1,
            dissolving: false,
            color: '#f43f5e',
            glowColor: '#fb7185',
          };
          soundEngine.playRocketBoost();
          triggerToast('🧤 RAKİP OTONOM KALECİ ALDI!', `Rakip kaleye kaleci geçti (${oppGoalieDuration}s)!`, '#f43f5e', '🧤');
          break;
        }

        case 'ice_wall': {
          const oppIceDuration = difficulty === 'easiest' ? 8 : difficulty === 'easy' ? 10 : difficulty === 'casual' ? 12 : 15;
          opponentIceWallRef.current = {
            active: true,
            remainingTime: oppIceDuration,
            totalTime: oppIceDuration,
            y: 14,
            height: 14,
            alpha: 1,
            hitFlash: 0,
          };
          soundEngine.playIceWall();
          triggerToast('🧊 RAKİP BUZ DUVARI ÖRDÜ!', `Rakip kalesi ${oppIceDuration} saniye kapandı!`, '#f43f5e', '🧊');
          break;
        }

        case 'freeze_sensor': {
          sensorsRef.current.forEach((s) => {
            s.isFrozen = true;
            s.freezeTimer = 15;
          });
          soundEngine.playFreezeSound();
          triggerToast('❄️ RAKİP ÇEMBERİ DONDURDU!', 'Çember 15 saniye hareketsiz!', '#38bdf8', '❄️');
          break;
        }

        case 'freeze_opponent': {
          // Rakip dondurucuyu aldı -> OYUNCU DONAR (zorluğa göre insaflı süre)
          const freezeDuration = difficulty === 'easiest' ? 2.5 : difficulty === 'easy' ? 3.5 : difficulty === 'casual' ? 4.5 : difficulty === 'pro' ? 6.0 : 7.5;
          player.isFrozen = true;
          player.freezeTimer = freezeDuration;
          soundEngine.playFreezeSound();
          spawnHitParticles(player.x, player.y, '#93c5fd', 25, 2.0, 'ice');
          spawnShockwave(player.x, player.y, '#93c5fd', 60);
          triggerToast('🥶 DONUP KALDIN!', `Rakip seni ${freezeDuration}s dondurdu!`, '#ef4444', '🥶');
          break;
        }

        case 'slow_ball': {
          ball.isSlowMo = true;
          slowMoTimerRef.current = 10;
          ball.speed = ball.baseSpeed * 0.48;
          const currentSpeed = Math.hypot(ball.vx, ball.vy);
          if (currentSpeed > 0) {
            ball.vx = (ball.vx / currentSpeed) * ball.speed;
            ball.vy = (ball.vy / currentSpeed) * ball.speed;
          }
          soundEngine.playSlowMoSound();
          triggerToast('⏳ RAKİP TOPU YAVAŞLATTI!', 'Top uzay boşluğunda süzülüyor (10s)!', '#a855f7', '⏳');
          break;
        }

        case 'fireball': {
          opponent.isFiery = true;
          opponent.fireTimer = 18;
          soundEngine.playFireballSound();
          triggerToast('☄️ RAKİP ATEŞ TOPU ALDI!', 'Rakibin vuruşları alev saçacak!', '#f43f5e', '☄️');
          break;
        }

        case 'split_ball': {
          soundEngine.playSplitBall();
          const primary = ballsRef.current[0] || ballRef.current;
          primary.radius = 6.5;
          primary.isMini = true;

          const curAngle = Math.atan2(primary.vy, primary.vx);
          const speed = Math.hypot(primary.vx, primary.vy) || primary.speed;
          primary.vx = Math.cos(curAngle - 0.42) * speed;
          primary.vy = Math.sin(curAngle - 0.42) * speed;

          const secondBall: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x + Math.sin(curAngle) * 8,
            y: primary.y - Math.cos(curAngle) * 8,
            vx: Math.cos(curAngle + 0.42) * speed,
            vy: Math.sin(curAngle + 0.42) * speed,
            trail: [],
            isMini: true,
            radius: 6.5,
          };

          ballsRef.current = [primary, secondBall];
          triggerToast('🏐 RAKİP TOPU BÖLDÜ!', '2 Küçük Top oyunda!', '#f43f5e', '🏐');
          break;
        }

        case 'multi_ball': {
          soundEngine.playMultiBall();
          const primary = ballsRef.current[0] || ballRef.current;
          const curAngle = Math.atan2(primary.vy, primary.vx);
          const speed = Math.hypot(primary.vx, primary.vy) || primary.speed;

          primary.vx = Math.cos(curAngle) * speed;
          primary.vy = Math.sin(curAngle) * speed;

          const clone1: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x - 14,
            y: primary.y,
            vx: Math.cos(curAngle - 0.46) * speed,
            vy: Math.sin(curAngle - 0.46) * speed,
            trail: [],
          };

          const clone2: Ball = {
            ...primary,
            id: Math.random().toString(),
            x: primary.x + 14,
            y: primary.y,
            vx: Math.cos(curAngle + 0.46) * speed,
            vy: Math.sin(curAngle + 0.46) * speed,
            trail: [],
          };

          ballsRef.current = [primary, clone1, clone2];
          triggerToast('🎱 RAKİP 3 TOP ÇIKARDI!', 'Oyunda 3 Top! 1 tanesi gol olsa yeter!', '#f43f5e', '🎱');
          break;
        }
      }
    }
  };

  // Responsive Canvas Sizing
  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const w = Math.min(rect.width, 480);
      const h = rect.height;

      gameStateRef.current.width = w;
      gameStateRef.current.height = h;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Set initial entity coordinates based on arena scale
      sensorsRef.current.forEach((s) => {
        s.centerOriginX = w / 2;
        s.centerOriginY = h / 2;
        s.x = w / 2;
        s.y = h / 2;
      });

      const playerW = difficulty === 'easiest' ? 88 : difficulty === 'easy' ? 86 : 84;
      const oppW = 84;
      if (!playerPaddleRef.current.isMegaPaddle && playerPaddleRef.current.extensionLevel === 0 && playerPaddleRef.current.shrinkLevel === 0) {
        playerPaddleRef.current.width = playerW;
        playerPaddleRef.current.baseWidth = playerW;
      }
      if (!opponentPaddleRef.current.isMegaPaddle && opponentPaddleRef.current.extensionLevel === 0 && opponentPaddleRef.current.shrinkLevel === 0) {
        opponentPaddleRef.current.width = oppW;
        opponentPaddleRef.current.baseWidth = oppW;
      }

      playerPaddleRef.current.x = w / 2;
      playerPaddleRef.current.y = h - 65;
      playerPaddleRef.current.targetX = w / 2;
      playerPaddleRef.current.targetY = h - 65;

      opponentPaddleRef.current.x = w / 2;
      opponentPaddleRef.current.y = 65;
      opponentPaddleRef.current.targetX = w / 2;
      opponentPaddleRef.current.targetY = 65;

      updateSensorDifficulty();
      resetBall(true);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [resetBall, updateSensorDifficulty]);

  // Touch and pointer interaction handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      // If player is frozen in ice or ejected with a red card, player cannot move!
      if (playerPaddleRef.current.isFrozen || playerPaddleRef.current.isEjected) return;

      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const w = gameStateRef.current.width;
      const h = gameStateRef.current.height;

      // Restrict player target to bottom half with generous forward rush runway
      const halfW = playerPaddleRef.current.width / 2;
      const clampedX = clamp(clientX, halfW + 8, w - halfW - 8);
      const clampedY = clamp(clientY, h * 0.52, h - 25);

      playerPaddleRef.current.targetX = clampedX;
      playerPaddleRef.current.targetY = clampedY;

      if (isMultiplayer && multiplayerRole === 'guest' && multiplayerManager) {
        multiplayerManager.sendInput({
          t: Date.now(),
          targetX: clampedX / w,
          targetY: clampedY / h,
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      container.setPointerCapture?.(e.pointerId);
      handlePointerMove(e);

      // On tap/strike, if moving or tapping forward close to the ball, apply forward strike boost
      const ball = ballRef.current;
      const paddle = playerPaddleRef.current;
      if (paddle.isFrozen || paddle.isEjected) return;

      const dist = Math.hypot(ball.x - paddle.x, ball.y - paddle.y);
      if (dist < 70 && ball.vy > 0) {
        ball.vy = -Math.abs(ball.vy) * 1.15;
        ball.speed = Math.min(ball.speed * 1.15, ball.maxSpeed);
        soundEngine.playSmashHit();
        spawnHitParticles(ball.x, ball.y, '#22d3ee', 16, 1.5);
        spawnShockwave(ball.x, ball.y, '#22d3ee', 60);

        if (isMultiplayer && multiplayerRole === 'guest' && multiplayerManager) {
          const w = gameStateRef.current.width;
          const h = gameStateRef.current.height;
          multiplayerManager.sendInput({
            t: Date.now(),
            targetX: paddle.targetX / w,
            targetY: paddle.targetY / h,
            isSmash: true,
          });
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Multiplayer Network Event Listeners
  useEffect(() => {
    if (!isMultiplayer || !multiplayerManager) return;

    if (multiplayerRole === 'host') {
      const unsub = multiplayerManager.onInput((input: NetworkInputPayload) => {
        const w = gameStateRef.current.width;
        const h = gameStateRef.current.height;
        const opp = opponentPaddleRef.current;
        const halfW = opp.width / 2;
        // Invert X & Y for host (guest is at the top of host screen)
        opp.targetX = clamp((1 - input.targetX) * w, halfW + 8, w - halfW - 8);
        opp.targetY = clamp((1 - input.targetY) * h, 25, h * 0.46);

        if (input.isSmash) {
          const b = ballsRef.current[0] || ballRef.current;
          const dist = Math.hypot(b.x - opp.x, b.y - opp.y);
          if (dist < 75 && b.vy < 0) {
            b.vy = Math.abs(b.vy) * 1.15;
            b.speed = Math.min(b.speed * 1.15, b.maxSpeed);
            b.isSmash = true;
            soundEngine.playSmashHit();
            spawnHitParticles(b.x, b.y, '#f43f5e', 16, 1.5);
            spawnShockwave(b.x, b.y, '#f43f5e', 60);
          }
        }
      });
      return unsub;
    } else if (multiplayerRole === 'guest') {
      const unsub = multiplayerManager.onState((netState: NetworkGameStatePayload) => {
        const w = gameStateRef.current.width;
        const h = gameStateRef.current.height;

        // Sync Balls
        if (netState.balls && netState.balls.length > 0) {
          ballsRef.current = netState.balls.map((nb, idx) => {
            const existing = ballsRef.current[idx];
            return {
              id: existing?.id || Math.random().toString(),
              x: (1 - nb.x) * w,
              y: (1 - nb.y) * h,
              vx: -nb.vx * (w / 360),
              vy: -nb.vy * (h / 640),
              radius: nb.radius,
              speed: nb.speed,
              baseSpeed: 290,
              maxSpeed: 920,
              isSlowMo: nb.isSlowMo,
              isFireball: nb.isFireball,
              isMini: nb.isMini,
              isSmash: nb.isSmash,
              lastHitter: nb.lastHitter === 'player' ? 'opponent' : nb.lastHitter === 'opponent' ? 'player' : 'none',
              deflectedBySensor: nb.deflectedBySensor,
              trail: existing?.trail || [],
            };
          });
          ballRef.current = ballsRef.current[0];
        }

        // Host paddle is opponent for guest
        const opp = opponentPaddleRef.current;
        opp.x = (1 - netState.hostPaddle.x) * w;
        opp.y = (1 - netState.hostPaddle.y) * h;
        opp.width = (netState.hostPaddle.width / 360) * w;
        opp.isFrozen = netState.hostPaddle.isFrozen;
        opp.freezeTimer = netState.hostPaddle.freezeTimer;
        opp.isMegaPaddle = netState.hostPaddle.isMegaPaddle;
        opp.megaPaddleTimer = netState.hostPaddle.megaPaddleTimer;
        opp.isRocketPowered = netState.hostPaddle.isRocketPowered;
        opp.isFiery = netState.hostPaddle.isFiery;

        // Guest paddle is player for guest
        const ply = playerPaddleRef.current;
        ply.x = lerp(ply.x, (1 - netState.guestPaddle.x) * w, 0.4);
        ply.y = lerp(ply.y, (1 - netState.guestPaddle.y) * h, 0.4);
        ply.width = (netState.guestPaddle.width / 360) * w;
        ply.isFrozen = netState.guestPaddle.isFrozen;
        ply.freezeTimer = netState.guestPaddle.freezeTimer;
        ply.isMegaPaddle = netState.guestPaddle.isMegaPaddle;
        ply.megaPaddleTimer = netState.guestPaddle.megaPaddleTimer;
        ply.isRocketPowered = netState.guestPaddle.isRocketPowered;
        ply.isFiery = netState.guestPaddle.isFiery;

        // Sensors
        if (netState.sensors) {
          sensorsRef.current = netState.sensors.map((ns, idx) => {
            const existing = sensorsRef.current[idx];
            return {
              ...(existing || createDefaultSensor(w / 2, h / 2, 0, ns.radius)),
              x: (1 - ns.x) * w,
              y: (1 - ns.y) * h,
              radius: ns.radius,
              isFrozen: ns.isFrozen,
              isScorched: ns.isScorched,
              glowColor: ns.glowColor,
            };
          });
        }

        // Power-ups
        if (netState.powerUps) {
          powerUpsRef.current = netState.powerUps.map((np) => ({
            id: np.id,
            type: np.type,
            x: (1 - np.x) * w,
            y: (1 - np.y) * h,
            vx: 0,
            vy: 0,
            radius: 15.5,
            phase: 0,
            name: '',
            symbol: '',
            isHarmful: np.isHarmful,
          }));
        }

        // Scores
        if (netState.score) {
          if (
            netState.score.player !== gameStateRef.current.currentScore.opponent ||
            netState.score.opponent !== gameStateRef.current.currentScore.player
          ) {
            gameStateRef.current.currentScore.opponent = netState.score.player;
            gameStateRef.current.currentScore.player = netState.score.opponent;
            onScoreUpdate(
              {
                player: netState.score.opponent,
                opponent: netState.score.player,
                targetScore: netState.score.targetScore,
              },
              'opponent'
            );
          }
        }

        // Round reset & toast
        gameStateRef.current.isRoundResetting = netState.isRoundResetting;
        if (netState.roundBanner) {
          gameStateRef.current.roundBanner = netState.roundBanner;
        }
        if (netState.toast) {
          powerUpToastRef.current = {
            title: netState.toast.title,
            subtitle: netState.toast.subtitle,
            color: netState.toast.color,
            icon: netState.toast.icon,
            timer: 2.0,
          };
        }
      });
      return unsub;
    }
  }, [isMultiplayer, multiplayerManager, multiplayerRole, onScoreUpdate]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap frame delta
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const state = gameStateRef.current;
      const w = state.width;
      const h = state.height;

      // 0. Gyroscope Motion Input Handling
      const gyro = gyroController.getState();
      const player = playerPaddleRef.current;
      if (gyro.isEnabled && !player.isFrozen && !player.isEjected) {
        const halfW = player.width / 2;
        const clampedX = clamp(gyro.normalizedX * w, halfW + 8, w - halfW - 8);
        const clampedY = clamp(gyro.normalizedY * h, h * 0.52, h - 25);
        player.targetX = clampedX;
        player.targetY = clampedY;

        if (gyro.isForwardThrust) {
          const ball = ballsRef.current[0] || ballRef.current;
          const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
          if (dist < 75 && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy) * 1.15;
            ball.speed = Math.min(ball.speed * 1.15, ball.maxSpeed);
            soundEngine.playSmashHit();
            spawnHitParticles(ball.x, ball.y, '#22d3ee', 16, 1.5);
            spawnShockwave(ball.x, ball.y, '#22d3ee', 60);
          }
        }
      }

      // Guest: send input to host every frame
      if (isMultiplayer && multiplayerRole === 'guest' && multiplayerManager) {
        multiplayerManager.sendInput({
          t: currentTime,
          targetX: player.targetX / w,
          targetY: player.targetY / h,
          isSmash: gyro.isForwardThrust,
        });
      }

      // Only update physics if not paused and (not guest in multiplayer)
      if (!isPaused && state.isRunning && (!isMultiplayer || multiplayerRole === 'host')) {
        // 1. Decay screen shake & launcher flash
        if (state.screenShake > 0) {
          state.screenShake = Math.max(0, state.screenShake - dt * 25);
        }
        if (launcherFlashRef.current > 0) {
          launcherFlashRef.current = Math.max(0, launcherFlashRef.current - dt * 3.5);
        }

        // 2. Handle round reset timer
        if (state.isRoundResetting) {
          state.resetTimer -= dt;
          if (state.resetTimer <= 0) {
            state.isRoundResetting = false;
            state.roundBanner = '';
            resetBall(ballRef.current.lastHitter !== 'player');
          }
        } else {
          // --- CIRCLE SENSOR TIME-BASED DIVISION MECHANIC ---
          // "Çember bölünme kuralını 30 saniyeden 10 saniyeye çek, ikinci kez bölünme de 20. saniyede gerçekleşsin."
          roundActiveTimerRef.current += dt;
          const elapsed = roundActiveTimerRef.current;

          if (sensorSplitStageRef.current === 0 && elapsed >= 10) {
            sensorSplitStageRef.current = 1;
            // Split 1 -> 2 circles (radius 27)
            const cur = sensorsRef.current[0] || createDefaultSensor(w / 2, h / 2, 0, 36);
            const c1 = createDefaultSensor(w * 0.38, h / 2, cur.angle, 27, cur.movementType, 2.0, w * 0.18, 30);
            const c2 = createDefaultSensor(w * 0.62, h / 2, cur.angle + Math.PI, 27, cur.movementType, 2.0, w * 0.18, 30);
            sensorsRef.current = [c1, c2];
            soundEngine.playCircleSplit();
            spawnHitParticles(w / 2, h / 2, '#f59e0b', 30, 2.2);
            spawnShockwave(w / 2, h / 2, '#f59e0b', 100);
            triggerToast('✨ ÇEMBER 2’YE BÖLÜNDÜ!', '10s doldu! 2 Çember devrede!', '#f59e0b', '✨');
          } else if (sensorSplitStageRef.current === 1 && elapsed >= 20) {
            sensorSplitStageRef.current = 2;
            // Split 2 -> 4 circles (radius 20)
            const c1 = createDefaultSensor(w * 0.32, h * 0.44, 0, 21, 'orbit', 2.3, w * 0.14, 25);
            const c2 = createDefaultSensor(w * 0.68, h * 0.44, Math.PI * 0.5, 21, 'orbit', 2.3, w * 0.14, 25);
            const c3 = createDefaultSensor(w * 0.32, h * 0.56, Math.PI, 21, 'orbit', 2.3, w * 0.14, 25);
            const c4 = createDefaultSensor(w * 0.68, h * 0.56, Math.PI * 1.5, 21, 'orbit', 2.3, w * 0.14, 25);
            sensorsRef.current = [c1, c2, c3, c4];
            soundEngine.playCircleSplit();
            spawnHitParticles(w / 2, h / 2, '#f59e0b', 40, 2.4);
            spawnShockwave(w / 2, h / 2, '#f59e0b', 120);
            triggerToast('💥 ÇEMBER 4’E BÖLÜNDÜ!', '20s doldu! 4 Çember devrede!', '#f59e0b', '💥');
          }

          // --- REAL-TIME SENSORS KINEMATICS ---
          sensorsRef.current.forEach((sensor) => {
            updateSensorKinematics(sensor, dt, w, h, state.rallyCount, difficulty);
          });

          // --- PLAYER PADDLE LERP & VELOCITY CALCULATION ---
          const player = playerPaddleRef.current;
          const prevPlayerX = player.x;
          const prevPlayerY = player.y;

          // Check player ejection or freeze status
          if (player.isEjected) {
            player.targetX = -200;
            player.x = -200;
            player.vx = 0;
            player.vy = 0;
          } else if (player.isFrozen) {
            player.freezeTimer -= dt;
            if (player.freezeTimer <= 0) {
              player.isFrozen = false;
              soundEngine.playIceShatter();
              spawnHitParticles(player.x, player.y, '#93c5fd', 25, 2.0, 'ice');
              spawnShockwave(player.x, player.y, '#93c5fd', 60);
            }
            player.vx = 0;
            player.vy = 0;
          } else {
            player.x = lerp(player.x, player.targetX, 0.32);
            player.y = lerp(player.y, player.targetY, 0.32);
            player.prevX = prevPlayerX;
            player.prevY = prevPlayerY;
            player.vx = (player.x - prevPlayerX) / Math.max(dt, 0.001);
            player.vy = (player.y - prevPlayerY) / Math.max(dt, 0.001);
          }
          if (player.hitFlash > 0) player.hitFlash = Math.max(0, player.hitFlash - dt * 4);

          // Update player power-up timers
          if (player.isMegaPaddle) {
            player.megaPaddleTimer -= dt;
            player.width = Math.round(w / 2); // Always half arena width
            if (player.megaPaddleTimer <= 0) {
              player.isMegaPaddle = false;
              const newW = (player.baseWidth + player.extensionLevel * 22) / (player.shrinkLevel > 0 ? 2 : 1);
              player.width = Math.round(newW);
              soundEngine.playSlowMoSound();
              spawnHitParticles(player.x, player.y, '#a855f7', 16, 1.3);
            }
          }
          if (player.isRocketPowered) {
            player.rocketTimer -= dt;
            if (player.rocketTimer <= 0) {
              player.isRocketPowered = false;
            }
          }
          if (player.isFiery) {
            player.fireTimer -= dt;
            if (player.fireTimer <= 0) {
              player.isFiery = false;
            }
          }

          // --- OPPONENT PADDLE 2D AI & POWER-UP TIMERS ---
          const opponent = opponentPaddleRef.current;
          const prevOppX = opponent.x;
          const prevOppY = opponent.y;
          const ball = ballRef.current;

          // Update opponent power-up timers
          if (opponent.isMegaPaddle) {
            opponent.megaPaddleTimer -= dt;
            opponent.width = Math.round(w / 2);
            if (opponent.megaPaddleTimer <= 0) {
              opponent.isMegaPaddle = false;
              const newW = (opponent.baseWidth + opponent.extensionLevel * 22) / (opponent.shrinkLevel > 0 ? 2 : 1);
              opponent.width = Math.round(newW);
              soundEngine.playSlowMoSound();
              spawnHitParticles(opponent.x, opponent.y, '#a855f7', 16, 1.3);
            }
          }
          if (opponent.isRocketPowered) {
            opponent.rocketTimer -= dt;
            if (opponent.rocketTimer <= 0) {
              opponent.isRocketPowered = false;
            }
          }
          if (opponent.isFiery) {
            opponent.fireTimer -= dt;
            if (opponent.fireTimer <= 0) {
              opponent.isFiery = false;
            }
          }

          // Check opponent ejection or freeze status
          if (opponent.isEjected) {
            opponent.targetX = -200;
            opponent.x = -200;
            opponent.vx = 0;
            opponent.vy = 0;
          } else if (opponent.isFrozen) {
            opponent.freezeTimer -= dt;
            if (opponent.freezeTimer <= 0) {
              opponent.isFrozen = false;
              soundEngine.playIceShatter();
              spawnHitParticles(opponent.x, opponent.y, '#93c5fd', 25, 2.0, 'ice');
              spawnShockwave(opponent.x, opponent.y, '#93c5fd', 60);
            }
            opponent.vx = 0;
            opponent.vy = 0;
          } else if (isMultiplayer && multiplayerRole === 'host') {
            // Multiplayer Host: guest paddle position is driven by guest player input
            opponent.x = lerp(opponent.x, opponent.targetX, 0.35);
            opponent.y = lerp(opponent.y, opponent.targetY, 0.35);
            opponent.prevX = prevOppX;
            opponent.prevY = prevOppY;
            opponent.vx = (opponent.x - prevOppX) / Math.max(dt, 0.001);
            opponent.vy = (opponent.y - prevOppY) / Math.max(dt, 0.001);
          } else {
            // Dynamic 2D AI behavior with forward/backward movement fully active
            let baseAi = 0.12;
            let aiStageRatio = 1.0;
            let maxAiCap = 0.35;

            if (difficulty === 'easiest') {
              baseAi = 0.085;
              aiStageRatio = 0.55;
              maxAiCap = 0.16;
            } else if (difficulty === 'easy') {
              baseAi = 0.105;
              aiStageRatio = 0.75;
              maxAiCap = 0.20;
            } else if (difficulty === 'casual') {
              baseAi = 0.125;
              aiStageRatio = 1.0;
              maxAiCap = 0.25;
            } else if (difficulty === 'pro') {
              baseAi = 0.18;
              aiStageRatio = 1.0;
              maxAiCap = 0.32;
            } else if (difficulty === 'chaos') {
              baseAi = 0.26;
              aiStageRatio = 1.15;
              maxAiCap = 0.42;
            }

            const rawAiSpeed = baseAi + ((stage?.aiSpeedBonus || 0) * aiStageRatio);
            const aiSpeedMultiplier = Math.min(rawAiSpeed, maxAiCap);

            // In case of split or multi balls, AI tracks the most immediate incoming threat
            let targetBall = ballsRef.current[0] || ball;
            let minDistanceToOpponent = Infinity;
            for (const b of ballsRef.current) {
              if (b.vy < 0 && b.y < minDistanceToOpponent) {
                minDistanceToOpponent = b.y;
                targetBall = b;
              }
            }

            // Check if there is a power-up in opponent's half to seek
            let targetPowerUp: PowerUpItem | null = null;
            let minPUDist = Infinity;
            for (const p of powerUpsRef.current) {
              if (!p.isHarmful && p.y < h * 0.52) {
                const dist = Math.hypot(p.x - opponent.x, p.y - opponent.y);
                if (dist < minPUDist && dist < 220) {
                  minPUDist = dist;
                  targetPowerUp = p;
                }
              }
            }

            // 2D Movement calculation (X and Y forward rush/retreat fully enabled)
            const oppHalfW = opponent.width / 2;
            const topBoundary = 25;
            const maxRushDepth = h * 0.44;

            if (targetBall.vy < 0) {
              // Ball heading towards opponent: line up X, rush forward to smash or intercept
              const variance = difficulty === 'easiest'
                ? Math.sin(currentTime * 0.002) * 10
                : difficulty === 'easy'
                ? Math.sin(currentTime * 0.0025) * 5
                : 0;
              const targetX = targetBall.x + variance;
              opponent.targetX = clamp(targetX, oppHalfW + 8, w - oppHalfW - 8);

              // RUSH FORWARD TO SMASH! Moves forward in 2D naturally across all difficulties
              if (targetBall.y < h * 0.40 && targetBall.y > 55) {
                opponent.targetY = clamp(targetBall.y - 12, topBoundary, maxRushDepth);
              } else {
                opponent.targetY = lerp(opponent.targetY, 40, 0.1);
              }
            } else if (targetPowerUp) {
              // Ball is going towards player: opponent moves forward in 2D to grab power-ups!
              opponent.targetX = clamp(targetPowerUp.x, oppHalfW + 8, w - oppHalfW - 8);
              opponent.targetY = clamp(targetPowerUp.y, topBoundary, maxRushDepth);
            } else {
              // Idle patrolling
              opponent.targetX = lerp(opponent.targetX, w / 2 + Math.cos(currentTime * 0.002) * 35, 0.08);
              opponent.targetY = lerp(opponent.targetY, 40, 0.08);
            }

            opponent.x = lerp(opponent.x, opponent.targetX, aiSpeedMultiplier);
            opponent.y = lerp(opponent.y, opponent.targetY, aiSpeedMultiplier * 0.88);
            opponent.prevX = prevOppX;
            opponent.prevY = prevOppY;
            opponent.vx = (opponent.x - prevOppX) / Math.max(dt, 0.001);
            opponent.vy = (opponent.y - prevOppY) / Math.max(dt, 0.001);
          }
          if (opponent.hitFlash > 0) opponent.hitFlash = Math.max(0, opponent.hitFlash - dt * 4);

          // --- DUAL ICE WALLS UPDATE (Player & Opponent) ---
          const pIceWall = playerIceWallRef.current;
          if (pIceWall.active) {
            pIceWall.remainingTime -= dt;
            pIceWall.y = h - 14;
            if (pIceWall.hitFlash > 0) pIceWall.hitFlash = Math.max(0, pIceWall.hitFlash - dt * 4);
            if (pIceWall.remainingTime <= 0) {
              pIceWall.active = false;
              soundEngine.playIceShatter();
              spawnHitParticles(w / 2, h - 14, '#93c5fd', 30, 2.0, 'ice');
              spawnShockwave(w / 2, h - 14, '#93c5fd', 80);
            }
          }

          const oIceWall = opponentIceWallRef.current;
          if (oIceWall.active) {
            oIceWall.remainingTime -= dt;
            oIceWall.y = 14;
            if (oIceWall.hitFlash > 0) oIceWall.hitFlash = Math.max(0, oIceWall.hitFlash - dt * 4);
            if (oIceWall.remainingTime <= 0) {
              oIceWall.active = false;
              soundEngine.playIceShatter();
              spawnHitParticles(w / 2, 14, '#93c5fd', 30, 2.0, 'ice');
              spawnShockwave(w / 2, 14, '#93c5fd', 80);
            }
          }

          // --- DUAL AUTONOMOUS GOALIE PADDLES AI & UPDATE ---
          // 1) Player Goalie (Bottom)
          const pGoalie = playerGoaliePaddleRef.current;
          if (pGoalie) {
            pGoalie.remainingTime -= dt;
            pGoalie.y = h - 28;

            if (pGoalie.remainingTime <= 2) {
              pGoalie.dissolving = true;
              pGoalie.alpha = Math.max(0, pGoalie.remainingTime / 2);
            }

            if (pGoalie.remainingTime <= 0) {
              soundEngine.playIceShatter();
              spawnHitParticles(pGoalie.x, pGoalie.y, '#06b6d4', 20, 1.5);
              playerGoaliePaddleRef.current = null;
            } else {
              let threatBall = ballsRef.current[0] || ballRef.current;
              let maxY = -Infinity;
              for (const b of ballsRef.current) {
                if (b.vy > 0 && b.y > maxY) {
                  maxY = b.y;
                  threatBall = b;
                }
              }

              if (threatBall && threatBall.vy > 0) {
                pGoalie.targetX = threatBall.x;
              } else {
                pGoalie.targetX = w / 2;
              }

              const halfGW = pGoalie.width / 2;
              pGoalie.targetX = clamp(pGoalie.targetX, halfGW + 8, w - halfGW - 8);
              const prevGx = pGoalie.x;
              pGoalie.x = lerp(pGoalie.x, pGoalie.targetX, 0.42);
              pGoalie.vx = (pGoalie.x - prevGx) / Math.max(dt, 0.001);
            }
          }

          // 2) Opponent Goalie (Top)
          const oGoalie = opponentGoaliePaddleRef.current;
          if (oGoalie) {
            oGoalie.remainingTime -= dt;
            oGoalie.y = 28;

            if (oGoalie.remainingTime <= 2) {
              oGoalie.dissolving = true;
              oGoalie.alpha = Math.max(0, oGoalie.remainingTime / 2);
            }

            if (oGoalie.remainingTime <= 0) {
              soundEngine.playIceShatter();
              spawnHitParticles(oGoalie.x, oGoalie.y, '#f43f5e', 20, 1.5);
              opponentGoaliePaddleRef.current = null;
            } else {
              let threatBall = ballsRef.current[0] || ballRef.current;
              let minY = Infinity;
              for (const b of ballsRef.current) {
                if (b.vy < 0 && b.y < minY) {
                  minY = b.y;
                  threatBall = b;
                }
              }

              if (threatBall && threatBall.vy < 0) {
                oGoalie.targetX = threatBall.x;
              } else {
                oGoalie.targetX = w / 2;
              }

              const halfGW = oGoalie.width / 2;
              oGoalie.targetX = clamp(oGoalie.targetX, halfGW + 8, w - halfGW - 8);
              const prevGx = oGoalie.x;
              const oppGoalieLerp = difficulty === 'easiest' ? 0.12 : difficulty === 'easy' ? 0.16 : difficulty === 'casual' ? 0.22 : difficulty === 'pro' ? 0.30 : 0.38;
              oGoalie.x = lerp(oGoalie.x, oGoalie.targetX, oppGoalieLerp);
              oGoalie.vx = (oGoalie.x - prevGx) / Math.max(dt, 0.001);
            }
          }

          // --- BALL SLOW-MO TIMER ---
          if (ball.isSlowMo) {
            slowMoTimerRef.current -= dt;
            if (slowMoTimerRef.current <= 0) {
              ball.isSlowMo = false;
              const curSpeed = Math.hypot(ball.vx, ball.vy);
              if (curSpeed > 0) {
                ball.speed = ball.baseSpeed;
                ball.vx = (ball.vx / curSpeed) * ball.speed;
                ball.vy = (ball.vy / curSpeed) * ball.speed;
              }
            }
          }

          // --- MULTI PADDLES UPDATE ---
          for (let i = multiPaddlesRef.current.length - 1; i >= 0; i--) {
            const mp = multiPaddlesRef.current[i];
            mp.remainingTime -= dt;

            if (mp.remainingTime <= 2) {
              mp.dissolving = true;
              mp.alpha = Math.max(0, mp.remainingTime / 2);
            }

            if (mp.remainingTime <= 0) {
              spawnHitParticles(player.x, player.y + mp.yOffset, '#38bdf8', 18, 1.4);
              spawnShockwave(player.x, player.y + mp.yOffset, '#38bdf8', 50);
              multiPaddlesRef.current.splice(i, 1);
              continue;
            }
          }

          // --- POWER-UP SPAWNING FROM RIGHT-CENTER ---
          powerUpTimerRef.current -= dt;
          if (powerUpTimerRef.current <= 0 && powerUpsRef.current.length < 2) {
            scheduleNextPowerUp();

            const pool: PowerUpType[] = [
              'extend_paddle',
              'shrink_paddle',
              'mega_paddle',
              'ice_wall',
              'rocket',
              'multi_paddle',
              'freeze_sensor',
              'freeze_opponent',
              'slow_ball',
              'fireball',
              'split_ball',
              'multi_ball',
            ];

            const available = pool.filter((type) => {
              if (type === 'extend_paddle' && player.extensionLevel >= 3 && opponent.extensionLevel >= 3) return false;
              if (type === 'shrink_paddle' && player.shrinkLevel >= 1 && opponent.shrinkLevel >= 1) return false;
              if (type === 'mega_paddle' && player.isMegaPaddle && opponent.isMegaPaddle) return false;
              if (type === 'ice_wall' && pIceWall.active && oIceWall.active) return false;
              if (type === 'multi_paddle' && pGoalie !== null && oGoalie !== null) return false;
              if ((type === 'split_ball' || type === 'multi_ball') && ballsRef.current.length > 1) return false;
              return true;
            });

            const selectedType = available[Math.floor(Math.random() * available.length)];
            const isHarmful = selectedType === 'shrink_paddle';

            const config: Record<PowerUpType, { name: string; symbol: string }> = {
              extend_paddle: { name: 'Çubuk Uzatma', symbol: '📏' },
              shrink_paddle: { name: 'Çubuk Küçültme', symbol: '✂️' },
              mega_paddle: { name: 'En Uzun Çubuk', symbol: '👑' },
              ice_wall: { name: 'Buz Duvarı', symbol: '🧊' },
              rocket: { name: 'Roket Gücü', symbol: '🚀' },
              multi_paddle: { name: 'Otonom Kaleci', symbol: '🧤' },
              freeze_sensor: { name: 'Çember Dondurma', symbol: '❄️' },
              freeze_opponent: { name: 'Dondurucu Buz', symbol: '🥶' },
              slow_ball: { name: 'Top Yavaşlatma', symbol: '⏳' },
              fireball: { name: 'Ateş Topu', symbol: '☄️' },
              split_ball: { name: 'Bölünen Top', symbol: '🏐' },
              multi_ball: { name: '3 Top Çoğalması', symbol: '🎱' },
            };

            const spawnY = h * 0.5 + (Math.random() * 100 - 50);
            powerUpsRef.current.push({
              id: Math.random().toString(),
              type: selectedType,
              isHarmful,
              x: w + 16,
              y: spawnY,
              vx: -(48 + Math.random() * 26),
              vy: (Math.random() - 0.5) * 16,
              radius: 15.5,
              phase: Math.random() * Math.PI * 2,
              name: config[selectedType].name,
              symbol: config[selectedType].symbol,
            });

            launcherFlashRef.current = 1.0;
            const flashCol = isHarmful ? '#ef4444' : '#10b981';
            spawnHitParticles(w - 12, spawnY, flashCol, 14, 1.3, 'spark');
            spawnShockwave(w - 12, spawnY, flashCol, 40);
            soundEngine.playPowerUpSpawn();
          }

          // --- POWER-UP PHYSICS & SYMMETRICAL PICKUP DETECTION ---
          // "düzeltme, oyundaki güçleri rakip oyuncu da alabilmeli, rakip oyuncu alırsa, kötü özellikler benim oyuncumu etkilemeli,
          // mesela, dondurucu aldıysa yani top ondan geldiyse ya da çubuk gidip gücü aldıysa benim oyuncum donmalı,
          // aynı zamanda, ateş özelliği çubuk uzatma, küçültme gibi özellikler de eğer rakip oyuncu tarafından alındıysa onu etkilemeli,
          // bunun için topun en son kimden geldiğine bakılabilir veya çubuk ileri doğru gidip alabilmeli."
          for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            const p = powerUpsRef.current[i];
            p.phase += dt * 3.5;
            p.x += p.vx * dt;
            p.y += p.vy * dt + Math.sin(p.phase) * 0.8;

            if (Math.random() < 0.28) {
              particlesRef.current.push({
                x: p.x + (p.vx < 0 ? 10 : -10),
                y: p.y + (Math.random() * 6 - 3),
                vx: (p.vx < 0 ? 1 : -1) * (14 + Math.random() * 14),
                vy: (Math.random() - 0.5) * 12,
                radius: 1.5 + Math.random() * 1.5,
                color: p.isHarmful ? '#f87171' : '#34d399',
                alpha: 0.85,
                decay: 2.4,
                shape: 'spark',
              });
            }

            // Left wall soft bounce
            if (p.x - p.radius < 12 && p.vx < 0) {
              p.x = 12 + p.radius;
              p.vx = Math.abs(p.vx) * 0.82;
              p.hasBounced = true;
              spawnHitParticles(p.x, p.y, p.isHarmful ? '#ef4444' : '#10b981', 8, 0.9, 'spark');
            } else if (p.x > w + 45 && p.hasBounced) {
              powerUpsRef.current.splice(i, 1);
              continue;
            } else if (p.x < -45 && !p.hasBounced) {
              powerUpsRef.current.splice(i, 1);
              continue;
            }

            if (p.y < 20 || p.y > h - 20) {
              p.vy = -p.vy;
            }

            let collectedBy: 'player' | 'opponent' | null = null;

            // 1. Check collision with active balls (Collector is ball.lastHitter)
            for (const b of ballsRef.current) {
              if (checkCircleCollision(b, p)) {
                collectedBy = b.lastHitter === 'opponent' ? 'opponent' : 'player';
                break;
              }
            }

            // 2. Check collision with Player Paddle
            if (!collectedBy && checkPaddleCircleCollision(player, p)) {
              collectedBy = 'player';
            }

            // 3. Check collision with Player Multi Paddles
            if (!collectedBy) {
              for (const mp of multiPaddlesRef.current) {
                const vp: Paddle = { ...player, y: player.y + mp.yOffset };
                if (checkPaddleCircleCollision(vp, p)) {
                  collectedBy = 'player';
                  break;
                }
              }
            }

            // 4. Check collision with Player Goalie
            if (!collectedBy && pGoalie) {
              const gp: Paddle = { ...player, x: pGoalie.x, y: pGoalie.y, width: pGoalie.width, height: pGoalie.height };
              if (checkPaddleCircleCollision(gp, p)) {
                collectedBy = 'player';
              }
            }

            // 5. Check collision with Opponent Paddle
            if (!collectedBy && checkPaddleCircleCollision(opponent, p)) {
              collectedBy = 'opponent';
            }

            // 6. Check collision with Opponent Goalie
            if (!collectedBy && oGoalie) {
              const ogp: Paddle = { ...opponent, x: oGoalie.x, y: oGoalie.y, width: oGoalie.width, height: oGoalie.height };
              if (checkPaddleCircleCollision(ogp, p)) {
                collectedBy = 'opponent';
              }
            }

            if (collectedBy) {
              applyPowerUp(p, collectedBy);
              soundEngine.playPowerUpCollect(p.isHarmful);

              const burstColor = collectedBy === 'player' ? (p.isHarmful ? '#ef4444' : '#10b981') : (p.isHarmful ? '#10b981' : '#f43f5e');
              spawnHitParticles(p.x, p.y, burstColor, 22, 1.7);
              spawnShockwave(p.x, p.y, burstColor, 65);

              powerUpsRef.current.splice(i, 1);
            }
          }

          // --- BALL TRAIL & VELOCITY UPDATE FOR ALL ACTIVE BALLS ---
          // Sub-step physics (2 substeps) to eliminate high-speed tunneling
          const subSteps = 2;
          const subDt = dt / subSteps;
          let roundEndedThisFrame = false;

          for (let step = 0; step < subSteps; step++) {
            if (roundEndedThisFrame) break;

            for (let bIdx = 0; bIdx < ballsRef.current.length; bIdx++) {
              const currentBall = ballsRef.current[bIdx];
              currentBall.x += currentBall.vx * subDt;
              currentBall.y += currentBall.vy * subDt;

              // Wall collisions (Left & Right boundaries)
              if (currentBall.x - currentBall.radius < 8) {
                currentBall.x = 8 + currentBall.radius;
                currentBall.vx = Math.abs(currentBall.vx);
                soundEngine.playWallBounce();
                spawnHitParticles(currentBall.x, currentBall.y, '#94a3b8', 5, 0.7);
              } else if (currentBall.x + currentBall.radius > w - 8) {
                currentBall.x = w - 8 - currentBall.radius;
                currentBall.vx = -Math.abs(currentBall.vx);
                soundEngine.playWallBounce();
                spawnHitParticles(currentBall.x, currentBall.y, '#94a3b8', 5, 0.7);
              }

              // Fireball scorches Çember Sensors
              if (currentBall.isFireball) {
                sensorsRef.current.forEach((sensor) => {
                  const distToSensor = Math.hypot(currentBall.x - sensor.x, currentBall.y - sensor.y);
                  if (distToSensor < currentBall.radius + sensor.radius + 6) {
                    if (!sensor.isScorched) {
                      sensor.isScorched = true;
                      sensor.scorchTimer = 5;
                      spawnHitParticles(sensor.x, sensor.y, '#f97316', 22, 2.0, 'flame');
                      spawnHitParticles(sensor.x, sensor.y, '#475569', 14, 1.2, 'smoke');
                      soundEngine.playFireballSound();
                    }
                  }
                });
              }

              // ÇEMBER SENSORS COLLISION (Deflection for each active sensor)
              sensorsRef.current.forEach((sensor) => {
                const sensorHit = checkBallSensorCollision(currentBall, sensor);
                if (sensorHit.collided) {
                  sensor.hitFlash = 1.0;
                  sensor.deflectionCount++;
                  state.sensorHitsCount++;
                  state.screenShake = 8;

                  soundEngine.playSensorHit();
                  spawnHitParticles(currentBall.x, currentBall.y, '#f59e0b', 22, 1.8);
                  spawnShockwave(sensor.x, sensor.y, '#f59e0b', 90);

                  if (currentBall.lastHitter === 'player') {
                    state.comboCount++;
                    state.maxCombo = Math.max(state.maxCombo, state.comboCount);
                    onComboChange(state.comboCount);
                    soundEngine.playCombo(state.comboCount);
                  }
                }
              });

              // PLAYER PADDLE COLLISION (Supports forward-rush smash & Card Penalty Detection)
              if (!player.isEjected) {
                const playerHit = checkBallPaddleCollision(currentBall, player);
                if (playerHit.collided) {
                  player.hitFlash = 1.0;
                  state.rallyCount++;
                  state.totalVolleysCount++;
                  onRallyChange(state.rallyCount);

                  state.comboCount++;
                  state.maxCombo = Math.max(state.maxCombo, state.comboCount);
                  onComboChange(state.comboCount);

                  const isHardStrike = playerHit.isSmash || player.isRocketPowered || player.vy < -60 || currentBall.speed >= 620;

                  if (player.isRocketPowered) {
                    soundEngine.playRocketBoost();
                    spawnHitParticles(currentBall.x, currentBall.y, '#06b6d4', 28, 2.4, 'flame');
                    spawnShockwave(player.x, player.y, '#06b6d4', 75);
                    state.screenShake = 10;
                  } else if (playerHit.isSmash) {
                    soundEngine.playSmashHit();
                    spawnHitParticles(currentBall.x, currentBall.y, '#38bdf8', 24, 2.2);
                    spawnShockwave(player.x, player.y, '#38bdf8', 70);
                    state.screenShake = 8;
                  } else {
                    soundEngine.playPaddleHit(true, state.comboCount);
                    soundEngine.playCombo(state.comboCount);
                    spawnHitParticles(currentBall.x, currentBall.y, '#22d3ee', 12, 1.2);
                    spawnShockwave(player.x, player.y, '#22d3ee', 45);
                    state.screenShake = 4;
                  }

                  // Card penalty rules: ONLY active in Tournament Mode
                  // 2 consecutive hard strikes within 3 seconds -> Yellow Card! 2 Yellow Cards -> Red Card & Ejection.
                  if (isTournamentMode && isHardStrike) {
                    const nowSec = currentTime;
                    const prevTime = player.lastHardStrikeTime || 0;

                    if (prevTime > 0 && (nowSec - prevTime) <= 3.0) {
                      player.yellowCards = (player.yellowCards || 0) + 1;
                      player.lastHardStrikeTime = 0;

                      if (player.yellowCards === 1) {
                        soundEngine.playWhistle(false);
                        triggerToast('🟨 SARI KART!', '3 Saniye İçinde 2 Kez Sert Vurdun!', '#facc15', '🟨');
                        emitCardState();
                      } else if (player.yellowCards >= 2) {
                        player.isEjected = true;
                        soundEngine.playWhistle(true);
                        triggerToast('🟥 KIRMIZI KART & İHRAÇ!', '2. Sarı Kart! Oyundan Atıldın! Kale Bir Sonraki Gole Kadar Boş!', '#ef4444', '🟥');
                        emitCardState();
                      }
                    } else {
                      player.lastHardStrikeTime = nowSec;
                    }
                  }
                }
              }

              // PLAYER GOALIE PADDLE COLLISION (Bottom)
              const pGoalie = playerGoaliePaddleRef.current;
              if (pGoalie) {
                const goalieAsPaddle: Paddle = {
                  ...player,
                  x: pGoalie.x,
                  y: pGoalie.y,
                  prevX: pGoalie.x - pGoalie.vx * subDt,
                  prevY: pGoalie.y,
                  width: pGoalie.width,
                  height: pGoalie.height,
                  vx: pGoalie.vx,
                  vy: 0,
                };
                const goalieHit = checkBallPaddleCollision(currentBall, goalieAsPaddle);
                if (goalieHit.collided) {
                  state.rallyCount++;
                  state.totalVolleysCount++;
                  onRallyChange(state.rallyCount);
                  soundEngine.playGoalieSave();
                  spawnHitParticles(currentBall.x, currentBall.y, '#38bdf8', 18, 1.6);
                  spawnShockwave(pGoalie.x, pGoalie.y, '#06b6d4', 55);
                }
              }

              // OPPONENT GOALIE PADDLE COLLISION (Top)
              const oGoalie = opponentGoaliePaddleRef.current;
              if (oGoalie) {
                const oGoalieAsPaddle: Paddle = {
                  ...opponent,
                  x: oGoalie.x,
                  y: oGoalie.y,
                  prevX: oGoalie.x - oGoalie.vx * subDt,
                  prevY: oGoalie.y,
                  width: oGoalie.width,
                  height: oGoalie.height,
                  vx: oGoalie.vx,
                  vy: 0,
                };
                const oGoalieHit = checkBallPaddleCollision(currentBall, oGoalieAsPaddle);
                if (oGoalieHit.collided) {
                  state.rallyCount++;
                  state.totalVolleysCount++;
                  onRallyChange(state.rallyCount);
                  soundEngine.playGoalieSave();
                  spawnHitParticles(currentBall.x, currentBall.y, '#f43f5e', 18, 1.6);
                  spawnShockwave(oGoalie.x, oGoalie.y, '#f43f5e', 55);
                }
              }

              // MULTI PADDLES COLLISION WITH ANY BALL
              for (const mp of multiPaddlesRef.current) {
                const virtualPaddle: Paddle = { ...player, y: player.y + mp.yOffset };
                const mpHit = checkBallPaddleCollision(currentBall, virtualPaddle);
                if (mpHit.collided) {
                  player.hitFlash = 1.0;
                  state.rallyCount++;
                  state.totalVolleysCount++;
                  onRallyChange(state.rallyCount);
                  soundEngine.playPaddleHit(true, state.comboCount);
                  spawnHitParticles(currentBall.x, currentBall.y, '#38bdf8', 14, 1.4);
                  spawnShockwave(player.x, player.y + mp.yOffset, '#38bdf8', 50);
                }
              }

              // OPPONENT PADDLE COLLISION (Supports smash, rocket & Card Penalty Detection)
              if (!opponent.isEjected) {
                const oppHit = checkBallPaddleCollision(currentBall, opponent, difficulty);
                if (oppHit.collided) {
                  opponent.hitFlash = 1.0;
                  state.rallyCount++;
                  state.totalVolleysCount++;
                  onRallyChange(state.rallyCount);

                  const isOppHardStrike = oppHit.isSmash || opponent.isRocketPowered || opponent.vy > 60 || currentBall.speed >= 620;

                  if (opponent.isRocketPowered) {
                    soundEngine.playRocketBoost();
                    spawnHitParticles(currentBall.x, currentBall.y, '#f43f5e', 28, 2.4, 'flame');
                    spawnShockwave(opponent.x, opponent.y, '#f43f5e', 75);
                    state.screenShake = 10;
                  } else if (oppHit.isSmash) {
                    soundEngine.playSmashHit();
                    spawnHitParticles(currentBall.x, currentBall.y, '#f43f5e', 24, 2.2);
                    spawnShockwave(opponent.x, opponent.y, '#f43f5e', 70);
                    state.screenShake = 8;
                  } else {
                    soundEngine.playPaddleHit(false, 0);
                    spawnHitParticles(currentBall.x, currentBall.y, '#f43f5e', 12, 1.2);
                    spawnShockwave(opponent.x, opponent.y, '#f43f5e', 45);
                    state.screenShake = 4;
                  }

                  if (isTournamentMode && isOppHardStrike) {
                    const nowSec = currentTime;
                    const prevTime = opponent.lastHardStrikeTime || 0;

                    if (prevTime > 0 && (nowSec - prevTime) <= 3.0) {
                      opponent.yellowCards = (opponent.yellowCards || 0) + 1;
                      opponent.lastHardStrikeTime = 0;

                      if (opponent.yellowCards === 1) {
                        soundEngine.playWhistle(false);
                        triggerToast('🟨 SARI KART (RAKİP)!', 'Rakip 3 Saniye İçinde 2 Kez Sert Vurdu!', '#facc15', '🟨');
                        emitCardState();
                      } else if (opponent.yellowCards >= 2) {
                        opponent.isEjected = true;
                        soundEngine.playWhistle(true);
                        triggerToast('🟥 KIRMIZI KART (RAKİP)!', 'Rakip 2. Sarı Kartı Gördü ve Atıldı!', '#ef4444', '🟥');
                        emitCardState();
                      }
                    } else {
                      opponent.lastHardStrikeTime = nowSec;
                    }
                  }
                }
              }

              // PLAYER ICE WALL (GOAL CLOSURE AT BOTTOM)
              const pIceWall = playerIceWallRef.current;
              if (pIceWall.active && currentBall.y + currentBall.radius >= pIceWall.y && currentBall.vy > 0) {
                currentBall.y = pIceWall.y - currentBall.radius;
                currentBall.vy = -Math.abs(currentBall.vy) * 1.06;
                currentBall.vx += (Math.random() - 0.5) * 40;
                currentBall.lastHitter = 'player';
                pIceWall.hitFlash = 1.0;
                state.screenShake = 6;
                soundEngine.playIceWallHit();
                spawnHitParticles(currentBall.x, pIceWall.y, '#93c5fd', 20, 1.8, 'ice');
                spawnShockwave(currentBall.x, pIceWall.y, '#38bdf8', 60);
              }

              // OPPONENT ICE WALL (GOAL CLOSURE AT TOP)
              const oIceWall = opponentIceWallRef.current;
              if (oIceWall.active && currentBall.y - currentBall.radius <= oIceWall.y + oIceWall.height && currentBall.vy < 0) {
                currentBall.y = oIceWall.y + oIceWall.height + currentBall.radius;
                currentBall.vy = Math.abs(currentBall.vy) * 1.06;
                currentBall.vx += (Math.random() - 0.5) * 40;
                currentBall.lastHitter = 'opponent';
                oIceWall.hitFlash = 1.0;
                state.screenShake = 6;
                soundEngine.playIceWallHit();
                spawnHitParticles(currentBall.x, oIceWall.y + oIceWall.height, '#93c5fd', 20, 1.8, 'ice');
                spawnShockwave(currentBall.x, oIceWall.y + oIceWall.height, '#f43f5e', 60);
              }

              // GOAL CHECKING WITH 2-POINT ÇEMBER SENSOR MECHANIC & OWN-GOAL ADJUSTMENT
              // 1) Opponent Goal (Player scores!)
              if (currentBall.y < -15) {
                roundEndedThisFrame = true;

                // Immediately terminate all active power-ups, buffs, debuffs, fireball, and multi-paddles upon goal!
                resetAllActivePowersOnGoal();

                // If opponent was frozen in ice when goal occurred, freeze breaks immediately with shatter effect
                if (opponent.isFrozen) {
                  opponent.isFrozen = false;
                  opponent.freezeTimer = 0;
                  soundEngine.playIceShatter();
                  spawnHitParticles(opponent.x, opponent.y, '#93c5fd', 25, 2.0, 'ice');
                }

                // Own goal vs Sensor score:
                // "Eğer top oyuncudan çembere gidip kendi kalesine girerse, bu +2 puan değil +1 puan sayılsın,
                // aynı zamanda top rakipten çembere gidip yine rakibin kalesine girerse burdada +2 puan değli 1 puan olsun."
                let points = 1;
                let isSensorDouble = false;
                let bannerText = 'GOL! +1 PUAN';

                if (currentBall.deflectedBySensor) {
                  if (currentBall.lastHitter === 'opponent') {
                    // Rakip çembere çarptırıp kendi kalesine attı -> +1 puan
                    points = 1;
                    bannerText = 'RAKİP KENDİ KALESİNE! +1';
                  } else {
                    // Oyuncu çemberden sektirip gol attı -> +2 puan!
                    points = 2;
                    isSensorDouble = true;
                    bannerText = 'ÇEMBER GOLÜ! +2 PUAN!';
                  }
                }

                const newScore: GameScore = {
                  ...state.currentScore,
                  player: state.currentScore.player + points,
                };

                // Check overtime extension:
                // "Oyunda eğer 4-4 eşitlik varsa oyunun bitme skoru otomatik olarak +1 uzasın, eğer eşitlik 5-5 olursa yine bitme skoru +1 uzasın, bu skorlardan sonra 2 farklı kazanç olana kadar oyunlar uzasın."
                const p = newScore.player;
                const o = newScore.opponent;
                let target = Math.max(state.baseTargetScore, state.currentScore.targetScore);

                if (p >= 4 && o >= 4) {
                  if (p === o) {
                    target = p + 2; // e.g. 4-4 -> 6 (+1), 5-5 -> 7 (+1)
                    triggerToast('🔥 UZATMA!', `${p}-${o} Eşitlik! Hedef ${target}'e uzadı!`, '#f59e0b', '🔥');
                  } else {
                    target = Math.max(target, Math.max(p, o) + (Math.abs(p - o) >= 2 ? 0 : 1));
                  }
                } else {
                  target = Math.max(state.baseTargetScore, Math.max(p, o));
                }
                newScore.targetScore = target;
                state.currentScore = newScore;

                state.isRoundResetting = true;
                state.resetTimer = 1.1;
                state.roundBanner = bannerText;
                state.screenShake = isSensorDouble ? 14 : 10;
                state.rallyCount = 0;
                onRallyChange(0);

                if (isSensorDouble) {
                  soundEngine.playDoubleScore(true);
                  spawnHitParticles(w / 2, 20, '#f59e0b', 45, 2.5);
                  spawnHitParticles(w / 2, 20, '#38bdf8', 30, 2.2);
                  spawnShockwave(w / 2, 20, '#f59e0b', 140);
                } else {
                  soundEngine.playScore(true);
                  spawnHitParticles(w / 2, 20, '#22d3ee', 35, 2.2);
                  spawnShockwave(w / 2, 20, '#22d3ee', 120);
                }

                onScoreUpdate(newScore, 'player');

                const inOvertime = p >= 4 && o >= 4;
                const isPlayerWin = p >= target && (!inOvertime || p - o >= 2);

                if (isPlayerWin) {
                  // Game Over - Victory!
                  state.isRunning = false;
                  const matchDurationSec = (Date.now() - state.matchStartTime) / 1000;
                  soundEngine.playWin();
                  onGameOver('player', {
                    maxCombo: state.maxCombo,
                    totalVolleys: state.totalVolleysCount,
                    sensorHits: state.sensorHitsCount,
                    matchDurationSec,
                    winner: 'player',
                    powerUpsCollected: state.powerUpsCollectedCount,
                  }, newScore);
                } else {
                  updateSensorDifficulty();
                }
                break;
              }

              // 2) Player Goal (Opponent scores!)
              if (currentBall.y > h + 15) {
                roundEndedThisFrame = true;

                // Immediately terminate all active power-ups, buffs, debuffs, fireball, and multi-paddles upon goal!
                resetAllActivePowersOnGoal();

                // Own goal vs Sensor score:
                // "Eğer top oyuncudan çembere gidip kendi kalesine girerse, bu +2 puan değil +1 puan sayılsın"
                let oppPoints = 1;
                let isSensorDouble = false;
                let bannerText = 'RAKİP GOLÜ! +1';

                if (currentBall.deflectedBySensor) {
                  if (currentBall.lastHitter === 'player') {
                    // Oyuncu çembere çarptırıp kendi kalesine attı -> Sadece +1 puan!
                    oppPoints = 1;
                    bannerText = 'KENDİ KALENE GOL! +1';
                  } else {
                    // Rakip çemberden sektirip gol attı -> +2 puan
                    oppPoints = 2;
                    isSensorDouble = true;
                    bannerText = 'RAKİP ÇEMBER GOLÜ! +2 PUAN';
                  }
                }

                const newScore: GameScore = {
                  ...state.currentScore,
                  opponent: state.currentScore.opponent + oppPoints,
                };

                const p = newScore.player;
                const o = newScore.opponent;
                let target = Math.max(state.baseTargetScore, state.currentScore.targetScore);

                if (p >= 4 && o >= 4) {
                  if (p === o) {
                    target = o + 2; // e.g. 4-4 -> 6, 5-5 -> 7
                    triggerToast('🔥 UZATMA!', `${p}-${o} Eşitlik! Hedef ${target}'e uzadı!`, '#f59e0b', '🔥');
                  } else {
                    target = Math.max(target, Math.max(p, o) + (Math.abs(p - o) >= 2 ? 0 : 1));
                  }
                } else {
                  target = Math.max(state.baseTargetScore, Math.max(p, o));
                }
                newScore.targetScore = target;
                state.currentScore = newScore;

                state.isRoundResetting = true;
                state.resetTimer = 1.1;
                state.roundBanner = bannerText;
                state.screenShake = isSensorDouble ? 14 : 10;
                state.comboCount = 0;
                state.rallyCount = 0;
                onComboChange(0);
                onRallyChange(0);

                if (isSensorDouble) {
                  soundEngine.playDoubleScore(false);
                  spawnHitParticles(w / 2, h - 20, '#f59e0b', 40, 2.4);
                  spawnShockwave(w / 2, h - 20, '#f59e0b', 130);
                } else {
                  soundEngine.playScore(false);
                  spawnHitParticles(w / 2, h - 20, '#f43f5e', 35, 2.2);
                  spawnShockwave(w / 2, h - 20, '#f43f5e', 120);
                }

                onScoreUpdate(newScore, 'opponent');

                const inOvertime = p >= 4 && o >= 4;
                const isOpponentWin = o >= target && (!inOvertime || o - p >= 2);

                if (isOpponentWin) {
                  // Game Over - Defeat!
                  state.isRunning = false;
                  const matchDurationSec = (Date.now() - state.matchStartTime) / 1000;
                  soundEngine.playLose();
                  onGameOver('opponent', {
                    maxCombo: state.maxCombo,
                    totalVolleys: state.totalVolleysCount,
                    sensorHits: state.sensorHitsCount,
                    matchDurationSec,
                    winner: 'opponent',
                    powerUpsCollected: state.powerUpsCollectedCount,
                  }, newScore);
                } else {
                  updateSensorDifficulty();
                }
                break;
              }
            }
          }

          // Update ball trail buffer for all active balls
          for (const b of ballsRef.current) {
            const trailColor = b.isFireball
              ? '249, 115, 22'
              : b.isSlowMo
              ? '168, 85, 247'
              : b.lastHitter === 'player'
              ? '34, 211, 238'
              : b.lastHitter === 'opponent'
              ? '251, 113, 133'
              : '245, 158, 11';

            b.trail.unshift({ x: b.x, y: b.y, alpha: 0.85, radius: b.radius, color: trailColor });
            if (b.trail.length > 10) b.trail.pop();
            b.trail.forEach((t) => {
              t.alpha *= 0.82;
              t.radius *= 0.92;
            });
          }

          // Sync active power-ups to HUD periodically
          if (onActivePowerUpsChange) {
            const activeList: ActivePowerUpStatus[] = [];
            if (player.isMegaPaddle) {
              activeList.push({
                id: 'mega',
                type: 'mega_paddle',
                name: 'En Uzun Çubuk',
                isHarmful: false,
                remainingTime: Math.ceil(player.megaPaddleTimer),
                totalTime: 16,
              });
            }
            if (playerIceWallRef.current.active) {
              activeList.push({
                id: 'icewall',
                type: 'ice_wall',
                name: 'Buz Duvarı (Bizim)',
                isHarmful: false,
                remainingTime: Math.ceil(playerIceWallRef.current.remainingTime),
                totalTime: 15,
              });
            }
            if (opponentIceWallRef.current.active) {
              activeList.push({
                id: 'opp_icewall',
                type: 'ice_wall',
                name: 'Buz Duvarı (Rakip)',
                isHarmful: true,
                remainingTime: Math.ceil(opponentIceWallRef.current.remainingTime),
                totalTime: 15,
              });
            }
            if (playerGoaliePaddleRef.current) {
              activeList.push({
                id: 'goalie',
                type: 'multi_paddle',
                name: 'Otonom Kaleci',
                isHarmful: false,
                remainingTime: Math.ceil(playerGoaliePaddleRef.current.remainingTime),
                totalTime: 20,
              });
            }
            if (opponentGoaliePaddleRef.current) {
              activeList.push({
                id: 'opp_goalie',
                type: 'multi_paddle',
                name: 'Rakip Kaleci',
                isHarmful: true,
                remainingTime: Math.ceil(opponentGoaliePaddleRef.current.remainingTime),
                totalTime: 20,
              });
            }
            if (player.extensionLevel > 0 && !player.isMegaPaddle) {
              activeList.push({
                id: 'ext',
                type: 'extend_paddle',
                name: `Çubuk +${player.extensionLevel}`,
                isHarmful: false,
                count: player.extensionLevel,
              });
            }
            if (player.shrinkLevel > 0 && !player.isMegaPaddle) {
              activeList.push({
                id: 'shrink',
                type: 'shrink_paddle',
                name: 'Küçük Çubuk',
                isHarmful: true,
              });
            }
            if (player.isRocketPowered) {
              activeList.push({
                id: 'rocket',
                type: 'rocket',
                name: 'Roket',
                isHarmful: false,
                remainingTime: Math.ceil(player.rocketTimer),
                totalTime: 16,
              });
            }
            if (multiPaddlesRef.current.length > 0) {
              const maxT = Math.max(...multiPaddlesRef.current.map((m) => m.remainingTime));
              activeList.push({
                id: 'multi',
                type: 'multi_paddle',
                name: `Multi Çubuk x${multiPaddlesRef.current.length}`,
                isHarmful: false,
                remainingTime: Math.ceil(maxT),
                totalTime: 20,
                count: multiPaddlesRef.current.length,
              });
            }
            const anySensorFrozen = sensorsRef.current.some((s) => s.isFrozen);
            if (anySensorFrozen) {
              const maxFrz = Math.max(...sensorsRef.current.map((s) => s.freezeTimer));
              activeList.push({
                id: 'sensor_ice',
                type: 'freeze_sensor',
                name: 'Çember Donuk',
                isHarmful: false,
                remainingTime: Math.ceil(maxFrz),
                totalTime: 15,
              });
            }
            if (player.isFrozen) {
              activeList.push({
                id: 'player_ice',
                type: 'freeze_opponent',
                name: 'Buzda Donduk!',
                isHarmful: true,
                remainingTime: Math.ceil(player.freezeTimer),
                totalTime: 10,
              });
            }
            if (opponent.isFrozen) {
              activeList.push({
                id: 'opp_ice',
                type: 'freeze_opponent',
                name: 'Rakip Donuk',
                isHarmful: false,
                remainingTime: Math.ceil(opponent.freezeTimer),
                totalTime: 10,
              });
            }
            if (slowMoTimerRef.current > 0) {
              activeList.push({
                id: 'slowmo',
                type: 'slow_ball',
                name: 'Uzay Yavaşlığı',
                isHarmful: false,
                remainingTime: Math.ceil(slowMoTimerRef.current),
                totalTime: 10,
              });
            }
            if (player.isFiery) {
              activeList.push({
                id: 'fire',
                type: 'fireball',
                name: 'Ateş Topu',
                isHarmful: false,
                remainingTime: Math.ceil(player.fireTimer),
                totalTime: 18,
              });
            }

            const statusKey = activeList.map((a) => `${a.id}:${a.remainingTime || a.count}`).join('|');
            if (statusKey !== lastReportedStatusKeyRef.current) {
              lastReportedStatusKeyRef.current = statusKey;
              onActivePowerUpsChange(activeList);
            }
          }

          // Update particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= p.decay * dt;
            if (p.alpha <= 0) {
              particlesRef.current.splice(i, 1);
            }
          }

          // Update shockwaves
          for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
            const sw = shockwavesRef.current[i];
            sw.radius += (sw.maxRadius - sw.radius) * 12 * dt;
            sw.alpha -= 2.2 * dt;
            if (sw.alpha <= 0) {
              shockwavesRef.current.splice(i, 1);
            }
          }
        }

        // Host broadcasts authoritative state snapshot to guest
        if (isMultiplayer && multiplayerRole === 'host' && multiplayerManager) {
          const curPlayer = playerPaddleRef.current;
          const curOpponent = opponentPaddleRef.current;
          multiplayerManager.sendGameState({
            t: currentTime,
            balls: ballsRef.current.map((b) => ({
              x: b.x / w,
              y: b.y / h,
              vx: b.vx / (w / 360),
              vy: b.vy / (h / 640),
              radius: b.radius,
              speed: b.speed,
              isSlowMo: !!b.isSlowMo,
              isFireball: !!b.isFireball,
              isMini: !!b.isMini,
              isSmash: !!b.isSmash,
              lastHitter: b.lastHitter,
              deflectedBySensor: !!b.deflectedBySensor,
            })),
            hostPaddle: {
              x: curPlayer.x / w,
              y: curPlayer.y / h,
              width: (curPlayer.width / w) * 360,
              isFrozen: curPlayer.isFrozen,
              freezeTimer: curPlayer.freezeTimer,
              isMegaPaddle: curPlayer.isMegaPaddle,
              megaPaddleTimer: curPlayer.megaPaddleTimer,
              isRocketPowered: curPlayer.isRocketPowered,
              isFiery: curPlayer.isFiery,
            },
            guestPaddle: {
              x: curOpponent.x / w,
              y: curOpponent.y / h,
              width: (curOpponent.width / w) * 360,
              isFrozen: curOpponent.isFrozen,
              freezeTimer: curOpponent.freezeTimer,
              isMegaPaddle: curOpponent.isMegaPaddle,
              megaPaddleTimer: curOpponent.megaPaddleTimer,
              isRocketPowered: curOpponent.isRocketPowered,
              isFiery: curOpponent.isFiery,
            },
            sensors: sensorsRef.current.map((s) => ({
              x: s.x / w,
              y: s.y / h,
              radius: s.radius,
              isFrozen: s.isFrozen,
              isScorched: s.isScorched,
              glowColor: s.glowColor,
            })),
            powerUps: powerUpsRef.current.map((p) => ({
              id: p.id,
              type: p.type,
              x: p.x / w,
              y: p.y / h,
              isHarmful: p.isHarmful,
            })),
            score: {
              player: state.currentScore.player,
              opponent: state.currentScore.opponent,
              targetScore: state.baseTargetScore,
            },
            hostIceWallActive: playerIceWallRef.current.active,
            guestIceWallActive: opponentIceWallRef.current.active,
            isRoundResetting: state.isRoundResetting,
            roundBanner: state.roundBanner,
            toast: powerUpToastRef.current
              ? {
                  title: powerUpToastRef.current.title,
                  subtitle: powerUpToastRef.current.subtitle,
                  color: powerUpToastRef.current.color,
                  icon: powerUpToastRef.current.icon,
                }
              : undefined,
          });
        }
      }

      // ==========================================
      // RENDERING PIPELINE
      // ==========================================
      ctx.save();
      ctx.scale(dpr, dpr);

      // Apply screen shake
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake;
        const shakeY = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // Clear Arena Background (custom stage color or default)
      ctx.fillStyle = stage?.bgColor || '#020617';
      ctx.fillRect(0, 0, w, h);

      // Draw Stadium Split Halves with stage-specific gradients
      const topGradient = ctx.createLinearGradient(0, 0, 0, h / 2);
      topGradient.addColorStop(0, stage?.bgGradientTop || 'rgba(244, 63, 94, 0.12)');
      topGradient.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
      ctx.fillStyle = topGradient;
      ctx.fillRect(8, 8, w - 16, h / 2 - 8);

      const botGradient = ctx.createLinearGradient(0, h / 2, 0, h);
      botGradient.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
      botGradient.addColorStop(1, stage?.bgGradientBot || 'rgba(6, 182, 212, 0.12)');
      ctx.fillStyle = botGradient;
      ctx.fillRect(8, h / 2, w - 16, h / 2 - 8);

      // Draw Stage-Specific Environmental Grid & Patterns
      if (stage) {
        ctx.save();
        const pattern = stage.gridPattern;
        const gridCol = stage.gridColor;
        ctx.strokeStyle = gridCol;

        if (pattern === 'cyber') {
          ctx.lineWidth = 1;
          for (let gy = 44; gy < h; gy += 42) {
            ctx.beginPath();
            ctx.moveTo(12, gy);
            ctx.lineTo(w - 12, gy);
            ctx.stroke();
          }
          for (let gx = 42; gx < w; gx += 42) {
            ctx.beginPath();
            ctx.setLineDash([2, 8]);
            ctx.moveTo(gx, 16);
            ctx.lineTo(gx, h - 16);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        } else if (pattern === 'magma') {
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(20, h * 0.28);
          ctx.lineTo(w * 0.4, h * 0.25);
          ctx.lineTo(w * 0.55, h * 0.32);
          ctx.lineTo(w - 20, h * 0.27);
          ctx.moveTo(w - 25, h * 0.72);
          ctx.lineTo(w * 0.6, h * 0.76);
          ctx.lineTo(w * 0.45, h * 0.68);
          ctx.lineTo(25, h * 0.73);
          ctx.stroke();

          const lavaGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 110);
          lavaGrad.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
          lavaGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = lavaGrad;
          ctx.fillRect(12, 12, w - 24, h - 24);
        } else if (pattern === 'crystal') {
          ctx.lineWidth = 1;
          const dStep = 56;
          for (let gy = -w; gy < h + w; gy += dStep) {
            ctx.beginPath();
            ctx.moveTo(12, gy);
            ctx.lineTo(w - 12, gy + (w - 24));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(w - 12, gy);
            ctx.lineTo(12, gy + (w - 24));
            ctx.stroke();
          }
        } else if (pattern === 'matrix') {
          ctx.setLineDash([3, 6]);
          ctx.lineWidth = 1;
          for (let gy = 40; gy < h; gy += 48) {
            for (let gx = 36; gx < w; gx += 48) {
              ctx.beginPath();
              ctx.arc(gx, gy, 9, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.setLineDash([]);
        } else if (pattern === 'cosmic') {
          for (let i = 0; i < 32; i++) {
            const sx = ((i * 79) % (w - 36)) + 18;
            const sy = ((i * 131) % (h - 36)) + 18;
            const sr = i % 4 === 0 ? 1.8 : 1.1;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(216, 180, 254, 0.45)' : 'rgba(244, 114, 182, 0.4)';
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 105, 0, Math.PI * 2);
          ctx.setLineDash([4, 10]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (pattern === 'apex') {
          ctx.lineWidth = 1.2;
          const rays = 12;
          for (let r = 0; r < rays; r++) {
            const angle = (r / rays) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(w / 2 + Math.cos(angle) * 35, h / 2 + Math.sin(angle) * 35);
            ctx.lineTo(w / 2 + Math.cos(angle) * 200, h / 2 + Math.sin(angle) * 200);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 75, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 125, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Arena Outer Rounded Boundary
      ctx.strokeStyle = stage?.boundaryColor || '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Goal Lines
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(w - 12, 12);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, h - 12);
      ctx.lineTo(w - 12, h - 12);
      ctx.stroke();

      // Center Divider: Sleek Dashed Line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(12, h / 2);
      ctx.lineTo(w - 12, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right-Center Power-Up Launcher Port
      // "oyuna oyun alanının sağ orta tarafından fırlatılan, güç öğeleri ekle"
      const launcherY = h / 2;
      const flashVal = launcherFlashRef.current;
      ctx.save();
      ctx.shadowColor = flashVal > 0.05 ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = flashVal > 0.05 ? 18 * flashVal : 6;

      // Outer gate notch
      ctx.fillStyle = flashVal > 0.05 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.18)';
      ctx.strokeStyle = flashVal > 0.05 ? '#10b981' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w - 14, launcherY - 26, 8, 52, 4);
      ctx.fill();
      ctx.stroke();

      // Directional launch indicator (towards left arena)
      ctx.fillStyle = flashVal > 0.05 ? '#ffffff' : '#38bdf8';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀', w - 10, launcherY);
      ctx.restore();

      // Center Zone Orbit Guide Rings for all active sensors
      sensorsRef.current.forEach((sensor) => {
        ctx.beginPath();
        ctx.ellipse(
          sensor.centerOriginX,
          sensor.centerOriginY,
          sensor.orbitRadiusX,
          sensor.orbitRadiusY,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Shockwaves render
      shockwavesRef.current.forEach((sw) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = sw.lineWidth;
        ctx.stroke();
        ctx.restore();
      });

      // ==========================================
      // DRAW POWER-UP ITEMS
      // "yeşil çemberin içinde gelsin, kötü özellikteyse kırmızı çemberin içinde gelsin"
      // "nesneler sadece ikon gibi olsun çok büyük olmasın"
      // ==========================================
      powerUpsRef.current.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);

        const ringColor = p.isHarmful ? '#ef4444' : '#10b981';
        const pulse = 1 + Math.sin(p.phase * 2) * 0.08;

        // Ambient glow
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 12 * pulse;

        // Inside radial gradient
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius);
        if (p.isHarmful) {
          grad.addColorStop(0, 'rgba(185, 28, 28, 0.95)');
          grad.addColorStop(1, 'rgba(69, 10, 10, 0.85)');
        } else {
          grad.addColorStop(0, 'rgba(4, 120, 87, 0.95)');
          grad.addColorStop(1, 'rgba(2, 44, 34, 0.85)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing outer circle ring
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Dynamic spinning dashes on ring
        ctx.save();
        ctx.rotate(p.phase);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Crisp centered emoji icon
        ctx.shadowBlur = 0;
        ctx.font = '13px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 1);

        ctx.restore();
      });

      // ==========================================
      // DRAW ALL ÇEMBER SENSORS (1, 2, or 4 Active Orbs)
      // ==========================================
      sensorsRef.current.forEach((sensor, sIdx) => {
        ctx.save();
        ctx.translate(sensor.x, sensor.y);

        const flashGlow = sensor.hitFlash * 25;

        // Outer kinetic aura
        const auraGrad = ctx.createRadialGradient(0, 0, sensor.radius * 0.4, 0, 0, sensor.radius * 1.8);
        auraGrad.addColorStop(
          0,
          sensor.isFrozen
            ? 'rgba(56, 189, 248, 0.5)'
            : `rgba(245, 158, 11, ${0.35 + sensor.hitFlash * 0.5})`
        );
        auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, sensor.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Outer Segmented Ring
        ctx.save();
        ctx.rotate(sensor.rotationAngle);
        ctx.strokeStyle = sensor.isFrozen ? '#7dd3fc' : sensor.hitFlash > 0.1 ? '#fef08a' : '#f59e0b';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = sensor.isFrozen ? '#38bdf8' : '#f59e0b';
        ctx.shadowBlur = 10 + flashGlow;
        ctx.beginPath();
        ctx.arc(0, 0, sensor.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Sensor Beaded Nodes along circumference
        for (let i = 0; i < 4; i++) {
          const nodeAngle = (i * Math.PI) / 2;
          const nx = Math.cos(nodeAngle) * sensor.radius;
          const ny = Math.sin(nodeAngle) * sensor.radius;
          ctx.fillStyle = sensor.isFrozen ? '#e0f2fe' : i % 2 === 0 ? '#fbbf24' : '#f43f5e';
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Inner Core of Sensor
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sensor.radius * 0.75);
        if (sensor.isFrozen) {
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.5, '#38bdf8');
          coreGrad.addColorStop(1, '#0369a1');
        } else {
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.5, '#f59e0b');
          coreGrad.addColorStop(1, '#78350f');
        }
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, sensor.radius * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Frozen Ice Spikes Overlay if frozen
        if (sensor.isFrozen) {
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2.5;
          for (let s = 0; s < 8; s++) {
            const a = (s * Math.PI) / 4;
            const inX = Math.cos(a) * (sensor.radius + 1);
            const inY = Math.sin(a) * (sensor.radius + 1);
            const outX = Math.cos(a) * (sensor.radius + 7);
            const outY = Math.sin(a) * (sensor.radius + 7);
            ctx.beginPath();
            ctx.moveTo(inX, inY);
            ctx.lineTo(outX, outY);
            ctx.stroke();
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🧊 ${Math.ceil(sensor.freezeTimer)}s`, 0, -sensor.radius - 10);
        } else if (sensor.isScorched) {
          // Scorched smoke aura
          ctx.fillStyle = 'rgba(234, 88, 12, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, sensor.radius + 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sensor Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelText = sensor.isFrozen ? 'DONDU' : sensorsRef.current.length > 1 ? `Ç${sIdx + 1}` : 'ÇEMBER';
        ctx.fillText(labelText, 0, 0);

        ctx.restore();
      });

      // ==========================================
      // DRAW DUAL ICE WALLS (Player Bottom & Opponent Top)
      // "tümüyle kaleyi 15 saniye kapatan bir buz olsun"
      // ==========================================
      const pIceWall = playerIceWallRef.current;
      if (pIceWall.active) {
        ctx.save();
        const iceH = pIceWall.height;
        const iceY = pIceWall.y;

        ctx.shadowColor = pIceWall.hitFlash > 0.1 ? '#ffffff' : '#38bdf8';
        ctx.shadowBlur = 18 + pIceWall.hitFlash * 25;

        const iceGrad = ctx.createLinearGradient(0, iceY, 0, iceY + iceH);
        iceGrad.addColorStop(0, '#e0f2fe');
        iceGrad.addColorStop(0.3, '#7dd3fc');
        iceGrad.addColorStop(0.7, '#0284c7');
        iceGrad.addColorStop(1, '#0c4a6e');

        ctx.fillStyle = iceGrad;
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(10, iceY, w - 20, iceH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        const spikeCount = Math.floor((w - 20) / 16);
        for (let i = 0; i < spikeCount; i++) {
          const sx = 14 + i * 16;
          ctx.beginPath();
          ctx.moveTo(sx, iceY);
          ctx.lineTo(sx + 8, iceY - 6);
          ctx.lineTo(sx + 16, iceY);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fillText(`🧊 BİZİM BUZ KALKANI (${Math.ceil(pIceWall.remainingTime)}s)`, w / 2, iceY + iceH / 2);
        ctx.restore();
      }

      const oIceWall = opponentIceWallRef.current;
      if (oIceWall.active) {
        ctx.save();
        const iceH = oIceWall.height;
        const iceY = oIceWall.y;

        ctx.shadowColor = oIceWall.hitFlash > 0.1 ? '#ffffff' : '#f43f5e';
        ctx.shadowBlur = 18 + oIceWall.hitFlash * 25;

        const iceGrad = ctx.createLinearGradient(0, iceY, 0, iceY + iceH);
        iceGrad.addColorStop(0, '#ffe4e6');
        iceGrad.addColorStop(0.3, '#fda4af');
        iceGrad.addColorStop(0.7, '#e11d48');
        iceGrad.addColorStop(1, '#881337');

        ctx.fillStyle = iceGrad;
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(10, iceY, w - 20, iceH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        const spikeCount = Math.floor((w - 20) / 16);
        for (let i = 0; i < spikeCount; i++) {
          const sx = 14 + i * 16;
          ctx.beginPath();
          ctx.moveTo(sx, iceY + iceH);
          ctx.lineTo(sx + 8, iceY + iceH + 6);
          ctx.lineTo(sx + 16, iceY + iceH);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 8;
        ctx.fillText(`🧊 RAKİP BUZ KALKANI (${Math.ceil(oIceWall.remainingTime)}s)`, w / 2, iceY + iceH / 2);
        ctx.restore();
      }

      // ==========================================
      // DRAW DUAL AUTONOMOUS GOALIE PADDLES
      // ==========================================
      // 1) Player Goalie (Bottom)
      const pGoalie = playerGoaliePaddleRef.current;
      if (pGoalie) {
        ctx.save();
        ctx.globalAlpha = pGoalie.alpha;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;

        const gGrad = ctx.createLinearGradient(0, pGoalie.y - pGoalie.height / 2, 0, pGoalie.y + pGoalie.height / 2);
        gGrad.addColorStop(0, '#67e8f9');
        gGrad.addColorStop(0.5, '#0891b2');
        gGrad.addColorStop(1, '#155e75');

        ctx.fillStyle = gGrad;
        ctx.strokeStyle = '#a5f3fc';
        ctx.lineWidth = 2;
        ctx.setLineDash(pGoalie.dissolving ? [4, 4] : []);

        const gR = pGoalie.height / 2;
        ctx.beginPath();
        ctx.roundRect(pGoalie.x - pGoalie.width / 2, pGoalie.y - pGoalie.height / 2, pGoalie.width, pGoalie.height, gR);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🧤 KALECİ ${Math.ceil(pGoalie.remainingTime)}s`, pGoalie.x, pGoalie.y);
        ctx.restore();
      }

      // 2) Opponent Goalie (Top)
      const oGoalie = opponentGoaliePaddleRef.current;
      if (oGoalie) {
        ctx.save();
        ctx.globalAlpha = oGoalie.alpha;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;

        const gGrad = ctx.createLinearGradient(0, oGoalie.y - oGoalie.height / 2, 0, oGoalie.y + oGoalie.height / 2);
        gGrad.addColorStop(0, '#fda4af');
        gGrad.addColorStop(0.5, '#e11d48');
        gGrad.addColorStop(1, '#881337');

        ctx.fillStyle = gGrad;
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 2;
        ctx.setLineDash(oGoalie.dissolving ? [4, 4] : []);

        const gR = oGoalie.height / 2;
        ctx.beginPath();
        ctx.roundRect(oGoalie.x - oGoalie.width / 2, oGoalie.y - oGoalie.height / 2, oGoalie.width, oGoalie.height, gR);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🧤 RAKİP KALECİ ${Math.ceil(oGoalie.remainingTime)}s`, oGoalie.x, oGoalie.y);
        ctx.restore();
      }

      // ==========================================
      // DRAW PADDLES
      // ==========================================
      // Opponent Paddle (Top, Rose / Purple Mega)
      const opp = opponentPaddleRef.current;
      if (opp.isEjected) {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.roundRect(16, 48, w - 32, 28, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = '900 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🟥 RAKİP OYUNDAN ATILDI • KALE BOŞ!', w / 2, 62);
        ctx.restore();
      } else {
        ctx.save();
        const isOppMega = opp.isMegaPaddle;
        const oppGlow = isOppMega ? '#c084fc' : opp.glowColor;
        ctx.shadowColor = opp.hitFlash > 0.1 ? '#ffffff' : oppGlow;
        ctx.shadowBlur = isOppMega ? 22 : 12 + opp.hitFlash * 20;

        if (isOppMega) {
          const megaGrad = ctx.createLinearGradient(0, opp.y - opp.height / 2, 0, opp.y + opp.height / 2);
          megaGrad.addColorStop(0, '#f0abfc');
          megaGrad.addColorStop(0.5, '#a855f7');
          megaGrad.addColorStop(1, '#581c87');
          ctx.fillStyle = opp.hitFlash > 0.1 ? '#ffffff' : megaGrad;
        } else if (opp.hitFlash > 0.1) {
          ctx.fillStyle = '#ffffff';
        } else if (opp.secondaryColor) {
          const oppGrad = ctx.createLinearGradient(opp.x - opp.width / 2, 0, opp.x + opp.width / 2, 0);
          oppGrad.addColorStop(0, opp.color);
          oppGrad.addColorStop(0.495, opp.color);
          oppGrad.addColorStop(0.505, opp.secondaryColor);
          oppGrad.addColorStop(1, opp.secondaryColor);
          ctx.fillStyle = oppGrad;
        } else {
          ctx.fillStyle = opp.color;
        }

        ctx.beginPath();
        const oppR = opp.height / 2;
        ctx.roundRect(opp.x - opp.width / 2, opp.y - opp.height / 2, opp.width, opp.height, oppR);
        ctx.fill();

        if (!isOppMega && opp.secondaryColor && opp.hitFlash <= 0.1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(opp.x, opp.y - opp.height / 2);
          ctx.lineTo(opp.x, opp.y + opp.height / 2);
          ctx.stroke();
        }

        // Mega Paddle Crown Indicator for Opponent
        if (isOppMega) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`👑 EN UZUN ÇUBUK (${Math.ceil(opp.megaPaddleTimer)}s)`, opp.x, opp.y);
        }

        // Opponent Rocket Thrusters
        if (opp.isRocketPowered) {
          const leftX = opp.x - opp.width / 2;
          const rightX = opp.x + opp.width / 2;
          const engineY = opp.y;

          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.roundRect(leftX - 8, engineY - 8, 7, 16, 3);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(rightX + 1, engineY - 8, 7, 16, 3);
          ctx.fill();
          ctx.stroke();

          const flameLen = 8 + Math.random() * 9;
          const flameGrad = ctx.createLinearGradient(0, engineY - 8, 0, engineY - 8 - flameLen);
          flameGrad.addColorStop(0, '#f43f5e');
          flameGrad.addColorStop(0.5, '#f59e0b');
          flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(leftX - 7, engineY - 8);
          ctx.lineTo(leftX - 4.5, engineY - 8 - flameLen);
          ctx.lineTo(leftX - 2, engineY - 8);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(rightX + 2, engineY - 8);
          ctx.lineTo(rightX + 4.5, engineY - 8 - flameLen);
          ctx.lineTo(rightX + 7, engineY - 8);
          ctx.fill();
        }

        // Opponent Fiery Flames
        if (opp.isFiery) {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 18;
          const flameCount = Math.floor(opp.width / 14);
          for (let f = 0; f <= flameCount; f++) {
            const fx = opp.x - opp.width / 2 + f * 14;
            const fHeight = 6 + Math.sin(currentTime * 0.018 + f) * 5;
            ctx.fillStyle = f % 2 === 0 ? '#fbbf24' : '#f97316';
            ctx.beginPath();
            ctx.moveTo(fx - 4, opp.y + opp.height / 2);
            ctx.lineTo(fx, opp.y + opp.height / 2 + fHeight);
            ctx.lineTo(fx + 4, opp.y + opp.height / 2);
            ctx.fill();
          }
        }

        // Opponent frozen ice block overlay
        if (opp.isFrozen) {
          const icePad = 6;
          const iceW = opp.width + icePad * 2;
          const iceH = opp.height + icePad * 2;

          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.roundRect(opp.x - iceW / 2, opp.y - iceH / 2, iceW, iceH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(opp.x - 20, opp.y - 4);
          ctx.lineTo(opp.x - 2, opp.y + 3);
          ctx.lineTo(opp.x + 16, opp.y - 2);
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.font = 'bold 9px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`❄️ DONDU (${Math.ceil(opp.freezeTimer)}s)`, opp.x, opp.y);
        } else if (!isOppMega) {
          ctx.fillStyle = '#fecdd3';
          ctx.beginPath();
          ctx.roundRect(opp.x - 12, opp.y - 2, 24, 4, 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Multi Paddles (Auxiliary Player Defense Clones)
      multiPaddlesRef.current.forEach((mp) => {
        const mpY = playerPaddleRef.current.y + mp.yOffset;
        ctx.save();
        ctx.globalAlpha = mp.alpha;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;

        ctx.fillStyle = mp.dissolving ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.75)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash(mp.dissolving ? [4, 4] : []);

        const mpHalfW = playerPaddleRef.current.width / 2;
        const mpR = playerPaddleRef.current.height / 2;
        ctx.beginPath();
        ctx.roundRect(playerPaddleRef.current.x - mpHalfW, mpY - playerPaddleRef.current.height / 2, playerPaddleRef.current.width, playerPaddleRef.current.height, mpR);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`MULTI ${Math.ceil(mp.remainingTime)}s`, playerPaddleRef.current.x, mpY);
        ctx.restore();
      });

      // Player Paddle (Bottom, Cyan / Purple Mega)
      const ply = playerPaddleRef.current;
      if (ply.isEjected) {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.roundRect(16, h - 76, w - 32, 28, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = '900 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🟥 OYUNDAN ATILDIN • KALE BOŞ!', w / 2, h - 62);
        ctx.restore();
      } else {
        ctx.save();
        const isMega = ply.isMegaPaddle;
        const paddleGlow = isMega ? '#c084fc' : ply.glowColor;
        ctx.shadowColor = ply.hitFlash > 0.1 ? '#ffffff' : paddleGlow;
        ctx.shadowBlur = isMega ? 22 : 12 + ply.hitFlash * 20;

        if (isMega) {
          const megaGrad = ctx.createLinearGradient(0, ply.y - ply.height / 2, 0, ply.y + ply.height / 2);
          megaGrad.addColorStop(0, '#f0abfc');
          megaGrad.addColorStop(0.5, '#a855f7');
          megaGrad.addColorStop(1, '#581c87');
          ctx.fillStyle = ply.hitFlash > 0.1 ? '#ffffff' : megaGrad;
        } else if (ply.hitFlash > 0.1) {
          ctx.fillStyle = '#ffffff';
        } else if (ply.secondaryColor) {
          const plyGrad = ctx.createLinearGradient(ply.x - ply.width / 2, 0, ply.x + ply.width / 2, 0);
          plyGrad.addColorStop(0, ply.color);
          plyGrad.addColorStop(0.495, ply.color);
          plyGrad.addColorStop(0.505, ply.secondaryColor);
          plyGrad.addColorStop(1, ply.secondaryColor);
          ctx.fillStyle = plyGrad;
        } else {
          ctx.fillStyle = ply.color;
        }

        ctx.beginPath();
        const plyR = ply.height / 2;
        ctx.roundRect(ply.x - ply.width / 2, ply.y - ply.height / 2, ply.width, ply.height, plyR);
        ctx.fill();

        if (!isMega && ply.secondaryColor && ply.hitFlash <= 0.1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ply.x, ply.y - ply.height / 2);
          ctx.lineTo(ply.x, ply.y + ply.height / 2);
          ctx.stroke();
        }

        // Mega Paddle Crown Indicator
        if (isMega) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`👑 EN UZUN ÇUBUK (${Math.ceil(ply.megaPaddleTimer)}s)`, ply.x, ply.y);
        }

        // Roket boosters on paddle sides
        if (ply.isRocketPowered) {
          const leftX = ply.x - ply.width / 2;
          const rightX = ply.x + ply.width / 2;
          const engineY = ply.y;

          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.roundRect(leftX - 8, engineY - 8, 7, 16, 3);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(rightX + 1, engineY - 8, 7, 16, 3);
          ctx.fill();
          ctx.stroke();

          const flameLen = 8 + Math.random() * 9;
          const flameGrad = ctx.createLinearGradient(0, engineY + 8, 0, engineY + 8 + flameLen);
          flameGrad.addColorStop(0, '#38bdf8');
          flameGrad.addColorStop(0.5, '#f59e0b');
          flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(leftX - 7, engineY + 8);
          ctx.lineTo(leftX - 4.5, engineY + 8 + flameLen);
          ctx.lineTo(leftX - 2, engineY + 8);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(rightX + 2, engineY + 8);
          ctx.lineTo(rightX + 4.5, engineY + 8 + flameLen);
          ctx.lineTo(rightX + 7, engineY + 8);
          ctx.fill();
        }

        // Fiery Paddle (Ateş Topu ability)
        if (ply.isFiery) {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 18;
          const flameCount = Math.floor(ply.width / 14);
          for (let f = 0; f <= flameCount; f++) {
            const fx = ply.x - ply.width / 2 + f * 14;
            const fHeight = 6 + Math.sin(currentTime * 0.018 + f) * 5;
            ctx.fillStyle = f % 2 === 0 ? '#fbbf24' : '#f97316';
            ctx.beginPath();
            ctx.moveTo(fx - 4, ply.y - ply.height / 2);
            ctx.lineTo(fx, ply.y - ply.height / 2 - fHeight);
            ctx.lineTo(fx + 4, ply.y - ply.height / 2);
            ctx.fill();
          }
        }

        // Player Frozen Ice Block Overlay
        if (ply.isFrozen) {
          const icePad = 6;
          const iceW = ply.width + icePad * 2;
          const iceH = ply.height + icePad * 2;

          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.roundRect(ply.x - iceW / 2, ply.y - iceH / 2, iceW, iceH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ply.x - 20, ply.y - 4);
          ctx.lineTo(ply.x - 2, ply.y + 3);
          ctx.lineTo(ply.x + 16, ply.y - 2);
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.font = 'bold 9px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`❄️ DONDUK! (${Math.ceil(ply.freezeTimer)}s)`, ply.x, ply.y);
        } else if (!isMega) {
          ctx.fillStyle = '#cffafe';
          ctx.beginPath();
          ctx.roundRect(ply.x - 12, ply.y - 2, 24, 4, 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ==========================================
      // DRAW PARTICLES
      // ==========================================
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // DRAW BALLS & TRAILS
      // ==========================================
      if (!state.isRoundResetting) {
        ballsRef.current.forEach((ball) => {
          // Draw Trail
          for (let i = 0; i < ball.trail.length; i++) {
            const t = ball.trail[i];
            ctx.save();
            ctx.fillStyle = `rgba(${t.color || '34, 211, 238'}, ${t.alpha * 0.65})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Ball Glow & Core
          ctx.save();
          let ballGlowColor = ball.lastHitter === 'player' ? '#22d3ee' : ball.lastHitter === 'opponent' ? '#fb7185' : '#fbbf24';
          if (ball.isFireball) {
            ballGlowColor = '#f97316';
          } else if (ball.isSlowMo) {
            ballGlowColor = '#a855f7';
          } else if (ball.deflectedBySensor) {
            ballGlowColor = '#f59e0b';
          }

          ctx.shadowColor = ballGlowColor;
          ctx.shadowBlur = ball.isFireball ? 28 : ball.deflectedBySensor ? 24 : ball.isSmash ? 20 : 15;

          // Draw 2x Sensor energy ring if deflected by sensor
          if (ball.deflectedBySensor) {
            ctx.save();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Small "2X" tag above ball
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('2X', ball.x, ball.y - ball.radius - 8);
            ctx.restore();
          }

          // Fireball aura
          if (ball.isFireball) {
            const fGrad = ctx.createRadialGradient(ball.x, ball.y, ball.radius * 0.2, ball.x, ball.y, ball.radius * 2.2);
            fGrad.addColorStop(0, '#ffffff');
            fGrad.addColorStop(0.3, '#fbbf24');
            fGrad.addColorStop(0.7, '#f97316');
            fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = fGrad;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Slow-mo celestial aura
          if (ball.isSlowMo) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 5 + Math.sin(currentTime * 0.008) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }

          const ballGrad = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3,
            ball.y - ball.radius * 0.3,
            ball.radius * 0.1,
            ball.x,
            ball.y,
            ball.radius
          );
          ballGrad.addColorStop(0, '#ffffff');
          ballGrad.addColorStop(0.6, ballGlowColor);
          ballGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = ballGrad;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // ==========================================
      // ROUND BANNER NOTIFICATION OVERLAY
      // ==========================================
      if (state.isRoundResetting && state.roundBanner) {
        ctx.save();
        const isDouble = state.roundBanner.includes('+2');
        ctx.fillStyle = isDouble ? 'rgba(30, 27, 75, 0.85)' : 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, h / 2 - 32, w, 64);

        if (isDouble) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(16, h / 2 - 28, w - 32, 56);
        }

        ctx.fillStyle = isDouble ? '#f59e0b' : state.roundBanner.includes('YOU') ? '#38bdf8' : '#fb7185';
        ctx.font = '900 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.roundBanner, w / 2, h / 2);
        ctx.restore();
      }

      // ==========================================
      // FLOATING POWER-UP TOAST NOTIFICATION
      // ==========================================
      if (powerUpToastRef.current) {
        const toast = powerUpToastRef.current;
        toast.timer -= dt;
        if (toast.timer <= 0) {
          powerUpToastRef.current = null;
        } else {
          const alpha = Math.min(1, toast.timer * 2.2);
          ctx.save();
          ctx.globalAlpha = alpha;
          const toastY = h * 0.34 - (1.8 - toast.timer) * 12;

          ctx.shadowColor = toast.color;
          ctx.shadowBlur = 14;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = toast.color;
          ctx.lineWidth = 1.5;

          const toastW = 210;
          const toastH = 42;
          ctx.beginPath();
          ctx.roundRect(w / 2 - toastW / 2, toastY - toastH / 2, toastW, toastH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = toast.color;
          ctx.font = '900 12px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(toast.title, w / 2, toastY - 7);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 10px Outfit, sans-serif';
          ctx.fillText(toast.subtitle, w / 2, toastY + 8);
          ctx.restore();
        }
      }

      // ==========================================
      // GYROSCOPE HUD LEVEL INDICATOR
      // ==========================================
      if (gyro.isEnabled) {
        ctx.save();
        const bubbleX = w - 28;
        const bubbleY = h - 28;

        // Outer Ring
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bubbleX - 6, bubbleY);
        ctx.lineTo(bubbleX + 6, bubbleY);
        ctx.moveTo(bubbleX, bubbleY - 6);
        ctx.lineTo(bubbleX, bubbleY + 6);
        ctx.stroke();

        // Tilt Bead
        const beadOffX = clamp((gyro.normalizedX - 0.5) * 22, -11, 11);
        const beadOffY = clamp((gyro.normalizedY - 0.82) * 26, -11, 11);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bubbleX + beadOffX, bubbleY + beadOffY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [difficulty, isPaused, onActivePowerUpsChange, onComboChange, onGameOver, onRallyChange, onScoreUpdate, resetBall, updateSensorDifficulty]);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full h-full touch-none select-none flex items-center justify-center overflow-hidden bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        id="cember-game-canvas"
        className="block w-full h-full max-w-md mx-auto cursor-pointer"
      />
    </div>
  );
};
