import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export type InteriorId =
  | 'GUILD_HALL'
  | 'BLACKSMITH_SHOP'
  | 'APOTHECARY_INN'
  | 'ADVENTURER_KITCHEN'
  | 'ROYAL_BANK'
  | 'ELDORIA_SANCTUARY'
  | 'STONEWATCH_FOUNDRY';

export interface BuildingDoorDef {
  id: InteriorId;
  name: string;
  tag: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  // Overworld Door position
  doorWorldX: number;
  doorWorldY: number;
  overworldSpawnX: number;
  overworldSpawnY: number;
  // Interior Dimensions
  roomWidth: number; // in tiles
  roomHeight: number; // in tiles
  insideSpawnX: number; // in world pixels inside room
  insideSpawnY: number;
  insideDoorX: number;
  insideDoorY: number;
}

export interface NearbyInteriorAction {
  type:
    | 'DOOR_EXIT'
    | 'ELAINE'
    | 'QUEST_BOARD'
    | 'COMPANION_HIRE'
    | 'GALAHAD'
    | 'KAELEN'
    | 'IGNIS'
    | 'MORGRIM'
    | 'BROKK'
    | 'LILY'
    | 'INN_BED'
    | 'CHEF_GASTON'
    | 'KITCHEN_CAULDRON'
    | 'BANK_TELLER'
    | 'SYLAS'
    | 'ARIA'
    | 'BORIN'
    | 'GRIMM';
  prompt: string;
  color: string;
  x: number;
  y: number;
}

export class BuildingInteriors {
  private animTimer: number = 0;
  public activeInterior: InteriorId | null = null;

  public readonly doors: Record<InteriorId, BuildingDoorDef>;

  constructor() {
    const ts = CONSTANTS.TILE_SIZE;

    this.doors = {
      // 1. Balai Besar Serikat Petualang Serena (Grand Guild Hall)
      GUILD_HALL: {
        id: 'GUILD_HALL',
        name: 'Balai Besar Serikat Petualang',
        tag: '🏛️ Balai Serikat',
        subtitle: '~ Altar Kebangkitan Takdir & Papan Misi Serikat ~',
        icon: '🏛️',
        accentColor: '#facc15',
        doorWorldX: 50 * ts,
        doorWorldY: 48.5 * ts,
        overworldSpawnX: 50 * ts + 6,
        overworldSpawnY: 50 * ts + 4,
        roomWidth: 18,
        roomHeight: 14,
        insideSpawnX: 9 * ts + 6,
        insideSpawnY: 11 * ts,
        insideDoorX: 9 * ts,
        insideDoorY: 12.5 * ts
      },

      // 2. Bengkel Pandai Besi Brokk (Master Weaponsmith Workshop)
      BLACKSMITH_SHOP: {
        id: 'BLACKSMITH_SHOP',
        name: 'Bengkel Tempa Pandai Besi Brokk',
        tag: '⚒️ Bengkel Besi',
        subtitle: '~ Tempat Penempaan & Peningkatan Senjata Legendaris ~',
        icon: '⚒️',
        accentColor: '#f97316',
        doorWorldX: 46 * ts,
        doorWorldY: 49 * ts,
        overworldSpawnX: 46 * ts + 6,
        overworldSpawnY: 50 * ts + 6,
        roomWidth: 16,
        roomHeight: 12,
        insideSpawnX: 8 * ts + 6,
        insideSpawnY: 9 * ts + 4,
        insideDoorX: 8 * ts,
        insideDoorY: 10.5 * ts
      },

      // 3. Toko Ramuan & Penginapan Lily (Lily's Apothecary & Inn)
      APOTHECARY_INN: {
        id: 'APOTHECARY_INN',
        name: 'Toko Ramuan & Penginapan Lily',
        tag: '🍃 Toko Ramuan & Inn',
        subtitle: '~ Ramuan Mistis & Tempat Tidur Pemulih Stamina ~',
        icon: '🍃',
        accentColor: '#34d399',
        doorWorldX: 57 * ts,
        doorWorldY: 44.5 * ts,
        overworldSpawnX: 57 * ts + 6,
        overworldSpawnY: 46 * ts + 6,
        roomWidth: 16,
        roomHeight: 12,
        insideSpawnX: 8 * ts + 6,
        insideSpawnY: 9 * ts + 4,
        insideDoorX: 8 * ts,
        insideDoorY: 10.5 * ts
      },

      // 3.5 Dapur & Kedai Kuliner Petualang (Adventurer's Kitchen & Tavern)
      ADVENTURER_KITCHEN: {
        id: 'ADVENTURER_KITCHEN',
        name: 'Dapur & Kedai Kuliner Petualang',
        tag: '🍳 Dapur Petualang',
        subtitle: '~ Dapur Kuliner Chef Gaston & Meja Jamuan Petualang ~',
        icon: '🍳',
        accentColor: '#f59e0b',
        doorWorldX: 57 * ts,
        doorWorldY: 53.5 * ts,
        overworldSpawnX: 57 * ts + 6,
        overworldSpawnY: 55 * ts + 6,
        roomWidth: 16,
        roomHeight: 12,
        insideSpawnX: 8 * ts + 6,
        insideSpawnY: 9 * ts + 4,
        insideDoorX: 8 * ts,
        insideDoorY: 10.5 * ts
      },

      // 3.8 Bank Kerajaan Oakhaven (Royal Treasury & Anime Bank)
      ROYAL_BANK: {
        id: 'ROYAL_BANK',
        name: 'Bank Kerajaan Oakhaven',
        tag: '🏛️ Bank Kerajaan',
        subtitle: '~ Penukaran Koin Dungeon & Rekening Tabungan Petualang ~',
        icon: '🏛️',
        accentColor: '#facc15',
        doorWorldX: 46 * ts,
        doorWorldY: 44 * ts,
        overworldSpawnX: 46 * ts + 6,
        overworldSpawnY: 45.2 * ts,
        roomWidth: 18,
        roomHeight: 13,
        insideSpawnX: 9 * ts + 6,
        insideSpawnY: 10 * ts + 4,
        insideDoorX: 9 * ts,
        insideDoorY: 11.5 * ts
      },

      // 4. Pondok Suci Tetua Roh Hutan Eldoria (Elder Sylas Sylvan Sanctuary)
      ELDORIA_SANCTUARY: {
        id: 'ELDORIA_SANCTUARY',
        name: 'Pondok Suci Tetua Roh Hutan Eldoria',
        tag: '🌿 Pondok Roh Eldoria',
        subtitle: '~ Altar Kebijaksanaan Leluhur & Ramuan Peri Rimba ~',
        icon: '🌿',
        accentColor: '#4ade80',
        doorWorldX: 20 * ts,
        doorWorldY: 16.5 * ts,
        overworldSpawnX: 20 * ts + 6,
        overworldSpawnY: 18 * ts + 4,
        roomWidth: 18,
        roomHeight: 13,
        insideSpawnX: 9 * ts + 6,
        insideSpawnY: 10 * ts + 4,
        insideDoorX: 9 * ts,
        insideDoorY: 11.5 * ts
      },

      // 5. Markas Komando Tambang & Barak Kurcaci Stonewatch (Dwarf Foundry & Barracks)
      STONEWATCH_FOUNDRY: {
        id: 'STONEWATCH_FOUNDRY',
        name: 'Markas Komando Tambang Stonewatch',
        tag: '⛏️ Markas Tambang Kurcaci',
        subtitle: '~ Barak Militer Tambang & Peleburan Besi Abisal ~',
        icon: '⛏️',
        accentColor: '#f59e0b',
        doorWorldX: 84 * ts,
        doorWorldY: 62.5 * ts,
        overworldSpawnX: 84 * ts + 6,
        overworldSpawnY: 64 * ts + 4,
        roomWidth: 18,
        roomHeight: 13,
        insideSpawnX: 9 * ts + 6,
        insideSpawnY: 10 * ts + 4,
        insideDoorX: 9 * ts,
        insideDoorY: 11.5 * ts
      }
    };
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 3;
  }

  /**
   * Cek collision di dalam ruangan interior aktif (atau ruangan spesifik)
   */
  public checkCollision(
    rectOrRoom: InteriorId | { x: number; y: number; width: number; height: number },
    maybeRect?: { x: number; y: number; width: number; height: number }
  ): boolean {
    let currentRoom: InteriorId | null = null;
    let rect: { x: number; y: number; width: number; height: number };

    if (typeof rectOrRoom === 'string') {
      currentRoom = rectOrRoom;
      rect = maybeRect!;
    } else {
      currentRoom = this.activeInterior;
      rect = rectOrRoom;
    }

    if (!currentRoom) return false;
    const def = this.doors[currentRoom];
    if (!def) return false;

    const ts = CONSTANTS.TILE_SIZE;
    const rw = def.roomWidth * ts;
    const rh = def.roomHeight * ts;

    // 1. Tembok Pembatas Ruangan (Borders)
    // Tembok atas tebal (2 tile = 64px), samping kiri/kanan (1 tile = 32px), bawah (1 tile = 32px)
    if (rect.x < ts) return true;
    if (rect.x + rect.width > rw - ts) return true;
    if (rect.y < 2 * ts + 8) return true; // Tembok atas
    if (rect.y + rect.height > rh - ts) {
      // Izinkan lewat di celah pintu keluar (tengah bawah)
      const doorLeft = def.insideDoorX - 16;
      const doorRight = def.insideDoorX + 32;
      if (rect.x < doorLeft || rect.x + rect.width > doorRight) {
        return true;
      }
      if (rect.y + rect.height > rh - 4) {
        return true; // Jangan tembus ke luar canvas
      }
    }

    // 2. Collision Perabot Khusus per Ruangan
    if (currentRoom === 'GUILD_HALL') {
      // Meja Resepsionis Elaine (x=6..12 tile, y=4 tile)
      const cx = 5.5 * ts;
      const cy = 4 * ts;
      const cw = 7 * ts;
      const ch = 1.2 * ts;
      if (rect.x < cx + cw && rect.x + rect.width > cx && rect.y < cy + ch && rect.y + rect.height > cy) return true;

      // Meja Santai Kiri (x=3..5 tile, y=7..8.5 tile)
      const t1x = 2.5 * ts;
      const t1y = 7 * ts;
      if (rect.x < t1x + 2.5 * ts && rect.x + rect.width > t1x && rect.y < t1y + 1.8 * ts && rect.y + rect.height > t1y) return true;

      // Meja Santai Kanan (x=12.5..15 tile, y=7..8.5 tile)
      const t2x = 13 * ts;
      const t2y = 7 * ts;
      if (rect.x < t2x + 2.5 * ts && rect.x + rect.width > t2x && rect.y < t2y + 1.8 * ts && rect.y + rect.height > t2y) return true;

      // Perapian Kiri Atas (x=1..3 tile, y=2..3.5 tile)
      if (rect.x < 3.2 * ts && rect.y < 3.8 * ts) return true;
    } else if (currentRoom === 'BLACKSMITH_SHOP') {
      // Tungku Tempa Raksasa Tengah Atas (x=6..10 tile, y=2..3.8 tile)
      const fx = 6 * ts;
      const fy = 2 * ts;
      if (rect.x < fx + 4 * ts && rect.x + rect.width > fx && rect.y < fy + 1.8 * ts && rect.y + rect.height > fy) return true;

      // Landasan Besi Anvil & Tong Air (x=7.5..9.5 tile, y=4.8..5.8 tile)
      const ax = 7.2 * ts;
      const ay = 4.8 * ts;
      if (rect.x < ax + 2.6 * ts && rect.x + rect.width > ax && rect.y < ay + 1.2 * ts && rect.y + rect.height > ay) return true;

      // Rak Senjata Dinding Kiri & Kanan
      if (rect.x < 1.8 * ts && rect.y < 6 * ts) return true;
      if (rect.x + rect.width > rw - 1.8 * ts && rect.y < 6 * ts) return true;
    } else if (currentRoom === 'APOTHECARY_INN') {
      // Meja Kasir Ramuan Lily (x=3..7 tile, y=3.8..5 tile)
      const mx = 3 * ts;
      const my = 3.8 * ts;
      if (rect.x < mx + 4 * ts && rect.x + rect.width > mx && rect.y < my + 1.2 * ts && rect.y + rect.height > my) return true;

      // Ranjang Tidur Penginapan (x=10.5..14 tile, y=3..5.5 tile)
      const bx = 10.5 * ts;
      const by = 2.8 * ts;
      if (rect.x < bx + 3.5 * ts && rect.x + rect.width > bx && rect.y < by + 2.6 * ts && rect.y + rect.height > by) return true;

      // Kuali Ramuan Kiri Atas
      if (rect.x < 2.5 * ts && rect.y < 4 * ts) return true;
    } else if (currentRoom === 'ADVENTURER_KITCHEN') {
      // Meja Dapur / Counter Masak Chef Gaston (x=6..10.5 tile, y=3.2..4.4 tile)
      const cx = 6 * ts;
      const cy = 3.2 * ts;
      if (rect.x < cx + 4.5 * ts && rect.x + rect.width > cx && rect.y < cy + 1.2 * ts && rect.y + rect.height > cy) return true;

      // Tungku Masak & Kuali Raksasa Kiri Atas (x=1.8..4.8 tile, y=2..3.8 tile)
      const kx = 1.8 * ts;
      const ky = 2 * ts;
      if (rect.x < kx + 3 * ts && rect.x + rect.width > kx && rect.y < ky + 1.8 * ts && rect.y + rect.height > ky) return true;

      // Meja Jamuan Makan Petualang Kanan (x=11.5..14.5 tile, y=5.5..7.5 tile)
      const tx = 11.5 * ts;
      const ty = 5.5 * ts;
      if (rect.x < tx + 3 * ts && rect.x + rect.width > tx && rect.y < ty + 2 * ts && rect.y + rect.height > ty) return true;

      // Tong & Karung Bahan Makanan Kiri Bawah (x=1..2.2 tile, y=6..8 tile)
      if (rect.x < 2.2 * ts && rect.y > 6 * ts && rect.y < 8.2 * ts) return true;
    } else if (currentRoom === 'ROYAL_BANK') {
      // Meja Teller Counter Bank (x=6..12 tile, y=3.5..4.6 tile)
      const dx = 6 * ts;
      const dy = 3.5 * ts;
      if (rect.x < dx + 6 * ts && rect.x + rect.width > dx && rect.y < dy + 1.2 * ts && rect.y + rect.height > dy) return true;

      // Teralis & Brankas Baja Belakang (y < 2.8 tile)
      if (rect.y < 2.8 * ts) return true;
    } else if (currentRoom === 'ELDORIA_SANCTUARY') {
      // Altar Roh Pohon Suci (x=7.5..10.5 tile, y=2.5..4 tile)
      const ax = 7.5 * ts;
      const ay = 2.5 * ts;
      if (rect.x < ax + 3 * ts && rect.x + rect.width > ax && rect.y < ay + 1.5 * ts && rect.y + rect.height > ay) return true;

      // Kolam Mata Air Suci Kiri (x=2..4.5 tile, y=4.5..7 tile)
      const px = 2 * ts;
      const py = 4.5 * ts;
      if (rect.x < px + 2.5 * ts && rect.x + rect.width > px && rect.y < py + 2.5 * ts && rect.y + rect.height > py) return true;

      // Meja Herbalis Aria (x=12.5..15 tile, y=4.5..6 tile)
      const mx = 12.5 * ts;
      const my = 4.5 * ts;
      if (rect.x < mx + 2.5 * ts && rect.x + rect.width > mx && rect.y < my + 1.5 * ts && rect.y + rect.height > my) return true;
    } else if (currentRoom === 'STONEWATCH_FOUNDRY') {
      // Peleburan Basalt & Tungku Logam (x=7..11 tile, y=2..4 tile)
      const sx = 7 * ts;
      const sy = 2 * ts;
      if (rect.x < sx + 4 * ts && rect.x + rect.width > sx && rect.y < sy + 2 * ts && rect.y + rect.height > sy) return true;

      // Meja Peta Perang Tambang Borin (x=4.5..7.5 tile, y=4.8..6.2 tile)
      const tx = 4.5 * ts;
      const ty = 4.8 * ts;
      if (rect.x < tx + 3 * ts && rect.x + rect.width > tx && rect.y < ty + 1.4 * ts && rect.y + rect.height > ty) return true;

      // Gerobak Bijih & Timbunan Batangan Besi Grimm (x=11.5..14 tile, y=4.8..6.2 tile)
      const gx = 11.5 * ts;
      const gy = 4.8 * ts;
      if (rect.x < gx + 2.8 * ts && rect.x + rect.width > gx && rect.y < gy + 1.4 * ts && rect.y + rect.height > gy) return true;
    }

    return false;
  }

  /**
   * Menemukan interaksi terdekat saat berada di dalam ruangan interior
   */
  public getNearbyAction(currentRoom: InteriorId, playerCenterX: number, playerCenterY: number): NearbyInteriorAction | null {
    const ts = CONSTANTS.TILE_SIZE;
    const def = this.doors[currentRoom];
    if (!def) return null;

    // 1. Pintu Keluar Ruangan (Door Exit Threshold)
    const exitDist = Math.hypot(def.insideDoorX + 16 - playerCenterX, def.insideDoorY - playerCenterY);
    if (exitDist < 38) {
      return {
        type: 'DOOR_EXIT',
        prompt: 'Tekan [A] Keluar ke Desa 🚪',
        color: '#facc15',
        x: def.insideDoorX + 16,
        y: def.insideDoorY - 12
      };
    }

    // 2. Interaksi per Ruangan Khusus
    if (currentRoom === 'GUILD_HALL') {
      // Elaine di meja kasir (x=9*ts, y=4.6*ts)
      const elaineDist = Math.hypot(9 * ts - playerCenterX, 4.6 * ts - playerCenterY);
      if (elaineDist < 46) {
        return {
          type: 'ELAINE',
          prompt: '🪪 [A] Bicara dengan Elaine (Misi & Gelar)',
          color: '#38bdf8',
          x: 9 * ts,
          y: 3.5 * ts
        };
      }

      // Papan Misi Guild di dinding kanan (x=13*ts, y=3*ts)
      const boardDist = Math.hypot(13 * ts - playerCenterX, 3 * ts - playerCenterY);
      if (boardDist < 44) {
        return {
          type: 'QUEST_BOARD',
          prompt: '📜 [A] Papan Misi Guild Serikat',
          color: '#fbbf24',
          x: 13 * ts,
          y: 2.2 * ts
        };
      }

      // Meja Santai Rekrut Companion Party (x=3.5*ts, y=7.5*ts)
      const loungeDist = Math.hypot(3.5 * ts - playerCenterX, 7.5 * ts - playerCenterY);
      if (loungeDist < 46) {
        return {
          type: 'COMPANION_HIRE',
          prompt: '👥 [A] Rekrut Rekan Petualang (Lounge)',
          color: '#38bdf8',
          x: 3.5 * ts,
          y: 6.8 * ts
        };
      }

      // Kapten Galahad di pos strategi perapian kiri (x=2*ts, y=4.5*ts)
      const galahadDist = Math.hypot(2 * ts - playerCenterX, 4.5 * ts - playerCenterY);
      if (galahadDist < 44) {
        return {
          type: 'GALAHAD',
          prompt: '🛡️ [A] Bicara dengan Kapten Galahad (Misi Petualang)',
          color: '#38bdf8',
          x: 2 * ts,
          y: 3.5 * ts
        };
      }

      // Morgrim sang Jagal di sudut veteran bawah kiri (x=3.5*ts, y=10.5*ts)
      const morgrimDist = Math.hypot(3.5 * ts - playerCenterX, 10.5 * ts - playerCenterY);
      if (morgrimDist < 44) {
        return {
          type: 'MORGRIM',
          prompt: '🪓 [A] Bicara dengan Jagal Morgrim (Misi Bos Dungeon)',
          color: '#f87171',
          x: 3.5 * ts,
          y: 9.5 * ts
        };
      }

      // Cendekiawan Ignis di meja riset misteri abisal kanan atas (x=15.5*ts, y=3.5*ts)
      const ignisDist = Math.hypot(15.5 * ts - playerCenterX, 3.5 * ts - playerCenterY);
      if (ignisDist < 44) {
        return {
          type: 'IGNIS',
          prompt: '🔮 [A] Bicara dengan Cendekiawan Ignis (Misi Riset Abisal)',
          color: '#c084fc',
          x: 15.5 * ts,
          y: 2.5 * ts
        };
      }

      // Ranger Kaelen di rak busur & piala buruan kanan bawah (x=15.5*ts, y=7.5*ts)
      const kaelenDist = Math.hypot(15.5 * ts - playerCenterX, 7.5 * ts - playerCenterY);
      if (kaelenDist < 44) {
        return {
          type: 'KAELEN',
          prompt: '🏹 [A] Bicara dengan Ranger Kaelen (Misi Pemburu Rimba)',
          color: '#4ade80',
          x: 15.5 * ts,
          y: 6.5 * ts
        };
      }
    } else if (currentRoom === 'BLACKSMITH_SHOP') {
      // Master Brokk di anvil (x=8*ts, y=5.5*ts)
      const brokkDist = Math.hypot(8 * ts - playerCenterX, 5.5 * ts - playerCenterY);
      if (brokkDist < 46) {
        return {
          type: 'BROKK',
          prompt: '⚒️ [A] Tempa & Upgrade Senjata (Brokk)',
          color: '#fb923c',
          x: 8 * ts,
          y: 4.2 * ts
        };
      }
    } else if (currentRoom === 'APOTHECARY_INN') {
      // Lily di kasir ramuan (x=5*ts, y=4.8*ts)
      const lilyDist = Math.hypot(5 * ts - playerCenterX, 4.8 * ts - playerCenterY);
      if (lilyDist < 46) {
        return {
          type: 'LILY',
          prompt: '🍃 [A] Bicara dengan Lily (Ramuan Mistis)',
          color: '#4ade80',
          x: 5 * ts,
          y: 3.6 * ts
        };
      }

      // Tempat Tidur Penginapan (Inn Bed: x=12*ts, y=4*ts)
      const bedDist = Math.hypot(12 * ts - playerCenterX, 4.2 * ts - playerCenterY);
      if (bedDist < 46) {
        return {
          type: 'INN_BED',
          prompt: '🛏️ [A] Tidur Nyenyak (Pulihkan Penuh HP & MP)',
          color: '#38bdf8',
          x: 12 * ts,
          y: 3 * ts
        };
      }
    } else if (currentRoom === 'ADVENTURER_KITCHEN') {
      // Chef Gaston di balik counter masak (x=8*ts, y=4.5*ts)
      const gastonDist = Math.hypot(8 * ts - playerCenterX, 4.5 * ts - playerCenterY);
      if (gastonDist < 46) {
        return {
          type: 'CHEF_GASTON',
          prompt: '🍳 [A] Masak Bersama Chef Gaston (Resep Kuliner)',
          color: '#f59e0b',
          x: 8 * ts,
          y: 3.2 * ts
        };
      }

      // Kuali Masak Petualang Besar di Kiri Atas (x=3.5*ts, y=4.2*ts)
      const potDist = Math.hypot(3.5 * ts - playerCenterX, 4.2 * ts - playerCenterY);
      if (potDist < 46) {
        return {
          type: 'KITCHEN_CAULDRON',
          prompt: '🍲 [A] Gunakan Kuali Masak Petualang',
          color: '#fb923c',
          x: 3.5 * ts,
          y: 3.2 * ts
        };
      }
    } else if (currentRoom === 'ROYAL_BANK') {
      // Bankir Barnaby di balik meja teller (x=9*ts, y=4.5*ts)
      const barnabyDist = Math.hypot(9 * ts - playerCenterX, 4.5 * ts - playerCenterY);
      if (barnabyDist < 46) {
        return {
          type: 'BANK_TELLER',
          prompt: '🏛️ [A] Layanan Bank Kerajaan (Tukar Koin & Tabungan)',
          color: '#facc15',
          x: 9 * ts,
          y: 3.2 * ts
        };
      }
    } else if (currentRoom === 'ELDORIA_SANCTUARY') {
      // Elder Sylas di samping altar (x=9*ts, y=4.2*ts)
      const sylasDist = Math.hypot(9 * ts - playerCenterX, 4.2 * ts - playerCenterY);
      if (sylasDist < 46) {
        return {
          type: 'SYLAS',
          prompt: '🧝‍♂️ [A] Teka-Teki Kuno Kuil Roh (Elder Sylas)',
          color: '#34d399',
          x: 9 * ts,
          y: 3.2 * ts
        };
      }

      // Aria sang Herbalis di meja ramuan kanan (x=13.8*ts, y=5.5*ts)
      const ariaDist = Math.hypot(13.8 * ts - playerCenterX, 5.5 * ts - playerCenterY);
      if (ariaDist < 46) {
        return {
          type: 'ARIA',
          prompt: '🍃 [A] Sapa Aria (Herbalis Peri Rimba)',
          color: '#86efac',
          x: 13.8 * ts,
          y: 4.4 * ts
        };
      }
    } else if (currentRoom === 'STONEWATCH_FOUNDRY') {
      // Kapten Borin di meja peta perang tambang (x=6*ts, y=5.6*ts)
      const borinDist = Math.hypot(6 * ts - playerCenterX, 5.6 * ts - playerCenterY);
      if (borinDist < 46) {
        return {
          type: 'BORIN',
          prompt: '⛏️ [A] Teka-Teki Sandi Tambang (Kapten Borin)',
          color: '#f59e0b',
          x: 6 * ts,
          y: 4.4 * ts
        };
      }

      // Grimm si Pelebur Besi di tungku kanan (x=13*ts, y=5.6*ts)
      const grimmDist = Math.hypot(13 * ts - playerCenterX, 5.6 * ts - playerCenterY);
      if (grimmDist < 46) {
        return {
          type: 'GRIMM',
          prompt: '⚒️ [A] Sapa Grimm (Pelebur Besi Abisal)',
          color: '#fb923c',
          x: 13 * ts,
          y: 4.4 * ts
        };
      }
    }

    return null;
  }

  /**
   * Cek apakah pemain di Overworld sedang berdiri di depan salah satu pintu bangunan
   */
  public getNearbyOverworldDoor(playerCenterX: number, playerCenterY: number): BuildingDoorDef | null {
    for (const key of Object.keys(this.doors) as InteriorId[]) {
      const def = this.doors[key];
      const dist = Math.hypot(def.doorWorldX + 16 - playerCenterX, def.doorWorldY + 16 - playerCenterY);
      if (dist < 40) {
        return def;
      }
    }
    return null;
  }

  /**
   * Render penanda pintu masuk bangunan di Overworld
   */
  public renderOverworldDoorMarkers(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number): void {
    ctx.save();

    for (const key of Object.keys(this.doors) as InteriorId[]) {
      const def = this.doors[key];
      const dx = def.doorWorldX;
      const dy = def.doorWorldY;
      const dist = Math.hypot(dx + 16 - playerCenterX, dy + 16 - playerCenterY);
      const isNear = dist < 42;

      // 1. Karpet Selamat Datang Bercahaya di Depan Pintu
      const pulse = Math.sin(this.animTimer + dx) * 0.2;
      ctx.fillStyle = isNear ? def.accentColor : 'rgba(250, 204, 21, 0.45)';
      ctx.globalAlpha = isNear ? 0.85 + pulse : 0.45;
      ctx.fillRect(dx + 2, dy + 18, 28, 8);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx + 2, dy + 18, 28, 8);
      ctx.globalAlpha = 1.0;

      // 2. Plang Papan Nama Toko/Bangunan Mengambang di Atas Pintu
      ctx.font = 'bold 8px sans-serif';
      const doorLabel = `${def.icon} Masuk`;
      const badgeW = ctx.measureText(doorLabel).width + 16;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(dx + 16 - badgeW / 2, dy - 18, badgeW, 16, 4);
      ctx.fill();
      ctx.strokeStyle = def.accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(doorLabel, dx + 16, dy - 10);

      // 3. Prompt Interaksi Mengambang saat Pemain Mendekat
      if (isNear) {
        const bob = Math.sin(this.animTimer * 2) * 2;
        ctx.font = 'bold 8.5px sans-serif';
        const promptText = `[A] Masuk ${def.tag}`;
        const ptw = ctx.measureText(promptText).width + 16;
        const pbx = dx + 16 - ptw / 2;
        const pby = dy - 34 + bob;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(pbx, pby, ptw, 16, 4);
        ctx.fill();
        ctx.strokeStyle = def.accentColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = def.accentColor;
        ctx.fillText(promptText, dx + 16, pby + 8);
      }
    }

    ctx.restore();
  }

  /**
   * Render seluruh lingkungan visual ruangan interior lengkap dengan dekorasi pixel art
   */
  public renderInterior(
    ctx: CanvasRenderingContext2D,
    currentRoom: InteriorId,
    _camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    const ts = CONSTANTS.TILE_SIZE;
    const def = this.doors[currentRoom];
    if (!def) return;

    const rw = def.roomWidth;
    const rh = def.roomHeight;

    ctx.save();

    // 1. LANTAI DASAR RUANGAN (Room Flooring)
    for (let ty = 0; ty < rh; ty++) {
      for (let tx = 0; tx < rw; tx++) {
        const px = tx * ts;
        const py = ty * ts;

        if (ty < 2 || ty === rh - 1 || tx === 0 || tx === rw - 1) {
          // Tembok Luar & Border
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px, py, ts, ts);
        } else {
          // Lantai Utama
          if (currentRoom === 'GUILD_HALL') {
            // Kayu Mahoni Mengkilap Parquet
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#78350f' : '#92400e';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'BLACKSMITH_SHOP') {
            // Ubin Batu Basalt Tempa
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#1e293b' : '#334155';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'APOTHECARY_INN') {
            // Lantai Kayu Pinus Lembut
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#b45309' : '#d97706';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'ADVENTURER_KITCHEN') {
            // Ubin Terakota Dapur Hangat
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#c2410c' : '#ea580c';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(124, 45, 18, 0.45)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'ELDORIA_SANCTUARY') {
            // Karpet Rumput Kuno & Lumut Hidup
            const isAlt = (tx * 3 + ty * 5) % 3 === 0;
            ctx.fillStyle = isAlt ? '#047857' : '#065f46';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(5, 150, 105, 0.25)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'ROYAL_BANK') {
            // Ubin Marmer Putih Polished & Emas Kerajaan (Chess Pattern)
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#f8fafc' : '#e2e8f0';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = isAlt ? 'rgba(250, 204, 21, 0.45)' : '#cbd5e1';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          } else if (currentRoom === 'STONEWATCH_FOUNDRY') {
            // Batu Granit Hitam Kurcaci
            const isAlt = (tx + ty) % 2 === 0;
            ctx.fillStyle = isAlt ? '#111827' : '#1f2937';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, ts, ts);
          }
        }
      }
    }

    // 2. TEMBOK ATAS BERUKIR & PONDASI (Upper Carved Timber & Stone Wall)
    for (let tx = 0; tx < rw; tx++) {
      const px = tx * ts;
      // Dinding atas (ty=0..1)
      ctx.fillStyle = currentRoom === 'ROYAL_BANK' ? '#0f172a' : (currentRoom === 'GUILD_HALL' || currentRoom === 'ADVENTURER_KITCHEN' ? '#451a03' : currentRoom === 'ELDORIA_SANCTUARY' ? '#064e3b' : '#090d16');
      ctx.fillRect(px, 0, ts, 2 * ts);
      // Lis balok kayu / granit / emas pembatas dinding ke lantai
      ctx.fillStyle = currentRoom === 'ROYAL_BANK' ? '#ca8a04' : (currentRoom === 'GUILD_HALL' || currentRoom === 'ADVENTURER_KITCHEN' ? '#b45309' : '#475569');
      ctx.fillRect(px, 2 * ts - 4, ts, 4);
    }

    // 3. KARPET KERAJAAN & JALUR LALU LALANG (Runners)
    if (currentRoom === 'GUILD_HALL') {
      // Karpet Merah Megah di Tengah (x=8..10 tile, y=5..12 tile)
      const rx = 8 * ts;
      const ry = 4.8 * ts;
      const rw = 2 * ts;
      const rh = 7.5 * ts;
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (currentRoom === 'APOTHECARY_INN') {
      // Karpet Tenun Bunga di Depan Kasir
      ctx.fillStyle = '#065f46';
      ctx.fillRect(4 * ts, 5.2 * ts, 3 * ts, 4 * ts);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4 * ts, 5.2 * ts, 3 * ts, 4 * ts);
    } else if (currentRoom === 'STONEWATCH_FOUNDRY') {
      // Rel Kereta Tambang Mini Menuju Tungku
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(9 * ts - 4, 4 * ts, 8, 7 * ts);
      for (let ry = 4.5 * ts; ry < 11 * ts; ry += 16) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(9 * ts - 10, ry, 20, 3);
      }
    }

    // 4. KELENGKAPAN PERABOT & OBJEK KHUSUS (Room-Specific Furniture)
    this.renderRoomDetails(ctx, currentRoom, def);

    // 5. AMBIENT LENTERA & PENCAHAYAAN RUANGAN (Lanterns & Warm Glow)
    this.renderRoomLanterns(ctx, currentRoom, def);

    // 6. AMBANG PINTU KELUAR RUANGAN (Bottom Exit Door Mat)
    const exX = def.insideDoorX;
    const exY = def.insideDoorY;
    const isNearExit = Math.hypot(exX + 16 - playerCenterX, exY - playerCenterY) < 38;

    ctx.fillStyle = isNearExit ? '#facc15' : 'rgba(250, 204, 21, 0.4)';
    ctx.fillRect(exX - 8, exY - 8, 48, 16);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(exX - 8, exY - 8, 48, 16);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 KELUAR', exX + 16, exY);

    if (isNearExit) {
      const bob = Math.sin(this.animTimer * 2) * 2;
      ctx.font = 'bold 9.5px sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText('Tekan [A] Keluar ke Desa 🚪', exX + 16, exY - 20 + bob);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('Tekan [A] Keluar ke Desa 🚪', exX + 16, exY - 20 + bob);
    }

    ctx.restore();
  }

  private renderRoomDetails(ctx: CanvasRenderingContext2D, room: InteriorId, def: BuildingDoorDef): void {
    const ts = CONSTANTS.TILE_SIZE;

    if (room === 'GUILD_HALL') {
      // 1. Spanduk Bendera Serikat di Dinding
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(3 * ts, 8, 24, 38);
      ctx.fillRect(14 * ts, 8, 24, 38);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3 * ts, 8, 24, 38);
      ctx.strokeRect(14 * ts, 8, 24, 38);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', 3 * ts + 12, 28);
      ctx.fillText('⚔️', 14 * ts + 12, 28);

      // 2. Banner Emas Serikat di Tengah Atas
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(6 * ts, 12, 6 * ts, 20);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(6 * ts, 12, 6 * ts, 20);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillText('★ BALAI SERIKAT GUILD OAKHAVEN ★', 9 * ts, 23);

      // 3. Meja Resepsionis Kayu Mahoni
      const cx = 5.5 * ts;
      const cy = 4 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx, cy, 7 * ts, 22);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 2, cy - 2, 7 * ts + 4, 6); // Table top lip

      // Kertas Misi, Buku Tamu & Tinta di Meja
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx + 18, cy + 6, 12, 8); // Guestbook
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx + 40, cy + 4, 3, 10); // Quill pen
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + 55, cy + 6, 10, 8); // Mana crystal

      // 4. Elaine sang Resepsionis Berdiri di Balik Meja
      this.drawDeskNPC(ctx, 9 * ts, 3.2 * ts, '#f43f5e', '#1e3a8a', 'Elaine (Resepsionis Guild)');

      // 5. Papan Misi Pengumuman (Notice Board) di Dinding Kanan
      const nbX = 13 * ts;
      const nbY = 1.2 * ts;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(nbX - 16, nbY, 32, 26);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(nbX - 14, nbY + 2, 28, 22);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(nbX - 10, nbY + 4, 6, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(nbX - 2, nbY + 4, 7, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(nbX + 6, nbY + 4, 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.fillText('📜 PAPAN MISI', nbX, nbY + 20);

      // 6. Meja Santai & Kursi Petualang
      this.drawLoungeTable(ctx, 3.5 * ts, 7.5 * ts);
      this.drawLoungeTable(ctx, 14.5 * ts, 7.5 * ts);

      // 7. Perapian Kiri Atas
      this.drawFireplace(ctx, 2 * ts, 1.2 * ts);

      // 8. NPC PEMBERI MISI GUILD DI DALAM RUANGAN (Dipindahkan dari luar agar rapi)
      // 8.1 Kapten Galahad (Komandan Patroli Perbatasan - Misi Slime)
      this.drawDeskNPC(ctx, 2 * ts, 3.8 * ts, '#e2e8f0', '#1e3a8a', 'Kapten Galahad (Misi Slime)');
      // Rak Perisai & Tombak Patroli
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(1.2 * ts, 3.8 * ts, 8, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1.2 * ts + 2, 3.8 * ts + 2, 4, 10);

      // 8.2 Morgrim sang Jagal (Veteran Pemburu Bos Monster)
      this.drawDeskNPC(ctx, 3.5 * ts, 9.8 * ts, '#475569', '#7f1d1d', 'Morgrim sang Jagal (Misi Bos)');
      // Pedang Raksasa Jagal di Lantai
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(3.5 * ts + 12, 9.5 * ts, 4, 18);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(3.5 * ts + 10, 10.2 * ts, 8, 3);

      // 8.3 Cendekiawan Ignis (Peneliti Misteri Abisal - Misi Goa)
      this.drawDeskNPC(ctx, 15.5 * ts, 2.8 * ts, '#9333ea', '#4c1d95', 'Ignis (Cendekiawan Goa)');
      // Meja Riset Naskah & Kristal Magis
      ctx.fillStyle = '#451a03';
      ctx.fillRect(15 * ts, 3.5 * ts, 22, 12);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(15 * ts + 4, 3.5 * ts + 2, 6, 6);

      // 8.4 Ranger Kaelen (Pemburu Rimba Timur - Misi Serigala)
      this.drawDeskNPC(ctx, 15.5 * ts, 6.8 * ts, '#78350f', '#166534', 'Ranger Kaelen (Misi Serigala)');
      // Rak Busur & Kulit Hewan Buruan
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(15.5 * ts + 14, 6.8 * ts, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else if (room === 'BLACKSMITH_SHOP') {
      // 1. Tungku Tempa Raksasa (Blazing Forge) di Tengah Atas
      const fx = 6.5 * ts;
      const fy = 1.5 * ts;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fx, fy, 3 * ts, 2.2 * ts);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(fx + 8, fy + 12, 3 * ts - 16, 26);
      ctx.fillStyle = '#fef08a';
      const flame = Math.sin(this.animTimer * 6) * 3;
      ctx.fillRect(fx + 14, fy + 16 + flame, 3 * ts - 28, 18);

      // Cerobong asap batu
      ctx.fillStyle = '#334155';
      ctx.fillRect(fx + 18, 0, 1.5 * ts, fy);

      // 2. Landasan Besi Tempa (Anvil)
      const ax = 8 * ts;
      const ay = 5 * ts;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ax - 10, ay + 6, 20, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ax - 14, ay, 28, 8);
      // Palu tempa tergeletak
      ctx.fillStyle = '#b45309';
      ctx.fillRect(ax - 4, ay - 6, 8, 4);

      // 3. Tong Pendingin Air (Quenching Tub)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(ax + 24, ay, 18, 18);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(ax + 33, ay + 6, 7, 0, Math.PI * 2);
      ctx.fill();

      // 4. Master Brokk Berdiri di Depan Anvil
      this.drawDeskNPC(ctx, ax, 3.8 * ts, '#78350f', '#9a3412', 'Master Brokk (Pandai Besi)');

      // 5. Rak Senjata Dinding Kiri (Pedang & Belati)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(1.5 * ts, 1.5 * ts, 26, 38);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(1.5 * ts + 6, 1.5 * ts + 4, 3, 30);
      ctx.fillRect(1.5 * ts + 16, 1.5 * ts + 4, 4, 30);

      // 6. Rak Busur & Tongkat Sihir Dinding Kanan
      const rx = def.roomWidth * ts - 2.5 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(rx, 1.5 * ts, 26, 38);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(rx + 6, 1.5 * ts + 4, 3, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(rx + 16, 1.5 * ts + 4, 4, 30);
    } else if (room === 'APOTHECARY_INN') {
      // 1. Meja Ramuan Herbalis Lily
      const mx = 3 * ts;
      const my = 4 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(mx, my, 4 * ts, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(mx - 2, my - 2, 4 * ts + 4, 6);

      // Botol Ramuan Berjejer di Meja
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(mx + 10, my + 4, 6, 8); // Red potion
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(mx + 20, my + 4, 6, 8); // Blue potion
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(mx + 30, my + 4, 6, 8); // Stamina potion

      // 2. Lily sang Herbalis Berdiri di Balik Kasir
      this.drawDeskNPC(ctx, 5 * ts, 3.2 * ts, '#fb7185', '#065f46', 'Lily (Toko Ramuan)');

      // 3. Rak Dinding Ramuan & Bunga Mistis
      ctx.fillStyle = '#451a03';
      ctx.fillRect(3 * ts, 1.2 * ts, 4 * ts, 22);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(3 * ts + 6, 1.2 * ts + 4, 5, 6);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(3 * ts + 16, 1.2 * ts + 4, 5, 6);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(3 * ts + 26, 1.2 * ts + 4, 5, 6);

      // 4. TEMPAT TIDUR PENGINAPAN NYAMAN (Cozy Inn Bed: 10.5..14 tile, y=2.8..5 tile)
      const bx = 11 * ts;
      const by = 2.6 * ts;
      // Rangka Kayu Ranjang
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bx, by, 3.2 * ts, 2.6 * ts);
      // Kasur Empuk
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(bx + 4, by + 4, 3.2 * ts - 8, 2.6 * ts - 8);
      // Bantal Bulu Angsa
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(bx + 8, by + 6, 24, 12);
      // Selimut Wol Merah Hangat
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(bx + 4, by + 22, 3.2 * ts - 8, 2.6 * ts - 26);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 4, by + 22, 3.2 * ts - 8, 2.6 * ts - 26);

      // Meja Lampu Lilin di Samping Tempat Tidur
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx - 14, by + 8, 12, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx - 9, by + 4, 3, 6); // Candle flame
    } else if (room === 'ADVENTURER_KITCHEN') {
      // 1. TUNGKU MASAK & KUALI BESAR PETUALANG (Master Cooking Hearth & Cauldron)
      const hx = 2 * ts;
      const hy = 1.5 * ts;
      // Brick Hearth
      ctx.fillStyle = '#78350f';
      ctx.fillRect(hx, hy, 3.2 * ts, 2.4 * ts);
      ctx.fillStyle = '#451a03';
      ctx.strokeRect(hx, hy, 3.2 * ts, 2.4 * ts);
      // Fire pit & flame
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(hx + 12, hy + 24, 3.2 * ts - 24, 18);
      ctx.fillStyle = '#fef08a';
      const kFlame = Math.sin(this.animTimer * 7) * 2;
      ctx.fillRect(hx + 18, hy + 26 + kFlame, 3.2 * ts - 36, 14);

      // Iron Cauldron on Hearth
      const potX = hx + (3.2 * ts) / 2;
      const potY = hy + 26;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(potX, potY, 16, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(potX - 18, potY - 4, 36, 5); // Rim

      // Bubbling Broth in Cauldron
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(potX, potY, 13, 0, Math.PI);
      ctx.fill();

      // Animated Broth Bubbles & Steam
      const bBubble1 = Math.sin(this.animTimer * 4) * 3;
      const bBubble2 = Math.cos(this.animTimer * 5) * 3;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(potX - 5 + bBubble1, potY + 4, 2.5, 0, Math.PI * 2);
      ctx.arc(potX + 6 + bBubble2, potY + 6, 2, 0, Math.PI * 2);
      ctx.fill();

      // Steam Motes
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      const steamY1 = potY - 10 - ((this.animTimer * 16) % 18);
      const steamY2 = potY - 14 - (((this.animTimer + 0.5) * 16) % 18);
      ctx.beginPath();
      ctx.arc(potX - 4 + Math.sin(this.animTimer * 3) * 4, steamY1, 3, 0, Math.PI * 2);
      ctx.arc(potX + 5 - Math.sin(this.animTimer * 3) * 4, steamY2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Plaque di atas tungku: "KUALI AJAIB PETUALANG"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍲 KUALI MASAK PETUALANG', potX, hy + 10);

      // 2. COUNTER PERSIAPAN & CHEF GASTON (Kitchen Prep Counter)
      const cx = 6.2 * ts;
      const cy = 3.6 * ts;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx, cy, 4 * ts, 20);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 2, cy - 2, 4 * ts + 4, 6); // Counter lip

      // Cutting board, vegetable slices & knife on counter
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx + 10, cy + 5, 14, 10); // Cutting board
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx + 12, cy + 7, 4, 4); // Sliced carrot
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx + 18, cy + 8, 4, 4); // Herbs
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx + 28, cy + 6, 8, 3); // Cleaver blade

      // Chef Gaston di balik meja masak
      this.drawDeskNPC(ctx, 8 * ts, 2.8 * ts, '#ffffff', '#ea580c', 'Chef Gaston (Koki Legendaris)');

      // 3. MEJA JAMUAN MAKAN PETUALANG (Grand Dining Table on Right)
      const dx = 11.5 * ts;
      const dy = 5.2 * ts;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(dx, dy, 3.2 * ts, 2.2 * ts);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(dx - 2, dy - 2, 3.2 * ts + 4, 6);
      ctx.fillRect(dx - 2, dy + 2.2 * ts - 4, 3.2 * ts + 4, 6);

      // Banquet food on table
      // Roasted poultry plate
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(dx + 18, dy + 16, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(dx + 12, dy + 12, 12, 8); // Roast bird
      // Bread loaf
      ctx.fillStyle = '#d97706';
      ctx.fillRect(dx + 40, dy + 14, 12, 6);
      // Ale Tankards
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(dx + 60, dy + 12, 6, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(dx + 60, dy + 10, 6, 3); // Ale foam

      // Kursi kayu di atas & bawah meja
      ctx.fillStyle = '#451a03';
      ctx.fillRect(dx + 12, dy - 8, 12, 6);
      ctx.fillRect(dx + 48, dy - 8, 12, 6);
      ctx.fillRect(dx + 12, dy + 2.2 * ts + 4, 12, 6);
      ctx.fillRect(dx + 48, dy + 2.2 * ts + 4, 12, 6);

      // 4. PERALATAN & BAHAN DAPUR GANTUNG (Hanging Sausages & Herbs)
      const hxG = 11 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(hxG, 1.2 * ts, 4 * ts, 4); // Beam
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(hxG + 10, 1.2 * ts + 4, 4, 12); // Sausage
      ctx.fillRect(hxG + 18, 1.2 * ts + 4, 4, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(hxG + 30, 1.2 * ts + 4, 6, 10); // Dried herbs
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(hxG + 44, 1.2 * ts + 4, 6, 8); // Garlic braid

      // 5. TONG ANGGUR & KARUNG GANDUM DI SUDUT KIRI BAWAH
      const sx = 1.5 * ts;
      const sy = 6.5 * ts;
      // Barrel
      ctx.fillStyle = '#451a03';
      ctx.fillRect(sx, sy, 18, 22);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx + 2, sy + 2, 14, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx, sy + 6, 18, 2);
      ctx.fillRect(sx, sy + 14, 18, 2);
      // Flour sacks
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(sx + 22, sy + 4, 14, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(sx + 20, sy + 10, 18, 10);
    } else if (room === 'ELDORIA_SANCTUARY') {
      // 1. Altar Roh Hutan Suci (Sylvan Nature Altar)
      const ax = 8 * ts;
      const ay = 1.8 * ts;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(ax, ay, 2 * ts, 28);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ax, ay, 2 * ts, 28);

      // Permata Kristal Alam Roh Hutan Memancarkan Aura Hijau
      const gemPulse = Math.sin(this.animTimer * 3) * 2;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(ax + ts, ay + 12, 8 + gemPulse * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.stroke();

      // 2. Elder Sylas Berdiri di Samping Altar
      this.drawDeskNPC(ctx, 9 * ts, 3.5 * ts, '#f8fafc', '#047857', 'Elder Sylas (Tetua Eldoria)');

      // 3. Meja Peracikan Ramuan Aria di Kanan
      const mx = 13.5 * ts;
      const my = 4.5 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(mx - 14, my, 28, 16);
      this.drawDeskNPC(ctx, mx, 3.5 * ts, '#a7f3d0', '#065f46', 'Aria (Herbalis Peri)');

      // 4. Kolam Mata Air Kehidupan Kiri
      const kx = 3 * ts;
      const ky = 5 * ts;
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(kx, ky, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(kx, ky, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (room === 'STONEWATCH_FOUNDRY') {
      // 1. Tungku Peleburan Bijih Abisal Kurcaci di Tengah
      const sx = 7.5 * ts;
      const sy = 1.6 * ts;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx, sy, 3 * ts, 32);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(sx + 8, sy + 10, 3 * ts - 16, 20);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sx + 14, sy + 14, 3 * ts - 28, 12);

      // 2. Meja Peta Perang & Borin
      const tx = 5.5 * ts;
      const ty = 4.8 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(tx - 16, ty, 32, 16);
      this.drawDeskNPC(ctx, 5.5 * ts, 3.8 * ts, '#b45309', '#78350f', 'Kapten Borin (Kepala Tambang)');

      // 3. Grimm si Pelebur Besi di Samping Tungku
      this.drawDeskNPC(ctx, 12.5 * ts, 3.8 * ts, '#64748b', '#334155', 'Grimm (Pelebur Besi)');

      // 4. Timbunan Batangan Besi Abisal & Emas
      const ox = 13 * ts;
      const oy = 6 * ts;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox, oy, 12, 6);
      ctx.fillRect(ox + 8, oy - 4, 12, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(ox + 4, oy + 4, 14, 6);
    } else if (room === 'ROYAL_BANK') {
      // --- INTERIOR BANK KERAJAAN OAKHAVEN ---
      // 1. Permadani Beludru Merah Megah dari Pintu Keluar ke Meja Teller
      const crX = 7.5 * ts;
      const crW = 3 * ts;
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(crX, 4.5 * ts, crW, 7 * ts);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(crX, 4.5 * ts, crW, 7 * ts);

      // 2. Teralis Besi Tempa Pelindung Brankas di Dinding Belakang
      const fenceY = 2.8 * ts;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3.5 * ts, fenceY);
      ctx.lineTo(14.5 * ts, fenceY);
      ctx.stroke();
      for (let fx = 4 * ts; fx <= 14 * ts; fx += 10) {
        ctx.beginPath();
        ctx.moveTo(fx, 1.2 * ts);
        ctx.lineTo(fx, fenceY);
        ctx.stroke();
      }

      // 3. Pintu Brankas Baja Raksasa (Giant Steel Vault Door) di Tengah Belakang
      const vx = 9 * ts;
      const vy = 1.8 * ts;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(vx, vy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(vx, vy, 17, 0, Math.PI * 2);
      ctx.fill();

      // Vault Turn Wheel
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vx, vy, 8, 0, Math.PI * 2);
      ctx.stroke();
      const vPulse = Math.sin(this.animTimer) * 0.3;
      for (let s = 0; s < 4; s++) {
        const ang = (s * Math.PI) / 2 + vPulse;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(ang) * 12, vy + Math.sin(ang) * 12);
        ctx.stroke();
      }

      // Tumpukan Emas & Karung Koin di Balik Teralis
      ctx.fillStyle = '#facc15';
      ctx.fillRect(4.5 * ts, 1.8 * ts, 14, 6);
      ctx.fillRect(4.8 * ts, 1.5 * ts, 12, 6);
      ctx.fillRect(5.5 * ts, 1.9 * ts, 10, 5);
      // Karung Koin
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(5.8 * ts, 2.3 * ts, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(5.6 * ts, 1.9 * ts, 4, 3);

      ctx.fillStyle = '#facc15';
      ctx.fillRect(12.5 * ts, 1.8 * ts, 14, 6);
      ctx.fillRect(12.8 * ts, 1.5 * ts, 12, 6);
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(13.5 * ts, 1.9 * ts, 10, 5);

      // 4. Meja Teller Bank Megah (Mahogany Counter Desk)
      const deskX = 6 * ts;
      const deskY = 3.6 * ts;
      const deskW = 6 * ts;
      const deskH = 1.4 * ts;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(deskX, deskY, deskW, deskH);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(deskX - 2, deskY - 2, deskW + 4, 6);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(deskX + 4, deskY + 6, deskW - 8, deskH - 8);

      // Teller Glass Screen
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(deskX + 6, deskY - 14, deskW - 12, 12);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(deskX + 6, deskY - 14, deskW - 12, 12);

      // 5. NPC Bankir Barnaby di Balik Meja Teller
      this.drawDeskNPC(ctx, 9 * ts, 2.5 * ts, '#facc15', '#1e3a8a', 'Bankir Barnaby (Kepala Bank Kerajaan)');

      // 6. Pilar Marmer Putih Megah dengan Cincin Emas
      const pillarLocs = [
        { x: 2 * ts, y: 3.5 * ts },
        { x: 16 * ts, y: 3.5 * ts },
        { x: 2 * ts, y: 8.5 * ts },
        { x: 16 * ts, y: 8.5 * ts }
      ];
      for (const pil of pillarLocs) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(pil.x - 8, pil.y - 4, 16, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(pil.x - 6, pil.y - 20, 12, 20);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(pil.x - 7, pil.y - 18, 14, 3);
        ctx.fillRect(pil.x - 7, pil.y - 6, 14, 3);
      }

      // 7. Pot Tanaman Palem Emas
      for (const px of [3.5 * ts, 14.5 * ts]) {
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(px, 5.5 * ts, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(px, 5.5 * ts - 6, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawDeskNPC(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    hairColor: string,
    outfitColor: string,
    nameTag: string
  ): void {
    ctx.save();
    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(x - 6, y - 6, 12, 6);
    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 5, y, 10, 6);
    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 3, y + 2, 2, 2);
    ctx.fillRect(x + 1, y + 2, 2, 2);
    // Body / Outfit
    ctx.fillStyle = outfitColor;
    ctx.fillRect(x - 6, y + 6, 12, 10);

    // Name Tag Pill Badge
    ctx.font = 'bold 7.5px sans-serif';
    const tagW = ctx.measureText(nameTag).width + 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x - tagW / 2, y - 20, tagW, 12, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameTag, x, y - 14);

    ctx.restore();
  }

  private drawLoungeTable(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Round wooden table
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();

    // Chairs
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(x - 18, y, 5, 0, Math.PI * 2);
    ctx.arc(x + 18, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFireplace(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Stone Hearth
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, 36, 26);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 2, y + 24, 40, 4);

    // Crackling Fire
    const flame = Math.sin(this.animTimer * 5) * 2;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 8, y + 10, 20, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 12, y + 12 + flame, 12, 10);
  }

  private renderRoomLanterns(ctx: CanvasRenderingContext2D, _room: InteriorId, def: BuildingDoorDef): void {
    const ts = CONSTANTS.TILE_SIZE;
    const rw = def.roomWidth * ts;

    // 2 Lentera Dinding di Kiri dan Kanan
    const leftX = 1.5 * ts;
    const rightX = rw - 1.5 * ts;
    const ly = 1.8 * ts;

    const pulse = Math.sin(this.animTimer * 4) * 1.5;

    for (const lx of [leftX, rightX]) {
      // Iron Bracket
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lx - 2, ly - 4, 4, 10);

      // Lantern Glass & Glow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lx - 4, ly + 2, 8, 8);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.arc(lx, ly + 6, 14 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
