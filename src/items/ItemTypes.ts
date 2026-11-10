export type ItemCategory = 'consumable' | 'material' | 'treasure';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  maxStack: number;
  effectValue?: number; // e.g., HP to restore
  color: string;
  renderIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  HEALTH_POTION: {
    id: 'HEALTH_POTION',
    name: 'Ramuan Darah',
    description: 'Memulihkan 35 HP secara instan.',
    category: 'consumable',
    maxStack: 10,
    effectValue: 35,
    color: '#ef4444',
    renderIcon: (ctx, x, y, size) => {
      // Bottle neck & cork
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x + size * 0.4, y + size * 0.1, size * 0.2, size * 0.15);
      // Glass body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.6, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Red liquid inside
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.65, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // Glass shine highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.35, y + size * 0.45, size * 0.1, size * 0.15);
    }
  },
  BRONZE_COIN: {
    id: 'BRONZE_COIN',
    name: 'Koin Tembaga Purba',
    description: 'Koin tembaga kuno peninggalan peradaban bawah tanah. Dapat ditukar di Bank seharga 10 Val.',
    category: 'treasure',
    maxStack: 999,
    color: '#d97706',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.font = `bold ${Math.floor(size * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', x + size * 0.5, y + size * 0.5);
    }
  },
  SILVER_COIN: {
    id: 'SILVER_COIN',
    name: 'Koin Perak Kuno',
    description: 'Koin perak berukir lambang ksatria purba. Dapat ditukar di Bank seharga 100 Val.',
    category: 'treasure',
    maxStack: 999,
    color: '#cbd5e1',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.font = `bold ${Math.floor(size * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', x + size * 0.5, y + size * 0.5);
    }
  },
  GOLD_COIN: {
    id: 'GOLD_COIN',
    name: 'Koin Emas Abisal',
    description: 'Koin emas murni dari monster dan peti dungeon. Dapat ditukar di Bank seharga 1.000 Val.',
    category: 'treasure',
    maxStack: 999,
    color: '#eab308',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a16207';
      ctx.font = `bold ${Math.floor(size * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('G', x + size * 0.5, y + size * 0.5);
    }
  },
  PLATINUM_COIN: {
    id: 'PLATINUM_COIN',
    name: 'Koin Platina Raja Purba',
    description: 'Koin platina berkilau kemakmuran peninggalan raja purba abisal. Dapat ditukar di Bank seharga 10.000 Val!',
    category: 'treasure',
    maxStack: 999,
    color: '#a5b4fc',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c7d2fe';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4338ca';
      ctx.font = `bold ${Math.floor(size * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', x + size * 0.5, y + size * 0.5);
    }
  },
  WOOD_LOG: {
    id: 'WOOD_LOG',
    name: 'Kayu Ek',
    description: 'Bahan dasar untuk membuat peralatan atau api unggun.',
    category: 'material',
    maxStack: 50,
    color: '#92400e',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.6, size * 0.38);
      // Rings on the side
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.2, y + size * 0.49, size * 0.1, size * 0.19, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wood bark grooves
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + size * 0.4, y + size * 0.38, size * 0.25, 2);
    }
  },
  MAGIC_FLOWER: {
    id: 'MAGIC_FLOWER',
    name: 'Bunga Mistis',
    description: 'Bunga langka yang memancarkan aura sihir biru.',
    category: 'material',
    maxStack: 30,
    color: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Petals
      ctx.fillStyle = '#38bdf8';
      const petals = 4;
      for (let i = 0; i < petals; i++) {
        const angle = (i * Math.PI * 2) / petals;
        const px = x + size * 0.5 + Math.cos(angle) * (size * 0.22);
        const py = y + size * 0.5 + Math.sin(angle) * (size * 0.22);
        ctx.beginPath();
        ctx.arc(px, py, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      // Core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  ADVENTURER_CARD: {
    id: 'ADVENTURER_CARD',
    name: 'Kartu Petualang',
    description: 'Kartu identitas resmi Serikat Guild Elaine. Memuat takdir role jiwa sejati yang terikat permanen seumur hidup.',
    category: 'treasure',
    maxStack: 1,
    color: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Card Base (deep royal navy)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + size * 0.14, y + size * 0.18, size * 0.72, size * 0.64);
      // Gold Filigree Border
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x + size * 0.14, y + size * 0.18, size * 0.72, size * 0.64);

      // Card Header Banner
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + size * 0.16, y + size * 0.2, size * 0.68, size * 0.12);

      // Identity Photo Box
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + size * 0.2, y + size * 0.38, size * 0.24, size * 0.32);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.25, y + size * 0.42, size * 0.14, size * 0.12);
      ctx.fillRect(x + size * 0.22, y + size * 0.58, size * 0.2, size * 0.1);

      // Text Lines (Data Stripes)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + size * 0.5, y + size * 0.4, size * 0.28, 2);
      ctx.fillRect(x + size * 0.5, y + size * 0.48, size * 0.24, 2);
      ctx.fillRect(x + size * 0.5, y + size * 0.56, size * 0.2, 2);

      // Red Wax Guild Seal Stamp
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + size * 0.68, y + size * 0.66, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + size * 0.66, y + size * 0.64, 2, 2);
    }
  },
  MANA_POTION: {
    id: 'MANA_POTION',
    name: 'Ramuan Mana',
    description: 'Memulihkan 40 MP secara instan dengan ekstrak esensi sihir biru.',
    category: 'consumable',
    maxStack: 10,
    effectValue: 40,
    color: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Bottle cork
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x + size * 0.4, y + size * 0.1, size * 0.2, size * 0.15);
      // Glass body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.6, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Blue liquid inside
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.65, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // Cyan inner glow
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.68, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Glass highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.35, y + size * 0.45, size * 0.1, size * 0.15);
    }
  },
  SLIME_JELLY: {
    id: 'SLIME_JELLY',
    name: 'Jeli Slime Gua',
    description: 'Cairan kental kenyal dari slime goa yang berharga bagi alkemis.',
    category: 'material',
    maxStack: 30,
    color: '#10b981',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.55, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(x + size * 0.45, y + size * 0.45, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.4, y + size * 0.4, size * 0.08, size * 0.08);
    }
  },
  ANCIENT_BONE: {
    id: 'ANCIENT_BONE',
    name: 'Tulang Purba',
    description: 'Tulang berfosil dari dungeon kuno yang menyimpan residu energi sihir.',
    category: 'material',
    maxStack: 25,
    color: '#cbd5e1',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(x + size * 0.3, y + size * 0.4, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x + size * 0.3, y + size * 0.6, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x + size * 0.7, y + size * 0.4, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x + size * 0.7, y + size * 0.6, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + size * 0.3, y + size * 0.45, size * 0.4, size * 0.14);
    }
  },
  DUNGEON_GEM: {
    id: 'DUNGEON_GEM',
    name: 'Permata Bawah Tanah',
    description: 'Kristal ungu mistis langka dari lubuk goa terdalam. Bernilai emas tinggi.',
    category: 'treasure',
    maxStack: 50,
    color: '#c084fc',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.2);
      ctx.lineTo(x + size * 0.8, y + size * 0.45);
      ctx.lineTo(x + size * 0.5, y + size * 0.82);
      ctx.lineTo(x + size * 0.2, y + size * 0.45);
      ctx.closePath();
      ctx.fill();
      // Facet highlight
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.2);
      ctx.lineTo(x + size * 0.65, y + size * 0.45);
      ctx.lineTo(x + size * 0.5, y + size * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.45, y + size * 0.35, size * 0.1, size * 0.1);
    }
  },
  DARK_IRON_ORE: {
    id: 'DARK_IRON_ORE',
    name: 'Bijih Besi Gelap',
    description: 'Bijih logam hitam pekat dari goa terdalam. Bahan utama menempa persenjataan khusus.',
    category: 'material',
    maxStack: 50,
    color: '#64748b',
    renderIcon: (ctx, x, y, size) => {
      // Dark rock cluster
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, y + size * 0.7);
      ctx.lineTo(x + size * 0.38, y + size * 0.25);
      ctx.lineTo(x + size * 0.75, y + size * 0.32);
      ctx.lineTo(x + size * 0.85, y + size * 0.75);
      ctx.lineTo(x + size * 0.5, y + size * 0.85);
      ctx.closePath();
      ctx.fill();
      // Metallic mineral facets
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.35, y + size * 0.35);
      ctx.lineTo(x + size * 0.65, y + size * 0.3);
      ctx.lineTo(x + size * 0.55, y + size * 0.68);
      ctx.closePath();
      ctx.fill();
      // Shiny iron vein gleam
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + size * 0.45, y + size * 0.4, size * 0.12, size * 0.08);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.48, y + size * 0.42, 2, 2);
    }
  },
  WOLF_MEAT: {
    id: 'WOLF_MEAT',
    name: 'Daging Serigala',
    description: 'Daging segar berotot dari serigala rimba. Bahan dasar masakan bernutrisi tinggi.',
    category: 'material',
    maxStack: 30,
    color: '#f87171',
    renderIcon: (ctx, x, y, size) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(x + size * 0.2, y + size * 0.3, size * 0.6, size * 0.4, 4);
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x + size * 0.35, y + size * 0.4, size * 0.3, size * 0.08);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + size * 0.22, y + size * 0.5, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  WOLF_STEAK: {
    id: 'WOLF_STEAK',
    name: 'Steak Serigala Rimba',
    description: 'Steak lezat gurih beraroma harum. Memulihkan 60 HP dan memberi buff +20% Serangan Fisik selama 3 menit.',
    category: 'consumable',
    maxStack: 10,
    effectValue: 60,
    color: '#fb923c',
    renderIcon: (ctx, x, y, size) => {
      // Plate
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.65, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Grilled meat
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(x + size * 0.25, y + size * 0.42, size * 0.5, size * 0.28, 4);
      ctx.fill();
      // Grill marks
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + size * (0.4 + i * 0.12), y + size * 0.44);
        ctx.lineTo(x + size * (0.48 + i * 0.12), y + size * 0.68);
        ctx.stroke();
      }
    }
  },
  SLIME_PUDDING: {
    id: 'SLIME_PUDDING',
    name: 'Puding Kristal Slime',
    description: 'Puding manis kenyal berkilau. Memulihkan 50 MP dan memberi buff regenerasi Mana pesat selama 3 menit.',
    category: 'consumable',
    maxStack: 10,
    effectValue: 50,
    color: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Dish
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.72, size * 0.38, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Jelly Dome
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.26, Math.PI, 0, false);
      ctx.lineTo(x + size * 0.76, y + size * 0.68);
      ctx.lineTo(x + size * 0.24, y + size * 0.68);
      ctx.closePath();
      ctx.fill();
      // Glossy highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.4, y + size * 0.38, size * 0.1, size * 0.08);
    }
  },
  MYSTIC_SOUP: {
    id: 'MYSTIC_SOUP',
    name: 'Sup Bunga Mistis',
    description: 'Sup herbal ajaib mengepulkan uap wangi. Memberi buff +25% Kecepatan Gerak dan +25% Bonus EXP selama 3 menit.',
    category: 'consumable',
    maxStack: 10,
    effectValue: 40,
    color: '#4ade80',
    renderIcon: (ctx, x, y, size) => {
      // Wooden bowl
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.58, size * 0.35, 0, Math.PI, false);
      ctx.fill();
      // Green herbal broth
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.58, size * 0.32, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Steam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.4, y + size * 0.45);
      ctx.quadraticCurveTo(x + size * 0.35, y + size * 0.3, x + size * 0.42, y + size * 0.2);
      ctx.moveTo(x + size * 0.6, y + size * 0.45);
      ctx.quadraticCurveTo(x + size * 0.65, y + size * 0.3, x + size * 0.58, y + size * 0.2);
      ctx.stroke();
    }
  },
  ELIXIR_FULL: {
    id: 'ELIXIR_FULL',
    name: 'Elixir Agung',
    description: 'Ramuan legendaris peninggalan permaisuri sihir. Memulihkan 100% HP dan 100% MP secara instan!',
    category: 'consumable',
    maxStack: 20,
    effectValue: 9999,
    color: '#ec4899',
    renderIcon: (ctx, x, y, size) => {
      // Crystal diamond bottle
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.15);
      ctx.lineTo(x + size * 0.8, y + size * 0.55);
      ctx.lineTo(x + size * 0.5, y + size * 0.85);
      ctx.lineTo(x + size * 0.2, y + size * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.45, y + size * 0.45, size * 0.1, size * 0.1);
    }
  },
  PORTAL_SCROLL: {
    id: 'PORTAL_SCROLL',
    name: 'Gulungan Teleportasi',
    description: 'Gulungan sihir teleportasi darurat yang seketika membawamu kembali ke Alun-Alun Serena.',
    category: 'consumable',
    maxStack: 10,
    color: '#38bdf8',
    renderIcon: (ctx, x, y, size) => {
      // Rolled parchment
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(x + size * 0.25, y + size * 0.28, size * 0.5, size * 0.44);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + size * 0.2, y + size * 0.25, size * 0.1, size * 0.5);
      ctx.fillRect(x + size * 0.7, y + size * 0.25, size * 0.1, size * 0.5);
      // Blue magic ribbon seal
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + size * 0.44, y + size * 0.4, size * 0.12, size * 0.2);
    }
  }
};
