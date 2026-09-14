import { GameDifficulty } from './types';

export interface StageTheme {
  id: number;
  title: string;
  shortName: string;
  subtitle: string;
  description: string;
  bgGradientTop: string;
  bgGradientBot: string;
  boundaryColor: string;
  gridPattern: 'cyber' | 'magma' | 'crystal' | 'matrix' | 'cosmic' | 'apex';
  gridColor: string;
  sensorColor: string;
  sensorSecondaryColor: string;
  playerGlow: string;
  opponentGlow: string;
  accentColor: string;
  ambientColor: string;
  targetScore: number;
  aiSpeedBonus: number; // progressive difficulty increment
  ballSpeedBonus: number;
  icon: string;
}

export interface StageProgress {
  stageId: number;
  completed: boolean;
  unlocked: boolean;
  playerScore: number;
  opponentScore: number;
  stars: number;
}

export interface DifficultyBadge {
  id: GameDifficulty;
  name: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const ADVENTURE_STAGES: StageTheme[] = [
  // BÖLGE 1: NEON SİBER VE BAŞLANGIÇ ARENALARI (Bölüm 1-6)
  {
    id: 1,
    title: 'Bölüm 1: Neon Siber',
    shortName: 'Neon Siber',
    subtitle: 'Siber Izgara Arenası',
    description: 'Neon mavi dijital ızgara. Temel Çember fiziği ve hızlı refleksler.',
    bgGradientTop: 'rgba(56, 189, 248, 0.14)',
    bgGradientBot: 'rgba(6, 182, 212, 0.16)',
    boundaryColor: '#0ea5e9',
    gridPattern: 'cyber',
    gridColor: 'rgba(14, 165, 233, 0.18)',
    sensorColor: '#38bdf8',
    sensorSecondaryColor: '#0284c7',
    playerGlow: '#06b6d4',
    opponentGlow: '#f43f5e',
    accentColor: '#38bdf8',
    ambientColor: '#0284c7',
    targetScore: 5,
    aiSpeedBonus: 0,
    ballSpeedBonus: 0,
    icon: '⚡',
  },
  {
    id: 2,
    title: 'Bölüm 2: Magma Çukuru',
    shortName: 'Magma Çukuru',
    subtitle: 'Lav Akıntıları & Közler',
    description: 'Volkanik çatlaklar ve sıcak lav dalgaları. Top daha hızlı ivmelenir.',
    bgGradientTop: 'rgba(239, 68, 68, 0.16)',
    bgGradientBot: 'rgba(245, 158, 11, 0.18)',
    boundaryColor: '#ea580c',
    gridPattern: 'magma',
    gridColor: 'rgba(234, 88, 12, 0.22)',
    sensorColor: '#f97316',
    sensorSecondaryColor: '#dc2626',
    playerGlow: '#fb923c',
    opponentGlow: '#f87171',
    accentColor: '#f97316',
    ambientColor: '#ea580c',
    targetScore: 5,
    aiSpeedBonus: 0.015,
    ballSpeedBonus: 15,
    icon: '🌋',
  },
  {
    id: 3,
    title: 'Bölüm 3: Kutup Kristali',
    shortName: 'Kutup Kristali',
    subtitle: 'Donmuş Buzul Zirvesi',
    description: 'Buz kristalleri ve donmuş safir zemin. Çember keskin dönüşler yapar.',
    bgGradientTop: 'rgba(147, 197, 253, 0.16)',
    bgGradientBot: 'rgba(99, 102, 241, 0.18)',
    boundaryColor: '#38bdf8',
    gridPattern: 'crystal',
    gridColor: 'rgba(186, 230, 253, 0.20)',
    sensorColor: '#67e8f9',
    sensorSecondaryColor: '#3b82f6',
    playerGlow: '#38bdf8',
    opponentGlow: '#a855f7',
    accentColor: '#67e8f9',
    ambientColor: '#38bdf8',
    targetScore: 5,
    aiSpeedBonus: 0.025,
    ballSpeedBonus: 25,
    icon: '❄️',
  },
  {
    id: 4,
    title: 'Bölüm 4: Toksik Reaktör',
    shortName: 'Toksik Reaktör',
    subtitle: 'Asit Matriksi & Radyasyon',
    description: 'Zehir yeşili biyo-altıgenler. Rakip savunmasını güçlendirir.',
    bgGradientTop: 'rgba(34, 197, 94, 0.15)',
    bgGradientBot: 'rgba(16, 185, 129, 0.20)',
    boundaryColor: '#10b981',
    gridPattern: 'matrix',
    gridColor: 'rgba(52, 211, 153, 0.22)',
    sensorColor: '#10b981',
    sensorSecondaryColor: '#059669',
    playerGlow: '#34d399',
    opponentGlow: '#e11d48',
    accentColor: '#10b981',
    ambientColor: '#059669',
    targetScore: 5,
    aiSpeedBonus: 0.035,
    ballSpeedBonus: 35,
    icon: '☣️',
  },
  {
    id: 5,
    title: 'Bölüm 5: Kozmik Boşluk',
    shortName: 'Kozmik Boşluk',
    subtitle: 'Derin Nebula & Yıldız Tozu',
    description: 'Yıldız kümeleri ve kozmik yerçekimi dalgaları. Çember çılgınca süzülür.',
    bgGradientTop: 'rgba(168, 85, 247, 0.16)',
    bgGradientBot: 'rgba(236, 72, 153, 0.18)',
    boundaryColor: '#a855f7',
    gridPattern: 'cosmic',
    gridColor: 'rgba(192, 132, 252, 0.22)',
    sensorColor: '#c084fc',
    sensorSecondaryColor: '#7e22ce',
    playerGlow: '#d8b4fe',
    opponentGlow: '#f43f5e',
    accentColor: '#c084fc',
    ambientColor: '#9333ea',
    targetScore: 5,
    aiSpeedBonus: 0.045,
    ballSpeedBonus: 45,
    icon: '🌌',
  },
  {
    id: 6,
    title: 'Bölüm 6: Siber Çekirdek',
    shortName: 'Siber Çekirdek',
    subtitle: 'Bölge I Zirve Muhafızı',
    description: 'Siber ağın kalbi. Güçlü enerji dalgaları ve hızlı vuruşlar.',
    bgGradientTop: 'rgba(14, 165, 233, 0.20)',
    bgGradientBot: 'rgba(59, 130, 246, 0.22)',
    boundaryColor: '#0284c7',
    gridPattern: 'cyber',
    gridColor: 'rgba(56, 189, 248, 0.25)',
    sensorColor: '#38bdf8',
    sensorSecondaryColor: '#1d4ed8',
    playerGlow: '#38bdf8',
    opponentGlow: '#ef4444',
    accentColor: '#0284c7',
    ambientColor: '#1e40af',
    targetScore: 5,
    aiSpeedBonus: 0.055,
    ballSpeedBonus: 52,
    icon: '💾',
  },

  // BÖLGE 2: KUANTUM & MANYETİK FIRTINALAR (Bölüm 7-12)
  {
    id: 7,
    title: 'Bölüm 7: Kuantum Labirenti',
    shortName: 'Kuantum',
    subtitle: 'Dalga Fonksiyonu Arenası',
    description: 'Bölünmüş partiküller ve şaşırtıcı yansımalar.',
    bgGradientTop: 'rgba(16, 185, 129, 0.16)',
    bgGradientBot: 'rgba(6, 182, 212, 0.18)',
    boundaryColor: '#14b8a6',
    gridPattern: 'matrix',
    gridColor: 'rgba(45, 212, 191, 0.22)',
    sensorColor: '#2dd4bf',
    sensorSecondaryColor: '#0f766e',
    playerGlow: '#2dd4bf',
    opponentGlow: '#f43f5e',
    accentColor: '#14b8a6',
    ambientColor: '#115e59',
    targetScore: 5,
    aiSpeedBonus: 0.06,
    ballSpeedBonus: 58,
    icon: '⚛️',
  },
  {
    id: 8,
    title: 'Bölüm 8: Plazma Kanyonu',
    shortName: 'Plazma Kanyonu',
    subtitle: 'İyonik Ateş Yolu',
    description: 'Yüksek sıcaklıkta akkor plazma gazı. Top vuruşları daha sert!',
    bgGradientTop: 'rgba(249, 115, 22, 0.18)',
    bgGradientBot: 'rgba(234, 88, 12, 0.20)',
    boundaryColor: '#f97316',
    gridPattern: 'magma',
    gridColor: 'rgba(251, 146, 60, 0.24)',
    sensorColor: '#fb923c',
    sensorSecondaryColor: '#c2410c',
    playerGlow: '#fdba74',
    opponentGlow: '#ef4444',
    accentColor: '#ea580c',
    ambientColor: '#9a3412',
    targetScore: 5,
    aiSpeedBonus: 0.065,
    ballSpeedBonus: 64,
    icon: '🔥',
  },
  {
    id: 9,
    title: 'Bölüm 9: Manyetik Fırtına',
    shortName: 'Manyetik Alan',
    subtitle: 'Kutup Sapması & İtme',
    description: 'Kuvvetli elektromanyetik akımlar topun yönünü saptırır.',
    bgGradientTop: 'rgba(99, 102, 241, 0.18)',
    bgGradientBot: 'rgba(139, 92, 246, 0.20)',
    boundaryColor: '#6366f1',
    gridPattern: 'cyber',
    gridColor: 'rgba(129, 140, 248, 0.22)',
    sensorColor: '#818cf8',
    sensorSecondaryColor: '#4338ca',
    playerGlow: '#a5b4fc',
    opponentGlow: '#f43f5e',
    accentColor: '#6366f1',
    ambientColor: '#3730a3',
    targetScore: 5,
    aiSpeedBonus: 0.07,
    ballSpeedBonus: 70,
    icon: '🧲',
  },
  {
    id: 10,
    title: 'Bölüm 10: Zehirli Bataklık',
    shortName: 'Zehirli Sis',
    subtitle: 'Asidik Buhar Katmanı',
    description: 'Yoğun toksik buharlar. Dikkatini bir an bile kaybetme!',
    bgGradientTop: 'rgba(132, 204, 22, 0.18)',
    bgGradientBot: 'rgba(16, 185, 129, 0.20)',
    boundaryColor: '#84cc16',
    gridPattern: 'matrix',
    gridColor: 'rgba(163, 230, 53, 0.22)',
    sensorColor: '#a3e635',
    sensorSecondaryColor: '#4d7c0f',
    playerGlow: '#bef264',
    opponentGlow: '#fb7185',
    accentColor: '#84cc16',
    ambientColor: '#3f6212',
    targetScore: 5,
    aiSpeedBonus: 0.075,
    ballSpeedBonus: 76,
    icon: '🧪',
  },
  {
    id: 11,
    title: 'Bölüm 11: Zümrüt Kanyon',
    shortName: 'Zümrüt Vadi',
    subtitle: 'Kristalize Doğal Rezerv',
    description: 'Sert zümrüt duvarlar topu inanılmaz açılarla fırlatır.',
    bgGradientTop: 'rgba(16, 185, 129, 0.18)',
    bgGradientBot: 'rgba(5, 150, 105, 0.20)',
    boundaryColor: '#10b981',
    gridPattern: 'crystal',
    gridColor: 'rgba(52, 211, 153, 0.22)',
    sensorColor: '#34d399',
    sensorSecondaryColor: '#047857',
    playerGlow: '#6ee7b7',
    opponentGlow: '#f87171',
    accentColor: '#10b981',
    ambientColor: '#065f46',
    targetScore: 5,
    aiSpeedBonus: 0.08,
    ballSpeedBonus: 82,
    icon: '🌲',
  },
  {
    id: 12,
    title: 'Bölüm 12: Nötron Yıldızı',
    shortName: 'Nötron Çekirdeği',
    subtitle: 'Bölge II Zirve Düellosu',
    description: 'Devasa yerçekimi ve hız. Çember çevresinde inanılmaz bir tempo!',
    bgGradientTop: 'rgba(236, 72, 153, 0.18)',
    bgGradientBot: 'rgba(168, 85, 247, 0.22)',
    boundaryColor: '#ec4899',
    gridPattern: 'cosmic',
    gridColor: 'rgba(244, 114, 182, 0.24)',
    sensorColor: '#f472b6',
    sensorSecondaryColor: '#be185d',
    playerGlow: '#fbcfe8',
    opponentGlow: '#e11d48',
    accentColor: '#db2777',
    ambientColor: '#9d174d',
    targetScore: 5,
    aiSpeedBonus: 0.085,
    ballSpeedBonus: 88,
    icon: '💫',
  },

  // BÖLGE 3: ANTİK ELEMENTLER & ENERJİ (Bölüm 13-18)
  {
    id: 13,
    title: 'Bölüm 13: Güneş Parlaması',
    shortName: 'Güneş Koronası',
    subtitle: 'Sıcak Radyasyon Kuşağı',
    description: 'Güneş fırtınaları vuruşları alevlendirir.',
    bgGradientTop: 'rgba(245, 158, 11, 0.20)',
    bgGradientBot: 'rgba(239, 68, 68, 0.20)',
    boundaryColor: '#f59e0b',
    gridPattern: 'magma',
    gridColor: 'rgba(251, 191, 36, 0.22)',
    sensorColor: '#fbbf24',
    sensorSecondaryColor: '#b45309',
    playerGlow: '#fde68a',
    opponentGlow: '#f43f5e',
    accentColor: '#f59e0b',
    ambientColor: '#92400e',
    targetScore: 5,
    aiSpeedBonus: 0.09,
    ballSpeedBonus: 94,
    icon: '☀️',
  },
  {
    id: 14,
    title: 'Bölüm 14: Okyanus Hendeği',
    shortName: 'Derin Okyanus',
    subtitle: 'Abis Basıncı & Akıntı',
    description: 'Derin suların basıncı altında süratli rallyler.',
    bgGradientTop: 'rgba(14, 165, 233, 0.18)',
    bgGradientBot: 'rgba(30, 64, 175, 0.24)',
    boundaryColor: '#0284c7',
    gridPattern: 'crystal',
    gridColor: 'rgba(56, 189, 248, 0.22)',
    sensorColor: '#38bdf8',
    sensorSecondaryColor: '#1e3a8a',
    playerGlow: '#7dd3fc',
    opponentGlow: '#f43f5e',
    accentColor: '#0284c7',
    ambientColor: '#172554',
    targetScore: 5,
    aiSpeedBonus: 0.095,
    ballSpeedBonus: 100,
    icon: '🌊',
  },
  {
    id: 15,
    title: 'Bölüm 15: Titanyum Fabrikası',
    shortName: 'Titanyum Çarkı',
    subtitle: 'Endüstriyel Çelik Kompleks',
    description: 'Metalik yankılar ve sert çubuk çarpışmaları.',
    bgGradientTop: 'rgba(148, 163, 184, 0.18)',
    bgGradientBot: 'rgba(71, 85, 105, 0.22)',
    boundaryColor: '#94a3b8',
    gridPattern: 'cyber',
    gridColor: 'rgba(203, 213, 225, 0.20)',
    sensorColor: '#cbd5e1',
    sensorSecondaryColor: '#475569',
    playerGlow: '#e2e8f0',
    opponentGlow: '#f43f5e',
    accentColor: '#94a3b8',
    ambientColor: '#334155',
    targetScore: 5,
    aiSpeedBonus: 0.10,
    ballSpeedBonus: 106,
    icon: '⚙️',
  },
  {
    id: 16,
    title: 'Bölüm 16: Obsidyen Kalesi',
    shortName: 'Obsidyen Kule',
    subtitle: 'Siyah Cam & Sert Yansımalar',
    description: 'Işığı emen obsidyen zemin. Rakibin vuruşları çok çevik.',
    bgGradientTop: 'rgba(15, 23, 42, 0.25)',
    bgGradientBot: 'rgba(88, 28, 135, 0.25)',
    boundaryColor: '#7e22ce',
    gridPattern: 'magma',
    gridColor: 'rgba(168, 85, 247, 0.20)',
    sensorColor: '#a855f7',
    sensorSecondaryColor: '#581c87',
    playerGlow: '#c084fc',
    opponentGlow: '#f43f5e',
    accentColor: '#7e22ce',
    ambientColor: '#3b0764',
    targetScore: 5,
    aiSpeedBonus: 0.105,
    ballSpeedBonus: 112,
    icon: '🛡️',
  },
  {
    id: 17,
    title: 'Bölüm 17: Elektrik Santrali',
    shortName: 'Yüksek Gerilim',
    subtitle: 'Milyon Volt Ark Deşarjı',
    description: 'Her yönden fışkıran kıvılcımlar. Maksimum hız!',
    bgGradientTop: 'rgba(234, 179, 8, 0.20)',
    bgGradientBot: 'rgba(6, 182, 212, 0.20)',
    boundaryColor: '#eab308',
    gridPattern: 'matrix',
    gridColor: 'rgba(250, 204, 21, 0.24)',
    sensorColor: '#facc15',
    sensorSecondaryColor: '#a16207',
    playerGlow: '#fef08a',
    opponentGlow: '#ef4444',
    accentColor: '#ca8a04',
    ambientColor: '#713f12',
    targetScore: 5,
    aiSpeedBonus: 0.11,
    ballSpeedBonus: 118,
    icon: '⚡',
  },
  {
    id: 18,
    title: 'Bölüm 18: Şafak Zirvesi',
    shortName: 'Şafak Muhafızı',
    subtitle: 'Bölge III Zirve Düellosu',
    description: 'Güneşin doğuşuyla parlayan antik zirve platformu.',
    bgGradientTop: 'rgba(244, 63, 94, 0.20)',
    bgGradientBot: 'rgba(251, 146, 60, 0.22)',
    boundaryColor: '#f43f5e',
    gridPattern: 'apex',
    gridColor: 'rgba(251, 113, 133, 0.25)',
    sensorColor: '#fb7185',
    sensorSecondaryColor: '#be123c',
    playerGlow: '#fda4af',
    opponentGlow: '#38bdf8',
    accentColor: '#e11d48',
    ambientColor: '#881337',
    targetScore: 5,
    aiSpeedBonus: 0.115,
    ballSpeedBonus: 124,
    icon: '🌅',
  },

  // BÖLGE 4: BOYUTLARARASI ARENALAR (Bölüm 19-24)
  {
    id: 19,
    title: 'Bölüm 19: Nebula Bulutu',
    shortName: 'Mor Nebula',
    subtitle: 'Yıldız Doğum Havzası',
    description: 'Gaz ve toz bulutları arasında yerçekimsiz süzülüş.',
    bgGradientTop: 'rgba(168, 85, 247, 0.20)',
    bgGradientBot: 'rgba(219, 39, 119, 0.22)',
    boundaryColor: '#a855f7',
    gridPattern: 'cosmic',
    gridColor: 'rgba(192, 132, 252, 0.24)',
    sensorColor: '#c084fc',
    sensorSecondaryColor: '#7e22ce',
    playerGlow: '#e9d5ff',
    opponentGlow: '#f43f5e',
    accentColor: '#9333ea',
    ambientColor: '#581c87',
    targetScore: 5,
    aiSpeedBonus: 0.12,
    ballSpeedBonus: 130,
    icon: '🪐',
  },
  {
    id: 20,
    title: 'Bölüm 20: Süpernova Alanı',
    shortName: 'Süpernova',
    subtitle: 'Patlayan Yıldız Şoku',
    description: 'Muazzam patlama dalgaları ve hiper-hızlı vuruşlar.',
    bgGradientTop: 'rgba(239, 68, 68, 0.22)',
    bgGradientBot: 'rgba(245, 158, 11, 0.24)',
    boundaryColor: '#ef4444',
    gridPattern: 'magma',
    gridColor: 'rgba(248, 113, 113, 0.25)',
    sensorColor: '#f87171',
    sensorSecondaryColor: '#b91c1c',
    playerGlow: '#fca5a5',
    opponentGlow: '#06b6d4',
    accentColor: '#dc2626',
    ambientColor: '#7f1d1d',
    targetScore: 5,
    aiSpeedBonus: 0.125,
    ballSpeedBonus: 136,
    icon: '💥',
  },
  {
    id: 21,
    title: 'Bölüm 21: Donmuş Cehennem',
    shortName: 'Buz Cehennemi',
    subtitle: 'Mutlak Sıfırın Ötesi',
    description: 'Dondurucu soğuk ve kaygan zemin.',
    bgGradientTop: 'rgba(125, 211, 252, 0.20)',
    bgGradientBot: 'rgba(56, 189, 248, 0.22)',
    boundaryColor: '#38bdf8',
    gridPattern: 'crystal',
    gridColor: 'rgba(186, 230, 253, 0.24)',
    sensorColor: '#7dd3fc',
    sensorSecondaryColor: '#0369a1',
    playerGlow: '#bae6fd',
    opponentGlow: '#f43f5e',
    accentColor: '#0284c7',
    ambientColor: '#0c4a6e',
    targetScore: 5,
    aiSpeedBonus: 0.13,
    ballSpeedBonus: 142,
    icon: '🧊',
  },
  {
    id: 22,
    title: 'Bölüm 22: Siberpunk Metropol',
    shortName: 'Mega Şehir',
    subtitle: 'Holografik Gece Kuşağı',
    description: 'Neon gökdelenler ve fütüristik gladyatör düellosu.',
    bgGradientTop: 'rgba(236, 72, 153, 0.20)',
    bgGradientBot: 'rgba(6, 182, 212, 0.22)',
    boundaryColor: '#06b6d4',
    gridPattern: 'cyber',
    gridColor: 'rgba(103, 232, 249, 0.22)',
    sensorColor: '#22d3ee',
    sensorSecondaryColor: '#0891b2',
    playerGlow: '#a5f3fc',
    opponentGlow: '#f43f5e',
    accentColor: '#0891b2',
    ambientColor: '#164e63',
    targetScore: 5,
    aiSpeedBonus: 0.135,
    ballSpeedBonus: 148,
    icon: '🌃',
  },
  {
    id: 23,
    title: 'Bölüm 23: Boyut Geçidi',
    shortName: 'Geçit Kapısı',
    subtitle: 'Uzay-Zaman Yırtılması',
    description: 'Portal enerjileri ve anlık vuruş sapmaları.',
    bgGradientTop: 'rgba(99, 102, 241, 0.22)',
    bgGradientBot: 'rgba(168, 85, 247, 0.24)',
    boundaryColor: '#8b5cf6',
    gridPattern: 'matrix',
    gridColor: 'rgba(167, 139, 250, 0.25)',
    sensorColor: '#a78bfa',
    sensorSecondaryColor: '#6d28d9',
    playerGlow: '#c4b5fd',
    opponentGlow: '#fb7185',
    accentColor: '#7c3aed',
    ambientColor: '#4c1d95',
    targetScore: 5,
    aiSpeedBonus: 0.14,
    ballSpeedBonus: 154,
    icon: '🌀',
  },
  {
    id: 24,
    title: 'Bölüm 24: Altın Galaksi',
    shortName: 'Galaksi Zirvesi',
    subtitle: 'Bölge IV Zirve Muhafızı',
    description: 'Yıldız sistemlerinin altın merkezi. Çember durmaksızın dönüyor!',
    bgGradientTop: 'rgba(251, 191, 36, 0.24)',
    bgGradientBot: 'rgba(217, 119, 6, 0.26)',
    boundaryColor: '#fbbf24',
    gridPattern: 'apex',
    gridColor: 'rgba(252, 211, 77, 0.26)',
    sensorColor: '#fde047',
    sensorSecondaryColor: '#b45309',
    playerGlow: '#fef08a',
    opponentGlow: '#f43f5e',
    accentColor: '#d97706',
    ambientColor: '#78350f',
    targetScore: 5,
    aiSpeedBonus: 0.145,
    ballSpeedBonus: 160,
    icon: '✨',
  },

  // BÖLGE 5: APEX ŞAMPİYONLAR LİGİ (Bölüm 25-30)
  {
    id: 25,
    title: 'Bölüm 25: Ejderha Yuvası',
    shortName: 'Ejder Nefesi',
    subtitle: 'Ateşli Hükümdar Zirvesi',
    description: 'Köz fırtınaları ve acımasız karşı ataklar.',
    bgGradientTop: 'rgba(220, 38, 38, 0.24)',
    bgGradientBot: 'rgba(185, 28, 28, 0.26)',
    boundaryColor: '#dc2626',
    gridPattern: 'magma',
    gridColor: 'rgba(239, 68, 68, 0.28)',
    sensorColor: '#ef4444',
    sensorSecondaryColor: '#991b1b',
    playerGlow: '#f87171',
    opponentGlow: '#38bdf8',
    accentColor: '#b91c1c',
    ambientColor: '#450a0a',
    targetScore: 5,
    aiSpeedBonus: 0.15,
    ballSpeedBonus: 165,
    icon: '🐲',
  },
  {
    id: 26,
    title: 'Bölüm 26: Kronos Zaman Çemberi',
    shortName: 'Zaman Çemberi',
    subtitle: 'Geçmiş & Gelecek Karşılaşması',
    description: 'Zamanın büküldüğü arenada mutlak odaklanma şart!',
    bgGradientTop: 'rgba(139, 92, 246, 0.22)',
    bgGradientBot: 'rgba(59, 130, 246, 0.24)',
    boundaryColor: '#8b5cf6',
    gridPattern: 'cosmic',
    gridColor: 'rgba(167, 139, 250, 0.26)',
    sensorColor: '#a78bfa',
    sensorSecondaryColor: '#5b21b6',
    playerGlow: '#ddd6fe',
    opponentGlow: '#ef4444',
    accentColor: '#7c3aed',
    ambientColor: '#4c1d95',
    targetScore: 5,
    aiSpeedBonus: 0.155,
    ballSpeedBonus: 170,
    icon: '⏳',
  },
  {
    id: 27,
    title: 'Bölüm 27: Boşluk Bekçisi',
    shortName: 'Boşluk Muhafızı',
    subtitle: 'Karanlık Madde Arenası',
    description: 'Işığın bile kaçamadığı gizemli gölge düellosu.',
    bgGradientTop: 'rgba(30, 41, 59, 0.28)',
    bgGradientBot: 'rgba(15, 23, 42, 0.30)',
    boundaryColor: '#06b6d4',
    gridPattern: 'matrix',
    gridColor: 'rgba(34, 211, 238, 0.24)',
    sensorColor: '#22d3ee',
    sensorSecondaryColor: '#0e7490',
    playerGlow: '#67e8f9',
    opponentGlow: '#f43f5e',
    accentColor: '#0891b2',
    ambientColor: '#155e75',
    targetScore: 5,
    aiSpeedBonus: 0.16,
    ballSpeedBonus: 175,
    icon: '👁️',
  },
  {
    id: 28,
    title: 'Bölüm 28: Sonsuzluk Aynası',
    shortName: 'Sonsuz Ayna',
    subtitle: 'Kusursuz Simetri & Refleks',
    description: 'Kristalize yansımalar ve yıldırım hızında ralliler.',
    bgGradientTop: 'rgba(147, 197, 253, 0.22)',
    bgGradientBot: 'rgba(192, 132, 252, 0.24)',
    boundaryColor: '#60a5fa',
    gridPattern: 'crystal',
    gridColor: 'rgba(191, 219, 254, 0.26)',
    sensorColor: '#93c5fd',
    sensorSecondaryColor: '#2563eb',
    playerGlow: '#dbeafe',
    opponentGlow: '#f43f5e',
    accentColor: '#3b82f6',
    ambientColor: '#1d4ed8',
    targetScore: 5,
    aiSpeedBonus: 0.165,
    ballSpeedBonus: 180,
    icon: '🪞',
  },
  {
    id: 29,
    title: 'Bölüm 29: Yarı Tanrılar Arenası',
    shortName: 'Yarı Tanrılar',
    subtitle: 'Büyük Final Öncesi Son Engel',
    description: 'Efsanevi gladyatörler meclisi. Rakip neredeyse hiç hata yapmaz!',
    bgGradientTop: 'rgba(245, 158, 11, 0.24)',
    bgGradientBot: 'rgba(234, 88, 12, 0.26)',
    boundaryColor: '#f59e0b',
    gridPattern: 'apex',
    gridColor: 'rgba(251, 191, 36, 0.28)',
    sensorColor: '#fbbf24',
    sensorSecondaryColor: '#b45309',
    playerGlow: '#fde68a',
    opponentGlow: '#f43f5e',
    accentColor: '#d97706',
    ambientColor: '#78350f',
    targetScore: 5,
    aiSpeedBonus: 0.17,
    ballSpeedBonus: 185,
    icon: '⚔️',
  },
  {
    id: 30,
    title: 'Bölüm 30: Büyük Çember Tapınağı',
    shortName: 'APEX FİNALİ',
    subtitle: 'Nihai Çember Efsanesi & Şampiyonluk',
    description: 'Evrenin en büyük Çember tahtı. 30 bölümün nihai zaferi seni bekliyor!',
    bgGradientTop: 'rgba(251, 191, 36, 0.30)',
    bgGradientBot: 'rgba(245, 158, 11, 0.35)',
    boundaryColor: '#f59e0b',
    gridPattern: 'apex',
    gridColor: 'rgba(253, 224, 71, 0.35)',
    sensorColor: '#fef08a',
    sensorSecondaryColor: '#d97706',
    playerGlow: '#fef9c3',
    opponentGlow: '#f43f5e',
    accentColor: '#f59e0b',
    ambientColor: '#92400e',
    targetScore: 5,
    aiSpeedBonus: 0.18,
    ballSpeedBonus: 190,
    icon: '👑',
  },
];

export const DIFFICULTY_BADGES: Record<GameDifficulty, DifficultyBadge> = {
  easiest: {
    id: 'easiest',
    name: 'Bronz Çember Rozeti',
    title: 'Acemi Gladyatör',
    icon: '🥉',
    color: '#cd7f32',
    bgColor: 'bg-amber-950/70',
    borderColor: 'border-amber-700/80',
    description: 'Easiest modunda tüm 30 bölümü tamamlayarak kazanılır.',
  },
  easy: {
    id: 'easy',
    name: 'Gümüş Çember Rozeti',
    title: 'Gezgin Savaşçı',
    icon: '🥈',
    color: '#94a3b8',
    bgColor: 'bg-slate-900/80',
    borderColor: 'border-slate-400/80',
    description: 'Easy modunda tüm 30 bölümü tamamlayarak kazanılır.',
  },
  casual: {
    id: 'casual',
    name: 'Zümrüt Çember Rozeti',
    title: 'Usta Düellocu',
    icon: '💎',
    color: '#10b981',
    bgColor: 'bg-emerald-950/70',
    borderColor: 'border-emerald-500/80',
    description: 'Casual modunda tüm 30 bölümü tamamlayarak kazanılır.',
  },
  pro: {
    id: 'pro',
    name: 'Altın Çember Rozeti',
    title: 'Arena Efsanesi',
    icon: '🥇',
    color: '#f59e0b',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-400/90',
    description: 'Pro modunda tüm 30 bölümü tamamlayarak kazanılır.',
  },
  chaos: {
    id: 'chaos',
    name: 'Kozmik Kaos Rozeti',
    title: 'Kozmik Hükümdar',
    icon: '👑',
    color: '#ec4899',
    bgColor: 'bg-pink-950/80',
    borderColor: 'border-pink-500/90',
    description: 'Chaos modunda tüm 30 bölümü tamamlayarak kazanılır.',
  },
};

const STORAGE_PREFIX = 'cember_adventure_progress_';
const BADGES_KEY = 'cember_unlocked_badges';

export function getAdventureProgress(difficulty: GameDifficulty): StageProgress[] {
  const savedMap: Record<number, StageProgress> = {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${difficulty}`);
    if (raw) {
      const parsed: StageProgress[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && item.stageId) {
            savedMap[item.stageId] = item;
          }
        });
      }
    }
  } catch {
    // ignore json error
  }

  // Construct for all 30 stages, guaranteeing that if stage N is completed, stage N+1 is unlocked!
  let prevStageCompleted = true; // Stage 1 is always unlocked
  return ADVENTURE_STAGES.map((s, idx) => {
    const existing = savedMap[s.id];
    const isCompleted = existing?.completed ?? false;
    const isUnlocked = idx === 0 || prevStageCompleted || (existing?.unlocked ?? false);
    prevStageCompleted = isCompleted;

    return {
      stageId: s.id,
      completed: isCompleted,
      unlocked: isUnlocked,
      playerScore: existing?.playerScore ?? 0,
      opponentScore: existing?.opponentScore ?? 0,
      stars: existing?.stars ?? 0,
    };
  });
}

export function saveStageProgress(
  difficulty: GameDifficulty,
  stageId: number,
  playerScore: number,
  opponentScore: number,
  isVictory: boolean = true
): { progress: StageProgress[]; newlyUnlockedBadge: DifficultyBadge | null } {
  const currentList = getAdventureProgress(difficulty);
  const targetIdx = currentList.findIndex((s) => s.stageId === stageId);

  if (targetIdx !== -1) {
    const isWin = isVictory || playerScore > opponentScore;
    if (isWin) {
      const effPlayerScore = Math.max(playerScore, opponentScore + 1);
      const diff = effPlayerScore - opponentScore;
      const stars = opponentScore === 0 || diff >= 3 ? 3 : diff >= 2 ? 2 : 1;

      currentList[targetIdx].completed = true;
      currentList[targetIdx].playerScore = Math.max(currentList[targetIdx].playerScore, effPlayerScore);
      currentList[targetIdx].opponentScore = opponentScore;
      currentList[targetIdx].stars = Math.max(currentList[targetIdx].stars, stars);

      // Unlock next stage if exists (all the way to stage 30)
      if (targetIdx + 1 < currentList.length) {
        currentList[targetIdx + 1].unlocked = true;
      }
    }
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${difficulty}`, JSON.stringify(currentList));
  } catch {
    // ignore
  }

  // Check if all 30 stages completed in this difficulty
  const allCompleted = currentList.length === 30 && currentList.every((s) => s.completed);
  let newlyUnlockedBadge: DifficultyBadge | null = null;

  if (allCompleted) {
    newlyUnlockedBadge = unlockBadge(difficulty);
  }

  return { progress: currentList, newlyUnlockedBadge };
}

export function getUnlockedBadges(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function unlockBadge(difficulty: GameDifficulty): DifficultyBadge | null {
  const badges = getUnlockedBadges();
  const badgeConfig = DIFFICULTY_BADGES[difficulty];
  if (!badges[difficulty]) {
    badges[difficulty] = true;
    try {
      localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    } catch {
      // ignore
    }
    return badgeConfig;
  }
  return null;
}
