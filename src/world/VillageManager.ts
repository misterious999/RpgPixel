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
        prompt: 'Tekan [A] Belanja di Toko Serba Ada Marco 🛒'
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
        prompt: 'Tekan [A] Masuk Kedai Kuliner Chef Gaston 🍲'
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
        prompt: 'Tekan [A] Kunjungi Paviliun Arkana Luna 🔮'
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
        prompt: 'Tekan [A] Belanja di Kios Senjata Gareth ⚔️'
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
        prompt: 'Tekan [A] Kunjungi Suaka & Toko Pet Mia 🐾'
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
        greetingText: 'Selamat datang di Desa Oakhaven, pahlawan muda!',
        loreText: 'Desa kami makmur berkat perlindungan Serikat Guild di alun-alun tengah. Warga desa selalu menyambut petualang ramah seperti dirimu dengan tangan terbuka.',
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
        greetingText: 'Berhenti sejenak, kawan! Gerbang Selatan di bawah pengawasanku.',
        loreText: 'Desa Oakhaven adalah zona aman netral. Namun berhati-hatilah saat melangkah ke luar batas gerbang, banyak monster liar mengintai di alam bebas.',
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

    // 1. Air Mancur Alun-alun Desa (Center: 50*ts + 16, 52*ts + 16)
    const fx = 49.5 * ts;
    const fy = 51.5 * ts;
    const fw = 42;
    const fh = 42;
    if (box.x < fx + fw && box.x + box.width > fx && box.y < fy + fh && box.y + box.height > fy) {
      return true;
    }

    // 2. Balai Desa / Rumah Kakek Aldrich (Barat Laut: 43*ts, 44*ts)
    const h1x = 42.5 * ts;
    const h1y = 43 * ts;
    const h1w = 76;
    const h1h = 64;
    if (box.x < h1x + h1w && box.x + box.width > h1x && box.y < h1y + h1h && box.y + box.height > h1y + 24) {
      return true;
    }

    // 3. Toko Bunga Lily (Timur Laut: 56.5*ts, 43*ts)
    const h2x = 56 * ts;
    const h2y = 43 * ts;
    const h2w = 74;
    const h2h = 64;
    if (box.x < h2x + h2w && box.x + box.width > h2x && box.y < h2y + h2h && box.y + box.height > h2y + 24) {
      return true;
    }

    // 3.5 Bengkel Pandai Besi Brokk (Barat Daya Balai: 44.8*ts, 47*ts)
    const bsX = 44.8 * ts;
    const bsY = 47 * ts;
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

    // 4. Kedai Petualang Oakhaven (Tenggara: 56*ts, 51.5*ts)
    const h3x = 56 * ts;
    const h3y = 51 * ts;
    const h3w = 78;
    const h3h = 66;
    if (box.x < h3x + h3w && box.x + box.width > h3x && box.y < h3y + h3h && box.y + box.height > h3y + 24) {
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
  public renderEnvironment(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    ctx.save();

    // 1. ARSITEKTUR BALAI BESAR SERIKAT GUILD (Tepat di tengah desa: 50*ts, 48*ts)
    const gx = 50 * ts - 24;
    const gy = 47 * ts - 8;
    const gw = 80;
    const gh = 52;

    // Guild Grand Wooden Flooring
    ctx.fillStyle = '#451a03';
    ctx.fillRect(gx - 4, gy + 14, gw + 8, gh - 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gx - 2, gy + 16, gw + 4, gh - 14);

    // Carved Guild Stone Pillars
    const pillY = gy + 14;
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx - 2, pillY, 8, gh - 14);
    ctx.fillRect(gx + gw - 6, pillY, 8, gh - 14);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(gx, pillY, 4, gh - 14);
    ctx.fillRect(gx + gw - 4, pillY, 4, gh - 14);

    // Guild Roof Eaves & Canopy (Royal Blue with Golden Trim)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(gx - 8, gy + 18);
    ctx.lineTo(gx + gw / 2, gy - 6);
    ctx.lineTo(gx + gw + 8, gy + 18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Guild Royal Emblem Ribbon
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(gx + 12, gy + 14, gw - 24, 7);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ SERIKAT GUILD OAKHAVEN ★', gx + gw / 2, gy + 19.5);

    // Papan Pengumuman Misi Serikat (Notice Board) di kanan
    const nbX = 53 * ts + 18;
    const nbY = 48 * ts + 4;
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
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gxGate - 6, gyGate, 8, 38);
    ctx.fillRect(gxGate + 54, gyGate, 8, 38);
    // Arch Beam
    ctx.fillStyle = '#92400e';
    ctx.fillRect(gxGate - 8, gyGate - 4, 72, 8);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GERBANG DESA OAKHAVEN', gxGate + 28, gyGate + 2);

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

    // 12. RENDER SELURUH NPC DESA (Quest, Ambient, & Riddle)
    for (const npc of this.npcs) {
      if (npc.isInsideBuilding) continue;
      this.renderNPC(ctx, npc, playerCenterX, playerCenterY);
    }

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
    // Post
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 2, y, 4, 18);
    // Board
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(x - 38, y - 8, 76, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Text
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 2);
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

  private drawCottage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    roofColor: string,
    wallColor: string,
    nameTag: string
  ): void {
    // Stone foundation
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

    // Wooden timber walls
    ctx.fillStyle = wallColor;
    ctx.fillRect(x + 4, y + 20, w - 8, h - 28);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 4, y + 20, 4, h - 28);
    ctx.fillRect(x + w - 8, y + 20, 4, h - 28);

    // Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w / 2 - 8, y + h - 26, 16, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + w / 2 + 3, y + h - 14, 2, 2); // Doorknob

    // Shuttered Windows
    ctx.fillStyle = '#fde047'; // Warm glowing window
    ctx.fillRect(x + 12, y + 28, 12, 12);
    ctx.fillRect(x + w - 24, y + 28, 12, 12);
    ctx.fillStyle = '#78350f';
    ctx.strokeRect(x + 12, y + 28, 12, 12);
    ctx.strokeRect(x + w - 24, y + 28, 12, 12);

    // Pitched Roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 22);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 4, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Chimney with animated smoke
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + w - 16, y - 6, 8, 14);
    const smokeBob = Math.sin(this.animTimer + x) * 2;
    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.beginPath();
    ctx.arc(x + w - 12 + smokeBob, y - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Signpost Plaque
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 6, y + h - 4, w - 12, 12);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(x + 6, y + h - 4, w - 12, 12);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(nameTag, x + w / 2, y + h + 4);
  }

  /**
   * Render Bangunan Bank Kerajaan Oakhaven (Atap Kubah Biru Safir & Lis Emas, Fasad Marmer Putih, Pilar Romawi & Lambang Koin Emas)
   */
  private drawBankBuilding(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // 1. Fondasi Marmer Putih Abu-abu
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + h - 2, w - 4, 2);

    // 2. Fasad Dinding Marmer Putih
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 20, w - 8, h - 28);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 4, y + 20, w - 8, h - 28);

    // 3. Pilar Marmer Romawi di Kiri dan Kanan Pintu Fasad
    const pX1 = x + 8;
    const pX2 = x + w - 16;
    for (const px of [pX1, pX2]) {
      // Column
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, y + 20, 8, h - 28);
      // Gold capital & base
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, y + 20, 10, 3);
      ctx.fillRect(px - 1, y + h - 11, 10, 3);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px, y + 20, 8, h - 28);
    }

    // 4. Jendela Kaca Kisi Emas
    const jx1 = x + 18;
    const jx2 = x + w - 28;
    const jy = y + 28;
    for (const jx of [jx1, jx2]) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(jx, jy, 10, 14);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(jx + 2, jy + 2, 6, 4);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(jx, jy, 10, 14);
    }

    // 5. Pintu Masuk Kayu Mahoni Tebal Bertabur Paku Emas
    const doorW = 20;
    const doorH = 26;
    const doorX = x + w / 2 - doorW / 2;
    const doorY = y + h - doorH - 4;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(doorX, doorY, doorW, doorH);
    // Gold Studs
    ctx.fillStyle = '#facc15';
    ctx.fillRect(doorX + 3, doorY + 6, 2, 2);
    ctx.fillRect(doorX + doorW - 5, doorY + 6, 2, 2);
    ctx.fillRect(doorX + 3, doorY + 16, 2, 2);
    ctx.fillRect(doorX + doorW - 5, doorY + 16, 2, 2);

    // 6. Atap Pedimen Segitiga Biru Safir & Lis Emas Kerajaan
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 22);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.lineTo(x + w + 2, y + 22);
    ctx.closePath();
    ctx.fill();

    // Lis Emas Atap
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 7. Lambang Koin Emas Val di Tengah Pedimen Atap
    const crestX = x + w / 2;
    const crestY = y + 11;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(crestX, crestY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝒱', crestX, crestY + 0.5);

    // 8. Plakat Papan Nama Bank Emas di Atas Pintu
    const badgeW = 68;
    const badgeH = 11;
    const badgeX = x + w / 2 - badgeW / 2;
    const badgeY = doorY - 14;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6px sans-serif';
    ctx.fillText('🏛️ BANK KERAJAAN VAL', x + w / 2, badgeY + badgeH / 2 + 0.5);
  }

  /**
   * Render Bangunan Bengkel Pandai Besi Master Brokk di Oakhaven (Atap Slate Arang, Dinding Batu Basalt, Cerobong Asap & Plang Anvil)
   */
  private drawBlacksmithWorkshop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // 1. Dark Charred Basalt Stone Foundation
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

    // 2. Heavy Masonry Stone Walls (Charcoal Grey Basalt)
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, y + 20, w - 8, h - 28);

    // Stone Pillar Bracing on Corners
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 4, y + 20, 6, h - 28);
    ctx.fillRect(x + w - 10, y + 20, 6, h - 28);

    // Stone brick lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 4, y + 20, w - 8, h - 28);

    // 3. Fiery Forge Glowing Window (Kiri: jendela tempa memperlihatkan api jingga)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 12, y + 28, 14, 13);
    const forgeFlicker = Math.sin(this.animTimer * 8) * 1.5;
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 14, y + 30 + forgeFlicker, 10, 8);
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 12, y + 28, 14, 13);
    // Iron Window Grille
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 18, y + 28, 2, 13);
    ctx.fillRect(x + 12, y + 34, 14, 2);

    // 4. Heavy Reinforced Iron-Banded Oak Door at bottom center (pintu masuk ke interior)
    const doorX = x + w / 2 - 8;
    const doorY = y + h - 26;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(doorX, doorY, 16, 24);
    // Iron banding on door
    ctx.fillStyle = '#475569';
    ctx.fillRect(doorX, doorY + 4, 16, 2.5);
    ctx.fillRect(doorX, doorY + 14, 16, 2.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(doorX + 11, doorY + 11, 2.5, 2.5); // Brass handle

    // Stone Archway Over Door
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(doorX - 1, doorY - 1, 18, 25);

    // 5. Heavy Slate Charcoal Pitched Roof
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 22);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.lineTo(x + w + 5, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Secondary roof trim
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 4, y + 20, w + 8, 3);

    // 6. Massive Stone Chimney with Blazing Fire & Rising Smoke/Embers
    const chimX = x + w - 18;
    const chimY = y - 10;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(chimX, chimY, 10, 18);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(chimX, chimY, 10, 18);
    // Fiery orange rim at chimney opening
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(chimX + 1, chimY - 2, 8, 3);

    // Animated Smoke & Spark Particles
    const smokeWave = Math.sin(this.animTimer * 2 + x) * 3;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.beginPath();
    ctx.arc(chimX + 5 + smokeWave, chimY - 6, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(chimX + 7 - smokeWave, chimY - 14, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // Glowing orange ember spark
    const emberY = chimY - 10 - ((this.animTimer * 20) % 16);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(chimX + 4 + Math.sin(this.animTimer * 6) * 4, emberY, 2, 2);

    // 7. Hanging Anvil Signpost (⚒️ Plang Besi Tempa)
    const signX = x + w - 24;
    const signY = y + 26;
    // Sign bracket
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(signX, signY - 2, 14, 2);
    // Mini hanging sign board
    ctx.fillStyle = '#451a03';
    ctx.fillRect(signX + 2, signY + 2, 12, 10);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(signX + 2, signY + 2, 12, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚒️', signX + 8, signY + 10);

    // 8. Outdoor Props: Tong Air Pendingin & Tumpukan Batangan Besi
    // Quenching tub on the right
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w - 8, y + h - 16, 10, 12);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + w - 7, y + h - 15, 8, 3);
    // Iron ingots stack on the left
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 5, y + h - 10, 8, 4);
    ctx.fillRect(x - 3, y + h - 14, 6, 4);

    // 9. Signpost Plaque: "BENGKEL TEMPA BROKK"
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(x + 4, y + h - 4, w - 8, 12);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + h - 4, w - 8, 12);
    ctx.fillStyle = '#fdba74';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚒️ BENGKEL TEMPA BROKK', x + w / 2, y + h + 4);
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
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x - 68, topY - 14, 136, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎪 DISTRIK PASAR RAYA (GRAND BAZAAR)', x, topY - 6);

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

    // Cobblestone ground rug
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // Left Side Potion Barrel
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 6, y + 18, 10, 14);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 6, y + 22, 10, 2);
    ctx.fillRect(x - 6, y + 27, 10, 2);

    // Right Side Fruit Crate
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + w - 2, y + 20, 12, 12);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + w + 2, y + 19, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + w + 6, y + 19, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Merchant Marco standing behind counter
    ctx.fillStyle = '#047857'; // Green Apron
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    ctx.fillStyle = '#fde047'; // Straw Hat
    ctx.fillRect(x + w / 2 - 8, y - 5, 16, 3);
    ctx.fillRect(x + w / 2 - 5, y - 8, 10, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + w / 2 - 5, y - 5, 10, 1.5);

    // Wooden Posts
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 4, 4, h - 4);
    ctx.fillRect(x + w - 6, y + 4, 4, h - 4);

    // Striped Awning (Red & Yellow)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fef08a';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW - 2, y + 14);
      ctx.lineTo(x + i * stripeW - 2, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 1, y + 14, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Counter & Goods
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 3, y + 16, w - 6, 3);

    // Ramuan HP & MP di meja
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 10, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 20, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 28, y + 16, 8, 3); // Scroll

    // Signboard
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x + 6, y - 4, w - 12, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛒 SERBA ADA MARCO', x + w / 2, y + 0.5);
  }

  /**
   * 2. Kedai Kuliner Chef Gaston (Makanan Penguat Status & Daging Serigala)
   */
  private drawFoodTavernGaston(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 62;
    const h = 32;

    // Terracotta warm brick paving
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // Left Side Iron Stew Cauldron with bubbling steam
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x - 4, y + 24, 7, 0, Math.PI * 2);
    ctx.fill();
    // Fire under cauldron
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 6, y + 30, 4, 3);
    const steamWave = Math.sin(this.animTimer * 4 + x) * 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(x - 4 + steamWave, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Side Roasting Spit with meat skewer
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 16, 2, 16);
    ctx.fillRect(x + w + 10, y + 16, 2, 16);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + w - 2, y + 20, 16, 4); // Sizzling meat skewer

    // Chef Gaston standing behind counter
    ctx.fillStyle = '#ffffff'; // White Chef Jacket
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#dc2626'; // Red necktie
    ctx.fillRect(x + w / 2 - 2, y + 8, 4, 5);
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    // Handlebar Moustache
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w / 2 - 5, y + 3, 10, 2);
    // Tall White Chef Toque Hat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - 5, y - 8, 10, 6);
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Posts
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 2, y + 4, 4, h - 4);
    ctx.fillRect(x + w - 6, y + 4, 4, h - 4);

    // Striped Awning (Orange & White)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW - 2, y + 14);
      ctx.lineTo(x + i * stripeW - 2, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 1, y + 14, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Counter & Food display
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 3, y + 16, w - 6, 3);

    // Food dishes on counter (Steak, pudding, soup bowl)
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(x + 10, y + 17, 8, 3); // Steak plate
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 26, y + 18, 3, 0, Math.PI * 2); // Slime pudding
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 40, y + 18, 3, 0, Math.PI * 2); // Herbal soup
    ctx.fill();

    // Signboard
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x + 6, y - 4, w - 12, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍲 KEDAI KULINER GASTON', x + w / 2, y + 0.5);
  }

  /**
   * 3. Paviliun Arkana Sorceress Luna (Sihir, Gulungan & Kristal Abisal)
   */
  private drawArcanePavilionLuna(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 58;
    const h = 32;

    // Deep purple mystical magic circle rug
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - 6, y + 18, w + 12, 14);

    // Left Side Floating Glowing Crystal Orb on Pedestal
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

    // Right Side Lectern with Open Grimoire
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 18, 4, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + w - 4, y + 16, 12, 6);
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(x + w + 1, y + 16, 2, 6);

    // Sorceress Luna standing behind counter
    ctx.fillStyle = '#4c1d95'; // Violet Robes
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    // Pointed Wizard Hat with golden crescent
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 11);
    ctx.lineTo(x + w / 2 + 8, y - 4);
    ctx.lineTo(x + w / 2 - 8, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + w / 2 - 8, y - 4, 16, 2);

    // Wooden Posts
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(x + 2, y + 4, 4, h - 4);
    ctx.fillRect(x + w - 6, y + 4, 4, h - 4);

    // Canopy (Deep Violet & Gold silk stripes)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#581c87' : '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW - 2, y + 14);
      ctx.lineTo(x + i * stripeW - 2, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 1, y + 14, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Counter & Arcane Items
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(x + 3, y + 16, w - 6, 3);

    // Crystal Gem & Arcane Scroll on counter
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(x + 14, y + 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 26, y + 16, 8, 3); // Portal Scroll

    // Signboard
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + 6, y - 4, w - 12, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔮 ARKANA LUNA', x + w / 2, y + 0.5);
  }

  /**
   * 4. Kios Persenjataan Gareth (Senjata, Logam & Perkakas Ekspedisi)
   */
  private drawArmoryGareth(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 58;
    const h = 32;

    // Dark slate stone paving
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 8, y + 16, w + 16, 18);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 6, y + 18, w + 12, 14);

    // Left Side Mini Anvil & Hammer
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 6, y + 24, 10, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 8, y + 22, 14, 3);

    // Right Side Weapon Rack with crossed sword & shield
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w, y + 16, 2, 16);
    ctx.fillRect(x + w + 10, y + 16, 2, 16);
    // Steel Shield
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(x + w + 5, y + 23, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + w + 4, y + 20, 2, 6);

    // Pengrajin Gareth standing behind counter
    ctx.fillStyle = '#451a03'; // Heavy Leather Vest
    ctx.fillRect(x + w / 2 - 6, y + 6, 12, 12);
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 8);
    ctx.fillStyle = '#334155'; // Short Brown Hair
    ctx.fillRect(x + w / 2 - 5, y - 4, 10, 4);

    // Wooden Posts
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y + 4, 4, h - 4);
    ctx.fillRect(x + w - 6, y + 4, 4, h - 4);

    // Striped Awning (Charcoal Slate & Steel Blue)
    const stripes = 7;
    const stripeW = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#334155' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW, y + 4);
      ctx.lineTo(x + (i + 1) * stripeW - 2, y + 14);
      ctx.lineTo(x + i * stripeW - 2, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + i * stripeW + stripeW / 2 - 1, y + 14, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Counter & Display Goods
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 2, y + 16, w - 4, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 3, y + 16, w - 6, 3);

    // Dark Iron Ingot on counter
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 10, y + 17, 8, 3);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 11, y + 16, 6, 2);

    // Dagger on counter
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 24, y + 17, 10, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 22, y + 16.5, 3, 3);

    // Signboard
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + 6, y - 4, w - 12, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚔️ SENJATA GARETH', x + w / 2, y + 0.5);
  }

  /**
   * 5. Suaka Satwa & Toko Hewan Penjinak Mia (Paddock Peliharaan, Kandang & Pet Playpen)
   */
  private drawPetSanctuaryMia(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    const penW = 7 * ts;
    const penH = 3.5 * ts;

    // Lush green meadow pen grass
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y, penW, penH);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x + 4, y + 4, penW - 8, penH - 8);

    // Red-roofed wooden pet shelter / doghouse in top-right of pen
    const shX = x + penW - 44;
    const shY = y + 4;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(shX, shY + 8, 36, 24);
    // Dark doorway into doghouse
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(shX + 18, shY + 24, 7, Math.PI, 0, false);
    ctx.lineTo(shX + 25, shY + 32);
    ctx.lineTo(shX + 11, shY + 32);
    ctx.closePath();
    ctx.fill();
    // Red pitched roof
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(shX - 4, shY + 8);
    ctx.lineTo(shX + 18, shY - 4);
    ctx.lineTo(shX + 40, shY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Water trough & Hay bedding in pen
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 10, y + penH - 20, 18, 10);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 12, y + penH - 18, 14, 6);

    // Baby pet 1: Puni (bouncing mini slime)
    const slimeBob = Math.sin(this.animTimer * 6) * 3;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 40, y + 24 + slimeBob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 39, y + 23 + slimeBob, 1.5, 1.5);
    ctx.fillRect(x + 42, y + 23 + slimeBob, 1.5, 1.5);

    // Baby pet 2: Lobo (puppy playing with bone)
    const wolfWag = Math.sin(this.animTimer * 12) * 3;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 70, y + 26, 8, 5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 74, y + 23, 6, 6);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 67, y + 25 + wolfWag * 0.4, 3, 2); // Tail
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 82, y + 27, 4, 2); // Bone toy

    // Wooden post-and-rail fence around the pen
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    // Top fence (left and right of Mia's counter)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 48, y);
    ctx.moveTo(x + 88, y);
    ctx.lineTo(x + penW, y);
    // Right fence
    ctx.lineTo(x + penW, y + penH);
    // Bottom fence
    ctx.lineTo(x, y + penH);
    // Left fence
    ctx.lineTo(x, y);
    ctx.stroke();

    // Fence Posts
    for (let px = x; px <= x + penW; px += 24) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px - 2, y - 2, 4, penH + 4);
    }

    // Mia's Reception Counter (Pintu Masuk Suaka di x + 48..88)
    const cX = x + 46;
    const cY = y - 4;
    const cW = 44;

    // Green Striped Awning over counter
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(cX - 2, cY - 14, cW + 4, 10, 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Penjinak Mia standing behind the reception desk
    ctx.fillStyle = '#065f46'; // Green Hunter Vest
    ctx.fillRect(cX + cW / 2 - 5, cY - 2, 10, 10);
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(cX + cW / 2 - 4, cY - 8, 8, 7);
    ctx.fillStyle = '#f59e0b'; // Blonde hair
    ctx.fillRect(cX + cW / 2 - 5, cY - 10, 10, 4);
    // Cute Fox/Cat Ears Headband
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(cX + cW / 2 - 5, cY - 10);
    ctx.lineTo(cX + cW / 2 - 2, cY - 14);
    ctx.lineTo(cX + cW / 2, cY - 10);
    ctx.moveTo(cX + cW / 2, cY - 10);
    ctx.lineTo(cX + cW / 2 + 2, cY - 14);
    ctx.lineTo(cX + cW / 2 + 5, cY - 10);
    ctx.fill();

    // Wooden Counter Table
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cX, cY + 4, cW, 10);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cX + 1, cY + 4, cW - 2, 2.5);

    // Treat Bag & Pet Bell on counter
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cX + 6, y + 2, 5, 5); // Treat bag
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cX + cW - 8, y + 4, 2.5, 0, Math.PI * 2); // Bell
    ctx.fill();

    // Signboard Atas
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cX - 6, cY - 24, cW + 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐾 SUAKA SATWA MIA', cX + cW / 2, cY - 19);
  }

  private drawStreetlamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Lamp pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 2, y, 4, 22);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 4, y + 20, 8, 3);

    // Lantern Bracket & Glass
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y - 4, 8, 5);

    // Warm radial glow
    const flicker = Math.sin(this.animTimer * 1.5 + x) * 2;
    const grad = ctx.createRadialGradient(x, y - 1, 2, x, y - 1, 22 + flicker);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 1, 22 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Lantern core bulb
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  private renderNPC(ctx: CanvasRenderingContext2D, npc: VillageNPCData, playerCenterX: number, playerCenterY: number): void {
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
    if (isNear) {
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
        let rewStr = `Hadiah: +${q.rewardGold} Emas`;
        if (q.rewardVal) rewStr += ` · +${q.rewardVal} 𝒱`;
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
