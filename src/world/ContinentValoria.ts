import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum ValoriaTileType {
  SAVANNA = 0,         // Padang rumput savana keemasan
  DESERT_SAND = 1,     // Pasir gurun emas bersinar
  DUNES = 2,           // Gundukan pasir gurun berombak
  WATER = 3,           // Samudra luas & oase zamrud
  COBBLESTONE = 4,     // Jalan batu ubin pelabuhan & kota
  DIRT_PATH = 5,       // Jalan setapak karavan gurun
  SNOW = 6,            // Dataran salju putih bersih
  ICE = 7,             // Danau es beku berkilauan
  CRYSTAL_SOIL = 8,    // Tanah mistis ungu lembah kristal
  PINE_TREE = 9,       // Pohon pinus salju (solid)
  PALM_TREE = 10,      // Pohon palem oase gurun (solid)
  SAVANNA_TREE = 11,   // Pohon akasia savana (solid)
  CLIFF = 12,          // Tebing bebatuan cadas & ngarai (solid)
  CRYSTAL_SPIRE = 13   // Monolit kristal mana raksasa (solid)
}

export interface ValoriaNPC {
  id: string;
  name: string;
  title: string;
  village: string;
  x: number;
  y: number;
  icon: string;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  dialog: string[];
}

/**
 * ContinentValoria - Benua Baru yang Sangat Luas (120x120 Tiles / 3840x3840 Px)
 * Menampilkan 4 Pedesaan Unik:
 * 1. Kota Pelabuhan Bahari Port Valoria (Pesisir Samudra Barat Daya)
 * 2. Dusun Oasis Karavan Al-Zahra (Gurun Pasir Emas Selatan-Tengah)
 * 3. Dusun Pegunungan Salju Frostpeak Haven (Puncak Salju Abadi Utara)
 * 4. Dusun Lembah Kristal Celestia (Lembah Alkemis Kristal Timur Laut)
 * Serta landmark megah: Piramida Matahari Purba, Mercusuar Pelabuhan, & Kapal Samudra.
 */
export class ContinentValoria {
  public readonly width: number = 120;
  public readonly height: number = 120;
  public readonly tileSize: number = CONSTANTS.TILE_SIZE;
  private tiles: number[][];
  private animTimer: number = 0;

  public npcs: ValoriaNPC[] = [];

  constructor() {
    this.tiles = [];
    this.generateContinent();
    this.initNPCs();
  }

  private generateContinent(): void {
    const w = this.width;
    const h = this.height;

    // 1. Inisialisasi dasar bioma berdasarkan koordinat
    for (let y = 0; y < h; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < w; x++) {
        // Tepi batas peta samudra luas & tebing batas dunia
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          this.tiles[y][x] = ValoriaTileType.CLIFF;
          continue;
        }

        // Tepi pantai barat & selatan adalah samudra luas
        if ((x <= 8 && y >= 65) || (y >= 108 && x <= 60)) {
          this.tiles[y][x] = ValoriaTileType.WATER;
          continue;
        }

        // Bioma Utara (y < 35): Pegunungan Salju & Hutan Pinus Es Frostpeak
        if (y < 35) {
          if (x < 65) {
            // Zona Salju Frostpeak
            const snowNoise = Math.sin(x * 0.2) + Math.cos(y * 0.2);
            if (snowNoise > 0.65 && Math.hypot(x - 30, y - 20) > 8) {
              this.tiles[y][x] = ValoriaTileType.PINE_TREE;
            } else if (snowNoise < -1.1 && y > 15 && x > 20 && x < 40) {
              this.tiles[y][x] = ValoriaTileType.ICE; // Danau es beku
            } else {
              this.tiles[y][x] = ValoriaTileType.SNOW;
            }
          } else {
            // Zona Lembah Kristal Celestia (Timur Laut: x >= 65, y < 45)
            const crystalNoise = Math.sin(x * 0.25) * Math.cos(y * 0.25);
            if (crystalNoise > 0.55 && Math.hypot(x - 90, y - 28) > 9) {
              this.tiles[y][x] = ValoriaTileType.CRYSTAL_SPIRE;
            } else {
              this.tiles[y][x] = ValoriaTileType.CRYSTAL_SOIL;
            }
          }
          continue;
        }

        // Bioma Selatan & Tenggara (y >= 55, x >= 40): Gurun Pasir Emas Solaria & Oase
        if (y >= 55 && x >= 40) {
          const duneNoise = Math.sin(x * 0.15 + y * 0.12) + Math.cos(x * 0.08 - y * 0.1);
          if (duneNoise > 0.8) {
            this.tiles[y][x] = ValoriaTileType.DUNES;
          } else {
            this.tiles[y][x] = ValoriaTileType.DESERT_SAND;
          }
          continue;
        }

        // Bioma Barat Daya (y >= 75, x < 40): Pesisir Teluk Port Valoria
        if (y >= 75 && x < 40) {
          if (x < 15 || y > 102) {
            this.tiles[y][x] = ValoriaTileType.WATER;
          } else if (x < 18 || y > 99) {
            this.tiles[y][x] = ValoriaTileType.DESERT_SAND;
          } else {
            this.tiles[y][x] = ValoriaTileType.SAVANNA;
          }
          continue;
        }

        // Bioma Tengah (y: 35..75): Padang Savana Keemasan & Lembah Transisi
        const savNoise = Math.sin(x * 0.18) * Math.sin(y * 0.18);
        if (savNoise > 0.6 && Math.hypot(x - 55, y - 55) > 10) {
          this.tiles[y][x] = ValoriaTileType.SAVANNA_TREE;
        } else if (savNoise < -0.8) {
          this.tiles[y][x] = ValoriaTileType.DESERT_SAND;
        } else {
          this.tiles[y][x] = ValoriaTileType.SAVANNA;
        }
      }
    }

    // --- 2. WILAYAH PEDESAAN 1: KOTA PELABUHAN PORT VALORIA (x: 18..38, y: 82..100) ---
    // Area pelabuhan bebas dari pohon pengganggu
    for (let py = 82; py <= 100; py++) {
      for (let px = 18; px <= 38; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          if (this.tiles[py][px] !== ValoriaTileType.WATER) {
            this.tiles[py][px] = ValoriaTileType.SAVANNA;
          }
        }
      }
    }
    // Pelataran dermaga kayu / batu pelabuhan megah (x: 22..34, y: 88..98)
    for (let py = 88; py <= 98; py++) {
      for (let px = 22; px <= 34; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = ValoriaTileType.COBBLESTONE;
        }
      }
    }
    // Dermaga Kayu menjorok ke Samudra (x: 14..22, y: 91..94)
    for (let py = 91; py <= 94; py++) {
      for (let px = 14; px <= 22; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = ValoriaTileType.COBBLESTONE;
        }
      }
    }

    // --- 3. WILAYAH PEDESAAN 2: DUSUN OASIS KARAVAN AL-ZAHRA (x: 64..86, y: 66..86) ---
    // Area pedesaan oasis gurun pasir emas
    for (let oy = 66; oy <= 86; oy++) {
      for (let ox = 64; ox <= 86; ox++) {
        if (this.tiles[oy] && this.tiles[oy][ox] !== undefined) {
          this.tiles[oy][ox] = ValoriaTileType.DESERT_SAND;
        }
      }
    }
    // Danau Oasis Zamrud Al-Zahra (x: 72..78, y: 73..78)
    for (let oy = 73; oy <= 78; oy++) {
      for (let ox = 72; ox <= 78; ox++) {
        if (Math.hypot(ox - 75, oy - 75.5) <= 3.2) {
          this.tiles[oy][ox] = ValoriaTileType.WATER;
        }
      }
    }
    // Tepian rumput subur di sekitar oasis
    for (let oy = 71; oy <= 80; oy++) {
      for (let ox = 70; ox <= 80; ox++) {
        if (this.tiles[oy][ox] !== ValoriaTileType.WATER) {
          if (Math.hypot(ox - 75, oy - 75.5) <= 5.2) {
            this.tiles[oy][ox] = ValoriaTileType.SAVANNA;
          }
        }
      }
    }
    // Pohon palem mengelilingi oasis
    const palmPositions = [
      { x: 70, y: 72 }, { x: 79, y: 72 }, { x: 80, y: 77 },
      { x: 71, y: 79 }, { x: 76, y: 80 }, { x: 74, y: 71 }
    ];
    for (const p of palmPositions) {
      if (this.tiles[p.y] && this.tiles[p.y][p.x] !== undefined) {
        this.tiles[p.y][p.x] = ValoriaTileType.PALM_TREE;
      }
    }
    // Pelataran pasar karavan sutra (x: 66..72, y: 78..84)
    for (let py = 78; py <= 84; py++) {
      for (let px = 66; px <= 72; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined && this.tiles[py][px] !== ValoriaTileType.WATER) {
          this.tiles[py][px] = ValoriaTileType.COBBLESTONE;
        }
      }
    }

    // --- 4. WILAYAH PEDESAAN 3: DUSUN SALJU FROSTPEAK HAVEN (x: 20..42, y: 12..30) ---
    // Bersihkan area desa dari pohon pinus padat
    for (let fy = 12; fy <= 30; fy++) {
      for (let fx = 20; fx <= 42; fx++) {
        if (this.tiles[fy] && this.tiles[fy][fx] !== undefined) {
          this.tiles[fy][fx] = ValoriaTileType.SNOW;
        }
      }
    }
    // Danau es pemancingan beku (x: 23..28, y: 22..26)
    for (let fy = 22; fy <= 26; fy++) {
      for (let fx = 23; fx <= 28; fx++) {
        this.tiles[fy][fx] = ValoriaTileType.ICE;
      }
    }
    // Pelataran alun-alun api unggun kabin Frostpeak (x: 30..38, y: 18..25)
    for (let fy = 18; fy <= 25; fy++) {
      for (let fx = 30; fx <= 38; fx++) {
        this.tiles[fy][fx] = ValoriaTileType.COBBLESTONE;
      }
    }

    // --- 5. WILAYAH PEDESAAN 4: LEMBAH KRISTAL CELESTIA (x: 78..102, y: 18..38) ---
    for (let cy = 18; cy <= 38; cy++) {
      for (let cx = 78; cx <= 102; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = ValoriaTileType.CRYSTAL_SOIL;
        }
      }
    }
    // Alun-alun Observatorium Kristal (x: 85..95, y: 24..33)
    for (let cy = 24; cy <= 33; cy++) {
      for (let cx = 85; cx <= 95; cx++) {
        this.tiles[cy][cx] = ValoriaTileType.COBBLESTONE;
      }
    }

    // --- 6. LANDMARK LEGENDA: RERUNTUHAN PIRAMIDA MATAHARI PURBA (x: 50..62, y: 50..62) ---
    // Kompleks piramida batu pasir kuno di tengah gurun
    for (let ry = 50; ry <= 62; ry++) {
      for (let rx = 50; rx <= 62; rx++) {
        if (this.tiles[ry] && this.tiles[ry][rx] !== undefined) {
          this.tiles[ry][rx] = ValoriaTileType.COBBLESTONE;
        }
      }
    }

    // --- 7. JALAN RAYA EKSPEDISI KARAVAN BENUA VALORIA ---
    // Jalur 1: Port Valoria (x:28, y:88) ke Oasis Al-Zahra (x:68, y:80)
    for (let x = 28; x <= 68; x++) {
      for (let y = 84; y <= 85; y++) {
        if (this.tiles[y] && this.tiles[y][x] !== undefined && this.tiles[y][x] !== ValoriaTileType.WATER) {
          this.tiles[y][x] = ValoriaTileType.DIRT_PATH;
        }
      }
    }
    // Jalur 2: Port Valoria ke Frostpeak Haven (ke utara sampai y:25, x:34)
    for (let y = 25; y <= 85; y++) {
      for (let x = 33; x <= 34; x++) {
        if (this.tiles[y] && this.tiles[y][x] !== undefined && this.tiles[y][x] !== ValoriaTileType.WATER) {
          this.tiles[y][x] = ValoriaTileType.DIRT_PATH;
        }
      }
    }
    // Jalur 3: Frostpeak ke Celestia (x:34..90, y:28..29)
    for (let x = 34; x <= 90; x++) {
      for (let y = 28; y <= 29; y++) {
        if (this.tiles[y] && this.tiles[y][x] !== undefined) {
          this.tiles[y][x] = ValoriaTileType.DIRT_PATH;
        }
      }
    }
    // Jalur 4: Oasis Al-Zahra ke Celestia (x:72..90, y:30..80)
    for (let y = 30; y <= 80; y++) {
      for (let x = 70; x <= 71; x++) {
        if (this.tiles[y] && this.tiles[y][x] !== undefined && this.tiles[y][x] !== ValoriaTileType.WATER) {
          this.tiles[y][x] = ValoriaTileType.DIRT_PATH;
        }
      }
    }
  }

  private initNPCs(): void {
    const ts = this.tileSize;
    this.npcs = [
      // 1. Port Valoria
      {
        id: 'npc_captain_vasco',
        name: 'Kapten Vasco',
        title: 'Nakhoda Kapal Samudra Valoria',
        village: 'Port Valoria',
        x: 18 * ts + 16,
        y: 92 * ts + 10,
        icon: '⚓',
        hairColor: '#f59e0b',
        outfitColor: '#1e3a8a',
        accentColor: '#38bdf8',
        dialog: [
          'Selamat datang di Benua Valoria, sang pengelana samudra!',
          'Kapal "Queen of Waves" ini siap berlayar kembali ke Benua Aethelgard kapan pun engkau siap.',
          'Benua ini luas dan liar: ada oasis gurun di tenggara, puncak salju di utara, dan lembah kristal di timur laut!'
        ]
      },
      {
        id: 'npc_harbor_trader_elena',
        name: 'Saudagar Elena',
        title: 'Kepala Bea Cukai Pelabuhan',
        village: 'Port Valoria',
        x: 26 * ts + 10,
        y: 90 * ts + 12,
        icon: '📦',
        hairColor: '#ec4899',
        outfitColor: '#047857',
        accentColor: '#10b981',
        dialog: [
          'Semua kargo rempah gurun dan bijih kristal singgah di pelabuhan kami.',
          'Jika engkau mencari petualangan besar, jangan lewatkan Piramida Matahari di tengah gurun!'
        ]
      },

      // 2. Oasis Al-Zahra
      {
        id: 'npc_sheikh_malik',
        name: 'Saudagar Malik',
        title: 'Ketua Karavan Pasir Emas',
        village: 'Oasis Al-Zahra',
        x: 68 * ts + 16,
        y: 81 * ts + 10,
        icon: '🐫',
        hairColor: '#d97706',
        outfitColor: '#78350f',
        accentColor: '#fde047',
        dialog: [
          'Salam hangat, musafir! Dinginkan tenggorokanmu dengan air zamrud Oasis Al-Zahra.',
          'Gurun Solaria menyimpan banyak misteri dan monster Kalajengking Emas purba.',
          'Kafilah kami sering menyeberangi ngarai menuju Lembah Kristal Celestia di timur laut.'
        ]
      },
      {
        id: 'npc_yasmin_oasis',
        name: 'Yasmin',
        title: 'Penjaga Air Sejuk Oasis',
        village: 'Oasis Al-Zahra',
        x: 74 * ts + 12,
        y: 72 * ts + 14,
        icon: '💧',
        hairColor: '#06b6d4',
        outfitColor: '#0284c7',
        accentColor: '#67e8f9',
        dialog: [
          'Air di telaga oasis ini tidak pernah mengering selama seribu tahun.',
          'Pohon-pohon palem ini dibawa oleh nenek moyang kami dari seberang lautan.'
        ]
      },

      // 3. Frostpeak Haven
      {
        id: 'npc_hunter_gunnar',
        name: 'Gunnar si Pemburu Salju',
        title: 'Kepala Dusun Frostpeak',
        village: 'Frostpeak Haven',
        x: 33 * ts + 16,
        y: 20 * ts + 12,
        icon: '🐺',
        hairColor: '#94a3b8',
        outfitColor: '#334155',
        accentColor: '#93c5fd',
        dialog: [
          'Brrr! Dingin bukan? Mendekatlah ke api unggun komunal kami.',
          'Di lereng utara, Serigala Salju Purba berkeliaran mencari mangsa.',
          'Danau beku di barat desa adalah tempat memancing Ikan Es Salju yang sangat bernilai tinggi!'
        ]
      },

      // 4. Lembah Kristal Celestia
      {
        id: 'npc_archmage_aurelius',
        name: 'Arkhemis Aurelius',
        title: 'Peneliti Kristal Mana Purba',
        village: 'Lembah Kristal Celestia',
        x: 90 * ts + 16,
        y: 26 * ts + 10,
        icon: '🔮',
        hairColor: '#a855f7',
        outfitColor: '#581c87',
        accentColor: '#c084fc',
        dialog: [
          'Dengarkan resonansi nada kristal-kristal ini... Ini adalah denyut nadi bumi Valoria.',
          'Kami mempelajari rahasia kuno yang tertinggal dari peradaban Piramida Matahari.',
          'Gunakan Waystone kuno di sini jika engkau ingin menjelajah antar-benua seketika!'
        ]
      }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;
  }

  public getTileAt(tileX: number, tileY: number): ValoriaTileType {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return ValoriaTileType.CLIFF;
    }
    return this.tiles[tileY]?.[tileX] ?? ValoriaTileType.SAVANNA;
  }

  public isTileWater(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return false;
    }
    return this.tiles[tileY]?.[tileX] === ValoriaTileType.WATER;
  }

  public isTileSolid(tileX: number, tileY: number, canSwim: boolean = false): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return true;
    }
    const t = this.tiles[tileY]?.[tileX];
    if (t === ValoriaTileType.WATER) {
      return !canSwim;
    }
    return (
      t === ValoriaTileType.CLIFF ||
      t === ValoriaTileType.PINE_TREE ||
      t === ValoriaTileType.PALM_TREE ||
      t === ValoriaTileType.SAVANNA_TREE ||
      t === ValoriaTileType.CRYSTAL_SPIRE
    );
  }

  public checkCollision(rect: { x: number; y: number; width: number; height: number }, canSwim: boolean = false): boolean {
    const leftTile = Math.floor(rect.x / this.tileSize);
    const rightTile = Math.floor((rect.x + rect.width - 0.01) / this.tileSize);
    const topTile = Math.floor(rect.y / this.tileSize);
    const bottomTile = Math.floor((rect.y + rect.height - 0.01) / this.tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isTileSolid(tx, ty, canSwim)) {
          return true;
        }
      }
    }
    return false;
  }

  public isVillageArea(tileX: number, tileY: number): boolean {
    // Port Valoria
    if (tileX >= 18 && tileX <= 38 && tileY >= 82 && tileY <= 100) return true;
    // Oasis Al-Zahra
    if (tileX >= 64 && tileX <= 86 && tileY >= 66 && tileY <= 86) return true;
    // Frostpeak Haven
    if (tileX >= 20 && tileX <= 42 && tileY >= 12 && tileY <= 30) return true;
    // Celestia
    if (tileX >= 78 && tileX <= 102 && tileY >= 18 && tileY <= 38) return true;
    // Piramida Matahari
    if (tileX >= 50 && tileX <= 62 && tileY >= 50 && tileY <= 62) return true;
    return false;
  }

  public getVillageName(tileX: number, tileY: number): string {
    if (tileX >= 18 && tileX <= 38 && tileY >= 82 && tileY <= 100) {
      return 'Kota Pelabuhan Port Valoria';
    }
    if (tileX >= 64 && tileX <= 86 && tileY >= 66 && tileY <= 86) {
      return 'Dusun Oasis Karavan Al-Zahra';
    }
    if (tileX >= 20 && tileX <= 42 && tileY >= 12 && tileY <= 30) {
      return 'Dusun Salju Frostpeak Haven';
    }
    if (tileX >= 78 && tileX <= 102 && tileY >= 18 && tileY <= 38) {
      return 'Lembah Kristal Celestia';
    }
    if (tileX >= 50 && tileX <= 62 && tileY >= 50 && tileY <= 62) {
      return 'Reruntuhan Piramida Matahari Purba';
    }
    if (tileY < 35) {
      return 'Lereng Salju Pegunungan Frostpeak';
    }
    if (tileY >= 55 && tileX >= 40) {
      return 'Gurun Pasir Emas Solaria';
    }
    if (tileX <= 18 || (tileY >= 105 && tileX <= 60)) {
      return 'Pesisir Samudra Abisal Barat';
    }
    return 'Padang Savana Luar Valoria';
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // 1. Gambar Ubin Dunia
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.tiles[y][x];
        const px = x * ts;
        const py = y * ts;
        this.drawTile(ctx, tile, px, py, ts, x, y);
      }
    }

    // 2. Render Kapal Layar Samudra Ekspedisi Megah di Pelabuhan Port Valoria (x: 10..18, y: 90..95)
    this.renderPortGalleon(ctx, 12 * ts, 89 * ts);

    // 3. Render Mercusuar Port Valoria (x: 21 * ts, y: 84 * ts)
    this.renderLighthouse(ctx, 22 * ts, 84 * ts);

    // 4. Render Piramida Matahari Purba di Tengah Gurun (x: 52 * ts, y: 51 * ts)
    this.renderSunPyramid(ctx, 53 * ts, 51 * ts);

    // 5. Render Api Unggun Dusun Salju Frostpeak (x: 34 * ts, y: 21 * ts)
    this.renderFrostfireCamp(ctx, 34 * ts + 16, 21 * ts + 16);

    // 6. Render Kristal Mana Raksasa Celestia (x: 88 * ts, y: 26 * ts)
    this.renderGiantCrystal(ctx, 89 * ts, 26 * ts);

    // 7. Render Tenda Karavan Al-Zahra (x: 68 * ts, y: 79 * ts)
    this.renderOasisTent(ctx, 67 * ts, 79 * ts);

    // 8. Render NPC Benua Valoria
    this.renderNPCs(ctx, camera);
  }

  private drawTile(ctx: CanvasRenderingContext2D, type: ValoriaTileType, x: number, y: number, size: number, tx: number, ty: number): void {
    switch (type) {
      case ValoriaTileType.SAVANNA: {
        ctx.fillStyle = '#65a30d'; // Savana hijau keemasan
        ctx.fillRect(x, y, size, size);
        if ((tx + ty) % 3 === 0) {
          ctx.fillStyle = '#84cc16';
          ctx.fillRect(x + 6, y + 8, 3, 4);
          ctx.fillRect(x + 20, y + 18, 3, 4);
        }
        break;
      }
      case ValoriaTileType.DESERT_SAND: {
        ctx.fillStyle = '#eab308'; // Pasir gurun emas hangat
        ctx.fillRect(x, y, size, size);
        if ((tx * 3 + ty * 7) % 4 === 0) {
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(x + 8, y + 12, 4, 2);
          ctx.fillRect(x + 22, y + 6, 3, 2);
        }
        break;
      }
      case ValoriaTileType.DUNES: {
        ctx.fillStyle = '#d97706'; // Bukit pasir keemasan tua
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 2, y + 4, size - 4, 6);
        ctx.fillRect(x + 6, y + 16, size - 10, 5);
        break;
      }
      case ValoriaTileType.WATER: {
        const wave = Math.sin(this.animTimer * 2 + tx * 0.4 + ty * 0.4) * 2;
        ctx.fillStyle = '#0284c7'; // Biru samudra jernih
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 4, y + 10 + wave, 12, 2);
        ctx.fillRect(x + 18, y + 22 - wave, 10, 2);
        break;
      }
      case ValoriaTileType.COBBLESTONE: {
        ctx.fillStyle = '#64748b'; // Batu ubin cobblestone
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        break;
      }
      case ValoriaTileType.DIRT_PATH: {
        ctx.fillStyle = '#b45309'; // Jalur tanah karavan
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 6, y + 10, 4, 3);
        ctx.fillRect(x + 18, y + 22, 5, 3);
        break;
      }
      case ValoriaTileType.SNOW: {
        ctx.fillStyle = '#f8fafc'; // Salju putih murni
        ctx.fillRect(x, y, size, size);
        if ((tx + ty) % 4 === 0) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(x + 10, y + 12, 4, 3);
        }
        break;
      }
      case ValoriaTileType.ICE: {
        ctx.fillStyle = '#7dd3fc'; // Danau es beku berkilauan
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(x + 4, y + 6, size - 8, 3);
        ctx.fillRect(x + 8, y + 18, size - 14, 2);
        break;
      }
      case ValoriaTileType.CRYSTAL_SOIL: {
        ctx.fillStyle = '#4c1d95'; // Tanah ungu mistis lembah kristal
        ctx.fillRect(x, y, size, size);
        if ((tx * 5 + ty) % 3 === 0) {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(x + 12, y + 10, 3, 3);
          ctx.fillRect(x + 22, y + 22, 3, 3);
        }
        break;
      }
      case ValoriaTileType.PINE_TREE: {
        // Salju di bawah
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, size, size);
        // Batang pinus
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x + 13, y + 18, 6, 14);
        // Daun pinus bersalju
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 2);
        ctx.lineTo(x + 28, y + 14);
        ctx.lineTo(x + 4, y + 14);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 8);
        ctx.lineTo(x + 30, y + 22);
        ctx.lineTo(x + 2, y + 22);
        ctx.closePath();
        ctx.fill();
        // Aksen salju di dahan pinus
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 14, y + 2, 4, 3);
        ctx.fillRect(x + 6, y + 13, 20, 2);
        break;
      }
      case ValoriaTileType.PALM_TREE: {
        // Pasir di bawah
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x, y, size, size);
        // Batang melengkung
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(x + 14, y + 10, 5, 22);
        // Daun palem hijau subur
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(x + 16, y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + 4, y + 4, 8, 4);
        ctx.fillRect(x + 20, y + 4, 8, 4);
        break;
      }
      case ValoriaTileType.SAVANNA_TREE: {
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(x, y, size, size);
        // Batang akasia
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 14, y + 12, 5, 20);
        // Mahkota akasia melebar
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 10, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case ValoriaTileType.CLIFF: {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 4, y + 8, size - 8, size - 12);
        break;
      }
      case ValoriaTileType.CRYSTAL_SPIRE: {
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(x, y, size, size);
        // Kristal meruncing berkilau
        const pulse = 0.8 + Math.sin(this.animTimer * 3 + tx + ty) * 0.2;
        ctx.fillStyle = `rgba(192, 132, 252, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 2);
        ctx.lineTo(x + 26, y + 26);
        ctx.lineTo(x + 6, y + 26);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
    }
  }

  /**
   * Render Kapal Layar Samudra Megah di Pelabuhan Port Valoria
   */
  private renderPortGalleon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Lambung Kapal Kayu Jati Tua
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(x, y + 40);
    ctx.lineTo(x + 180, y + 40);
    ctx.lineTo(x + 150, y + 90);
    ctx.lineTo(x + 30, y + 90);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Garis emas lambung kapal
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 20, y + 50, 140, 5);

    // Tiang Layar Utama
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 60, y - 50, 8, 90);
    ctx.fillRect(x + 120, y - 40, 8, 80);

    // Layar Putih Samudra Megah
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(x + 64, y - 45);
    ctx.quadraticCurveTo(x + 95, y - 10, x + 64, y + 30);
    ctx.lineTo(x + 20, y + 30);
    ctx.quadraticCurveTo(x + 40, y - 10, x + 20, y - 45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bendera Merah Valoria di Puncak Tiang
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x + 68, y - 50);
    ctx.lineTo(x + 95, y - 44);
    ctx.lineTo(x + 68, y - 38);
    ctx.closePath();
    ctx.fill();

    // Teks Nama Kapal
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('⛵ QUEEN OF WAVES', x + 35, y + 70);

    ctx.restore();
  }

  /**
   * Render Mercusuar Port Valoria
   */
  private renderLighthouse(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Menara Mercusuar Batu Bergaris Merah Putih
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 60);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + 26, y);
    ctx.lineTo(x + 32, y + 60);
    ctx.closePath();
    ctx.fill();

    // Garis merah
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 11, y + 16, 18, 12);
    ctx.fillRect(x + 9, y + 38, 22, 12);

    // Rumah Lampu Mercusuar
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x + 20, y - 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Suar Cahaya Berputar
    const beamAngle = this.animTimer * 1.5;
    const beamX = Math.cos(beamAngle) * 60;
    const beamY = Math.sin(beamAngle) * 30;
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 4);
    ctx.lineTo(x + 20 + beamX, y - 4 + beamY);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render Piramida Matahari Purba di Jantung Gurun
   */
  private renderSunPyramid(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Struktur piramida berundak 4 tingkat
    const levels = [
      { w: 180, h: 22, offset: 0, color: '#ca8a04' },
      { w: 140, h: 20, offset: 20, color: '#d97706' },
      { w: 100, h: 18, offset: 40, color: '#eab308' },
      { w: 60, h: 16, offset: 60, color: '#f59e0b' }
    ];

    let curY = y + 80;
    for (const lvl of levels) {
      ctx.fillStyle = lvl.color;
      ctx.fillRect(x + lvl.offset, curY - lvl.h, lvl.w, lvl.h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + lvl.offset, curY - lvl.h, lvl.w, lvl.h);
      curY -= lvl.h;
    }

    // Matahari Emas di Puncak Piramida
    const glow = 0.8 + Math.sin(this.animTimer * 4) * 0.2;
    ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
    ctx.beginPath();
    ctx.arc(x + 90, curY - 14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️ PIRAMIDA MATAHARI PURBA', x + 90, y + 105);

    ctx.restore();
  }

  /**
   * Render Api Unggun Dusun Salju Frostpeak
   */
  private renderFrostfireCamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Tumpukan kayu bakar melingkar
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 14, y + 2, 28, 6);
    ctx.fillRect(x - 10, y - 4, 20, 6);

    // Kobaran Api Unggun Hangat Beranimasi
    const flameH = 14 + Math.sin(this.animTimer * 8) * 4;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2);
    ctx.lineTo(x + 10, y + 2);
    ctx.lineTo(x, y - flameH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 2);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x, y - flameH * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Kristal Mana Raksasa Celestia
   */
  private renderGiantCrystal(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    const pulse = 0.7 + Math.sin(this.animTimer * 3) * 0.3;
    ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.beginPath();
    ctx.moveTo(x + 24, y - 30);
    ctx.lineTo(x + 48, y + 40);
    ctx.lineTo(x + 24, y + 55);
    ctx.lineTo(x, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Kristal anak di samping
    ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 15);
    ctx.lineTo(x + 5, y + 50);
    ctx.lineTo(x - 15, y + 50);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Tenda Sutra Karavan Al-Zahra
   */
  private renderOasisTent(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Tenda bergaris Merah Marun & Emas
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 60, y + 36);
    ctx.lineTo(x, y + 36);
    ctx.closePath();
    ctx.fill();

    // Garis emas tenda
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 18);
    ctx.lineTo(x + 45, y + 18);
    ctx.stroke();

    // Pintu tenda terbuka
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 15);
    ctx.lineTo(x + 40, y + 36);
    ctx.lineTo(x + 20, y + 36);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderNPCs(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const npc of this.npcs) {
      if (
        npc.x < camera.x - 64 ||
        npc.x > camera.x + camera.viewportWidth + 64 ||
        npc.y < camera.y - 64 ||
        npc.y > camera.y + camera.viewportHeight + 64
      ) {
        continue;
      }

      ctx.save();
      // Bayangan
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(npc.x + 12, npc.y + 26, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tubuh NPC
      ctx.fillStyle = npc.outfitColor;
      ctx.fillRect(npc.x + 4, npc.y + 12, 16, 14);

      // Kepala NPC
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(npc.x + 6, npc.y + 4, 12, 10);

      // Rambut NPC
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(npc.x + 5, npc.y + 2, 14, 5);

      // Nama NPC & Icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${npc.icon} ${npc.name}`, npc.x + 12, npc.y - 4);

      // Subtitle Dusun
      ctx.fillStyle = npc.accentColor;
      ctx.font = '8px sans-serif';
      ctx.fillText(npc.title, npc.x + 12, npc.y + 36);

      ctx.restore();
    }
  }

  /**
   * Menemukan NPC terdekat untuk interaksi dialog
   */
  public getNearbyNPC(playerCenterX: number, playerCenterY: number): ValoriaNPC | null {
    for (const npc of this.npcs) {
      const dist = Math.hypot(playerCenterX - (npc.x + 12), playerCenterY - (npc.y + 14));
      if (dist < 48) {
        return npc;
      }
    }
    return null;
  }
}
