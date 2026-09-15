import { GameDifficulty } from './types';
import { getAdventureProgress } from './adventureData';

export interface ShopPaddleSkin {
  id: string;
  name: string;
  color: string;
  secondaryColor: string;
  glowColor: string;
  priceStars: number;
  icon: string;
  description: string;
}

export interface ShopBallSkin {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  trailColor: string;
  innerPattern?: 'classic' | 'neon_core' | 'fire_orb' | 'plasma_star' | 'gold_star' | 'soccer' | 'matrix' | 'ruby';
  priceStars: number;
  icon: string;
  description: string;
}

export interface ShopBooster {
  id: string;
  name: string;
  priceStars: number;
  icon: string;
  description: string;
  badgeText: string;
}

export const PLAYER_PADDLE_SKINS: ShopPaddleSkin[] = [
  {
    id: 'classic_cyan',
    name: 'Klasik Siber Mavi',
    color: '#06b6d4',
    secondaryColor: '#0284c7',
    glowColor: '#22d3ee',
    priceStars: 0,
    icon: '⚡',
    description: 'Varsayılan neon mavi siber çubuk.',
  },
  {
    id: 'lava_orange',
    name: 'Neon Lav Ateşi',
    color: '#f97316',
    secondaryColor: '#dc2626',
    glowColor: '#fb923c',
    priceStars: 10,
    icon: '🔥',
    description: 'Sıcak volkanik alevlerle kaplı turuncu çubuk.',
  },
  {
    id: 'emerald_green',
    name: 'Siber Zümrüt',
    color: '#10b981',
    secondaryColor: '#059669',
    glowColor: '#34d399',
    priceStars: 15,
    icon: '💎',
    description: 'Parlak matris zümrüt yeşili çubuk.',
  },
  {
    id: 'plasma_purple',
    name: 'Plazma Mor',
    color: '#a855f7',
    secondaryColor: '#7e22ce',
    glowColor: '#c084fc',
    priceStars: 20,
    icon: '🌌',
    description: 'Kozmik nebula ışıltılı mor çubuk.',
  },
  {
    id: 'ice_blue',
    name: 'Safir Kristal',
    color: '#38bdf8',
    secondaryColor: '#0369a1',
    glowColor: '#7dd3fc',
    priceStars: 25,
    icon: '❄️',
    description: 'Donmuş buz safiri kaplamalı çubuk.',
  },
  {
    id: 'gold_champion',
    name: 'Altın Şampiyon',
    color: '#f59e0b',
    secondaryColor: '#d97706',
    glowColor: '#fbbf24',
    priceStars: 35,
    icon: '👑',
    description: 'Efsanevi altın ışıltılı şampiyon çubuğu.',
  },
  {
    id: 'dragon_fire',
    name: 'Kırmızı Ejderha',
    color: '#ef4444',
    secondaryColor: '#991b1b',
    glowColor: '#f87171',
    priceStars: 45,
    icon: '🐉',
    description: 'Ejderha közü ve kızıl alev kuşamı.',
  },
  {
    id: 'cyber_stealth',
    name: 'Görünmez Siber',
    color: '#38bdf8',
    secondaryColor: '#0f172a',
    glowColor: '#60a5fa',
    priceStars: 60,
    icon: '🕶️',
    description: 'Siyah titanyum ve lazer kenarlı gizli siber çubuk.',
  },
];

export const OPPONENT_PADDLE_SKINS: ShopPaddleSkin[] = [
  {
    id: 'opp_classic_rose',
    name: 'Klasik Kırmızı',
    color: '#f43f5e',
    secondaryColor: '#e11d48',
    glowColor: '#fb7185',
    priceStars: 0,
    icon: '🤖',
    description: 'Varsayılan kırmızı rakip çubuğu.',
  },
  {
    id: 'opp_obsidian_dark',
    name: 'Siyah Obsidyen',
    color: '#475569',
    secondaryColor: '#1e293b',
    glowColor: '#818cf8',
    priceStars: 10,
    icon: '🖤',
    description: 'Karanlık obsidyen kaplamalı rakip çubuğu.',
  },
  {
    id: 'opp_toxic_green',
    name: 'Toksik Biyo Yeşili',
    color: '#84cc16',
    secondaryColor: '#4d7c0f',
    glowColor: '#a3e635',
    priceStars: 15,
    icon: '☣️',
    description: 'Zehirli biyolojik neon rakip çubuğu.',
  },
  {
    id: 'opp_cyber_pink',
    name: 'Neon Pembe',
    color: '#ec4899',
    secondaryColor: '#be185d',
    glowColor: '#f472b6',
    priceStars: 20,
    icon: '🌸',
    description: 'Fütüristik fuşya ve pembe neon rakip çubuğu.',
  },
  {
    id: 'opp_gold_warrior',
    name: 'Altın Savaşçı',
    color: '#eab308',
    secondaryColor: '#a16207',
    glowColor: '#fde047',
    priceStars: 30,
    icon: '🔱',
    description: 'Görkemli altın rakip muhafız çubuğu.',
  },
  {
    id: 'opp_ice_frost',
    name: 'Donmuş Buz',
    color: '#0284c7',
    secondaryColor: '#075985',
    glowColor: '#38bdf8',
    priceStars: 40,
    icon: '🧊',
    description: 'Kutup buzu ile kaplanmış soğuk rakip çubuğu.',
  },
];

export const BALL_SKINS: ShopBallSkin[] = [
  {
    id: 'ball_classic_white',
    name: 'Klasik Neon Beyaz',
    color: '#ffffff',
    glowColor: '#38bdf8',
    trailColor: '38, 189, 248',
    innerPattern: 'classic',
    priceStars: 0,
    icon: '⚽',
    description: 'Varsayılan yüksek görünürlüklü neon siber top.',
  },
  {
    id: 'ball_neon_cyan',
    name: 'Siber Mavi Enerji',
    color: '#38bdf8',
    glowColor: '#00f0ff',
    trailColor: '0, 240, 255',
    innerPattern: 'neon_core',
    priceStars: 10,
    icon: '⚡',
    description: 'Aşırı şarjlı siber mavi plazma küresi.',
  },
  {
    id: 'ball_fire_sun',
    name: 'Güneş Alevi Küresi',
    color: '#f97316',
    glowColor: '#ff6b00',
    trailColor: '249, 115, 22',
    innerPattern: 'fire_orb',
    priceStars: 15,
    icon: '🔥',
    description: 'Kor gibi yanan ve kıvılcım saçan alev topu.',
  },
  {
    id: 'ball_plasma_purple',
    name: 'Kozmik Nebula',
    color: '#c084fc',
    glowColor: '#a855f7',
    trailColor: '168, 85, 247',
    innerPattern: 'plasma_star',
    priceStars: 20,
    icon: '🌌',
    description: 'Mor yıldız tozları yayan galaktik plazma küresi.',
  },
  {
    id: 'ball_emerald_matrix',
    name: 'Matris Zümrüt',
    color: '#34d399',
    glowColor: '#10b981',
    trailColor: '52, 211, 153',
    innerPattern: 'matrix',
    priceStars: 25,
    icon: '💎',
    description: 'Dijital matris enerjisiyle kaplı yeşil cevher.',
  },
  {
    id: 'ball_gold_star',
    name: 'Altın Şampiyon Topu',
    color: '#fbbf24',
    glowColor: '#f59e0b',
    trailColor: '251, 191, 36',
    innerPattern: 'gold_star',
    priceStars: 35,
    icon: '👑',
    description: 'Şampiyonlara özel ışıltılı altın top.',
  },
  {
    id: 'ball_ruby_red',
    name: 'Yakut Alev Kızılı',
    color: '#f43f5e',
    glowColor: '#e11d48',
    trailColor: '244, 63, 94',
    innerPattern: 'ruby',
    priceStars: 40,
    icon: '🔴',
    description: 'Derin kızıl yakut kristali topu.',
  },
  {
    id: 'ball_soccer',
    name: 'Klasik Futbol Topu',
    color: '#ffffff',
    glowColor: '#60a5fa',
    trailColor: '255, 255, 255',
    innerPattern: 'soccer',
    priceStars: 50,
    icon: '⚽',
    description: 'Siyah-beyaz geometrik desenli ikonik futbol topu.',
  },
];

export const SINGLE_GAME_BOOSTERS: ShopBooster[] = [
  {
    id: 'booster_mega_paddle',
    name: 'Uzun Çubuk Başlangıcı',
    priceStars: 8,
    icon: '🚀',
    description: 'Maça 16 saniye boyunca devasa Mega Çubuk ile başla!',
    badgeText: 'UZUN ÇUBUK',
  },
  {
    id: 'booster_goalie',
    name: 'Kaleci Desteği Başlangıcı',
    priceStars: 10,
    icon: '🧤',
    description: 'Maça kaleni savunan otonom kaleci ile avantajlı başla!',
    badgeText: 'KALECİ DESTEĞİ',
  },
  {
    id: 'booster_ice_wall',
    name: 'Buz Duvarı Kalkanı',
    priceStars: 12,
    icon: '🧊',
    description: 'Maçın başında kaleni 15s tamamen koruyan buz duvarı aktif olur.',
    badgeText: 'BUZ KALKANI',
  },
  {
    id: 'booster_score_plus1',
    name: '+1 Başlangıç Avansı',
    priceStars: 15,
    icon: '⚽',
    description: 'Maça otomatik olarak 1-0 önde başla!',
    badgeText: '+1 SKOR',
  },
  {
    id: 'booster_fireball',
    name: 'Alevli Top Başlangıcı',
    priceStars: 8,
    icon: '🔥',
    description: 'İlk servisini yakıcı yüksek hızlı alev topu ile yap.',
    badgeText: 'ALEV TOPU',
  },
  {
    id: 'booster_disable_opp_power',
    name: 'Rakip Güçlerini Engelleme',
    priceStars: 15,
    icon: '🚫',
    description: 'Bu maç boyunca rakibin roket, smash ve güç toplamasını engelle!',
    badgeText: 'RAKİP ENGELİ',
  },
  {
    id: 'booster_shrink_opp',
    name: 'Rakip Çubuğunu Küçültme',
    priceStars: 12,
    icon: '🤏',
    description: 'Rakip maça küçük boy çubukla başlasın!',
    badgeText: 'KÜÇÜK RAKİP',
  },
];

// Storage Keys
const KEY_UNLOCKED = 'cember_shop_unlocked_items';
const KEY_EQUIPPED_PLAYER = 'cember_shop_equipped_player_skin';
const KEY_EQUIPPED_OPP = 'cember_shop_equipped_opp_skin';
const KEY_EQUIPPED_BALL = 'cember_shop_equipped_ball_skin';
const KEY_BOOSTER_COUNTS = 'cember_shop_booster_counts';
const KEY_ACTIVE_MATCH_BOOSTERS = 'cember_shop_active_match_boosters';
const KEY_SPENT_STARS = 'cember_shop_spent_stars';

export interface ShopState {
  unlockedItemIds: string[];
  equippedPlayerSkinId: string;
  equippedOpponentSkinId: string;
  equippedBallSkinId: string;
  boosterCounts: Record<string, number>; // boosterId -> remaining count
  activeMatchBoosterIds: string[]; // boosters toggled ON for next match
  spentStars: number;
}

export function getShopState(): ShopState {
  try {
    const unlockedRaw = localStorage.getItem(KEY_UNLOCKED);
    const eqPlayer = localStorage.getItem(KEY_EQUIPPED_PLAYER) || 'classic_cyan';
    const eqOpp = localStorage.getItem(KEY_EQUIPPED_OPP) || 'opp_classic_rose';
    const eqBall = localStorage.getItem(KEY_EQUIPPED_BALL) || 'ball_classic_white';
    const boosterCountsRaw = localStorage.getItem(KEY_BOOSTER_COUNTS);
    const activeBoostersRaw = localStorage.getItem(KEY_ACTIVE_MATCH_BOOSTERS);
    const spentStarsRaw = localStorage.getItem(KEY_SPENT_STARS);

    const unlockedItemIds: string[] = unlockedRaw ? JSON.parse(unlockedRaw) : ['classic_cyan', 'opp_classic_rose', 'ball_classic_white'];
    if (!unlockedItemIds.includes('ball_classic_white')) {
      unlockedItemIds.push('ball_classic_white');
    }
    const boosterCounts: Record<string, number> = boosterCountsRaw ? JSON.parse(boosterCountsRaw) : {};
    const activeMatchBoosterIds: string[] = activeBoostersRaw ? JSON.parse(activeBoostersRaw) : [];
    const spentStars = spentStarsRaw ? parseInt(spentStarsRaw, 10) || 0 : 0;

    return {
      unlockedItemIds,
      equippedPlayerSkinId: eqPlayer,
      equippedOpponentSkinId: eqOpp,
      equippedBallSkinId: eqBall,
      boosterCounts,
      activeMatchBoosterIds,
      spentStars,
    };
  } catch {
    return {
      unlockedItemIds: ['classic_cyan', 'opp_classic_rose', 'ball_classic_white'],
      equippedPlayerSkinId: 'classic_cyan',
      equippedOpponentSkinId: 'opp_classic_rose',
      equippedBallSkinId: 'ball_classic_white',
      boosterCounts: {},
      activeMatchBoosterIds: [],
      spentStars: 0,
    };
  }
}

export function saveShopState(state: ShopState): void {
  try {
    localStorage.setItem(KEY_UNLOCKED, JSON.stringify(state.unlockedItemIds));
    localStorage.setItem(KEY_EQUIPPED_PLAYER, state.equippedPlayerSkinId);
    localStorage.setItem(KEY_EQUIPPED_OPP, state.equippedOpponentSkinId);
    localStorage.setItem(KEY_EQUIPPED_BALL, state.equippedBallSkinId);
    localStorage.setItem(KEY_BOOSTER_COUNTS, JSON.stringify(state.boosterCounts));
    localStorage.setItem(KEY_ACTIVE_MATCH_BOOSTERS, JSON.stringify(state.activeMatchBoosterIds));
    localStorage.setItem(KEY_SPENT_STARS, state.spentStars.toString());
  } catch {
    // ignore
  }
}

// Compute total stars earned from completed stages across all difficulties
export function getTotalEarnedStars(): number {
  const diffs: GameDifficulty[] = ['easiest', 'easy', 'casual', 'pro', 'chaos'];
  let totalStars = 20; // 20 bonus starting stars so players can shop immediately!
  diffs.forEach((d) => {
    const list = getAdventureProgress(d);
    list.forEach((s) => {
      if (s.completed) {
        totalStars += Math.max(1, s.stars || 1);
      }
    });
  });
  return totalStars;
}

export function getAvailableStars(): number {
  const total = getTotalEarnedStars();
  const state = getShopState();
  return Math.max(0, total - state.spentStars);
}

export function buyPaddleSkin(skin: ShopPaddleSkin, isOpponent: boolean = false): boolean {
  const available = getAvailableStars();
  if (available < skin.priceStars) return false;

  const state = getShopState();
  if (!state.unlockedItemIds.includes(skin.id)) {
    state.unlockedItemIds.push(skin.id);
  }
  state.spentStars += skin.priceStars;

  if (isOpponent) {
    state.equippedOpponentSkinId = skin.id;
  } else {
    state.equippedPlayerSkinId = skin.id;
  }

  saveShopState(state);
  return true;
}

export function buyBallSkin(skin: ShopBallSkin): boolean {
  const available = getAvailableStars();
  if (available < skin.priceStars) return false;

  const state = getShopState();
  if (!state.unlockedItemIds.includes(skin.id)) {
    state.unlockedItemIds.push(skin.id);
  }
  state.spentStars += skin.priceStars;
  state.equippedBallSkinId = skin.id;

  saveShopState(state);
  return true;
}

export function equipPlayerSkin(skinId: string): void {
  const state = getShopState();
  if (state.unlockedItemIds.includes(skinId)) {
    state.equippedPlayerSkinId = skinId;
    saveShopState(state);
  }
}

export function equipOpponentSkin(skinId: string): void {
  const state = getShopState();
  if (state.unlockedItemIds.includes(skinId)) {
    state.equippedOpponentSkinId = skinId;
    saveShopState(state);
  }
}

export function equipBallSkin(skinId: string): void {
  const state = getShopState();
  if (state.unlockedItemIds.includes(skinId)) {
    state.equippedBallSkinId = skinId;
    saveShopState(state);
  }
}

export function buyBooster(booster: ShopBooster): boolean {
  const available = getAvailableStars();
  if (available < booster.priceStars) return false;

  const state = getShopState();
  state.spentStars += booster.priceStars;
  const currentCount = state.boosterCounts[booster.id] || 0;
  state.boosterCounts[booster.id] = currentCount + 1;

  // Auto-activate for next match if not already active
  if (!state.activeMatchBoosterIds.includes(booster.id)) {
    state.activeMatchBoosterIds.push(booster.id);
  }

  saveShopState(state);
  return true;
}

export function toggleActiveMatchBooster(boosterId: string): void {
  const state = getShopState();
  const count = state.boosterCounts[boosterId] || 0;
  if (count <= 0) return;

  if (state.activeMatchBoosterIds.includes(boosterId)) {
    state.activeMatchBoosterIds = state.activeMatchBoosterIds.filter((id) => id !== boosterId);
  } else {
    state.activeMatchBoosterIds.push(boosterId);
  }
  saveShopState(state);
}

// Call this when starting a game match to consume 1 use of each equipped booster!
export function consumeActiveBoostersForMatch(): string[] {
  const state = getShopState();
  const activeIds = [...state.activeMatchBoosterIds];
  const consumed: string[] = [];

  activeIds.forEach((id) => {
    const currentCount = state.boosterCounts[id] || 0;
    if (currentCount > 0) {
      consumed.push(id);
      state.boosterCounts[id] = currentCount - 1;
      if (state.boosterCounts[id] <= 0) {
        state.activeMatchBoosterIds = state.activeMatchBoosterIds.filter((bId) => bId !== id);
      }
    }
  });

  saveShopState(state);
  return consumed;
}
