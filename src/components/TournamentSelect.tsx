import React, { useState } from 'react';
import { ArrowLeft, Play, Search, Shield, Trophy, Check, Sparkles } from 'lucide-react';
import { CountryTeam } from '../types';
import { TOURNAMENT_COUNTRIES } from '../data/tournamentData';
import { soundEngine } from '../utils/audio';
import { CountryFlag } from './CountryFlag';

interface TournamentSelectProps {
  onSelectTeam: (team: CountryTeam) => void;
  onBackToMenu: () => void;
  initialSelectedId?: string;
}

export const TournamentSelect: React.FC<TournamentSelectProps> = ({
  onSelectTeam,
  onBackToMenu,
  initialSelectedId = 'turkiye',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<CountryTeam>(
    TOURNAMENT_COUNTRIES.find((c) => c.id === initialSelectedId) || TOURNAMENT_COUNTRIES[0]
  );
  const [selectedConfederation, setSelectedConfederation] = useState<string>('Tümü');

  const confederations = ['Tümü', 'Avrupa', 'Güney Amerika', 'Asya', 'Afrika', 'Kuzey Amerika'];

  const filteredCountries = TOURNAMENT_COUNTRIES.filter((country) => {
    const matchesSearch =
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConfed =
      selectedConfederation === 'Tümü' || country.confederation === selectedConfederation;
    return matchesSearch && matchesConfed;
  });

  const handleSelect = (team: CountryTeam) => {
    soundEngine.playClick();
    setSelectedTeam(team);
  };

  const handleConfirm = () => {
    soundEngine.playClick();
    onSelectTeam(selectedTeam);
  };

  const getFlagHorizontalGradient = (team: CountryTeam) => {
    if (team.flagColors && team.flagColors.length > 0) {
      const stops: string[] = [];
      const n = team.flagColors.length;
      team.flagColors.forEach((color, idx) => {
        stops.push(`${color} ${(idx / n) * 100}%`);
        stops.push(`${color} ${((idx + 1) / n) * 100}%`);
      });
      return `linear-gradient(to right, ${stops.join(', ')})`;
    }
    return team.paddleColor;
  };

  const getFlagVerticalGradient = (team: CountryTeam) => {
    if (team.flagColors && team.flagColors.length > 0) {
      const stops: string[] = [];
      const n = team.flagColors.length;
      team.flagColors.forEach((color, idx) => {
        stops.push(`${color} ${(idx / n) * 100}%`);
        stops.push(`${color} ${((idx + 1) / n) * 100}%`);
      });
      return `linear-gradient(to bottom, ${stops.join(', ')})`;
    }
    return team.paddleColor;
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
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            DÜNYA KUPASI TURNUVASI
          </span>
          <h2 className="text-sm font-black text-white">ÜLKENİ SEÇ (40 ÜLKE)</h2>
        </div>

        <div className="w-14" />
      </div>

      {/* Selected Country Hero Preview */}
      <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-700 flex items-center justify-center p-1.5 shadow-inner">
            <CountryFlag team={selectedTeam} size="lg" shape="rounded" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-white">{selectedTeam.name}</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                {selectedTeam.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{selectedTeam.confederation || 'Milli Takım'}</p>
          </div>
        </div>

        {/* Paddle Color Visual Representation */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Milli Çubuk</span>
          <div
            className="w-16 h-3.5 rounded-full border border-white/40 shadow-lg transition-all duration-300"
            style={{
              background: getFlagHorizontalGradient(selectedTeam),
              boxShadow: `0 0 12px ${selectedTeam.glowColor}`,
            }}
          />
        </div>
      </div>

      {/* Search and Confederation Filter */}
      <div className="w-full space-y-2 mb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="country-search-input"
            type="text"
            placeholder="Ülke ara (ör. Türkiye, Brezilya...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Confederation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-none">
          {confederations.map((conf) => (
            <button
              key={conf}
              onClick={() => setSelectedConfederation(conf)}
              className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                selectedConfederation === conf
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {conf}
            </button>
          ))}
        </div>
      </div>

      {/* Country Selection Grid (Scrollable) */}
      <div className="w-full flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[38vh]">
        <div className="grid grid-cols-2 gap-2">
          {filteredCountries.map((team) => {
            const isSelected = selectedTeam.id === team.id;
            const isTurkey = team.id === 'turkiye';
            return (
              <button
                key={team.id}
                id={`country-team-${team.id}`}
                onClick={() => handleSelect(team)}
                className={`p-2 rounded-xl flex items-center justify-between border transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : isTurkey
                    ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden text-left">
                  <CountryFlag team={team} size="md" shape="rounded" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {team.name}
                      {isTurkey && <Sparkles className="w-3 h-3 text-amber-400 shrink-0 inline" />}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{team.confederation}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <div
                    className="w-3 h-6 rounded-full border border-white/30 shadow-inner"
                    style={{ background: getFlagVerticalGradient(team) }}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Notice */}
      <div className="w-full my-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 leading-tight">
        <span className="font-bold text-amber-400">Turnuva Kuralları: </span>
        40 maçlık şampiyonluk yolu. İlk 10 maç <b className="text-emerald-400">Easiest</b>, sonraki 20 maç <b className="text-teal-400">Easy</b>, son 10 maç <b className="text-cyan-400">Casual</b> zorlukta. 2 sert vuruşta Sarı Kart 🟨, tekrarında Kırmızı Kart 🟥 (kaleniz gole kadar boş kalır)!
      </div>

      {/* Start Tournament Action Button */}
      <div className="w-full pt-1">
        <button
          id="confirm-tournament-start-btn"
          onClick={handleConfirm}
          className="w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 text-slate-950 hover:brightness-110"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{selectedTeam.name.toUpperCase()} İLE TURNUVAYI BAŞLAT</span>
        </button>
      </div>
    </div>
  );
};
