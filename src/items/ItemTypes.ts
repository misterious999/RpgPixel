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
  GOLD_COIN: {
    id: 'GOLD_COIN',
    name: 'Koin Emas',
    description: 'Mata uang kerajaan yang berkilau.',
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
      ctx.fillText('$', x + size * 0.5, y + size * 0.5);
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
  }
};
