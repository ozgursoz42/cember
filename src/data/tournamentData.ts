import { CountryTeam, GameDifficulty, TournamentMatch, TournamentProgress } from '../types';

export const TOURNAMENT_COUNTRIES: CountryTeam[] = [
  {
    id: 'turkiye',
    name: 'Türkiye',
    flag: '🇹🇷',
    code: 'TUR',
    flagCode: 'tr',
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
    flagCode: 'br',
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
    flagCode: 'ar',
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
    flagCode: 'de',
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
    flagCode: 'fr',
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
    flagCode: 'gb-eng',
    paddleColor: '#f8fafc',
    secondaryColor: '#dc2626',
    glowColor: '#ef4444',
    accentColor: '#dc2626',
    confederation: 'Avrupa',
    flagColors: ['#ffffff', '#dc2626', '#ffffff'],
  },
  {
    id: 'ispanya',
    name: 'İspanya',
    flag: '🇪🇸',
    code: 'ESP',
    flagCode: 'es',
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
    flagCode: 'it',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#22c55e',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#008c45', '#f4f5f0', '#cd212a'],
  },
  {
    id: 'portekiz',
    name: 'Portekiz',
    flag: '🇵🇹',
    code: 'POR',
    flagCode: 'pt',
    paddleColor: '#dc2626',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#facc15',
    confederation: 'Avrupa',
    flagColors: ['#16a34a', '#dc2626'],
  },
  {
    id: 'hollanda',
    name: 'Hollanda',
    flag: '🇳🇱',
    code: 'NED',
    flagCode: 'nl',
    paddleColor: '#f97316',
    secondaryColor: '#2563eb',
    glowColor: '#ffffff',
    accentColor: '#c2410c',
    confederation: 'Avrupa',
    flagColors: ['#f97316', '#ffffff', '#2563eb'],
  },
  {
    id: 'belcika',
    name: 'Belçika',
    flag: '🇧🇪',
    code: 'BEL',
    flagCode: 'be',
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
    flagCode: 'hr',
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
    flagCode: 'jp',
    paddleColor: '#f8fafc',
    secondaryColor: '#be123c',
    glowColor: '#ef4444',
    accentColor: '#be123c',
    confederation: 'Asya',
    flagColors: ['#ffffff', '#be123c'],
  },
  {
    id: 'guney_kore',
    name: 'Güney Kore',
    flag: '🇰🇷',
    code: 'KOR',
    flagCode: 'kr',
    paddleColor: '#ef4444',
    secondaryColor: '#2563eb',
    glowColor: '#3b82f6',
    accentColor: '#ffffff',
    confederation: 'Asya',
    flagColors: ['#1e3a8a', '#ef4444'],
  },
  {
    id: 'abd',
    name: 'ABD',
    flag: '🇺🇸',
    code: 'USA',
    flagCode: 'us',
    paddleColor: '#2563eb',
    secondaryColor: '#dc2626',
    glowColor: '#ef4444',
    accentColor: '#ffffff',
    confederation: 'Kuzey Amerika',
    flagColors: ['#2563eb', '#dc2626', '#ffffff'],
  },
  {
    id: 'meksika',
    name: 'Meksika',
    flag: '🇲🇽',
    code: 'MEX',
    flagCode: 'mx',
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
    flagCode: 'ma',
    paddleColor: '#dc2626',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#15803d',
    confederation: 'Afrika',
    flagColors: ['#dc2626', '#16a34a'],
  },
  {
    id: 'senegal',
    name: 'Senegal',
    flag: '🇸🇳',
    code: 'SEN',
    flagCode: 'sn',
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
    flagCode: 'ng',
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
    flagCode: 'eg',
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
    flagCode: 'uy',
    paddleColor: '#38bdf8',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#facc15',
    confederation: 'Güney Amerika',
    flagColors: ['#38bdf8', '#ffffff'],
  },
  {
    id: 'kolombiya',
    name: 'Kolombiya',
    flag: '🇨🇴',
    code: 'COL',
    flagCode: 'co',
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
    flagCode: 'cl',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Güney Amerika',
    flagColors: ['#ffffff', '#2563eb', '#dc2626'],
  },
  {
    id: 'isvicre',
    name: 'İsviçre',
    flag: '🇨🇭',
    code: 'SUI',
    flagCode: 'ch',
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
    flagCode: 'se',
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
    flagCode: 'no',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#2563eb'],
  },
  {
    id: 'danimarka',
    name: 'Danimarka',
    flag: '🇩🇰',
    code: 'DEN',
    flagCode: 'dk',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#f43f5e',
    confederation: 'Avrupa',
    flagColors: ['#dc2626', '#ffffff'],
  },
  {
    id: 'avusturya',
    name: 'Avusturya',
    flag: '🇦🇹',
    code: 'AUT',
    flagCode: 'at',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#b91c1c',
    confederation: 'Avrupa',
    flagColors: ['#b91c1c', '#ffffff', '#b91c1c'],
  },
  {
    id: 'polonya',
    name: 'Polonya',
    flag: '🇵🇱',
    code: 'POL',
    flagCode: 'pl',
    paddleColor: '#f8fafc',
    secondaryColor: '#dc2626',
    glowColor: '#dc2626',
    accentColor: '#ef4444',
    confederation: 'Avrupa',
    flagColors: ['#ffffff', '#dc2626'],
  },
  {
    id: 'cekya',
    name: 'Çekya',
    flag: '🇨🇿',
    code: 'CZE',
    flagCode: 'cz',
    paddleColor: '#dc2626',
    secondaryColor: '#2563eb',
    glowColor: '#2563eb',
    accentColor: '#ffffff',
    confederation: 'Avrupa',
    flagColors: ['#2563eb', '#dc2626'],
  },
  {
    id: 'sirbistan',
    name: 'Sırbistan',
    flag: '🇷🇸',
    code: 'SRB',
    flagCode: 'rs',
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
    flagCode: 'gr',
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
    flagCode: 'hu',
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
    flagCode: 'ca',
    paddleColor: '#dc2626',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#ef4444',
    confederation: 'Kuzey Amerika',
    flagColors: ['#dc2626', '#ffffff', '#ef4444'],
  },
  {
    id: 'avustralya',
    name: 'Avustralya',
    flag: '🇦🇺',
    code: 'AUS',
    flagCode: 'au',
    paddleColor: '#facc15',
    secondaryColor: '#16a34a',
    glowColor: '#16a34a',
    accentColor: '#15803d',
    confederation: 'Asya',
    flagColors: ['#22c55e', '#ca8a04'],
  },
  {
    id: 'suudi_arabistan',
    name: 'Suudi Arabistan',
    flag: '🇸🇦',
    code: 'KSA',
    flagCode: 'sa',
    paddleColor: '#16a34a',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#22c55e',
    confederation: 'Asya',
    flagColors: ['#16a34a', '#ffffff'],
  },
  {
    id: 'katar',
    name: 'Katar',
    flag: '🇶🇦',
    code: 'QAT',
    flagCode: 'qa',
    paddleColor: '#881337',
    secondaryColor: '#f8fafc',
    glowColor: '#ffffff',
    accentColor: '#9f1239',
    confederation: 'Asya',
    flagColors: ['#ffffff', '#881337'],
  },
  {
    id: 'iran',
    name: 'İran',
    flag: '🇮🇷',
    code: 'IRN',
    flagCode: 'ir',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#dc2626',
    accentColor: '#ffffff',
    confederation: 'Asya',
    flagColors: ['#16a34a', '#dc2626', '#ffffff'],
  },
  {
    id: 'gana',
    name: 'Gana',
    flag: '🇬🇭',
    code: 'GHA',
    flagCode: 'gh',
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
    flagCode: 'cm',
    paddleColor: '#16a34a',
    secondaryColor: '#dc2626',
    glowColor: '#facc15',
    accentColor: '#dc2626',
    confederation: 'Afrika',
    flagColors: ['#991b1b', '#facc15', '#16a34a'],
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
