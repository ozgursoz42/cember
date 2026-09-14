import React from 'react';
import { RotateCcw, Home, Trophy, Flame, Sparkles, Clock, Target, Zap, ChevronRight, Map, Award, Star } from 'lucide-react';
import { GameScore, GameStats, CountryTeam, TournamentMatch } from '../types';
import { DifficultyBadge } from '../adventureData';

interface GameOverModalProps {
  score: GameScore;
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  isAdventureMode?: boolean;
  stageTitle?: string;
  hasNextStage?: boolean;
  nextStageTitle?: string;
  onNextStage?: () => void;
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
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  stats,
  onPlayAgain,
  onMainMenu,
  isAdventureMode,
  stageTitle,
  hasNextStage,
  nextStageTitle,
  onNextStage,
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
}) => {
  const isWinner = stats.winner === 'player';

  // Calculate stars in adventure mode
  const diff = score.player - score.opponent;
  const stars = score.opponent === 0 || diff >= 3 ? 3 : diff >= 2 ? 2 : 1;

  const matchHeader = isTournamentMode
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
            <span>{playerTeam?.flag} {playerTeam?.name}</span>
            <span className="text-slate-500">vs</span>
            <span>{opponentTeam?.flag} {opponentTeam?.name}</span>
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
              className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1"
              style={{ color: playerTeam?.paddleColor || '#22d3ee' }}
            >
              {playerTeam ? `${playerTeam.flag} ${playerTeam.name}` : 'OYUNCU'}
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
              className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1"
              style={{ color: opponentTeam?.paddleColor || '#fb7185' }}
            >
              {opponentTeam ? `${opponentTeam.flag} ${opponentTeam.name}` : 'RAKİP'}
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
          {/* Tournament Next Match Button */}
          {isTournamentMode && isWinner && hasNextTournamentMatch && onNextTournamentMatch ? (
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
            id="return-menu-btn"
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>ANA MENÜ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
