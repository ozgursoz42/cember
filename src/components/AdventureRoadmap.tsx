import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Lock, CheckCircle2, Star, Trophy, Award, Sparkles, ChevronRight, RotateCcw, ShoppingBag } from 'lucide-react';
import { GameDifficulty } from '../types';
import {
  ADVENTURE_STAGES,
  DIFFICULTY_BADGES,
  StageTheme,
  StageProgress,
  getAdventureProgress,
  getUnlockedBadges,
} from '../adventureData';
import { soundEngine } from '../utils/audio';
import { ShopModal } from './ShopModal';

interface AdventureRoadmapProps {
  difficulty: GameDifficulty;
  onSelectDifficulty: (diff: GameDifficulty) => void;
  onStartStage: (stage: StageTheme) => void;
  onBackToMenu: () => void;
  activeStageId?: number;
}

export const AdventureRoadmap: React.FC<AdventureRoadmapProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartStage,
  onBackToMenu,
  activeStageId = 1,
}) => {
  const [progress, setProgress] = useState<StageProgress[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<number>(activeStageId);
  const [unlockedBadges, setUnlockedBadges] = useState<Record<string, boolean>>({});
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [showShopModal, setShowShopModal] = useState<boolean>(false);

  useEffect(() => {
    const list = getAdventureProgress(difficulty);
    setProgress(list);
    setUnlockedBadges(getUnlockedBadges());

    // Auto-select the latest unlocked incomplete stage, or stage 1
    const firstIncomplete = list.find((s) => s.unlocked && !s.completed);
    if (firstIncomplete) {
      setSelectedStageId(firstIncomplete.stageId);
    } else {
      setSelectedStageId(1);
    }
  }, [difficulty]);

  const selectedStage = ADVENTURE_STAGES.find((s) => s.id === selectedStageId) || ADVENTURE_STAGES[0];
  const selectedStageProg = progress.find((p) => p.stageId === selectedStageId);
  const isSelectedUnlocked = selectedStageProg?.unlocked ?? false;

  const handleStageClick = (stage: StageTheme) => {
    const p = progress.find((item) => item.stageId === stage.id);
    if (p?.unlocked) {
      soundEngine.playClick();
      setSelectedStageId(stage.id);
    }
  };

  const handleStart = () => {
    if (isSelectedUnlocked) {
      soundEngine.playClick();
      onStartStage(selectedStage);
    }
  };

  const currentBadge = DIFFICULTY_BADGES[difficulty];
  const isCurrentBadgeUnlocked = unlockedBadges[difficulty];

  // Calculate difficulty display labels
  const diffLabels: Record<GameDifficulty, { label: string; tr: string; color: string }> = {
    easiest: { label: 'Easiest', tr: 'Acemi', color: 'text-emerald-300' },
    easy: { label: 'Easy', tr: 'Kolay', color: 'text-teal-300' },
    casual: { label: 'Casual', tr: 'Dengeli', color: 'text-cyan-300' },
    pro: { label: 'Pro', tr: 'Usta', color: 'text-amber-400' },
    chaos: { label: 'Chaos', tr: 'Kaos', color: 'text-rose-400' },
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-hidden z-20">
      {/* Top Bar Navigation */}
      <div className="w-full flex items-center justify-between pt-1 pb-2 border-b border-slate-800/80">
        <button
          id="back-to-menu-btn"
          onClick={onBackToMenu}
          aria-label="Ana Menüye Dön"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menü</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
            Macera Modu
          </span>
          <h2 className="text-base font-black text-white flex items-center gap-1.5">
            <span>ARENA YOLU</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Shop Modal button */}
          <button
            id="adventure-shop-btn"
            onClick={() => {
              soundEngine.playClick();
              setShowShopModal(true);
            }}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/30 border border-amber-500/60 text-amber-300 hover:text-white transition flex items-center gap-1 text-xs font-bold active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            title="Arena Mağazası"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-black hidden sm:inline">Mağaza</span>
          </button>

          {/* Badge showcase toggle */}
          <button
            id="badges-modal-btn"
            onClick={() => setShowBadgeModal(true)}
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold active:scale-95 ${
              isCurrentBadgeUnlocked
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono">Rozetler</span>
          </button>
        </div>
      </div>

      {/* Difficulty Tabs Bar */}
      <div className="w-full py-2">
        <div className="w-full flex items-center justify-between p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 gap-1 overflow-x-auto no-scrollbar">
          {(['easiest', 'easy', 'casual', 'pro', 'chaos'] as GameDifficulty[]).map((d) => {
            const active = difficulty === d;
            const hasBadge = unlockedBadges[d];
            return (
              <button
                key={d}
                id={`diff-tab-${d}`}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectDifficulty(d);
                }}
                className={`flex-1 min-w-[62px] py-1.5 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-0.5 relative ${
                  active
                    ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-md border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {hasBadge && <span className="text-[9px]">👑</span>}
                  <span className="capitalize">{d === 'easiest' ? 'Easiest' : d === 'easy' ? 'Easy' : d === 'casual' ? 'Casual' : d === 'pro' ? 'Pro' : 'Chaos'}</span>
                </div>
                <span className={`text-[9px] font-medium ${active ? 'text-cyan-300' : 'text-slate-500'}`}>
                  {diffLabels[d].tr}
                </span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ROADMAP GRAPHIC DISPLAY CONTAINER */}
      {/* "Macera yolu bir grafikle gösterilmeli, her bir bölüm yuvarlak içinde sayıların yazdığı ve bölümlerin altında skorların yazacağı şekilde görselleştirilmeli ve yuvarlaklar kesik çizgiyle birbirine bağlı görüntülenmeli" */}
      <div className="w-full flex items-center justify-center gap-1.5 py-1 px-2 overflow-x-auto no-scrollbar">
        {[
          { label: '1-6', start: 1 },
          { label: '7-12', start: 7 },
          { label: '13-18', start: 13 },
          { label: '19-24', start: 19 },
          { label: '25-30', start: 25 },
        ].map((chunk) => (
          <button
            key={chunk.label}
            onClick={() => {
              const el = document.getElementById(`stage-item-${chunk.start}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition"
          >
            {chunk.label}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full relative overflow-y-auto px-2 py-2 flex flex-col items-center select-none">
        <div className="relative w-full max-w-sm flex flex-col items-center py-2">
          {/* Dashed Connecting Line linking all stages */}
          <div className="absolute top-8 bottom-12 left-1/2 -translate-x-1/2 w-1 border-l-2 border-dashed border-slate-700 pointer-events-none z-0" />

          {ADVENTURE_STAGES.map((stage, index) => {
            const p = progress.find((item) => item.stageId === stage.id);
            const isUnlocked = p?.unlocked ?? false;
            const isCompleted = p?.completed ?? false;
            const isSelected = selectedStageId === stage.id;
            const isCurrent = isUnlocked && !isCompleted;

            return (
              <div
                key={stage.id}
                id={`stage-item-${stage.id}`}
                onClick={() => handleStageClick(stage)}
                className={`relative z-10 w-full flex flex-col items-center my-3.5 transition-all cursor-pointer ${
                  !isUnlocked ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'
                }`}
              >
                {/* Stage Circle with Number inside */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/30'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-cyan-600 to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-4 ring-amber-400/40 animate-pulse'
                        : isUnlocked
                        ? 'bg-slate-800 text-slate-200 ring-2 ring-slate-700'
                        : 'bg-slate-900 border border-slate-800 text-slate-600'
                    } ${isSelected ? 'scale-110 ring-cyan-400 ring-4 shadow-[0_0_22px_rgba(34,211,238,0.7)]' : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                    ) : isUnlocked ? (
                      <span className="font-mono text-xl">{stage.id}</span>
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* Stage Icon badge */}
                  <span className="absolute -top-1 -right-1 text-sm bg-slate-900/90 rounded-full p-0.5 border border-slate-800 shadow">
                    {stage.icon}
                  </span>
                </div>

                {/* Info & Score Display under the circle */}
                {/* "bölümlerin altında skorların yazacağı şekilde görselleştirilmeli" */}
                <div
                  className={`mt-2 flex flex-col items-center text-center px-3 py-1.5 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-slate-900/90 border border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/70 border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white tracking-wide">
                      {stage.shortName}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-bounce">
                        SIRADAKİ
                      </span>
                    )}
                  </div>

                  {/* Score & Stars Display */}
                  <div className="mt-0.5 flex items-center gap-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-emerald-400">
                          SKOR: {p?.playerScore} - {p?.opponentScore}
                        </span>
                        <div className="flex text-amber-400 text-[10px]">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (p?.stars || 1) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : isUnlocked ? (
                      <span className="text-[11px] font-bold text-cyan-400">
                        Oynamaya Hazır (Hedef: {stage.targetScore})
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Önceki bölümü geç
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Action Card */}
      <div className="w-full pt-2 pb-1">
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedStage.icon}</span>
              <div>
                <h4 className="text-sm font-black text-white">{selectedStage.title}</h4>
                <p className="text-[11px] text-slate-400">{selectedStage.subtitle}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Hedef Skor</span>
              <span className="text-sm font-black text-cyan-400">{selectedStage.targetScore} Puan</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            {selectedStage.description}
          </p>

          <button
            id="start-stage-btn"
            disabled={!isSelectedUnlocked}
            onClick={handleStart}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] ${
              isSelectedUnlocked
                ? 'bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 text-slate-950 hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSelectedUnlocked ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{selectedStageProg?.completed ? 'BÖLÜMÜ TEKRAR OYNA' : 'BÖLÜMÜ BAŞLAT'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>KİLİTLİ BÖLÜM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Badges Trophy Showcase Modal */}
      {showBadgeModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">ZORLUK ROZETLERİ</h3>
              </div>
              <button
                id="close-badge-modal-btn"
                onClick={() => setShowBadgeModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 my-2.5">
              Her zorluk modunda 30 bölümü de tamamladığında o zorluğun efsanevi rozeti açılır:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(['easiest', 'easy', 'casual', 'pro', 'chaos'] as GameDifficulty[]).map((d) => {
                const badge = DIFFICULTY_BADGES[d];
                const isUnlocked = unlockedBadges[d];

                return (
                  <div
                    key={d}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      isUnlocked
                        ? `${badge.bgColor} ${badge.borderColor} shadow-[0_0_15px_rgba(245,158,11,0.2)]`
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border ${
                        isUnlocked ? badge.borderColor : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{badge.name}</span>
                        {isUnlocked ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            KAZANILDI
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Kilitli
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-cyan-300">{badge.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{badge.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              id="close-badge-action-btn"
              onClick={() => setShowBadgeModal(false)}
              className="mt-3.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              KAPAT
            </button>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShopModal && <ShopModal onClose={() => setShowShopModal(false)} />}
    </div>
  );
};
