import { CONSTANTS } from './Constants.ts';
import { Camera } from './Camera.ts';
import { InputManager } from './Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { Player } from '../entities/Player.ts';
import { WorldItem } from '../world/WorldItem.ts';
import { Chest } from '../world/Chest.ts';
import { GuildNPC } from '../world/GuildNPC.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { InventoryUI } from '../ui/InventoryUI.ts';
import { AuthUI } from '../ui/AuthUI.ts';
import { SkillBarUI } from '../ui/SkillBarUI.ts';
import { OnboardingUI } from '../ui/OnboardingUI.ts';
import { ControlSettingsModal } from '../ui/ControlSettingsModal.ts';
import { ControlSettingsManager } from './ControlSettings.ts';
import { SupabaseService } from '../services/SupabaseService.ts';
import { PwaService } from '../services/PwaService.ts';
import { NotificationModal } from '../ui/NotificationModal.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';
import { ROLE_INFO, CHARACTER_COSTUMES } from '../data/RolesData.ts';
import { UpdateService } from '../services/UpdateService.ts';
import { CaveEntrance } from '../world/CaveEntrance.ts';
import { DungeonMap } from '../world/DungeonMap.ts';
import { Monster } from '../entities/Monster.ts';
import { BlacksmithNPC } from '../world/BlacksmithNPC.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { QuestManager } from '../world/QuestManager.ts';
import { MiniMapUI } from '../ui/MiniMapUI.ts';
import { QuickPotionUI } from '../ui/QuickPotionUI.ts';
import { VillageManager } from '../world/VillageManager.ts';
import { AtmosphereEngine } from '../world/AtmosphereEngine.ts';
import { TimeWeatherEngine } from '../world/TimeWeatherEngine.ts';
import { DungeonFloor2 } from '../world/DungeonFloor2.ts';
import { Companion, CompanionType, COMPANIONS_DATA } from '../entities/Companion.ts';
import { CookingSystem } from '../systems/CookingSystem.ts';
import { Pet, PetType, PET_DATA } from '../systems/TamingSystem.ts';
import { TitleSystem } from '../systems/TitleSystem.ts';
import { LeaderboardUI } from '../ui/LeaderboardUI.ts';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private camera: Camera;
  private tileMap: TileMap;
  private player: Player;
  private floatingText: FloatingTextManager;
  private inventoryUI: InventoryUI;
  private authUI: AuthUI;
  private skillBarUI: SkillBarUI;
  private onboardingUI: OnboardingUI;
  private controlSettingsModal: ControlSettingsModal;

  // Audio, Quests, Mini-Map, Quick Potion & Anime Atmosphere
  private questManager: QuestManager;
  private miniMapUI: MiniMapUI;
  private quickPotionUI: QuickPotionUI;
  private atmosphereEngine: AtmosphereEngine;
  private transitionCooldown: number = 0;

  // Combat Impact Sparks & Anime Skill Invocation Banner
  private hitSparks: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number }[] = [];
  private activeSkillBanner: { name: string; color: string; role: string; timer: number; maxTimer: number } | null = null;

  // Map & Dungeon state
  public currentMap: 'OVERWORLD' | 'DUNGEON' | 'DUNGEON_FLOOR_2' = 'OVERWORLD';
  private caveEntrance: CaveEntrance;
  private dungeonMap: DungeonMap;
  private dungeonMonsters: Monster[] = [];
  private dungeonChests: Chest[] = [];
  private dungeonWorldItems: WorldItem[] = [];

  // Dungeon Floor 2 (Ancient Crypt Ruins)
  private dungeonFloor2: DungeonFloor2 = new DungeonFloor2();
  private floor2Monsters: Monster[] = [];
  private floor2WorldItems: WorldItem[] = [];

  // Day/Night & Weather Engine
  public timeWeatherEngine: TimeWeatherEngine = new TimeWeatherEngine();

  // Adventurer Party Companion & Auto-Loot Pet
  public companion: Companion | null = null;
  public pet: Pet | null = null;

  // Cooking, Titles & Leaderboard Systems
  private cookingSystem: CookingSystem = new CookingSystem();
  private titleSystem: TitleSystem = new TitleSystem();
  private leaderboardUI: LeaderboardUI = new LeaderboardUI();

  // Achievement kill tracking
  private slimeKillCount: number = 0;
  private forestMonsterKillCount: number = 0;
  private mapTransitionTimer: number = 0;
  private mapTransitionTitle: string = '';
  private mapTransitionSubtitle: string = '';

  // World objects
  private worldItems: WorldItem[] = [];
  private chests: Chest[] = [];
  private overworldMonsters: Monster[] = [];
  private guildNPC: GuildNPC;
  private blacksmithNPC: BlacksmithNPC;
  public villageManager: VillageManager;

  private lastTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  // Render scale
  private scale: number = 1;
  private virtualWidth: number = CONSTANTS.INTERNAL_WIDTH;
  private virtualHeight: number = CONSTANTS.INTERNAL_HEIGHT;

  // Logical Screen Dimensions & High-DPI Retina/HD+ resolution
  private screenWidth: number = 800;
  private screenHeight: number = 400;
  private dpr: number = 1;

  // DOM elements for HUD
  private fpsEl: HTMLElement | null;
  private coordsEl: HTMLElement | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.input = new InputManager(canvas);

    // Initial camera size
    this.camera = new Camera(this.virtualWidth, this.virtualHeight);

    // Create World & Player in center (tile 50, 50)
    this.tileMap = new TileMap();
    const spawnX = 50 * CONSTANTS.TILE_SIZE + 6;
    const spawnY = 50 * CONSTANTS.TILE_SIZE + 3;
    this.player = new Player(spawnX, spawnY);

    ControlSettingsManager.load();
    this.floatingText = new FloatingTextManager();
    this.inventoryUI = new InventoryUI(this.player.inventory, this.player, this.floatingText);
    this.skillBarUI = new SkillBarUI(this.player, this.floatingText);
    this.controlSettingsModal = new ControlSettingsModal();
    this.controlSettingsModal.onConfigChange = () => this.handleResize();

    // Inisialisasi UpdateService untuk auto-refresh seamless saat ada pembaruan file
    UpdateService.init();
    UpdateService.isSafeToReload = () => {
      return (
        this.onboardingUI.state === 'PLAYING' &&
        !this.inventoryUI.isOpen &&
        !this.guildNPC.isAppraisalOpen &&
        !this.blacksmithNPC.isWorkshopOpen &&
        !this.controlSettingsModal.isOpen &&
        !NotificationModal.isOpen
      );
    };
    UpdateService.saveGameBeforeReload = () => {
      this.saveSessionSnapshot();
    };
    UpdateService.onUpdateFound = () => {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '🚀 Update versi baru terdeteksi!', '#38bdf8', 4.0);
    };

    AudioEngine.init();
    this.questManager = new QuestManager();
    this.villageManager = new VillageManager(this.questManager);
    this.miniMapUI = new MiniMapUI();
    this.quickPotionUI = new QuickPotionUI(this.player, this.floatingText);
    this.atmosphereEngine = new AtmosphereEngine();

    // Hook Anime Skill Invocation Banner & Camera Screen Shake
    this.skillBarUI.onSkillCast = (skill) => {
      this.camera.shake(3.8, 0.18);
      this.activeSkillBanner = {
        name: skill.name,
        color: skill.color || '#38bdf8',
        role: skill.role || this.player.role,
        timer: 1.25,
        maxTimer: 1.25
      };
    };

    // Create Guild Receptionist Elaine near spawn
    const guildX = 51 * CONSTANTS.TILE_SIZE;
    const guildY = 48 * CONSTANTS.TILE_SIZE;
    this.guildNPC = new GuildNPC(guildX, guildY);
    this.guildNPC.questManager = this.questManager;

    // Create Weaponsmith Blacksmith Master Brokk near town plaza (West of spawn)
    const smithX = 46 * CONSTANTS.TILE_SIZE;
    const smithY = 49 * CONSTANTS.TILE_SIZE;
    this.blacksmithNPC = new BlacksmithNPC(smithX, smithY);

    // Inisialisasi Pintu Masuk Goa (Dungeon Entrance) di Overworld (Utara Kota)
    this.caveEntrance = new CaveEntrance(49, 32);

    // Inisialisasi Dungeon Bawah Tanah, Monster & Peti Rahasia
    this.dungeonMap = new DungeonMap();
    this.spawnInitialDungeonObjects();
    this.initFloor2Monsters();

    this.cookingSystem.onCookSuccess = () => {
      this.titleSystem.unlockTitle('GOURMET_CHEF', this.player, this.floatingText);
    };

    this.spawnInitialWorldObjects();

    // Inisialisasi Auth & Onboarding flow
    this.authUI = new AuthUI(this.player, this.chests, this.floatingText);
    this.authUI.getCurrentMap = () => this.currentMap;
    this.authUI.getQuestSaveData = () => this.questManager.serialize();
    this.authUI.onQuestDataLoaded = (data) => this.questManager.deserialize(data);
    this.controlSettingsModal.onLogoutRequested = () => {
      this.authUI.performLogout();
    };
    this.onboardingUI = new OnboardingUI();

    this.setupOnboardingFlow();

    // Setup Desktop Keyboard Shortcuts (1: HP Potion, 2: MP Potion, M: MiniMap, B: Tas)
    window.addEventListener('keydown', (e) => {
      if (this.onboardingUI.state !== 'PLAYING') return;
      if (e.key === '1') {
        this.quickPotionUI.useHpPotion();
      } else if (e.key === '2') {
        this.quickPotionUI.useMpPotion();
      } else if (e.key === 'm' || e.key === 'M') {
        this.miniMapUI.mode = this.miniMapUI.mode === 'NORMAL' ? 'EXPANDED' : (this.miniMapUI.mode === 'EXPANDED' ? 'MINIMIZED' : 'NORMAL');
        AudioEngine.playButtonClick();
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I') {
        this.inventoryUI.toggle();
      }
    });

    // Connect touch interceptor for all UI layers
    this.input.setTouchInterceptor((touchX, touchY) => {
      if (this.onboardingUI.state !== 'PLAYING') return true;

      // Update Banner (Ketuk untuk muat ulang versi baru)
      if (UpdateService.isUpdateAvailable) {
        const upW = 230;
        const upH = 28;
        const upX = (this.screenWidth - upW) / 2;
        const upY = 12;
        if (touchX >= upX && touchX <= upX + upW && touchY >= upY && touchY <= upY + upH) {
          UpdateService.applyUpdateNow();
          return true;
        }
      }

      // -1. Premium In-Game Notification / Confirm Modal (Top Priority)
      if (NotificationModal.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // 0. Control Settings Modal
      if (this.controlSettingsModal.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // 0.1 Mini-Map Touch
      if (this.miniMapUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // 0.2 Quick Potion Buttons (HP & MP)
      if (this.quickPotionUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // Gelar & Achievement Button (👑)
      const titleBtn = { x: this.screenWidth - 180, y: 10, size: 34 };
      if (
        touchX >= titleBtn.x &&
        touchX <= titleBtn.x + titleBtn.size &&
        touchY >= titleBtn.y &&
        touchY <= titleBtn.y + titleBtn.size
      ) {
        this.titleSystem.open(this.player);
        return true;
      }

      // Fullscreen Button (⛶)
      const fsBtn = { x: this.screenWidth - 138, y: 10, size: 34 };
      if (
        touchX >= fsBtn.x &&
        touchX <= fsBtn.x + fsBtn.size &&
        touchY >= fsBtn.y &&
        touchY <= fsBtn.y + fsBtn.size
      ) {
        PwaService.toggleFullscreen();
        return true;
      }

      // Install App Button (📲) if installable
      if (PwaService.isInstallable) {
        const instBtn = { x: this.screenWidth - 232, y: 10, w: 86, h: 34 };
        if (
          touchX >= instBtn.x &&
          touchX <= instBtn.x + instBtn.w &&
          touchY >= instBtn.y &&
          touchY <= instBtn.y + instBtn.h
        ) {
          PwaService.promptInstall();
          return true;
        }
      }

      // 0. Village Dialog Modal
      if (this.currentMap === 'OVERWORLD' && this.villageManager.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight, this.player, this.floatingText)) {
        return true;
      }

      // 1. Guild Appraisal Modal
      if (this.guildNPC.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight, this.player, this.floatingText)) {
        return true;
      }
      // 2. Blacksmith Weaponsmith Workshop Modal
      if (this.blacksmithNPC.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight, this.player, this.floatingText)) {
        return true;
      }
      // 2. Auth Profile / Logout buttons
      if (this.authUI.handleTouch(touchX, touchY, this.screenWidth)) {
        return true;
      }
      // 3. Mobile Skill Bar
      if (this.skillBarUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }
      // 4. Inventory Backpack
      return this.inventoryUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight);
    });

    this.fpsEl = document.getElementById('fps-display');
    this.coordsEl = document.getElementById('coords-display');

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 150);
    });
  }

  private async setupOnboardingFlow(): Promise<void> {
    // 0. Pulihkan karakter tertunda jika baru saja kembali dari Google OAuth redirect
    const pendingChar = localStorage.getItem('rpg2d_pending_character');
    let hasPending = false;
    if (pendingChar) {
      try {
        const parsed = JSON.parse(pendingChar);
        if (parsed.username) {
          this.player.username = parsed.username;
          this.onboardingUI.username = parsed.username;
        }
        if (typeof parsed.costumeIndex === 'number' && CHARACTER_COSTUMES[parsed.costumeIndex]) {
          this.player.costume = CHARACTER_COSTUMES[parsed.costumeIndex];
          this.onboardingUI.selectedCostumeIndex = parsed.costumeIndex;
        }
        localStorage.removeItem('rpg2d_pending_character');
        hasPending = true;
      } catch (e) {}
    }

    // 1. Pulihkan sesi jika pengguna baru saja me-refresh dari auto-update
    const hasSessionSave = this.restoreSessionSnapshot();
    if (hasSessionSave) {
      this.onboardingUI.setState('PLAYING');
      AudioEngine.playBgm(this.currentMap);
      const roleName = ROLE_INFO[this.player.role]?.name || 'Petualang';
      this.floatingText.spawn(
        this.player.x + 10,
        this.player.y - 20,
        `✨ Game diperbarui! Sesi dipulihkan (${roleName})`,
        '#38bdf8',
        4.0
      );
    }

    await SupabaseService.init();

    SupabaseService.onAuthChange(async (user) => {
      if (user) {
        this.authUI.isGuest = false;
        // Jika sudah dipulihkan dari sesi auto-update lokal, jangan timpa kecuali belum ada sesi
        if (!hasSessionSave) {
          if (hasPending) {
            this.onboardingUI.setState('PLAYING');
            AudioEngine.playBgm(this.currentMap);
            this.authUI.saveCurrentGame();
            this.floatingText.spawn(
              this.player.x + 10,
              this.player.y - 20,
              `🌐 Mode Online Aktif! Selamat datang, ${this.player.username}!`,
              '#38bdf8',
              3.5
            );
            return;
          }
          const hasSave = await this.authUI.loadCloudSave(user.id);
          if (hasSave) {
            this.onboardingUI.setState('PLAYING');
            AudioEngine.playBgm(this.currentMap);
            const roleName = ROLE_INFO[this.player.role].name;
            this.floatingText.spawn(
              this.player.x + 10,
              this.player.y - 20,
              `Selamat datang kembali, ${this.player.username}! (${roleName})`,
              '#38bdf8',
              3.0
            );
          } else {
            this.onboardingUI.username = (user.user_metadata?.full_name || 'Hero').slice(0, 15);
            this.onboardingUI.setState('CHARACTER_CREATION');
          }
        }
      }
    });

    // Callback when user confirms Character Creation (Costume & Username)
    this.onboardingUI.onComplete((username, costume, isGuest) => {
      this.player.username = username;
      this.player.costume = costume;
      this.authUI.isGuest = isGuest;
      AudioEngine.playBgm(this.currentMap);

      // Initial save to cloud if logged in
      if (!isGuest) {
        this.authUI.saveCurrentGame();
        this.floatingText.spawn(this.player.x + 10, this.player.y - 18, `🌐 Mode Online Aktif! Selamat datang, ${username}!`, '#38bdf8', 3.5);
      } else {
        this.saveSessionSnapshot();
        this.floatingText.spawn(this.player.x + 10, this.player.y - 18, `📴 Mode Offline Aktif (Tersimpan di HP). Selamat datang, ${username}!`, '#4ade80', 3.5);
      }
    });
  }

  /**
   * Menyimpan snapshot progres lengkap ke localStorage sebelum refresh otomatis
   */
  public saveSessionSnapshot(): void {
    if (this.onboardingUI.state !== 'PLAYING') return;

    const openedChestsIndices: number[] = [];
    this.chests.forEach((chest, idx) => {
      if (chest.isOpen) openedChestsIndices.push(idx);
    });

    const openedDungeonChestsIndices: number[] = [];
    this.dungeonChests.forEach((chest, idx) => {
      if (chest.isOpen) openedDungeonChestsIndices.push(idx);
    });

    const snapshot = {
      username: this.player.username,
      costumeId: this.player.costume.id,
      role: this.player.role,
      hasLockedRole: this.player.hasLockedRole,
      magicianAffinities: this.player.magicianAffinities,
      level: this.player.level,
      exp: this.player.exp,
      maxExp: this.player.maxExp,
      hp: Math.floor(this.player.hp),
      maxHp: this.player.maxHp,
      mp: Math.floor(this.player.mp),
      maxMp: this.player.maxMp,
      worldX: this.player.x,
      worldY: this.player.y,
      currentMap: this.currentMap,
      inventory: this.player.inventory.slots,
      openedChests: openedChestsIndices,
      openedDungeonChests: openedDungeonChestsIndices,
      isGuest: this.authUI.isGuest,
      equippedWeaponId: this.player.equippedWeaponId,
      unlockedWeaponIds: this.player.unlockedWeaponIds,
      quests: this.questManager.serialize(),
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('rpg2d_session_save', JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Could not save session snapshot:', e);
    }

    if (!this.authUI.isGuest) {
      this.authUI.saveCurrentGame();
    }
  }

  /**
   * Memulihkan snapshot progres pemain sehingga refresh tidak mengganggu permainan
   */
  public restoreSessionSnapshot(): boolean {
    try {
      const saved = localStorage.getItem('rpg2d_session_save');
      if (!saved) return false;

      const data = JSON.parse(saved);
      // Valid selama 48 jam
      if (!data || !data.timestamp || Date.now() - data.timestamp > 48 * 3600 * 1000) {
        return false;
      }

      if (data.username) this.player.username = data.username;
      if (typeof data.worldX === 'number') this.player.x = data.worldX;
      if (typeof data.worldY === 'number') this.player.y = data.worldY;
      if (typeof data.hp === 'number') this.player.hp = data.hp;
      if (typeof data.maxHp === 'number') this.player.maxHp = data.maxHp;
      if (typeof data.mp === 'number') this.player.mp = data.mp;
      if (typeof data.maxMp === 'number') this.player.maxMp = data.maxMp;
      if (typeof data.level === 'number') this.player.level = data.level;
      if (typeof data.exp === 'number') this.player.exp = data.exp;
      if (typeof data.maxExp === 'number') this.player.maxExp = data.maxExp;
      if (typeof data.costumeId === 'number') {
        const found = CHARACTER_COSTUMES.find((c) => c.id === data.costumeId);
        if (found) this.player.costume = found;
      }
      if (data.magicianAffinities) this.player.magicianAffinities = data.magicianAffinities;
      if (typeof data.hasLockedRole === 'boolean') this.player.hasLockedRole = data.hasLockedRole;
      if (data.role) {
        this.player.setRole(data.role, data.magicianAffinities, true);
        if (data.role !== 'NOVICE') {
          this.player.hasLockedRole = true;
        }
      }
      if (typeof data.isGuest === 'boolean') this.authUI.isGuest = data.isGuest;

      // Pulihkan slot inventaris
      if (Array.isArray(data.inventory)) {
        this.player.inventory.slots = new Array(this.player.inventory.capacity).fill(null);
        for (let i = 0; i < Math.min(data.inventory.length, this.player.inventory.capacity); i++) {
          this.player.inventory.slots[i] = data.inventory[i];
        }
      }

      // Pastikan Kartu Petualang selalu ada jika role sudah terkunci
      if (this.player.hasLockedRole && this.player.role !== 'NOVICE') {
        const hasCard = this.player.inventory.slots.some(s => s && s.itemId === 'ADVENTURER_CARD');
        if (!hasCard) {
          this.player.inventory.addItem('ADVENTURER_CARD', 1);
        }
      }

      // Pulihkan Senjata yang Terpasang & Terbuka
      if (data.equippedWeaponId) {
        this.player.equippedWeaponId = data.equippedWeaponId;
      }
      if (Array.isArray(data.unlockedWeaponIds)) {
        this.player.unlockedWeaponIds = data.unlockedWeaponIds;
      }
      if (Array.isArray(data.quests)) {
        this.questManager.deserialize(data.quests);
      }

      // Pulihkan peti yang sudah terbuka di Overworld
      if (Array.isArray(data.openedChests)) {
        for (const idx of data.openedChests) {
          if (this.chests[idx]) {
            this.chests[idx].isOpen = true;
          }
        }
      }

      // Pulihkan peti yang sudah terbuka di Dungeon
      if (Array.isArray(data.openedDungeonChests)) {
        for (const idx of data.openedDungeonChests) {
          if (this.dungeonChests[idx]) {
            this.dungeonChests[idx].isOpen = true;
          }
        }
      }

      // Pulihkan lokasi map (Dungeon atau Overworld)
      if (data.currentMap === 'DUNGEON') {
        this.currentMap = 'DUNGEON';
        this.camera.setWorldBounds(this.dungeonMap.width * CONSTANTS.TILE_SIZE, this.dungeonMap.height * CONSTANTS.TILE_SIZE);
      } else {
        this.currentMap = 'OVERWORLD';
        this.camera.setWorldBounds(CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE);
      }

      return true;
    } catch (e) {
      console.warn('Could not restore session save:', e);
      return false;
    }
  }

  private spawnInitialWorldObjects(): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. Treasure Chests
    this.chests.push(
      new Chest(53 * ts + 5, 47 * ts + 6, [
        { itemId: 'HEALTH_POTION', count: 3 },
        { itemId: 'GOLD_COIN', count: 50 }
      ]),
      new Chest(47 * ts + 5, 52 * ts + 6, [
        { itemId: 'MAGIC_FLOWER', count: 5 },
        { itemId: 'WOOD_LOG', count: 10 }
      ]),
      new Chest(54 * ts + 5, 54 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 120 }
      ])
    );

    // 2. World Items
    const scatterOffsets = [
      { dx: -2, dy: -2, item: 'MAGIC_FLOWER', count: 2 },
      { dx: 2, dy: -1, item: 'WOOD_LOG', count: 3 },
      { dx: -3, dy: 2, item: 'WOOD_LOG', count: 2 },
      { dx: 3, dy: 1, item: 'GOLD_COIN', count: 10 },
      { dx: -1, dy: 3, item: 'HEALTH_POTION', count: 1 },
      { dx: 4, dy: -3, item: 'MAGIC_FLOWER', count: 1 },
      { dx: -4, dy: -2, item: 'GOLD_COIN', count: 25 },
      { dx: 1, dy: -4, item: 'WOOD_LOG', count: 4 }
    ];

    for (const s of scatterOffsets) {
      this.worldItems.push(
        new WorldItem(50 * ts + s.dx * ts + 16, 50 * ts + s.dy * ts + 16, s.item, s.count)
      );
    }

    // 3. Overworld Wild Monsters
    // Pedesaan Oakhaven (x=39..61, y=41..59) bebas monster sepenuhnya!
    this.overworldMonsters = [
      // --- MONSTER TINGKAT BAWAH (Hanya muncul di dalam hutan yang jaraknya agak jauh dari dungeon) ---
      // Slime Hutan menghuni padang glade rimba luar (Rimba Timur & Rimba Utara, jarak > 14 tile dari pintu dungeon)
      new Monster('ow_slime_1', 'FOREST_SLIME', 64 * ts + 10, 30 * ts + 10), // Glade Rimba Timur 1
      new Monster('ow_slime_2', 'FOREST_SLIME', 65 * ts + 8, 32 * ts + 12),  // Glade Rimba Timur 1
      new Monster('ow_slime_3', 'FOREST_SLIME', 70 * ts + 8, 25 * ts + 10),  // Glade Rimba Timur Jauh
      new Monster('ow_slime_4', 'FOREST_SLIME', 66 * ts + 10, 38 * ts + 8),  // Glade Rimba Tenggara
      new Monster('ow_slime_5', 'FOREST_SLIME', 58 * ts + 8, 20 * ts + 10),  // Glade Rimba Utara
      new Monster('ow_slime_6', 'FOREST_SLIME', 66 * ts + 10, 21 * ts + 10), // Glade Rimba Timur Laut

      // --- MONSTER TINGKAT MENENGAH (Hanya muncul di sekitar dungeon dan pintu dungeon) ---
      // Pengawal Gerbang Goblin berjaga ketat di pelataran pintu masuk gua dungeon
      new Monster('ow_gate_gob_1', 'GOBLIN', 47 * ts + 8, 33 * ts + 12),  // Sisi kiri pintu masuk dungeon
      new Monster('ow_gate_gob_2', 'GOBLIN', 52 * ts + 8, 33 * ts + 12),  // Sisi kanan pintu masuk dungeon
      new Monster('ow_gate_gob_3', 'GOBLIN', 49 * ts + 16, 35 * ts + 6),  // Pelataran depan pintu gua dungeon

      // Serigala Rimba mengintai di hutan rimba yang melingkari sekitar dungeon
      new Monster('ow_dung_wolf_1', 'WILD_WOLF', 55 * ts + 8, 32 * ts + 10), // Hutan timur dekat gerbang gua
      new Monster('ow_dung_wolf_2', 'WILD_WOLF', 56 * ts + 8, 35 * ts + 8),  // Hutan tenggara gerbang gua
      new Monster('ow_dung_wolf_3', 'WILD_WOLF', 45 * ts + 8, 35 * ts + 10), // Hutan barat daya dekat danau
      new Monster('ow_dung_wolf_4', 'WILD_WOLF', 54 * ts + 8, 27 * ts + 10)  // Lereng hutan utara di atas tebing gua
    ];
  }

  private hitMonstersInSwing: Set<string> = new Set();

  private spawnInitialDungeonObjects(): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. Peti Harta Karun Bawah Tanah (Dungeon Chests)
    this.dungeonChests = [
      // Peti 1: Ruang Tengkorak Kuno (West Crypt)
      new Chest(6 * ts + 5, 15 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 160 },
        { itemId: 'HEALTH_POTION', count: 2 },
        { itemId: 'ANCIENT_BONE', count: 3 },
        { itemId: 'DARK_IRON_ORE', count: 5 }
      ]),
      // Peti 2: Gua Kristal Mineral (East Cavern)
      new Chest(34 * ts + 5, 15 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 180 },
        { itemId: 'MANA_POTION', count: 3 },
        { itemId: 'DUNGEON_GEM', count: 1 },
        { itemId: 'DARK_IRON_ORE', count: 6 }
      ]),
      // Peti 3: Harta Karun Legendaris di Belakang Altar Bos (North Chamber)
      new Chest(20 * ts + 5, 3 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 350 },
        { itemId: 'DUNGEON_GEM', count: 3 },
        { itemId: 'HEALTH_POTION', count: 4 },
        { itemId: 'MANA_POTION', count: 4 },
        { itemId: 'DARK_IRON_ORE', count: 10 }
      ])
    ];

    // 2. Monster Penghuni Goa (Dungeon Monsters)
    this.dungeonMonsters = [
      // Aula Utama (Great Hall - Tengah)
      new Monster('m_slime_1', 'SLIME', 16 * ts + 6, 20 * ts + 6),
      new Monster('m_slime_2', 'SLIME', 24 * ts + 6, 21 * ts + 6),
      new Monster('m_bat_1', 'BAT', 20 * ts + 5, 17 * ts + 8),
      // Ruang Tengkorak (Bone Crypt - Barat)
      new Monster('m_skel_1', 'SKELETON', 6 * ts + 5, 18 * ts + 3),
      new Monster('m_skel_2', 'SKELETON', 8 * ts + 5, 22 * ts + 3),
      // Gua Kristal (Crystal Cavern - Timur)
      new Monster('m_bat_2', 'BAT', 32 * ts + 5, 16 * ts + 8),
      new Monster('m_slime_3', 'SLIME', 33 * ts + 6, 22 * ts + 6),
      // Altar Bos Goa (Abyssal Altar - Utara)
      new Monster('m_skel_elite', 'SKELETON', 16 * ts + 5, 5 * ts + 3),
      new Monster('m_boss_slime', 'BOSS_SLIME', 20 * ts, 5 * ts)
    ];
  }

  private spawnHitSparks(x: number, y: number, isCrit: boolean): void {
    const count = isCrit ? 9 : 5;
    const colors = isCrit ? ['#fde047', '#facc15', '#ffffff', '#fb923c'] : ['#ffffff', '#cbd5e1', '#94a3b8'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isCrit ? (50 + Math.random() * 60) : (26 + Math.random() * 38);
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: isCrit ? (2.2 + Math.random() * 2) : (1.5 + Math.random() * 1.5),
        life: 0.18 + Math.random() * 0.12,
        maxLife: 0.3
      });
    }
  }

  public enterDungeon(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON';
    this.player.x = this.dungeonMap.entranceSpawnX;
    this.player.y = this.dungeonMap.entranceSpawnY;
    this.player.direction = 'up';

    for (const minion of this.player.minions) {
      minion.x = this.player.x - 16;
      minion.y = this.player.y;
    }

    AudioEngine.playMapTransition(true);
    AudioEngine.playBgm('DUNGEON');

    // Perbarui batas kamera untuk map Dungeon (40x40 tile)
    this.camera.setWorldBounds(this.dungeonMap.width * CONSTANTS.TILE_SIZE, this.dungeonMap.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 GOA PURBA ABISAL · TINGKAT 1 」', '~ Sarang Bawah Tanah Raja Slime Purba ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '⛩️ Memasuki Goa Bawah Tanah!', '#c084fc', 3.0);
    this.saveSessionSnapshot();
  }

  public exitDungeon(isDeath: boolean = false): void {
    if (this.transitionCooldown > 0 && !isDeath) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'OVERWORLD';
    if (isDeath) {
      // Saat gugur di Dungeon, pemain sadar dengan selamat di balai serikat desa
      this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 50 * CONSTANTS.TILE_SIZE + 3;
    } else {
      // Tempatkan pemain di pelataran depan pintu masuk goa di Hutan Rimba
      this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 35 * CONSTANTS.TILE_SIZE + 3;
    }
    this.player.direction = 'down';

    for (const minion of this.player.minions) {
      minion.x = this.player.x - 16;
      minion.y = this.player.y;
    }

    AudioEngine.playMapTransition(false);
    AudioEngine.playBgm('OVERWORLD');

    // Perbarui batas kamera untuk Dunia Luar (100x100 tile)
    this.camera.setWorldBounds(CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 LEMBAH SERIKAT OAKHAVEN 」', '~ Kawasan Aman Perlindungan Para Petualang ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌤️ Kembali ke Permukaan', '#facc15', 3.0);
    this.saveSessionSnapshot();
  }

  private initFloor2Monsters(): void {
    const ts = CONSTANTS.TILE_SIZE;
    this.floor2Monsters = [
      // Central Ancient Hall (Lantai 2)
      new Monster('f2_golem_1', 'STONE_GOLEM', 17 * ts + 4, 22 * ts + 4),
      new Monster('f2_golem_2', 'STONE_GOLEM', 23 * ts + 4, 25 * ts + 4),
      // West Crypt Room (Ruang Makam Purba)
      new Monster('f2_shadow_1', 'CRYPT_SHADOW', 7 * ts + 4, 20 * ts + 4),
      new Monster('f2_shadow_2', 'CRYPT_SHADOW', 9 * ts + 4, 23 * ts + 4),
      new Monster('f2_golem_3', 'STONE_GOLEM', 6 * ts + 4, 18 * ts + 4),
      // East Crystal Grotto (Gua Batu Kristal Abisal)
      new Monster('f2_shadow_3', 'CRYPT_SHADOW', 31 * ts + 4, 19 * ts + 4),
      new Monster('f2_shadow_4', 'CRYPT_SHADOW', 33 * ts + 4, 22 * ts + 4),
      new Monster('f2_golem_4', 'STONE_GOLEM', 30 * ts + 4, 24 * ts + 4),
      // Boss Arena: Altar Golem Titan (Utara)
      new Monster('f2_boss_titan', 'BOSS_TITAN_GOLEM', 20 * ts, 8 * ts)
    ];
  }

  public enterFloor2(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON_FLOOR_2';
    this.player.x = this.dungeonFloor2.entranceSpawnX;
    this.player.y = this.dungeonFloor2.entranceSpawnY;
    this.player.direction = 'up';

    if (this.companion) {
      this.companion.x = this.player.x - 20;
      this.companion.y = this.player.y + 10;
    }
    if (this.pet) {
      this.pet.x = this.player.x + 20;
      this.pet.y = this.player.y + 10;
    }
    for (const minion of this.player.minions) {
      minion.x = this.player.x - 16;
      minion.y = this.player.y;
    }

    AudioEngine.playMapTransition(true);
    AudioEngine.playBgm('DUNGEON');

    this.camera.setWorldBounds(this.dungeonFloor2.width * CONSTANTS.TILE_SIZE, this.dungeonFloor2.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 MAKAM KUNO RUINAS ABISAL · LANTAI 2 」', '~ Sarang Titan Kolosal & Bayangan Abisal ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '⚡ Memasuki Lantai 2!', '#ef4444', 3.0);
    this.saveSessionSnapshot();
  }

  public exitFloor2(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON';
    this.player.x = this.dungeonMap.floor2LadderX;
    this.player.y = this.dungeonMap.floor2LadderY + 36;
    this.player.direction = 'down';

    if (this.companion) {
      this.companion.x = this.player.x - 20;
      this.companion.y = this.player.y;
    }
    if (this.pet) {
      this.pet.x = this.player.x + 20;
      this.pet.y = this.player.y;
    }
    for (const minion of this.player.minions) {
      minion.x = this.player.x - 16;
      minion.y = this.player.y;
    }

    AudioEngine.playMapTransition(false);
    AudioEngine.playBgm('DUNGEON');

    this.camera.setWorldBounds(this.dungeonMap.width * CONSTANTS.TILE_SIZE, this.dungeonMap.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 GOA PURBA ABISAL · TINGKAT 1 」', '~ Kembali ke Ruang Altar Bos ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '▲ Naik ke Lantai 1', '#c084fc', 3.0);
    this.saveSessionSnapshot();
  }

  public openCompanionHireModal(): void {
    if (this.companion) {
      NotificationModal.confirm({
        title: `Berpisah dengan ${this.companion.name}?`,
        message: `${this.companion.name} saat ini menemani petualanganmu. Apakah kamu ingin melepasnya dari party?`,
        confirmText: 'Lepas Party',
        cancelText: 'Tetap Bersama',
        onConfirm: () => {
          this.companion = null;
          this.floatingText.spawn(this.player.x + 12, this.player.y - 16, 'Rekan party telah dilepas!', '#94a3b8');
        }
      });
      return;
    }

    // Modal interaktif HTML untuk perekrutan rekan party anime
    let existing = document.getElementById('companion-hire-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'companion-hire-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(3, 7, 18, 0.82); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; font-family: system-ui, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: linear-gradient(180deg, #0f172a, #1e293b); border: 2px solid #38bdf8; border-radius: 12px; width: 92%; max-width: 440px; padding: 16px; color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.4); padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #38bdf8;">🤝 REKRUT REKAN PARTY GUILD</div>
            <div style="font-size: 11px; color: #94a3b8;">Rekan petualang akan mengikuti dan membantumu bertarung!</div>
          </div>
          <button id="close-companion-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #38bdf8;">🛡️ Rodric (Ksatria Baja) [50 Gold]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Tanker tangguh berzirah baja tebal yang menarik perhatian monster.</div>
            </div>
            <button id="hire-rodric-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>

          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #c084fc; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #c084fc;">🔮 Lyra (Penyihir Bintang Peri) [65 Gold]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Penyihir elf anggun dengan tembakan sihir bintang jarak jauh.</div>
            </div>
            <button id="hire-lyra-btn" style="background: linear-gradient(135deg, #9333ea, #7e22ce); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>

          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #4ade80; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #4ade80;">🌿 Flora (Pendeta Suci) [50 Gold]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Pendeta berhati mulia yang otomatis menyembuhkan HP saat sekarat.</div>
            </div>
            <button id="hire-flora-btn" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('close-companion-btn');
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    const hireHelper = (type: CompanionType, cost: number, name: string, color: string) => {
      const gold = this.player.inventory.getItemCount('GOLD_COIN');
      if (gold < cost) {
        this.floatingText.spawn(this.player.x + 12, this.player.y - 16, `Koin Emas tidak cukup (butuh ${cost})!`, '#ef4444');
        return;
      }
      this.player.inventory.removeItem('GOLD_COIN', cost);
      this.companion = new Companion(type, this.player.x - 24, this.player.y);
      AudioEngine.playLevelUp();
      this.floatingText.spawn(this.player.x + 12, this.player.y - 20, `🤝 ${name} bergabung ke Party!`, color, 2.5);
      modal.remove();
    };

    const rBtn = document.getElementById('hire-rodric-btn');
    if (rBtn) rBtn.onclick = () => hireHelper('RODRIC', 50, 'Rodric', '#38bdf8');
    const lBtn = document.getElementById('hire-lyra-btn');
    if (lBtn) lBtn.onclick = () => hireHelper('LYRA', 65, 'Lyra', '#c084fc');
    const fBtn = document.getElementById('hire-flora-btn');
    if (fBtn) fBtn.onclick = () => hireHelper('FLORA', 50, 'Flora', '#4ade80');
  }

  public openPetAdoptionDialog(): void {
    if (this.pet) {
      NotificationModal.confirm({
        title: `Lepas ${this.pet.name}?`,
        message: `${this.pet.name} saat ini aktif mengumpulkan koin & item secara otomatis. Apakah kamu ingin melepasnya?`,
        confirmText: 'Lepas Pet',
        cancelText: 'Tetap Rawat',
        onConfirm: () => {
          this.pet = null;
          this.floatingText.spawn(this.player.x + 12, this.player.y - 16, 'Hewan peliharaan dilepas ke alam!', '#94a3b8');
        }
      });
      return;
    }

    let existing = document.getElementById('pet-adoption-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pet-adoption-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(3, 7, 18, 0.82); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000; font-family: system-ui, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: linear-gradient(180deg, #0f172a, #1e293b); border: 2px solid #facc15; border-radius: 12px; width: 92%; max-width: 440px; padding: 16px; color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(250, 204, 21, 0.4); padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #facc15;">🐾 SUAKA HEWAN DESA (PET AUTO-LOOT)</div>
            <div style="font-size: 11px; color: #94a3b8;">Pet pendamping akan berlari memungut koin & drop item otomatis!</div>
          </div>
          <button id="close-pet-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #38bdf8;">🟢 Puni (Slime Kristal Mungil)</div>
              <div style="font-size: 11px; color: #cbd5e1;">Slime mini yang lincah menyerap item drop. [Butuh: 2 Jeli Slime]</div>
            </div>
            <button id="adopt-slime-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Adopsi</button>
          </div>

          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #f59e0b; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #f59e0b;">🐺 Lobo (Anak Serigala Rimba)</div>
              <div style="font-size: 11px; color: #cbd5e1;">Anak serigala berbulu lebat pengendus harta. [Butuh: 2 Bunga Mistis]</div>
            </div>
            <button id="adopt-wolf-btn" style="background: linear-gradient(135deg, #d97706, #b45309); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Adopsi</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('close-pet-btn');
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    const sBtn = document.getElementById('adopt-slime-btn');
    if (sBtn) {
      sBtn.onclick = () => {
        const count = this.player.inventory.getItemCount('SLIME_JELLY');
        if (count < 2) {
          this.floatingText.spawn(this.player.x + 12, this.player.y - 16, 'Butuh 2 Jeli Slime!', '#ef4444');
          return;
        }
        this.player.inventory.removeItem('SLIME_JELLY', 2);
        this.pet = new Pet('SLIME_PET', this.player.x + 20, this.player.y);
        this.titleSystem.unlockTitle('BEAST_TAMER', this.player, this.floatingText);
        AudioEngine.playLevelUp();
        this.floatingText.spawn(this.player.x + 12, this.player.y - 20, '🐾 Puni diadopsi & siap auto-loot!', '#38bdf8', 2.5);
        modal.remove();
      };
    }

    const wBtn = document.getElementById('adopt-wolf-btn');
    if (wBtn) {
      wBtn.onclick = () => {
        const count = this.player.inventory.getItemCount('MAGIC_FLOWER');
        if (count < 2) {
          this.floatingText.spawn(this.player.x + 12, this.player.y - 16, 'Butuh 2 Bunga Mistis!', '#ef4444');
          return;
        }
        this.player.inventory.removeItem('MAGIC_FLOWER', 2);
        this.pet = new Pet('WOLF_PET', this.player.x + 20, this.player.y);
        this.titleSystem.unlockTitle('BEAST_TAMER', this.player, this.floatingText);
        AudioEngine.playLevelUp();
        this.floatingText.spawn(this.player.x + 12, this.player.y - 20, '🐾 Lobo diadopsi & siap auto-loot!', '#facc15', 2.5);
        modal.remove();
      };
    }
  }

  private handleMonsterDefeated(monster: Monster): void {
    const isNight = this.timeWeatherEngine.isNight();
    const expReward = isNight ? Math.round(monster.expReward * 1.25) : monster.expReward;
    const goldReward = isNight ? Math.round(monster.goldReward * 1.25) : monster.goldReward;

    const leveledUp = this.player.addExp(expReward);
    this.floatingText.spawn(
      monster.x + monster.width / 2,
      monster.y - 20,
      isNight ? `+${expReward} EXP (🌙 Malam +25%)!` : `+${expReward} EXP!`,
      '#facc15',
      2.0
    );

    // Audio Monster Defeated
    AudioEngine.playMonsterDefeated(monster.type === 'BOSS_SLIME' || monster.type === 'BOSS_TITAN_GOLEM');

    // Update Progres Misi Petualang (Quest Manager)
    this.questManager.onMonsterDefeated(monster.type, this.floatingText, this.player.x, this.player.y);

    const targetItems =
      this.currentMap === 'OVERWORLD'
        ? this.worldItems
        : this.currentMap === 'DUNGEON'
        ? this.dungeonWorldItems
        : this.floor2WorldItems;

    // Drop Koin Emas
    targetItems.push(new WorldItem(monster.x + 4, monster.y + 4, 'GOLD_COIN', goldReward));

    // --- OVERWORLD MONSTER DROPS ---
    if (monster.type === 'FOREST_SLIME') {
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'SLIME_JELLY', 1));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MAGIC_FLOWER', 1));
    } else if (monster.type === 'WILD_WOLF') {
      if (Math.random() < 0.75) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'WOLF_MEAT', 1));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'HEALTH_POTION', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MANA_POTION', 1));
    } else if (monster.type === 'GOBLIN') {
      if (Math.random() < 0.60) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'WOOD_LOG', 2));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    }
    // --- DUNGEON FLOOR 1 MONSTER DROPS ---
    else if (monster.type === 'SLIME') {
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'SLIME_JELLY', 1));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    } else if (monster.type === 'BAT') {
      if (Math.random() < 0.5) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 2));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    } else if (monster.type === 'SKELETON') {
      if (Math.random() < 0.75) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'ANCIENT_BONE', 1));
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 2));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 6, monster.y + 12, 'MANA_POTION', 1));
    } else if (monster.type === 'BOSS_SLIME') {
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 3));
      targetItems.push(new WorldItem(monster.x + 24, monster.y + 12, 'DARK_IRON_ORE', 6));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 16, 'SLIME_JELLY', 4));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 14, 'HEALTH_POTION', 3));
      targetItems.push(new WorldItem(monster.x + 6, monster.y + 14, 'MANA_POTION', 3));

      // Buka akses tangga menuju Lantai 2
      this.dungeonMap.isFloor2Unlocked = true;
      this.titleSystem.unlockTitle('CRYPT_CONQUEROR', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '🏆 RAJA SLIME DIKALAHKAN!!', '#facc15', 3.5);
      this.floatingText.spawn(monster.x + 16, monster.y - 48, '🚪 TANGGA KE LANTAI 2 TERBUKA!', '#c084fc', 4.0);
    }
    // --- DUNGEON FLOOR 2 MONSTER DROPS ---
    else if (monster.type === 'STONE_GOLEM') {
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DARK_IRON_ORE', 2));
      if (Math.random() < 0.5) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'ANCIENT_BONE', 1));
    } else if (monster.type === 'CRYPT_SHADOW') {
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 2));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MANA_POTION', 1));
      if (Math.random() < 0.4) targetItems.push(new WorldItem(monster.x + 6, monster.y + 14, 'ANCIENT_BONE', 1));
    } else if (monster.type === 'BOSS_TITAN_GOLEM') {
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 5));
      targetItems.push(new WorldItem(monster.x + 24, monster.y + 12, 'DARK_IRON_ORE', 8));
      targetItems.push(new WorldItem(monster.x + 10, monster.y + 16, 'HEALTH_POTION', 4));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 16, 'MANA_POTION', 4));
      targetItems.push(new WorldItem(monster.x + 18, monster.y + 20, 'GOLD_COIN', 300));

      this.titleSystem.unlockTitle('TITAN_BREAKER', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '⚡ TITAN ABISAL DITUMBANGKAN!!', '#ef4444', 4.0);
    }

    // Title Progress Tracking
    if (monster.type === 'SLIME' || monster.type === 'FOREST_SLIME') {
      this.slimeKillCount++;
      if (this.slimeKillCount >= 5) {
        this.titleSystem.unlockTitle('SLIME_SLAYER', this.player, this.floatingText);
      }
    } else if (monster.type === 'WILD_WOLF' || monster.type === 'GOBLIN') {
      this.forestMonsterKillCount++;
      if (this.forestMonsterKillCount >= 3) {
        this.titleSystem.unlockTitle('FOREST_HUNTER', this.player, this.floatingText);
      }
    }

    if (this.player.level >= 22) {
      this.titleSystem.unlockTitle('GUILD_LEGEND', this.player, this.floatingText);
    }

    if (leveledUp) {
      AudioEngine.playLevelUp();
      this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
    }
  }

  public triggerMapTransition(title: string, subtitle: string): void {
    this.mapTransitionTitle = title;
    this.mapTransitionSubtitle = subtitle;
    this.mapTransitionTimer = 3.2;
  }

  public handleResize(): void {
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    // Scale canvas buffer by device pixel ratio for crystal clear Retina / HD+ rendering (capped at 3x)
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    this.screenWidth = cssWidth;
    this.screenHeight = cssHeight;
    this.dpr = dpr;

    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    const cfg = ControlSettingsManager.get();
    const zoomMultiplier = cfg.cameraZoom || 1.0;

    // Viewport ideal menargetkan ~360px vertikal agar petualangan terasa lapang & tidak sempit
    const baseScale = Math.max(1, Math.round(cssHeight / 360));
    this.scale = Math.max(0.75, baseScale * zoomMultiplier);

    this.virtualWidth = Math.ceil(cssWidth / this.scale);
    this.virtualHeight = Math.ceil(cssHeight / this.scale);

    this.camera.resize(this.virtualWidth, this.virtualHeight);
  }

  public start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(currentTime: number): void {
    const rawDelta = (currentTime - this.lastTime) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1);
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      if (this.fpsEl) {
        this.fpsEl.textContent = `FPS: ${this.fps}`;
      }
    }

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaTime: number): void {
    if (this.onboardingUI.state !== 'PLAYING') {
      this.onboardingUI.update(deltaTime);
      return;
    }

    if (this.transitionCooldown > 0) {
      this.transitionCooldown = Math.max(0, this.transitionCooldown - deltaTime);
    }

    if (this.activeSkillBanner) {
      this.activeSkillBanner.timer -= deltaTime;
      if (this.activeSkillBanner.timer <= 0) {
        this.activeSkillBanner = null;
      }
    }

    // Update Hit Sparks
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const spark = this.hitSparks[i];
      spark.x += spark.vx * deltaTime;
      spark.y += spark.vy * deltaTime;
      spark.life -= deltaTime;
      if (spark.life <= 0) {
        this.hitSparks.splice(i, 1);
      }
    }

    // Update Atmosphere Engine (Drifting Petals, Forest Mana Spores, Abyssal Motes)
    this.atmosphereEngine.update(
      deltaTime,
      this.camera.x,
      this.camera.y,
      this.virtualWidth,
      this.virtualHeight,
      this.currentMap === 'DUNGEON'
    );

    if (this.mapTransitionTimer > 0) {
      this.mapTransitionTimer -= deltaTime;
    }

    if (this.player.attackTimer <= 0) {
      this.hitMonstersInSwing.clear();
    }

    // 1. Process Input
    this.input.update();

    // 2. Update World Animations based on active map
    if (this.currentMap === 'OVERWORLD') {
      this.tileMap.update(deltaTime);
      this.caveEntrance.update(deltaTime);
      this.villageManager.update(deltaTime);
    } else {
      this.dungeonMap.update(deltaTime);
    }
    this.skillBarUI.update(deltaTime);
    this.miniMapUI.update(deltaTime);

    // 3. Update Player & Collisions
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const obstacleChecker = (box: { x: number; y: number; width: number; height: number }) => {
      if (this.currentMap === 'OVERWORLD') {
        // Village structures (fountain, cottages, fences)
        if (this.villageManager.checkCollision(box)) {
          return true;
        }
        // Overworld Chests
        for (const chest of this.chests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
        // Guild Desk
        const gx = this.guildNPC.x - 4;
        const gy = this.guildNPC.y + 14;
        if (box.x < gx + 40 && box.x + box.width > gx && box.y < gy + 16 && box.y + box.height > gy) {
          return true;
        }
        // Blacksmith Forge & Anvil
        const bx = this.blacksmithNPC.x - 18;
        const by = this.blacksmithNPC.y + 8;
        if (box.x < bx + 58 && box.x + box.width > bx && box.y < by + 20 && box.y + box.height > by) {
          return true;
        }
        // Cave Entrance sides (rock walls)
        const cex = this.caveEntrance.x;
        const cey = this.caveEntrance.y;
        if (box.x < cex + 16 && box.x + box.width > cex && box.y < cey + 60 && box.y + box.height > cey + 24) return true;
        if (box.x < cex + 64 && box.x + box.width > cex + 48 && box.y < cey + 60 && box.y + box.height > cey + 24) return true;
      } else {
        // Dungeon Chests
        for (const chest of this.dungeonChests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
      }
      return false;
    };

    // Freeze player if inventory, village dialog, guild dialog, blacksmith workshop, control settings, or notification modal is open
    const activeInput = (this.inventoryUI.isOpen || this.villageManager.isDialogOpen || this.guildNPC.isAppraisalOpen || this.blacksmithNPC.isWorkshopOpen || this.controlSettingsModal.isOpen || NotificationModal.isOpen || this.cookingSystem.isOpen || this.titleSystem.isOpen || this.leaderboardUI.isOpen)
      ? { axisX: 0, axisY: 0, isAction: false, isSprint: false }
      : this.input.state;

    const activeMap = this.currentMap === 'OVERWORLD' ? this.tileMap : (this.currentMap === 'DUNGEON' ? this.dungeonMap : this.dungeonFloor2);
    this.player.update(deltaTime, activeInput, activeMap, obstacleChecker);

    // Update Day/Night & Weather Engine
    this.timeWeatherEngine.update(
      deltaTime,
      this.camera.x,
      this.camera.y,
      this.camera.viewportWidth,
      this.camera.viewportHeight,
      this.currentMap !== 'OVERWORLD'
    );

    // Sync Active Title
    const activeTitle = this.titleSystem.getEquippedTitle();
    this.player.equippedTitle = activeTitle.name;
    this.player.equippedTitleColor = activeTitle.color;

    // Update Active Party Companion (Rodric, Lyra, Flora)
    if (this.companion) {
      const activeMonsters =
        this.currentMap === 'OVERWORLD'
          ? this.overworldMonsters
          : this.currentMap === 'DUNGEON'
          ? this.dungeonMonsters
          : this.floor2Monsters;

      this.companion.update(deltaTime, this.player, activeMonsters, this.floatingText, (targetM) => {
        if (targetM.isDead) this.handleMonsterDefeated(targetM);
      });
    }

    // Update Active Pet Auto-Loot Magnet (Puni, Lobo)
    if (this.pet) {
      const activeItems =
        this.currentMap === 'OVERWORLD'
          ? this.worldItems
          : this.currentMap === 'DUNGEON'
          ? this.dungeonWorldItems
          : this.floor2WorldItems;

      this.pet.update(deltaTime, this.player, activeItems, this.floatingText);
    }

    // Update Blacksmith animations
    this.blacksmithNPC.update(deltaTime);

    // --- OVERWORLD SPECIFIC UPDATES ---
    if (this.currentMap === 'OVERWORLD') {
      // Dapur Petualang (Cooking Pot) Interaction at (48, 48)
      const cookPotX = 48 * CONSTANTS.TILE_SIZE + 16;
      const cookPotY = 48 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(cookPotX - playerCenterX, cookPotY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.cookingSystem.open(this.player, this.floatingText);
        }
      }

      // Papan Kehormatan Guild (Leaderboard Notice Board) at (53, 48)
      const boardX = 53 * CONSTANTS.TILE_SIZE + 16;
      const boardY = 48 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(boardX - playerCenterX, boardY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.leaderboardUI.open(this.player);
        }
      }

      // Suaka Hewan Desa (Pet Sanctuary) at (54, 52)
      const petPenX = 54 * CONSTANTS.TILE_SIZE + 16;
      const petPenY = 52 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(petPenX - playerCenterX, petPenY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.openPetAdoptionDialog();
        }
      }

      // Rekrut Rekan Party Guild Receptionist Side Door at (51, 48)
      const compHireX = 51 * CONSTANTS.TILE_SIZE + 24;
      const compHireY = 48 * CONSTANTS.TILE_SIZE + 8;
      if (Math.hypot(compHireX - playerCenterX, compHireY - playerCenterY) < 34 && !this.guildNPC.isAppraisalOpen) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.openCompanionHireModal();
        }
      }

      // Village NPC Interaction (Quest & Ambient)
      if (!this.villageManager.isDialogOpen && !this.guildNPC.isAppraisalOpen && !this.blacksmithNPC.isWorkshopOpen) {
        const nearNPC = this.villageManager.isNearAnyNPC(playerCenterX, playerCenterY);
        if (nearNPC && (this.input.isActionJustPressed || this.input.state.isAction)) {
          this.input.consumeAction();
          this.villageManager.openDialog(nearNPC);
        }
      }

      // 4. Guild Receptionist Interaction
      if (!this.guildNPC.isAppraisalOpen && this.guildNPC.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.guildNPC.openAppraisal();
        }
      }

      // Blacksmith Workshop Interaction
      if (!this.blacksmithNPC.isWorkshopOpen && this.blacksmithNPC.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.blacksmithNPC.openWorkshop(this.player.role);
        }
      }

      // 5. Cave Entrance (Masuk Goa / Dungeon)
      if (this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.enterDungeon();
          return;
        }
      }

      // 6. Update Chests & Handle Interactions
      for (const chest of this.chests) {
        chest.update(deltaTime);
        if (!chest.isOpen && chest.isNearPlayer(playerCenterX, playerCenterY)) {
          if (this.input.isActionJustPressed || this.input.state.isAction) {
            this.input.consumeAction();
            AudioEngine.playChestOpen();
            const rewards = chest.open();
            for (const reward of rewards) {
              this.player.inventory.addItem(reward.itemId, reward.count);
              const def = ITEM_DEFINITIONS[reward.itemId];
              const name = def ? def.name : reward.itemId;
              this.floatingText.spawn(chest.x + 11, chest.y - 12, `+${reward.count} ${name}`, '#facc15', 1.8);
            }
            const leveledUp = this.player.addExp(25);
            if (leveledUp) {
              AudioEngine.playLevelUp();
              this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
            }
            this.authUI.saveCurrentGame();
          }
        }
      }

      // 7. Update World Items (Magnet & Pickup)
      for (let i = this.worldItems.length - 1; i >= 0; i--) {
        const item = this.worldItems[i];
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.worldItems.splice(i, 1);
          }
        }
      }

      // 8. Overworld Monsters Update (AI, Movement & Player/Pet Attack)
      for (const monster of this.overworldMonsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.tileMap.isTileSolid(tx, ty),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.0, 0.16);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
              this.player.y = 50 * CONSTANTS.TILE_SIZE + 3;
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur dan sadar kembali di Kota!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          }
        );
      }

      // 9. Player Melee Attack vs Overworld Monsters
      const owAttackHitbox = this.player.getAttackHitbox();
      if (owAttackHitbox) {
        for (const monster of this.overworldMonsters) {
          if (monster.isDead) continue;
          if (this.hitMonstersInSwing.has(monster.id)) continue;

          if (
            owAttackHitbox.x < monster.x + monster.width &&
            owAttackHitbox.x + owAttackHitbox.width > monster.x &&
            owAttackHitbox.y < monster.y + monster.height &&
            owAttackHitbox.y + owAttackHitbox.height > monster.y
          ) {
            this.hitMonstersInSwing.add(monster.id);
            const { damage, isCrit } = this.player.getAttackDamage();
            const res = monster.takeDamage(damage, playerCenterX, playerCenterY);
            AudioEngine.playHit(isCrit);
            this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, isCrit);
            this.camera.shake(isCrit ? 4.8 : 2.6, isCrit ? 0.16 : 0.10);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');

            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // 10. Player Skill Effects vs Overworld Monsters
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.overworldMonsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 28 + this.player.level * 3.5;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 72 + this.player.level * 6.5;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 34 + this.player.level * 4.0;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.2, 0.12);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // 10.5 Minion AI Combat & Escort Update (Prajurit Kerangka, Roh Beruang, Klon Bayangan)
      this.updateMinions(deltaTime, this.overworldMonsters);
    } else if (this.currentMap === 'DUNGEON') {
      // --- DUNGEON FLOOR 1 SPECIFIC UPDATES ---
      // 4. Exit Ladder to Surface
      if (this.dungeonMap.isNearLadder(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitDungeon(false);
          return;
        }
      }

      // 4.5 Descent Ladder to Floor 2 in Boss Room
      if (this.dungeonMap.isNearFloor2Ladder(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.enterFloor2();
          return;
        }
      }

      // 5. Dungeon Chests
      for (const chest of this.dungeonChests) {
        chest.update(deltaTime);
        if (!chest.isOpen && chest.isNearPlayer(playerCenterX, playerCenterY)) {
          if (this.input.isActionJustPressed || this.input.state.isAction) {
            this.input.consumeAction();
            AudioEngine.playChestOpen();
            const rewards = chest.open();
            for (const reward of rewards) {
              this.player.inventory.addItem(reward.itemId, reward.count);
              const def = ITEM_DEFINITIONS[reward.itemId];
              const name = def ? def.name : reward.itemId;
              this.floatingText.spawn(chest.x + 11, chest.y - 12, `+${reward.count} ${name}`, '#facc15', 2.0);
            }
            const leveledUp = this.player.addExp(50);
            if (leveledUp) {
              AudioEngine.playLevelUp();
              this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
            }
            this.authUI.saveCurrentGame();
          }
        }
      }

      // 6. Dungeon World Items
      for (let i = this.dungeonWorldItems.length - 1; i >= 0; i--) {
        const item = this.dungeonWorldItems[i];
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.dungeonWorldItems.splice(i, 1);
          }
        }
      }

      // 7. Dungeon Monsters Update (AI, Movement & Player/Pet Attack)
      for (const monster of this.dungeonMonsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonMap.isTileSolid(tx, ty),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.2, 0.18);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeon(true); // Safe respawn to town plaza
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Dungeon dan dipulangkan ke Kota!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          },
          this.companion
        );
      }

      // 8. Player Melee Attack vs Monsters (Pukulan Tinju Novice / Senjata Role)
      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox) {
        for (const monster of this.dungeonMonsters) {
          if (monster.isDead) continue;
          if (this.hitMonstersInSwing.has(monster.id)) continue;

          // AABB Hitbox Intersection
          if (
            attackHitbox.x < monster.x + monster.width &&
            attackHitbox.x + attackHitbox.width > monster.x &&
            attackHitbox.y < monster.y + monster.height &&
            attackHitbox.y + attackHitbox.height > monster.y
          ) {
            this.hitMonstersInSwing.add(monster.id);
            const { damage, isCrit } = this.player.getAttackDamage();
            const res = monster.takeDamage(damage, playerCenterX, playerCenterY);
            AudioEngine.playHit(isCrit);
            this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, isCrit);
            this.camera.shake(isCrit ? 4.8 : 2.6, isCrit ? 0.16 : 0.10);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');

            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // 9. Player Skill Effects vs Monsters (Sihir & Skill Serangan)
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.dungeonMonsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 28 + this.player.level * 3.5;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 72 + this.player.level * 6.5;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 34 + this.player.level * 4.0;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.2, 0.12);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // 9.5 Minion AI Combat & Escort Update
      this.updateMinions(deltaTime, this.dungeonMonsters);
    } else {
      // --- DUNGEON FLOOR 2 SPECIFIC UPDATES (Ancient Crypt Ruins) ---
      // Ladder up to Floor 1
      if (this.dungeonFloor2.isNearLadderUp(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitFloor2();
          return;
        }
      }

      // Update Floor 2 Engine & Boss Telegraphs
      this.dungeonFloor2.update(deltaTime);

      // Check Boss AOE Telegraph Ground Damage (Red Carpet Danger Zones)
      for (const tel of this.dungeonFloor2.telegraphs) {
        if (tel.timer <= deltaTime * 1.5) {
          const dist = Math.hypot(playerCenterX - tel.x, playerCenterY - tel.y);
          if (dist < tel.radius) {
            const died = this.player.takeDamage(tel.damage);
            this.camera.shake(5.5, 0.22);
            AudioEngine.playHit(true);
            this.floatingText.spawn(this.player.x + 12, this.player.y - 14, `💥 GEMPA BUMI -${tel.damage}!`, '#ef4444', 2.2);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeon(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Lantai 2 dan dipulangkan ke Kota!', '#ef4444', 3.5);
              return;
            }
          }
        }
      }

      // Floor 2 World Items
      for (let i = this.floor2WorldItems.length - 1; i >= 0; i--) {
        const item = this.floor2WorldItems[i];
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.floor2WorldItems.splice(i, 1);
          }
        }
      }

      // Floor 2 Monsters AI & Boss Telegraph Hook
      for (const monster of this.floor2Monsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonFloor2.isTileSolid(tx, ty),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.2, 0.18);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeon(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Lantai 2 dan dipulangkan ke Kota!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          },
          this.companion,
          (tx, ty, r, dur, dmg) => {
            this.dungeonFloor2.spawnTelegraph(tx, ty, r, dur, dmg);
          }
        );
      }

      // Player Melee Attack vs Floor 2 Monsters
      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox) {
        for (const monster of this.floor2Monsters) {
          if (monster.isDead) continue;
          if (this.hitMonstersInSwing.has(monster.id)) continue;
          if (
            attackHitbox.x < monster.x + monster.width &&
            attackHitbox.x + attackHitbox.width > monster.x &&
            attackHitbox.y < monster.y + monster.height &&
            attackHitbox.y + attackHitbox.height > monster.y
          ) {
            this.hitMonstersInSwing.add(monster.id);
            const { damage, isCrit } = this.player.getAttackDamage();
            const res = monster.takeDamage(damage, playerCenterX, playerCenterY);
            AudioEngine.playHit(isCrit);
            this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, isCrit);
            this.camera.shake(isCrit ? 4.8 : 2.6, isCrit ? 0.16 : 0.10);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');
            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // Skills vs Floor 2 Monsters
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.floor2Monsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 28 + this.player.level * 3.5;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 72 + this.player.level * 6.5;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 34 + this.player.level * 4.0;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.2, 0.12);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // Minions vs Floor 2 Monsters
      this.updateMinions(deltaTime, this.floor2Monsters);
    }

    // 10. Update Floating Text Notifications
    this.floatingText.update(deltaTime);

    // 11. Update Auth & Cloud Auto-Save
    this.authUI.update(deltaTime);

    // 12. Update Camera to follow player with smooth interpolation
    this.camera.update(playerCenterX, playerCenterY, deltaTime);

    // 13. Update HUD Coordinates & Player Health/Mana Bar
    if (this.coordsEl) {
      const tileX = Math.floor(this.player.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(this.player.y / CONSTANTS.TILE_SIZE);
      const roleInfo = ROLE_INFO[this.player.role];
      const locText = this.currentMap === 'DUNGEON'
        ? '<span style="color: #c084fc; font-weight: 700;">🏰 Goa Bawah Tanah (Dungeon Lt.1)</span>'
        : '<span style="color: #4ade80; font-weight: 700;">🌍 Lembah Serikat (Overworld)</span>';

      const weapon = this.player.equippedWeapon;
      const weaponHtml = weapon
        ? `<div style="margin-top: 3px; font-size: 10px; color: ${weapon.themeColor}; font-weight: 700;">⚔️ ${weapon.name} (+${weapon.atkBonus} ATK)</div>`
        : (this.player.role === 'NOVICE'
            ? '<div style="margin-top: 3px; font-size: 9.5px; color: #94a3b8;">🥊 Tinju Tangan Kosong</div>'
            : '<div style="margin-top: 3px; font-size: 9.5px; color: #94a3b8;">⚔️ Senjata Bawaan Dasar</div>');

      const rank = this.player.adventurerRank;
      this.coordsEl.innerHTML = `
        <div style="font-weight: 700; color: ${roleInfo.color}; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
          <span>${this.player.username} · Lv.${this.player.level} [${roleInfo.tag}]</span>
          <span style="padding: 1px 5px; font-size: 8.5px; border-radius: 3px; font-weight: 800; background: ${rank.bg}; color: ${rank.color}; border: 1px solid ${rank.border};">
            ${rank.badge} ${rank.name}
          </span>
        </div>
        ${weaponHtml}
        <div>${locText}</div>
        Tile: (${tileX}, ${tileY})<br>
        <!-- HP Bar -->
        <div style="margin-top: 3px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; width: 20px;">HP</span>
          <div style="width: 75px; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; display: inline-block;">
            <div style="width: ${Math.min(100, Math.max(0, (this.player.hp / this.player.maxHp) * 100))}%; height: 100%; background: #22c55e;"></div>
          </div>
          <span style="font-size: 10px;">${Math.floor(this.player.hp)}/${this.player.maxHp}</span>
        </div>
        <!-- MP Bar -->
        <div style="margin-top: 2px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; width: 20px;">MP</span>
          <div style="width: 75px; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; display: inline-block;">
            <div style="width: ${Math.min(100, Math.max(0, (this.player.mp / this.player.maxMp) * 100))}%; height: 100%; background: #38bdf8;"></div>
          </div>
          <span style="font-size: 10px;">${Math.floor(this.player.mp)}/${this.player.maxMp}</span>
        </div>
      `;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const screenWidth = this.screenWidth;
    const screenHeight = this.screenHeight;

    // 1. Reset any hardware transforms before clearing the full physical canvas buffer
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. High-DPI Scaling: Scale context by device pixel ratio for razor-sharp HD+ rendering
    ctx.scale(this.dpr, this.dpr);

    // 3. World Rendering: Disable smoothing specifically for authentic pixel-art tiles & sprites
    ctx.imageSmoothingEnabled = false;

    // --- WORLD RENDERING (SCALED & TRANSLATED) ---
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    if (this.currentMap === 'OVERWORLD') {
      // 1. Render Overworld TileMap
      this.tileMap.render(ctx, this.camera);

      // Render Desa Khusus Oakhaven (Bangunan, Balai Serikat, Air Mancur, Lampu & NPC)
      this.villageManager.renderEnvironment(ctx, playerCenterX, playerCenterY);

      // Render Interactive Cauldron, Notice Board, Pet Pen
      this.renderCookingCauldron(ctx, 48 * CONSTANTS.TILE_SIZE, 48 * CONSTANTS.TILE_SIZE, playerCenterX, playerCenterY);
      this.renderNoticeBoard(ctx, 53 * CONSTANTS.TILE_SIZE, 48 * CONSTANTS.TILE_SIZE, playerCenterX, playerCenterY);
      this.renderPetPen(ctx, 54 * CONSTANTS.TILE_SIZE, 52 * CONSTANTS.TILE_SIZE, playerCenterX, playerCenterY);

      // 2. Render Cave / Dungeon Entrance
      this.caveEntrance.render(ctx, this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY));

      // 3. Render Guild NPC
      this.guildNPC.render(ctx, this.guildNPC.isNearPlayer(playerCenterX, playerCenterY), this.player);

      // Render Weaponsmith Blacksmith NPC Brokk
      this.blacksmithNPC.render(ctx, this.blacksmithNPC.isNearPlayer(playerCenterX, playerCenterY), this.player);

      // 4. Render Overworld Chests
      for (const chest of this.chests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY));
      }

      // 5. Render Overworld Items
      for (const item of this.worldItems) {
        item.render(ctx);
      }

      // 5.5 Render Overworld Monsters
      for (const monster of this.overworldMonsters) {
        monster.render(ctx);
      }

      // Render Companion if active
      if (this.companion) {
        this.companion.render(ctx);
      }

      // Render Pet if active
      if (this.pet) {
        this.pet.render(ctx);
      }

      // 6. Render Player
      this.player.render(ctx);

      // 7. Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // 7.5 Render Ambient Atmosphere (Falling Petals, Forest Mana Spores)
      this.atmosphereEngine.render(ctx);

      // 7.6 Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 7.7 Day/Night Cycle & Weather Ambient Lighting Wash
      this.timeWeatherEngine.renderWorldLighting(ctx, this.camera.x, this.camera.y, this.camera.viewportWidth, this.camera.viewportHeight, false);

      // 8. Render Floating Texts
      this.floatingText.render(ctx);
    } else if (this.currentMap === 'DUNGEON') {
      // --- DUNGEON FLOOR 1 WORLD RENDERING ---
      // 1. Render Dungeon Map Tiles
      this.dungeonMap.render(ctx, this.camera);

      // 2. Render Dungeon Chests
      for (const chest of this.dungeonChests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY));
      }

      // 3. Render Dungeon Items
      for (const item of this.dungeonWorldItems) {
        item.render(ctx);
      }

      // 4. Render Dungeon Monsters
      for (const monster of this.dungeonMonsters) {
        monster.render(ctx);
      }

      // Render Companion if active
      if (this.companion) {
        this.companion.render(ctx);
      }

      // Render Pet if active
      if (this.pet) {
        this.pet.render(ctx);
      }

      // 5. Render Player
      this.player.render(ctx);

      // 6. Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // 7. Render Atmospheric Subterranean Torch Lighting & Fog of War
      this.dungeonMap.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);

      // 7.5 Render Subterranean Abyssal Mana Motes
      this.atmosphereEngine.render(ctx);

      // 7.6 Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 8. Render Floating Texts (Crisp & Readable above darkness)
      this.floatingText.render(ctx);
    } else {
      // --- DUNGEON FLOOR 2 WORLD RENDERING (Ancient Crypt Ruins) ---
      // 1. Render Floor 2 Map Tiles & Boss Telegraph Red Warning Zones
      this.dungeonFloor2.render(ctx, this.camera);

      // 2. Render Floor 2 Items
      for (const item of this.floor2WorldItems) {
        item.render(ctx);
      }

      // 3. Render Floor 2 Monsters (Stone Golems, Crypt Shadows, Abyssal Titan)
      for (const monster of this.floor2Monsters) {
        monster.render(ctx);
      }

      // Render Companion if active
      if (this.companion) {
        this.companion.render(ctx);
      }

      // Render Pet if active
      if (this.pet) {
        this.pet.render(ctx);
      }

      // 4. Render Player
      this.player.render(ctx);

      // 5. Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // 6. Render Floor 2 Atmospheric Darkness & Purple Torch Light
      this.dungeonFloor2.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);

      // 7. Render Abyssal Mana Motes
      this.atmosphereEngine.render(ctx);

      // 8. Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 9. Render Floating Texts
      this.floatingText.render(ctx);
    }

    ctx.restore();

    // 4. High-DPI UI & Text rendering: Enable smooth anti-aliased font and vector card rendering
    ctx.imageSmoothingEnabled = true;

    // --- SCREEN SPACE 1:1 RENDERING ---
    if (this.onboardingUI.state === 'PLAYING') {
      // 8. Mobile Touch D-Pad & Action Buttons
      if (!this.inventoryUI.isOpen && !this.guildNPC.isAppraisalOpen && !this.blacksmithNPC.isWorkshopOpen && !this.controlSettingsModal.isOpen) {
        this.input.renderTouchUI(ctx, screenWidth, screenHeight);
        // Mobile Skill Bar
        this.skillBarUI.renderTouchSkillBar(ctx, screenWidth, screenHeight);
        // Quick Potion UI (HP & MP)
        this.quickPotionUI.render(ctx, screenWidth, screenHeight);
      }

      // 9. Auth Status Pill / Logout
      this.authUI.render(ctx, screenWidth);

      // 10. Inventory UI Overlay
      this.inventoryUI.render(ctx, screenWidth, screenHeight);

      // 11. Guild Appraisal Ceremony Modal
      this.guildNPC.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 12. Weaponsmith Workshop Modal
      this.blacksmithNPC.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 12.0 Village NPC Dialog Modal (Quest & Ambient)
      this.villageManager.renderDialogModal(ctx, screenWidth, screenHeight);

      // 12. Control Settings Modal (Gear ⚙️ & customization)
      this.controlSettingsModal.render(ctx, screenWidth, screenHeight);

      // 12.1 Render Mini-Map UI
      const activeMonsters = this.currentMap === 'OVERWORLD' ? this.overworldMonsters : this.dungeonMonsters;
      const activeChests = this.currentMap === 'OVERWORLD' ? this.chests : this.dungeonChests;
      this.miniMapUI.render(
        ctx,
        screenWidth,
        screenHeight,
        this.currentMap,
        this.tileMap,
        this.dungeonMap,
        this.player,
        activeMonsters,
        activeChests,
        this.caveEntrance.x / CONSTANTS.TILE_SIZE,
        this.caveEntrance.y / CONSTANTS.TILE_SIZE,
        this.guildNPC.x,
        this.guildNPC.y,
        this.blacksmithNPC.x,
        this.blacksmithNPC.y
      );

      // 12.2 Render Active Quest HUD Tracker (Top-Left)
      this.renderQuestTrackerHUD(ctx);

      // Top Center: Day/Night Cycle & Weather Banner
      ctx.save();
      const timeStr = this.timeWeatherEngine.getFormattedTime();
      ctx.font = 'bold 9.5px sans-serif';
      const timeWidth = ctx.measureText(timeStr).width + 16;
      const timeX = (screenWidth - timeWidth) / 2;
      const timeY = 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(timeX, timeY, timeWidth, 22);
      ctx.strokeStyle = this.timeWeatherEngine.isNight() ? '#a855f7' : '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(timeX, timeY, timeWidth, 22);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, timeX + timeWidth / 2, timeY + 11);
      ctx.restore();

      // Top-Left: Active Food Buffs HUD Badges
      let buffX = 10;
      const buffY = 72;
      if (this.player.foodBuffAtkTimer > 0) {
        const m = Math.floor(this.player.foodBuffAtkTimer / 60);
        const s = Math.floor(this.player.foodBuffAtkTimer % 60);
        this.renderBuffBadge(ctx, buffX, buffY, '🥩 +20% ATK', `${m}:${s.toString().padStart(2, '0')}`, '#fb923c');
        buffX += 88;
      }
      if (this.player.foodBuffMpTimer > 0) {
        const m = Math.floor(this.player.foodBuffMpTimer / 60);
        const s = Math.floor(this.player.foodBuffMpTimer % 60);
        this.renderBuffBadge(ctx, buffX, buffY, '🍮 Regen MP', `${m}:${s.toString().padStart(2, '0')}`, '#38bdf8');
        buffX += 88;
      }
      if (this.player.foodBuffExpSpeedTimer > 0) {
        const m = Math.floor(this.player.foodBuffExpSpeedTimer / 60);
        const s = Math.floor(this.player.foodBuffExpSpeedTimer % 60);
        this.renderBuffBadge(ctx, buffX, buffY, '🍲 +Speed/EXP', `${m}:${s.toString().padStart(2, '0')}`, '#4ade80');
        buffX += 88;
      }

      // Top HUD: Gelar & Title Button (👑)
      const titleBtnX = screenWidth - 180;
      const titleBtnY = 10;
      const titleBtnSize = 34;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(titleBtnX + titleBtnSize / 2, titleBtnY + titleBtnSize / 2, titleBtnSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', titleBtnX + titleBtnSize / 2, titleBtnY + titleBtnSize / 2);
      ctx.restore();

      // 13. Top HUD: Fullscreen Icon (⛶)
      const fsX = screenWidth - 138;
      const fsY = 10;
      const fsSize = 34;

      ctx.save();
      ctx.fillStyle = PwaService.isFullscreen() ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(fsX + fsSize / 2, fsY + fsSize / 2, fsSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PwaService.isFullscreen() ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PwaService.isFullscreen() ? '🗗' : '⛶', fsX + fsSize / 2, fsY + fsSize / 2);

      // Top HUD: Install Web App Button (📲) if installable
      if (PwaService.isInstallable) {
        const instX = screenWidth - 232;
        const instY = 10;
        const instW = 86;
        const instH = 34;

        ctx.fillStyle = 'rgba(2, 132, 199, 0.9)';
        ctx.fillRect(instX, instY, instW, instH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(instX, instY, instW, instH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText('📲 Pasang App', instX + instW / 2, instY + instH / 2);
      }
      ctx.restore();

      // 14. Floating Auto-Update Banner (Muncul saat ada pembaruan file baru)
      if (UpdateService.isUpdateAvailable) {
        const upW = 236;
        const upH = 28;
        const upX = (screenWidth - upW) / 2;
        const upY = 10;

        ctx.save();
        ctx.fillStyle = 'rgba(2, 132, 199, 0.95)';
        ctx.fillRect(upX, upY, upW, upH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(upX, upY, upW, upH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚀 Versi Baru Siap · Sentuh Muat Ulang ↻', upX + upW / 2, upY + upH / 2);
        ctx.restore();
      }

      // 15. Dungeon Ladder Exit Prompt Bubble
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerCenterY = this.player.y + this.player.height / 2;
      if (this.currentMap === 'DUNGEON' && this.dungeonMap.isNearLadder(playerCenterX, playerCenterY)) {
        ctx.save();
        const pW = 210;
        const pH = 26;
        const pX = (screenWidth - pW) / 2;
        const pY = screenHeight - 90;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(pX, pY, pW, pH);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pX, pY, pW, pH);
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('Tekan [A] Naik Tangga (Keluar Goa)', pX + pW / 2, pY + 17);
        ctx.restore();
      }

      if (this.currentMap === 'DUNGEON' && this.dungeonMap.isNearFloor2Ladder(playerCenterX, playerCenterY)) {
        ctx.save();
        const pW = 230;
        const pH = 26;
        const pX = (screenWidth - pW) / 2;
        const pY = screenHeight - 90;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(pX, pY, pW, pH);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pX, pY, pW, pH);
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e879f9';
        ctx.fillText('Tekan [A] Masuk Makam Kuno Lantai 2 ▼', pX + pW / 2, pY + 17);
        ctx.restore();
      }

      if (this.currentMap === 'DUNGEON_FLOOR_2' && this.dungeonFloor2.isNearLadderUp(playerCenterX, playerCenterY)) {
        ctx.save();
        const pW = 210;
        const pH = 26;
        const pX = (screenWidth - pW) / 2;
        const pY = screenHeight - 90;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(pX, pY, pW, pH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pX, pY, pW, pH);
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('Tekan [A] Naik Tangga (Lantai 1) ▲', pX + pW / 2, pY + 17);
        ctx.restore();
      }

      // 16. Anime Location Title Card
      this.renderAnimeLocationTitleCard(ctx, screenWidth, screenHeight);

      // 16.5 Anime Skill Invocation Cut-In Banner
      this.renderSkillCutInBanner(ctx, screenWidth, screenHeight);

      // 17. Topmost Modal: Premium In-Game Notification / Confirm Dialog
      NotificationModal.render(ctx, screenWidth, screenHeight);
    }
  }

  private renderBuffBadge(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, timerText: string, color: string): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(x, y, 84, 20);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, 84, 20);

    ctx.fillStyle = color;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 4, y + 9);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(timerText, x + 80, y + 16);
    ctx.restore();
  }

  private renderCookingCauldron(ctx: CanvasRenderingContext2D, px: number, py: number, pcx: number, pcy: number): void {
    const isNear = Math.hypot(px + 16 - pcx, py + 16 - pcy) < 38;
    // Campfire base stones & logs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 6, py + 22, 20, 4);
    // Flickering fire
    const fireFlicker = Math.sin(Date.now() * 0.01) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + 10 + fireFlicker * 0.5, py + 18, 12, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px + 12, py + 16, 8, 5);

    // Black Iron Cauldron Pot
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 14, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Boiling broth inside
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 12, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rising steam
    const steamY = (Date.now() * 0.02) % 18;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(px + 14, py + 8 - steamY, 3, 0, Math.PI * 2);
    ctx.arc(px + 18, py + 6 - ((steamY + 6) % 18), 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Prompt if near
    if (isNear) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fdba74';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('[A] Dapur Petualang', px + 16, py - 4);
      ctx.fillText('[A] Dapur Petualang', px + 16, py - 4);
    }
  }

  private renderNoticeBoard(ctx: CanvasRenderingContext2D, bx: number, by: number, pcx: number, pcy: number): void {
    const isNear = Math.hypot(bx + 16 - pcx, by + 16 - pcy) < 38;
    // Wooden posts
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 4, by + 8, 4, 24);
    ctx.fillRect(bx + 24, by + 8, 4, 24);
    // Board panel
    ctx.fillStyle = '#92400e';
    ctx.fillRect(bx + 2, by + 2, 28, 16);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 2, by + 2, 28, 16);
    // Parchment notice
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx + 5, by + 5, 22, 10);
    // Gold star emblem
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(bx + 14, by + 4, 4, 3);

    if (isNear) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('[A] Papan Kehormatan (Top 10)', bx + 16, by - 4);
      ctx.fillText('[A] Papan Kehormatan (Top 10)', bx + 16, by - 4);
    }
  }

  private renderPetPen(ctx: CanvasRenderingContext2D, px: number, py: number, pcx: number, pcy: number): void {
    const isNear = Math.hypot(px + 16 - pcx, py + 16 - pcy) < 38;
    // Wooden fence enclosure
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py + 4, 32, 3);
    ctx.fillRect(px, py + 22, 32, 3);
    ctx.fillRect(px, py + 4, 3, 20);
    ctx.fillRect(px + 29, py + 4, 3, 20);

    // Baby creatures inside pen
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px + 10, py + 14, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px + 20, py + 14, 5.5, 0, Math.PI * 2);
    ctx.fill();

    if (isNear) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('[A] Adopsi Pet Auto-Loot', px + 16, py - 3);
      ctx.fillText('[A] Adopsi Pet Auto-Loot', px + 16, py - 3);
    }
  }

  private renderQuestTrackerHUD(ctx: CanvasRenderingContext2D): void {
    const activeQuests = this.questManager.getActiveQuests();
    if (activeQuests.length === 0) return;

    ctx.save();
    const startX = 10;
    const startY = 110; // tepat di bawah koordinat HUD
    const cardW = 165;

    for (let i = 0; i < Math.min(2, activeQuests.length); i++) {
      const q = activeQuests[i];
      const cy = startY + i * 30;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(startX, cy, cardW, 26, 5);
      ctx.fill();
      ctx.strokeStyle = q.status === 'COMPLETED' ? '#facc15' : q.themeColor;
      ctx.lineWidth = q.status === 'COMPLETED' ? 1.5 : 1;
      ctx.stroke();

      ctx.fillStyle = q.themeColor;
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`📜 ${q.title}`, startX + 6, cy + 3);

      ctx.fillStyle = q.status === 'COMPLETED' ? '#facc15' : '#cbd5e1';
      ctx.font = 'bold 8px sans-serif';
      const statusText = q.status === 'COMPLETED' ? '✓ SIAP KLAIM' : `${q.targetName}: ${q.currentCount}/${q.requiredCount}`;
      ctx.fillText(statusText, startX + 6, cy + 14);

      // Mini progress bar
      const pbX = startX + cardW - 46;
      const pbY = cy + 15;
      const pbW = 40;
      const pbH = 4;
      const pct = Math.min(1, q.currentCount / q.requiredCount);
      ctx.fillStyle = '#334155';
      ctx.fillRect(pbX, pbY, pbW, pbH);
      ctx.fillStyle = q.status === 'COMPLETED' ? '#facc15' : q.themeColor;
      ctx.fillRect(pbX, pbY, Math.round(pbW * pct), pbH);
    }
    ctx.restore();
  }

  private renderHitSparks(ctx: CanvasRenderingContext2D): void {
    if (this.hitSparks.length === 0) return;
    ctx.save();
    for (const spark of this.hitSparks) {
      const alpha = Math.max(0, Math.min(1, spark.life / spark.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderSkillCutInBanner(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.activeSkillBanner) return;

    const banner = this.activeSkillBanner;
    // Fade in during first 0.1s, stay full, fade out during last 0.25s
    const alpha = Math.min(1, Math.min(banner.timer / 0.25, (banner.maxTimer - banner.timer) / 0.1));

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const bannerHeight = 44;
    const centerY = screenHeight * 0.30;
    const bannerY = centerY - bannerHeight / 2;

    // Anime slanted cut-in banner across screen
    const slant = 28;
    ctx.beginPath();
    ctx.moveTo(0, bannerY);
    ctx.lineTo(screenWidth, bannerY - slant * 0.25);
    ctx.lineTo(screenWidth, bannerY + bannerHeight + slant * 0.25);
    ctx.lineTo(0, bannerY + bannerHeight);
    ctx.closePath();

    // Gradient fill using the skill/role color
    const grad = ctx.createLinearGradient(0, bannerY, screenWidth, bannerY);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
    grad.addColorStop(0.25, banner.color + 'cc');
    grad.addColorStop(0.75, banner.color + 'aa');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.94)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing border lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Anime speed streaks across the cut-in
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const streakY = bannerY + 6 + i * 7;
      const streakX = ((Date.now() * 0.7 + i * 130) % (screenWidth + 180)) - 90;
      ctx.beginPath();
      ctx.moveTo(streakX, streakY);
      ctx.lineTo(streakX + 65 + (i % 3) * 25, streakY - slant * 0.12);
      ctx.stroke();
    }

    // Role tag & Skill Name typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`【 ${banner.role} · SKILL ACTIVATION 】`, screenWidth / 2, centerY - 9);

    ctx.font = '900 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = banner.color;
    ctx.shadowBlur = 10;
    ctx.fillText(banner.name.toUpperCase(), screenWidth / 2, centerY + 9);

    ctx.restore();
  }

  private renderAnimeLocationTitleCard(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (this.mapTransitionTimer <= 0) return;

    ctx.save();
    // Smooth fade in / out
    const alpha = Math.min(1, Math.min(this.mapTransitionTimer / 0.5, (3.2 - this.mapTransitionTimer) / 0.4));
    ctx.globalAlpha = Math.max(0, alpha);

    const cardW = Math.min(340, screenWidth - 32);
    const cardH = 50;
    const cardX = (screenWidth - cardW) / 2;
    const cardY = 50;

    const isDungeon = this.currentMap === 'DUNGEON';
    const mainTheme = isDungeon ? '#c084fc' : '#facc15';
    const subTheme = isDungeon ? '#f0abfc' : '#fef08a';

    // Dark anime backdrop with gold/purple trim
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();

    // Double ornamental borders with gold/violet sheen
    ctx.strokeStyle = mainTheme;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6);

    // Diamond corner markers
    const drawDiamond = (dx: number, dy: number) => {
      ctx.fillStyle = mainTheme;
      ctx.beginPath();
      ctx.moveTo(dx, dy - 3);
      ctx.lineTo(dx + 3, dy);
      ctx.lineTo(dx, dy + 3);
      ctx.lineTo(dx - 3, dy);
      ctx.closePath();
      ctx.fill();
    };
    drawDiamond(cardX + 7, cardY + cardH / 2);
    drawDiamond(cardX + cardW - 7, cardY + cardH / 2);

    // Title & Subtitle with anime fantasy flair
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillStyle = subTheme;
    ctx.shadowColor = mainTheme;
    ctx.shadowBlur = 8;
    ctx.fillText(this.mapTransitionTitle, cardX + cardW / 2, cardY + 18);

    ctx.shadowBlur = 0;
    ctx.font = 'italic 9.5px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(this.mapTransitionSubtitle, cardX + cardW / 2, cardY + 35);

    ctx.restore();
  }

  private updateMinions(deltaTime: number, activeMonsters: Monster[]): void {
    const minions = this.player.minions;
    if (minions.length === 0) return;

    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    for (let i = minions.length - 1; i >= 0; i--) {
      const minion = minions[i];

      // Update cooldowns & animations
      if (minion.attackCooldown > 0) minion.attackCooldown -= deltaTime;
      if (minion.attackTimer > 0) minion.attackTimer -= deltaTime;

      if (typeof minion.lifeTimer === 'number') {
        minion.lifeTimer -= deltaTime;
        if (minion.lifeTimer <= 0) {
          this.floatingText.spawn(minion.x, minion.y - 12, `💨 ${minion.name} menghilang`, '#94a3b8');
          minions.splice(i, 1);
          continue;
        }
      }

      if (minion.hp <= 0) {
        this.floatingText.spawn(minion.x, minion.y - 12, `☠️ ${minion.name} gugur!`, '#ef4444');
        minions.splice(i, 1);
        continue;
      }

      // Find closest alive monster within aggro range
      let targetMonster: Monster | null = null;
      let closestDist = 160;

      for (const monster of activeMonsters) {
        if (monster.isDead) continue;
        const mCenterX = monster.x + monster.width / 2;
        const mCenterY = monster.y + monster.height / 2;
        const distToMinion = Math.hypot(mCenterX - minion.x, mCenterY - minion.y);
        const distToPlayer = Math.hypot(mCenterX - playerCenterX, mCenterY - playerCenterY);

        if (distToPlayer < 260 && distToMinion < closestDist) {
          closestDist = distToMinion;
          targetMonster = monster;
        }
      }

      if (targetMonster) {
        // --- COMBAT PURSUIT & ATTACK ---
        const mCenterX = targetMonster.x + targetMonster.width / 2;
        const mCenterY = targetMonster.y + targetMonster.height / 2;
        const angle = Math.atan2(mCenterY - minion.y, mCenterX - minion.x);

        minion.direction = mCenterX < minion.x ? 'left' : 'right';
        const reach = minion.type === 'bear' ? 28 : (minion.type === 'shadow' ? 24 : 22);

        if (closestDist > reach) {
          // Rush to monster
          const moveSpeed = minion.speed * deltaTime;
          minion.x += Math.cos(angle) * moveSpeed;
          minion.y += Math.sin(angle) * moveSpeed;
        } else {
          // Inside attack reach! Attack!
          if (minion.attackCooldown <= 0) {
            minion.attackCooldown = minion.type === 'bear' ? 1.35 : (minion.type === 'shadow' ? 0.75 : 1.05);
            minion.attackTimer = 0.28;

            let baseDmg = minion.attackPower;
            const isCrit = Math.random() < 0.22;
            const finalDmg = isCrit ? Math.round(baseDmg * 1.6) : Math.round(baseDmg);

            const res = targetMonster.takeDamage(finalDmg, minion.x, minion.y);
            AudioEngine.playHit(isCrit);
            this.spawnHitSparks(mCenterX, mCenterY, isCrit);
            this.camera.shake(isCrit ? 3.0 : 1.6, 0.08);

            const hitColor = minion.type === 'skeleton' ? '#c084fc' : (minion.type === 'bear' ? '#f472b6' : '#38bdf8');
            const icon = minion.type === 'skeleton' ? '💀' : (minion.type === 'bear' ? '🐾' : '🗡️');
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `${icon} -${res.damage}`;
            this.floatingText.spawn(mCenterX, targetMonster.y - 12, hitText, isCrit ? '#facc15' : hitColor);

            if (res.isDead) {
              this.handleMonsterDefeated(targetMonster);
            }
          }
        }
      } else {
        // --- ESCORT / ORBITING FORMATION ---
        const angleOffset = (i * (Math.PI * 2 / Math.max(1, minions.length))) + (Date.now() * 0.0015);
        const formationDistance = 26 + (i * 6);
        const targetX = playerCenterX + Math.cos(angleOffset) * formationDistance - 6;
        const targetY = playerCenterY + Math.sin(angleOffset) * formationDistance - 6;

        const distToFormation = Math.hypot(targetX - minion.x, targetY - minion.y);
        minion.direction = playerCenterX < minion.x ? 'left' : 'right';

        if (distToFormation > 220) {
          minion.x = playerCenterX - 14;
          minion.y = playerCenterY;
        } else if (distToFormation > 14) {
          const followAngle = Math.atan2(targetY - minion.y, targetX - minion.x);
          const followSpeed = (minion.speed * 1.15) * deltaTime;
          minion.x += Math.cos(followAngle) * Math.min(distToFormation, followSpeed);
          minion.y += Math.sin(followAngle) * Math.min(distToFormation, followSpeed);
        }
      }
    }
  }

  private handleMonsterAttackMinion(monster: Monster, minion: any, atk: number): void {
    if (minion.hp <= 0) return;
    minion.hp = Math.max(0, minion.hp - atk);
    this.floatingText.spawn(minion.x + 6, minion.y - 10, `-${atk}`, '#f87171');
    AudioEngine.playPlayerHurt();
    this.spawnHitSparks(minion.x + 6, minion.y + 10, false);
    this.camera.shake(2.0, 0.10);

    if (minion.hp <= 0) {
      this.floatingText.spawn(minion.x + 6, minion.y - 18, `☠️ ${minion.name} gugur!`, '#ef4444', 2.0);
      const idx = this.player.minions.indexOf(minion);
      if (idx !== -1) {
        this.player.minions.splice(idx, 1);
      }
    }
  }
}
