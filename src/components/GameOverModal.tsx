import React, { useState } from 'react';
import { RotateCcw, Home, Trophy, Flame, Sparkles, Clock, Target, Zap, ChevronRight, Map, Award, Star, Crown, ShoppingBag } from 'lucide-react';
import { GameScore, GameStats, CountryTeam, TournamentMatch, GameDifficulty } from '../types';
import { DifficultyBadge } from '../adventureData';
import { ShopModal } from './ShopModal';
import { CountryFlag } from './CountryFlag';

export const DIFFICULTY_NAMES: Record<
  GameDifficulty,
  { current: string; next: GameDifficulty | null; nextName: string }
> = {
  easiest: {
    current: 'Easiest (Acemi)',
    next: 'easy',
    nextName: 'Easy (Kolay)',
  },
  easy: {
    current: 'Easy (Kolay)',
    next: 'casual',
    nextName: 'Casual (Dengeli)',
  },
  casual: {
    current: 'Casual (Dengeli)',
    next: 'pro',
    nextName: 'Pro (Zor)',
  },
  pro: {
    current: 'Pro (Zor)',
    next: 'chaos',
    nextName: 'Chaos (Kozmik Kaos)',
  },
  chaos: {
    current: 'Chaos (Kozmik Kaos)',
    next: null,
    nextName: '',
  },
};

interface GameOverModalProps {
  score: GameScore;
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  isAdventureMode?: boolean;
  difficulty?: GameDifficulty;
  currentStageId?: number;
  stageTitle?: string;
  hasNextStage?: boolean;
  nextStageTitle?: string;
  onNextStage?: () => void;
  onStartNextDifficulty?: (nextDiff: GameDifficulty) => void;
  onOpenRoadmap?: () => void;
  unlockedBadge?: DifficultyBadge | null;
  // Tournament Mode props
  isTournamentMode?: boolean;
  playerTeam?: CountryTeam | null;
  opponentTeam?: CountryTeam | null;
  tournamentMatch?: TournamentMatch | null;
  onNextTournamentMatch?: () => void;
  onOpenTournamentRoadmap?: () => void;
  hasNextTournamentMatch?: boolean;
  isChampion?: boolean;
  // Multiplayer Mode props
  isMultiplayer?: boolean;
  multiplayerRole?: 'host' | 'guest' | null;
  onRematch?: () => void;
  rematchRequested?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  stats,
  onPlayAgain,
  onMainMenu,
  isAdventureMode,
  difficulty = 'easiest',
  currentStageId,
  stageTitle,
  hasNextStage,
  nextStageTitle,
  onNextStage,
  onStartNextDifficulty,
  onOpenRoadmap,
  unlockedBadge,
  isTournamentMode,
  playerTeam,
  opponentTeam,
  tournamentMatch,
  onNextTournamentMatch,
  onOpenTournamentRoadmap,
  hasNextTournamentMatch,
  isChampion,
  isMultiplayer,
  multiplayerRole,
  onRematch,
  rematchRequested,
}) => {
  const isWinner = stats.winner === 'player';
  const isFinalAdventureStage = isAdventureMode && isWinner && (currentStageId === 30 || !hasNextStage);
  const diffInfo = DIFFICULTY_NAMES[difficulty] || DIFFICULTY_NAMES.easiest;

  const [showDifficultyPrompt, setShowDifficultyPrompt] = useState<boolean>(isFinalAdventureStage);
  const [showShopModal, setShowShopModal] = useState<boolean>(false);

  // Calculate stars in adventure mode
  const diff = score.player - score.opponent;
  const stars = score.opponent === 0 || diff >= 3 ? 3 : diff >= 2 ? 2 : 1;

  const matchHeader = isMultiplayer
    ? isWinner
      ? `🏆 ONLINE MAÇI KAZANDIN!`
      : `ONLINE MAÇI RAKİP KAZANDI`
    : isTournamentMode
    ? isChampion
      ? '🏆 DÜNYA ŞAMPİYONU!'
      : isWinner
      ? `${tournamentMatch?.matchNumber}. MAÇ KAZANILDI!`
      : `${tournamentMatch?.matchNumber}. MAÇ KAYBEDİLDİ`
    : stageTitle
    ? stageTitle
    : isWinner
    ? 'KAZANDIN!'
    : 'RAKİP KAZANDI';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col items-center text-center shadow-2xl">
        {/* Glow ambient decoration */}
        <div
          className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none ${
            isWinner ? 'bg-cyan-500' : 'bg-rose-500'
          }`}
        />

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2.5 ${
            isWinner
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {isWinner ? <Trophy className="w-3.5 h-3.5 text-amber-400" /> : <Target className="w-3.5 h-3.5 text-rose-400" />}
          <span>
            {isTournamentMode
              ? isChampion
                ? '🏆 KUPA BİZİM!'
                : isWinner
                ? 'TUR ATLANDI!'
                : 'ELENDİK'
              : isAdventureMode
              ? isWinner
                ? 'BÖLÜM GEÇİLDİ!'
                : 'BÖLÜM GEÇİLEMEDİ'
              : isWinner
              ? 'VICTORY'
              : 'MATCH COMPLETE'}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-0.5">
          {matchHeader}
        </h2>

        {/* Star Rating in Adventure Mode on Win */}
        {isAdventureMode && isWinner && (
          <div className="flex items-center gap-1 my-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < stars ? 'fill-amber-400 text-amber-400 animate-bounce' : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Tournament mode subtitle */}
        {isTournamentMode && (
          <div className="flex items-center gap-2 my-2 text-xs font-bold text-amber-300">
            <span className="flex items-center gap-1.5"><CountryFlag team={playerTeam} size="xs" shape="rounded" /> {playerTeam?.name}</span>
            <span className="text-slate-500">vs</span>
            <span className="flex items-center gap-1.5"><CountryFlag team={opponentTeam} size="xs" shape="rounded" /> {opponentTeam?.name}</span>
          </div>
        )}

        <p className="text-xs text-slate-400 mb-4">
          {isWinner
            ? isTournamentMode
              ? isChampion
                ? 'Tebrikler! 40 maçlık dünya turnuvasını tamamlayarak Şampiyonluk Kupasını kaldırdın!'
                : 'Harika galibiyet! Sıradaki milli takım rakibine karşı mücadeleye devam et.'
            : isAdventureMode
              ? 'Mükemmel refleksler! Arena aşaması başarıyla tamamlandı.'
              : 'Superior reflexes through the Çember arena!'
            : isTournamentMode
            ? 'Maçı kaybettin ama pes etme! Rövanş maçına çık veya stratejini tazele.'
            : isAdventureMode
            ? 'Bu bölümü geçmek için rakibi mağlup etmelisin. Tekrar dene!'
            : 'Good battle! Train your strikes and try again.'}
        </p>

        {/* Newly Unlocked Badge Celebration Banner! */}
        {unlockedBadge && (
          <div className="w-full p-3 mb-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-400 flex items-center justify-center text-3xl shadow">
              {unlockedBadge.icon}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                🎉 YENİ ROZET AÇILDI!
              </div>
              <div className="text-xs font-black text-white">{unlockedBadge.name}</div>
              <div className="text-[10px] text-cyan-200">{unlockedBadge.title}</div>
            </div>
          </div>
        )}

        {/* Final Score Big Display */}
        <div className="w-full py-3.5 px-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-around mb-4 shadow-inner">
          <div className="flex flex-col items-center">
            <span
              className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: playerTeam?.paddleColor || '#22d3ee' }}
            >
              {playerTeam ? (
                <>
                  <CountryFlag team={playerTeam} size="xs" shape="rounded" />
                  <span>{playerTeam.name}</span>
                </>
              ) : (
                'OYUNCU'
              )}
            </span>
            <span
              className="text-4xl font-black text-white"
              style={{ textShadow: playerTeam ? `0 0 12px ${playerTeam.glowColor}80` : undefined }}
            >
              {score.player}
            </span>
          </div>
          <div className="text-xl font-black text-slate-600">:</div>
          <div className="flex flex-col items-center">
            <span
              className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: opponentTeam?.paddleColor || '#fb7185' }}
            >
              {opponentTeam ? (
                <>
                  <CountryFlag team={opponentTeam} size="xs" shape="rounded" />
                  <span>{opponentTeam.name}</span>
                </>
              ) : (
                'RAKİP'
              )}
            </span>
            <span
              className="text-4xl font-black text-white"
              style={{ textShadow: opponentTeam ? `0 0 12px ${opponentTeam.glowColor}80` : undefined }}
            >
              {score.opponent}
            </span>
          </div>
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 gap-2 mb-5 text-left">
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Max Combo</div>
              <div className="text-xs font-extrabold text-white">{stats.maxCombo}x</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Çember Vuruşu</div>
              <div className="text-xs font-extrabold text-white">{stats.sensorHits}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Güç Toplama</div>
              <div className="text-xs font-extrabold text-white">{stats.powerUpsCollected ?? 0}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Süre</div>
              <div className="text-xs font-extrabold text-white">{Math.round(stats.matchDurationSec)}s</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Multiplayer Rematch Button */}
          {isMultiplayer ? (
            <button
              id="online-rematch-btn"
              onClick={onRematch || onPlayAgain}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:brightness-110"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>{rematchRequested ? 'RÖVANŞ İSTEĞİNİ KABUL ET' : 'RÖVANŞ MAÇI İSTE'}</span>
            </button>
          ) : isTournamentMode && isWinner && hasNextTournamentMatch && onNextTournamentMatch ? (
            <button
              id="next-tournament-match-btn"
              onClick={onNextTournamentMatch}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:brightness-110"
            >
              <span>SONRAKİ TURNUVA MAÇINA GEÇ</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : isAdventureMode && isWinner && hasNextStage && onNextStage ? (
            <button
              id="next-stage-btn"
              onClick={onNextStage}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:brightness-110"
            >
              <span>SONRAKİ BÖLÜME GEÇ</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : isFinalAdventureStage ? (
            <button
              id="next-difficulty-btn"
              onClick={() => {
                if (diffInfo.next && onStartNextDifficulty) {
                  onStartNextDifficulty(diffInfo.next);
                } else {
                  setShowDifficultyPrompt(true);
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:brightness-110 animate-pulse"
            >
              <Crown className="w-4 h-4 text-slate-950" />
              <span>{diffInfo.next ? `EVET, ${diffInfo.nextName.toUpperCase()} BAŞLA` : 'TEBRİKLER! TÜM MODLAR BİTTİ'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              id="play-again-btn"
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:brightness-110"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>{isAdventureMode || isTournamentMode ? 'MAÇI TEKRAR OYNA' : 'TEKRAR OYNA'}</span>
            </button>
          )}

          {isTournamentMode && onOpenTournamentRoadmap && (
            <button
              id="open-tournament-roadmap-btn"
              onClick={onOpenTournamentRoadmap}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] border border-amber-500/30"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>TURNUVA FİKSTÜRÜ (40 MAÇ)</span>
            </button>
          )}

          {isAdventureMode && onOpenRoadmap && (
            <button
              id="open-roadmap-btn"
              onClick={onOpenRoadmap}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] border border-cyan-500/30"
            >
              <Map className="w-4 h-4" />
              <span>MACERA YOLU</span>
            </button>
          )}

          <button
            id="gameover-open-shop-btn"
            onClick={() => setShowShopModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] border border-amber-500/40"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Mağaza 🛒 (GÜÇ / ÇUBUK AL)</span>
          </button>

          <button
            id="return-menu-btn"
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>ANA MENÜ</span>
          </button>
        </div>
      </div>

      {/* Shop Modal */}
      {showShopModal && <ShopModal onClose={() => setShowShopModal(false)} />}

      {/* 30. BÖLÜM ZAFER VE YENİ ZORLUK MODU POPUP PENCERESİ */}
      {showDifficultyPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-300 select-none">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400/80 p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.35)]">
            {/* Crown decoration icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl mb-4 animate-bounce">
              <Crown className="w-9 h-9 stroke-[2.5]" />
            </div>

            {/* Sub-badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/50 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>30. BÖLÜM ŞAMPİYONLUĞU</span>
            </div>

            {/* Main Title & Message */}
            <h3 className="text-lg font-black text-white leading-snug mb-3">
              {diffInfo.current} modunda tüm bölümleri başarıyla tamamladınız tebrikler!
            </h3>

            <p className="text-sm font-semibold text-slate-300 mb-6 px-1">
              {diffInfo.next ? (
                <span>Bir sonraki zorluk moduna geçmeye hazır mısınız?</span>
              ) : (
                <span>Tüm zorluk seviyelerini bitirdiniz, ÇEMBER evreninin nihai efsanesi oldunuz!</span>
              )}
            </p>

            {/* Confirmation Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              {diffInfo.next && onStartNextDifficulty ? (
                <button
                  id="accept-next-difficulty-btn"
                  onClick={() => {
                    setShowDifficultyPrompt(false);
                    onStartNextDifficulty(diffInfo.next!);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.98] transition"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Evet {diffInfo.nextName} modunda başla</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  id="restart-first-difficulty-btn"
                  onClick={() => {
                    setShowDifficultyPrompt(false);
                    onStartNextDifficulty?.('easiest');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.98] transition"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>Tekrar Easiest (Acemi) Modunda Başla</span>
                </button>
              )}

              <button
                id="decline-next-difficulty-btn"
                onClick={() => setShowDifficultyPrompt(false)}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.98] transition"
              >
                <span>Hayır, teşekkürler</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
