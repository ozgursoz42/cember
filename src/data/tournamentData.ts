import { CountryTeam, GameDifficulty, TournamentMatch, TournamentProgress } from '../types';

export const TOURNAMENT_COUNTRIES: CountryTeam[] = [
  {
    id: 'turkiye',
    name: 'Türkiye',
    flag: '🇹🇷',
    code: 'TUR',
    paddleColor: '#e11d48',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#be123c',
    confederation: 'Avrupa',
    flagColors: ['#e11d48', '#ffffff', '#e11d48'],
  },
  {
    id: 'brezilya',
    name: 'Brezilya',
    flag: '🇧🇷',
    code: 'BRA',
    paddleColor: '#eab308',
    secondaryColor: '#16a34a',
    glowColor: '#22c55e',
    accentColor: '#15803d',
    confederation: 'Güney Amerika',
    flagColors: ['#16a34a', '#eab308', '#2563eb'],
  },
  {
    id: 'arjantin',
    name: 'Arjantin',
    flag: '🇦🇷',
    code: 'ARG',
    paddleColor: '#38bdf8',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#facc15',
    confederation: 'Güney Amerika',
    flagColors: ['#38bdf8', '#ffffff', '#38bdf8'],
  },
  {
    id: 'almanya',
    name: 'Almanya',
    flag: '🇩🇪',
    code: 'GER',
    paddleColor: '#18181b',
    secondaryColor: '#ef4444',
    glowColor: '#f59e0b',
    accentColor: '#f59e0b',
    confederation: 'Avrupa',
    flagColors: ['#18181b', '#ef4444', '#f59e0b'],
  },
  {
    id: 'fransa',
    name: 'Fransa',
    flag: '🇫🇷',
    code: 'FRA',
    paddleColor: '#2563eb',
    secondaryColor: '#ef4444',
    glowColor: '#ef4444',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#2563eb', '#ffffff', '#ef4444'],
  },
  {
    id: 'ingiltere',
    name: 'İngiltere',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    code: 'ENG',
    paddleColor: '#f8fafc',
    secondaryColor: '#dc2626',
    glowColor: '#ef4444',
    accentColor: '#dc2626',
    confederation: 'Avrupa',
    flagColors: ['#f8fafc', '#dc2626', '#f8fafc'],
  },
  {
    id: 'ispanya',
    name: 'İspanya',
    flag: '🇪🇸',
    code: 'ESP',
    paddleColor: '#dc2626',
    secondaryColor: '#facc15',
    glowColor: '#facc15',
    accentColor: '#ea580c',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#facc15', '#dc2626'],
  },
  {
    id: 'italya',
    name: 'İtalya',
    flag: '🇮🇹',
    code: 'ITA',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#22c55e',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#16a34a', '#ffffff', '#dc2626'],
  },
  {
    id: 'portekiz',
    name: 'Portekiz',
    flag: '🇵🇹',
    code: 'POR',
    paddleColor: '#dc2626',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#facc15',
    confederation: 'Avrupa',
    flagColors: ['#16a34a', '#dc2626', '#facc15'],
  },
  {
    id: 'hollanda',
    name: 'Hollanda',
    flag: '🇳🇱',
    code: 'NED',
    paddleColor: '#f97316',
    secondaryColor: '#2563eb',
    glowColor: '#ffffff',
    accentColor: '#c2410c',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#2563eb'],
  },
  {
    id: 'belcika',
    name: 'Belçika',
    flag: '🇧🇪',
    code: 'BEL',
    paddleColor: '#dc2626',
    secondaryColor: '#facc15',
    glowColor: '#facc15',
    accentColor: '#18181b',
    confederation: 'Avrupa',
    flagColors: ['#18181b', '#facc15', '#dc2626'],
  },
  {
    id: 'hirvatistan',
    name: 'Hırvatistan',
    flag: '🇭🇷',
    code: 'CRO',
    paddleColor: '#ef4444',
    secondaryColor: '#f8fafc',
    glowColor: '#3b82f6',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#ef4444', '#ffffff', '#2563eb'],
  },
  {
    id: 'japonya',
    name: 'Japonya',
    flag: '🇯🇵',
    code: 'JPN',
    paddleColor: '#f8fafc',
    secondaryColor: '#be123c',
    glowColor: '#ef4444',
    accentColor: '#be123c',
    confederation: 'Asya',
    flagColors: ['#f8fafc', '#dc2626', '#f8fafc'],
  },
  {
    id: 'guney_kore',
    name: 'Güney Kore',
    flag: '🇰🇷',
    code: 'KOR',
    paddleColor: '#ef4444',
    secondaryColor: '#2563eb',
    glowColor: '#3b82f6',
    accentColor: '#ffffff',
    confederation: 'Asya',
    flagColors: ['#ffffff', '#ef4444', '#2563eb'],
  },
  {
    id: 'abd',
    name: 'ABD',
    flag: '🇺🇸',
    code: 'USA',
    paddleColor: '#2563eb',
    secondaryColor: '#dc2626',
    glowColor: '#ef4444',
    accentColor: '#ffffff',
    confederation: 'Kuzey Amerika',
    flagColors: ['#2563eb', '#ffffff', '#dc2626'],
  },
  {
    id: 'meksika',
    name: 'Meksika',
    flag: '🇲🇽',
    code: 'MEX',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#ef4444',
    accentColor: '#ffffff',
    confederation: 'Kuzey Amerika',
    flagColors: ['#16a34a', '#ffffff', '#dc2626'],
  },
  {
    id: 'fas',
    name: 'Fas',
    flag: '🇲🇦',
    code: 'MAR',
    paddleColor: '#dc2626',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#15803d',
    confederation: 'Afrika',
    flagColors: ['#dc2626', '#16a34a', '#dc2626'],
  },
  {
    id: 'senegal',
    name: 'Senegal',
    flag: '🇸🇳',
    code: 'SEN',
    paddleColor: '#16a34a',
    secondaryColor: '#facc15',
    glowColor: '#facc15',
    accentColor: '#dc2626',
    confederation: 'Afrika',
    flagColors: ['#16a34a', '#facc15', '#dc2626'],
  },
  {
    id: 'nijerya',
    name: 'Nijerya',
    flag: '🇳🇬',
    code: 'NGA',
    paddleColor: '#16a34a',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#15803d',
    confederation: 'Afrika',
    flagColors: ['#16a34a', '#ffffff', '#16a34a'],
  },
  {
    id: 'misir',
    name: 'Mısır',
    flag: '🇪🇬',
    code: 'EGY',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#facc15',
    accentColor: '#ffffff',
    confederation: 'Afrika',
    flagColors: ['#dc2626', '#ffffff', '#18181b'],
  },
  {
    id: 'uruguay',
    name: 'Uruguay',
    flag: '🇺🇾',
    code: 'URU',
    paddleColor: '#38bdf8',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#facc15',
    confederation: 'Güney Amerika',
    flagColors: ['#38bdf8', '#ffffff', '#facc15'],
  },
  {
    id: 'kolombiya',
    name: 'Kolombiya',
    flag: '🇨🇴',
    code: 'COL',
    paddleColor: '#facc15',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#dc2626',
    confederation: 'Güney Amerika',
    flagColors: ['#facc15', '#2563eb', '#dc2626'],
  },
  {
    id: 'sili',
    name: 'Şili',
    flag: '🇨🇱',
    code: 'CHI',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Güney Amerika',
    flagColors: ['#2563eb', '#ffffff', '#dc2626'],
  },
  {
    id: 'isvicre',
    name: 'İsviçre',
    flag: '🇨🇭',
    code: 'SUI',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#b91c1c',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#dc2626'],
  },
  {
    id: 'isvec',
    name: 'İsveç',
    flag: '🇸🇪',
    code: 'SWE',
    paddleColor: '#facc15',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#1d4ed8',
    confederation: 'Avrupa',
    flagColors: ['#2563eb', '#facc15', '#2563eb'],
  },
  {
    id: 'norvec',
    name: 'Norveç',
    flag: '🇳🇴',
    code: 'NOR',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#2563eb'],
  },
  {
    id: 'danimarka',
    name: 'Danimarka',
    flag: '🇩🇰',
    code: 'DEN',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#f43f5e',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#dc2626'],
  },
  {
    id: 'avusturya',
    name: 'Avusturya',
    flag: '🇦🇹',
    code: 'AUT',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#b91c1c',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#dc2626'],
  },
  {
    id: 'polonya',
    name: 'Polonya',
    flag: '🇵🇱',
    code: 'POL',
    paddleColor: '#f8fafc',
    secondaryColor: '#dc2626',
    glowColor: '#dc2626',
    accentColor: '#ef4444',
    confederation: 'Avrupa',
    flagColors: ['#ffffff', '#dc2626', '#ffffff'],
  },
  {
    id: 'cekya',
    name: 'Çekya',
    flag: '🇨🇿',
    code: 'CZE',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#2563eb', '#ffffff', '#dc2626'],
  },
  {
    id: 'sirbistan',
    name: 'Sırbistan',
    flag: '🇷🇸',
    code: 'SRB',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#2563eb', '#ffffff'],
  },
  {
    id: 'yunanistan',
    name: 'Yunanistan',
    flag: '🇬🇷',
    code: 'GRE',
    paddleColor: '#2563eb',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#38bdf8',
    confederation: 'Avrupa',
    flagColors: ['#2563eb', '#ffffff', '#2563eb'],
  },
  {
    id: 'macaristan',
    name: 'Macaristan',
    flag: '🇭🇺',
    code: 'HUN',
    paddleColor: '#dc2626',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff', '#16a34a'],
  },
  {
    id: 'kanada',
    name: 'Kanada',
    flag: '🇨🇦',
    code: 'CAN',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#ef4444',
    confederation: 'Kuzey Amerika',
    flagColors: ['#dc2626', '#ffffff', '#dc2626'],
  },
  {
    id: 'avustralya',
    name: 'Avustralya',
    flag: '🇦🇺',
    code: 'AUS',
    paddleColor: '#facc15',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#15803d',
    confederation: 'Asya',
    flagColors: ['#2563eb', '#ffffff', '#dc2626'],
  },
  {
    id: 'suudi_arabistan',
    name: 'Suudi Arabistan',
    flag: '🇸🇦',
    code: 'KSA',
    paddleColor: '#16a34a',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#22c55e',
    confederation: 'Asya',
    flagColors: ['#16a34a', '#ffffff', '#16a34a'],
  },
  {
    id: 'katar',
    name: 'Katar',
    flag: '🇶🇦',
    code: 'QAT',
    paddleColor: '#881337',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#9f1239',
    confederation: 'Asya',
    flagColors: ['#881337', '#ffffff', '#881337'],
  },
  {
    id: 'iran',
    name: 'İran',
    flag: '🇮🇷',
    code: 'IRN',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#dc2626',
    accentColor: '#ffffff',
    confederation: 'Asya',
    flagColors: ['#16a34a', '#ffffff', '#dc2626'],
  },
  {
    id: 'gana',
    name: 'Gana',
    flag: '🇬🇭',
    code: 'GHA',
    paddleColor: '#facc15',
    secondaryColor: '#dc2626',
    glowColor: '#dc2626',
    accentColor: '#16a34a',
    confederation: 'Afrika',
    flagColors: ['#dc2626', '#facc15', '#16a34a'],
  },
  {
    id: 'kamerun',
    name: 'Kamerun',
    flag: '🇨🇲',
    code: 'CMR',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#facc15',
    accentColor: '#dc2626',
    confederation: 'Afrika',
    flagColors: ['#16a34a', '#dc2626', '#facc15'],
  },
];

const TOURNAMENT_STORAGE_KEY = 'cember_tournament_progress_v1';

/**
 * Generate 40 matches against all other countries
 * Difficulty bracket:
 * 1 - 10: easiest
 * 11 - 30: easy (20 matches)
 * 31 - 40: casual (10 matches)
 */
export function generateTournamentSchedule(
  playerTeamId: string,
  customOpponentIds?: string[]
): TournamentMatch[] {
  let opponentPool: CountryTeam[] = [];

  if (customOpponentIds && customOpponentIds.length > 0) {
    opponentPool = customOpponentIds
      .map((id) => TOURNAMENT_COUNTRIES.find((c) => c.id === id))
      .filter((c): c is CountryTeam => c !== undefined);
  } else {
    // Filter out player team
    const rawPool = TOURNAMENT_COUNTRIES.filter((c) => c.id !== playerTeamId);

    // Fisher-Yates Shuffle for random tournament matchups
    const shuffled = [...rawPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    opponentPool = shuffled;
  }

  // Ensure 40 matches total by padding if needed
  const finalRival = playerTeamId === 'turkiye'
    ? TOURNAMENT_COUNTRIES.find((c) => c.id === 'brezilya') || opponentPool[0]
    : TOURNAMENT_COUNTRIES.find((c) => c.id === 'turkiye') || opponentPool[0];

  const fullOpponents: CountryTeam[] = [...opponentPool];
  while (fullOpponents.length < 40) {
    fullOpponents.push(finalRival);
  }

  return fullOpponents.slice(0, 40).map((opponent, idx) => {
    const matchNumber = idx + 1;
    let difficulty: GameDifficulty = 'easiest';
    if (matchNumber >= 1 && matchNumber <= 10) {
      difficulty = 'easiest';
    } else if (matchNumber >= 11 && matchNumber <= 30) {
      difficulty = 'easy';
    } else {
      difficulty = 'casual';
    }

    return {
      matchNumber,
      opponentTeam: opponent,
      difficulty,
      completed: false,
    };
  });
}

export function getTournamentProgress(): TournamentProgress | null {
  try {
    const raw = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TournamentProgress;
  } catch {
    return null;
  }
}

export function saveTournamentProgress(progress: TournamentProgress): void {
  try {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage fallback
  }
}

export function resetTournamentProgress(): void {
  try {
    localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
