import React, { useState, useEffect } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Flame,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Compass,
  Smartphone,
  Wifi,
  Users,
} from 'lucide-react';
import { GameScore, ActivePowerUpStatus, CountryTeam, CardPenaltyState } from '../types';
import { isFullscreen, toggleFullscreen } from '../utils/fullscreen';
import { gyroController, GyroState } from '../utils/gyroscope';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/audio';

interface GameHUDProps {
  score: GameScore;
  combo: number;
  rallyCount: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  difficulty: string;
  activePowerUps?: ActivePowerUpStatus[];
  playerTeam?: CountryTeam | null;
  opponentTeam?: CountryTeam | null;
  cardState?: CardPenaltyState;
  // Multiplayer props
  isMultiplayer?: boolean;
  multiplayerRole?: 'host' | 'guest' | null;
  ping?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  rallyCount,
  isPaused,
  onTogglePause,
  onResume,
  onRestart,
  onQuit,
  isMuted,
  onToggleMute,
  difficulty,
  activePowerUps = [],
  playerTeam,
  opponentTeam,
  cardState,
  isMultiplayer,
  multiplayerRole,
  ping,
}) => {
  const [inFullscreen, setInFullscreen] = useState<boolean>(false);
  const [gyroState, setGyroState] = useState<GyroState>(gyroController.getState());
  const [showGyroToast, setShowGyroToast] = useState<string>('');

  useEffect(() => {
    const unsub = gyroController.subscribe(setGyroState);
    const handleFsChange = () => setInFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleFs = async () => {
    soundEngine.playClick();
    const res = await toggleFullscreen();
    setInFullscreen(res);
  };

  const handleToggleGyro = async () => {
    soundEngine.playClick();
    if (gyroState.isEnabled) {
      gyroController.disable();
      setShowGyroToast('Jiroskop Kapatıldı (Dokunmatik)');
    } else {
      const ok = await gyroController.requestPermissionAndEnable();
      if (ok) {
        gyroController.calibrate();
        setShowGyroToast('📱 Jiroskop Aktif! Telefonu eğerek oyna.');
      } else {
        setShowGyroToast('Jiroskop izni verilmedi veya desteklenmiyor.');
      }
    }
    setTimeout(() => setShowGyroToast(''), 2500);
  };

  const handleCalibrateGyro = () => {
    soundEngine.playClick();
    gyroController.calibrate();
    setShowGyroToast('🎯 Jiroskop Konumu Sıfırlandı!');
    setTimeout(() => setShowGyroToast(''), 2000);
  };

  const oppColor = opponentTeam?.paddleColor || '#f43f5e';
  const oppSecColor = opponentTeam?.secondaryColor || opponentTeam?.accentColor || oppColor;
  const oppGlow = opponentTeam?.glowColor || oppColor;

  const playerColor = playerTeam?.paddleColor || '#06b6d4';
  const playerSecColor = playerTeam?.secondaryColor || playerTeam?.accentColor || playerColor;
  const playerGlow = playerTeam?.glowColor || playerColor;

  return (
    <>
      {/* Top Header Floating HUD */}
      <header className="absolute top-0 left-0 right-0 z-30 p-2.5 pt-1.5 flex flex-col items-center pointer-events-none select-none">
        {/* Main Bar */}
        <div className="w-full max-w-md flex items-center justify-between pointer-events-auto gap-1.5">
          {/* Pause Button */}
          <button
            id="pause-game-btn"
            onClick={onTogglePause}
            aria-label="Pause game"
            className="p-2 rounded-xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 backdrop-blur-sm shadow-md"
          >
            <Pause className="w-4 h-4" />
          </button>

          {/* Central Match Score Pill with Country Colors */}
          <div
            className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-950/90 border backdrop-blur-md shadow-2xl transition-all"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: `inset 4px 0 12px -4px ${oppColor}50, inset -4px 0 12px -4px ${playerColor}50, 0 8px 24px -6px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Opponent side indicator */}
            <div className="flex items-center gap-1.5 min-w-0">
              {opponentTeam ? (
                <CountryFlag team={opponentTeam} size="sm" shape="rounded" className="shrink-0 drop-shadow-sm" />
              ) : (
                <span className="text-lg shrink-0 drop-shadow-sm">{isMultiplayer ? '👤' : '🤖'}</span>
              )}
              <div className="flex flex-col items-start leading-none max-w-[75px] truncate">
                <div className="flex items-center gap-1">
                  <span
                    className="text-[10px] font-black truncate tracking-wide"
                    style={{ color: oppColor }}
                  >
                    {opponentTeam ? opponentTeam.name : 'RAKİP'}
                  </span>
                  {opponentTeam && (
                    <div className="w-2.5 h-2.5 rounded-full border border-white/40 overflow-hidden shrink-0 shadow-sm" style={{ backgroundColor: oppColor }} />
                  )}
                </div>
                {cardState?.opponentYellowCards ? (
                  <span className="text-[8px] font-black text-amber-300 flex items-center gap-0.5 mt-0.5">
                    🟨
                  </span>
                ) : null}
              </div>
              <span
                className="text-2xl font-black min-w-5 text-center transition-all ml-1"
                style={{
                  color: oppColor,
                  textShadow: `0 0 10px ${oppGlow}80`,
                }}
              >
                {score.opponent}
              </span>
            </div>

            {/* Middle Divider & Dynamic Target / Overtime mark */}
            <div className="flex flex-col items-center px-1 shrink-0">
              <span className="text-sm font-black text-slate-500 leading-none">:</span>
              {score.player >= 4 && score.opponent >= 4 ? (
                <span className="text-[7px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40 animate-pulse mt-0.5">
                  UZATMA
                </span>
              ) : (
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  HEDEF {score.targetScore}
                </span>
              )}
            </div>

            {/* Player side indicator */}
            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              <span
                className="text-2xl font-black min-w-5 text-center transition-all mr-1"
                style={{
                  color: playerColor,
                  textShadow: `0 0 10px ${playerGlow}80`,
                }}
              >
                {score.player}
              </span>
              <div className="flex flex-col items-end leading-none max-w-[75px] truncate">
                <div className="flex items-center gap-1">
                  {playerTeam && (
                    <div className="w-2.5 h-2.5 rounded-full border border-white/40 overflow-hidden shrink-0 shadow-sm" style={{ backgroundColor: playerColor }} />
                  )}
                  <span
                    className="text-[10px] font-black truncate tracking-wide"
                    style={{ color: playerColor }}
                  >
                    {playerTeam ? playerTeam.name : 'SEN'}
                  </span>
                </div>
                {cardState?.playerYellowCards ? (
                  <span className="text-[8px] font-black text-amber-300 flex items-center gap-0.5 mt-0.5">
                    🟨
                  </span>
                ) : null}
              </div>
              {playerTeam ? (
                <CountryFlag team={playerTeam} size="sm" shape="rounded" className="shrink-0 drop-shadow-sm" />
              ) : (
                <span className="text-lg shrink-0 drop-shadow-sm">👤</span>
              )}
            </div>
          </div>

          {/* Action Tools Right: Gyro, Fullscreen, Mute */}
          <div className="flex items-center gap-1">
            {/* Gyroscope toggle */}
            <button
              id="hud-gyro-toggle-btn"
              onClick={handleToggleGyro}
              title={gyroState.isEnabled ? 'Jiroskop Açık (Tıkla: Kapat)' : 'Jiroskop Kapalı (Tıkla: Aç)'}
              className={`p-2 rounded-xl border transition active:scale-95 backdrop-blur-sm ${
                gyroState.isEnabled
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${gyroState.isEnabled ? 'rotate-12 animate-pulse' : ''}`} />
            </button>

            {/* Fullscreen toggle */}
            <button
              id="hud-fullscreen-btn"
              onClick={handleToggleFs}
              title="Tam Ekran"
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 backdrop-blur-sm"
            >
              {inFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Audio toggle */}
            <button
              id="hud-sound-toggle-btn"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Dynamic Secondary Bar: Gyro Active info, Multiplayer Ping, Rally Counter, Cards */}
        <div className="w-full max-w-md flex items-center justify-between px-1 mt-1.5 pointer-events-none">
          {/* Left: Mode / Online info */}
          {isMultiplayer ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-[9px] font-black text-indigo-300">
              <Users className="w-3 h-3" />
              <span>ONLINE ({multiplayerRole === 'host' ? 'KURUCU' : 'KATILIMCI'})</span>
              {ping !== undefined && (
                <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                  <Wifi className="w-2.5 h-2.5" /> {ping}ms
                </span>
              )}
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800/60 text-[10px] font-semibold text-slate-400">
              Rally: <span className="text-white font-bold">{rallyCount}</span>
            </div>
          )}

          {/* Gyro Calibration Quick Button (when gyro is enabled) */}
          {gyroState.isEnabled && (
            <button
              id="hud-gyro-calibrate-btn"
              onClick={handleCalibrateGyro}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-[9px] font-black text-amber-300 shadow-sm active:scale-95 transition"
            >
              <Compass className="w-3 h-3 animate-spin" />
              <span>SIFIRLA (KALİBRE)</span>
            </button>
          )}

          {/* Ejected Card Warnings */}
          {cardState?.playerIsEjected && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/60 text-rose-300 text-[10px] font-black animate-pulse">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>🟥 KIRMIZI KART! BOŞ KALE!</span>
            </div>
          )}
          {cardState?.opponentIsEjected && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-[10px] font-black animate-pulse">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              <span>🟥 RAKİP ATILDI! BOŞ KALE!</span>
            </div>
          )}

          {/* Animated Combo Badge */}
          {combo >= 2 ? (
            <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black animate-bounce shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>COMBO x{combo}!</span>
            </div>
          ) : !isMultiplayer ? (
            <div className="px-2 py-0.5 rounded-full bg-slate-900/40 text-[10px] font-medium text-slate-500 uppercase">
              {difficulty}
            </div>
          ) : null}
        </div>

        {/* Active Power-Ups Chips */}
        {activePowerUps && activePowerUps.length > 0 && (
          <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-1.5 px-2 mt-1.5 pointer-events-none transition-all animate-in fade-in duration-200">
            {activePowerUps.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-md shadow-sm transition-all ${
                  p.isHarmful
                    ? 'bg-rose-950/80 border-rose-500/70 text-rose-300'
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                }`}
              >
                <span>{p.name}</span>
                {p.remainingTime !== undefined && (
                  <span className="opacity-90 font-mono text-[9px] bg-black/40 px-1 rounded-sm">
                    {p.remainingTime}s
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Gyro Feedback Toast */}
        {showGyroToast && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/60 text-cyan-300 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top duration-150">
            {showGyroToast}
          </div>
        )}
      </header>

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col items-center text-center shadow-xl">
            <h3 className="text-xl font-black text-white mb-1">OYUN DURAKLATILDI</h3>
            <p className="text-xs text-slate-400 mb-5">Çember seni bekliyor</p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                id="resume-game-btn"
                onClick={onResume}
                className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] hover:bg-cyan-300"
              >
                <Play className="w-4 h-4 fill-current" />
                DEVAM ET
              </button>

              <button
                id="restart-game-btn"
                onClick={onRestart}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                YENİDEN BAŞLAT
              </button>

              <button
                id="quit-game-btn"
                onClick={onQuit}
                className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Home className="w-3.5 h-3.5" />
                ANA MENÜYE DÖN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
