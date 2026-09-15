import React, { useState, useEffect, useCallback } from 'react';
import { GameScreen, GameDifficulty, GameScore, GameStats, ActivePowerUpStatus, CountryTeam, TournamentMatch, CardPenaltyState } from './types';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { AdventureRoadmap } from './components/AdventureRoadmap';
import { TournamentSelect } from './components/TournamentSelect';
import { TournamentRoadmap } from './components/TournamentRoadmap';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerManager } from './utils/multiplayer';
import {
  ADVENTURE_STAGES,
  DifficultyBadge,
  StageTheme,
  saveStageProgress,
} from './adventureData';
import {
  TOURNAMENT_COUNTRIES,
  getTournamentProgress,
  saveTournamentProgress,
  generateTournamentSchedule,
} from './data/tournamentData';
import { soundEngine } from './utils/audio';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('casual');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bestCombo, setBestCombo] = useState<number>(0);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUpStatus[]>([]);

  // Adventure mode tracking
  const [isAdventureMode, setIsAdventureMode] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<StageTheme | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<DifficultyBadge | null>(null);

  // Tournament mode tracking
  const [isTournamentMode, setIsTournamentMode] = useState<boolean>(false);
  const [playerTeam, setPlayerTeam] = useState<CountryTeam | null>(null);
  const [currentTournamentMatch, setCurrentTournamentMatch] = useState<TournamentMatch | null>(null);

  // Multiplayer mode tracking
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [multiplayerRole, setMultiplayerRole] = useState<'host' | 'guest' | null>(null);
  const [multiplayerManager, setMultiplayerManager] = useState<MultiplayerManager | null>(null);
  const [multiplayerOpponentTeam, setMultiplayerOpponentTeam] = useState<CountryTeam | null>(null);
  const [multiplayerRematchPending, setMultiplayerRematchPending] = useState<boolean>(false);

  const [cardState, setCardState] = useState<CardPenaltyState>({
    playerYellowCards: 0,
    playerIsEjected: false,
    opponentYellowCards: 0,
    opponentIsEjected: false,
    playerHardStrikes: 0,
    opponentHardStrikes: 0,
  });

  const [score, setScore] = useState<GameScore>({
    player: 0,
    opponent: 0,
    targetScore: 5,
  });

  const [combo, setCombo] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);

  const [stats, setStats] = useState<GameStats>({
    maxCombo: 0,
    totalVolleys: 0,
    sensorHits: 0,
    matchDurationSec: 0,
    winner: null,
  });

  // Load best combo from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cember_best_combo');
      if (saved) {
        setBestCombo(parseInt(saved, 10) || 0);
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Quick Match Start
  const handleStartGame = useCallback((chosenDiff: GameDifficulty) => {
    soundEngine.playClick();
    setDifficulty(chosenDiff);
    setIsAdventureMode(false);
    setIsTournamentMode(false);
    setCurrentStage(null);
    setCurrentTournamentMatch(null);
    setUnlockedBadge(null);
    setCardState({
      playerYellowCards: 0,
      playerIsEjected: false,
      opponentYellowCards: 0,
      opponentIsEjected: false,
      playerHardStrikes: 0,
      opponentHardStrikes: 0,
    });
    setScore({
      player: 0,
      opponent: 0,
      targetScore: 5,
    });
    setCombo(0);
    setRallyCount(0);
    setActivePowerUps([]);
    setIsPaused(false);
    setScreen('playing');
  }, []);

  // Open Adventure Roadmap
  const handleStartAdventure = useCallback(() => {
    soundEngine.playClick();
    setIsAdventureMode(true);
    setIsTournamentMode(false);
    setUnlockedBadge(null);
    setScreen('adventure_roadmap');
  }, []);

  // Open Tournament Flow
  const handleStartTournament = useCallback(() => {
    soundEngine.playClick();
    setIsTournamentMode(true);
    setIsAdventureMode(false);
    setCurrentStage(null);

    const progress = getTournamentProgress();
    if (progress && progress.playerTeamId) {
      const team = TOURNAMENT_COUNTRIES.find((c) => c.id === progress.playerTeamId) || TOURNAMENT_COUNTRIES[0];
      setPlayerTeam(team);
      setScreen('tournament_roadmap');
    } else {
      setScreen('tournament_select');
    }
  }, []);

  const handleSelectTeam = useCallback((team: CountryTeam) => {
    soundEngine.playClick();
    setPlayerTeam(team);
    setScreen('tournament_roadmap');
  }, []);

  // Start specific stage from Adventure Roadmap
  const handleStartStage = useCallback((stage: StageTheme) => {
    soundEngine.playClick();
    setIsAdventureMode(true);
    setIsTournamentMode(false);
    setCurrentStage(stage);
    setCurrentTournamentMatch(null);
    setUnlockedBadge(null);
    setCardState({
      playerYellowCards: 0,
      playerIsEjected: false,
      opponentYellowCards: 0,
      opponentIsEjected: false,
      playerHardStrikes: 0,
      opponentHardStrikes: 0,
    });
    setScore({
      player: 0,
      opponent: 0,
      targetScore: stage.targetScore,
    });
    setCombo(0);
    setRallyCount(0);
    setActivePowerUps([]);
    setIsPaused(false);
    setScreen('playing');
  }, []);

  // Start specific match from Tournament Roadmap
  const handleStartTournamentMatch = useCallback((match: TournamentMatch, team: CountryTeam) => {
    soundEngine.playClick();
    setIsTournamentMode(true);
    setIsAdventureMode(false);
    setCurrentStage(null);
    setPlayerTeam(team);
    setCurrentTournamentMatch(match);
    setDifficulty(match.difficulty);
    setCardState({
      playerYellowCards: 0,
      playerIsEjected: false,
      opponentYellowCards: 0,
      opponentIsEjected: false,
      playerHardStrikes: 0,
      opponentHardStrikes: 0,
    });
    setScore({
      player: 0,
      opponent: 0,
      targetScore: 5,
    });
    setCombo(0);
    setRallyCount(0);
    setActivePowerUps([]);
    setIsPaused(false);
    setScreen('playing');
  }, []);

  const handleScoreUpdate = useCallback((newScore: GameScore) => {
    setScore(newScore);
  }, []);

  const handleGameOver = useCallback((winner: 'player' | 'opponent', finalStats: GameStats, finalScore?: GameScore) => {
    setStats(finalStats);
    setActivePowerUps([]);

    const pScore = finalScore ? finalScore.player : score.player;
    const oScore = finalScore ? finalScore.opponent : score.opponent;
    if (finalScore) {
      setScore(finalScore);
    }

    // Check adventure mode stage progression and badge unlock
    if (isAdventureMode && currentStage && winner === 'player') {
      const { newlyUnlockedBadge } = saveStageProgress(
        difficulty,
        currentStage.id,
        pScore,
        oScore,
        true
      );
      if (newlyUnlockedBadge) {
        setUnlockedBadge(newlyUnlockedBadge);
      }
    }

    // Check tournament mode progression
    if (isTournamentMode && currentTournamentMatch && playerTeam) {
      const progress = getTournamentProgress();
      if (progress) {
        const matchIdx = currentTournamentMatch.matchNumber - 1;
        progress.matches[matchIdx] = {
          matchNumber: currentTournamentMatch.matchNumber,
          opponentId: currentTournamentMatch.opponentTeam.id,
          playerScore: pScore,
          opponentScore: oScore,
          completed: winner === 'player',
        };
        if (winner === 'player') {
          progress.completedMatches = Math.max(progress.completedMatches, currentTournamentMatch.matchNumber);
          if (currentTournamentMatch.matchNumber === 40) {
            progress.isChampion = true;
          } else {
            progress.currentMatchIndex = currentTournamentMatch.matchNumber;
          }
        }
        saveTournamentProgress(progress);
      }
    }

    setScreen('gameover');

    // Update best combo
    if (finalStats.maxCombo > bestCombo) {
      setBestCombo(finalStats.maxCombo);
      try {
        localStorage.setItem('cember_best_combo', finalStats.maxCombo.toString());
      } catch {
        // ignore
      }
    }
  }, [bestCombo, isAdventureMode, currentStage, difficulty, score.player, score.opponent, isTournamentMode, currentTournamentMatch, playerTeam]);

  // Next Stage navigation in Adventure Mode
  const handleNextStage = useCallback(() => {
    if (!currentStage) return;
    const nextIdx = ADVENTURE_STAGES.findIndex((s) => s.id === currentStage.id) + 1;
    if (nextIdx < ADVENTURE_STAGES.length) {
      handleStartStage(ADVENTURE_STAGES[nextIdx]);
    } else {
      setScreen('adventure_roadmap');
    }
  }, [currentStage, handleStartStage]);

  // Next Difficulty Transition in Adventure Mode (after stage 30)
  const handleStartNextDifficulty = useCallback((nextDiff: GameDifficulty) => {
    soundEngine.playClick();
    setDifficulty(nextDiff);
    setIsAdventureMode(true);
    setIsTournamentMode(false);
    const firstStage = ADVENTURE_STAGES[0];
    handleStartStage(firstStage);
  }, [handleStartStage]);

  // Next Match navigation in Tournament Mode
  const handleNextTournamentMatch = useCallback(() => {
    if (!currentTournamentMatch || !playerTeam) return;
    const nextMatchNum = currentTournamentMatch.matchNumber + 1;
    if (nextMatchNum <= 40) {
      const progress = getTournamentProgress();
      const savedOpponentIds = progress?.matches?.map((m) => m.opponentId);
      const fullSchedule = generateTournamentSchedule(playerTeam.id, savedOpponentIds);
      const nextMatch = fullSchedule[nextMatchNum - 1];
      if (nextMatch) {
        handleStartTournamentMatch(nextMatch, playerTeam);
      } else {
        setScreen('tournament_roadmap');
      }
    } else {
      setScreen('tournament_roadmap');
    }
  }, [currentTournamentMatch, playerTeam, handleStartTournamentMatch]);

  const handlePlayAgain = useCallback(() => {
    soundEngine.playClick();
    setCardState({
      playerYellowCards: 0,
      playerIsEjected: false,
      opponentYellowCards: 0,
      opponentIsEjected: false,
      playerHardStrikes: 0,
      opponentHardStrikes: 0,
    });
    setScore({
      player: 0,
      opponent: 0,
      targetScore: currentStage ? currentStage.targetScore : 5,
    });
    setCombo(0);
    setRallyCount(0);
    setActivePowerUps([]);
    setIsPaused(false);
    setScreen('playing');
  }, [currentStage]);

  const handleQuitToMenu = useCallback(() => {
    soundEngine.playClick();
    if (multiplayerManager) {
      multiplayerManager.cleanup();
      setMultiplayerManager(null);
    }
    setIsMultiplayer(false);
    setMultiplayerRole(null);
    setMultiplayerOpponentTeam(null);
    setActivePowerUps([]);
    setIsPaused(false);
    setScreen('menu');
  }, [multiplayerManager]);

  const handleStartMultiplayer = useCallback(() => {
    soundEngine.playClick();
    setIsMultiplayer(true);
    setIsAdventureMode(false);
    setIsTournamentMode(false);
    setCurrentStage(null);
    setCurrentTournamentMatch(null);
    setScreen('multiplayer_lobby');
  }, []);

  const handleStartOnlineMatch = useCallback(
    (
      manager: MultiplayerManager,
      role: 'host' | 'guest',
      pTeam: CountryTeam,
      oppTeam: CountryTeam,
      tgtScore: number
    ) => {
      soundEngine.playWhistle();
      setIsMultiplayer(true);
      setMultiplayerManager(manager);
      setMultiplayerRole(role);
      setPlayerTeam(pTeam);
      setMultiplayerOpponentTeam(oppTeam);
      setMultiplayerRematchPending(false);
      setIsAdventureMode(false);
      setIsTournamentMode(false);
      setDifficulty('casual');

      setCardState({
        playerYellowCards: 0,
        playerIsEjected: false,
        opponentYellowCards: 0,
        opponentIsEjected: false,
        playerHardStrikes: 0,
        opponentHardStrikes: 0,
      });
      setScore({
        player: 0,
        opponent: 0,
        targetScore: tgtScore,
      });
      setCombo(0);
      setRallyCount(0);
      setActivePowerUps([]);
      setIsPaused(false);
      setScreen('playing');

      // Setup rematch listener on manager
      manager.subscribe((status, payload) => {
        const data = payload as { event?: string; data?: unknown } | undefined;
        if (data?.event === 'match_start' || data?.event === 'game_started') {
          // Restart game for rematch
          setScore({ player: 0, opponent: 0, targetScore: tgtScore });
          setCombo(0);
          setRallyCount(0);
          setActivePowerUps([]);
          setMultiplayerRematchPending(false);
          setIsPaused(false);
          setScreen('playing');
        } else if (data?.event === 'rematch_requested') {
          setMultiplayerRematchPending(true);
        }
      });
    },
    []
  );

  const handleMultiplayerRematch = useCallback(() => {
    soundEngine.playClick();
    if (!multiplayerManager) return;
    if (multiplayerRole === 'host') {
      multiplayerManager.startGame();
      setScore({ player: 0, opponent: 0, targetScore: score.targetScore });
      setCombo(0);
      setRallyCount(0);
      setActivePowerUps([]);
      setMultiplayerRematchPending(false);
      setIsPaused(false);
      setScreen('playing');
    } else {
      multiplayerManager.requestRematch();
      setMultiplayerRematchPending(true);
    }
  }, [multiplayerManager, multiplayerRole, score.targetScore]);

  const handleOpenRoadmap = useCallback(() => {
    soundEngine.playClick();
    setActivePowerUps([]);
    setIsPaused(false);
    if (isTournamentMode) {
      setScreen('tournament_roadmap');
    } else {
      setScreen('adventure_roadmap');
    }
  }, [isTournamentMode]);

  // Compute next stage info for modal
  const nextStage = isAdventureMode && currentStage
    ? ADVENTURE_STAGES.find((s) => s.id === currentStage.id + 1)
    : null;

  const tournamentProgress = isTournamentMode ? getTournamentProgress() : null;

  return (
    <main
      id="cember-app-root"
      className="relative w-full h-[100dvh] max-w-md mx-auto bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden shadow-2xl select-none"
    >
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      {/* Screen 1: Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onStartAdventure={handleStartAdventure}
          onStartTournament={handleStartTournament}
          onStartMultiplayer={handleStartMultiplayer}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          bestCombo={bestCombo}
        />
      )}

      {/* Screen 1.5: Multiplayer Lobby */}
      {screen === 'multiplayer_lobby' && (
        <MultiplayerLobby
          onBackToMenu={handleQuitToMenu}
          onStartOnlineMatch={handleStartOnlineMatch}
          initialPlayerTeam={playerTeam}
        />
      )}

      {/* Screen 2: Adventure Roadmap */}
      {screen === 'adventure_roadmap' && (
        <AdventureRoadmap
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onStartStage={handleStartStage}
          onBackToMenu={handleQuitToMenu}
          activeStageId={currentStage?.id || 1}
        />
      )}

      {/* Screen 3: Tournament Select (Country Picker) */}
      {screen === 'tournament_select' && (
        <TournamentSelect
          onSelectTeam={handleSelectTeam}
          onBackToMenu={handleQuitToMenu}
          initialSelectedId={playerTeam?.id || 'turkiye'}
        />
      )}

      {/* Screen 4: Tournament Roadmap (Schedule & 40 Matches) */}
      {screen === 'tournament_roadmap' && playerTeam && (
        <TournamentRoadmap
          playerTeam={playerTeam}
          onStartMatch={handleStartTournamentMatch}
          onBackToMenu={handleQuitToMenu}
          onChangeTeam={() => setScreen('tournament_select')}
        />
      )}

      {/* Screen 5: Gameplay */}
      {screen === 'playing' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          <GameHUD
            score={score}
            combo={combo}
            rallyCount={rallyCount}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onResume={() => setIsPaused(false)}
            onRestart={() => (
              isMultiplayer
                ? handleMultiplayerRematch()
                : currentTournamentMatch && playerTeam
                ? handleStartTournamentMatch(currentTournamentMatch, playerTeam)
                : currentStage
                ? handleStartStage(currentStage)
                : handleStartGame(difficulty)
            )}
            onQuit={isMultiplayer ? handleQuitToMenu : isTournamentMode ? () => setScreen('tournament_roadmap') : isAdventureMode ? handleOpenRoadmap : handleQuitToMenu}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            difficulty={difficulty}
            activePowerUps={activePowerUps}
            playerTeam={isMultiplayer ? playerTeam : isTournamentMode ? playerTeam : null}
            opponentTeam={isMultiplayer ? multiplayerOpponentTeam : isTournamentMode ? currentTournamentMatch?.opponentTeam : null}
            cardState={cardState}
            isMultiplayer={isMultiplayer}
            multiplayerRole={multiplayerRole}
          />

          <div className="flex-1 w-full h-full relative overflow-hidden">
            <GameCanvas
              difficulty={difficulty}
              stage={currentStage || undefined}
              isAdventureMode={isAdventureMode}
              isTournamentMode={isTournamentMode}
              isPaused={isPaused}
              score={score}
              onScoreUpdate={handleScoreUpdate}
              onGameOver={handleGameOver}
              onComboChange={setCombo}
              onRallyChange={setRallyCount}
              onActivePowerUpsChange={setActivePowerUps}
              playerTeam={isMultiplayer ? playerTeam : isTournamentMode ? playerTeam : null}
              opponentTeam={isMultiplayer ? multiplayerOpponentTeam : isTournamentMode ? currentTournamentMatch?.opponentTeam : null}
              onCardStateChange={setCardState}
              isMultiplayer={isMultiplayer}
              multiplayerRole={multiplayerRole}
              multiplayerManager={multiplayerManager}
            />
          </div>
        </div>
      )}

      {/* Screen 6: Win / Lose Result Screen */}
      {screen === 'gameover' && (
        <>
          {/* Background frozen game canvas for visual continuity */}
          <div className="flex-1 w-full h-full relative overflow-hidden filter blur-sm brightness-75">
            <GameCanvas
              difficulty={difficulty}
              stage={currentStage || undefined}
              isAdventureMode={isAdventureMode}
              isTournamentMode={isTournamentMode}
              isPaused={true}
              score={score}
              onScoreUpdate={() => {}}
              onGameOver={() => {}}
              onComboChange={() => {}}
              onRallyChange={() => {}}
              playerTeam={isMultiplayer ? playerTeam : isTournamentMode ? playerTeam : null}
              opponentTeam={isMultiplayer ? multiplayerOpponentTeam : isTournamentMode ? currentTournamentMatch?.opponentTeam : null}
            />
          </div>

          <GameOverModal
            score={score}
            stats={stats}
            isAdventureMode={isAdventureMode}
            difficulty={difficulty}
            currentStageId={currentStage?.id}
            stageTitle={currentStage?.title}
            hasNextStage={!!nextStage}
            nextStageTitle={nextStage?.title}
            onNextStage={handleNextStage}
            onStartNextDifficulty={handleStartNextDifficulty}
            onOpenRoadmap={handleOpenRoadmap}
            unlockedBadge={unlockedBadge}
            onPlayAgain={isMultiplayer ? handleMultiplayerRematch : handlePlayAgain}
            onMainMenu={handleQuitToMenu}
            isTournamentMode={isTournamentMode}
            playerTeam={playerTeam}
            opponentTeam={isMultiplayer ? multiplayerOpponentTeam : currentTournamentMatch?.opponentTeam}
            tournamentMatch={currentTournamentMatch}
            onNextTournamentMatch={handleNextTournamentMatch}
            onOpenTournamentRoadmap={() => setScreen('tournament_roadmap')}
            hasNextTournamentMatch={!!currentTournamentMatch && currentTournamentMatch.matchNumber < 40}
            isChampion={!!tournamentProgress?.isChampion}
            isMultiplayer={isMultiplayer}
            multiplayerRole={multiplayerRole}
            onRematch={handleMultiplayerRematch}
            rematchRequested={multiplayerRematchPending}
          />
        </>
      )}
    </main>
  );
}
