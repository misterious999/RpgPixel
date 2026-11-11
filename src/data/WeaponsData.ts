import { RoleType } from '../types/GameTypes.ts';

export type WeaponTier = 'DEFAULT' | 'RARE' | 'CUSTOM';

export interface WeaponRecipeItem {
  itemId: string;
  count: number;
}

export interface WeaponData {
  id: string;
  role: RoleType;
  tier: WeaponTier;
  name: string;
  title: string;
  description: string;
  atkBonus: number;
  hpBonus?: number;
  mpBonus?: number;
  critBonus?: number; // e.g. 0.15 = +15%
  specialPerk: string;
  goldCost?: number; // for RARE
  recipe?: WeaponRecipeItem[]; // for CUSTOM
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  themeColor: string;
  renderIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
}

export const WEAPONS_DATA: Record<string, WeaponData> = {
  // ==========================================
  // 1. KNIGHT WEAPONS
  // ==========================================
  KNIGHT_DEFAULT: {
    id: 'KNIGHT_DEFAULT',
    role: 'KNIGHT',
    tier: 'DEFAULT',
    name: 'Pedang Baja Tempa',
    title: 'Pedang Dasar Ksatria',
    description: 'Pedang baja standar prajurit kerajaan.',
    atkBonus: 0,
    specialPerk: 'Senjata bawaan dasar ksatria.',
    badgeText: 'BAWAAN',
    badgeBg: 'rgba(100, 116, 139, 0.25)',
    badgeBorder: '#64748b',
    badgeColor: '#cbd5e1',
    themeColor: '#94a3b8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + size * 0.45, y + size * 0.7, size * 0.1, size * 0.2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size * 0.35, y + size * 0.65, size * 0.3, size * 0.08);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + size * 0.45, y + size * 0.15, size * 0.1, size * 0.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.48, y + size * 0.15, size * 0.04, size * 0.5);
    }
  },
  KNIGHT_RARE: {
    id: 'KNIGHT_RARE',
    role: 'KNIGHT',
    tier: 'RARE',
    name: 'Pedang Ksatria Kerajaan',
    title: 'Royal Knight Greatsword',
    description: 'Pedang pusaka berlapis emas murni dengan ketajaman luar biasa. Senjata kebanggaan bangsawan.',
    atkBonus: 18,
    hpBonus: 25,
    goldCost: 6,
    specialPerk: '🛡️ Pelindung Baja: Menambah +18 ATK & +25 Max HP.',
    badgeText: 'RARE · BELI LANGSUNG',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeBorder: '#38bdf8',
    badgeColor: '#38bdf8',
    themeColor: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Golden pommel & grip
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + size * 0.44, y + size * 0.72, size * 0.12, size * 0.2);
      // Winged royal crossguard
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size * 0.28, y + size * 0.66, size * 0.44, size * 0.08);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + size * 0.46, y + size * 0.66, size * 0.08, size * 0.08);
      // Royal blue fuller & diamond blade
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(x + size * 0.42, y + size * 0.12, size * 0.16, size * 0.54);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + size * 0.48, y + size * 0.16, size * 0.04, size * 0.46);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.44, y + size * 0.12, size * 0.03, size * 0.52);
    }
  },
  KNIGHT_CUSTOM: {
    id: 'KNIGHT_CUSTOM',
    role: 'KNIGHT',
    tier: 'CUSTOM',
    name: 'Pedang Magma Abyss',
    title: 'Abyssal Magma Blade',
    description: 'Ditempa khusus dari bijih besi gelap dan kristal magma goa bawah tanah. Memancarkan kobaran api neraka membara.',
    atkBonus: 38,
    hpBonus: 50,
    recipe: [
      { itemId: 'SLIME_JELLY', count: 8 },
      { itemId: 'ANCIENT_BONE', count: 6 },
      { itemId: 'DUNGEON_GEM', count: 3 },
      { itemId: 'DARK_IRON_ORE', count: 10 }
    ],
    specialPerk: '🔥 Bara Neraka: Menambah +38 ATK & +50 Max HP, tebasan membakar musuh!',
    badgeText: 'EPIK · KUSTOM DUNGEON',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    badgeBorder: '#ef4444',
    badgeColor: '#f87171',
    themeColor: '#ef4444',
    renderIcon: (ctx, x, y, size) => {
      // Dark demon obsidian hilt
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + size * 0.43, y + size * 0.72, size * 0.14, size * 0.2);
      // Molten horned crossguard
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(x + size * 0.25, y + size * 0.65, size * 0.5, size * 0.09);
      // Fiery Obsidian Blade
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + size * 0.38, y + size * 0.1, size * 0.24, size * 0.55);
      // Molten magma core
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + size * 0.45, y + size * 0.15, size * 0.1, size * 0.46);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + size * 0.47, y + size * 0.2, size * 0.06, size * 0.38);
      // Sparks
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + size * 0.3, y + size * 0.2, 3, 3);
      ctx.fillRect(x + size * 0.68, y + size * 0.3, 3, 3);
    }
  },

  // ==========================================
  // 2. MAGICIAN WEAPONS
  // ==========================================
  MAGICIAN_DEFAULT: {
    id: 'MAGICIAN_DEFAULT',
    role: 'MAGICIAN',
    tier: 'DEFAULT',
    name: 'Tongkat Kayu Sihir',
    title: 'Tongkat Magis Dasar',
    description: 'Tongkat kayu ek dengan kristal penyalur sihir sederhana.',
    atkBonus: 0,
    specialPerk: 'Senjata bawaan dasar penyihir.',
    badgeText: 'BAWAAN',
    badgeBg: 'rgba(100, 116, 139, 0.25)',
    badgeBorder: '#64748b',
    badgeColor: '#cbd5e1',
    themeColor: '#94a3b8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + size * 0.46, y + size * 0.3, size * 0.08, size * 0.62);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size * 0.38, y + size * 0.22, size * 0.24, size * 0.08);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.15, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  MAGICIAN_RARE: {
    id: 'MAGICIAN_RARE',
    role: 'MAGICIAN',
    tier: 'RARE',
    name: 'Tongkat Safir Bintang',
    title: 'Star Sapphire Staff',
    description: 'Tongkat berlapis perak murni dengan permata safir langit yang melipatgandakan regenerasi mana.',
    atkBonus: 16,
    mpBonus: 35,
    goldCost: 6,
    specialPerk: '🌌 Aliran Bintang: Menambah +16 ATK & +35 Max MP.',
    badgeText: 'RARE · BELI LANGSUNG',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeBorder: '#38bdf8',
    badgeColor: '#38bdf8',
    themeColor: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + size * 0.46, y + size * 0.3, size * 0.08, size * 0.62);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x + size * 0.34, y + size * 0.22, size * 0.32, size * 0.08);
      // Brilliant star sapphire
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.15, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.47, y + size * 0.12, size * 0.06, size * 0.06);
    }
  },
  MAGICIAN_CUSTOM: {
    id: 'MAGICIAN_CUSTOM',
    role: 'MAGICIAN',
    tier: 'CUSTOM',
    name: 'Tongkat Kosmik Abyss',
    title: 'Abyssal Void Scepter',
    description: 'Artefak kuno yang memancarkan pusaran nebula galaksi gelap, melipatgandakan daya hancur sihir.',
    atkBonus: 36,
    mpBonus: 65,
    recipe: [
      { itemId: 'SLIME_JELLY', count: 10 },
      { itemId: 'ANCIENT_BONE', count: 5 },
      { itemId: 'DUNGEON_GEM', count: 4 },
      { itemId: 'DARK_IRON_ORE', count: 10 }
    ],
    specialPerk: '🔮 Resonansi Astral: Menambah +36 ATK & +65 Max MP, ledakan sihir kosmik!',
    badgeText: 'EPIK · KUSTOM DUNGEON',
    badgeBg: 'rgba(168, 85, 247, 0.25)',
    badgeBorder: '#a855f7',
    badgeColor: '#c084fc',
    themeColor: '#a855f7',
    renderIcon: (ctx, x, y, size) => {
      // Cosmic black rod
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.1, size * 0.62);
      // Golden celestial prongs
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size * 0.32, y + size * 0.2, size * 0.36, size * 0.08);
      // Cosmic void vortex orb
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.14, size * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.14, size * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.47, y + size * 0.11, size * 0.06, size * 0.06);
      // Orbiting star dots
      ctx.fillStyle = '#f0abfc';
      ctx.fillRect(x + size * 0.28, y + size * 0.12, 3, 3);
      ctx.fillRect(x + size * 0.7, y + size * 0.16, 3, 3);
    }
  },

  // ==========================================
  // 3. ASSASSIN WEAPONS
  // ==========================================
  ASSASSIN_DEFAULT: {
    id: 'ASSASSIN_DEFAULT',
    role: 'ASSASSIN',
    tier: 'DEFAULT',
    name: 'Belati Kembar Biasa',
    title: 'Belati Bayangan Dasar',
    description: 'Sepasang belati pendek dengan racun ular ringan.',
    atkBonus: 0,
    specialPerk: 'Senjata bawaan dasar pembunuh bayangan.',
    badgeText: 'BAWAAN',
    badgeBg: 'rgba(100, 116, 139, 0.25)',
    badgeBorder: '#64748b',
    badgeColor: '#cbd5e1',
    themeColor: '#94a3b8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + size * 0.38, y + size * 0.65, size * 0.08, size * 0.2);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + size * 0.38, y + size * 0.25, size * 0.08, size * 0.4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + size * 0.56, y + size * 0.65, size * 0.08, size * 0.2);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + size * 0.56, y + size * 0.25, size * 0.08, size * 0.4);
    }
  },
  ASSASSIN_RARE: {
    id: 'ASSASSIN_RARE',
    role: 'ASSASSIN',
    tier: 'RARE',
    name: 'Belati Bayangan Kelelawar',
    title: 'Phantom Shadow Daggers',
    description: 'Bilah baja hitam yang sangat tipis dan ringan untuk tusukan titik vital mematikan.',
    atkBonus: 17,
    critBonus: 0.15,
    goldCost: 6,
    specialPerk: '⚡ Siluman Malam: Menambah +17 ATK & +15% Peluang Kritikal.',
    badgeText: 'RARE · BELI LANGSUNG',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeBorder: '#38bdf8',
    badgeColor: '#38bdf8',
    themeColor: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Left Dagger
      ctx.fillStyle = '#090d16';
      ctx.fillRect(x + size * 0.34, y + size * 0.68, size * 0.08, size * 0.2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x + size * 0.34, y + size * 0.2, size * 0.08, size * 0.48);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.38, y + size * 0.2, size * 0.03, size * 0.46);

      // Right Dagger
      ctx.fillStyle = '#090d16';
      ctx.fillRect(x + size * 0.58, y + size * 0.68, size * 0.08, size * 0.2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x + size * 0.58, y + size * 0.2, size * 0.08, size * 0.48);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.62, y + size * 0.2, size * 0.03, size * 0.46);
    }
  },
  ASSASSIN_CUSTOM: {
    id: 'ASSASSIN_CUSTOM',
    role: 'ASSASSIN',
    tier: 'CUSTOM',
    name: 'Cakar Iblis Gua (Abyssal Claws)',
    title: 'Abyssal Demon Claws',
    description: 'Belati bergerigi merah darah dari cakar iblis purba. Mengalirkan racun kutukan pembunuh dalam sekejap.',
    atkBonus: 37,
    critBonus: 0.25,
    recipe: [
      { itemId: 'SLIME_JELLY', count: 6 },
      { itemId: 'ANCIENT_BONE', count: 8 },
      { itemId: 'DUNGEON_GEM', count: 3 },
      { itemId: 'DARK_IRON_ORE', count: 10 }
    ],
    specialPerk: '☠️ Racun Kematian: Menambah +37 ATK, +25% Peluang Kritikal & asap bayangan!',
    badgeText: 'EPIK · KUSTOM DUNGEON',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    badgeBorder: '#ef4444',
    badgeColor: '#f87171',
    themeColor: '#ef4444',
    renderIcon: (ctx, x, y, size) => {
      // Crimson Serrated Claws
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(x + size * 0.32, y + size * 0.68, size * 0.1, size * 0.2);
      ctx.fillRect(x + size * 0.58, y + size * 0.68, size * 0.1, size * 0.2);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.14, size * 0.53);
      ctx.fillRect(x + size * 0.56, y + size * 0.15, size * 0.14, size * 0.53);

      // Serrated teeth & glow
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x + size * 0.26, y + size * 0.3, size * 0.08, size * 0.08);
      ctx.fillRect(x + size * 0.26, y + size * 0.45, size * 0.08, size * 0.08);
      ctx.fillRect(x + size * 0.66, y + size * 0.3, size * 0.08, size * 0.08);
      ctx.fillRect(x + size * 0.66, y + size * 0.45, size * 0.08, size * 0.08);
    }
  },

  // ==========================================
  // 4. HEALER WEAPONS
  // ==========================================
  HEALER_DEFAULT: {
    id: 'HEALER_DEFAULT',
    role: 'HEALER',
    tier: 'DEFAULT',
    name: 'Tongkat Salib Kayu',
    title: 'Tongkat Suci Pemula',
    description: 'Tongkat salib kayu sederhana untuk menyalurkan doa pemulihan.',
    atkBonus: 0,
    specialPerk: 'Senjata bawaan dasar penyembuh suci.',
    badgeText: 'BAWAAN',
    badgeBg: 'rgba(100, 116, 139, 0.25)',
    badgeBorder: '#64748b',
    badgeColor: '#cbd5e1',
    themeColor: '#94a3b8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + size * 0.46, y + size * 0.25, size * 0.08, size * 0.65);
      ctx.fillRect(x + size * 0.32, y + size * 0.35, size * 0.36, size * 0.08);
    }
  },
  HEALER_RARE: {
    id: 'HEALER_RARE',
    role: 'HEALER',
    tier: 'RARE',
    name: 'Tongkat Cahaya Fajar',
    title: 'Dawnlight Scepter',
    description: 'Scepter berlapis emas dari kuil fajar dengan permata berkat suci.',
    atkBonus: 14,
    hpBonus: 30,
    mpBonus: 20,
    goldCost: 5,
    specialPerk: '☀️ Cahaya Fajar: Menambah +14 ATK, +30 Max HP, & +20 Max MP.',
    badgeText: 'RARE · BELI LANGSUNG',
    badgeBg: 'rgba(234, 179, 8, 0.2)',
    badgeBorder: '#eab308',
    badgeColor: '#fde047',
    themeColor: '#eab308',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(x + size * 0.46, y + size * 0.28, size * 0.08, size * 0.64);
      // Golden solar cross
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size * 0.3, y + size * 0.34, size * 0.4, size * 0.08);
      // Holy dawn crystal
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.18, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.48, y + size * 0.16, 3, 3);
    }
  },
  HEALER_CUSTOM: {
    id: 'HEALER_CUSTOM',
    role: 'HEALER',
    tier: 'CUSTOM',
    name: 'Relik Seraphim Kuno',
    title: 'Ancient Seraphim Relic',
    description: 'Relik bersayap malaikat yang memancarkan aura suci pelindung tanpa henti.',
    atkBonus: 32,
    hpBonus: 55,
    mpBonus: 50,
    recipe: [
      { itemId: 'SLIME_JELLY', count: 8 },
      { itemId: 'ANCIENT_BONE', count: 7 },
      { itemId: 'DUNGEON_GEM', count: 3 },
      { itemId: 'DARK_IRON_ORE', count: 10 }
    ],
    specialPerk: '🕊️ Berkat Ilahi: Menambah +32 ATK, +55 Max HP, +50 Max MP, & aura pelindung suci!',
    badgeText: 'EPIK · KUSTOM DUNGEON',
    badgeBg: 'rgba(250, 204, 21, 0.25)',
    badgeBorder: '#facc15',
    badgeColor: '#fde047',
    themeColor: '#facc15',
    renderIcon: (ctx, x, y, size) => {
      // Angelic gold rod
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + size * 0.45, y + size * 0.3, size * 0.1, size * 0.62);
      // Winged Seraphim crest
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.3);
      ctx.lineTo(x + size * 0.2, y + size * 0.15);
      ctx.lineTo(x + size * 0.35, y + size * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.3);
      ctx.lineTo(x + size * 0.8, y + size * 0.15);
      ctx.lineTo(x + size * 0.65, y + size * 0.38);
      ctx.closePath();
      ctx.fill();
      // Glowing divine halo
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.16, size * 0.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.16, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ==========================================
  // 5. NECROMANCER WEAPONS
  // ==========================================
  NECROMANCER_DEFAULT: {
    id: 'NECROMANCER_DEFAULT',
    role: 'NECROMANCER',
    tier: 'DEFAULT',
    name: 'Sabit Tulang Pemula',
    title: 'Sabit Tulang Kematian',
    description: 'Sabit kecil dari tulang binatang untuk menyalurkan energi kutukan.',
    atkBonus: 0,
    specialPerk: 'Senjata bawaan dasar ahli sihir kematian.',
    badgeText: 'BAWAAN',
    badgeBg: 'rgba(100, 116, 139, 0.25)',
    badgeBorder: '#64748b',
    badgeColor: '#cbd5e1',
    themeColor: '#94a3b8',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + size * 0.46, y + size * 0.25, size * 0.08, size * 0.65);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + size * 0.24, y + size * 0.2, size * 0.3, size * 0.08);
      ctx.fillRect(x + size * 0.2, y + size * 0.28, size * 0.08, size * 0.18);
    }
  },
  NECROMANCER_RARE: {
    id: 'NECROMANCER_RARE',
    role: 'NECROMANCER',
    tier: 'RARE',
    name: 'Sabit Roh Penjarah',
    title: 'Soul Harvester Scythe',
    description: 'Sabit melengkung bertepi tajam terkutuk dengan kristal jiwa yang memanen energi arwah.',
    atkBonus: 19,
    mpBonus: 25,
    goldCost: 7,
    specialPerk: '💀 Penjarah Arwah: Menambah +19 ATK & +25 Max MP.',
    badgeText: 'RARE · BELI LANGSUNG',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
    badgeBorder: '#a855f7',
    badgeColor: '#d8b4fe',
    themeColor: '#a855f7',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x + size * 0.5, y + size * 0.25, size * 0.08, size * 0.65);
      // Curved Scythe Blade
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.54, y + size * 0.2);
      ctx.lineTo(x + size * 0.16, y + size * 0.15);
      ctx.lineTo(x + size * 0.2, y + size * 0.46);
      ctx.lineTo(x + size * 0.32, y + size * 0.26);
      ctx.closePath();
      ctx.fill();
      // Glowing purple soul eye
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(x + size * 0.52, y + size * 0.22, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.51, y + size * 0.21, 2, 2);
    }
  },
  NECROMANCER_CUSTOM: {
    id: 'NECROMANCER_CUSTOM',
    role: 'NECROMANCER',
    tier: 'CUSTOM',
    name: 'Sabit Jiwa Kegelapan Abadi',
    title: 'Grim Reaper Soulscythe',
    description: 'Sabit raksasa purba dari fosil naga bawah tanah yang diselimuti api ungu kematian abadi.',
    atkBonus: 40,
    mpBonus: 55,
    recipe: [
      { itemId: 'SLIME_JELLY', count: 7 },
      { itemId: 'ANCIENT_BONE', count: 9 },
      { itemId: 'DUNGEON_GEM', count: 4 },
      { itemId: 'DARK_IRON_ORE', count: 10 }
    ],
    specialPerk: '🌑 Hisapan Jiwa: Menambah +40 ATK & +55 Max MP, api ungu pembantai!',
    badgeText: 'EPIK · KUSTOM DUNGEON',
    badgeBg: 'rgba(147, 51, 234, 0.25)',
    badgeBorder: '#9333ea',
    badgeColor: '#c084fc',
    themeColor: '#9333ea',
    renderIcon: (ctx, x, y, size) => {
      // Dragon bone shaft
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + size * 0.52, y + size * 0.2, size * 0.09, size * 0.72);
      // Gigantic abyssal scythe curved blade
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.56, y + size * 0.15);
      ctx.lineTo(x + size * 0.1, y + size * 0.08);
      ctx.lineTo(x + size * 0.16, y + size * 0.55);
      ctx.lineTo(x + size * 0.3, y + size * 0.26);
      ctx.closePath();
      ctx.fill();
      // Violet void flame edge
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.52, y + size * 0.18);
      ctx.lineTo(x + size * 0.13, y + size * 0.12);
      ctx.lineTo(x + size * 0.18, y + size * 0.5);
      ctx.lineTo(x + size * 0.25, y + size * 0.22);
      ctx.closePath();
      ctx.fill();
      // Glowing skull core
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(x + size * 0.54, y + size * 0.22, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + size * 0.51, y + size * 0.2, 2, 2);
      ctx.fillRect(x + size * 0.56, y + size * 0.2, 2, 2);
    }
  }
};

/**
 * Mengambil daftar senjata berdasarkan role
 */
export function getWeaponsForRole(role: RoleType): WeaponData[] {
  const result: WeaponData[] = [];
  for (const key in WEAPONS_DATA) {
    if (WEAPONS_DATA[key].role === role) {
      result.push(WEAPONS_DATA[key]);
    }
  }
  return result;
}
