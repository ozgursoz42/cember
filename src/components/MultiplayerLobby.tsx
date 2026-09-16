import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Wifi,
  Sparkles,
  RefreshCw,
  Share2,
  Trophy,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { CountryTeam } from '../types';
import { TOURNAMENT_COUNTRIES } from '../data/tournamentData';
import { MultiplayerManager, ConnectionStatus } from '../utils/multiplayer';
import { soundEngine } from '../utils/audio';
import { CountryFlag } from './CountryFlag';

interface MultiplayerLobbyProps {
  onBackToMenu: () => void;
  onStartOnlineMatch: (
    manager: MultiplayerManager,
    role: 'host' | 'guest',
    playerTeam: CountryTeam,
    opponentTeam: CountryTeam,
    targetScore: number
  ) => void;
  initialPlayerTeam?: CountryTeam | null;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onBackToMenu,
  onStartOnlineMatch,
  initialPlayerTeam,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>(() => MultiplayerManager.generateRoomCode());
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<CountryTeam>(
    initialPlayerTeam || TOURNAMENT_COUNTRIES.find((c) => c.id === 'turkiye') || TOURNAMENT_COUNTRIES[0]
  );
  const [targetScore, setTargetScore] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  const managerRef = useRef<MultiplayerManager | null>(null);
  const hasStartedMatchRef = useRef<boolean>(false);
  const hasPlayedCheerRef = useRef<boolean>(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('idle');
  const [opponentTeam, setOpponentTeam] = useState<CountryTeam | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTeamPicker, setShowTeamPicker] = useState<boolean>(false);

  // Parse URL query parameter for room code if someone opened a shared link (e.g. ?room=123456)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.length >= 4) {
        const cleaned = MultiplayerManager.normalizeRoomCode(urlRoom);
        setJoinCodeInput(cleaned);
        setTab('join');
      }
    }
  }, []);

  // Cleanup active manager
  const cleanupManager = useCallback(() => {
    if (hasStartedMatchRef.current) {
      // Transfer ownership to match screen, do not cleanup
      managerRef.current = null;
      return;
    }
    if (managerRef.current) {
      managerRef.current.cleanup();
      managerRef.current = null;
    }
    setConnStatus('idle');
    setOpponentTeam(null);
  }, []);

  // Initialize Host Room
  const initHostRoom = useCallback(
    (codeToUse: string, scoreVal: number, teamVal: CountryTeam) => {
      hasStartedMatchRef.current = false;
      cleanupManager();
      setErrorMessage('');

      const net = new MultiplayerManager({
        name: teamVal.name,
        team: teamVal,
        isReady: true,
      });

      managerRef.current = net;

      net.subscribe((status, payload) => {
        setConnStatus(status);
        if (net.errorMessage) {
          setErrorMessage(net.errorMessage);
        }

        const data = payload as { event?: string; data?: unknown } | undefined;
        if (data?.event === 'handshake_received') {
          const prof = net.opponentProfile;
          if (prof && prof.team) {
            setOpponentTeam(prof.team);
            if (!hasPlayedCheerRef.current) {
              hasPlayedCheerRef.current = true;
              soundEngine.playTrophyCheer();
            }
          }
        }
      });

      net.createRoom(codeToUse, scoreVal).catch((err) => {
        console.error('Failed to create room:', err);
      });
    },
    [cleanupManager]
  );

  // Host room creation triggered when tab is 'create' or roomCode regenerated
  useEffect(() => {
    if (tab === 'create') {
      initHostRoom(roomCode, targetScore, selectedTeam);
    } else {
      cleanupManager();
    }
  }, [tab, roomCode, initHostRoom, cleanupManager]);

  // Update profile or score on active host room without tearing down WebRTC
  useEffect(() => {
    if (tab === 'create' && managerRef.current) {
      managerRef.current.setMyProfile({ name: selectedTeam.name, team: selectedTeam });
      managerRef.current.setTargetScore(targetScore);
    }
  }, [selectedTeam, targetScore, tab]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (!hasStartedMatchRef.current) {
        cleanupManager();
      }
    };
  }, [cleanupManager]);

  // Copy 6-digit Code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      soundEngine.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy direct invite Link
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      soundEngine.playClick();
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Generate new code for Host
  const handleGenerateNewCode = () => {
    soundEngine.playClick();
    const newCode = MultiplayerManager.generateRoomCode();
    setRoomCode(newCode);
    setErrorMessage('');
    setOpponentTeam(null);
  };

  // Join Room Handler with code parameter or state
  const handleJoinRoom = useCallback((codeOverride?: string) => {
    const rawCode = codeOverride || joinCodeInput;
    const cleanedCode = MultiplayerManager.normalizeRoomCode(rawCode);
    if (!cleanedCode || cleanedCode.length < 4) {
      setErrorMessage('Lütfen geçerli bir 6 haneli oda kodu girin.');
      return;
    }

    soundEngine.playClick();
    hasStartedMatchRef.current = false;
    cleanupManager();
    setErrorMessage('');
    setOpponentTeam(null);

    const net = new MultiplayerManager({
      name: selectedTeam.name,
      team: selectedTeam,
      isReady: true,
    });

    managerRef.current = net;

    net.subscribe((status, payload) => {
      setConnStatus(status);
      if (net.errorMessage) setErrorMessage(net.errorMessage);

      const data = payload as { event?: string; data?: unknown } | undefined;
      if (data?.event === 'handshake_received') {
        const prof = net.opponentProfile;
        if (prof && prof.team) {
          setOpponentTeam(prof.team);
          if (!hasPlayedCheerRef.current) {
            hasPlayedCheerRef.current = true;
            soundEngine.playTrophyCheer();
          }
        }
      }

      if (data?.event === 'game_started' || data?.event === 'match_start') {
        if (!hasStartedMatchRef.current) {
          hasStartedMatchRef.current = true;
          const opp = net.opponentProfile?.team || TOURNAMENT_COUNTRIES[0];
          onStartOnlineMatch(net, 'guest', selectedTeam, opp, net.targetScore || 5);
        }
      }
    });

    net.joinRoom(cleanedCode).catch((err) => {
      console.error('Join error:', err);
    });
  }, [cleanupManager, joinCodeInput, onStartOnlineMatch, selectedTeam]);

  // Host starts the game
  const handleHostStartGame = () => {
    const net = managerRef.current;
    if (!net || !opponentTeam) return;
    soundEngine.playClick();
    hasStartedMatchRef.current = true;
    net.startGame();
    onStartOnlineMatch(net, 'host', selectedTeam, opponentTeam, targetScore);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-y-auto z-20">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-1">
        <button
          id="back-to-menu-from-mp"
          onClick={() => {
            soundEngine.playClick();
            cleanupManager();
            onBackToMenu();
          }}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition active:scale-95 flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-black text-indigo-300">
          <Users className="w-3.5 h-3.5" />
          <span>ONLINE PVP</span>
        </div>
      </div>

      {/* Tabs: Oda Aç vs Odaya Katıl */}
      <div className="my-auto py-2 w-full flex flex-col items-center">
        <div className="w-full grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 mb-4">
          <button
            id="tab-create-room"
            onClick={() => {
              if (tab !== 'create') {
                soundEngine.playClick();
                setTab('create');
              }
            }}
            className={`py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            ODA KUR (KURUCU)
          </button>
          <button
            id="tab-join-room"
            onClick={() => {
              if (tab !== 'join') {
                soundEngine.playClick();
                setTab('join');
              }
            }}
            className={`py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            ODAYA KATIL
          </button>
        </div>

        {/* Selected Country / Team Card */}
        <div className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-inner border"
              style={{
                backgroundColor: `${selectedTeam.paddleColor}20`,
                borderColor: selectedTeam.paddleColor,
              }}
            >
              <CountryFlag team={selectedTeam} size="md" shape="rounded" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAKIMINIZ</div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{selectedTeam.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: selectedTeam.paddleColor }}
                />
              </div>
            </div>
          </div>

          <button
            id="change-online-team-btn"
            onClick={() => {
              soundEngine.playClick();
              setShowTeamPicker(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700/80 transition"
          >
            Değiştir
          </button>
        </div>

        {/* TAB 1: CREATE ROOM CONTENT */}
        {tab === 'create' && (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Room Code Display Box */}
            <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-cyan-500/30 flex flex-col items-center text-center shadow-[0_0_25px_rgba(6,182,212,0.15)]">
              <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-1">
                ODA NUMARASI (KOD)
              </span>

              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-[0.2em] font-mono select-all bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
                  {roomCode}
                </span>
                <button
                  id="refresh-room-code-btn"
                  onClick={handleGenerateNewCode}
                  title="Yeni Kod Üret"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                <button
                  id="copy-room-code-btn"
                  onClick={handleCopyCode}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>

                <button
                  id="copy-room-link-btn"
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{linkCopied ? 'Link Alındı!' : 'Davet Linki'}</span>
                </button>
              </div>
            </div>

            {/* Target Score Selector */}
            <div className="w-full p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Kazanma Hedefi:
              </span>
              <div className="flex items-center gap-1">
                {[3, 5, 7, 10].map((scoreVal) => (
                  <button
                    key={scoreVal}
                    onClick={() => {
                      soundEngine.playClick();
                      setTargetScore(scoreVal);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                      targetScore === scoreVal
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {scoreVal} Gol
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Status Indicator */}
            <div
              className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                opponentTeam
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  opponentTeam ? 'bg-emerald-900/50 border border-emerald-400' : 'bg-slate-800 animate-pulse'
                }`}
              >
                {opponentTeam ? opponentTeam.flag : <Users className="w-5 h-5 text-slate-500" />}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">RAKİP OYUNCU</div>
                <div className="text-xs font-black text-white">
                  {opponentTeam ? `${opponentTeam.name} - KATILDI!` : 'Oyuncu Bekleniyor...'}
                </div>
                {!opponentTeam && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Arkadaşınıza 6 haneli oda kodunu iletin.
                  </div>
                )}
              </div>
              {opponentTeam ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 text-[11px] font-black">
                  HAZIR ✓
                </span>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: JOIN ROOM CONTENT */}
        {tab === 'join' && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/30 flex flex-col items-center text-center shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase mb-2">
                KATILMAK İSTEDİĞİNİZ ODA KODUNU GİRİN
              </span>

              <div className="w-full relative my-2">
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCodeInput.trim().length >= 4) {
                      e.preventDefault();
                      handleJoinRoom();
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text) {
                      const norm = MultiplayerManager.normalizeRoomCode(text);
                      if (norm) {
                        setJoinCodeInput(norm);
                        if (norm.length >= 4) {
                          setTimeout(() => handleJoinRoom(norm), 100);
                        }
                      }
                    }
                  }}
                  placeholder="6 Haneli Kod"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-950/90 border-2 border-slate-700 text-white font-mono text-center text-2xl font-black tracking-[0.25em] focus:border-emerald-400 focus:outline-none placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal"
                />
              </div>

              {/* Quick Paste Button */}
              <button
                id="paste-code-btn"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      const digits = MultiplayerManager.normalizeRoomCode(text);
                      if (digits) {
                        setJoinCodeInput(digits);
                        soundEngine.playClick();
                        if (digits.length >= 4) {
                          setTimeout(() => handleJoinRoom(digits), 100);
                        }
                      }
                    }
                  } catch {
                    // ignore
                  }
                }}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 py-1"
              >
                Panodan Yapıştır
              </button>

              <button
                id="connect-room-btn"
                onClick={() => handleJoinRoom()}
                disabled={joinCodeInput.trim().length < 4 || connStatus === 'connecting' || connStatus === 'initializing'}
                className="mt-3 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                {connStatus === 'connecting' || connStatus === 'initializing' ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>BAĞLANTI KURULUYOR...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>ODAYA BAĞLAN</span>
                  </>
                )}
              </button>
            </div>

            {/* Guest Connection Status */}
            {connStatus === 'connected' && (
              <div className="w-full p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500 flex items-center gap-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-400 flex items-center justify-center text-xl">
                  {opponentTeam ? opponentTeam.flag : '👑'}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <span>ODAYA BAĞLANDI!</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  </div>
                  <div className="text-xs font-black text-white">
                    {opponentTeam ? `Kurucu: ${opponentTeam.name}` : 'Kurucu bilgisi alınıyor...'}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 font-medium">
                    Kurucu oyunu başlattığında maç otomatik açılacaktır.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message & Retry Action */}
        {errorMessage && (
          <div className="w-full mt-3 p-3 rounded-2xl bg-rose-950/70 border border-rose-600/60 text-rose-200 text-xs font-bold flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            {tab === 'join' && joinCodeInput.trim().length >= 4 && (
              <button
                id="retry-join-btn"
                onClick={() => handleJoinRoom()}
                className="mt-1 px-4 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-black text-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tekrar Dene</span>
              </button>
            )}
          </div>
        )}

        {/* Global Connection Health Status Badge */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>Kesintisiz Çift Sunucu Ağı Aktif (HiveMQ + EMQX)</span>
        </div>
      </div>

      {/* Bottom CTA Action Area */}
      <div className="w-full flex flex-col items-center gap-2 pb-2">
        {tab === 'create' ? (
          <button
            id="host-start-game-btn"
            onClick={handleHostStartGame}
            disabled={!opponentTeam}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
              opponentTeam
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{opponentTeam ? 'OYUNU BAŞLAT' : 'RAKİP BEKLENİYOR...'}</span>
          </button>
        ) : (
          <div className="text-center text-[11px] text-slate-400 font-medium py-1">
            📱 Sıfır gecikmeli WebRTC P2P bağlantısı ile doğrudan cihazlar arası oynanır.
          </div>
        )}
      </div>

      {/* Country Selection Modal */}
      {showTeamPicker && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="relative w-full max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-4 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">ONLINE TAKIMINI SEÇ (40 ÜLKE)</h3>
              <button
                onClick={() => setShowTeamPicker(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                Kapat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 my-3 pr-1">
              {TOURNAMENT_COUNTRIES.map((team) => {
                const isSelected = selectedTeam.id === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedTeam(team);
                      setShowTeamPicker(false);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <CountryFlag team={team} size="md" shape="rounded" />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{team.name}</div>
                      <div
                        className="text-[9px] font-bold"
                        style={{ color: team.paddleColor }}
                      >
                        {team.confederation}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
