import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Lock, CheckCircle2, Trophy, Shield, Sparkles, RotateCcw, AlertTriangle } from 'lucide-react';
import { CountryTeam, GameDifficulty, TournamentMatch, TournamentProgress } from '../types';
import {
  TOURNAMENT_COUNTRIES,
  generateTournamentSchedule,
  getTournamentProgress,
  saveTournamentProgress,
  resetTournamentProgress,
} from '../data/tournamentData';
import { soundEngine } from '../utils/audio';
import { CountryFlag } from './CountryFlag';

interface TournamentRoadmapProps {
  playerTeam: CountryTeam;
  onStartMatch: (match: TournamentMatch, playerTeam: CountryTeam) => void;
  onBackToMenu: () => void;
  onChangeTeam: () => void;
}

export const TournamentRoadmap: React.FC<TournamentRoadmapProps> = ({
  playerTeam,
  onStartMatch,
  onBackToMenu,
  onChangeTeam,
}) => {
  const [schedule, setSchedule] = useState<TournamentMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    let progress = getTournamentProgress();
    if (!progress || progress.playerTeamId !== playerTeam.id) {
      // Generate new schedule
      const newMatches = generateTournamentSchedule(playerTeam.id);
      progress = {
        playerTeamId: playerTeam.id,
        currentMatchIndex: 0,
        completedMatches: 0,
        isChampion: false,
        matches: newMatches.map((m) => ({
          matchNumber: m.matchNumber,
          opponentId: m.opponentTeam.id,
          playerScore: 0,
          opponentScore: 0,
          completed: false,
        })),
      };
      saveTournamentProgress(progress);
      setSchedule(newMatches);
      setCurrentMatchIndex(0);
    } else {
      // Map progress to schedule using saved opponent sequence
      const savedOpponentIds = progress.matches?.map((m) => m.opponentId);
      const fullSchedule = generateTournamentSchedule(playerTeam.id, savedOpponentIds);
      const updatedSchedule = fullSchedule.map((m, idx) => {
        const savedMatch = progress?.matches[idx];
        return {
          ...m,
          completed: savedMatch?.completed ?? false,
          playerScore: savedMatch?.playerScore,
          opponentScore: savedMatch?.opponentScore,
        };
      });
      setSchedule(updatedSchedule);
      setCurrentMatchIndex(progress.currentMatchIndex);
    }
  }, [playerTeam]);

  const activeMatch = schedule[currentMatchIndex] || schedule[0];

  const handleStart = () => {
    if (activeMatch) {
      soundEngine.playClick();
      onStartMatch(activeMatch, playerTeam);
    }
  };

  const handleReset = () => {
    resetTournamentProgress();
    const newMatches = generateTournamentSchedule(playerTeam.id);
    const progress: TournamentProgress = {
      playerTeamId: playerTeam.id,
      currentMatchIndex: 0,
      completedMatches: 0,
      isChampion: false,
      matches: newMatches.map((m) => ({
        matchNumber: m.matchNumber,
        opponentId: m.opponentTeam.id,
        playerScore: 0,
        opponentScore: 0,
        completed: false,
      })),
    };
    saveTournamentProgress(progress);
    setSchedule(newMatches);
    setCurrentMatchIndex(0);
    setShowResetConfirm(false);
  };

  const getDifficultyBadge = (diff: GameDifficulty) => {
    switch (diff) {
      case 'easiest':
        return { label: 'Easiest (Acemi)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'easy':
        return { label: 'Easy (Eleme)', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'casual':
      default:
        return { label: 'Casual (Şampiyonluk)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-hidden z-20">
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between pt-1 pb-2 border-b border-slate-800/80">
        <button
          id="tournament-back-menu-btn"
          onClick={onBackToMenu}
          aria-label="Ana Menüye Dön"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menü</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            40 MAÇLIK ŞAMPİYONLUK
          </span>
          <h2 className="text-sm font-black text-white flex items-center gap-1.5">
            <CountryFlag team={playerTeam} size="sm" shape="rounded" />
            <span>{playerTeam.name}</span>
          </h2>
        </div>

        <button
          id="change-team-btn"
          onClick={onChangeTeam}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-400 hover:text-amber-300 transition text-[11px] font-bold"
        >
          Takım Değiş
        </button>
      </div>

      {/* Progress & Current Match Hero Header */}
      <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex items-center justify-center">
            <CountryFlag team={playerTeam} size="lg" shape="rounded" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{playerTeam.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {currentMatchIndex + 1} / 40. Maç
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentMatchIndex >= 40 ? '🏆 DÜNYA ŞAMPİYONU!' : `Sıradaki: ${activeMatch?.opponentTeam.name || ''}`}
            </div>
          </div>
        </div>

        <button
          id="reset-tournament-prompt-btn"
          onClick={() => setShowResetConfirm(true)}
          className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
          title="Turnuvayı Sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Match Ladder List (Scrollable) */}
      <div className="w-full flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[44vh]">
        {schedule.map((match, idx) => {
          const isCompleted = match.completed;
          const isCurrent = idx === currentMatchIndex;
          const isLocked = idx > currentMatchIndex;
          const diffBadge = getDifficultyBadge(match.difficulty);
          const isFinal = match.matchNumber === 40;

          return (
            <div
              key={match.matchNumber}
              id={`tournament-match-${match.matchNumber}`}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : isCompleted
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : match.matchNumber}
                </div>

                <div className="flex items-center gap-2.5">
                  <CountryFlag team={match.opponentTeam} size="md" shape="rounded" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>vs {match.opponentTeam.name}</span>
                      {isFinal && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-extrabold border border-amber-400/50">
                          🏆 FİNAL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${diffBadge.color}`}>
                        {diffBadge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status or Score */}
              <div>
                {isCompleted ? (
                  <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/30">
                    {match.playerScore} - {match.opponentScore}
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 animate-pulse bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                    Sıradaki Maç
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected / Current Match Action Bar */}
      <div className="w-full pt-2">
        {currentMatchIndex < 40 ? (
          <button
            id="start-tournament-match-btn"
            onClick={handleStart}
            className="w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 text-slate-950 hover:brightness-110"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{currentMatchIndex + 1}. MAÇI BAŞLAT (vs {activeMatch?.opponentTeam.name})</span>
          </button>
        ) : (
          <div className="w-full p-3 rounded-xl bg-amber-500/20 border border-amber-400 text-center">
            <h3 className="text-sm font-black text-amber-300 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" /> KUPAYI KAZANDINIZ! DÜNYA ŞAMPİYONU!
            </h3>
            <button
              onClick={handleReset}
              className="mt-2 text-xs font-bold text-slate-300 underline hover:text-white"
            >
              Turnuvayı Yeniden Başlat
            </button>
          </div>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-xs p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center shadow-2xl">
            <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Turnuvayı Sıfırla?</h4>
            <p className="text-xs text-slate-400 mb-3">
              Mevcut turnuva ilerlemeniz silinecek ve 1. maçtan başlayacaksınız.
            </p>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
