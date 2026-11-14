import { CONSTANTS } from '../core/Constants.ts';
import { Player } from '../entities/Player.ts';
import { QuestManager } from './QuestManager.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { MarketShopId } from '../systems/MarketSystem.ts';

export interface MarketShopLocation {
  id: MarketShopId;
  name: string;
  merchantName: string;
  icon: string;
  bannerColor: string;
  accentColor: string;
  x: number;
  y: number;
  prompt: string;
}

export interface VillageNPCData {
  id: string;
  name: string;
  title: string;
  roleType: 'QUEST' | 'AMBIENT' | 'RIDDLE';
  questId?: string;
  riddleId?: 'ELDORIA' | 'STONEWATCH';
  x: number;
  y: number;
  width: number;
  height: number;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  avatarIcon: string;
  greetingText: string;
  loreText: string;
  actionPrompt: string;
  isCat?: boolean;
  isInsideBuilding?: boolean;
}

export class VillageManager {
  private questManager: QuestManager;
  private animTimer: number = 0;

  // Active Dialog State
  public activeDialogNPC: VillageNPCData | null = null;
  public isDialogOpen: boolean = false;
  private dialogOpenTime: number = 0;

  // Riddle Unlock State
  public isEldoriaUnlocked: boolean = false;
  public isStonewatchUnlocked: boolean = false;
  public onSolveRiddle?: (riddleId: 'ELDORIA' | 'STONEWATCH') => void;
  public onOpenMarket?: () => void;

  // Saved active modal button hitboxes for pixel-perfect touch sync & no overlapping
  private closeBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private actionBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private marketBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private riddleOptRects: { x: number; y: number; w: number; h: number }[] = [];

  // Village NPCs & Market Shops
  public npcs: VillageNPCData[] = [];
  public marketShops: MarketShopLocation[] = [];

  constructor(questManager: QuestManager) {
    this.questManager = questManager;
    this.initNPCs();
    this.initMarketShops();
  }

  private initMarketShops(): void {
    const ts = CONSTANTS.TILE_SIZE;
    this.marketShops = [
      {
        id: 'GENERAL',
        name: 'Toko Serba Ada Saudagar Marco',
        merchantName: 'Saudagar Marco',
        icon: '🛒',
        bannerColor: '#dc2626',
        accentColor: '#facc15',
        x: 62 * ts + 28,
        y: 44.5 * ts + 20,
        prompt: '[A] Belanja di Toko Serba Ada Marco 🛒'
      },
      {
        id: 'FOOD',
        name: 'Kedai Kuliner Chef Gaston',
        merchantName: 'Chef Gaston',
        icon: '🍲',
        bannerColor: '#ea580c',
        accentColor: '#fb923c',
        x: 68 * ts + 28,
        y: 44.5 * ts + 20,
        prompt: '[A] Masuk Kedai Kuliner Chef Gaston 🍲'
      },
      {
        id: 'ARCANE',
        name: 'Paviliun Arkana Sorceress Luna',
        merchantName: 'Sorceress Luna',
        icon: '🔮',
        bannerColor: '#9333ea',
        accentColor: '#c084fc',
        x: 74 * ts + 28,
        y: 44.5 * ts + 20,
        prompt: '[A] Kunjungi Paviliun Arkana Luna 🔮'
      },
      {
        id: 'ARMORY',
        name: 'Kios Persenjataan Gareth',
        merchantName: 'Pengrajin Gareth',
        icon: '⚔️',
        bannerColor: '#475569',
        accentColor: '#94a3b8',
        x: 62 * ts + 28,
        y: 53.5 * ts + 20,
        prompt: '[A] Belanja di Kios Senjata Gareth ⚔️'
      },
      {
        id: 'PET',
        name: 'Suaka & Toko Hewan Penjinak Mia',
        merchantName: 'Penjinak Mia',
        icon: '🐾',
        bannerColor: '#059669',
        accentColor: '#34d399',
        x: 70 * ts + 20,
        y: 53 * ts + 16,
        prompt: '[A] Kunjungi Suaka & Toko Pet Mia 🐾'
      }
    ];
  }

  private initNPCs(): void {
    const ts = CONSTANTS.TILE_SIZE;

    this.npcs = [
      // --- 4 NPC MISI GUILD SERIKAT (Ditempatkan di dalam Balai Serikat Guild) ---
      {
        id: 'galahad',
        name: 'Kapten Galahad',
        title: 'Komandan Patroli Perbatasan',
        roleType: 'QUEST',
        questId: 'Q_FOREST_SLIME',
        x: 48 * ts,
        y: 48 * ts,
        width: 32,
        height: 32,
        hairColor: '#e2e8f0', // Silver knight hair
        outfitColor: '#1e3a8a', // Royal blue & plate armor
        accentColor: '#38bdf8',
        avatarIcon: '🛡️',
        greetingText: 'Salam damai, Petualang! Wilayah lembah butuh pahlawan tangguh.',
        loreText: 'Kawanan Slime Hutan tingkat bawah di pedalaman rimba luar mulai meresahkan pengelana. Kalahkan 4 Slime Hutan demi menjaga ketertiban perbatasan!',
        actionPrompt: '🛡️ [A] Misi Slime',
        isInsideBuilding: true
      },
      {
        id: 'kaelen',
        name: 'Ranger Kaelen',
        title: 'Pemburu Rimba Timur',
        roleType: 'QUEST',
        questId: 'Q_WILD_WOLF',
        x: 53 * ts,
        y: 48 * ts,
        width: 32,
        height: 32,
        hairColor: '#78350f', // Brown hair
        outfitColor: '#166534', // Forest green tunic & bow
        accentColor: '#4ade80',
        avatarIcon: '🏹',
        greetingText: 'Ssshh... Angin utara membawa kabar tentang serigala rimba yang ganas.',
        loreText: 'Kawanan serigala buas tingkat menengah mengintai di hutan lebat sekitar gerbang dungeon. Kalahkan 3 Serigala Rimba untuk membuka jalan para pengelana!',
        actionPrompt: '🏹 [A] Misi Serigala',
        isInsideBuilding: true
      },
      {
        id: 'ignis',
        name: 'Cendekiawan Ignis',
        title: 'Peneliti Misteri Abisal',
        roleType: 'QUEST',
        questId: 'Q_DUNGEON_BAT',
        x: 49 * ts,
        y: 46 * ts + 16,
        width: 32,
        height: 32,
        hairColor: '#9333ea', // Mystic purple hood
        outfitColor: '#4c1d95', // Arcane robes
        accentColor: '#c084fc',
        avatarIcon: '🔮',
        greetingText: 'Goa purba di utara memancarkan gelombang energi magis yang misterius!',
        loreText: 'Dungeon bawah tanah dipenuhi kelelawar gua purba dan kristal abisal. Beranikan dirimu menuruni gua dan basmi 4 Kelelawar Gua!',
        actionPrompt: '🔮 [A] Misi Goa',
        isInsideBuilding: true
      },
      {
        id: 'morgrim',
        name: 'Morgrim sang Jagal',
        title: 'Veteran Pemburu Monster Legendaris',
        roleType: 'QUEST',
        questId: 'Q_BOSS_SLIME',
        x: 52 * ts,
        y: 46 * ts + 16,
        width: 32,
        height: 32,
        hairColor: '#475569', // Grizzled grey hair & beard
        outfitColor: '#7f1d1d', // Heavy bear-fur armor
        accentColor: '#f87171',
        avatarIcon: '⚔️',
        greetingText: 'Hahaha! Hanya mereka yang bernyali baja yang pantas bicara denganku!',
        loreText: 'Di ruang altar terdalam gua bawah tanah, bersemayam Raja Slime Purba berkekuatan dahsyat. Buktikan kekuatanmu dan taklukkan sang raja!',
        actionPrompt: '👑 [A] Misi Raja Goa',
        isInsideBuilding: true
      },

      // --- 5 NPC AMBIENT / PAJANGAN (Warga Pedesaan Oakhaven) ---
      {
        id: 'aldrich',
        name: 'Tetua Aldrich',
        title: 'Kepala Desa Oakhaven',
        roleType: 'AMBIENT',
        x: 43 * ts + 16,
        y: 46 * ts,
        width: 32,
        height: 32,
        hairColor: '#f8fafc', // White elder beard
        outfitColor: '#065f46', // Elder robe
        accentColor: '#34d399',
        avatarIcon: '👴',
        greetingText: 'Kabar agung dari seberang samudra, pahlawan muda!',
        loreText: 'Dunia kita semakin luas! Benua Baru Valoria kini telah terhubung melalui Kapal Samudra di Dermaga Dusun Tirta Kencana (selatan Oakhaven) serta Prasasti Waystone di alun-alun. Di sana terhampar kota pelabuhan Port Valoria, Dusun Oasis Al-Zahra, hingga dusun salju Frostpeak Haven!',
        actionPrompt: '💬 [A] Bicara'
      },
      {
        id: 'lily',
        name: 'Florist Lily',
        title: 'Gadis Kebun Bunga',
        roleType: 'AMBIENT',
        x: 56 * ts,
        y: 46 * ts,
        width: 32,
        height: 32,
        hairColor: '#f59e0b', // Golden blonde hair with straw hat
        outfitColor: '#db2777', // Floral pink dress
        accentColor: '#f472b6',
        avatarIcon: '🌻',
        greetingText: 'Halo petualang! Apakah kamu mencium semerbak mawar ini?',
        loreText: 'Bunga matahari dan mawar di kebun desa mekar indah karena berkah air mancur suci serikat. Semoga harimu menyenangkan dan penuh keberuntungan!',
        actionPrompt: '🌻 [A] Sapa Lily',
        isInsideBuilding: true
      },
      {
        id: 'bucky',
        name: 'Penyair Bucky',
        title: 'Petualang Santai di Bangku',
        roleType: 'AMBIENT',
        x: 52 * ts + 6,
        y: 53 * ts + 8,
        width: 32,
        height: 32,
        hairColor: '#b45309', // Orange-brown bard cap
        outfitColor: '#d97706', // Stylish vest
        accentColor: '#fde047',
        avatarIcon: '🪕',
        greetingText: 'Tra-la-la~ Pedang boleh tajam, tapi istirahat itu wajib, kawan!',
        loreText: 'Setelah menantang dungeon kemarin lusa, duduk santai di bangku taman dekat air mancur sambil menikmati teh hangat adalah surga dunia sejati!',
        actionPrompt: '🪕 [A] Ngobrol'
      },
      {
        id: 'rolf',
        name: 'Pengawal Rolf',
        title: 'Penjaga Gerbang Selatan',
        roleType: 'AMBIENT',
        x: 46 * ts + 16,
        y: 56 * ts + 6,
        width: 32,
        height: 32,
        hairColor: '#334155', // Steel kettle helm
        outfitColor: '#475569', // Iron chainmail
        accentColor: '#cbd5e1',
        avatarIcon: '💂',
        greetingText: 'Berhenti sejenak, kawan! Jalur Gerbang Selatan mengarah ke Dermaga Samudra.',
        loreText: 'Jika engkau berjalan lurus ke arah selatan melewati hutan cemara, engkau akan tiba di Dusun Nelayan Tirta Kencana. Di sana telah berlabuh Kapal Ekspedisi Samudra siap mengantarmu berlayar ke Benua Baru Valoria!',
        actionPrompt: '💂 [A] Tanya Rolf'
      },
      {
        id: 'mimi',
        name: 'Mimi si Kucing',
        title: 'Kucing Belang Penjaga Air Mancur',
        roleType: 'AMBIENT',
        x: 51 * ts + 10,
        y: 52 * ts + 6,
        width: 24,
        height: 24,
        hairColor: '#ea580c', // Orange calico
        outfitColor: '#fed7aa',
        accentColor: '#fbbf24',
        avatarIcon: '🐾',
        greetingText: 'Nyaa~ Meoowww! 🐾',
        loreText: '(Mimi mendengkur manja berputar-putar di kakimu, lalu mengusapkan pipi lembutnya dengan hangat)',
        actionPrompt: '🐱 [A] Belai Kucing',
        isCat: true
      },

      // --- NPC DESA ELDORIA (DESA PERI HUTAN KUNO) ---
      {
        id: 'elder_sylas',
        name: 'Elder Sylas',
        title: 'Tetua Roh Hutan Eldoria',
        roleType: 'RIDDLE',
        riddleId: 'ELDORIA',
        x: 21 * ts,
        y: 17 * ts,
        width: 32,
        height: 32,
        hairColor: '#f8fafc',
        outfitColor: '#047857',
        accentColor: '#34d399',
        avatarIcon: '🧝‍♂️',
        greetingText: 'Salam damai dalam keheningan pohon purba, Petualang muda.',
        loreText: 'Kuil Roh Hutan di tebing utara kami terkunci oleh mantra segel leluhur. Jawablah teka-teki kuno untuk membuktikan kebijaksanaanmu dan membuka pintu kuil!',
        actionPrompt: '🧝‍♂️ [A] Teka-Teki Kuil',
        isInsideBuilding: true
      },
      {
        id: 'aria_herbalist',
        name: 'Aria sang Herbalis',
        title: 'Ahli Ramuan Peri Rimba',
        roleType: 'AMBIENT',
        x: 25 * ts,
        y: 20 * ts,
        width: 32,
        height: 32,
        hairColor: '#a7f3d0',
        outfitColor: '#065f46',
        accentColor: '#4ade80',
        avatarIcon: '🍃',
        greetingText: 'Aroma bunga mistis hutan Eldoria sangat menyegarkan pikiran, bukan?',
        loreText: 'Tanah Eldoria diberkati oleh roh alam semesta. Bunga mistis yang tumbuh di sini adalah bahan terbaik untuk ramuan penyembuh luka.',
        actionPrompt: '🍃 [A] Sapa Aria',
        isInsideBuilding: true
      },

      // --- NPC DESA STONEWATCH (DESA BENTENG TAMBANG KURCACI) ---
      {
        id: 'kapten_borin',
        name: 'Kapten Borin',
        title: 'Kepala Tambang Stonewatch',
        roleType: 'RIDDLE',
        riddleId: 'STONEWATCH',
        x: 84 * ts,
        y: 64 * ts,
        width: 32,
        height: 32,
        hairColor: '#b45309',
        outfitColor: '#78350f',
        accentColor: '#f59e0b',
        avatarIcon: '⛏️',
        greetingText: 'Klang! Kling! Selamat datang di Benteng Tambang Stonewatch!',
        loreText: 'Tambang Terkutuk di tebing utara terkunci oleh mekanisme sandi batu aksara kurcaci. Pecahkan teka-teki nenek moyang tambang jika kau berani memasukinya!',
        actionPrompt: '⛏️ [A] Teka-Teki Tambang',
        isInsideBuilding: true
      },
      {
        id: 'grimm_miner',
        name: 'Grimm si Pelebur Besi',
        title: 'Master Pandai Besi Tambang',
        roleType: 'AMBIENT',
        x: 80 * ts,
        y: 63 * ts,
        width: 32,
        height: 32,
        hairColor: '#64748b',
        outfitColor: '#334155',
        accentColor: '#94a3b8',
        avatarIcon: '⚒️',
        greetingText: 'Panasnya tungku peleburan ini membakar bijih mentah menjadi baja perkasa!',
        loreText: 'Di kedalaman tambang terkutuk terdapat bijih besi gelap langka dan kristal obsidian abisal. Hanya senjata bertempa baja yang sanggup bertahan!',
        actionPrompt: '⚒️ [A] Sapa Grimm',
        isInsideBuilding: true
      },

      // --- NPC LAPANGAN LATIHAN DESA SERENA ---
      {
        id: 'leon_trainer',
        name: 'Master Leon',
        title: 'Instruktur Arena Latihan',
        roleType: 'AMBIENT',
        x: 41 * ts,
        y: 54 * ts,
        width: 32,
        height: 32,
        hairColor: '#dc2626',
        outfitColor: '#991b1b',
        accentColor: '#f87171',
        avatarIcon: '🥊',
        greetingText: 'Ayunkan senjatamu tanpa ragu! Latihan keras adalah kunci kemenangan!',
        loreText: 'Silakan gunakan boneka latihan kayu di lapangan pasir ini untuk menguji kombo serangan dan skill peranmu sebelum terjun ke dungeon!',
        actionPrompt: '🥊 [A] Latihan'
      },

      // --- NPC PASAR RAYA OAKHAVEN ---
      {
        id: 'marco_merchant',
        name: 'Pedagang Marco',
        title: 'Saudagar Pasar Raya',
        roleType: 'AMBIENT',
        x: 47.2 * ts + 10,
        y: 48.8 * ts + 6,
        width: 32,
        height: 32,
        hairColor: '#b45309',
        outfitColor: '#15803d',
        accentColor: '#facc15',
        avatarIcon: '🧑‍🌾',
        greetingText: 'Selamat datang di Pasar Raya Oakhaven, petualang terhormat!',
        loreText: 'Kios pasarku menyediakan pasokan dungeon paling komplit: Ramuan HP/MP, Elixir Pemulih Penuh, Gulungan Teleportasi Portal, hingga bahan masakan lezat! Belanjalah dengan uang Val (𝒱) hasil petualanganmu!',
        actionPrompt: '🛒 [A] Belanja di Pasar'
      },

      // --- NPC DUSUN NELAYAN TIRTA KENCANA (PESISIR DANAU AZURE) ---
      {
        id: 'fisherman_aris',
        name: 'Nelayan Aris',
        title: 'Tetua Pesisir Dusun Tirta Kencana',
        roleType: 'AMBIENT',
        x: 33 * ts,
        y: 73 * ts,
        width: 32,
        height: 32,
        hairColor: '#475569',
        outfitColor: '#0284c7',
        accentColor: '#38bdf8',
        avatarIcon: '🎣',
        greetingText: 'Semilir angin Danau Azure membawa kedamaian, bukan? Selamat datang di Tirta Kencana!',
        loreText: 'Dusun kecil kami memasok ikan mas danau dan udang segar ke seluruh penjuru kerajaan. Nikmatilah ketenangan dermaga ini sejenak sebelum kau melanjutkan petualanganmu!',
        actionPrompt: '🎣 [A] Sapa Nelayan Aris'
      },

      // --- NPC DUSUN PERTANIAN AMBERVALE (LEMBAH GANDUM KINCIR ANGIN) ---
      {
        id: 'farmer_bram',
        name: 'Pak Tani Bram',
        title: 'Pengelola Lumbung Dusun Ambervale',
        roleType: 'AMBIENT',
        x: 76 * ts,
        y: 26 * ts,
        width: 32,
        height: 32,
        hairColor: '#b45309',
        outfitColor: '#ca8a04',
        accentColor: '#fde047',
        avatarIcon: '🌾',
        greetingText: 'Selamat datang di Dusun Ambervale! Dengarlah derit kincir angin yang berputar menenangkan!',
        loreText: 'Ladang gandum emas di lembah ini digiling di kincir angin kami menjadi tepung terbaik. Dari sinilah pasokan roti hangat untuk para prajurit dan petualang Serikat berasal!',
        actionPrompt: '🌾 [A] Sapa Pak Bram'
      }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 3.5;
  }

  public isNearAnyNPC(playerCenterX: number, playerCenterY: number): VillageNPCData | null {
    for (const npc of this.npcs) {
      if (npc.isInsideBuilding) continue;
      const cx = npc.x + npc.width / 2;
      const cy = npc.y + npc.height / 2;
      if (Math.hypot(cx - playerCenterX, cy - playerCenterY) < 38) {
        return npc;
      }
    }
    return null;
  }

  public openDialog(npc: VillageNPCData): void {
    this.activeDialogNPC = npc;
    this.isDialogOpen = true;
    this.dialogOpenTime = Date.now();
    AudioEngine.playButtonClick();
  }

  public openDialogById(npcId: string): void {
    const npc = this.npcs.find((n) => n.id === npcId || n.id.startsWith(npcId));
    if (npc) {
      this.openDialog(npc);
    }
  }

  public closeDialog(): void {
    this.activeDialogNPC = null;
    this.isDialogOpen = false;
    this.actionBtnRect = { x: 0, y: 0, w: 0, h: 0 };
    this.marketBtnRect = { x: 0, y: 0, w: 0, h: 0 };
    this.riddleOptRects = [];
  }

  public getNearbyMarketShop(playerCenterX: number, playerCenterY: number): MarketShopLocation | null {
    for (const shop of this.marketShops) {
      if (Math.hypot(shop.x - playerCenterX, shop.y - playerCenterY) < 46) {
        return shop;
      }
    }
    return null;
  }

  public isNearMarketStall(playerCenterX: number, playerCenterY: number): boolean {
    return this.getNearbyMarketShop(playerCenterX, playerCenterY) !== null;
  }

  /**
   * Cek collision terhadap bangunan fisik desa (Rumah, Balai, Kedai, Air Mancur, Distrik Pasar)
   */
  public checkCollision(box: { x: number; y: number; width: number; height: number }): boolean {
    const ts = CONSTANTS.TILE_SIZE;

    // 0. Balai Besar Serikat Petualang Serena (Grand Guild Hall: 50*ts - 24, 47*ts - 8, w: 80, h: 52)
    const gx = 50 * ts - 24;
    const gy = 47 * ts - 8;
    const gw = 80;
    const gh = 52;
    if (box.x < gx + gw && box.x + box.width > gx && box.y < gy + gh && box.y + box.height > gy + 18) {
      // Izinkan melangkah ke pintu tengah (doorWorldX = 50*ts, doorWorldY = 48.5*ts)
      const doorL = 50 * ts - 6;
      const doorR = 50 * ts + 18;
      if (box.x >= doorL && box.x + box.width <= doorR + 12 && box.y >= gy + gh - 16) {
        return false;
      }
      return true;
    }

    // 1. Air Mancur Alun-alun Desa (Center: 50*ts + 16, 52*ts + 16)
    const fx = 49.5 * ts;
    const fy = 51.5 * ts;
    const fw = 42;
    const fh = 42;
    if (box.x < fx + fw && box.x + box.width > fx && box.y < fy + fh && box.y + box.height > fy) {
      return true;
    }

    // 2. Balai Desa / Rumah Kakek Aldrich (Barat Laut: 41.5*ts, 43*ts)
    const h1x = 41.5 * ts;
    const h1y = 43 * ts;
    const h1w = 74;
    const h1h = 64;
    if (box.x < h1x + h1w && box.x + box.width > h1x && box.y < h1y + h1h && box.y + box.height > h1y + 24) {
      return true;
    }

    // 3. Toko Bunga Lily / Apothecary Inn (Timur Laut: 56*ts, 43*ts)
    const h2x = 56 * ts;
    const h2y = 43 * ts;
    const h2w = 74;
    const h2h = 64;
    if (box.x < h2x + h2w && box.x + box.width > h2x && box.y < h2y + h2h && box.y + box.height > h2y + 24) {
      const doorL = 57 * ts - 6;
      const doorR = 57 * ts + 18;
      if (box.x >= doorL && box.x + box.width <= doorR + 12 && box.y >= h2y + h2h - 16) {
        return false;
      }
      return true;
    }

    // 3.2 Bank Kerajaan Val (Utara Alun-Alun Barat: 44.8*ts, 41.5*ts, Pintu di 46*ts, 44*ts)
    const bkX = 44.8 * ts;
    const bkY = 41.5 * ts;
    const bkW = 78;
    const bkH = 64;
    if (box.x < bkX + bkW && box.x + box.width > bkX && box.y < bkY + bkH && box.y + box.height > bkY + 22) {
      const doorL = 46 * ts - 8;
      const doorR = 46 * ts + 16;
      if (box.x >= doorL && box.x + box.width <= doorR + 12 && box.y >= bkY + bkH - 16) {
        return false;
      }
      return true;
    }

    // 3.5 Bengkel Pandai Besi Brokk (Barat Daya Balai: 44.8*ts, 47.5*ts)
    const bsX = 44.8 * ts;
    const bsY = 47.5 * ts;
    const bsW = 76;
    const bsH = 64;
    if (box.x < bsX + bsW && box.x + box.width > bsX && box.y < bsY + bsH && box.y + box.height > bsY + 22) {
      // Izinkan lewat di depan pintu masuk (tengah bawah) agar bisa melangkah masuk ke pintu
      const doorLeft = bsX + bsW / 2 - 12;
      const doorRight = bsX + bsW / 2 + 12;
      if (box.x >= doorLeft && box.x + box.width <= doorRight + 16 && box.y >= bsY + bsH - 14) {
        return false;
      }
      return true;
    }

    // 4. Kedai & Dapur Petualang Gaston (Tenggara: 56*ts, 51*ts)
    const h3x = 56 * ts;
    const h3y = 51 * ts;
    const h3w = 78;
    const h3h = 66;
    if (box.x < h3x + h3w && box.x + box.width > h3x && box.y < h3y + h3h && box.y + box.height > h3y + 24) {
      const doorL = 57 * ts - 6;
      const doorR = 57 * ts + 18;
      if (box.x >= doorL && box.x + box.width <= doorR + 12 && box.y >= h3y + h3h - 16) {
        return false;
      }
      return true;
    }

    // ========================================================
    // --- DISTRIK PASAR RAYA OAKHAVEN (GRAND BAZAAR DISTRICT) ---
    // ========================================================
    // A. Gerbang Utama Pasar (Pilar Utara & Pilar Selatan di x=59.5*ts)
    const gArchX = 59.5 * ts;
    if (box.x < gArchX + 10 && box.x + box.width > gArchX - 2 && box.y < 48 * ts && box.y + box.height > 46.5 * ts) return true;
    if (box.x < gArchX + 10 && box.x + box.width > gArchX - 2 && box.y < 54 * ts && box.y + box.height > 52.5 * ts) return true;

    // B. Baris Toko Sisi Utara (y=44.5*ts, h=30)
    // 1. Toko Serba Ada Marco (x: 62*ts, y: 44.5*ts, w: 58)
    const mStallX = 62 * ts;
    const mStallY = 44.5 * ts;
    if (box.x < mStallX + 58 && box.x + box.width > mStallX && box.y < mStallY + 30 && box.y + box.height > mStallY + 12) return true;

    // 2. Kedai Kuliner Gaston (x: 68*ts, y: 44.5*ts, w: 62)
    const gStallX = 68 * ts;
    const gStallY = 44.5 * ts;
    if (box.x < gStallX + 62 && box.x + box.width > gStallX && box.y < gStallY + 30 && box.y + box.height > gStallY + 12) return true;

    // 3. Paviliun Arkana Luna (x: 74*ts, y: 44.5*ts, w: 58)
    const lStallX = 74 * ts;
    const lStallY = 44.5 * ts;
    if (box.x < lStallX + 58 && box.x + box.width > lStallX && box.y < lStallY + 30 && box.y + box.height > lStallY + 12) return true;

    // C. Baris Toko Sisi Selatan (y=53.5*ts)
    // 4. Kios Persenjataan Gareth (x: 62*ts, y: 53.5*ts, w: 58, h: 30)
    const gaStallX = 62 * ts;
    const gaStallY = 53.5 * ts;
    if (box.x < gaStallX + 58 && box.x + box.width > gaStallX && box.y < gaStallY + 30 && box.y + box.height > gaStallY + 12) return true;

    // 5. Suaka Satwa & Paddock Mia (x: 68*ts..75*ts, y: 53*ts..56.5*ts)
    // Pagar Kiri Paddock
    if (box.x < 68 * ts + 6 && box.x + box.width > 68 * ts && box.y < 56.5 * ts && box.y + box.height > 53 * ts) return true;
    // Pagar Kanan Paddock
    if (box.x < 75 * ts + 6 && box.x + box.width > 75 * ts && box.y < 56.5 * ts && box.y + box.height > 53 * ts) return true;
    // Pagar Bawah Paddock
    if (box.x < 75 * ts && box.x + box.width > 68 * ts && box.y < 56.5 * ts + 6 && box.y + box.height > 56.5 * ts) return true;
    // Pagar Atas Paddock (kecuali gerbang loket Mia di 69.5*ts..71.5*ts)
    if (box.x < 69.5 * ts && box.x + box.width > 68 * ts && box.y < 53.5 * ts && box.y + box.height > 53 * ts) return true;
    if (box.x < 75 * ts && box.x + box.width > 71.5 * ts && box.y < 53.5 * ts && box.y + box.height > 53 * ts) return true;

    // 5. Pagar Kayu Pembatas Desa Serena
    const f1x = 45 * ts;
    const f1y = 42 * ts;
    if (box.x < f1x + 32 && box.x + box.width > f1x && box.y < f1y + 8 && box.y + box.height > f1y) return true;

    // --- DESA ELDORIA ---
    // 6. Paviliun Suci Pohon Peri Eldoria (x: 19*ts, y: 15*ts, w: 72, h: 52)
    const epX = 19 * ts;
    const epY = 15 * ts;
    if (box.x < epX + 72 && box.x + box.width > epX && box.y < epY + 52 && box.y + box.height > epY + 18) return true;

    // 7. Meja Herbalis Aria (x: 25*ts, y: 19*ts, w: 32, h: 28)
    const ehX = 25 * ts;
    const ehY = 19 * ts;
    if (box.x < ehX + 32 && box.x + box.width > ehX && box.y < ehY + 28 && box.y + box.height > ehY + 8) return true;

    // --- DESA STONEWATCH ---
    // 8. Benteng Granit Kurcaci Stonewatch (x: 82.5*ts, y: 61*ts, w: 80, h: 56)
    const sbX = 82.5 * ts;
    const sbY = 61 * ts;
    if (box.x < sbX + 80 && box.x + box.width > sbX && box.y < sbY + 56 && box.y + box.height > sbY + 20) return true;

    // 9. Tungku Peleburan Raksasa (x: 79*ts, y: 60*ts, w: 38, h: 36)
    const sfX = 79 * ts;
    const sfY = 60 * ts;
    if (box.x < sfX + 38 && box.x + box.width > sfX && box.y < sfY + 36 && box.y + box.height > sfY + 12) return true;

    // --- DUSUN NELAYAN TIRTA KENCANA ---
    // 10. Pondok Nelayan (x: 31*ts, y: 70*ts, w: 76, h: 58)
    const fnX = 31 * ts;
    const fnY = 70 * ts;
    if (box.x < fnX + 76 && box.x + box.width > fnX && box.y < fnY + 58 && box.y + box.height > fnY + 20) return true;

    // 11. Rak Pengering Ikan Asin (x: 35.5*ts, y: 71.5*ts, w: 32, h: 22)
    const frX = 35.5 * ts;
    const frY = 71.5 * ts;
    if (box.x < frX + 32 && box.x + box.width > frX && box.y < frY + 22 && box.y + box.height > frY + 6) return true;

    // --- DUSUN PERTANIAN AMBERVALE ---
    // 12. Menara Kincir Angin Ambervale (x: 73*ts, y: 22*ts, w: 60, h: 64)
    const wmX = 73 * ts;
    const wmY = 22 * ts;
    if (box.x < wmX + 60 && box.x + box.width > wmX && box.y < wmY + 64 && box.y + box.height > wmY + 22) return true;

    // 13. Lumbung Gandum Ambervale (x: 77.5*ts, y: 26*ts, w: 78, h: 60)
    const agX = 77.5 * ts;
    const agY = 26 * ts;
    if (box.x < agX + 78 && box.x + box.width > agX && box.y < agY + 60 && box.y + box.height > agY + 20) return true;

    // 14. Gerobak Gandum & Tumpukan Jerami (x: 73.5*ts, y: 27.5*ts, w: 34, h: 22)
    const hyX = 73.5 * ts;
    const hyY = 27.5 * ts;
    if (box.x < hyX + 34 && box.x + box.width > hyX && box.y < hyY + 22 && box.y + box.height > hyY + 6) return true;

    return false;
  }

  public getNPCQuest(npc: VillageNPCData) {
    // 1. Prioritas 1: Misi dari NPC ini yang sudah COMPLETED (siap klaim hadiah)
    const completed = this.questManager.quests.find(
      (q) => (q.giver.includes(npc.name) || q.id === npc.questId) && q.status === 'COMPLETED'
    );
    if (completed) return completed;

    // 2. Prioritas 2: Misi dari NPC ini yang AVAILABLE (siap diambil)
    const available = this.questManager.quests.find(
      (q) => (q.giver.includes(npc.name) || q.id === npc.questId) && q.status === 'AVAILABLE'
    );
    if (available) return available;

    // 3. Prioritas 3: Misi yang sedang ACTIVE
    const active = this.questManager.quests.find(
      (q) => (q.giver.includes(npc.name) || q.id === npc.questId) && q.status === 'ACTIVE'
    );
    if (active) return active;

    // 4. Fallback ke questId bawaan
    return this.questManager.quests.find((q) => q.id === npc.questId) || null;
  }

  public handleTouch(
    touchX: number,
    touchY: number,
    _screenWidth: number,
    _screenHeight: number,
    player: Player,
    floatingText: FloatingTextManager
  ): boolean {
    if (!this.isDialogOpen || !this.activeDialogNPC) return false;

    // Prevent immediate accidental clicks upon opening
    if (Date.now() - this.dialogOpenTime < 180) {
      return true;
    }

    // 1. Close Button (X) Hitbox
    const cb = this.closeBtnRect;
    if (touchX >= cb.x && touchX <= cb.x + cb.w && touchY >= cb.y && touchY <= cb.y + cb.h) {
      this.closeDialog();
      AudioEngine.playButtonClick();
      return true;
    }

    // 2. Action Button Hitbox (Quest, Riddle Unlocked, or Ambient)
    const ab = this.actionBtnRect;
    const isActionHit = ab.w > 0 && touchX >= ab.x - 4 && touchX <= ab.x + ab.w + 4 && touchY >= ab.y - 4 && touchY <= ab.y + ab.h + 4;

    if (this.activeDialogNPC.roleType === 'QUEST') {
      if (isActionHit) {
        const q = this.getNPCQuest(this.activeDialogNPC);
        if (q) {
          if (q.status === 'AVAILABLE') {
            this.questManager.acceptQuest(q.id);
            floatingText.spawn(player.x + 10, player.y - 20, `📜 Misi Diterima: ${q.title}!`, '#38bdf8', 3.0);
            this.closeDialog();
            return true;
          } else if (q.status === 'COMPLETED') {
            this.questManager.turnInQuest(q.id, player, floatingText);
            this.closeDialog();
            return true;
          } else if (q.status === 'ACTIVE' || q.status === 'TURNED_IN') {
            this.closeDialog();
            return true;
          }
        }
      }
    } else if (this.activeDialogNPC.roleType === 'RIDDLE' && this.activeDialogNPC.riddleId) {
      const isAlreadyUnlocked =
        (this.activeDialogNPC.riddleId === 'ELDORIA' && this.isEldoriaUnlocked) ||
        (this.activeDialogNPC.riddleId === 'STONEWATCH' && this.isStonewatchUnlocked);

      if (isAlreadyUnlocked) {
        if (isActionHit) {
          this.closeDialog();
          AudioEngine.playButtonClick();
          return true;
        }
      } else {
        // Cek 3 pilihan riddle dengan koordinat presisi
        for (let i = 0; i < this.riddleOptRects.length; i++) {
          const rect = this.riddleOptRects[i];
          if (touchX >= rect.x - 2 && touchX <= rect.x + rect.w + 2 && touchY >= rect.y - 2 && touchY <= rect.y + rect.h + 2) {
            if (i === 0) {
              // Jawaban Benar (Pilihan A)
              AudioEngine.playLevelUp();
              if (this.activeDialogNPC.riddleId === 'ELDORIA') {
                this.isEldoriaUnlocked = true;
                floatingText.spawn(player.x + 10, player.y - 24, '🌿 TEKA-TEKI BENAR! Pintu Kuil Hutan Terbuka!', '#34d399', 3.5);
              } else {
                this.isStonewatchUnlocked = true;
                floatingText.spawn(player.x + 10, player.y - 24, '⛏️ TEKA-TEKI BENAR! Gerbang Tambang Terbuka!', '#f59e0b', 3.5);
              }
              if (this.onSolveRiddle) {
                this.onSolveRiddle(this.activeDialogNPC.riddleId);
              }
              this.closeDialog();
              return true;
            } else {
              // Jawaban Salah
              AudioEngine.playHit(false);
              floatingText.spawn(player.x + 10, player.y - 20, '❌ Kurang tepat! Renungkan kembali petunjuknya.', '#f87171', 2.0);
              return true;
            }
          }
        }
      }
    } else {
      // Ambient NPC: Button [Mengerti / Tutup] or Marco [Buka Pasar]
      if (this.activeDialogNPC.id === 'marco_merchant') {
        const mb = this.marketBtnRect;
        if (mb.w > 0 && touchX >= mb.x - 4 && touchX <= mb.x + mb.w + 4 && touchY >= mb.y - 4 && touchY <= mb.y + mb.h + 4) {
          this.closeDialog();
          AudioEngine.playButtonClick();
          if (this.onOpenMarket) {
            this.onOpenMarket();
          }
          return true;
        }
      }

      if (isActionHit) {
        this.closeDialog();
        AudioEngine.playButtonClick();
        return true;
      }
    }

    // Tap outside modal box to close
    return true;
  }

  /**
   * Render seluruh dekorasi bangunan pedesaan khusus & arsitektur Balai Serikat Guild
   */
  public renderEnvironment(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number, isSuppressed: boolean = false): void {
    const ts = CONSTANTS.TILE_SIZE;
    ctx.save();

    // 1. ARSITEKTUR BALAI BESAR SERIKAT GUILD (Tepat di tengah desa: 50*ts, 48*ts)
    const gx = 50 * ts - 24;
    const gy = 47 * ts - 8;
    const gw = 80;
    const gh = 52;

    // Balai Besar Serikat Petualang Serena (Grand Guild Hall)
    this.drawGuildHall(ctx, gx, gy, gw, gh);

    // Papan Pengumuman Misi Serikat (Notice Board) di kanan
    const nbX = 53 * ts + 18;
    const nbY = 48 * ts + 4;
    this.drawNoticeBoardStructure(ctx, nbX, nbY);

    // 2. AIR MANCUR ALUN-ALUN PUSAT DESA (Central Village Fountain: 50*ts, 52*ts)
    const fx = 50 * ts + 16;
    const fy = 52 * ts + 16;

    // Stone Cobblestone Base Ring
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(fx, fy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Outer Stone Basin Rim
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(fx, fy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling Blue Pool Water
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(fx, fy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Animated Fountain Ripples
    const wave = Math.sin(this.animTimer) * 2;
    ctx.fillStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.beginPath();
    ctx.arc(fx, fy, 10 + wave, 0, Math.PI * 2);
    ctx.stroke();

    // Fountain Center Spire & Spray
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx - 1, fy - 6 - Math.abs(wave), 2, 4);

    // 3. BALAI DESA / RUMAH TETUA ALDRICH (Barat Laut: 41.5*ts, 43*ts)
    const h1x = 41.5 * ts;
    const h1y = 43 * ts;
    this.drawCottage(ctx, h1x, h1y, 74, 64, '#991b1b', '#b45309', 'Balai Desa Aldrich');

    // 3.2 BANK KERAJAAN OAKHAVEN (Utara Alun-Alun Barat: 44.8*ts, 41.5*ts, Pintu Masuk di 46*ts, 44*ts)
    const bkX = 44.8 * ts;
    const bkY = 41.5 * ts;
    this.drawBankBuilding(ctx, bkX, bkY, 78, 64);

    // 3.5 BENGKEL PANDAI BESI BROKK (Barat Daya Balai: 44.8*ts, 47.5*ts, Pintu Masuk di 46*ts, 49*ts)
    const bsX = 44.8 * ts;
    const bsY = 47.5 * ts;
    this.drawBlacksmithWorkshop(ctx, bsX, bsY, 76, 64);

    // 3.8 KAWASAN DISTRIK PASAR RAYA OAKHAVEN (GRAND BAZAAR)
    this.drawGrandBazaarDistrict(ctx);

    // 4. TOKO BUNGA LILY (Timur Laut: 56*ts, 43*ts)
    const h2x = 56 * ts;
    const h2y = 43 * ts;
    this.drawCottage(ctx, h2x, h2y, 74, 64, '#15803d', '#d97706', 'Toko Bunga Lily');

    // 5. KEDAI & DAPUR KULINER PETUALANG (Tenggara: 56*ts, 51*ts)
    const h3x = 56 * ts;
    const h3y = 51 * ts;
    this.drawCottage(ctx, h3x, h3y, 78, 66, '#78350f', '#ca8a04', 'Dapur & Kedai Petualang');

    // Bangku santai taman di tepi air mancur tempat Bucky duduk
    ctx.fillStyle = '#92400e';
    ctx.fillRect(52 * ts, 53 * ts + 14, 24, 7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(52 * ts + 2, 53 * ts + 21, 3, 5);
    ctx.fillRect(52 * ts + 19, 53 * ts + 21, 3, 5);

    // 6. GERBANG SELATAN DESA (South Village Gate: 50*ts, 56*ts)
    const gxGate = 50 * ts - 18;
    const gyGate = 56 * ts - 6;
    this.drawSouthVillageGate(ctx, gxGate, gyGate);

    // 7. LENTERA JALAN ALUN-ALUN (4 Plaza Streetlamps dengan ambient glow)
    const lamps = [
      { x: 47 * ts + 8, y: 46 * ts },
      { x: 53 * ts + 24, y: 46 * ts },
      { x: 47 * ts + 8, y: 54 * ts },
      { x: 53 * ts + 24, y: 54 * ts }
    ];
    for (const l of lamps) {
      this.drawStreetlamp(ctx, l.x, l.y);
    }

    // 8. ARENA LATIHAN PRAJURIT SERENA (Training Grounds: 41*ts, 55*ts)
    const tAx = 41 * ts;
    const tAy = 55 * ts;
    // Sand pit arena border
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tAx - 18, tAy - 12, 70, 48);
    // Training Dummy 1 & 2
    this.drawTrainingDummy(ctx, tAx - 6, tAy + 4);
    this.drawTrainingDummy(ctx, tAx + 32, tAy + 4);

    // 9. RAMBU PENUNJUK ARAH JALAN RAYA (Crossroad Signposts)
    this.drawSignpost(ctx, 45 * ts + 16, 50 * ts - 8, '⬅️ Desa Eldoria (Rimba Peri)');
    this.drawSignpost(ctx, 58 * ts, 49 * ts, '🎪 Distrik Pasar Raya ➡️ | Tambang Stonewatch ➡️');
    this.drawSignpost(ctx, 50 * ts + 16, 44 * ts, '⬆️ Goa Kripta Kuno (Dungeon)');
    this.drawSignpost(ctx, 50 * ts + 16, 58 * ts, '⬇️ Danau Azure | ⬅️ Dusun Nelayan Tirta Kencana');
    this.drawSignpost(ctx, 70 * ts, 43 * ts, '⬆️ Dusun Pertanian Ambervale (Kincir Angin)');

    // 10. ARSITEKTUR DESA ELDORIA (DESA PERI HUTAN KUNO - BARAT LAUT)
    // Paviliun Suci Pohon Eldoria
    const epX = 19 * ts;
    const epY = 15 * ts;
    this.drawCottage(ctx, epX, epY, 74, 56, '#047857', '#065f46', 'Paviliun Roh Eldoria');
    // Meja Ramuan Herbalis Aria
    const ehX = 25 * ts;
    const ehY = 19 * ts;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(ehX, ehY, 26, 16);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(ehX + 4, ehY - 4, 5, 5); // Ramuan Hijau
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(ehX + 12, ehY - 5, 5, 6); // Ramuan Merah
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ehX + 19, ehY - 4, 4, 5); // Ramuan Biru
    // Lentera Peri Eldoria
    this.drawSylvanLantern(ctx, 17 * ts, 18 * ts);
    this.drawSylvanLantern(ctx, 23 * ts, 24 * ts);

    // 11. ARSITEKTUR DESA STONEWATCH (DESA BENTENG TAMBANG KURCACI - TENGGARA)
    // Benteng Granit Stonewatch
    const sbX = 82.5 * ts;
    const sbY = 61 * ts;
    this.drawCottage(ctx, sbX, sbY, 80, 58, '#1e1b4b', '#334155', 'Benteng Tambang Stonewatch');
    // Tungku Peleburan Raksasa (Great Foundry)
    const sfX = 79 * ts;
    const sfY = 60 * ts;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sfX, sfY, 36, 32);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(sfX + 10, sfY + 14, 16, 14); // Api peleburan
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sfX + 14, sfY + 18, 8, 8);
    // Gerobak Tambang di atas rel
    const mcX = 85 * ts;
    const mcY = 64 * ts;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(mcX, mcY + 4, 22, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(mcX + 2, mcY + 2, 18, 6); // Ore contents
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(mcX + 5, mcY + 18, 3, 0, Math.PI * 2);
    ctx.arc(mcX + 17, mcY + 18, 3, 0, Math.PI * 2);
    ctx.fill();
    // Lentera Tambang
    this.drawStreetlamp(ctx, 81 * ts, 65 * ts);
    this.drawStreetlamp(ctx, 88 * ts, 65 * ts);

    // 12. ARSITEKTUR DUSUN NELAYAN TIRTA KENCANA (Barat Daya - Pesisir Danau)
    this.drawLakesideHamlet(ctx);

    // 13. ARSITEKTUR DUSUN PERTANIAN AMBERVALE (Timur Laut - Lembah Gandum)
    this.drawAmbervaleFarmstead(ctx);

    // 14. RENDER SELURUH NPC DESA (Quest, Ambient, & Riddle)
    for (const npc of this.npcs) {
      if (npc.isInsideBuilding) continue;
      this.renderNPC(ctx, npc, playerCenterX, playerCenterY, isSuppressed);
    }

    ctx.restore();
  }

  /**
   * Foreground & Y-sorting Occlusion Layer:
   * Merender tiang, pilar, balok gerbang atas, kanopi toko, dan atap DI DEPAN pemain
   * saat pemain berada di belakang tiang/bangunan atau melintas di bawah gerbang.
   * Ini memastikan pemain melewati BELAKANG tiang, bukan menginjak tiang ("nginjek tiang").
   */
  public renderForegroundEnvironment(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number
  ): void {
    const ts = CONSTANTS.TILE_SIZE;
    const playerFeetY = playerY + playerH;

    ctx.save();

    // 1. GERBANG LENGKUNG DISTRIK PASAR RAYA (Grand Bazaar Archway: 59.5*ts, 49*ts)
    // Saat pemain melintas gerbang atau berada di dekat tiang/balok gerbang:
    const gArchX = 59.5 * ts;
    const gArchTopY = 49 * ts - 2.5 * ts;
    const gArchBotY = 49 * ts + 3.5 * ts;
    if (
      playerX + playerW >= gArchX - 24 &&
      playerX <= gArchX + 24 &&
      playerFeetY >= gArchTopY - 14 &&
      playerY <= gArchBotY + 18
    ) {
      this.drawBazaarArchway(ctx, gArchX, 49 * ts);
    }

    // 2. TALI BENDERA FESTIVAL PASAR (Grand Bazaar Garland Bunting)
    // Menggantung di udara melintasi jalan pasar di atas kepala pemain
    if (playerX >= 60 * ts - 20 && playerX <= 76 * ts + 20 && playerFeetY >= 44 * ts && playerY <= 56 * ts) {
      this.drawBazaarBunting(ctx, 60 * ts, 76 * ts, 45 * ts, 53 * ts);
    }

    // 3. GERBANG SELATAN DESA (South Village Gate: 50*ts - 18, 56*ts - 6)
    const gxGate = 50 * ts - 18;
    const gyGate = 56 * ts - 6;
    if (
      playerX + playerW >= gxGate - 16 &&
      playerX <= gxGate + 70 &&
      playerFeetY >= gyGate - 14 &&
      playerFeetY <= gyGate + 42
    ) {
      this.drawSouthVillageGate(ctx, gxGate, gyGate);
    }

    // 4. BALAI BESAR SERIKAT GUILD (Atap & Kanopi saat pemain melintas di belakang teritisan)
    const gx = 50 * ts - 24;
    const gy = 47 * ts - 8;
    const gw = 80;
    const gh = 52;
    if (
      playerX + playerW >= gx - 16 &&
      playerX <= gx + gw + 16 &&
      playerFeetY >= gy - 10 &&
      playerFeetY <= gy + 24
    ) {
      this.drawGuildRoofOverhang(ctx, gx, gy, gw, gh);
    }

    // 4.1 PAPAN MISI GUILD OAKHAVEN
    const nbX = 53 * ts + 18;
    const nbY = 48 * ts + 4;
    if (
      playerX + playerW >= nbX - 8 &&
      playerX <= nbX + 26 &&
      playerFeetY >= nbY - 10 &&
      playerFeetY <= nbY + 28
    ) {
      this.drawNoticeBoardStructure(ctx, nbX, nbY);
    }

    // 5. TOKO-TOKO PASAR RAYA (Tiang kayu depan, kanopi awning, meja counter & plang)
    // 5.1 Toko Serba Ada Marco (x: 62*ts, y: 44.5*ts, w: 58, h: 32)
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 62 * ts, 44.5 * ts, 58, 34)) {
      this.drawGeneralStoreMarco(ctx, 62 * ts, 44.5 * ts);
    }
    // 5.2 Kedai Kuliner Gaston (x: 68*ts, y: 44.5*ts, w: 62, h: 32)
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 68 * ts, 44.5 * ts, 62, 34)) {
      this.drawFoodTavernGaston(ctx, 68 * ts, 44.5 * ts);
    }
    // 5.3 Paviliun Arkana Luna (x: 74*ts, y: 44.5*ts, w: 58, h: 32)
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 74 * ts, 44.5 * ts, 58, 34)) {
      this.drawArcanePavilionLuna(ctx, 74 * ts, 44.5 * ts);
    }
    // 5.4 Kios Senjata Gareth (x: 62*ts, y: 53.5*ts, w: 58, h: 32)
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 62 * ts, 53.5 * ts, 58, 34)) {
      this.drawArmoryGareth(ctx, 62 * ts, 53.5 * ts);
    }
    // 5.5 Suaka Satwa Mia (x: 68*ts, y: 53*ts)
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 68 * ts, 53 * ts - 10, 7 * ts, 4 * ts)) {
      this.drawPetSanctuaryMia(ctx, 68 * ts, 53 * ts);
    }

    // 6. BANK KERAJAAN VAL (Pilar Marmer Romawi & Pedimen Atas)
    const bkX = 44.8 * ts;
    const bkY = 41.5 * ts;
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, bkX, bkY, 78, 64)) {
      this.drawBankBuilding(ctx, bkX, bkY, 78, 64);
    }

    // 7. BENGKEL PANDAI BESI BROKK (Pilar Sudut Batu, Cerobong & Plang Anvil)
    const bsX = 44.8 * ts;
    const bsY = 47.5 * ts;
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, bsX, bsY, 76, 64)) {
      this.drawBlacksmithWorkshop(ctx, bsX, bsY, 76, 64);
    }

    // 8. RUMAH & BALAI DESA (Aldrich, Lily, Dapur Petualang, Eldoria, Stonewatch, Tirta Kencana, Ambervale)
    const cottages = [
      { x: 41.5 * ts, y: 43 * ts, w: 74, h: 64, r: '#991b1b', wall: '#b45309', name: 'Balai Desa Aldrich' },
      { x: 56 * ts, y: 43 * ts, w: 74, h: 64, r: '#15803d', wall: '#d97706', name: 'Toko Bunga Lily' },
      { x: 56 * ts, y: 51 * ts, w: 78, h: 66, r: '#78350f', wall: '#ca8a04', name: 'Dapur & Kedai Petualang' },
      { x: 19 * ts, y: 15 * ts, w: 74, h: 56, r: '#047857', wall: '#065f46', name: 'Paviliun Roh Eldoria' },
      { x: 82.5 * ts, y: 61 * ts, w: 80, h: 58, r: '#1e1b4b', wall: '#334155', name: 'Benteng Tambang Stonewatch' },
      { x: 31 * ts, y: 70 * ts, w: 76, h: 58, r: '#0369a1', wall: '#78350f', name: 'Pondok Nelayan Tirta Kencana' },
      { x: 77.5 * ts, y: 26 * ts, w: 78, h: 60, r: '#b45309', wall: '#ca8a04', name: 'Lumbung Gandum Ambervale' }
    ];
    for (const c of cottages) {
      if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, c.x, c.y, c.w, c.h)) {
        this.drawCottage(ctx, c.x, c.y, c.w, c.h, c.r, c.wall, c.name);
      }
    }

    // 8.5 KINCIR ANGIN AMBERVALE
    if (this.isPlayerBehindStructure(playerX, playerW, playerFeetY, 73 * ts, 22 * ts, 60, 64)) {
      this.drawWindmill(ctx, 74 * ts, 22 * ts);
    }

    // 9. SELURUH TIANG LENTERA JALAN (Streetlamps)
    const streetlamps = [
      { x: 47 * ts + 8, y: 46 * ts },
      { x: 53 * ts + 24, y: 46 * ts },
      { x: 47 * ts + 8, y: 54 * ts },
      { x: 53 * ts + 24, y: 54 * ts },
      { x: 61 * ts, y: 47.8 * ts },
      { x: 67 * ts, y: 47.8 * ts },
      { x: 73 * ts, y: 47.8 * ts },
      { x: 61 * ts, y: 52.2 * ts },
      { x: 67 * ts, y: 52.2 * ts },
      { x: 81 * ts, y: 65 * ts },
      { x: 88 * ts, y: 65 * ts },
      { x: 30.5 * ts, y: 73 * ts },
      { x: 36.5 * ts, y: 73.5 * ts },
      { x: 73 * ts, y: 26 * ts },
      { x: 81 * ts, y: 26 * ts }
    ];
    for (const l of streetlamps) {
      if (
        playerX + playerW >= l.x - 14 &&
        playerX <= l.x + 14 &&
        playerFeetY >= l.y - 12 &&
        playerFeetY <= l.y + 24
      ) {
        this.drawStreetlamp(ctx, l.x, l.y);
      }
    }

    // 10. RAMBU PENUNJUK JALAN (Signposts)
    const signposts = [
      { x: 45 * ts + 16, y: 50 * ts - 8, text: '⬅️ Desa Eldoria (Rimba Peri)' },
      { x: 58 * ts, y: 49 * ts, text: '🎪 Distrik Pasar Raya ➡️ | Tambang Stonewatch ➡️' },
      { x: 50 * ts + 16, y: 44 * ts, text: '⬆️ Goa Kripta Kuno (Dungeon)' },
      { x: 50 * ts + 16, y: 58 * ts, text: '⬇️ Danau Azure | ⬅️ Dusun Nelayan Tirta Kencana' },
      { x: 70 * ts, y: 43 * ts, text: '⬆️ Dusun Pertanian Ambervale (Kincir Angin)' }
    ];
    for (const s of signposts) {
      if (
        playerX + playerW >= s.x - 70 &&
        playerX <= s.x + 70 &&
        playerFeetY >= s.y - 14 &&
        playerFeetY <= s.y + 20
      ) {
        this.drawSignpost(ctx, s.x, s.y, s.text);
      }
    }

    // 11. LENTERA PERI ELDORIA
    const sylvanLamps = [
      { x: 17 * ts, y: 18 * ts },
      { x: 23 * ts, y: 24 * ts }
    ];
    for (const sl of sylvanLamps) {
      if (
        playerX + playerW >= sl.x &&
        playerX <= sl.x + 24 &&
        playerFeetY >= sl.y - 10 &&
        playerFeetY <= sl.y + 22
      ) {
        this.drawSylvanLantern(ctx, sl.x, sl.y);
      }
    }

    // 12. DUMMY LATIHAN ARENA SERENA
    const tAx = 41 * ts;
    const tAy = 55 * ts;
    for (const dx of [tAx - 6, tAx + 32]) {
      if (
        playerX + playerW >= dx - 10 &&
        playerX <= dx + 24 &&
        playerFeetY >= tAy - 4 &&
        playerFeetY <= tAy + 28
      ) {
        this.drawTrainingDummy(ctx, dx, tAy + 4);
      }
    }

    ctx.restore();
  }

  private isPlayerBehindStructure(
    playerX: number,
    playerW: number,
    playerFeetY: number,
    structX: number,
    structY: number,
    structW: number,
    structH: number
  ): boolean {
    const structBaseY = structY + structH;
    return (
      playerX + playerW >= structX - 12 &&
      playerX <= structX + structW + 12 &&
      playerFeetY >= structY - 14 &&
      playerFeetY <= structBaseY - 14
    );
  }

  /**
   * Render Balai Besar Serikat Petualang Oakhaven (Grand Adventurer Guild Lodge)
   * Bangunan 2 lantai megah berbatu ashlar & kayu mahoni berukir, pintu ganda mahoni bertabur paku kuningan,
   * pilar batu berukir, lentera tembaga bercahaya, jendela timbal berlian, dan atap biru safir berlis emas megah.
   */
  private drawGuildHall(ctx: CanvasRenderingContext2D, gx: number, gy: number, gw: number, gh: number): void {
    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(gx + gw / 2, gy + gh + 1, gw / 2 + 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Teras Kayu Hardwood Serambi Depan
    ctx.fillStyle = '#451a03';
    ctx.fillRect(gx - 4, gy + 16, gw + 8, gh - 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gx - 2, gy + 18, gw + 4, gh - 16);
    // Papan teras lantai
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 0.8;
    for (let py = gy + 22; py < gy + gh; py += 6) {
      ctx.beginPath();
      ctx.moveTo(gx - 2, py);
      ctx.lineTo(gx + gw + 2, py);
      ctx.stroke();
    }

    // 3. Fasad Dinding Bawah (Batu Ashlar Masonry & Balok Kayu Tudor)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gx + 2, gy + 14, gw - 4, gh - 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx + 4, gy + 14, gw - 8, gh - 16);

    // 4. Pintu Utama Ganda Balai Serikat (Grand Double Oak Doors)
    const dw = 22;
    const dh = 26;
    const dx = Math.round(gx + gw / 2 - dw / 2);
    const dy = gy + gh - dh - 2;

    // Bingkai Lengkung Batu Pintu
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(dx - 3, dy - 3, dw + 6, dh + 4, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Daun Pintu Kayu Mahoni
    ctx.fillStyle = '#451a03';
    ctx.fillRect(dx, dy, dw, dh);
    // Garis sambungan pintu kiri dan kanan
    ctx.fillStyle = '#270e02';
    ctx.fillRect(dx + dw / 2 - 0.5, dy, 1, dh);
    // Paku keling emas / besi
    ctx.fillStyle = '#facc15';
    for (const studX of [dx + 3, dx + dw / 2 - 3, dx + dw / 2 + 3, dx + dw - 3]) {
      ctx.fillRect(studX, dy + 5, 1.5, 1.5);
      ctx.fillRect(studX, dy + 13, 1.5, 1.5);
      ctx.fillRect(studX, dy + 21, 1.5, 1.5);
    }
    // Handle cincin kuningan
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(dx + dw / 2 - 3, dy + 14, 1.8, 0, Math.PI * 2);
    ctx.arc(dx + dw / 2 + 3, dy + 14, 1.8, 0, Math.PI * 2);
    ctx.stroke();

    // Ambang Pintu Batu
    ctx.fillStyle = '#64748b';
    ctx.fillRect(dx - 2, dy + dh - 1, dw + 4, 3);

    // 5. Jendela Kaca Timbal Berlian Kiri & Kanan (Diamond Leaded Windows)
    for (const wx of [gx + 10, gx + gw - 22]) {
      const wy = gy + 22;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx - 1, wy - 1, 13, 15);
      ctx.fillStyle = '#facc15'; // Golden interior glow
      ctx.fillRect(wx, wy, 11, 13);
      // Specular sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(wx + 1, wy + 1);
      ctx.lineTo(wx + 6, wy + 1);
      ctx.lineTo(wx + 1, wy + 6);
      ctx.closePath();
      ctx.fill();
      // Kisi timbal
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(wx + 5.5, wy);
      ctx.lineTo(wx + 5.5, wy + 13);
      ctx.moveTo(wx, wy + 6.5);
      ctx.lineTo(wx + 11, wy + 6.5);
      ctx.stroke();
    }

    // 6. Lentera Dinding Tembaga Flanking Entrance (Warm Ambient Lanterns)
    for (const lx of [dx - 8, dx + dw + 5]) {
      const ly = dy + 8;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(lx, ly, 3, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lx - 1, ly - 3, 5, 5);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(lx - 1, ly - 3, 5, 5);
      // Soft radial glow
      const flicker = Math.sin(this.animTimer * 5 + lx) * 1.5;
      const rad = ctx.createRadialGradient(lx + 1.5, ly - 0.5, 1, lx + 1.5, ly - 0.5, 10 + flicker);
      rad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      rad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(lx + 1.5, ly - 0.5, 10 + flicker, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Panji / Bendera Serikat Biru & Emas di Pilar Depan
    for (const bx of [gx + 4, gx + gw - 12]) {
      const by = gy + 17;
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(bx, by, 8, 15);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 8, 15);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bx + 3, by + 4, 2, 7); // Gold center motif
    }

    // 8. Pilar Marmer & Atap Kanopi Balai
    this.drawGuildRoofOverhang(ctx, gx, gy, gw, gh);
  }

  /**
   * Render Bagian Atas / Kanopi & Pilar Balai Serikat (Dipakai untuk Occlusion Layer)
   */
  private drawGuildRoofOverhang(ctx: CanvasRenderingContext2D, gx: number, gy: number, gw: number, gh: number): void {
    const pillY = gy + 14;

    // Pilar Batu Berukir di Sisi Kiri & Kanan
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gx - 3, pillY, 9, gh - 14);
    ctx.fillRect(gx + gw - 6, pillY, 9, gh - 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(gx - 1, pillY, 5, gh - 14);
    ctx.fillRect(gx + gw - 4, pillY, 5, gh - 14);
    // Capital & Base Pilar Emas
    ctx.fillStyle = '#facc15';
    ctx.fillRect(gx - 4, pillY, 11, 3);
    ctx.fillRect(gx + gw - 7, pillY, 11, 3);
    ctx.fillRect(gx - 4, gy + gh - 4, 11, 3);
    ctx.fillRect(gx + gw - 7, gy + gh - 4, 11, 3);

    // Atap Kanopi Bersusun Biru Safir & Lis Emas Kerajaan (Multi-tiered Hip Roof)
    // Tier 1: Atap Utama
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(gx - 8, gy + 18);
    ctx.lineTo(gx + 12, gy + 2);
    ctx.lineTo(gx + gw - 12, gy + 2);
    ctx.lineTo(gx + gw + 8, gy + 18);
    ctx.closePath();
    ctx.fill();

    // Shingle rows highlights on Tier 1
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx - 4, gy + 14);
    ctx.lineTo(gx + gw + 4, gy + 14);
    ctx.moveTo(gx + 2, gy + 8);
    ctx.lineTo(gx + gw - 2, gy + 8);
    ctx.stroke();

    // Tier 2: Pedimen Atas & Puncak Menara Serikat
    ctx.fillStyle = '#172554';
    ctx.beginPath();
    ctx.moveTo(gx + 10, gy + 4);
    ctx.lineTo(gx + gw / 2, gy - 8);
    ctx.lineTo(gx + gw - 10, gy + 4);
    ctx.closePath();
    ctx.fill();

    // Lis Emas Atap
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx - 8, gy + 18);
    ctx.lineTo(gx + 10, gy + 3);
    ctx.lineTo(gx + gw / 2, gy - 8);
    ctx.lineTo(gx + gw - 10, gy + 3);
    ctx.lineTo(gx + gw + 8, gy + 18);
    ctx.stroke();

    // Apex Finial / Guild Crest Star di Puncak
    ctx.fillStyle = '#facc15';
    ctx.fillRect(gx + gw / 2 - 2, gy - 13, 4, 5);
    ctx.beginPath();
    ctx.arc(gx + gw / 2, gy - 13, 3, 0, Math.PI * 2);
    ctx.fill();

    // Bayangan Teritisan Atap (Drop Shadow)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(gx - 4, gy + 18, gw + 8, 3.5);

    // Plang Nama Utama Serikat Guild Oakhaven
    this.drawFittedSignboard(
      ctx,
      gx + gw / 2,
      gy + 17,
      gw - 12,
      12,
      '★ SERIKAT GUILD OAKHAVEN ★',
      '#0f172a',
      '#facc15',
      '#fef08a'
    );
  }

  private drawNoticeBoardStructure(ctx: CanvasRenderingContext2D, nbX: number, nbY: number): void {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(nbX, nbY, 18, 22);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(nbX + 2, nbY + 2, 14, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(nbX + 4, nbY + 4, 4, 5); // Quest paper 1
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(nbX + 9, nbY + 4, 5, 5); // Quest paper 2
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(nbX + 4, nbY + 10, 8, 4); // Boss notice
    ctx.fillStyle = '#451a03';
    ctx.fillRect(nbX + 7, nbY + 16, 4, 10); // Wooden leg
  }

  private drawSouthVillageGate(ctx: CanvasRenderingContext2D, gxGate: number, gyGate: number): void {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gxGate - 6, gyGate, 8, 38);
    ctx.fillRect(gxGate + 54, gyGate, 8, 38);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(gxGate - 6, gyGate, 8, 38);
    ctx.strokeRect(gxGate + 54, gyGate, 8, 38);
    // Arch Beam Signboard
    this.drawFittedSignboard(ctx, gxGate + 28, gyGate, 76, 11, 'GERBANG DESA OAKHAVEN', '#78350f', '#ca8a04', '#fef08a');
  }

  /**
   * Helper untuk merender plang nama / banner toko dengan teks yang pas dan tidak meluap keluar
   */
  private drawFittedSignboard(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    boardW: number,
    boardH: number,
    text: string,
    bgColor: string,
    borderColor: string,
    textColor: string
  ): void {
    ctx.save();
    // 1. Gambar Background Plang / Board
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(centerX - boardW / 2, centerY - boardH / 2, boardW, boardH, 2.5);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Skala Teks agar PAS di dalam boardW dengan padding aman
    const maxTextW = Math.max(10, boardW - 6);
    let fontSize = Math.min(8.0, Math.max(5.0, boardH - 3.5));
    ctx.font = `bold ${fontSize.toFixed(1)}px sans-serif`;
    while (ctx.measureText(text).width > maxTextW && fontSize > 3.0) {
      fontSize -= 0.2;
      ctx.font = `bold ${fontSize.toFixed(1)}px sans-serif`;
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const safeText = CanvasText.truncate(ctx, text, maxTextW);
    ctx.fillText(safeText, centerX, centerY + 0.3);
    ctx.restore();
  }

  private drawTrainingDummy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Wooden post base
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 5, y + 14, 4, 12);
    // Straw target torso
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.roundRect(x, y + 4, 14, 14, 4);
    ctx.fill();
    // Target bullseye
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 7, y + 11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Straw Head
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(x + 7, y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSignpost(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.save();
    ctx.font = 'bold 5px sans-serif';
    const textW = ctx.measureText(text).width;
    const boardW = Math.max(76, textW + 14);

    // Post
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 2, y, 4, 18);

    // Board
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(x - boardW / 2, y - 8, boardW, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 2);
    ctx.restore();
  }

  private drawSylvanLantern(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Wooden curved pole
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 20);
    ctx.lineTo(x + 8, y + 4);
    ctx.lineTo(x + 14, y + 6);
    ctx.stroke();

    // Fairy orb glow
    const pulse = Math.sin(this.animTimer * 4 + x) * 1.5;
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(x + 14, y + 10, 3 + pulse * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 14, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render Dusun Nelayan Tirta Kencana (Pesisir Danau Azure Barat Daya)
   * Dilengkapi Pondok Nelayan, Dermaga Kayu, Perahu Dayung Terapung Berayun,
   * Rak Ikan Asin Kering, Jaring Nelayan, & Pelampung.
   */
  private drawLakesideHamlet(ctx: CanvasRenderingContext2D): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. PONDOK NELAYAN TRADISIONAL (31*ts, 70*ts)
    const hx = 31 * ts;
    const hy = 70 * ts;
    this.drawCottage(ctx, hx, hy, 76, 58, '#0369a1', '#78350f', 'Pondok Nelayan Tirta Kencana');

    // Ornamen Pelampung Laut di Dinding Pondok
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(hx + 18, hy + 38, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(hx + 18, hy + 38, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 2. DERMAGA KAYU MENJOROK KE AIR DANAU (Wooden Pier: x: 32*ts .. 36*ts, y: 74*ts .. 76.5*ts)
    const pierX = 32 * ts;
    const pierY = 74.2 * ts;
    const pierW = 4 * ts;
    const pierH = 26;

    // Tiang Kayu Penyangga Dermaga Menancap ke Air
    ctx.fillStyle = '#3b1d06';
    const pilings = [pierX + 6, pierX + pierW / 2, pierX + pierW - 6];
    for (const px of pilings) {
      ctx.fillRect(px - 3, pierY + 12, 6, 18);
      // Efek air mengitari tiang
      ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
      ctx.fillRect(px - 5, pierY + 28, 10, 2);
      ctx.fillStyle = '#3b1d06';
    }

    // Papan Lantai Kayu Dermaga
    ctx.fillStyle = '#78350f';
    ctx.fillRect(pierX, pierY, pierW, pierH);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    for (let px = pierX + 8; px < pierX + pierW; px += 8) {
      ctx.beginPath();
      ctx.moveTo(px, pierY);
      ctx.lineTo(px, pierY + pierH);
      ctx.stroke();
    }
    // Lis tepi dermaga
    ctx.fillStyle = '#92400e';
    ctx.fillRect(pierX, pierY, pierW, 3);
    ctx.fillRect(pierX, pierY + pierH - 3, pierW, 3);

    // Tali & Tiang Tambatan Perahu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pierX + 4, pierY + pierH - 7, 5, 8);
    ctx.fillRect(pierX + pierW - 8, pierY + pierH - 7, 5, 8);

    // 3. PERAHU DAYUNG TRADISIONAL BERAYUN DI AIR
    const boatX = pierX + pierW + 4;
    const boatBaseY = pierY + 6;
    const boatBobY = Math.sin(this.animTimer * 1.5) * 2.2;
    const by = boatBaseY + boatBobY;

    // Riak Air di Bawah Perahu
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(boatX + 16, by + 16, 20, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Lambung Perahu Kayu
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(boatX, by + 4);
    ctx.lineTo(boatX + 30, by + 4);
    ctx.lineTo(boatX + 26, by + 14);
    ctx.lineTo(boatX + 4, by + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Bagian Dalam Perahu
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(boatX + 3, by + 5);
    ctx.lineTo(boatX + 27, by + 5);
    ctx.lineTo(boatX + 24, by + 11);
    ctx.lineTo(boatX + 6, by + 11);
    ctx.closePath();
    ctx.fill();

    // Bangku Pendayung
    ctx.fillStyle = '#92400e';
    ctx.fillRect(boatX + 12, by + 6, 6, 4);

    // Dayung Kayu Menyilang
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(boatX + 14, by + 7);
    ctx.lineTo(boatX + 26, by + 18);
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(boatX + 24, by + 16, 4, 3);

    // Tali Tambat Perahu ke Dermaga
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boatX + 4, by + 6);
    ctx.lineTo(pierX + pierW - 6, pierY + pierH - 4);
    ctx.stroke();

    // 4. RAK PENJEMURAN IKAN ASIN (x: 35.5*ts, y: 71.5*ts)
    const rx = 35.5 * ts;
    const ry = 71.5 * ts;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, ry + 18);
    ctx.lineTo(rx + 6, ry);
    ctx.lineTo(rx + 12, ry + 18);
    ctx.moveTo(rx + 24, ry + 18);
    ctx.lineTo(rx + 30, ry);
    ctx.lineTo(rx + 36, ry + 18);
    ctx.moveTo(rx + 6, ry + 4);
    ctx.lineTo(rx + 30, ry + 4);
    ctx.moveTo(rx + 6, ry + 10);
    ctx.lineTo(rx + 30, ry + 10);
    ctx.stroke();

    // Ikan Asin Bergantung
    const fishes = [rx + 10, rx + 15, rx + 20, rx + 25];
    for (const fx of fishes) {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(fx, ry + 6, 1.8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(fx, ry + 9.5);
      ctx.lineTo(fx - 2, ry + 12);
      ctx.lineTo(fx + 2, ry + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Keranjang Anyaman Rotan Ikan
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.roundRect(rx + 28, ry + 12, 10, 8, 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(rx + 29, ry + 10, 8, 3);

    // 5. LENTERA DERMAGA
    this.drawStreetlamp(ctx, 30.5 * ts, 73 * ts);
    this.drawStreetlamp(ctx, 36.5 * ts, 73.5 * ts);

    // 6. PAPAN PETUNJUK DUSUN
    this.drawSignpost(ctx, 33 * ts, 69 * ts, '🐟 Dusun Nelayan Tirta Kencana');
  }

  /**
   * Render Dusun Pertanian Ambervale (Lembah Gandum Kincir Angin Timur Laut)
   * Dilengkapi Kincir Angin Megah dengan 4 Baling-Baling Berputar Halus,
   * Lumbung Gandum Pedesaan, Tumpukan Jerami Emas, Gerobak Gandum, & Pagar Kayu.
   */
  private drawAmbervaleFarmstead(ctx: CanvasRenderingContext2D): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. KINCIR ANGIN MEGAH BERPUTAR (74*ts, 22*ts)
    this.drawWindmill(ctx, 74 * ts, 22 * ts);

    // 2. LUMBUNG GANDUM AMBERVALE (77.5*ts, 26*ts)
    this.drawCottage(ctx, 77.5 * ts, 26 * ts, 78, 60, '#b45309', '#ca8a04', 'Lumbung Gandum Ambervale');

    // 3. TUMPUKAN JERAMI EMAS (Hay Bales) di Samping Lumbung (73.5*ts, 27.5*ts)
    const hyX = 73.5 * ts;
    const hyY = 27.5 * ts;
    // Jerami 1
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(hyX, hyY + 8, 16, 12, 4);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(hyX + 4, hyY + 8, 1.5, 12);
    ctx.fillRect(hyX + 10, hyY + 8, 1.5, 12);

    // Jerami 2
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(hyX + 14, hyY + 9, 16, 11, 4);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(hyX + 18, hyY + 9, 1.5, 11);
    ctx.fillRect(hyX + 24, hyY + 9, 1.5, 11);

    // Jerami 3
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(hyX + 7, hyY, 15, 10, 4);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(hyX + 11, hyY, 1.5, 10);
    ctx.fillRect(hyX + 17, hyY, 1.5, 10);

    // 4. GEROBAK KAYU PENGANGKUT GANDUM (Grain Handcart)
    const cartX = 81 * ts;
    const cartY = 29 * ts;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cartX, cartY, 22, 12);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(cartX, cartY, 22, 12);
    // Karung gandum
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cartX + 6, cartY + 4, 4, 0, Math.PI * 2);
    ctx.arc(cartX + 15, cartY + 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cartX + 13, cartY + 1, 3, 2);
    // Roda Ruji Kayu
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(cartX + 11, cartY + 13, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(cartX + 11, cartY + 13, 2, 0, Math.PI * 2);
    ctx.fill();
    // Gagang Penarik
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cartX + 22, cartY + 6);
    ctx.lineTo(cartX + 30, cartY + 10);
    ctx.stroke();

    // 5. PAGAR KAYU PEMBATAS LADANG (y: 25*ts, x: 78*ts .. 86*ts)
    for (let fx = 78 * ts; fx <= 86 * ts; fx += 10) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(fx, 25 * ts + 4, 3, 12);
    }
    ctx.fillStyle = '#b45309';
    ctx.fillRect(78 * ts, 25 * ts + 6, 8 * ts, 2);
    ctx.fillRect(78 * ts, 25 * ts + 11, 8 * ts, 2);

    // 6. LENTERA PEDESAAN
    this.drawStreetlamp(ctx, 73 * ts, 26 * ts);
    this.drawStreetlamp(ctx, 81 * ts, 26 * ts);

    // 7. PAPAN PETUNJUK DUSUN
    this.drawSignpost(ctx, 74 * ts, 21 * ts, '🌾 Dusun Pertanian Ambervale');
  }

  /**
   * Render Menara Kincir Angin Tradisional 2.5D dengan 4 Baling-Baling Berlayar Kanvas yang Berputar Halus
   */
  private drawWindmill(ctx: CanvasRenderingContext2D, wx: number, wy: number): void {
    ctx.save();

    // 1. Bayangan Menara di Tanah
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(wx + 28, wy + 62, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pondasi Batu Granit Bawah (Stone Foundation Base)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(wx + 8, wy + 62);
    ctx.lineTo(wx + 48, wy + 62);
    ctx.lineTo(wx + 45, wy + 48);
    ctx.lineTo(wx + 11, wy + 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Tekstur Batu Pondasi
    ctx.fillStyle = '#475569';
    ctx.fillRect(wx + 14, wy + 52, 8, 4);
    ctx.fillRect(wx + 26, wy + 54, 9, 4);
    ctx.fillRect(wx + 36, wy + 51, 6, 4);

    // Pintu Kayu Melengkung Bawah Menara
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(wx + 23, wy + 50, 10, 12, [5, 5, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Badan Menara Kayu Mengerucut (Conical Timber Tower)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(wx + 11, wy + 48);
    ctx.lineTo(wx + 45, wy + 48);
    ctx.lineTo(wx + 41, wy + 20);
    ctx.lineTo(wx + 15, wy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Garis Papan Kayu Vertikal Menara
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx + 22, wy + 48); ctx.lineTo(wx + 24, wy + 20);
    ctx.moveTo(wx + 34, wy + 48); ctx.lineTo(wx + 32, wy + 20);
    ctx.stroke();

    // Jendela Kayu Menara dengan Cahaya Hangat
    ctx.fillStyle = '#fde047';
    ctx.fillRect(wx + 25, wy + 28, 6, 8);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(wx + 25, wy + 28, 6, 8);
    ctx.beginPath();
    ctx.moveTo(wx + 28, wy + 28); ctx.lineTo(wx + 28, wy + 36);
    ctx.moveTo(wx + 25, wy + 32); ctx.lineTo(wx + 31, wy + 32);
    ctx.stroke();

    // 4. Kubah Atap Kerucut Merah Bata (Cone Tiled Roof)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(wx + 12, wy + 20);
    ctx.lineTo(wx + 44, wy + 20);
    ctx.lineTo(wx + 28, wy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Lis Teritisan Atap
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(wx + 11, wy + 19, 34, 3);

    // 5. POROS PUSAT & 4 BILAH BALING-BALING BERPUTAR (Rotating Sails)
    const hubX = wx + 28;
    const hubY = wy + 22;
    const rotationAngle = this.animTimer * 0.45;

    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(rotationAngle);

    // Render 4 Bilah Baling-Baling Kincir
    const bladeLength = 34;
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    for (const ang of angles) {
      ctx.save();
      ctx.rotate(ang);

      // Balok Rangka Kayu Utama Baling-Baling (Wooden Spar)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-1.5, 0, 3, bladeLength);

      // Layar Kanvas Bergaris Kisi-Kisi (Canvas Sail Lattice)
      ctx.fillStyle = 'rgba(254, 243, 199, 0.95)';
      ctx.fillRect(1.5, 6, 8, bladeLength - 8);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(1.5, 6, 8, bladeLength - 8);

      // Kisi-kisi rusuk layar kain
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 0.6;
      for (let sy = 12; sy < bladeLength - 2; sy += 6) {
        ctx.beginPath();
        ctx.moveTo(1.5, sy);
        ctx.lineTo(9.5, sy);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Poros Logam Tengah (Hub Center Cap)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore(); // Restore rotate

    ctx.restore(); // Restore base
  }

  /**
   * Helper utilitas untuk mengatur terang/gelap warna hex (shading/highlighting arsitektur)
   */
  private shadeColor(color: string, percent: number): string {
    if (!color.startsWith('#') || color.length < 7) return color;
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    if (isNaN(R) || isNaN(G) || isNaN(B)) return color;
    R = Math.min(255, Math.max(0, Math.round(R * (100 + percent) / 100)));
    G = Math.min(255, Math.max(0, Math.round(G * (100 + percent) / 100)));
    B = Math.min(255, Math.max(0, Math.round(B * (100 + percent) / 100)));
    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');
    return `#${RR}${GG}${BB}`;
  }

  /**
   * Render Pondok / Balai Desa / Toko Arsitektur Pedesaan Klasik 2.5D RPG
   * Fasad kayu-plester Tudor, atap sirap bertingkat dengan bayangan teritisan,
   * jendela berkisi hangat dengan specular glint & kotak bunga, pintu lengkung berukir, cerobong asap & plang terintegrasi.
   */
  private drawCottage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    roofColor: string,
    _wallColor: string,
    nameTag: string
  ): void {
    const isLily = nameTag.includes('Lily') || nameTag.includes('Bunga');
    const isEldoria = nameTag.includes('Eldoria') || nameTag.includes('Roh');
    const isStonewatch = nameTag.includes('Stonewatch') || nameTag.includes('Benteng');
    const isKitchen = nameTag.includes('Dapur') || nameTag.includes('Kedai');
    const isTownHall = nameTag.includes('Balai') || nameTag.includes('Aldrich');

    // 1. Bayangan Jatuh Lembut ke Tanah (Ground Drop Shadow)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1, w / 2 + 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Fondasi Batu Alam / Cobblestone Plinth di Bagian Bawah
    const plinthH = 9;
    const plinthY = y + h - plinthH;
    ctx.fillStyle = isStonewatch ? '#1e293b' : '#334155';
    ctx.fillRect(x + 2, plinthY, w - 4, plinthH);
    ctx.fillStyle = isStonewatch ? '#334155' : '#475569';
    ctx.fillRect(x + 2, plinthY, w - 4, 2); // 1px highlight edge
    // Blok batu vertikal
    ctx.fillStyle = '#1e293b';
    for (let bx = x + 12; bx < x + w - 10; bx += 14) {
      ctx.fillRect(bx, plinthY + 2, 1.5, plinthH - 2);
    }

    // 3. Fasad Dinding Utama (Setengah-Kayu Tudor / Batu Halus)
    const wallY = y + 24;
    const wallH = h - 33;
    // Base plaster wall (hangat & bersih)
    ctx.fillStyle = isStonewatch ? '#475569' : isEldoria ? '#064e3b' : '#fef3c7';
    ctx.fillRect(x + 4, wallY, w - 8, wallH);

    // Tekstur Kayu Balok Tudor (Corner posts, mid-rail, & diagonal braces)
    const timberColor = isStonewatch ? '#0f172a' : isEldoria ? '#065f46' : '#5c2b09';
    const timberLight = isStonewatch ? '#1e293b' : isEldoria ? '#047857' : '#78350f';
    ctx.fillStyle = timberColor;
    // Balok tiang sudut kiri dan kanan
    ctx.fillRect(x + 4, wallY, 5, wallH);
    ctx.fillRect(x + w - 9, wallY, 5, wallH);
    // Balok sabuk horizontal tengah
    const midY = wallY + Math.round(wallH * 0.42);
    ctx.fillRect(x + 4, midY, w - 8, 3.5);
    // Balok atas dinding (wall-plate)
    ctx.fillRect(x + 4, wallY, w - 8, 3);
    // Sorotan cahaya pada balok kayu
    ctx.fillStyle = timberLight;
    ctx.fillRect(x + 5, wallY, 1.2, wallH);
    ctx.fillRect(x + w - 8, wallY, 1.2, wallH);

    // Diagonal Tudor Braces (jika bukan Stonewatch/Eldoria)
    if (!isStonewatch && !isEldoria) {
      ctx.strokeStyle = timberColor;
      ctx.lineWidth = 2.2;
      // Kiri
      ctx.beginPath();
      ctx.moveTo(x + 9, midY);
      ctx.lineTo(x + 20, wallY + 3);
      ctx.stroke();
      // Kanan
      ctx.beginPath();
      ctx.moveTo(x + w - 9, midY);
      ctx.lineTo(x + w - 20, wallY + 3);
      ctx.stroke();
    }

    // Aksen Khusus Eldoria (Rune Cahaya Hijau/Biru)
    if (isEldoria) {
      const runeGlow = Math.sin(this.animTimer * 4 + x) * 0.3;
      ctx.fillStyle = `rgba(52, 211, 153, ${0.75 + runeGlow})`;
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ᚱ ᛖ ᛚ', x + w / 2, wallY + 11);
    }

    // 4. Jendela Berkisi Kaca Hangat & Kotak Bunga Cantik
    const winW = 12;
    const winH = 13;
    const winY = wallY + 6;
    const winX1 = x + 11;
    const winX2 = x + w - 23;

    for (const wx of [winX1, winX2]) {
      // Bingkai jendela kayu / batu
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wx - 1, winY - 1, winW + 2, winH + 2);
      // Kaca bercahaya amber keemasan dari dalam rumah
      ctx.fillStyle = isEldoria ? '#34d399' : isStonewatch ? '#38bdf8' : '#fbbf24';
      ctx.fillRect(wx, winY, winW, winH);
      // Pantulan kilau kaca diagonal (Specular shine)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(wx + 1, winY + 1);
      ctx.lineTo(wx + 6, winY + 1);
      ctx.lineTo(wx + 1, winY + 6);
      ctx.closePath();
      ctx.fill();
      // Kisi jendela kayu (cross mullions)
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx + winW / 2, winY);
      ctx.lineTo(wx + winW / 2, winY + winH);
      ctx.moveTo(wx, winY + winH / 2);
      ctx.lineTo(wx + winW, winY + winH / 2);
      ctx.stroke();

      // Kotak Bunga di Bawah Jendela (Window Flower Box)
      if (isLily || isTownHall || isKitchen) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(wx - 2, winY + winH, winW + 4, 3.5);
        // Daun hijau
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(wx - 1, winY + winH - 1.5, winW + 2, 2.5);
        // Bunga mekar warna-warni (merah, merah muda, kuning, putih)
        const flowerColors = isLily ? ['#f43f5e', '#fb7185', '#fde047', '#ffffff'] : ['#ef4444', '#facc15'];
        for (let fi = 0; fi < 4; fi++) {
          ctx.fillStyle = flowerColors[fi % flowerColors.length];
          ctx.fillRect(wx + fi * 3, winY + winH - 2, 2, 2);
        }
      } else {
        // Daun jendela kayu samping (shutters)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(wx - 3, winY, 2.5, winH);
        ctx.fillRect(wx + winW + 0.5, winY, 2.5, winH);
      }
    }

    // Tanaman Rambat Ivy Khusus Toko Bunga Lily
    if (isLily) {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + 2, wallY + 8, 3, 5);
      ctx.fillRect(x + 4, wallY + 14, 2.5, 4);
      ctx.fillRect(x + 2, wallY + 19, 3, 6);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x + 3, wallY + 10, 2, 2);
      ctx.fillRect(x + 3, wallY + 21, 2, 2);
    }

    // Tong Anggur Kayu di Samping Dapur Gaston
    if (isKitchen) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + w - 8, y + h - 14, 8, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 8 + w, y + h - 12, 8, 1.5);
      ctx.fillRect(x - 8 + w, y + h - 6, 8, 1.5);
    }

    // 5. Pintu Lengkung Kayu Oak Kokoh & Ambang Pintu
    const doorW = 16;
    const doorH = 24;
    const doorX = Math.round(x + w / 2 - doorW / 2);
    const doorY = y + h - doorH - 2;

    // Bingkai lengkung pintu
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(doorX - 2, doorY - 3, doorW + 4, doorH + 4, [5, 5, 0, 0]);
    ctx.fill();

    // Daun pintu papan kayu
    ctx.fillStyle = isStonewatch ? '#334155' : '#451a03';
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [4, 4, 0, 0]);
    ctx.fill();

    // Garis serat papan pintu vertikal
    ctx.fillStyle = isStonewatch ? '#1e293b' : '#270e02';
    ctx.fillRect(doorX + 5, doorY + 2, 1, doorH - 2);
    ctx.fillRect(doorX + 10, doorY + 2, 1, doorH - 2);

    // Engsel besi hitam melintang
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(doorX + 1, doorY + 6, doorW - 3, 2);
    ctx.fillRect(doorX + 1, doorY + 16, doorW - 3, 2);

    // Gagang pintu kuningan berkilau
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(doorX + doorW - 4, doorY + 12, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Ambang pintu batu
    ctx.fillStyle = '#64748b';
    ctx.fillRect(doorX - 1, doorY + doorH - 1, doorW + 2, 3);

    // 6. Atap Bersusun Klasik RPG (Layered Tiled Gable Roof with Ridge & Overhang)
    // Cerobong asap batu (di belakang atap kanan)
    const chimX = x + w - 17;
    const chimY = y - 6;
    ctx.fillStyle = '#334155';
    ctx.fillRect(chimX, chimY, 8, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(chimX - 1, chimY - 2, 10, 3); // Pot cap
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(chimX + 2, chimY - 3, 4, 1.5); // Flue
    // Asap cerobong halus berayun naik
    const smokeBob = Math.sin(this.animTimer * 2 + x) * 3;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.beginPath();
    ctx.arc(chimX + 4 + smokeBob, chimY - 6, 3.5, 0, Math.PI * 2);
    ctx.arc(chimX + 6 - smokeBob, chimY - 13, 5, 0, Math.PI * 2);
    ctx.fill();

    // Badan Atap (Trapezoid / Hip Roof bersusun)
    // Shingle rows: 4 tingkatan sirap atap
    const tiers = 4;
    const roofTopY = y + 2;
    const roofBotY = y + 24;
    const roofOverhang = 4;

    for (let t = 0; t < tiers; t++) {
      const tProgress = t / tiers;
      const nextProgress = (t + 1) / tiers;
      const y0 = roofTopY + tProgress * (roofBotY - roofTopY);
      const y1 = roofTopY + nextProgress * (roofBotY - roofTopY) + 1;
      const spread0 = 6 + (w / 2 - 6 + roofOverhang) * tProgress;
      const spread1 = 6 + (w / 2 - 6 + roofOverhang) * nextProgress;

      ctx.fillStyle = t % 2 === 0 ? roofColor : this.shadeColor(roofColor, -12);
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - spread0, y0);
      ctx.lineTo(x + w / 2 + spread0, y0);
      ctx.lineTo(x + w / 2 + spread1, y1);
      ctx.lineTo(x + w / 2 - spread1, y1);
      ctx.closePath();
      ctx.fill();

      // Garis kilau atas setiap sirap
      ctx.strokeStyle = this.shadeColor(roofColor, 28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - spread0 + 1, y0);
      ctx.lineTo(x + w / 2 + spread0 - 1, y0);
      ctx.stroke();

      // Celah sirap vertikal
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 0.8;
      const segW = 10;
      const segStart = x + w / 2 - spread1 + (t % 2 === 0 ? 0 : 5);
      for (let sx = segStart; sx < x + w / 2 + spread1; sx += segW) {
        if (sx > x + w / 2 - spread0 && sx < x + w / 2 + spread0) {
          ctx.beginPath();
          ctx.moveTo(sx, y0);
          ctx.lineTo(sx, y1);
          ctx.stroke();
        }
      }
    }

    // Lis Tepi Atap (Bargeboards & Ridge cap)
    ctx.strokeStyle = this.shadeColor(roofColor, -35);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - roofOverhang, roofBotY);
    ctx.lineTo(x + w / 2 - 6, roofTopY);
    ctx.lineTo(x + w / 2 + 6, roofTopY);
    ctx.lineTo(x + w + roofOverhang, roofBotY);
    ctx.stroke();

    // Ridge cap emas / kayu di puncak
    ctx.fillStyle = isStonewatch ? '#0f172a' : '#ca8a04';
    ctx.fillRect(x + w / 2 - 8, roofTopY - 1.5, 16, 3);

    // Bayangan Jatuh Teritisan Atap ke Dinding Bawah (Ambient Occlusion Under Eaves)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
    ctx.fillRect(x + 2, roofBotY, w - 4, 4.5);

    // 7. Plakat Papan Nama Bangunan Terpasang Rapi di Fasad Atas Pintu
    this.drawFittedSignboard(
      ctx,
      x + w / 2,
      wallY + 2.5,
      w - 14,
      10,
      nameTag,
      'rgba(15, 23, 42, 0.94)',
      '#ca8a04',
      '#fef08a'
    );
  }

  /**
   * Render Bangunan Bank Kerajaan Val / Oakhaven (Neoclassical Imperial Treasury)
   * Tangga marmer bertingkat, 4 pilar Romawi berulir (fluted) dengan kapitel emas, dinding marmer ashlar,
   * pintu khazanah besi bertabur emas, jendela lengkung teralis emas & pedimen biru safir berlis emas megah.
   */
  private drawBankBuilding(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1, w / 2 + 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tangga Marmer Tiga Tingkat Menuju Serambi Bank (3-Tiered Marble Steps)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + h - 5, w - 4, 5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 4, y + h - 8, w - 8, 3.5);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x + 6, y + h - 11, w - 12, 3.5);

    // Garis bevel anak tangga
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 2, y + h - 5, w - 4, 1);
    ctx.fillRect(x + 4, y + h - 8, w - 8, 1);

    // 3. Fasad Dinding Marmer Putih Ashlar (Polished White Marble Masonry)
    const wallY = y + 22;
    const wallH = h - 33;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 6, wallY, w - 12, wallH);

    // Garis sambungan batu marmer halus
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    for (let my = wallY + 8; my < wallY + wallH; my += 9) {
      ctx.beginPath();
      ctx.moveTo(x + 6, my);
      ctx.lineTo(x + w - 6, my);
      ctx.stroke();
    }

    // 4. Jendela Lengkung Teralis Emas & Kaca Biru Safir Tinted
    const winW = 10;
    const winH = 14;
    const winY = wallY + 8;
    for (const jx of [x + 13, x + w - 23]) {
      // Bingkai lengkung
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(jx - 1, winY - 1, winW + 2, winH + 2, [4, 4, 0, 0]);
      ctx.fill();
      // Kaca biru safir
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(jx, winY, winW, winH, [3, 3, 0, 0]);
      ctx.fill();
      // Pantulan kilau kaca diagonal
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(jx + 1, winY + 1);
      ctx.lineTo(jx + 5, winY + 1);
      ctx.lineTo(jx + 1, winY + 5);
      ctx.closePath();
      ctx.fill();
      // Teralis pengaman emas
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(jx + winW / 2, winY);
      ctx.lineTo(jx + winW / 2, winY + winH);
      ctx.moveTo(jx, winY + winH / 2);
      ctx.lineTo(jx + winW, winY + winH / 2);
      ctx.stroke();
    }

    // 5. Pintu Khazanah Emas & Perunggu Berlapis Besi (Grand Vault Double Door)
    const doorW = 20;
    const doorH = 26;
    const doorX = Math.round(x + w / 2 - doorW / 2);
    const doorY = y + h - doorH - 3;

    // Bingkai lengkung pintu marmer
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(doorX - 2.5, doorY - 3, doorW + 5, doorH + 4, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Daun pintu besi mahoni & perunggu
    ctx.fillStyle = '#270e02';
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [4, 4, 0, 0]);
    ctx.fill();

    // Pelat perisai pintu emas
    ctx.fillStyle = '#facc15';
    ctx.fillRect(doorX + 2, doorY + 4, doorW - 4, 2);
    ctx.fillRect(doorX + 2, doorY + doorH - 6, doorW - 4, 2);
    // Roda pengunci kubah bank (vault locking wheel) di tengah
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(doorX + doorW / 2, doorY + 12, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(doorX + doorW / 2, doorY + 12, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 6. Empat Pilar Romawi Berulir (4 Fluted Roman Columns with Gold Capitals)
    const colPositions = [x + 5, x + 23, x + w - 31, x + w - 13];
    for (const px of colPositions) {
      // Bayangan pilar ke dinding
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(px + 6, wallY + 3, 2, wallH - 3);

      // Batang pilar marmer putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, wallY + 2, 7, wallH - 2);

      // Alur vertikal pilar (fluting highlight & shadow)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px + 1.2, wallY + 2, 1, wallH - 2);
      ctx.fillRect(px + 4.8, wallY + 2, 1, wallH - 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px + 3, wallY + 2, 1.2, wallH - 2);

      // Kapitel emas (atas) & plinth dasar (bawah)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1.5, wallY, 10, 3);
      ctx.fillRect(px - 1.5, wallY + wallH - 3, 10, 3);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - 1.5, wallY, 10, 3);
    }

    // 7. Balok Architrave & Pedimen Segitiga Biru Safir (Classical Pediment)
    // Balok Architrave marmer di atas pilar
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 2, wallY - 2, w - 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, wallY - 2, w - 4, 1.2);

    // Pedimen Segitiga Biru Safir
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x - 3, wallY - 1);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(x + w + 3, wallY - 1);
    ctx.closePath();
    ctx.fill();

    // Lis Emas Pedimen
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 3, wallY - 1);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(x + w + 3, wallY - 1);
    ctx.stroke();

    // Dentil Molding (gigi ornamen klasik di bawah pedimen)
    ctx.fillStyle = '#facc15';
    for (let dx = x + 4; dx < x + w - 4; dx += 6) {
      ctx.fillRect(dx, wallY - 2, 3, 2);
    }

    // Apex Finial Emas di Puncak
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + w / 2 - 2, y - 8, 4, 4);
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 8. Medali Koin Emas Val di Tengah Tympanum Pedimen
    const crestX = x + w / 2;
    const crestY = y + 8;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(crestX, crestY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 7.5px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝒱', crestX, crestY + 0.3);

    // Bayangan Teritisan Atap
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(x + 2, wallY + 2, w - 4, 3.5);

    // 9. Plakat Papan Nama Bank Emas di Atas Pintu
    this.drawFittedSignboard(
      ctx,
      x + w / 2,
      wallY + 2.5,
      w - 14,
      10,
      '🏛️ BANK KERAJAAN VAL',
      '#0f172a',
      '#facc15',
      '#fef08a'
    );
  }

  /**
   * Render Bangunan Bengkel Pandai Besi Master Brokk di Oakhaven (Master Blacksmith Foundry)
   * Arsitektur batu basalt & arang, atap sirap slate bergerigi, cerobong asap batu ganda dengan semburan api & bunga api terbang,
   * jendela tempa berkobar api jingga dengan teralis besi, landasan tempa (anvil) di atas tunggul kayu, & tong pendingin.
   */
  private drawBlacksmithWorkshop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1, w / 2 + 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Fondasi Batu Basalt Arang Hitam Pekat
    const plinthH = 10;
    const plinthY = y + h - plinthH;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 2, plinthY, w - 4, plinthH);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, plinthY, w - 4, 2);

    // 3. Dinding Masonry Batu Basalt Gelap & Balok Kayu Hangus
    const wallY = y + 24;
    const wallH = h - 34;
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, wallY, w - 8, wallH);

    // Sambungan batu bata basalt kasar
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    for (let my = wallY + 6; my < wallY + wallH; my += 7) {
      ctx.beginPath();
      ctx.moveTo(x + 4, my);
      ctx.lineTo(x + w - 4, my);
      ctx.stroke();
    }

    // Tiang Sudut Kayu Hangus dengan Pelat Sudut Besi Hitam
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 4, wallY, 6, wallH);
    ctx.fillRect(x + w - 10, wallY, 6, wallH);
    ctx.fillStyle = '#64748b'; // Paku keling besi sudut
    ctx.fillRect(x + 6, wallY + 4, 2, 2);
    ctx.fillRect(x + 6, wallY + wallH - 6, 2, 2);
    ctx.fillRect(x + w - 8, wallY + 4, 2, 2);
    ctx.fillRect(x + w - 8, wallY + wallH - 6, 2, 2);

    // 4. Jendela Tempa Api Membara (Fiery Forge Glowing Window)
    const forgeWinW = 15;
    const forgeWinH = 14;
    const forgeWinX = x + 11;
    const forgeWinY = wallY + 5;

    // Bingkai batu lengkung jendela tempa
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(forgeWinX - 2, forgeWinY - 2, forgeWinW + 4, forgeWinH + 4, [4, 4, 0, 0]);
    ctx.fill();

    // Api berkobar di dalam bengkel tempa
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(forgeWinX, forgeWinY, forgeWinW, forgeWinH);
    const forgeFlicker = Math.sin(this.animTimer * 10) * 2;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(forgeWinX + forgeWinW / 2, forgeWinY + forgeWinH / 2 + forgeFlicker, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Teralis jeruji besi tempa
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(forgeWinX + 4.5, forgeWinY, 2, forgeWinH);
    ctx.fillRect(forgeWinX + 9.5, forgeWinY, 2, forgeWinH);
    ctx.fillRect(forgeWinX, forgeWinY + 7, forgeWinW, 2);

    // Pancaran cahaya hangat tempa ke tanah
    const forgeGlow = ctx.createRadialGradient(
      forgeWinX + forgeWinW / 2,
      forgeWinY + forgeWinH,
      2,
      forgeWinX + forgeWinW / 2,
      forgeWinY + forgeWinH + 12,
      18
    );
    forgeGlow.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
    forgeGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = forgeGlow;
    ctx.fillRect(forgeWinX - 10, forgeWinY + forgeWinH, forgeWinW + 20, 18);

    // 5. Pintu Masuk Kayu Oak Tebal Diperkuat Pelat Besi Bersilang
    const doorW = 16;
    const doorH = 24;
    const doorX = Math.round(x + w / 2 - doorW / 2);
    const doorY = y + h - doorH - 2;

    // Bingkai lengkung batu pintu
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(doorX - 2, doorY - 3, doorW + 4, doorH + 4, [5, 5, 0, 0]);
    ctx.fill();

    // Pintu kayu arang
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [4, 4, 0, 0]);
    ctx.fill();

    // Sabuk pelat besi hitam bersilang
    ctx.fillStyle = '#475569';
    ctx.fillRect(doorX + 1, doorY + 5, doorW - 2, 2.5);
    ctx.fillRect(doorX + 1, doorY + 15, doorW - 2, 2.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(doorX + doorW - 4, doorY + 11, 2, 2); // Gagang kuningan

    // 6. Cerobong Asap Batu Masif dengan Lidah Api & Bunga Api Terbang
    const chimX = x + w - 18;
    const chimY = y - 10;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(chimX, chimY, 11, 20);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(chimX, chimY, 11, 20);

    // Klem besi pengikat cerobong
    ctx.fillStyle = '#475569';
    ctx.fillRect(chimX - 1, chimY + 4, 13, 2);
    ctx.fillRect(chimX - 1, chimY + 12, 13, 2);

    // Mulut cerobong berpijar jingga
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(chimX + 1, chimY - 2, 9, 3);

    // Partikel asap tebal & bunga api tempa (embers)
    const smokeWave = Math.sin(this.animTimer * 2 + x) * 3;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.beginPath();
    ctx.arc(chimX + 5 + smokeWave, chimY - 6, 4.5, 0, Math.PI * 2);
    ctx.arc(chimX + 7 - smokeWave, chimY - 14, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Percikan bunga api membubung tinggi
    const emberY1 = chimY - 8 - ((this.animTimer * 22) % 18);
    const emberY2 = chimY - 4 - ((this.animTimer * 18 + 8) % 18);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(chimX + 4 + Math.sin(this.animTimer * 7) * 4, emberY1, 2, 2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(chimX + 7 - Math.sin(this.animTimer * 5) * 3, emberY2, 1.5, 1.5);

    // 7. Atap Sirap Slate Arang Gelap Bertingkat (Layered Slate Shingle Roof)
    const tiers = 4;
    const roofTopY = y + 2;
    const roofBotY = y + 24;
    const roofOverhang = 5;

    for (let t = 0; t < tiers; t++) {
      const tProgress = t / tiers;
      const nextProgress = (t + 1) / tiers;
      const y0 = roofTopY + tProgress * (roofBotY - roofTopY);
      const y1 = roofTopY + nextProgress * (roofBotY - roofTopY) + 1;
      const spread0 = 6 + (w / 2 - 6 + roofOverhang) * tProgress;
      const spread1 = 6 + (w / 2 - 6 + roofOverhang) * nextProgress;

      ctx.fillStyle = t % 2 === 0 ? '#1e293b' : '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - spread0, y0);
      ctx.lineTo(x + w / 2 + spread0, y0);
      ctx.lineTo(x + w / 2 + spread1, y1);
      ctx.lineTo(x + w / 2 - spread1, y1);
      ctx.closePath();
      ctx.fill();

      // Garis kilau sirap slate arang
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - spread0 + 1, y0);
      ctx.lineTo(x + w / 2 + spread0 - 1, y0);
      ctx.stroke();
    }

    // Lis atap besi & ridge cap
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - roofOverhang, roofBotY);
    ctx.lineTo(x + w / 2 - 6, roofTopY);
    ctx.lineTo(x + w / 2 + 6, roofTopY);
    ctx.lineTo(x + w + roofOverhang, roofBotY);
    ctx.stroke();

    // Ridge cap tembaga di puncak atap
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + w / 2 - 8, roofTopY - 1.5, 16, 3);

    // Bayangan jatuh teritisan atap ke dinding
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(x + 2, roofBotY, w - 4, 4.5);

    // 8. Perlengkapan Luar Bengkel (Outdoor Blacksmith Props)
    // Landasan Tempa (Anvil) di atas tunggul kayu alami di kanan
    const anvilStumpX = x + w - 24;
    const anvilStumpY = y + h - 14;
    // Tunggul kayu
    ctx.fillStyle = '#451a03';
    ctx.fillRect(anvilStumpX, anvilStumpY, 10, 10);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(anvilStumpX + 5, anvilStumpY, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Besi landasan tempa (Anvil)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(anvilStumpX + 1, anvilStumpY - 4, 8, 4);
    ctx.fillRect(anvilStumpX - 1, anvilStumpY - 6, 12, 2.5); // Horn & face
    ctx.fillStyle = '#64748b';
    ctx.fillRect(anvilStumpX, anvilStumpY - 6, 10, 1);

    // Tong Air Pendingin (Quenching Tub) di kiri
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 5, y + h - 14, 9, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 5, y + h - 12, 9, 1.5); // Klem tong
    ctx.fillRect(x - 5, y + h - 6, 9, 1.5);
    // Air pendingin biru
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - 4, y + h - 13, 7, 2);

    // Tumpukan Batangan Besi (Ingots)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 5, y + h - 7, 7, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 6, y + h - 10, 5, 3);

    // 9. Plakat Papan Nama Bengkel Tempa Terpasang Rapi di Fasad
    this.drawFittedSignboard(
      ctx,
      x + w / 2,
      wallY + 2.5,
      w - 10,
      10,
      '⚒️ BENGKEL TEMPA BROKK',
      'rgba(15, 23, 42, 0.95)',
      '#f97316',
      '#fdba74'
    );
  }

  /**
   * Render Kawasan Distrik Pasar Raya Khusus (Grand Bazaar District: Gerbang Utama, 5 Toko Tematik, Pagar Suaka Satwa & Dekorasi Festival)
   */
  private drawGrandBazaarDistrict(ctx: CanvasRenderingContext2D): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. GERBANG UTAMA DISTRIK PASAR RAYA (Grand Bazaar Entrance Archway at 59.5*ts, 49*ts)
    this.drawBazaarArchway(ctx, 59.5 * ts, 49 * ts);

    // 2. GARLAND BUNTING (Tali Bendera Festival Menggantung Melintasi Jalan Pasar)
    this.drawBazaarBunting(ctx, 60 * ts, 76 * ts, 45 * ts, 53 * ts);

    // 3. LENTERA JALAN PASAR RAYA
    this.drawStreetlamp(ctx, 61 * ts, 47.8 * ts);
    this.drawStreetlamp(ctx, 67 * ts, 47.8 * ts);
    this.drawStreetlamp(ctx, 73 * ts, 47.8 * ts);
    this.drawStreetlamp(ctx, 61 * ts, 52.2 * ts);
    this.drawStreetlamp(ctx, 67 * ts, 52.2 * ts);

    // 4. BARIS TOKO SISI UTARA (y = 44.5 * ts)
    // 4.1 Toko Serba Ada Saudagar Marco (x = 62 * ts, y = 44.5 * ts)
    this.drawGeneralStoreMarco(ctx, 62 * ts, 44.5 * ts);

    // 4.2 Kedai Kuliner Chef Gaston (x = 68 * ts, y = 44.5 * ts)
    this.drawFoodTavernGaston(ctx, 68 * ts, 44.5 * ts);

    // 4.3 Paviliun Arkana Sorceress Luna (x = 74 * ts, y = 44.5 * ts)
    this.drawArcanePavilionLuna(ctx, 74 * ts, 44.5 * ts);

    // 5. BARIS TOKO SISI SELATAN (y = 53.5 * ts)
    // 5.1 Kios Persenjataan Gareth (x = 62 * ts, y = 53.5 * ts)
    this.drawArmoryGareth(ctx, 62 * ts, 53.5 * ts);

    // 5.2 Suaka Satwa & Toko Hewan Penjinak Mia (x = 68 * ts..75 * ts, y = 53 * ts..56.5 * ts)
    this.drawPetSanctuaryMia(ctx, 68 * ts, 53 * ts);
  }

  /**
   * Render Gerbang Lengkung Utama Masuk Distrik Pasar Raya (Archway dengan Panji & Lentera)
   */
  private drawBazaarArchway(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    const topY = y - 2.5 * ts;
    const botY = y + 3.5 * ts;

    // Pilar Batu Kayu Utara & Selatan
    for (const py of [topY, botY - 14]) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 4, py, 10, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 2, py + 2, 6, 12);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 4, py, 10, 16);
    }

    // Balok Lengkung Atas Gerbang
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, topY, 8, botY - topY);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 6, topY - 8, 12, 10);
    ctx.fillRect(x - 6, botY + 2, 12, 10);

    // Papan Gerbang Atas
    this.drawFittedSignboard(ctx, x, topY - 6, 144, 16, '🎪 DISTRIK PASAR RAYA (GRAND BAZAAR)', '#0f172a', '#f59e0b', '#fef08a');

    // Bendera Segitiga Menggantung di Gerbang
    const flags = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#c084fc'];
    for (let i = 0; i < flags.length; i++) {
      const fx = x - 50 + i * 25;
      const fy = topY + 2;
      const wave = Math.sin(this.animTimer * 4 + i) * 1.5;
      ctx.fillStyle = flags[i];
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 14, fy);
      ctx.lineTo(fx + 7 + wave, fy + 10);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Render Tali Bendera Festival Menggantung Melintasi Lorong Pasar
   */
  private drawBazaarBunting(ctx: CanvasRenderingContext2D, startX: number, _endX: number, topY: number, botY: number): void {
    const intervals = [startX + 80, startX + 220, startX + 360];
    const flagColors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

    intervals.forEach((ix, rowIdx) => {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(ix, topY + 28);
      ctx.quadraticCurveTo(ix + 20, (topY + botY) / 2 + 10, ix, botY);
      ctx.stroke();

      for (let f = 0; f < 5; f++) {
        const fy = topY + 36 + f * 34;
        const fx = ix + Math.sin(f * 0.8) * 8;
        const wave = Math.sin(this.animTimer * 3 + f + rowIdx) * 2;
        ctx.fillStyle = flagColors[f % flagColors.length];
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + 8, fy + 4);
        ctx.lineTo(fx + 2 + wave, fy + 12);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  /**
   * 1. Toko Serba Ada Saudagar Marco (Beli Ramuan & Jual Seluruh Isi Tas)
   */
  private drawGeneralStoreMarco(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 58;
    const h = 32;

    // 1. Soft Ground Shadow & Cobblestone Paving
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w / 2 + 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // 2. Rak Barang Belakang & Dinding Kios
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 6, w - 4, 12);
    // Rak kayu & botol ramuan cadangan di rak
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 4, y + 10, w - 8, 2);
    // Botol-botol ramuan kecil di rak atas
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 8, y + 7, 3, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 14, y + 7, 3, 3);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 20, y + 7, 3, 3);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + w - 16, y + 7, 5, 3); // Peta gulung

    // Sisi Kiri: Tong Kayu Ramuan Ekstrak
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 7, y + 17, 10, 15);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 7, y + 20, 10, 2);
    ctx.fillRect(x - 7, y + 27, 10, 2);

    // Sisi Kanan: Kotak Kayu Berisi Buah Segar (Apel & Pir Hutan)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + w - 2, y + 19, 12, 12);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + w + 2, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + w + 6, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Saudagar Marco Berdiri di Balik Meja Kasir
    ctx.fillStyle = '#047857'; // Apron hijau
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Wajah
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    ctx.fillStyle = '#fde047'; // Topi jerami pedagang
    ctx.fillRect(x + w / 2 - 8, y - 5, 16, 3);
    ctx.fillRect(x + w / 2 - 5, y - 8, 10, 4);
    ctx.fillStyle = '#dc2626'; // Pita topi merah
    ctx.fillRect(x + w / 2 - 5, y - 5, 10, 1.5);

    // 4. Meja Konter Kayu Dipoles Rapi (Counter Table)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 2, y + 16, w - 4, 3);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 27, w - 4, 1.5);

    // Barang dagangan di meja: Ramuan HP (merah), MP (biru) dengan kilau kaca & gulungan
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 11, y + 18, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 16.5, 1, 1); // Specular glint
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 10, y + 15, 2, 1.5); // Gabus botol

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 21, y + 18, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 20, y + 16.5, 1, 1);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 20, y + 15, 2, 1.5);

    // Gulungan kertas perjanjian jual-beli
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 29, y + 17, 8, 3.5);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 32, y + 17, 2, 3.5); // Pita merah gulungan

    // 5. Tiang Penyangga Kanopi Kayu Berukir
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 3, 4, h - 3);
    ctx.fillRect(x + w - 6, y + 3, 4, h - 3);
    // Braket siku kayu
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 4);
    ctx.lineTo(x + 10, y + 4);
    ctx.lineTo(x + 6, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 4);
    ctx.lineTo(x + w - 10, y + 4);
    ctx.lineTo(x + w - 6, y + 8);
    ctx.closePath();
    ctx.fill();

    // 6. Tenda Kanopi Bergaris Merah & Kuning Bersirip Halus (Scalloped Awning)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fef08a';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW - 1, y + 13);
      ctx.lineTo(x + i * stripeW - 1, y + 13);
      ctx.closePath();
      ctx.fill();

      // Kelopak renda bawah melengkung halus
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 0.5, y + 13, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Bayangan teritisan tenda ke meja
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(x + 2, y + 14, w - 4, 2.5);

    // 7. Plakat Papan Nama Kios Rapi di Puncak Tenda
    this.drawFittedSignboard(ctx, x + w / 2, y + 0.5, w - 2, 10, '🛒 SERBA ADA MARCO', '#1e293b', '#facc15', '#fef08a');
  }

  /**
   * 2. Kedai Kuliner Chef Gaston (Makanan Penguat Status & Daging Serigala)
   */
  private drawFoodTavernGaston(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 62;
    const h = 32;

    // 1. Soft Ground Shadow & Terracotta Paving
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w / 2 + 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // 2. Kuali Sup Besi Hitam Mendidih Beruap (Kiri)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x - 4, y + 24, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Tungku api menyala di bawah kuali
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 6, y + 30, 4, 3);
    const steamWave = Math.sin(this.animTimer * 4 + x) * 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 4 + steamWave, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Alat Pemanggang Daging Berputar Sizzling di Kanan
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 16, 2.5, 16);
    ctx.fillRect(x + w + 10, y + 16, 2.5, 16);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + w - 2, y + 20, 16, 4.5); // Daging panggang bakar
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + w + 2, y + 21, 6, 2.5); // Aksen bara panggang

    // 4. Chef Gaston Berdiri di Balik Konter
    ctx.fillStyle = '#ffffff'; // Jas koki putih
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#dc2626'; // Dasi leher merah
    ctx.fillRect(x + w / 2 - 2, y + 8, 4, 5);
    ctx.fillStyle = '#fed7aa'; // Wajah
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    // Kumis melengkung lebat
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w / 2 - 5, y + 3, 10, 2);
    // Topi Koki Tinggi Putih (Chef Toque)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - 5, y - 8, 10, 6);
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 8, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Tiang Penyangga Konter
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 3, 4, h - 3);
    ctx.fillRect(x + w - 6, y + 3, 4, h - 3);

    // 6. Tenda Kanopi Oranye & Putih (Orange & White Scalloped Awning)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW - 1, y + 13);
      ctx.lineTo(x + i * stripeW - 1, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 0.5, y + 13, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // 7. Meja Konter Kuliner & Display Hidangan Lezat
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 2, y + 16, w - 4, 3);

    // Piring hidangan di meja (Steak daging, puding slime, mangkuk sup herbal)
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(x + 10, y + 17, 8, 3.5); // Piring steak
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 26, y + 18, 3, 0, Math.PI * 2); // Slime jelly pudding
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 40, y + 18, 3, 0, Math.PI * 2); // Sup herbal hijau
    ctx.fill();

    // Bayangan jatuh kanopi
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(x + 2, y + 14, w - 4, 2.5);

    // 8. Signboard
    this.drawFittedSignboard(ctx, x + w / 2, y + 0.5, w - 2, 10, '🍲 KEDAI KULINER GASTON', '#1e293b', '#ea580c', '#fed7aa');
  }

  /**
   * 3. Paviliun Arkana Sorceress Luna (Sihir, Gulungan & Kristal Abisal)
   */
  private drawArcanePavilionLuna(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 58;
    const h = 32;

    // 1. Soft Ground Shadow & Permadani Lingkaran Sihir Ungu
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w / 2 + 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3b0764';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - 6, y + 18, w + 12, 14);

    // 2. Kristal Mengambang Berpendar Aura Mistis di Kiri
    ctx.fillStyle = '#581c87';
    ctx.fillRect(x - 6, y + 22, 8, 10);
    const orbBob = Math.sin(this.animTimer * 5) * 2;
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(x - 2, y + 16 + orbBob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 2, y + 16 + orbBob, 8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Mimbar Kitab Mantra Terbuka di Kanan (Open Grimoire Lectern)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 18, 4, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + w - 4, y + 16, 12, 6);
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(x + w + 1, y + 16, 2, 6); // Pita penanda kitab

    // 4. Sorceress Luna Berdiri di Balik Konter
    ctx.fillStyle = '#4c1d95'; // Jubah violet
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Wajah
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    // Topi penyihir kerucut dengan sabit emas
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 11);
    ctx.lineTo(x + w / 2 + 8, y - 4);
    ctx.lineTo(x + w / 2 - 8, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + w / 2 - 8, y - 4, 16, 2);

    // 5. Tiang Penyangga
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(x + 2, y + 3, 4, h - 3);
    ctx.fillRect(x + w - 6, y + 3, 4, h - 3);

    // 6. Kanopi Sutra Ungu Violet & Emas Mistis
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#581c87' : '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW - 1, y + 13);
      ctx.lineTo(x + i * stripeW - 1, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 0.5, y + 13, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // 7. Meja Konter Arcane
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(x + 2, y + 16, w - 4, 3);

    // Kristal permata & gulungan portal sihir
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(x + 14, y + 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 26, y + 16.5, 8, 3.5);

    // Bayangan jatuh kanopi
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(x + 2, y + 14, w - 4, 2.5);

    // 8. Signboard
    this.drawFittedSignboard(ctx, x + w / 2, y + 0.5, w - 2, 10, '🔮 ARKANA LUNA', '#0f172a', '#c084fc', '#e9d5ff');
  }

  /**
   * 4. Kios Persenjataan Gareth (Senjata, Logam & Perkakas Ekspedisi)
   */
  private drawArmoryGareth(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 58;
    const h = 32;

    // 1. Soft Ground Shadow & Dark Stone Paving
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w / 2 + 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // 2. Landasan Mini Tempa di Kiri
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 6, y + 24, 10, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 8, y + 22, 14, 3);

    // 3. Rak Senjata Pedang Bersilang & Perisai Baja di Kanan
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 16, 2.5, 16);
    ctx.fillRect(x + w + 10, y + 16, 2.5, 16);
    // Perisai Baja (Heater Shield)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(x + w + 5, y + 23, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + w + 4, y + 20, 2, 6);

    // 4. Pengrajin Gareth Berdiri di Balik Konter
    ctx.fillStyle = '#451a03'; // Rompi kulit tebal
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Wajah
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    ctx.fillStyle = '#334155'; // Rambut cokelat pendek
    ctx.fillRect(x + w / 2 - 5, y - 4, 10, 4);

    // 5. Tiang Penyangga
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y + 3, 4, h - 3);
    ctx.fillRect(x + w - 6, y + 3, 4, h - 3);

    // 6. Tenda Kanopi Abu Slate & Biru Baja
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#334155' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW, y + 2);
      ctx.lineTo(x + (i + 1) * stripeW - 1, y + 13);
      ctx.lineTo(x + i * stripeW - 1, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 0.5, y + 13, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // 7. Meja Konter & Logam Perkakas
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 2, y + 16, w - 4, 3);

    // Batangan besi & belati baja di konter
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 10, y + 17, 8, 3.5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 24, y + 17, 10, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 22, y + 16.5, 3, 3);

    // Bayangan jatuh kanopi
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(x + 2, y + 14, w - 4, 2.5);

    // 8. Signboard
    this.drawFittedSignboard(ctx, x + w / 2, y + 0.5, w - 2, 10, '⚔️ SENJATA GARETH', '#0f172a', '#94a3b8', '#cbd5e1');
  }

  /**
   * 5. Suaka Satwa & Toko Hewan Penjinak Mia (Paddock Peliharaan, Kandang & Pet Playpen)
   */
  private drawPetSanctuaryMia(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    const penW = 7 * ts;
    const penH = 3.5 * ts;

    // 1. Padang Rumput Hijau Paddock Peliharaan
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y, penW, penH);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x + 3, y + 3, penW - 6, penH - 6);

    // 2. Rumah Anjing / Pet Shelter Kayu Beratap Merah di Kanan Atas
    const shX = x + penW - 44;
    const shY = y + 4;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(shX, shY + 8, 36, 24);

    // Pintu masuk pondok hewan
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(shX + 18, shY + 24, 7, Math.PI, 0, false);
    ctx.lineTo(shX + 25, shY + 32);
    ctx.lineTo(shX + 11, shY + 32);
    ctx.closePath();
    ctx.fill();

    // Atap pondok hewan bersusun
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(shX - 4, shY + 8);
    ctx.lineTo(shX + 18, shY - 4);
    ctx.lineTo(shX + 40, shY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. Bak Air Minum & Jerami Tidur
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 10, y + penH - 20, 18, 10);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 12, y + penH - 18, 14, 6);

    // 4. Hewan Bayi Peliharaan Lucu:
    // Puni (Slime mini melompat gembira)
    const slimeBob = Math.sin(this.animTimer * 6) * 3;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 40, y + 24 + slimeBob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 39, y + 23 + slimeBob, 1.5, 1.5);
    ctx.fillRect(x + 42, y + 23 + slimeBob, 1.5, 1.5);

    // Lobo (Anak serigala lucu mengibaskan ekor)
    const wolfWag = Math.sin(this.animTimer * 12) * 3;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 70, y + 26, 8, 5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 74, y + 23, 6, 6);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 67, y + 25 + wolfWag * 0.4, 3, 2); // Ekor
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 82, y + 27, 4, 2); // Tulang mainan

    // 5. Pagar Kayu Paddock (Post-and-Rail Fence)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 48, y);
    ctx.moveTo(x + 88, y);
    ctx.lineTo(x + penW, y);
    ctx.lineTo(x + penW, y + penH);
    ctx.lineTo(x, y + penH);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Tiang pagar kayu
    for (let px = x; px <= x + penW; px += 24) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px - 2, y - 2, 4, penH + 4);
    }

    // 6. Konter Loket Penjinak Mia di x + 46..90
    const cX = x + 46;
    const cY = y - 4;
    const cW = 44;

    // Kanopi Hijau Zamrud
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(cX - 2, cY - 14, cW + 4, 10, 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Penjinak Mia Berdiri di Balik Loket
    ctx.fillStyle = '#065f46'; // Rompi hijau
    ctx.fillRect(cX + cW / 2 - 5, cY - 2, 10, 10);
    ctx.fillStyle = '#fed7aa'; // Wajah
    ctx.fillRect(cX + cW / 2 - 4, cY - 8, 8, 7);
    ctx.fillStyle = '#f59e0b'; // Rambut pirang
    ctx.fillRect(cX + cW / 2 - 5, cY - 10, 10, 4);
    // Bando telinga rubah oranye
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(cX + cW / 2 - 5, cY - 10);
    ctx.lineTo(cX + cW / 2 - 2, cY - 14);
    ctx.lineTo(cX + cW / 2, cY - 10);
    ctx.moveTo(cX + cW / 2, cY - 10);
    ctx.lineTo(cX + cW / 2 + 2, cY - 14);
    ctx.lineTo(cX + cW / 2 + 5, cY - 10);
    ctx.fill();

    // Meja Loket Kayu
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cX, cY + 4, cW, 10);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cX + 1, cY + 4, cW - 2, 2.5);

    // Lonceng panggil & biskuit pet di konter
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cX + 6, y + 2, 5, 5);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cX + cW - 8, y + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Signboard
    this.drawFittedSignboard(ctx, cX + cW / 2, cY - 19, cW + 16, 11, '🐾 SUAKA SATWA MIA', '#0f172a', '#34d399', '#a7f3d0');
  }

  /**
   * Render Tiang Lentera Jalan Desa Klasik dengan Lampu Kaca Berulir & Cahaya Ambient Hangat
   */
  private drawStreetlamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 1. Bayangan Kaki Lentera di Tanah
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 23, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tiang Besi Hitam Tempa
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 2, y, 4, 22);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 1, y, 2, 22);

    // Kaki / Plinth Dasar Lentera
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y + 20, 8, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - 2, y + 19, 4, 1.5); // Ring emas

    // 3. Rumah Lentera Kaca Bersudut & Tudung Piramida Besi
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y - 5, 8, 6);
    // Tudung atap lentera
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x, y - 9);
    ctx.lineTo(x + 5, y - 5);
    ctx.closePath();
    ctx.fill();

    // Inti Api Mantle Lentera Menyala
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 2.5, y - 4, 5, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - 3, 2, 2);

    // 4. Cahaya Radial Hangat Lentera
    const flicker = Math.sin(this.animTimer * 1.5 + x) * 2;
    const grad = ctx.createRadialGradient(x, y - 2, 1, x, y - 2, 24 + flicker);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 2, 24 + flicker, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderNPC(ctx: CanvasRenderingContext2D, npc: VillageNPCData, playerCenterX: number, playerCenterY: number, isSuppressed: boolean = false): void {
    const x = Math.floor(npc.x);
    const y = Math.floor(npc.y);
    const isNear = Math.hypot(npc.x + npc.width / 2 - playerCenterX, npc.y + npc.height / 2 - playerCenterY) < 38;

    ctx.save();

    if (npc.isCat) {
      // Kucing Mimi (Animasi Lucu)
      const tailWag = Math.sin(this.animTimer * 2) * 3;
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 4, y + 8, 14, 8); // Badan
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y + 10, 8, 5); // Perut putih
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 14, y + 4, 8, 8); // Kepala
      // Telinga
      ctx.fillRect(x + 14, y + 2, 3, 3);
      ctx.fillRect(x + 19, y + 2, 3, 3);
      // Mata & Hidung
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 19, y + 6, 2, 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x + 21, y + 8, 1, 1);
      // Ekor meliuk
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 2, y + 6 + tailWag * 0.5, 3, 5);
    } else {
      // NPC Humanoid (Pixel Art Rapi)
      // 1. Kaki / Sepatu
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 9, y + 24, 4, 6);
      ctx.fillRect(x + 17, y + 24, 4, 6);

      // 2. Busana / Zirah Utama
      ctx.fillStyle = npc.outfitColor;
      ctx.fillRect(x + 8, y + 12, 14, 13);

      // 3. Wajah & Kulit
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x + 9, y + 5, 12, 8);

      // 4. Mata
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 12, y + 8, 2, 2);
      ctx.fillRect(x + 17, y + 8, 2, 2);

      // 5. Rambut / Topi / Mahkota
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 8, y + 2, 14, 5);
      if (npc.hairColor === '#f8fafc') {
        // Janggut putih tetua
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x + 11, y + 11, 8, 6);
      }

      // Aksesoris Karakter (Senjata / Tongkat / Keranjang)
      if (npc.id === 'galahad') {
        // Pedang ksatria
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 23, y + 8, 2, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 21, y + 12, 6, 2);
      } else if (npc.id === 'kaelen') {
        // Busur panah di punggung
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 5, y + 6, 2, 18);
      } else if (npc.id === 'ignis') {
        // Staf sihir kristal
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 23, y + 4, 2, 22);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(x + 24, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.id === 'aldrich') {
        // Tongkat jalan kayu
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 23, y + 10, 2, 18);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(x + 22, y + 9, 4, 2);
      }
    }

    // Nama & Gelap di atas kepala
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    const labelY = y - 6;
    ctx.strokeText(npc.name, x + npc.width / 2, labelY);
    ctx.fillStyle = npc.roleType === 'QUEST' ? '#fde047' : '#f8fafc';
    ctx.fillText(npc.name, x + npc.width / 2, labelY);

    // Indikator Interaksi Prompt [A] & Anime Emote Bubble saat dekat
    if (isNear && !isSuppressed && !this.isDialogOpen) {
      const bob = Math.sin(this.animTimer * 1.5) * 2.5;
      const promptY = y - 18 + bob;

      // Anime Emote Bubble di atas kepala NPC
      const emoteY = promptY - 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.arc(x + npc.width / 2, emoteY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = npc.accentColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const emoteIcon = npc.isCat ? '🐾' : (npc.roleType === 'QUEST' ? '📜' : '💬');
      ctx.fillText(emoteIcon, x + npc.width / 2, emoteY);

      // Prompt Box Interaksi Dinamis (Tidak akan ada teks yang keluar dari papan)
      ctx.font = 'bold 8.5px sans-serif';
      const promptTextWidth = ctx.measureText(npc.actionPrompt).width;
      const boxW = Math.max(80, promptTextWidth + 14);
      const boxX = x + npc.width / 2 - boxW / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(boxX, promptY - 9, boxW, 16, 4);
      ctx.fill();
      ctx.strokeStyle = npc.accentColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.actionPrompt, x + npc.width / 2, promptY - 1);
    }

    ctx.restore();
  }

  /**
   * Render RPG Dialog Modal di layar saat pemain berinteraksi dengan salah satu NPC
   */
  public renderDialogModal(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.isDialogOpen || !this.activeDialogNPC) return;

    ctx.save();
    const npc = this.activeDialogNPC;

    const modalWidth = Math.min(490, screenWidth - 20);
    const modalHeight = Math.min(270, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Reset touch hitboxes for accurate sync
    this.actionBtnRect = { x: 0, y: 0, w: 0, h: 0 };
    this.marketBtnRect = { x: 0, y: 0, w: 0, h: 0 };
    this.riddleOptRects = [];
    this.closeBtnRect = {
      x: modalX + modalWidth - 36,
      y: modalY + 3,
      w: 32,
      h: 28
    };

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Modal Box Frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 10);
    ctx.fill();

    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header Ribbon
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 2, modalY + 2, modalWidth - 4, 30);

    ctx.fillStyle = npc.accentColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const safeTitle = CanvasText.truncate(ctx, `[${npc.title}]`, modalWidth * 0.45);
    ctx.fillText(safeTitle, modalX + modalWidth - 38, modalY + 17);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11.5px sans-serif';
    ctx.textAlign = 'left';
    const maxNameW = modalWidth - ctx.measureText(safeTitle).width - 56;
    const safeName = CanvasText.truncate(ctx, `${npc.avatarIcon} ${npc.name}`, maxNameW);
    ctx.fillText(safeName, modalX + 14, modalY + 17);

    // Close button (X)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(modalX + modalWidth - 18, modalY + 17, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 17);

    // Content: Portrait Left, Speech & Quest Right
    const portSize = Math.min(54, modalWidth * 0.16);
    const portX = modalX + 14;
    const portY = modalY + 38;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(portX, portY, portSize, portSize);

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.avatarIcon, portX + portSize / 2, portY + portSize / 2);

    // Speech Text on Right
    const textX = portX + portSize + 12;
    const textW = modalWidth - portSize - 38;
    let textY = modalY + 38;

    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic bold 9.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const greetH = CanvasText.drawWrappedText(ctx, `"${npc.greetingText}"`, textX, textY, textW, 12.5, 2);
    textY += greetH + 4;

    const btnY = modalY + modalHeight - 38;
    const btnH = 28;

    // --- QUEST NPC PANEL KHUSUS ---
    if (npc.roleType === 'QUEST') {
      const q = this.getNPCQuest(npc);
      if (q) {
        const qBoxH = 54;
        const qBoxY = btnY - qBoxH - 8;
        const qBoxW = modalWidth - 28;
        const qBoxX = modalX + 14;

        // Draw Lore Text safely before quest box
        const availLoreH = qBoxY - textY - 4;
        const maxLoreLines = Math.max(1, Math.min(2, Math.floor(availLoreH / 12)));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 12, maxLoreLines);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(qBoxX, qBoxY, qBoxW, qBoxH);
        ctx.strokeStyle = q.themeColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(qBoxX, qBoxY, qBoxW, qBoxH);

        // Quest Title & Badge
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const safeQTitle = CanvasText.truncate(ctx, `📜 Misi: ${q.title}`, qBoxW - 130);
        ctx.fillText(safeQTitle, qBoxX + 8, qBoxY + 6);

        let statusText = 'TERSEDIA';
        let statusColor = '#38bdf8';
        if (q.status === 'ACTIVE') {
          statusText = `BERJALAN (${q.currentCount}/${q.requiredCount})`;
          statusColor = '#facc15';
        } else if (q.status === 'COMPLETED') {
          statusText = '★ SIAP KLAIM';
          statusColor = '#4ade80';
        } else if (q.status === 'TURNED_IN') {
          statusText = '✓ SELESAI';
          statusColor = '#94a3b8';
        }

        ctx.fillStyle = statusColor;
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`[${statusText}]`, qBoxX + qBoxW - 8, qBoxY + 6);

        // Quest Target & Rewards
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left';
        const safeQTarget = CanvasText.truncate(ctx, `Target: ${q.targetName} (${q.currentCount}/${q.requiredCount})`, qBoxW - 16);
        ctx.fillText(safeQTarget, qBoxX + 8, qBoxY + 22);

        ctx.fillStyle = '#fde047';
        let rewStr = q.rewardGold > 0 ? `Hadiah: +${q.rewardGold} Emas` : 'Hadiah:';
        if (q.rewardVal) {
          rewStr = rewStr === 'Hadiah:' ? `Hadiah: +${q.rewardVal} 𝒱` : `${rewStr} · +${q.rewardVal} 𝒱`;
        }
        rewStr += ` · +${q.rewardExp} EXP`;
        const safeQReward = CanvasText.truncate(ctx, rewStr, qBoxW - 16);
        ctx.fillText(safeQReward, qBoxX + 8, qBoxY + 36);

        // Action Button
        const btnW = Math.min(190, modalWidth - 40);
        const btnX = modalX + (modalWidth - btnW) / 2;
        this.actionBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        let btnLabel = 'TERIMA MISI INI';
        let btnBg = '#16a34a';
        let btnBorder = '#4ade80';

        if (q.status === 'ACTIVE') {
          btnLabel = 'MISI SEDANG BERJALAN';
          btnBg = '#ca8a04';
          btnBorder = '#fef08a';
        } else if (q.status === 'COMPLETED') {
          btnLabel = '🎁 KLAIM SEMUA HADIAH!';
          btnBg = '#0284c7';
          btnBorder = '#38bdf8';
        } else if (q.status === 'TURNED_IN') {
          btnLabel = '✓ MISI SELESAI (TUTUP)';
          btnBg = '#334155';
          btnBorder = '#64748b';
        }

        ctx.fillStyle = btnBg;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = btnBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);
      }
    } else if (npc.roleType === 'RIDDLE' && npc.riddleId) {
      const isAlreadyUnlocked =
        (npc.riddleId === 'ELDORIA' && this.isEldoriaUnlocked) ||
        (npc.riddleId === 'STONEWATCH' && this.isStonewatchUnlocked);

      if (isAlreadyUnlocked) {
        const boxH = 48;
        const boxY = btnY - boxH - 8;
        const boxW = modalWidth - 28;
        const boxX = modalX + 14;

        // Lore text before solved box
        const availLoreH = boxY - textY - 4;
        const maxLoreLines = Math.max(1, Math.min(2, Math.floor(availLoreH / 12)));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 12, maxLoreLines);

        ctx.fillStyle = '#064e3b';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('✨ PINTU GERBANG DUNGEON TELAH TERBUKA!', boxX + boxW / 2, boxY + 10);
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '8.5px sans-serif';
        const safeOpenDesc = CanvasText.truncate(ctx, 'Segel telah terpecahkan! Masuki gerbang untuk menjelajah.', boxW - 16);
        ctx.fillText(safeOpenDesc, boxX + boxW / 2, boxY + 28);

        // Tombol Tutup
        const btnW = Math.min(180, modalWidth - 40);
        const btnX = modalX + (modalWidth - btnW) / 2;
        this.actionBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.fillStyle = '#065f46';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓ MENGERTI / JELAJAHI', btnX + btnW / 2, btnY + btnH / 2);
      } else {
        // Tampilkan Box Teka-Teki Kuno & 3 Pilihan Jawaban tanpa overlap
        const optW = modalWidth - 28;
        const optH = 22;
        const optGap = 4;
        const optX = modalX + 14;
        const optStartY = btnY - (2 * (optH + optGap));

        const riddleBoxH = 34;
        const riddleBoxY = optStartY - riddleBoxH - 6;
        const riddleBoxX = modalX + 14;
        const riddleBoxW = modalWidth - 28;

        // Lore text before riddle box
        const availLoreH = riddleBoxY - textY - 4;
        const maxLoreLines = Math.max(1, Math.min(2, Math.floor(availLoreH / 12)));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 12, maxLoreLines);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(riddleBoxX, riddleBoxY, riddleBoxW, riddleBoxH);
        ctx.strokeStyle = npc.accentColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(riddleBoxX, riddleBoxY, riddleBoxW, riddleBoxH);

        const isEldoria = npc.riddleId === 'ELDORIA';
        const riddleVerse = isEldoria
          ? '📜 "Bertumbuh tanpa kaki, berakar ke bumi, nafas seisi rimba. Apakah aku?"'
          : '📜 "Lahir di perut bumi, ditempa di bara api, perisai kurcaci. Apakah aku?"';

        ctx.fillStyle = '#fef08a';
        ctx.font = 'italic bold 8.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        CanvasText.drawWrappedText(ctx, riddleVerse, riddleBoxX + 8, riddleBoxY + 5, riddleBoxW - 16, 11.5, 2);

        const options = isEldoria
          ? [
              'A) 🌿 Pohon Purba (Akar Kehidupan Rimba)',
              'B) 💎 Kristal Ajaib Gua Bawah Tanah',
              'C) ⚔️ Pedang Baja Milik Ksatria'
            ]
          : [
              'A) ⚒️ Batangan Besi Abisal (Logam Kurcaci)',
              'B) 💰 Tumpukan Koin Emas Tambang',
              'C) 🔥 Kobaran Api Tungku Peleburan'
            ];

        for (let i = 0; i < 3; i++) {
          const optY = optStartY + i * (optH + optGap);
          this.riddleOptRects.push({ x: optX, y: optY, w: optW, h: optH });

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(optX, optY, optW, optH);
          ctx.strokeStyle = i === 0 ? '#38bdf8' : '#475569';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(optX, optY, optW, optH);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const safeOpt = CanvasText.truncate(ctx, options[i], optW - 16);
          ctx.fillText(safeOpt, optX + 8, optY + optH / 2);
        }
      }
    } else {
      // Ambient NPC: Button Tutup / Mengerti (Khusus Marco Saudagar ada tombol Buka Pasar)
      if (npc.id === 'marco_merchant') {
        const gap = 8;
        const btnW = Math.min(130, Math.floor((modalWidth - 40 - gap) / 2));
        const marketX = modalX + Math.floor((modalWidth - (btnW * 2 + gap)) / 2);
        const closeX = marketX + btnW + gap;

        this.marketBtnRect = { x: marketX, y: btnY, w: btnW, h: btnH };
        this.actionBtnRect = { x: closeX, y: btnY, w: btnW, h: btnH };

        const availLoreH = btnY - textY - 8;
        const maxLoreLines = Math.max(1, Math.min(5, Math.floor(availLoreH / 13)));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9.5px sans-serif';
        CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 13, maxLoreLines);

        // Tombol Buka Pasar
        ctx.fillStyle = '#15803d';
        ctx.fillRect(marketX, btnY, btnW, btnH);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(marketX, btnY, btnW, btnH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛒 BUKA PASAR', marketX + btnW / 2, btnY + btnH / 2);

        // Tombol Tutup
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(closeX, btnY, btnW, btnH);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(closeX, btnY, btnW, btnH);

        ctx.fillStyle = '#f8fafc';
        ctx.fillText('✕ TUTUP', closeX + btnW / 2, btnY + btnH / 2);
      } else {
        const btnW = Math.min(160, modalWidth - 40);
        const btnX = modalX + (modalWidth - btnW) / 2;
        this.actionBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        this.marketBtnRect = { x: 0, y: 0, w: 0, h: 0 };

        // Lore text strictly bound inside vertical space before button
        const availLoreH = btnY - textY - 8;
        const maxLoreLines = Math.max(1, Math.min(5, Math.floor(availLoreH / 13)));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9.5px sans-serif';
        CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 13, maxLoreLines);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = npc.accentColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕ MENGERTI / TUTUP', btnX + btnW / 2, btnY + btnH / 2);
      }
    }

    ctx.restore();
  }
}
