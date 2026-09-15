import React, { useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, Shield, Zap, Flame, Trophy, Info, X, Map, Award, Feather, Sparkles, Globe, Users, Maximize2, Minimize2, Smartphone, ShoppingBag, Star } from 'lucide-react';
import { GameDifficulty } from '../types';
import { DIFFICULTY_BADGES, getAdventureProgress, getUnlockedBadges, ADVENTURE_STAGES } from '../adventureData';
import { isFullscreen, toggleFullscreen } from '../utils/fullscreen';
import { gyroController, GyroState } from '../utils/gyroscope';
import { soundEngine } from '../utils/audio';
import { ShopModal } from './ShopModal';

interface MainMenuProps {
  onStartGame: (difficulty: GameDifficulty) => void;
  onStartAdventure: () => void;
  onStartTournament: () => void;
  onStartMultiplayer: () => void;
  difficulty: GameDifficulty;
  setDifficulty: (diff: GameDifficulty) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  bestCombo: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onStartAdventure,
  onStartTournament,
  onStartMultiplayer,
  difficulty,
  setDifficulty,
  isMuted,
  onToggleMute,
  bestCombo,
}) => {
  const [showPowerUpGuide, setShowPowerUpGuide] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [inFullscreen, setInFullscreen] = useState(false);
  const [gyroState, setGyroState] = useState<GyroState>(gyroController.getState());
  const [gyroMessage, setGyroMessage] = useState<string>('');

  useEffect(() => {
    const unsub = gyroController.subscribe(setGyroState);
    const handleFs = () => setInFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFs);
      document.removeEventListener('webkitfullscreenchange', handleFs);
    };
  }, []);

  const handleToggleFs = async () => {
    soundEngine.playClick();
    const ok = await toggleFullscreen();
    setInFullscreen(ok);
  };

  const handleToggleGyro = async () => {
    soundEngine.playClick();
    if (gyroState.isEnabled) {
      gyroController.disable();
      setGyroMessage('Jiroskop kapatıldı');
    } else {
      const ok = await gyroController.requestPermissionAndEnable();
      if (ok) {
        gyroController.calibrate();
        setGyroMessage('📱 Jiroskop Aktif! Telefonu eğerek oynayabilirsiniz.');
      } else {
        setGyroMessage('Jiroskop desteklenmiyor veya izin verilmedi.');
      }
    }
    setTimeout(() => setGyroMessage(''), 2500);
  };

  const progress = getAdventureProgress(difficulty);
  const completedCount = progress.filter((s) => s.completed).length;
  const unlockedBadges = getUnlockedBadges();

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-3 sm:p-4 max-w-md mx-auto select-none overflow-y-auto overflow-x-hidden z-20">
      {/* Top Bar: Mute, Gyro, Fullscreen, Badges, Power-ups Info & Best Record */}
      <div className="w-full flex items-center justify-between pt-0.5 sm:pt-1 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] sm:text-xs font-semibold text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>BEST: {bestCombo}x</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Gyro quick toggle */}
          <button
            id="menu-gyro-btn"
            onClick={handleToggleGyro}
            aria-label="Jiroskop Eğim Kontrolü"
            className={`p-1.5 sm:p-2 rounded-full border transition active:scale-95 flex items-center gap-1 text-xs font-bold ${
              gyroState.isEnabled
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={gyroState.isEnabled ? 'Jiroskop: Açık' : 'Jiroskop: Kapalı'}
          >
            <Smartphone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${gyroState.isEnabled ? 'rotate-12 animate-pulse' : ''}`} />
          </button>

          {/* Fullscreen button */}
          <button
            id="menu-fullscreen-btn"
            onClick={handleToggleFs}
            aria-label="Tam Ekran"
            className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition active:scale-95"
            title="Tam Ekran Modu"
          >
            {inFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            id="badges-modal-btn"
            onClick={() => setShowBadgesModal(true)}
            aria-label="Rozetler ve Başarılar"
            className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 border border-slate-800 text-amber-400 hover:text-amber-300 hover:border-slate-700 transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="Kazanılan Rozetler"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[11px] hidden sm:inline">Rozetler</span>
          </button>

          <button
            id="shop-modal-btn"
            onClick={() => {
              soundEngine.playClick();
              setShowShopModal(true);
            }}
            aria-label="Mağaza"
            className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/30 border border-amber-400/60 text-amber-300 hover:text-white transition active:scale-95 flex items-center gap-1 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]"
            title="Arena Mağazası"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] font-black hidden sm:inline">Mağaza</span>
          </button>

          <button
            id="power-up-guide-btn"
            onClick={() => setShowPowerUpGuide(true)}
            aria-label="Güç öğeleri rehberi"
            className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 hover:text-white hover:border-slate-700 transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="Arena Güçleri"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] hidden sm:inline">Güçler</span>
          </button>

          <button
            id="sound-toggle-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition active:scale-95"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Gyro Toast Message */}
      {gyroMessage && (
        <div className="w-full mt-1.5 px-3 py-1 rounded-xl bg-slate-900/95 border border-cyan-500/60 text-cyan-300 text-xs font-bold text-center shadow-lg animate-in fade-in duration-150">
          {gyroMessage}
        </div>
      )}

      {/* Center Hero: Animated ÇEMBER Logo & Visual Motif */}
      <div className="flex flex-col items-center justify-center my-auto py-1 sm:py-2">
        {/* Animated Sensor Emblem */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1.5 sm:mb-2">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-amber-400/20 to-rose-500/20 blur-xl animate-pulse" />
          
          {/* Rotating Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60 animate-[spin_10s_linear_infinite]" />
          
          {/* Counter-rotating Middle Ring with Sensor Beads */}
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-[spin_6s_linear_infinite_reverse]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>

          {/* Inner Glowing Center Çember */}
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-950/80 flex items-center justify-center border border-amber-300/60">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 drop-shadow-sm">
          ÇEMBER
        </h1>
        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
          The Kinetic Sensor Arena
        </p>

        {/* 5-Tier Difficulty Selector (Easiest, Easy, Casual, Pro, Chaos) */}
        <div className="mt-3 sm:mt-4 w-full flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            ZORLUK SEVİYESİ
          </span>
          <div className="flex items-center justify-center gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 w-full max-w-full overflow-x-hidden flex-wrap sm:flex-nowrap">
            <button
              id="difficulty-easiest-btn"
              onClick={() => setDifficulty('easiest')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all ${
                difficulty === 'easiest'
                  ? 'bg-sky-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Feather className="w-3 h-3" />
              Easiest
            </button>
            <button
              id="difficulty-easy-btn"
              onClick={() => setDifficulty('easy')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all ${
                difficulty === 'easy'
                  ? 'bg-teal-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Easy
            </button>
            <button
              id="difficulty-casual-btn"
              onClick={() => setDifficulty('casual')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all ${
                difficulty === 'casual'
                  ? 'bg-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              Casual
            </button>
            <button
              id="difficulty-pro-btn"
              onClick={() => setDifficulty('pro')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all ${
                difficulty === 'pro'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              Pro
            </button>
            <button
              id="difficulty-chaos-btn"
              onClick={() => setDifficulty('chaos')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all ${
                difficulty === 'chaos'
                  ? 'bg-rose-500 text-white shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              Chaos
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Modes CTA & Quick How-To */}
      <div className="w-full flex flex-col items-center gap-2.5 pb-2">
        {/* Quick Rules Pills */}
        <div className="w-full grid grid-cols-3 gap-1.5 text-center text-[10px] font-medium text-slate-400">
          <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <span className="block font-bold text-cyan-400">SMASH</span>
            İleri hızla vur
          </div>
          <div className="p-1.5 rounded-xl bg-slate-900/60 border border-amber-500/40 bg-amber-500/10">
            <span className="block font-bold text-amber-400">🟨 🟥 KARTLAR</span>
            2 Aşırı Sert: Kart!
          </div>
          <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <span className="block font-bold text-rose-400">GÜÇLER</span>
            Sağdan fırlatılır
          </div>
        </div>

        {/* PRIMARY 1: ONLINE KARŞILIKLI MOD (P2P PVP) */}
        <button
          id="online-multiplayer-mode-btn"
          onClick={onStartMultiplayer}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-sm tracking-wider flex items-center justify-between shadow-[0_0_22px_rgba(168,85,247,0.35)] active:scale-[0.98] transition hover:brightness-110"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-950/30 flex items-center justify-center text-lg shadow-inner">
              <Users className="w-4 h-4 text-purple-200" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                <span>ONLINE KARŞILIKLI OYNA</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-400 text-slate-950 font-black animate-pulse">2 OYUNCU</span>
              </div>
              <div className="text-[10px] font-semibold text-purple-100">
                Oda Aç / Kodla Katıl • Gerçek Zamanlı PvP
              </div>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-pink-300 fill-pink-400/30" />
        </button>

        {/* PRIMARY 2: TURNUVA MODU (40 ÜLKE) */}
        <button
          id="tournament-mode-btn"
          onClick={onStartTournament}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black text-xs tracking-wider flex items-center justify-between shadow-[0_0_20px_rgba(20,184,166,0.35)] active:scale-[0.98] transition hover:brightness-110"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-950/30 flex items-center justify-center text-base">
              🇹🇷
            </div>
            <div className="text-left">
              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                <span>DÜNYA TURNUVASI</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">40 ÜLKE</span>
              </div>
              <div className="text-[10px] font-semibold text-teal-100">
                Milli Takımlar • Bayrak Renkleri • 40 Maç
              </div>
            </div>
          </div>
          <Trophy className="w-4 h-4 text-amber-300 fill-amber-400/30" />
        </button>

        {/* PRIMARY 3: MACERA MODU BUTTON */}
        <button
          id="adventure-mode-btn"
          onClick={onStartAdventure}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white font-black text-xs tracking-wider flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-[0.98] transition hover:brightness-110"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-950/30 flex items-center justify-center">
              <Map className="w-4 h-4 text-amber-200" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black leading-tight">MACERA MODU</div>
              <div className="text-[10px] font-semibold text-amber-200">
                30 Bölüm • Saha Temaları • Rozetler
              </div>
            </div>
          </div>
          <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded-lg font-bold">
            {completedCount}/{ADVENTURE_STAGES.length}
          </span>
        </button>

        {/* MAĞAZA (SHOP) BUTTON */}
        <button
          id="menu-open-shop-btn"
          onClick={() => {
            soundEngine.playClick();
            setShowShopModal(true);
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs tracking-wider flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] transition hover:brightness-110"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-950/25 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                <span>Arena Mağazası 🛒</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 font-black">YILDIZ HARCA</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-900/90">
                Çubuk Kaplamaları • Avantajlar & Engeller
              </div>
            </div>
          </div>
          <Star className="w-4 h-4 text-slate-950 fill-current" />
        </button>

        {/* SECONDARY: HIZLI MAÇ BUTTON */}
        <button
          id="start-game-btn"
          onClick={() => onStartGame(difficulty)}
          className="w-full py-2 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-700/80 active:scale-[0.98] transition"
        >
          <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>HIZLI MAÇ ({difficulty.toUpperCase()})</span>
        </button>
      </div>

      {/* Badges Showcase Modal */}
      {showBadgesModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="relative w-full max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">ROZET ÖDÜLLERİ</h3>
              </div>
              <button
                id="close-badges-btn"
                onClick={() => setShowBadgesModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 my-2">
              Bölümleri hangi zorluk modunda tamamlarsanız o zorluğa özel prestijli rozet kazanırsınız:
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs">
              {(Object.keys(DIFFICULTY_BADGES) as GameDifficulty[]).map((diff) => {
                const b = DIFFICULTY_BADGES[diff];
                const p = getAdventureProgress(diff);
                const diffDone = p.filter((s) => s.completed).length;
                const isEarned = !!unlockedBadges[diff] || diffDone === ADVENTURE_STAGES.length;

                return (
                  <div
                    key={diff}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      isEarned
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border ${
                        isEarned
                          ? 'bg-amber-900/60 border-amber-400'
                          : 'bg-slate-900 border-slate-800 grayscale'
                      }`}
                    >
                      {b.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{b.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isEarned
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isEarned ? 'KAZANILDI ✓' : `${diffDone}/6 Bölüm`}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-bold">{b.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Power-ups Guide Modal */}
      {showPowerUpGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="relative w-full max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">ARENA GÜÇLERİ</h3>
              </div>
              <button
                id="close-power-guide-btn"
                onClick={() => setShowPowerUpGuide(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 my-2.5">
              Güçler sağ orta taraftan rastgele fırlatılır. Yeşil çemberdekiler faydalı, kırmızı çemberdekiler zararlıdır:
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  📏
                </div>
                <div>
                  <div className="font-bold text-emerald-400">Çubuk Uzatma (Maks 3x)</div>
                  <div className="text-[11px] text-slate-300">Her alındığında çubuk daha da uzar.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rose-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                  ✂️
                </div>
                <div>
                  <div className="font-bold text-rose-400">Çubuk Küçültme (Zararlı, Maks 1x)</div>
                  <div className="text-[11px] text-slate-300">Çubuğun boyunu yarıya indirir.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  🚀
                </div>
                <div>
                  <div className="font-bold text-cyan-400">Roket Gücü (16s)</div>
                  <div className="text-[11px] text-slate-300">İki yana roket takar; hafif vuruşta bile alevli fırlar.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  👥
                </div>
                <div>
                  <div className="font-bold text-sky-400">Multi Çubuk (20s, Maks 3x)</div>
                  <div className="text-[11px] text-slate-300">Sahada fazladan savunma çubuğu klonlar; süre bitince dağılır.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  🧊
                </div>
                <div>
                  <div className="font-bold text-cyan-300">Çember Dondurma (15s)</div>
                  <div className="text-[11px] text-slate-300">Çember 15 saniyeliğine tamamen hareketsiz donar.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  ❄️
                </div>
                <div>
                  <div className="font-bold text-blue-300">Rakip Dondurma (10s)</div>
                  <div className="text-[11px] text-slate-300">Rakibi buza hapseder. 10s sonra veya gol olunca kırılır.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  ⏳
                </div>
                <div>
                  <div className="font-bold text-purple-400">Top Yavaşlatma (10s)</div>
                  <div className="text-[11px] text-slate-300">Top yerçekimsiz uzay süzülüşüne geçer; kolay nişan alınır.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  👑
                </div>
                <div>
                  <div className="font-bold text-fuchsia-400">En Uzun Çubuk (16s)</div>
                  <div className="text-[11px] text-slate-300">Çubuğu sahanın eninin tam yarısı kadar devasa boyuta ulaştırır!</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  🧊
                </div>
                <div>
                  <div className="font-bold text-sky-300">Buz Duvarı (15s)</div>
                  <div className="text-[11px] text-slate-300">Kaleyi 15 saniyeliğine tamamen buzla kaplar, gelen topları geri püskürtür.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  🧤
                </div>
                <div>
                  <div className="font-bold text-cyan-300">Otonom Kaleci (20s)</div>
                  <div className="text-[11px] text-slate-300">Kaleye bağımsız bir yapay zeka kaleci geçer ve gelen golleri otomatik kurtarır.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-amber-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  ✨
                </div>
                <div>
                  <div className="font-bold text-amber-400">Çember Bölünmesi (Süreye Bağlı)</div>
                  <div className="text-[11px] text-slate-300">Golden 10s sonra çember 2&apos;ye, 20s sonra 4&apos;e bölünerek çoğalır. Gol olunca sıfırlanır.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  ☄️
                </div>
                <div>
                  <div className="font-bold text-orange-400">Ateş Topu (18s)</div>
                  <div className="text-[11px] text-slate-300">Vurulan top çemberi yakar, rakibi delip kaleye girer.</div>
                </div>
              </div>
            </div>

            <button
              id="close-guide-action-btn"
              onClick={() => setShowPowerUpGuide(false)}
              className="mt-3.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              ANLADIM
            </button>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShopModal && <ShopModal onClose={() => setShowShopModal(false)} />}
    </div>
  );
};
