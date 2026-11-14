export interface RegionData {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  isSafeZone: boolean;
  centerTile: { x: number; y: number };
  contains: (tileX: number, tileY: number) => boolean;
}

export class RegionManager {
  private static instance: RegionManager | null = null;

  public currentRegion: RegionData;
  private previousRegionId: string = '';

  // Banner Animasi Penemuan / Masuk Wilayah (Territory Discovery Banner)
  private bannerRegion: RegionData | null = null;
  private bannerTimer: number = 0;
  private bannerDuration: number = 3.6; // durasi tampil 3.6 detik

  public static readonly OVERWORLD_REGIONS: RegionData[] = [
    // 1. Ibukota Serikat Petualang
    {
      id: 'OAKHAVEN',
      name: 'Desa Oakhaven',
      subtitle: '~ Ibukota Serikat & Alun-Alun Petualang ~',
      icon: '🏰',
      themeColor: '#38bdf8',
      accentColor: '#facc15',
      isSafeZone: true,
      centerTile: { x: 50, y: 50 },
      contains: (x, y) => x >= 40 && x <= 59 && y >= 41 && y <= 58
    },

    // 2. Distrik Pasar Raya (Grand Bazaar)
    {
      id: 'GRAND_BAZAAR',
      name: 'Distrik Pasar Raya',
      subtitle: '~ Pusat Perniagaan, Kuliner & Suaka Satwa ~',
      icon: '🎪',
      themeColor: '#f59e0b',
      accentColor: '#fde047',
      isSafeZone: true,
      centerTile: { x: 68, y: 50 },
      contains: (x, y) => x >= 60 && x <= 77 && y >= 43 && y <= 58
    },

    // 3. Desa Peri Hutan Eldoria (Barat Laut)
    {
      id: 'ELDORIA',
      name: 'Desa Rimba Peri Eldoria',
      subtitle: '~ Rimba Mistis Leluhur & Kuil Roh Hutan ~',
      icon: '🌿',
      themeColor: '#10b981',
      accentColor: '#34d399',
      isSafeZone: true,
      centerTile: { x: 22, y: 20 },
      contains: (x, y) => x >= 12 && x <= 33 && y >= 11 && y <= 29
    },

    // 4. Benteng Tambang Stonewatch (Tenggara)
    {
      id: 'STONEWATCH',
      name: 'Benteng Tambang Stonewatch',
      subtitle: '~ Benteng Granit Kurcaci & Tambang Besi Abisal ~',
      icon: '⛏️',
      themeColor: '#f97316',
      accentColor: '#fdba74',
      isSafeZone: true,
      centerTile: { x: 84, y: 65 },
      contains: (x, y) => x >= 74 && x <= 95 && y >= 56 && y <= 75
    },

    // 5. Dusun Nelayan Tirta Kencana (Desa Baru 1 - Barat Daya / Tepi Danau)
    {
      id: 'TIRTA_KENCANA',
      name: 'Dusun Nelayan Tirta Kencana',
      subtitle: '~ Dermaga Perahu & Dusun Pesisir Danau Sejuk ~',
      icon: '🐟',
      themeColor: '#06b6d4',
      accentColor: '#67e8f9',
      isSafeZone: true,
      centerTile: { x: 33, y: 73 },
      contains: (x, y) => x >= 24 && x <= 43 && y >= 68 && y <= 82
    },

    // 6. Dusun Pertanian Ambervale (Desa Baru 2 - Timur Laut / Lembah Gandum)
    {
      id: 'AMBERVALE',
      name: 'Dusun Pertanian Ambervale',
      subtitle: '~ Lembah Kincir Angin & Lumbung Gandum Kerajaan ~',
      icon: '🌾',
      themeColor: '#ca8a04',
      accentColor: '#fde047',
      isSafeZone: true,
      centerTile: { x: 77, y: 25 },
      contains: (x, y) => x >= 68 && x <= 88 && y >= 16 && y <= 35
    },

    // 7. Area Gerbang Goa Dungeon Kripta Kuno (Utara)
    {
      id: 'CRYPT_ENTRANCE',
      name: 'Lembah Kripta Kuno',
      subtitle: '~ Tebing Terjal & Pintu Makam Abisal Bawah Tanah ~',
      icon: '💀',
      themeColor: '#c084fc',
      accentColor: '#e9d5ff',
      isSafeZone: false,
      centerTile: { x: 50, y: 32 },
      contains: (x, y) => x >= 42 && x <= 58 && y >= 27 && y <= 40
    },

    // 8. Danau Sejuk Azure & Pesisir Selatan
    {
      id: 'LAKE_AZURE',
      name: 'Danau Sejuk Azure',
      subtitle: '~ Telaga Air Biru Jernih & Tepian Pasir Alami ~',
      icon: '🌊',
      themeColor: '#0284c7',
      accentColor: '#7dd3fc',
      isSafeZone: false,
      centerTile: { x: 36, y: 86 },
      contains: (x, y) => x >= 20 && x <= 54 && y >= 81 && y <= 96
    },

    // 9. Rimba Liar Whisperwood (Barat)
    {
      id: 'WHISPERWOOD',
      name: 'Rimba Liar Whisperwood',
      subtitle: '~ Hutan Rimba Belantara Habitat Slime & Serigala ~',
      icon: '🌲',
      themeColor: '#15803d',
      accentColor: '#86efac',
      isSafeZone: false,
      centerTile: { x: 20, y: 48 },
      contains: (x, y) => x < 40 && y >= 30 && y < 68
    },

    // 10. Dataran Cadas Karang Sunyi (Timur)
    {
      id: 'SILENT_CRAGS',
      name: 'Dataran Cadas Sunyi',
      subtitle: '~ Jalur Bebatuan Terjal & Wilayah Rawan Bandit ~',
      icon: '🪨',
      themeColor: '#64748b',
      accentColor: '#cbd5e1',
      isSafeZone: false,
      centerTile: { x: 88, y: 45 },
      contains: (x, y) => x >= 78 && y >= 36 && y <= 55
    },

    // 11. Padang Rumput Meadowvale (Selatan)
    {
      id: 'MEADOWVALE',
      name: 'Padang Rumput Meadowvale',
      subtitle: '~ Hamparan Bunga Liar & Padang Terbuka Selatan ~',
      icon: '🌱',
      themeColor: '#22c55e',
      accentColor: '#a7f3d0',
      isSafeZone: false,
      centerTile: { x: 50, y: 75 },
      contains: (x, y) => x >= 40 && x <= 75 && y >= 59 && y <= 85
    },

    // 12. Puncak Tebing Salju Utara
    {
      id: 'FROSTPEAK',
      name: 'Puncak Tebing Mahkota Utara',
      subtitle: '~ Pegunungan Dingin Pembatas Lembah Serikat ~',
      icon: '🏔️',
      themeColor: '#93c5fd',
      accentColor: '#dbeafe',
      isSafeZone: false,
      centerTile: { x: 50, y: 8 },
      contains: (_x, y) => y <= 16
    }
  ];

  // Default Wilayah Rimba Terbuka
  private static readonly DEFAULT_OVERWORLD: RegionData = {
    id: 'OVERWORLD_WILD',
    name: 'Padang Liar Lembah Serikat',
    subtitle: '~ Dataran Luas Penjelajahan Pahlawan ~',
    icon: '🌍',
    themeColor: '#4ade80',
    accentColor: '#86efac',
    isSafeZone: false,
    centerTile: { x: 50, y: 50 },
    contains: () => true
  };

  constructor() {
    this.currentRegion = RegionManager.OVERWORLD_REGIONS[0];
    this.previousRegionId = this.currentRegion.id;
  }

  public static getInstance(): RegionManager {
    if (!RegionManager.instance) {
      RegionManager.instance = new RegionManager();
    }
    return RegionManager.instance;
  }

  /**
   * Menentukan data wilayah berdasarkan tipe map dan koordinat tile pemain
   */
  public getRegion(currentMap: string, tileX: number, tileY: number): RegionData {
    if (currentMap === 'DUNGEON') {
      return {
        id: 'DUNGEON_F1',
        name: 'Goa Makam Purba (Lt. 1)',
        subtitle: '~ Labirin Ruang Bawah Tanah & Sarang Slime ~',
        icon: '🏰',
        themeColor: '#c084fc',
        accentColor: '#e9d5ff',
        isSafeZone: false,
        centerTile: { x: 20, y: 20 },
        contains: () => true
      };
    } else if (currentMap === 'DUNGEON_FLOOR_2') {
      return {
        id: 'DUNGEON_F2',
        name: 'Labirin Titan Abisal (Lt. 2)',
        subtitle: '~ Lorong Batu Raksasa Penjaga Titan Kuno ~',
        icon: '⚡',
        themeColor: '#60a5fa',
        accentColor: '#bfdbfe',
        isSafeZone: false,
        centerTile: { x: 20, y: 20 },
        contains: () => true
      };
    } else if (currentMap === 'DUNGEON_FLOOR_3') {
      return {
        id: 'DUNGEON_F3',
        name: 'Sanctuarium Neraka Magma (Lt. 3)',
        subtitle: '~ Altar Puncak Kediaman Raja Naga Ignis ~',
        icon: '🔥',
        themeColor: '#f97316',
        accentColor: '#fed7aa',
        isSafeZone: false,
        centerTile: { x: 20, y: 20 },
        contains: () => true
      };
    } else if (currentMap === 'DUNGEON_ELDORIA') {
      return {
        id: 'DUNGEON_ELDORIA',
        name: 'Kuil Roh Hutan Purba Eldoria',
        subtitle: '~ Kuil Suci Para Peri & Perlindungan Ent Raksasa ~',
        icon: '🌿',
        themeColor: '#34d399',
        accentColor: '#a7f3d0',
        isSafeZone: false,
        centerTile: { x: 18, y: 18 },
        contains: () => true
      };
    } else if (currentMap === 'DUNGEON_STONEWATCH') {
      return {
        id: 'DUNGEON_STONEWATCH',
        name: 'Tambang Terkutuk Besi Abisal',
        subtitle: '~ Jalur Rel Gelap & Behemoth Obsidian ~',
        icon: '⛏️',
        themeColor: '#f59e0b',
        accentColor: '#fde047',
        isSafeZone: false,
        centerTile: { x: 18, y: 18 },
        contains: () => true
      };
    } else if (currentMap.startsWith('INTERIOR_')) {
      return this.getInteriorRegion(currentMap);
    }

    // Overworld: cocokkan dengan daftar region
    for (const reg of RegionManager.OVERWORLD_REGIONS) {
      if (reg.contains(tileX, tileY)) {
        return reg;
      }
    }

    return RegionManager.DEFAULT_OVERWORLD;
  }

  private getInteriorRegion(currentMap: string): RegionData {
    switch (currentMap) {
      case 'INTERIOR_GUILD':
        return {
          id: 'INT_GUILD',
          name: 'Balai Besar Serikat Petualang',
          subtitle: '~ Altar Kebangkitan & Papan Misi Utama ~',
          icon: '🏛️',
          themeColor: '#facc15',
          accentColor: '#fef08a',
          isSafeZone: true,
          centerTile: { x: 9, y: 7 },
          contains: () => true
        };
      case 'INTERIOR_BLACKSMITH':
        return {
          id: 'INT_SMITH',
          name: 'Bengkel Tempa Master Brokk',
          subtitle: '~ Ruang Peleburan Senjata Legendaris ~',
          icon: '⚒️',
          themeColor: '#f97316',
          accentColor: '#fdba74',
          isSafeZone: true,
          centerTile: { x: 8, y: 6 },
          contains: () => true
        };
      case 'INTERIOR_APOTHECARY':
        return {
          id: 'INT_LILY',
          name: 'Toko Ramuan & Penginapan Lily',
          subtitle: '~ Ramuan Bunga Mistis & Pemulihan Stamina ~',
          icon: '🍃',
          themeColor: '#34d399',
          accentColor: '#a7f3d0',
          isSafeZone: true,
          centerTile: { x: 8, y: 6 },
          contains: () => true
        };
      case 'INTERIOR_KITCHEN':
        return {
          id: 'INT_KITCHEN',
          name: 'Dapur Kuliner Chef Gaston',
          subtitle: '~ Dapur Hidangan Penguat Status Pahlawan ~',
          icon: '🍳',
          themeColor: '#f59e0b',
          accentColor: '#fed7aa',
          isSafeZone: true,
          centerTile: { x: 8, y: 6 },
          contains: () => true
        };
      case 'INTERIOR_BANK':
        return {
          id: 'INT_BANK',
          name: 'Bank Kerajaan Oakhaven',
          subtitle: '~ Brankas Emas Val & Penukaran Koin ~',
          icon: '🏦',
          themeColor: '#38bdf8',
          accentColor: '#bae6fd',
          isSafeZone: true,
          centerTile: { x: 9, y: 6 },
          contains: () => true
        };
      case 'INTERIOR_ELDORIA':
        return {
          id: 'INT_ELDORIA',
          name: 'Pondok Suci Tetua Roh Eldoria',
          subtitle: '~ Altar Kebijaksanaan Hutan Purba ~',
          icon: '🌿',
          themeColor: '#4ade80',
          accentColor: '#bbf7d0',
          isSafeZone: true,
          centerTile: { x: 9, y: 6 },
          contains: () => true
        };
      case 'INTERIOR_STONEWATCH':
        return {
          id: 'INT_STONEWATCH',
          name: 'Markas Komando Tambang Stonewatch',
          subtitle: '~ Meja Peta Penambangan Kurcaci ~',
          icon: '⛏️',
          themeColor: '#f59e0b',
          accentColor: '#fef08a',
          isSafeZone: true,
          centerTile: { x: 9, y: 6 },
          contains: () => true
        };
      default:
        return RegionManager.DEFAULT_OVERWORLD;
    }
  }

  /**
   * Update deteksi perpindahan wilayah & timer animasi banner
   */
  public update(deltaTime: number, currentMap: string, playerTileX: number, playerTileY: number): void {
    const newRegion = this.getRegion(currentMap, playerTileX, playerTileY);
    this.currentRegion = newRegion;

    // Deteksi jika berpindah wilayah
    if (newRegion.id !== this.previousRegionId) {
      this.previousRegionId = newRegion.id;
      // Jangan tampilkan banner untuk padang liar default agar tidak spamming
      if (newRegion.id !== 'OVERWORLD_WILD') {
        this.bannerRegion = newRegion;
        this.bannerTimer = this.bannerDuration;
      }
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer = Math.max(0, this.bannerTimer - deltaTime);
      if (this.bannerTimer === 0) {
        this.bannerRegion = null;
      }
    }
  }

  /**
   * Render Banner Notifikasi Penemuan / Memasuki Wilayah Baru (Cinematic Banner Toast)
   */
  public renderTerritoryBanner(ctx: CanvasRenderingContext2D, screenWidth: number, _screenHeight: number): void {
    if (!this.bannerRegion || this.bannerTimer <= 0) return;

    ctx.save();

    // Hitung animasi fade-in dan fade-out halus
    const elapsed = this.bannerDuration - this.bannerTimer;
    let alpha = 1.0;
    if (elapsed < 0.4) {
      alpha = elapsed / 0.4;
    } else if (this.bannerTimer < 0.6) {
      alpha = this.bannerTimer / 0.6;
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const reg = this.bannerRegion;
    const titleText = `${reg.icon} ${reg.name}`;
    const subText = reg.subtitle;

    ctx.font = 'bold 12px sans-serif';
    const tw = ctx.measureText(titleText).width;
    ctx.font = 'italic 8.5px sans-serif';
    const sw = ctx.measureText(subText).width;
    const bannerW = Math.max(220, Math.max(tw, sw) + 40);
    const bannerH = 40;
    const bannerX = (screenWidth - bannerW) / 2;
    const bannerY = 36; // Muncul pas di bawah bar waktu/cuaca

    // 1. Kotak Background Banner Transparan Gelap Elegan
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();

    // 2. Lis Border Berpendar Aksen Wilayah
    ctx.strokeStyle = reg.themeColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 3. Garis Lis Dekorasi Emas Kiri & Kanan
    ctx.strokeStyle = reg.accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bannerX + 10, bannerY + bannerH - 4);
    ctx.lineTo(bannerX + bannerW - 10, bannerY + bannerH - 4);
    ctx.stroke();

    // 4. Judul Wilayah
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, bannerX + bannerW / 2, bannerY + 6);

    // 5. Subtitle Wilayah
    ctx.font = 'italic 8.5px sans-serif';
    ctx.fillStyle = reg.accentColor;
    ctx.fillText(subText, bannerX + bannerW / 2, bannerY + 22);

    ctx.restore();
  }
}
