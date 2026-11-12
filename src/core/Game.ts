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
import { DungeonFloor3 } from '../world/DungeonFloor3.ts';
import { DungeonEldoria } from '../world/DungeonEldoria.ts';
import { DungeonStonewatch } from '../world/DungeonStonewatch.ts';
import { BuildingInteriors, InteriorId } from '../world/BuildingInteriors.ts';
import { Companion, CompanionType } from '../entities/Companion.ts';
import { CookingSystem } from '../systems/CookingSystem.ts';
import { Pet } from '../systems/TamingSystem.ts';
import { TitleSystem } from '../systems/TitleSystem.ts';
import { BankSystem } from '../systems/BankSystem.ts';
import { MarketSystem } from '../systems/MarketSystem.ts';
import { LeaderboardUI } from '../ui/LeaderboardUI.ts';
import { CanvasText } from '../utils/CanvasText.ts';

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

  // Map, Dungeon & Building Interiors state
  public currentMap:
    | 'OVERWORLD'
    | 'DUNGEON'
    | 'DUNGEON_FLOOR_2'
    | 'DUNGEON_FLOOR_3'
    | 'DUNGEON_ELDORIA'
    | 'DUNGEON_STONEWATCH'
    | 'INTERIOR_GUILD'
    | 'INTERIOR_BLACKSMITH'
    | 'INTERIOR_APOTHECARY'
    | 'INTERIOR_KITCHEN'
    | 'INTERIOR_BANK'
    | 'INTERIOR_ELDORIA'
    | 'INTERIOR_STONEWATCH' = 'OVERWORLD';
  public buildingInteriors: BuildingInteriors;
  private caveEntrance: CaveEntrance;
  private dungeonMap: DungeonMap;
  private dungeonMonsters: Monster[] = [];
  private dungeonChests: Chest[] = [];
  private dungeonWorldItems: WorldItem[] = [];

  // Dungeon Floor 2 (Ancient Crypt Ruins)
  private dungeonFloor2: DungeonFloor2 = new DungeonFloor2();
  private floor2Monsters: Monster[] = [];
  private floor2WorldItems: WorldItem[] = [];

  // Dungeon Floor 3 (Abyssal Infernal Sanctum)
  private dungeonFloor3: DungeonFloor3 = new DungeonFloor3();
  private floor3Monsters: Monster[] = [];
  private floor3Chests: Chest[] = [];
  private floor3WorldItems: WorldItem[] = [];

  // Dungeon Eldoria (Sylvan Temple - Desa Eldoria)
  private dungeonEldoria: DungeonEldoria = new DungeonEldoria();
  private eldoriaMonsters: Monster[] = [];
  private eldoriaChests: Chest[] = [];
  private eldoriaWorldItems: WorldItem[] = [];
  public isEldoriaDungeonUnlocked: boolean = false;

  // Dungeon Stonewatch (Cursed Abyssal Iron Mine - Desa Stonewatch)
  private dungeonStonewatch: DungeonStonewatch = new DungeonStonewatch();
  private stonewatchMonsters: Monster[] = [];
  private stonewatchChests: Chest[] = [];
  private stonewatchWorldItems: WorldItem[] = [];
  public isStonewatchDungeonUnlocked: boolean = false;

  // Day/Night & Weather Engine
  public timeWeatherEngine: TimeWeatherEngine = new TimeWeatherEngine();

  // Adventurer Party Companion & Auto-Loot Pet
  public companion: Companion | null = null;
  public pet: Pet | null = null;

  // Cooking, Titles & Leaderboard Systems
  private cookingSystem: CookingSystem = new CookingSystem();
  private titleSystem: TitleSystem = new TitleSystem();
  public bankSystem: BankSystem = new BankSystem();
  public marketSystem: MarketSystem = new MarketSystem();
  private bankInterestTimer: number = 0;
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

  // Active Bottom Action Prompt Rect for Direct Touch Interaction
  private bottomActionPromptRect: { x: number; y: number; w: number; h: number } | null = null;

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
    this.inventoryUI.onTeleportToVillage = () => {
      if (this.currentMap === 'OVERWORLD') {
        this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌀 Kamu sudah berada di Alun-Alun Desa!', '#38bdf8');
        return false;
      }
      this.currentMap = 'OVERWORLD';
      this.buildingInteriors.activeInterior = null;
      this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 50 * CONSTANTS.TILE_SIZE + 3;
      this.player.direction = 'down';
      this.camera.setWorldBounds(this.tileMap.width * CONSTANTS.TILE_SIZE, this.tileMap.height * CONSTANTS.TILE_SIZE);
      this.camera.update(this.player.x, this.player.y);
      AudioEngine.playLevelUp();
      this.triggerMapTransition('「 DESA OAKHAVEN 」', 'Kembali Melalui Gulungan Portal');
      this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌀 Teleportasi ke Alun-Alun Desa!', '#38bdf8', 3.0);
      this.saveSessionSnapshot();
      return true;
    };
    this.skillBarUI = new SkillBarUI(this.player, this.floatingText);
    this.controlSettingsModal = new ControlSettingsModal();
    this.controlSettingsModal.onConfigChange = () => this.handleResize();

    // Inisialisasi UpdateService untuk auto-refresh seamless saat ada pembaruan file
    UpdateService.init();
    UpdateService.isSafeToReload = () => {
      return (
        this.onboardingUI.state === 'PLAYING' &&
        !this.isAnyModalOpen()
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
    this.questManager.onQuestTurnedIn = (q) => {
      if (q.id === 'Q_ARC_COLLECT_GEMS') {
        this.titleSystem.unlockTitle('RELIC_MASTER', this.player, this.floatingText);
      }
      if (q.category === 'ANIME_ARC' && q.arcTitle) {
        this.triggerMapTransition(`「 ${q.arcTitle} 」`, '★ Babak Cerita Berhasil Diselesaikan! ★');
        this.titleSystem.unlockTitle('ANIME_HERO', this.player, this.floatingText);
      }
    };
    this.villageManager = new VillageManager(this.questManager);
    this.villageManager.onOpenMarket = () => {
      this.marketSystem.open();
    };
    this.marketSystem.onBuySuccess = () => {
      this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
    };
    this.miniMapUI = new MiniMapUI();
    this.quickPotionUI = new QuickPotionUI(this.player, this.floatingText);
    this.atmosphereEngine = new AtmosphereEngine();
    this.buildingInteriors = new BuildingInteriors();

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
    this.initFloor3Monsters();
    this.initEldoriaDungeon();
    this.initStonewatchDungeon();

    // Pulihkan status akses tangga/portal lantai jika pemain sudah memiliki gelar bos
    if (this.titleSystem.unlockedTitles.has('CRYPT_CONQUEROR')) {
      this.dungeonMap.isFloor2Unlocked = true;
    }
    if (this.titleSystem.unlockedTitles.has('TITAN_BREAKER')) {
      this.dungeonFloor2.isFloor3Unlocked = true;
    }
    if (this.titleSystem.unlockedTitles.has('SYLVAN_WARDEN')) {
      this.isEldoriaDungeonUnlocked = true;
    }
    if (this.titleSystem.unlockedTitles.has('MINE_CONQUEROR')) {
      this.isStonewatchDungeonUnlocked = true;
    }

    // Hubungkan teka-teki NPC Desa dengan pembukaan dungeon tersembunyi
    this.villageManager.onSolveRiddle = (riddleId: 'ELDORIA' | 'STONEWATCH') => {
      if (riddleId === 'ELDORIA') {
        this.isEldoriaDungeonUnlocked = true;
        AudioEngine.playLevelUp();
        this.camera.shake(4.0, 0.25);
        this.floatingText.spawn(this.player.x + 10, this.player.y - 28, '🌿 Segel Kuil Roh Hutan Terbuka!', '#4ade80', 4.0);
        this.saveSessionSnapshot();
      } else if (riddleId === 'STONEWATCH') {
        this.isStonewatchDungeonUnlocked = true;
        AudioEngine.playLevelUp();
        this.camera.shake(4.0, 0.25);
        this.floatingText.spawn(this.player.x + 10, this.player.y - 28, '⚒️ Gerbang Tambang Besi Abisal Terbuka!', '#f59e0b', 4.0);
        this.saveSessionSnapshot();
      }
    };

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

    // Setup Desktop Keyboard Shortcuts (1: HP Potion, 2: MP Potion, M: MiniMap, B: Tas, Escape: Tutup Dialog/Modal)
    window.addEventListener('keydown', (e) => {
      if (this.onboardingUI.state !== 'PLAYING') return;

      // Escape key to close active modal or dialog
      if (e.key === 'Escape') {
        if (NotificationModal.isOpen) {
          NotificationModal.close();
          return;
        }
        if (this.controlSettingsModal.isOpen) {
          this.controlSettingsModal.close();
          return;
        }
        if (this.marketSystem.isOpen) {
          this.marketSystem.close();
          return;
        }
        if (this.bankSystem.isOpen) {
          this.bankSystem.close();
          return;
        }
        if (this.inventoryUI.isOpen) {
          this.inventoryUI.close();
          return;
        }
        if (this.cookingSystem.isOpen) {
          this.cookingSystem.close();
          return;
        }
        if (this.titleSystem.isOpen) {
          this.titleSystem.close();
          return;
        }
        if (this.leaderboardUI.isOpen) {
          this.leaderboardUI.close();
          return;
        }
        if (this.guildNPC.isAppraisalOpen) {
          this.guildNPC.closeAppraisal();
          return;
        }
        if (this.blacksmithNPC.isWorkshopOpen) {
          this.blacksmithNPC.closeWorkshop();
          return;
        }
        if (this.villageManager.isDialogOpen) {
          this.villageManager.closeDialog();
          return;
        }
        const companionModal = document.getElementById('companion-hire-modal');
        if (companionModal) {
          companionModal.remove();
          return;
        }
        return;
      }

      // Do not trigger game shortcuts if any modal is open
      if (this.isAnyModalOpen()) return;

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

      // 0. Village Dialog Modal (Bekerja di Overworld maupun di dalam Interior Ruangan)
      if (this.villageManager.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight, this.player, this.floatingText)) {
        return true;
      }

      // 0.1 Bank Royal Val Modal (Pertukaran, Tabungan & Bunga)
      if (this.bankSystem.handleTouch(touchX, touchY, this.player, this.floatingText)) {
        return true;
      }

      // 0.2 Market System Modal (Distrik Pasar Raya Oakhaven)
      if (
        this.marketSystem.handleTouch(
          touchX,
          touchY,
          this.player,
          this.pet,
          this.floatingText,
          (petType) => {
            this.pet = new Pet(petType, this.player.x + 20, this.player.y);
            this.titleSystem.unlockTitle('BEAST_TAMER', this.player, this.floatingText);
            AudioEngine.playLevelUp();
            this.saveSessionSnapshot();
          },
          () => {
            this.pet = null;
            this.saveSessionSnapshot();
          }
        )
      ) {
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
      // 4. Inventory Backpack & Card Modal
      if (this.inventoryUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // Jika ada modal apapun yang sedang aktif, telan sentuhan agar tidak memicu tombol latar belakang
      if (this.isAnyModalOpen()) {
        return true;
      }

      // --- KONTROL HUD HANYA DAPAT DISENTUH SAAT TIDAK ADA MODAL AKTIF ---
      // 0.1 Mini-Map Touch
      if (this.miniMapUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // 0.2 Quick Potion Buttons (HP & MP)
      if (this.quickPotionUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // Gelar & Achievement Button (👑)
      const titleBtn = { x: this.screenWidth - 128, y: 10, size: 34 };
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
      const fsBtn = { x: this.screenWidth - 170, y: 10, size: 34 };
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
        const instBtn = { x: this.screenWidth - 254, y: 10, size: 34 };
        if (
          touchX >= instBtn.x &&
          touchX <= instBtn.x + instBtn.size &&
          touchY >= instBtn.y &&
          touchY <= instBtn.y + instBtn.size
        ) {
          PwaService.promptInstall();
          return true;
        }
      }

      // 2. Auth Profile / Logout buttons
      if (this.authUI.handleTouch(touchX, touchY, this.screenWidth)) {
        return true;
      }
      // 3. Mobile Skill Bar
      if (this.skillBarUI.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight)) {
        return true;
      }

      // 5. Sentuhan langsung pada Banner Prompt Aksi Bawah Layar (Mobile Friendly Action Tap)
      if (this.bottomActionPromptRect) {
        const { x, y, w, h } = this.bottomActionPromptRect;
        if (touchX >= x && touchX <= x + w && touchY >= y && touchY <= y + h) {
          this.input.state.isAction = true;
          this.input.isActionJustPressed = true;
          return true;
        }
      }

      return false;
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

    const openedFloor3ChestsIndices: number[] = [];
    this.floor3Chests.forEach((chest, idx) => {
      if (chest.isOpen) openedFloor3ChestsIndices.push(idx);
    });

    const openedEldoriaChestsIndices: number[] = [];
    this.eldoriaChests.forEach((chest, idx) => {
      if (chest.isOpen) openedEldoriaChestsIndices.push(idx);
    });

    const openedStonewatchChestsIndices: number[] = [];
    this.stonewatchChests.forEach((chest, idx) => {
      if (chest.isOpen) openedStonewatchChestsIndices.push(idx);
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
      openedFloor3Chests: openedFloor3ChestsIndices,
      openedEldoriaChests: openedEldoriaChestsIndices,
      openedStonewatchChests: openedStonewatchChestsIndices,
      isFloor2Unlocked: this.dungeonMap.isFloor2Unlocked || this.titleSystem.unlockedTitles.has('CRYPT_CONQUEROR'),
      isFloor3Unlocked: this.dungeonFloor2.isFloor3Unlocked || this.titleSystem.unlockedTitles.has('TITAN_BREAKER'),
      isEldoriaDungeonUnlocked: this.isEldoriaDungeonUnlocked || this.titleSystem.unlockedTitles.has('SYLVAN_WARDEN'),
      isStonewatchDungeonUnlocked: this.isStonewatchDungeonUnlocked || this.titleSystem.unlockedTitles.has('MINE_CONQUEROR'),
      companionType: this.companion ? this.companion.type : null,
      petType: this.pet ? this.pet.type : null,
      isGuest: this.authUI.isGuest,
      equippedWeaponId: this.player.equippedWeaponId,
      unlockedWeaponIds: this.player.unlockedWeaponIds,
      val: this.player.val,
      bankSavings: this.player.bankSavings,
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
      if (typeof data.val === 'number') this.player.val = data.val;
      if (typeof data.bankSavings === 'number') this.player.bankSavings = data.bankSavings;
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

      // Pulihkan peti yang sudah terbuka di Lantai 3
      if (Array.isArray(data.openedFloor3Chests)) {
        for (const idx of data.openedFloor3Chests) {
          if (this.floor3Chests[idx]) {
            this.floor3Chests[idx].isOpen = true;
          }
        }
      }

      // Pulihkan peti yang sudah terbuka di Kuil Eldoria
      if (Array.isArray(data.openedEldoriaChests)) {
        for (const idx of data.openedEldoriaChests) {
          if (this.eldoriaChests[idx]) {
            this.eldoriaChests[idx].isOpen = true;
          }
        }
      }

      // Pulihkan peti yang sudah terbuka di Tambang Stonewatch
      if (Array.isArray(data.openedStonewatchChests)) {
        for (const idx of data.openedStonewatchChests) {
          if (this.stonewatchChests[idx]) {
            this.stonewatchChests[idx].isOpen = true;
          }
        }
      }

      // Pulihkan status tangga & portal antar lantai & dungeon tersembunyi
      if (data.isFloor2Unlocked || this.titleSystem.unlockedTitles.has('CRYPT_CONQUEROR')) {
        this.dungeonMap.isFloor2Unlocked = true;
      }
      if (data.isFloor3Unlocked || this.titleSystem.unlockedTitles.has('TITAN_BREAKER')) {
        this.dungeonFloor2.isFloor3Unlocked = true;
      }
      if (data.isEldoriaDungeonUnlocked || this.titleSystem.unlockedTitles.has('SYLVAN_WARDEN')) {
        this.isEldoriaDungeonUnlocked = true;
      }
      if (data.isStonewatchDungeonUnlocked || this.titleSystem.unlockedTitles.has('MINE_CONQUEROR')) {
        this.isStonewatchDungeonUnlocked = true;
      }

      // Pulihkan Rekan Party Companion & Pet Auto-Loot
      if (data.companionType && !this.companion) {
        this.companion = new Companion(data.companionType, this.player.x - 24, this.player.y);
      }
      if (data.petType && !this.pet) {
        this.pet = new Pet(data.petType, this.player.x + 20, this.player.y);
      }

      // Pulihkan lokasi map (Overworld, Dungeon, atau Interior Bangunan)
      if (typeof data.currentMap === 'string' && data.currentMap.startsWith('INTERIOR_')) {
        this.currentMap = data.currentMap as any;
        const interiorId = this.getInteriorIdFromCurrentMap();
        if (interiorId) {
          const def = this.buildingInteriors.doors[interiorId];
          this.buildingInteriors.activeInterior = interiorId;
          this.camera.setWorldBounds(def.roomWidth * CONSTANTS.TILE_SIZE, def.roomHeight * CONSTANTS.TILE_SIZE);
        }
      } else if (data.currentMap === 'DUNGEON') {
        this.currentMap = 'DUNGEON';
        this.camera.setWorldBounds(this.dungeonMap.width * CONSTANTS.TILE_SIZE, this.dungeonMap.height * CONSTANTS.TILE_SIZE);
      } else if (data.currentMap === 'DUNGEON_FLOOR_2') {
        this.currentMap = 'DUNGEON_FLOOR_2';
        this.camera.setWorldBounds(this.dungeonFloor2.width * CONSTANTS.TILE_SIZE, this.dungeonFloor2.height * CONSTANTS.TILE_SIZE);
      } else if (data.currentMap === 'DUNGEON_FLOOR_3') {
        this.currentMap = 'DUNGEON_FLOOR_3';
        this.camera.setWorldBounds(this.dungeonFloor3.width * CONSTANTS.TILE_SIZE, this.dungeonFloor3.height * CONSTANTS.TILE_SIZE);
      } else if (data.currentMap === 'DUNGEON_ELDORIA') {
        this.currentMap = 'DUNGEON_ELDORIA';
        this.camera.setWorldBounds(this.dungeonEldoria.width * CONSTANTS.TILE_SIZE, this.dungeonEldoria.height * CONSTANTS.TILE_SIZE);
      } else if (data.currentMap === 'DUNGEON_STONEWATCH') {
        this.currentMap = 'DUNGEON_STONEWATCH';
        this.camera.setWorldBounds(this.dungeonStonewatch.width * CONSTANTS.TILE_SIZE, this.dungeonStonewatch.height * CONSTANTS.TILE_SIZE);
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
        { itemId: 'HEALTH_POTION', count: 2 },
        { itemId: 'BRONZE_COIN', count: 4 }
      ]),
      new Chest(47 * ts + 5, 52 * ts + 6, [
        { itemId: 'MAGIC_FLOWER', count: 4 },
        { itemId: 'WOOD_LOG', count: 6 }
      ]),
      new Chest(54 * ts + 5, 54 * ts + 6, [
        { itemId: 'BRONZE_COIN', count: 6 },
        { itemId: 'HEALTH_POTION', count: 1 },
        { itemId: 'MANA_POTION', count: 1 }
      ])
    );

    // 2. World Items
    const scatterOffsets = [
      { dx: -2, dy: -2, item: 'MAGIC_FLOWER', count: 2 },
      { dx: 2, dy: -1, item: 'WOOD_LOG', count: 3 },
      { dx: -3, dy: 2, item: 'WOOD_LOG', count: 2 },
      { dx: 3, dy: 1, item: 'BRONZE_COIN', count: 2 },
      { dx: -1, dy: 3, item: 'HEALTH_POTION', count: 1 },
      { dx: 4, dy: -3, item: 'MAGIC_FLOWER', count: 1 },
      { dx: -4, dy: -2, item: 'BRONZE_COIN', count: 3 },
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
        { itemId: 'BRONZE_COIN', count: 4 },
        { itemId: 'SILVER_COIN', count: 1 },
        { itemId: 'HEALTH_POTION', count: 1 },
        { itemId: 'ANCIENT_BONE', count: 2 },
        { itemId: 'DARK_IRON_ORE', count: 2 }
      ]),
      // Peti 2: Gua Kristal Mineral (East Cavern)
      new Chest(34 * ts + 5, 15 * ts + 6, [
        { itemId: 'BRONZE_COIN', count: 6 },
        { itemId: 'SILVER_COIN', count: 2 },
        { itemId: 'MANA_POTION', count: 1 },
        { itemId: 'DARK_IRON_ORE', count: 3 }
      ]),
      // Peti 3: Harta Karun Legendaris di Belakang Altar Bos (North Chamber)
      new Chest(24 * ts + 5, 4 * ts + 6, [
        { itemId: 'SILVER_COIN', count: 3 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'DUNGEON_GEM', count: 1 },
        { itemId: 'HEALTH_POTION', count: 2 },
        { itemId: 'MANA_POTION', count: 2 },
        { itemId: 'DARK_IRON_ORE', count: 4 }
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
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      if (this.player.val > 0) {
        const lostVal = Math.min(this.player.val, Math.max(10, Math.floor(this.player.val * 0.1)));
        this.player.removeVal(lostVal);
        this.floatingText.spawn(this.player.x + 10, this.player.y - 36, `💸 Biaya Evakuasi Balai Kota: -${lostVal} 𝒱 (Tabungan Bank Aman!)`, '#f87171', 4.0);
      }
    } else {
      // Tempatkan pemain di pelataran depan pintu masuk goa di Hutan Rimba
      this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 35 * CONSTANTS.TILE_SIZE + 3;
    }
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
      new Monster('f2_golem_4', 'STONE_GOLEM', 30 * ts + 4, 21 * ts + 4),
      // Boss Arena: Altar Golem Titan (Utara)
      new Monster('f2_boss_titan', 'BOSS_TITAN_GOLEM', 20 * ts, 8 * ts)
    ];
  }

  private initFloor3Monsters(): void {
    const ts = CONSTANTS.TILE_SIZE;
    this.floor3Monsters = [
      // West Hellhound Kennels (Lantai 3 Barat)
      new Monster('f3_hellhound_1', 'INFERNO_HELLHOUND', 7 * ts, 18 * ts),
      new Monster('f3_hellhound_2', 'INFERNO_HELLHOUND', 10 * ts, 22 * ts),
      new Monster('f3_hellhound_3', 'INFERNO_HELLHOUND', 6 * ts, 23 * ts),
      // East Reaper Sanctum (Lantai 3 Timur)
      new Monster('f3_reaper_1', 'ABYSSAL_REAPER', 30 * ts, 18 * ts),
      new Monster('f3_reaper_2', 'ABYSSAL_REAPER', 33 * ts, 22 * ts),
      new Monster('f3_reaper_3', 'ABYSSAL_REAPER', 31 * ts, 24 * ts),
      // Central Caldera Hall - spawn aman di ubin lantai
      new Monster('f3_hellhound_4', 'INFERNO_HELLHOUND', 17 * ts, 20 * ts),
      new Monster('f3_reaper_4', 'ABYSSAL_REAPER', 23 * ts, 20 * ts),
      new Monster('f3_knight_1', 'INFERNAL_KNIGHT', 20 * ts, 19 * ts),
      // Molten Throne Corridor & Arena Guards (Utara)
      new Monster('f3_knight_2', 'INFERNAL_KNIGHT', 19 * ts, 12 * ts),
      new Monster('f3_knight_3', 'INFERNAL_KNIGHT', 21 * ts, 12 * ts),
      new Monster('f3_knight_4', 'INFERNAL_KNIGHT', 20 * ts, 14 * ts),
      // Boss: Raja Naga Api Ignis di Singgasana Magma (North Arena)
      new Monster('f3_boss_dragon', 'BOSS_INFERNAL_DRAGON', 20 * ts - 12, 6 * ts)
    ];

    // Peti Harta Karun Lantai 3 (Ruang Rahasia Barat & Timur & Tahta Naga)
    this.floor3Chests = [
      new Chest(5 * ts + 5, 16 * ts + 6, [
        { itemId: 'SILVER_COIN', count: 3 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'DARK_IRON_ORE', count: 4 },
        { itemId: 'HEALTH_POTION', count: 2 }
      ]),
      new Chest(34 * ts + 5, 16 * ts + 6, [
        { itemId: 'SILVER_COIN', count: 4 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'DUNGEON_GEM', count: 1 },
        { itemId: 'MANA_POTION', count: 2 }
      ]),
      new Chest(27 * ts + 8, 4 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 5 },
        { itemId: 'GOLD_COIN', count: 2 },
        { itemId: 'PLATINUM_COIN', count: 1 },
        { itemId: 'DUNGEON_GEM', count: 3 },
        { itemId: 'DARK_IRON_ORE', count: 6 },
        { itemId: 'HEALTH_POTION', count: 3 },
        { itemId: 'MANA_POTION', count: 3 }
      ])
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

  public enterFloor3(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON_FLOOR_3';
    this.player.x = this.dungeonFloor3.entranceSpawnX;
    this.player.y = this.dungeonFloor3.entranceSpawnY;
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

    this.camera.setWorldBounds(this.dungeonFloor3.width * CONSTANTS.TILE_SIZE, this.dungeonFloor3.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 SANCTUARIUM NERAKA ABISAL · LANTAI 3 」', '~ Sarang Raja Naga Api Ignis & Ksatria Neraka ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🔥 Memasuki Lantai 3 Neraka!', '#f97316', 3.0);
    this.saveSessionSnapshot();
  }

  public exitFloor3(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON_FLOOR_2';
    this.player.x = this.dungeonFloor2.floor3PortalX;
    this.player.y = this.dungeonFloor2.floor3PortalY + 36;
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

    this.camera.setWorldBounds(this.dungeonFloor2.width * CONSTANTS.TILE_SIZE, this.dungeonFloor2.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 MAKAM KUNO RUINAS ABISAL · LANTAI 2 」', '~ Kembali ke Labirin Titan Abisal ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '▲ Naik ke Lantai 2', '#60a5fa', 3.0);
    this.saveSessionSnapshot();
  }

  private initEldoriaDungeon(): void {
    const ts = CONSTANTS.TILE_SIZE;
    this.eldoriaMonsters = [
      // West Sylvan Grove (Desa Eldoria Barat) - Ruang x:4..12, y:18..26
      new Monster('eld_sprite_1', 'SYLVAN_SPRITE', 8 * ts, 21 * ts),
      new Monster('eld_creeper_1', 'VINE_CREEPER', 10 * ts, 20 * ts),
      new Monster('eld_sprite_2', 'SYLVAN_SPRITE', 6 * ts, 22 * ts),
      // East Sylvan Arboretum (Desa Eldoria Timur) - Ruang x:24..32, y:18..26
      new Monster('eld_sprite_3', 'SYLVAN_SPRITE', 27 * ts, 21 * ts),
      new Monster('eld_treant_1', 'TREANT_WARRIOR', 25 * ts, 20 * ts),
      new Monster('eld_creeper_2', 'VINE_CREEPER', 29 * ts, 22 * ts),
      // Central Corridors & Sacred Spring (Koridor Barat x:14 & Koridor Timur x:22 aman)
      new Monster('eld_treant_2', 'TREANT_WARRIOR', 14 * ts, 22 * ts),
      new Monster('eld_creeper_3', 'VINE_CREEPER', 22 * ts, 22 * ts),
      new Monster('eld_sprite_4', 'SYLVAN_SPRITE', 18 * ts, 22 * ts), // Monster air suci (dapat dilawan dengan berenang!)
      // North Sacred Grove: Boss Ancient Ent & Penjaga (Lorong x:17..19 aman di ubin lantai)
      new Monster('eld_treant_3', 'TREANT_WARRIOR', 17 * ts, 11 * ts),
      new Monster('eld_treant_4', 'TREANT_WARRIOR', 19 * ts, 11 * ts),
      new Monster('eld_boss_ent', 'BOSS_ANCIENT_ENT', 18 * ts - 12, 6 * ts)
    ];

    this.eldoriaChests = [
      new Chest(7 * ts + 8, 21 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 3 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'MAGIC_FLOWER', count: 4 },
        { itemId: 'HEALTH_POTION', count: 2 }
      ]),
      new Chest(28 * ts + 8, 21 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 4 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'MANA_POTION', count: 2 },
        { itemId: 'DUNGEON_GEM', count: 1 }
      ]),
      new Chest(24 * ts + 8, 5 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 5 },
        { itemId: 'GOLD_COIN', count: 2 },
        { itemId: 'PLATINUM_COIN', count: 1 },
        { itemId: 'DUNGEON_GEM', count: 3 },
        { itemId: 'MAGIC_FLOWER', count: 6 },
        { itemId: 'HEALTH_POTION', count: 3 },
        { itemId: 'MANA_POTION', count: 3 }
      ])
    ];
  }

  private initStonewatchDungeon(): void {
    const ts = CONSTANTS.TILE_SIZE;
    this.stonewatchMonsters = [
      // West Crystal Shaft (Lorong Tambang Kristal Barat) - Ruang x:4..12, y:18..26
      new Monster('stone_spider_1', 'CRYSTAL_SPIDER', 8 * ts, 21 * ts),
      new Monster('stone_spider_2', 'CRYSTAL_SPIDER', 6 * ts, 20 * ts),
      new Monster('stone_skel_1', 'IRONCLAD_SKELETON', 10 * ts, 22 * ts),
      // East Smelting Cavern (Gua Peleburan Besi Timur) - Ruang x:24..32, y:18..26
      new Monster('stone_skel_2', 'IRONCLAD_SKELETON', 26 * ts, 21 * ts),
      new Monster('stone_golem_1', 'ARMORED_GOLEM', 28 * ts, 20 * ts),
      new Monster('stone_spider_3', 'CRYSTAL_SPIDER', 29 * ts, 22 * ts),
      // Central Quarry Corridors (Koridor Barat x:14 & Koridor Timur x:22 aman)
      new Monster('stone_golem_2', 'ARMORED_GOLEM', 14 * ts, 22 * ts),
      new Monster('stone_skel_3', 'IRONCLAD_SKELETON', 22 * ts, 22 * ts),
      new Monster('stone_spider_4', 'CRYSTAL_SPIDER', 18 * ts, 22 * ts),
      // North Boss Foundry: Boss Obsidian Behemoth & Penjaga (Lorong x:17..19 aman di ubin lantai)
      new Monster('stone_golem_3', 'ARMORED_GOLEM', 17 * ts, 11 * ts),
      new Monster('stone_golem_4', 'ARMORED_GOLEM', 19 * ts, 11 * ts),
      new Monster('stone_boss_behemoth', 'BOSS_OBSIDIAN_BEHEMOTH', 18 * ts - 12, 6 * ts)
    ];

    this.stonewatchChests = [
      new Chest(7 * ts + 8, 21 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 3 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'DARK_IRON_ORE', count: 4 },
        { itemId: 'HEALTH_POTION', count: 2 }
      ]),
      new Chest(27 * ts + 8, 20 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 4 },
        { itemId: 'GOLD_COIN', count: 1 },
        { itemId: 'DARK_IRON_ORE', count: 5 },
        { itemId: 'DUNGEON_GEM', count: 1 },
        { itemId: 'MANA_POTION', count: 2 }
      ]),
      new Chest(24 * ts + 8, 5 * ts + 8, [
        { itemId: 'SILVER_COIN', count: 5 },
        { itemId: 'GOLD_COIN', count: 2 },
        { itemId: 'PLATINUM_COIN', count: 1 },
        { itemId: 'DUNGEON_GEM', count: 3 },
        { itemId: 'DARK_IRON_ORE', count: 8 },
        { itemId: 'HEALTH_POTION', count: 3 },
        { itemId: 'MANA_POTION', count: 3 }
      ])
    ];
  }

  public enterDungeonEldoria(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON_ELDORIA';
    this.player.x = this.dungeonEldoria.entranceSpawnX;
    this.player.y = this.dungeonEldoria.entranceSpawnY;
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
    AudioEngine.playBgm('DUNGEON_ELDORIA');

    this.camera.setWorldBounds(this.dungeonEldoria.width * CONSTANTS.TILE_SIZE, this.dungeonEldoria.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 KUIL ROH HUTAN ELDORIA 」', '~ Tempat Bersemayam Ent Kuno Pelindung Alam ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌿 Memasuki Kuil Roh Hutan!', '#4ade80', 3.0);
    this.saveSessionSnapshot();
  }

  public exitDungeonEldoria(isDeath: boolean = false): void {
    if (this.transitionCooldown > 0 && !isDeath) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'OVERWORLD';
    if (isDeath) {
      this.player.x = 21 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 20 * CONSTANTS.TILE_SIZE + 3;
    } else {
      this.player.x = 21 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 15 * CONSTANTS.TILE_SIZE + 3;
    }
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
    AudioEngine.playBgm('OVERWORLD');

    this.camera.setWorldBounds(CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 DESA PERI ELDORIA 」', '~ Hutan Kuno Perlindungan Roh Alam ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌤️ Kembali ke Desa Eldoria', '#4ade80', 3.0);
    this.saveSessionSnapshot();
  }

  public enterDungeonStonewatch(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'DUNGEON_STONEWATCH';
    this.player.x = this.dungeonStonewatch.entranceSpawnX;
    this.player.y = this.dungeonStonewatch.entranceSpawnY;
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
    AudioEngine.playBgm('DUNGEON_STONEWATCH');

    this.camera.setWorldBounds(this.dungeonStonewatch.width * CONSTANTS.TILE_SIZE, this.dungeonStonewatch.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 TAMBANG BESI ABISAL STONEWATCH 」', '~ Kedalaman Gelap & Altar Behemoth Obsidian ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '⚒️ Memasuki Tambang Besi Abisal!', '#f59e0b', 3.0);
    this.saveSessionSnapshot();
  }

  public exitDungeonStonewatch(isDeath: boolean = false): void {
    if (this.transitionCooldown > 0 && !isDeath) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    this.currentMap = 'OVERWORLD';
    if (isDeath) {
      this.player.x = 84 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 65 * CONSTANTS.TILE_SIZE + 3;
    } else {
      this.player.x = 85 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 60 * CONSTANTS.TILE_SIZE + 3;
    }
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
    AudioEngine.playBgm('OVERWORLD');

    this.camera.setWorldBounds(CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('「 DESA BENTENG STONEWATCH 」', '~ Tambang Kurcaci & Benteng Pertahanan ~');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌤️ Kembali ke Desa Stonewatch', '#f59e0b', 3.0);
    this.saveSessionSnapshot();
  }

  /**
   * Cek terpusat apakah ada modal, dialog, atau menu overlay yang sedang terbuka.
   * Meliputi: Inventory/Kartu, Village Dialog, Guild Appraisal, Blacksmith Workshop,
   * Royal Bank, Market Shop, Control Settings, Cooking, Title/Gelar, Leaderboard,
   * Notification Modal, serta Companion Hire Modal.
   */
  public isAnyModalOpen(): boolean {
    const isCompanionModalOpen = typeof document !== 'undefined' && document.getElementById('companion-hire-modal') !== null;
    return (
      this.inventoryUI.isOpen ||
      this.inventoryUI.isCardModalOpen ||
      this.villageManager.isDialogOpen ||
      this.guildNPC.isAppraisalOpen ||
      this.blacksmithNPC.isWorkshopOpen ||
      this.bankSystem.isOpen ||
      this.marketSystem.isOpen ||
      this.controlSettingsModal.isOpen ||
      NotificationModal.isOpen ||
      this.cookingSystem.isOpen ||
      this.titleSystem.isOpen ||
      this.leaderboardUI.isOpen ||
      isCompanionModalOpen
    );
  }

  public isCurrentMapInterior(): boolean {
    return this.currentMap.startsWith('INTERIOR_');
  }

  public getInteriorIdFromCurrentMap(): InteriorId | null {
    switch (this.currentMap) {
      case 'INTERIOR_GUILD': return 'GUILD_HALL';
      case 'INTERIOR_BLACKSMITH': return 'BLACKSMITH_SHOP';
      case 'INTERIOR_APOTHECARY': return 'APOTHECARY_INN';
      case 'INTERIOR_KITCHEN': return 'ADVENTURER_KITCHEN';
      case 'INTERIOR_BANK': return 'ROYAL_BANK';
      case 'INTERIOR_ELDORIA': return 'ELDORIA_SANCTUARY';
      case 'INTERIOR_STONEWATCH': return 'STONEWATCH_FOUNDRY';
      default: return null;
    }
  }

  public enterInterior(buildingId: InteriorId): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    const def = this.buildingInteriors.doors[buildingId];
    if (!def) return;

    this.buildingInteriors.activeInterior = buildingId;

    switch (buildingId) {
      case 'GUILD_HALL': this.currentMap = 'INTERIOR_GUILD'; break;
      case 'BLACKSMITH_SHOP': this.currentMap = 'INTERIOR_BLACKSMITH'; break;
      case 'APOTHECARY_INN': this.currentMap = 'INTERIOR_APOTHECARY'; break;
      case 'ADVENTURER_KITCHEN': this.currentMap = 'INTERIOR_KITCHEN'; break;
      case 'ROYAL_BANK': this.currentMap = 'INTERIOR_BANK'; break;
      case 'ELDORIA_SANCTUARY': this.currentMap = 'INTERIOR_ELDORIA'; break;
      case 'STONEWATCH_FOUNDRY': this.currentMap = 'INTERIOR_STONEWATCH'; break;
    }

    this.player.x = def.insideSpawnX;
    this.player.y = def.insideSpawnY;
    this.player.direction = 'up';

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

    AudioEngine.playMapTransition(true);
    AudioEngine.playBgm('OVERWORLD');

    this.camera.setWorldBounds(def.roomWidth * CONSTANTS.TILE_SIZE, def.roomHeight * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition(`「 ${def.name.toUpperCase()} 」`, def.subtitle);
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, `🚪 Masuk ke ${def.name}!`, def.accentColor, 2.5);
    this.saveSessionSnapshot();
  }

  public exitInterior(): void {
    if (this.transitionCooldown > 0) return;
    this.transitionCooldown = 1.0;
    this.input.consumeAction();

    const interiorId = this.getInteriorIdFromCurrentMap();
    const def = interiorId ? this.buildingInteriors.doors[interiorId] : null;

    this.buildingInteriors.activeInterior = null;
    this.currentMap = 'OVERWORLD';

    if (def) {
      this.player.x = def.overworldSpawnX;
      this.player.y = def.overworldSpawnY;
    } else {
      this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
      this.player.y = 50 * CONSTANTS.TILE_SIZE + 3;
    }
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
    AudioEngine.playBgm('OVERWORLD');

    this.camera.setWorldBounds(this.tileMap.width * CONSTANTS.TILE_SIZE, this.tileMap.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🚪 Keluar ke Pedesaan!', '#facc15', 2.0);
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
          this.saveSessionSnapshot();
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
              <div style="font-weight: bold; font-size: 13px; color: #38bdf8;">🛡️ Rodric (Ksatria Baja) [4 Emas / 400 𝒱]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Tanker tangguh berzirah baja tebal yang menarik perhatian monster.</div>
            </div>
            <button id="hire-rodric-btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>

          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #c084fc; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #c084fc;">🔮 Lyra (Penyihir Bintang Peri) [5 Emas / 500 𝒱]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Penyihir elf anggun dengan tembakan sihir bintang jarak jauh.</div>
            </div>
            <button id="hire-lyra-btn" style="background: linear-gradient(135deg, #9333ea, #7e22ce); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>

          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid #4ade80; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #4ade80;">🌿 Flora (Pendeta Suci) [4 Emas / 400 𝒱]</div>
              <div style="font-size: 11px; color: #cbd5e1;">Pendeta berhati mulia yang otomatis menyembuhkan HP saat sekarat.</div>
            </div>
            <button id="hire-flora-btn" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Rekrut</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    const closeBtn = document.getElementById('close-companion-btn');
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    const hireHelper = (type: CompanionType, goldCost: number, valCost: number, name: string, color: string) => {
      const gold = this.player.inventory.getItemCount('GOLD_COIN');
      if (gold >= goldCost) {
        this.player.inventory.removeItemsById('GOLD_COIN', goldCost);
      } else if (this.player.val >= valCost) {
        this.player.removeVal(valCost);
      } else {
        this.floatingText.spawn(this.player.x + 12, this.player.y - 16, `Butuh ${goldCost} Koin Emas atau ${valCost} 𝒱!`, '#ef4444');
        return;
      }
      this.companion = new Companion(type, this.player.x - 24, this.player.y);
      this.saveSessionSnapshot();
      AudioEngine.playLevelUp();
      this.floatingText.spawn(this.player.x + 12, this.player.y - 20, `🤝 ${name} bergabung ke Party!`, color, 2.5);
      modal.remove();
    };

    const rBtn = document.getElementById('hire-rodric-btn');
    if (rBtn) rBtn.onclick = () => hireHelper('RODRIC', 4, 400, 'Rodric', '#38bdf8');
    const lBtn = document.getElementById('hire-lyra-btn');
    if (lBtn) lBtn.onclick = () => hireHelper('LYRA', 5, 500, 'Lyra', '#c084fc');
    const fBtn = document.getElementById('hire-flora-btn');
    if (fBtn) fBtn.onclick = () => hireHelper('FLORA', 4, 400, 'Flora', '#4ade80');
  }

  public openPetAdoptionDialog(): void {
    this.marketSystem.open('PET');
  }

  private handleMonsterDefeated(monster: Monster): void {
    const isNight = this.timeWeatherEngine.isNight();
    const expReward = isNight ? Math.round(monster.expReward * 1.25) : monster.expReward;

    const leveledUp = this.player.addExp(expReward);
    this.floatingText.spawn(
      monster.x + monster.width / 2,
      monster.y - 20,
      isNight ? `+${expReward} EXP (🌙 Malam +25%)!` : `+${expReward} EXP!`,
      '#facc15',
      2.0
    );

    // Audio Monster Defeated
    AudioEngine.playMonsterDefeated(
      monster.type === 'BOSS_SLIME' ||
      monster.type === 'BOSS_TITAN_GOLEM' ||
      monster.type === 'BOSS_INFERNAL_DRAGON' ||
      monster.type === 'BOSS_ANCIENT_ENT' ||
      monster.type === 'BOSS_OBSIDIAN_BEHEMOTH'
    );

    // Update Progres Misi Petualang (Quest Manager)
    this.questManager.onMonsterDefeated(monster.type, this.floatingText, this.player.x, this.player.y);

    const targetItems =
      this.currentMap === 'OVERWORLD'
        ? this.worldItems
        : this.currentMap === 'DUNGEON'
        ? this.dungeonWorldItems
        : this.currentMap === 'DUNGEON_FLOOR_2'
        ? this.floor2WorldItems
        : this.currentMap === 'DUNGEON_FLOOR_3'
        ? this.floor3WorldItems
        : this.currentMap === 'DUNGEON_ELDORIA'
        ? this.eldoriaWorldItems
        : this.stonewatchWorldItems;

    // --- OVERWORLD MONSTER DROPS (Koin Perunggu Anime & Bahan) ---
    if (monster.type === 'FOREST_SLIME') {
      if (Math.random() < 0.70) targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'BRONZE_COIN', 1 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'SLIME_JELLY', 1));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MAGIC_FLOWER', 1));
    } else if (monster.type === 'WILD_WOLF') {
      if (Math.random() < 0.75) targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'BRONZE_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.75) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'WOLF_MEAT', 1));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'HEALTH_POTION', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MANA_POTION', 1));
    } else if (monster.type === 'GOBLIN') {
      if (Math.random() < 0.85) targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'BRONZE_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.60) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'WOOD_LOG', 2));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    }
    // --- DUNGEON FLOOR 1 MONSTER DROPS ---
    else if (monster.type === 'SLIME') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'BRONZE_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'SLIME_JELLY', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    } else if (monster.type === 'BAT') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'BRONZE_COIN', 2 + Math.floor(Math.random() * 3)));
      if (Math.random() < 0.50) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
    } else if (monster.type === 'SKELETON') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1));
      if (Math.random() < 0.65) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'ANCIENT_BONE', 1));
      if (Math.random() < 0.45) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'DARK_IRON_ORE', 1));
      if (Math.random() < 0.25) targetItems.push(new WorldItem(monster.x + 6, monster.y + 12, 'MANA_POTION', 1));
    } else if (monster.type === 'BOSS_SLIME') {
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'SILVER_COIN', 3));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 6, 'GOLD_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 2));
      targetItems.push(new WorldItem(monster.x + 24, monster.y + 12, 'DARK_IRON_ORE', 3));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 16, 'SLIME_JELLY', 3));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 14, 'HEALTH_POTION', 2));
      targetItems.push(new WorldItem(monster.x + 6, monster.y + 14, 'MANA_POTION', 2));

      // Buka akses tangga menuju Lantai 2
      this.dungeonMap.isFloor2Unlocked = true;
      this.titleSystem.unlockTitle('CRYPT_CONQUEROR', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '🏆 RAJA SLIME DIKALAHKAN!!', '#facc15', 3.5);
      this.floatingText.spawn(monster.x + 16, monster.y - 48, '🚪 TANGGA KE LANTAI 2 TERBUKA!', '#c084fc', 4.0);
    }
    // --- DUNGEON FLOOR 2 MONSTER DROPS ---
    else if (monster.type === 'STONE_GOLEM') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DARK_IRON_ORE', 1));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'ANCIENT_BONE', 1));
    } else if (monster.type === 'CRYPT_SHADOW') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MANA_POTION', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 6, monster.y + 14, 'ANCIENT_BONE', 1));
    } else if (monster.type === 'BOSS_TITAN_GOLEM') {
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'SILVER_COIN', 4));
      targetItems.push(new WorldItem(monster.x + 12, monster.y + 6, 'GOLD_COIN', 2));
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 3));
      targetItems.push(new WorldItem(monster.x + 24, monster.y + 12, 'DARK_IRON_ORE', 4));
      targetItems.push(new WorldItem(monster.x + 10, monster.y + 16, 'HEALTH_POTION', 2));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 16, 'MANA_POTION', 2));

      this.dungeonFloor2.isFloor3Unlocked = true;
      this.titleSystem.unlockTitle('TITAN_BREAKER', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '⚡ TITAN ABISAL DITUMBANGKAN!!', '#ef4444', 4.0);
      this.floatingText.spawn(monster.x + 16, monster.y - 48, '🔥 PORTAL KE LANTAI 3 TERBUKA!', '#f97316', 4.0);
    }
    // --- DUNGEON FLOOR 3 MONSTER DROPS ---
    else if (monster.type === 'INFERNO_HELLHOUND') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.60) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'WOLF_MEAT', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DARK_IRON_ORE', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'HEALTH_POTION', 1));
    } else if (monster.type === 'ABYSSAL_REAPER') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.15) targetItems.push(new WorldItem(monster.x + 6, monster.y + 2, 'GOLD_COIN', 1));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'DUNGEON_GEM', 1));
      if (Math.random() < 0.50) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 2));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'MANA_POTION', 1));
    } else if (monster.type === 'INFERNAL_KNIGHT') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.20) targetItems.push(new WorldItem(monster.x + 6, monster.y + 2, 'GOLD_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'DARK_IRON_ORE', 2));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'ANCIENT_BONE', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'HEALTH_POTION', 1));
    } else if (monster.type === 'BOSS_INFERNAL_DRAGON') {
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'GOLD_COIN', 3));
      targetItems.push(new WorldItem(monster.x + 14, monster.y + 8, 'PLATINUM_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 4));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 12, 'DARK_IRON_ORE', 6));
      targetItems.push(new WorldItem(monster.x + 10, monster.y + 16, 'HEALTH_POTION', 3));
      targetItems.push(new WorldItem(monster.x + 36, monster.y + 16, 'MANA_POTION', 3));

      this.titleSystem.unlockTitle('DRAGON_SLAYER', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 20, monster.y - 32, '👑 RAJA NAGA IGNIS DIKALAHKAN!!', '#facc15', 5.0);
      this.floatingText.spawn(monster.x + 20, monster.y - 50, '🏆 SELURUH LANTAI DUNGEON TELAH DITAKLUKKAN!', '#f97316', 5.5);
    }
    // --- DUNGEON ELDORIA (KUIL ROH HUTAN) MONSTER DROPS ---
    else if (monster.type === 'SYLVAN_SPRITE') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.60) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'MAGIC_FLOWER', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MANA_POTION', 1));
    } else if (monster.type === 'VINE_CREEPER') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.60) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'WOOD_LOG', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 1));
    } else if (monster.type === 'TREANT_WARRIOR') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 2 + Math.floor(Math.random() * 2)));
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'WOOD_LOG', 2));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DARK_IRON_ORE', 1));
      if (Math.random() < 0.25) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'HEALTH_POTION', 1));
    } else if (monster.type === 'BOSS_ANCIENT_ENT') {
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'GOLD_COIN', 3));
      targetItems.push(new WorldItem(monster.x + 14, monster.y + 8, 'PLATINUM_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 3));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 12, 'MAGIC_FLOWER', 6));
      targetItems.push(new WorldItem(monster.x + 10, monster.y + 16, 'WOOD_LOG', 6));
      targetItems.push(new WorldItem(monster.x + 36, monster.y + 16, 'HEALTH_POTION', 3));

      this.titleSystem.unlockTitle('SYLVAN_WARDEN', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '🌿 ENT PURBA RIMBA DITUMBANGKAN!!', '#4ade80', 5.0);
      this.floatingText.spawn(monster.x + 16, monster.y - 50, '🏆 GELAR « PENJAGA RIMBA SUCI » DIRAIH!', '#a7f3d0', 5.5);
    }
    // --- DUNGEON STONEWATCH (TAMBANG BESI ABISAL) MONSTER DROPS ---
    else if (monster.type === 'CRYSTAL_SPIDER') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 1 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'DUNGEON_GEM', 1));
      if (Math.random() < 0.35) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DARK_IRON_ORE', 1));
    } else if (monster.type === 'IRONCLAD_SKELETON') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.15) targetItems.push(new WorldItem(monster.x + 6, monster.y + 2, 'GOLD_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'DARK_IRON_ORE', 1));
      if (Math.random() < 0.40) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'ANCIENT_BONE', 1));
    } else if (monster.type === 'ARMORED_GOLEM') {
      targetItems.push(new WorldItem(monster.x + 2, monster.y + 2, 'SILVER_COIN', 2 + Math.floor(Math.random() * 2)));
      if (Math.random() < 0.20) targetItems.push(new WorldItem(monster.x + 6, monster.y + 2, 'GOLD_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'DARK_IRON_ORE', 2));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'DUNGEON_GEM', 1));
      if (Math.random() < 0.30) targetItems.push(new WorldItem(monster.x + 4, monster.y + 12, 'HEALTH_POTION', 1));
    } else if (monster.type === 'BOSS_OBSIDIAN_BEHEMOTH') {
      targetItems.push(new WorldItem(monster.x + 8, monster.y + 4, 'GOLD_COIN', 3));
      targetItems.push(new WorldItem(monster.x + 14, monster.y + 8, 'PLATINUM_COIN', 1));
      targetItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 4));
      targetItems.push(new WorldItem(monster.x + 28, monster.y + 12, 'DARK_IRON_ORE', 6));
      targetItems.push(new WorldItem(monster.x + 10, monster.y + 16, 'HEALTH_POTION', 3));
      targetItems.push(new WorldItem(monster.x + 36, monster.y + 16, 'MANA_POTION', 3));

      this.titleSystem.unlockTitle('MINE_CONQUEROR', this.player, this.floatingText);
      this.floatingText.spawn(monster.x + 16, monster.y - 32, '⚒️ BEHEMOTH OBSIDIAN DIHANCURKAN!!', '#f59e0b', 5.0);
      this.floatingText.spawn(monster.x + 16, monster.y - 50, '🏆 GELAR « PENGHANCUR BATU ABISAL » DIRAIH!', '#fde68a', 5.5);
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
    } else if (this.isCurrentMapInterior()) {
      this.buildingInteriors.update(deltaTime);
    } else {
      this.dungeonMap.update(deltaTime);
    }
    this.skillBarUI.update(deltaTime);
    this.miniMapUI.update(deltaTime);

    // 3. Update Player & Collisions
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const obstacleChecker = (box: { x: number; y: number; width: number; height: number }) => {
      if (this.isCurrentMapInterior()) {
        const iId = this.getInteriorIdFromCurrentMap();
        if (iId && this.buildingInteriors.checkCollision(iId, box)) {
          return true;
        }
      } else if (this.currentMap === 'OVERWORLD') {
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
      } else if (this.currentMap === 'DUNGEON') {
        // Dungeon Floor 1 Chests
        for (const chest of this.dungeonChests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
      } else if (this.currentMap === 'DUNGEON_FLOOR_3') {
        // Dungeon Floor 3 Chests
        for (const chest of this.floor3Chests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
      } else if (this.currentMap === 'DUNGEON_ELDORIA') {
        // Dungeon Eldoria Chests
        for (const chest of this.eldoriaChests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
      } else if (this.currentMap === 'DUNGEON_STONEWATCH') {
        // Dungeon Stonewatch Chests
        for (const chest of this.stonewatchChests) {
          const cb = chest.getCollisionBox();
          if (box.x < cb.x + cb.width && box.x + box.width > cb.x && box.y < cb.y + cb.height && box.y + box.height > cb.y) {
            return true;
          }
        }
      }
      return false;
    };

    // Freeze player if any modal, dialog, or UI overlay is open
    const activeInput = this.isAnyModalOpen()
      ? { axisX: 0, axisY: 0, isAction: false, isSprint: false }
      : this.input.state;

    const activeMap =
      this.currentMap === 'OVERWORLD'
        ? this.tileMap
        : this.isCurrentMapInterior()
        ? this.buildingInteriors
        : this.currentMap === 'DUNGEON'
        ? this.dungeonMap
        : this.currentMap === 'DUNGEON_FLOOR_2'
        ? this.dungeonFloor2
        : this.currentMap === 'DUNGEON_FLOOR_3'
        ? this.dungeonFloor3
        : this.currentMap === 'DUNGEON_ELDORIA'
        ? this.dungeonEldoria
        : this.dungeonStonewatch;
    this.player.update(deltaTime, activeInput, activeMap, obstacleChecker);

    // Update Day/Night & Weather Engine
    this.timeWeatherEngine.update(
      deltaTime,
      this.camera.x,
      this.camera.y,
      this.camera.viewportWidth,
      this.camera.viewportHeight,
      this.currentMap !== 'OVERWORLD' && !this.isCurrentMapInterior()
    );

    // Sync Active Title
    const activeTitle = this.titleSystem.getEquippedTitle();
    this.player.equippedTitle = activeTitle.name;
    this.player.equippedTitleColor = activeTitle.color;

    // Helper aktif pengecekan rintangan/dinding map saat ini (mendukung renang companion & pet)
    const getActiveIsTileSolid = (tx: number, ty: number): boolean => {
      if (this.currentMap === 'OVERWORLD') return this.tileMap.isTileSolid(tx, ty, this.player.isSwimming);
      if (this.currentMap === 'DUNGEON') return this.dungeonMap.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_FLOOR_2') return this.dungeonFloor2.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_FLOOR_3') return this.dungeonFloor3.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_ELDORIA') return this.dungeonEldoria.isTileSolid(tx, ty, this.player.isSwimming);
      if (this.currentMap === 'DUNGEON_STONEWATCH') return this.dungeonStonewatch.isTileSolid(tx, ty);
      return false;
    };

    // Update Active Party Companion (Rodric, Lyra, Flora)
    if (this.companion) {
      const activeMonsters =
        this.currentMap === 'OVERWORLD'
          ? this.overworldMonsters
          : this.currentMap === 'DUNGEON'
          ? this.dungeonMonsters
          : this.currentMap === 'DUNGEON_FLOOR_2'
          ? this.floor2Monsters
          : this.currentMap === 'DUNGEON_FLOOR_3'
          ? this.floor3Monsters
          : this.currentMap === 'DUNGEON_ELDORIA'
          ? this.eldoriaMonsters
          : this.stonewatchMonsters;

      this.companion.update(
        deltaTime,
        this.player,
        activeMonsters,
        this.floatingText,
        (targetM) => {
          if (targetM.isDead) this.handleMonsterDefeated(targetM);
        },
        getActiveIsTileSolid
      );
    }

    // Update Active Pet Auto-Loot Magnet (Puni, Lobo)
    if (this.pet) {
      const activeItems =
        this.currentMap === 'OVERWORLD'
          ? this.worldItems
          : this.currentMap === 'DUNGEON'
          ? this.dungeonWorldItems
          : this.currentMap === 'DUNGEON_FLOOR_2'
          ? this.floor2WorldItems
          : this.currentMap === 'DUNGEON_FLOOR_3'
          ? this.floor3WorldItems
          : this.currentMap === 'DUNGEON_ELDORIA'
          ? this.eldoriaWorldItems
          : this.stonewatchWorldItems;

      this.pet.update(deltaTime, this.player, activeItems, this.floatingText, getActiveIsTileSolid);
      this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
    }

    // Update Blacksmith animations
    this.blacksmithNPC.update(deltaTime);

    // --- OVERWORLD SPECIFIC UPDATES ---
    if (this.currentMap === 'OVERWORLD' && !this.isAnyModalOpen()) {
      // Papan Kehormatan Guild (Leaderboard Notice Board) at (53, 48)
      const boardX = 53 * CONSTANTS.TILE_SIZE + 16;
      const boardY = 48 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(boardX - playerCenterX, boardY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.leaderboardUI.open(this.player);
        }
      }

      // Market Shops Interaction (Distrik Pasar Raya Oakhaven)
      const nearShop = this.villageManager.getNearbyMarketShop(playerCenterX, playerCenterY);
      if (nearShop && (this.input.isActionJustPressed || this.input.state.isAction)) {
        this.input.consumeAction();
        this.marketSystem.open(nearShop.id);
        return;
      }

      // Kandang Satwa Alun-alun (Pet Pen Outpost) at (54, 52)
      const petPenX = 54 * CONSTANTS.TILE_SIZE + 16;
      const petPenY = 52 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(petPenX - playerCenterX, petPenY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          this.marketSystem.open('PET');
          return;
        }
      }

      // Village NPC Interaction (Quest & Ambient Warga Luar Ruangan)
      const nearNPC = this.villageManager.isNearAnyNPC(playerCenterX, playerCenterY);
      if (nearNPC && (this.input.isActionJustPressed || this.input.state.isAction)) {
        this.input.consumeAction();
        this.villageManager.openDialog(nearNPC);
        return;
      }

      // 4.6 Masuk ke Interior Gedung (Guild, Bengkel Besi, Apotek & Inn, Eldoria, Stonewatch)
      const nearDoor = this.buildingInteriors.getNearbyOverworldDoor(playerCenterX, playerCenterY);
      if (nearDoor && (this.input.isActionJustPressed || this.input.state.isAction)) {
        this.enterInterior(nearDoor.id);
        return;
      }

      // 5. Cave Entrance (Masuk Goa / Dungeon Serena)
      if (this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.enterDungeon();
          return;
        }
      }

      // 5.1 Eldoria Sylvan Temple Entrance (Desa Eldoria)
      const eldEntX = 21 * CONSTANTS.TILE_SIZE + 16;
      const eldEntY = 13 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(eldEntX - playerCenterX, eldEntY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          if (this.isEldoriaDungeonUnlocked) {
            this.enterDungeonEldoria();
            return;
          } else {
            AudioEngine.playPlayerHurt();
            this.floatingText.spawn(playerCenterX, playerCenterY - 24, '🔒 Pintu Tersegel! Bicaralah pada Elder Sylas di Eldoria.', '#4ade80', 3.0);
          }
        }
      }

      // 5.2 Stonewatch Cursed Iron Mine Entrance (Desa Stonewatch)
      const stoneEntX = 85 * CONSTANTS.TILE_SIZE + 16;
      const stoneEntY = 58 * CONSTANTS.TILE_SIZE + 16;
      if (Math.hypot(stoneEntX - playerCenterX, stoneEntY - playerCenterY) < 38) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.input.consumeAction();
          if (this.isStonewatchDungeonUnlocked) {
            this.enterDungeonStonewatch();
            return;
          } else {
            AudioEngine.playPlayerHurt();
            this.floatingText.spawn(playerCenterX, playerCenterY - 24, '🔒 Gerbang Terkunci! Pecahkan teka-teki Kapten Borin di Stonewatch.', '#f59e0b', 3.0);
          }
        }
      }
    }

    if (this.currentMap === 'OVERWORLD') {

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
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
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
        if (item.isCollected || item.count <= 0) {
          this.worldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
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
              this.camera.update(this.player.x, this.player.y);
              if (this.player.val > 0) {
                const lostVal = Math.min(this.player.val, Math.max(10, Math.floor(this.player.val * 0.1)));
                this.player.removeVal(lostVal);
                this.floatingText.spawn(this.player.x + 10, this.player.y - 36, `💸 Biaya Evakuasi Balai Kota: -${lostVal} 𝒱`, '#f87171', 4.0);
              }
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur dan sadar kembali di Alun-Alun Kota!', '#ef4444', 3.5);
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
      if (!this.isAnyModalOpen() && this.dungeonMap.isNearLadder(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitDungeon(false);
          return;
        }
      }

      // 4.5 Descent Ladder to Floor 2 in Boss Room
      if (!this.isAnyModalOpen() && this.dungeonMap.isNearFloor2Ladder(playerCenterX, playerCenterY)) {
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
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
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
        if (item.isCollected || item.count <= 0) {
          this.dungeonWorldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
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
    } else if (this.currentMap === 'DUNGEON_FLOOR_2') {
      // --- DUNGEON FLOOR 2 SPECIFIC UPDATES (Ancient Crypt Ruins) ---
      // Ladder up to Floor 1
      if (!this.isAnyModalOpen() && this.dungeonFloor2.isNearLadderUp(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitFloor2();
          return;
        }
      }

      // Portal down to Floor 3 (Infernal Sanctum)
      if (!this.isAnyModalOpen() && this.dungeonFloor2.isNearFloor3Portal(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.enterFloor3();
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
        if (item.isCollected || item.count <= 0) {
          this.floor2WorldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
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
    } else if (this.currentMap === 'DUNGEON_FLOOR_3') {
      // --- DUNGEON FLOOR 3 SPECIFIC UPDATES (Sanctuarium Neraka Abisal) ---
      // Portal up to Floor 2
      if (!this.isAnyModalOpen() && this.dungeonFloor3.isNearPortalUp(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitFloor3();
          return;
        }
      }

      // Update Floor 3 Engine & Floating Embers & Telegraphs
      this.dungeonFloor3.update(deltaTime);

      // Check Boss AOE Telegraph Ground Damage (Meteors & Hellfire Breath)
      for (const tel of this.dungeonFloor3.telegraphs) {
        if (tel.timer <= deltaTime * 1.5) {
          const dist = Math.hypot(playerCenterX - tel.x, playerCenterY - tel.y);
          if (dist < tel.radius) {
            const died = this.player.takeDamage(tel.damage);
            this.camera.shake(6.0, 0.25);
            AudioEngine.playHit(true);
            this.floatingText.spawn(this.player.x + 12, this.player.y - 14, `🔥 METEOR NERAKA -${tel.damage}!`, '#f97316', 2.2);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeon(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Lantai 3 dan dipulangkan ke Kota!', '#ef4444', 3.5);
              return;
            }
          }
        }
      }

      // Floor 3 World Items
      for (let i = this.floor3WorldItems.length - 1; i >= 0; i--) {
        const item = this.floor3WorldItems[i];
        if (item.isCollected || item.count <= 0) {
          this.floor3WorldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            this.floor3WorldItems.splice(i, 1);
          }
        }
      }

      // Floor 3 Chests
      for (const chest of this.floor3Chests) {
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
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            const leveledUp = this.player.addExp(80);
            if (leveledUp) {
              AudioEngine.playLevelUp();
              this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
            }
            this.authUI.saveCurrentGame();
          }
        }
      }

      // Floor 3 Monsters AI & Boss Telegraph Hook
      for (const monster of this.floor3Monsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonFloor3.isTileSolid(tx, ty),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.8, 0.20);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeon(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Lantai 3 dan dipulangkan ke Kota!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          },
          this.companion,
          (tx, ty, r, dur, dmg) => {
            this.dungeonFloor3.spawnTelegraph(tx, ty, r, dur, dmg);
          }
        );
      }

      // Player Melee Attack vs Floor 3 Monsters
      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox) {
        for (const monster of this.floor3Monsters) {
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
            this.camera.shake(isCrit ? 5.2 : 2.8, isCrit ? 0.18 : 0.11);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');
            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // Skills vs Floor 3 Monsters
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.floor3Monsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 34 + this.player.level * 4.2;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 82 + this.player.level * 7.2;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 42 + this.player.level * 4.8;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.6, 0.14);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // Minions vs Floor 3 Monsters
      this.updateMinions(deltaTime, this.floor3Monsters);
    } else if (this.currentMap === 'DUNGEON_ELDORIA') {
      // --- DUNGEON ELDORIA SPECIFIC UPDATES (Kuil Roh Hutan) ---
      // Ladder up to Desa Eldoria
      if (!this.isAnyModalOpen() && this.dungeonEldoria.isNearLadderUp(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitDungeonEldoria();
          return;
        }
      }

      // Update Eldoria Engine & Floating Spores & Telegraphs
      this.dungeonEldoria.update(deltaTime);

      // Check Boss AOE Telegraph Ground Damage (Ancient Roots / Sylvan Burst)
      for (const tel of this.dungeonEldoria.telegraphs) {
        if (tel.timer <= deltaTime * 1.5) {
          const dist = Math.hypot(playerCenterX - tel.x, playerCenterY - tel.y);
          if (dist < tel.radius) {
            const died = this.player.takeDamage(tel.damage);
            this.camera.shake(5.5, 0.22);
            AudioEngine.playHit(true);
            this.floatingText.spawn(this.player.x + 12, this.player.y - 14, `🌿 HANTAMAN AKAR PURBA -${tel.damage}!`, '#4ade80', 2.2);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeonEldoria(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Kuil Roh Hutan dan dipulangkan ke Desa Eldoria!', '#ef4444', 3.5);
              return;
            }
          }
        }
      }

      // Eldoria World Items
      for (let i = this.eldoriaWorldItems.length - 1; i >= 0; i--) {
        const item = this.eldoriaWorldItems[i];
        if (item.isCollected || item.count <= 0) {
          this.eldoriaWorldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            this.eldoriaWorldItems.splice(i, 1);
          }
        }
      }

      // Eldoria Chests
      for (const chest of this.eldoriaChests) {
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
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            const leveledUp = this.player.addExp(75);
            if (leveledUp) {
              AudioEngine.playLevelUp();
              this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
            }
            this.authUI.saveCurrentGame();
          }
        }
      }

      // Eldoria Monsters AI & Boss Telegraph Hook (Sprite air suci dapat berenang/mengambang di SACRED_WATER)
      for (const monster of this.eldoriaMonsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonEldoria.isTileSolid(tx, ty, monster.type === 'SYLVAN_SPRITE'),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.5, 0.18);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeonEldoria(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Kuil Roh Hutan dan dipulangkan ke Desa Eldoria!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          },
          this.companion,
          (tx, ty, r, dur, dmg) => {
            this.dungeonEldoria.spawnTelegraph(tx, ty, r, dur, dmg);
          }
        );
      }

      // Player Melee Attack vs Eldoria Monsters
      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox) {
        for (const monster of this.eldoriaMonsters) {
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
            this.camera.shake(isCrit ? 5.0 : 2.6, isCrit ? 0.18 : 0.11);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');
            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // Skills vs Eldoria Monsters
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.eldoriaMonsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 32 + this.player.level * 4.0;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 78 + this.player.level * 7.0;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 40 + this.player.level * 4.6;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.5, 0.14);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // Minions vs Eldoria Monsters
      this.updateMinions(deltaTime, this.eldoriaMonsters);
    } else if (this.currentMap === 'DUNGEON_STONEWATCH') {
      // --- DUNGEON STONEWATCH SPECIFIC UPDATES (Tambang Besi Abisal) ---
      // Ladder up to Desa Stonewatch
      if (!this.isAnyModalOpen() && this.dungeonStonewatch.isNearLadderUp(playerCenterX, playerCenterY)) {
        if (this.input.isActionJustPressed || this.input.state.isAction) {
          this.exitDungeonStonewatch();
          return;
        }
      }

      // Update Stonewatch Engine & Floating Sparks & Telegraphs
      this.dungeonStonewatch.update(deltaTime);

      // Check Boss AOE Telegraph Ground Damage (Obsidian Slam / Quake)
      for (const tel of this.dungeonStonewatch.telegraphs) {
        if (tel.timer <= deltaTime * 1.5) {
          const dist = Math.hypot(playerCenterX - tel.x, playerCenterY - tel.y);
          if (dist < tel.radius) {
            const died = this.player.takeDamage(tel.damage);
            this.camera.shake(6.5, 0.26);
            AudioEngine.playHit(true);
            this.floatingText.spawn(this.player.x + 12, this.player.y - 14, `⚒️ GEMPA HANTAMAN OBSIDIAN -${tel.damage}!`, '#f59e0b', 2.2);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeonStonewatch(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Tambang Abisal dan dipulangkan ke Desa Stonewatch!', '#ef4444', 3.5);
              return;
            }
          }
        }
      }

      // Stonewatch World Items
      for (let i = this.stonewatchWorldItems.length - 1; i >= 0; i--) {
        const item = this.stonewatchWorldItems[i];
        if (item.isCollected || item.count <= 0) {
          this.stonewatchWorldItems.splice(i, 1);
          continue;
        }
        const pickedUp = item.update(deltaTime, playerCenterX, playerCenterY);
        if (pickedUp) {
          const added = this.player.inventory.addItem(item.itemId, item.count);
          if (added > 0) {
            AudioEngine.playItemPickup(item.itemId === 'GOLD_COIN');
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            this.stonewatchWorldItems.splice(i, 1);
          }
        }
      }

      // Stonewatch Chests
      for (const chest of this.stonewatchChests) {
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
            this.questManager.checkCollectQuests(this.player.inventory, this.floatingText, this.player.x, this.player.y);
            const leveledUp = this.player.addExp(90);
            if (leveledUp) {
              AudioEngine.playLevelUp();
              this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
            }
            this.authUI.saveCurrentGame();
          }
        }
      }

      // Stonewatch Monsters AI & Boss Telegraph Hook
      for (const monster of this.stonewatchMonsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonStonewatch.isTileSolid(tx, ty),
          (atk) => {
            const died = this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            AudioEngine.playPlayerHurt();
            this.camera.shake(4.8, 0.20);
            if (died) {
              AudioEngine.playPlayerDeath();
              this.exitDungeonStonewatch(true);
              this.floatingText.spawn(this.player.x + 10, this.player.y - 20, '☠️ Kamu gugur di Tambang Abisal dan dipulangkan ke Desa Stonewatch!', '#ef4444', 3.5);
            }
          },
          this.player.minions,
          (minion, atk) => {
            this.handleMonsterAttackMinion(monster, minion, atk);
          },
          this.companion,
          (tx, ty, r, dur, dmg) => {
            this.dungeonStonewatch.spawnTelegraph(tx, ty, r, dur, dmg);
          }
        );
      }

      // Player Melee Attack vs Stonewatch Monsters
      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox) {
        for (const monster of this.stonewatchMonsters) {
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
            this.camera.shake(isCrit ? 5.2 : 2.8, isCrit ? 0.18 : 0.11);
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');
            if (res.isDead) {
              this.handleMonsterDefeated(monster);
            }
          }
        }
      }

      // Skills vs Stonewatch Monsters
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal', 'shockwave', 'grasp', 'devour'].includes(effect.type)) {
          for (const monster of this.stonewatchMonsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                let spellDmg = 36 + this.player.level * 4.4;
                if (effect.type === 'abnormal' || effect.type === 'devour') {
                  spellDmg = 84 + this.player.level * 7.4;
                } else if (effect.type === 'grasp' || effect.type === 'shockwave') {
                  spellDmg = 44 + this.player.level * 5.0;
                }
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                AudioEngine.playHit(false);
                this.spawnHitSparks(monster.x + monster.width / 2, monster.y + monster.height / 2, true);
                this.camera.shake(3.8, 0.15);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  this.handleMonsterDefeated(monster);
                }
              }
            }
          }
        }
      }

      // Minions vs Stonewatch Monsters
      this.updateMinions(deltaTime, this.stonewatchMonsters);
    } else if (this.isCurrentMapInterior()) {
      // --- INTERIOR BUILDING SPECIFIC UPDATES ---
      if (this.villageManager.isDialogOpen) {
        if (this.input.isActionJustPressed) {
          this.input.consumeAction();
          this.villageManager.closeDialog();
          AudioEngine.playButtonClick();
          return;
        }
        return;
      }
      if (this.isAnyModalOpen()) {
        return;
      }

      const interiorId = this.getInteriorIdFromCurrentMap();
      if (interiorId) {
        const action = this.buildingInteriors.getNearbyAction(interiorId, playerCenterX, playerCenterY);
        if (action && (this.input.isActionJustPressed || this.input.state.isAction)) {
          this.input.consumeAction();
          switch (action.type) {
            case 'DOOR_EXIT':
              this.exitInterior();
              return;

            case 'ELAINE':
              this.guildNPC.openAppraisal();
              break;

            case 'QUEST_BOARD':
              this.guildNPC.openAppraisal();
              break;

            case 'COMPANION_HIRE':
              this.openCompanionHireModal();
              break;

            case 'GALAHAD':
              this.villageManager.openDialogById('galahad');
              break;

            case 'KAELEN':
              this.villageManager.openDialogById('kaelen');
              break;

            case 'IGNIS':
              this.villageManager.openDialogById('ignis');
              break;

            case 'MORGRIM':
              this.villageManager.openDialogById('morgrim');
              break;

            case 'BROKK':
              this.blacksmithNPC.openWorkshop(this.player.role);
              break;

            case 'LILY':
              this.villageManager.openDialogById('lily');
              break;

            case 'INN_BED': {
              const healedHp = Math.round(this.player.maxHp - this.player.hp);
              const healedMp = Math.round(this.player.maxMp - this.player.mp);
              this.player.hp = this.player.maxHp;
              this.player.mp = this.player.maxMp;
              AudioEngine.playLevelUp();
              this.floatingText.spawn(playerCenterX, playerCenterY - 24, `💤 Istirahat Nyenyak! HP +${healedHp}, MP +${healedMp}`, '#38bdf8', 2.8);
              if (this.player.bankSavings > 0) {
                const earned = this.player.applyBankInterest(0.01);
                if (earned > 0) {
                  this.floatingText.spawn(playerCenterX, playerCenterY - 44, `🏦 Bunga Tabungan Pagi Hari: +${earned} 𝒱!`, '#facc15', 3.5);
                }
              }
              this.authUI.saveCurrentGame();
              break;
            }

            case 'BANK_TELLER':
              this.bankSystem.open();
              break;

            case 'CHEF_GASTON':
            case 'KITCHEN_CAULDRON':
              this.cookingSystem.open(this.player, this.floatingText);
              break;

            case 'SYLAS':
              this.villageManager.openDialogById('elder_sylas');
              break;

            case 'ARIA':
              this.villageManager.openDialogById('aria_herbalist');
              break;

            case 'BORIN':
              this.villageManager.openDialogById('kapten_borin');
              break;

            case 'GRIMM':
              this.villageManager.openDialogById('grimm_miner');
              break;
          }
        }
      }
    }

    // 9.9 Bank Daily Savings Interest Check (+1% every 180s in-game day)
    this.bankInterestTimer += deltaTime;
    if (this.bankInterestTimer >= 180) {
      this.bankInterestTimer = 0;
      if (this.player.bankSavings > 0) {
        const earned = this.player.applyBankInterest(0.01);
        if (earned > 0) {
          AudioEngine.playItemPickup(true);
          this.floatingText.spawn(
            this.player.x + 10,
            this.player.y - 28,
            `🏦 Bunga Tabungan Bank: +${earned} 𝒱!`,
            '#facc15',
            3.2
          );
        }
      }
    }

    // 9.95 Update Market System Animations
    this.marketSystem.update(deltaTime);

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
      const villageOrRegion = this.tileMap.getVillageName(tileX, tileY);
      const interiorId = this.isCurrentMapInterior() ? this.getInteriorIdFromCurrentMap() : null;
      const interiorDef = interiorId ? this.buildingInteriors.doors[interiorId] : null;
      const locText =
        interiorDef
          ? `<span style="color: ${interiorDef.accentColor}; font-weight: 700;">${interiorDef.icon} ${interiorDef.name}</span>`
          : this.currentMap === 'DUNGEON'
          ? '<span style="color: #c084fc; font-weight: 700;">🏰 Goa Makam Kuno (Lt.1)</span>'
          : this.currentMap === 'DUNGEON_FLOOR_2'
          ? '<span style="color: #60a5fa; font-weight: 700;">⚡ Labirin Titan Abisal (Lt.2)</span>'
          : this.currentMap === 'DUNGEON_FLOOR_3'
          ? '<span style="color: #f97316; font-weight: 700;">🔥 Neraka Abisal Ignis (Lt.3)</span>'
          : this.currentMap === 'DUNGEON_ELDORIA'
          ? '<span style="color: #4ade80; font-weight: 700;">🌿 Kuil Roh Hutan Eldoria</span>'
          : this.currentMap === 'DUNGEON_STONEWATCH'
          ? '<span style="color: #f59e0b; font-weight: 700;">⚒️ Tambang Besi Abisal Stonewatch</span>'
          : `<span style="color: #4ade80; font-weight: 700;">🌍 ${villageOrRegion}</span>`;

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
      this.villageManager.renderEnvironment(ctx, playerCenterX, playerCenterY, this.isAnyModalOpen());

      // Render Interactive Notice Board & Pet Pen
      this.renderNoticeBoard(ctx, 53 * CONSTANTS.TILE_SIZE, 48 * CONSTANTS.TILE_SIZE, playerCenterX, playerCenterY);
      this.renderPetPen(ctx, 54 * CONSTANTS.TILE_SIZE, 52 * CONSTANTS.TILE_SIZE, playerCenterX, playerCenterY);

      // Render Pintu Masuk Interior Gedung (Guild, Bengkel, Apotek, Pondok Eldoria, Barak Stonewatch)
      this.buildingInteriors.renderOverworldDoorMarkers(ctx, playerCenterX, playerCenterY, this.isAnyModalOpen());

      // 2. Render Cave / Dungeon Entrance Serena
      this.caveEntrance.render(ctx, this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());

      // 2.1 Render Eldoria Sylvan Temple Entrance (Desa Eldoria)
      this.renderEldoriaEntrance(ctx, playerCenterX, playerCenterY);

      // 2.2 Render Stonewatch Cursed Iron Mine Entrance (Desa Stonewatch)
      this.renderStonewatchEntrance(ctx, playerCenterX, playerCenterY);

      // 4. Render Overworld Chests
      for (const chest of this.chests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());
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

      // 6.1 Render Village Foreground Occlusion Layer (Pillars, Posts, Roofs, Archways & Overhead Structures)
      this.villageManager.renderForegroundEnvironment(ctx, this.player.x, this.player.y, this.player.width, this.player.height);
      this.renderForegroundProps(ctx, this.player.x, this.player.y, this.player.width, this.player.height);

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
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());
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
    } else if (this.currentMap === 'DUNGEON_FLOOR_2') {
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

      // 8.5 Render Floating Texts
      this.floatingText.render(ctx);
    } else if (this.currentMap === 'DUNGEON_FLOOR_3') {
      // --- DUNGEON FLOOR 3 WORLD RENDERING (Sanctuarium Neraka Abisal) ---
      // 1. Render Floor 3 Map Tiles & Boss Danger Telegraphs & Floating Embers
      this.dungeonFloor3.render(ctx, this.camera);

      // 2. Render Floor 3 Items
      for (const item of this.floor3WorldItems) {
        item.render(ctx);
      }

      // 2.5 Render Floor 3 Chests
      for (const chest of this.floor3Chests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());
      }

      // 3. Render Floor 3 Monsters (Hellhound, Abyssal Reaper, Infernal Knight, Ignis Dragon)
      for (const monster of this.floor3Monsters) {
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

      // 6. Render Floor 3 Atmospheric Darkness & Hellfire Braziers Light
      this.dungeonFloor3.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);

      // 7. Render Abyssal Mana Motes
      this.atmosphereEngine.render(ctx);

      // 8. Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 9. Render Floating Texts
      this.floatingText.render(ctx);
    } else if (this.currentMap === 'DUNGEON_ELDORIA') {
      // --- DUNGEON ELDORIA WORLD RENDERING (Kuil Roh Hutan) ---
      // 1. Render Eldoria Map Tiles & Danger Telegraphs & Floating Spores
      this.dungeonEldoria.render(ctx, this.camera);

      // 2. Render Eldoria Items
      for (const item of this.eldoriaWorldItems) {
        item.render(ctx);
      }

      // 2.5 Render Eldoria Chests
      for (const chest of this.eldoriaChests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());
      }

      // 3. Render Eldoria Monsters
      for (const monster of this.eldoriaMonsters) {
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

      // 6. Render Sylvan Atmospheric Lighting (Emerald canopy & Spring luminescence)
      this.dungeonEldoria.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);

      // 7. Render Sylvan Mana Motes
      this.atmosphereEngine.render(ctx);

      // 8. Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 9. Render Floating Texts
      this.floatingText.render(ctx);
    } else if (this.currentMap === 'DUNGEON_STONEWATCH') {
      // --- DUNGEON STONEWATCH WORLD RENDERING (Tambang Besi Abisal) ---
      // 1. Render Stonewatch Map Tiles & Danger Telegraphs & Floating Sparks
      this.dungeonStonewatch.render(ctx, this.camera);

      // 2. Render Stonewatch Items
      for (const item of this.stonewatchWorldItems) {
        item.render(ctx);
      }

      // 2.5 Render Stonewatch Chests
      for (const chest of this.stonewatchChests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY), this.isAnyModalOpen());
      }

      // 3. Render Stonewatch Monsters
      for (const monster of this.stonewatchMonsters) {
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

      // 6. Render Mining Cavern Atmospheric Lighting (Deep shadow & Smelting braziers)
      this.dungeonStonewatch.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);

      // 7. Render Abyssal Mana Motes
      this.atmosphereEngine.render(ctx);

      // 8. Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // 9. Render Floating Texts
      this.floatingText.render(ctx);
    } else if (this.isCurrentMapInterior()) {
      // --- INTERIOR ROOM WORLD RENDERING ---
      const interiorId = this.getInteriorIdFromCurrentMap();
      if (interiorId) {
        this.buildingInteriors.renderInterior(ctx, interiorId, this.camera, playerCenterX, playerCenterY, this.isAnyModalOpen());
      }

      // Render Companion if active
      if (this.companion) {
        this.companion.render(ctx);
      }

      // Render Pet if active
      if (this.pet) {
        this.pet.render(ctx);
      }

      // Render Player
      this.player.render(ctx);

      // Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // Render Ambient Interior Particles & Dust
      this.atmosphereEngine.render(ctx);

      // Render Combat Hit Sparks
      this.renderHitSparks(ctx);

      // Render Floating Texts
      this.floatingText.render(ctx);
    }

    ctx.restore();

    // 4. High-DPI UI & Text rendering: Enable smooth anti-aliased font and vector card rendering
    ctx.imageSmoothingEnabled = true;

    // --- SCREEN SPACE 1:1 RENDERING ---
    if (this.onboardingUI.state === 'PLAYING') {
      // 8. Mobile Touch D-Pad & Action Buttons
      if (!this.isAnyModalOpen()) {
        this.input.renderTouchUI(ctx, screenWidth, screenHeight);
        // Mobile Skill Bar
        this.skillBarUI.renderTouchSkillBar(ctx, screenWidth, screenHeight);
        // Quick Potion UI (HP & MP)
        this.quickPotionUI.render(ctx, screenWidth, screenHeight);
      }

      // 9. Auth Status Pill / Logout
      this.authUI.render(ctx, screenWidth);

      // --- IN-GAME HUD & PROMPT LAYERS (Ditempatkan di bawah layer modal dialog) ---
      // 10. Render Mini-Map UI
      const activeMonsters =
        this.isCurrentMapInterior()
          ? []
          : this.currentMap === 'OVERWORLD'
          ? this.overworldMonsters
          : this.currentMap === 'DUNGEON'
          ? this.dungeonMonsters
          : this.currentMap === 'DUNGEON_FLOOR_2'
          ? this.floor2Monsters
          : this.currentMap === 'DUNGEON_FLOOR_3'
          ? this.floor3Monsters
          : this.currentMap === 'DUNGEON_ELDORIA'
          ? this.eldoriaMonsters
          : this.stonewatchMonsters;

      const activeChests =
        this.isCurrentMapInterior()
          ? []
          : this.currentMap === 'OVERWORLD'
          ? this.chests
          : this.currentMap === 'DUNGEON'
          ? this.dungeonChests
          : this.currentMap === 'DUNGEON_FLOOR_2'
          ? []
          : this.currentMap === 'DUNGEON_FLOOR_3'
          ? this.floor3Chests
          : this.currentMap === 'DUNGEON_ELDORIA'
          ? this.eldoriaChests
          : this.stonewatchChests;

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
        this.blacksmithNPC.y,
        this.dungeonFloor2,
        this.dungeonFloor3,
        this.dungeonEldoria,
        this.dungeonStonewatch
      );

      // 10.1 Render Active Quest HUD Tracker (Top-Left)
      this.renderQuestTrackerHUD(ctx);

      // 10.2 Top Center: Day/Night Cycle & Weather Banner
      ctx.save();
      const timeStr = this.timeWeatherEngine.getFormattedTime();
      ctx.font = 'bold 9.5px sans-serif';
      const timeWidth = ctx.measureText(timeStr).width + 16;
      const timeX = (screenWidth - timeWidth) / 2;
      const timeY = 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
      ctx.fillRect(timeX, timeY, timeWidth, 22);
      ctx.strokeStyle = this.timeWeatherEngine.isNight() ? '#a855f7' : '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(timeX, timeY, timeWidth, 22);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, timeX + timeWidth / 2, timeY + 11);
      ctx.restore();

      // 10.3 Top-Center: Active Food Buffs HUD Badges
      let activeBuffsCount = 0;
      if (this.player.foodBuffAtkTimer > 0) activeBuffsCount++;
      if (this.player.foodBuffMpTimer > 0) activeBuffsCount++;
      if (this.player.foodBuffExpSpeedTimer > 0) activeBuffsCount++;

      if (activeBuffsCount > 0) {
        const buffBadgeW = 84;
        const buffSpacing = 4;
        const totalBuffsW = activeBuffsCount * buffBadgeW + (activeBuffsCount - 1) * buffSpacing;
        let buffX = (screenWidth - totalBuffsW) / 2;
        const buffY = 36;

        if (this.player.foodBuffAtkTimer > 0) {
          const m = Math.floor(this.player.foodBuffAtkTimer / 60);
          const s = Math.floor(this.player.foodBuffAtkTimer % 60);
          this.renderBuffBadge(ctx, buffX, buffY, '🥩 +20% ATK', `${m}:${s.toString().padStart(2, '0')}`, '#fb923c');
          buffX += buffBadgeW + buffSpacing;
        }
        if (this.player.foodBuffMpTimer > 0) {
          const m = Math.floor(this.player.foodBuffMpTimer / 60);
          const s = Math.floor(this.player.foodBuffMpTimer % 60);
          this.renderBuffBadge(ctx, buffX, buffY, '🍮 Regen MP', `${m}:${s.toString().padStart(2, '0')}`, '#38bdf8');
          buffX += buffBadgeW + buffSpacing;
        }
        if (this.player.foodBuffExpSpeedTimer > 0) {
          const m = Math.floor(this.player.foodBuffExpSpeedTimer / 60);
          const s = Math.floor(this.player.foodBuffExpSpeedTimer % 60);
          this.renderBuffBadge(ctx, buffX, buffY, '🍲 +Speed/EXP', `${m}:${s.toString().padStart(2, '0')}`, '#4ade80');
          buffX += buffBadgeW + buffSpacing;
        }
      }

      // 10.4 Top HUD: Gelar & Title Button (👑)
      const titleBtnX = screenWidth - 128;
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

      // 10.5 Top HUD: Fullscreen Icon (⛶)
      const fsX = screenWidth - 170;
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

      // 10.6 Top HUD: Install Web App Button (📲) if installable
      if (PwaService.isInstallable) {
        const instX = screenWidth - 254;
        const instY = 10;
        const instSize = 34;

        ctx.fillStyle = 'rgba(2, 132, 199, 0.85)';
        ctx.beginPath();
        ctx.arc(instX + instSize / 2, instY + instSize / 2, instSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📲', instX + instSize / 2, instY + instSize / 2);
      }
      ctx.restore();

      // 10.7 Action Prompt Bubbles (Dynamic Width, Centered & Overflow-Proof)
      this.bottomActionPromptRect = null;

      if (!this.isAnyModalOpen()) {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;

        if (this.currentMap === 'DUNGEON' && this.dungeonMap.isNearLadder(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Naik Tangga (Keluar Goa) ▲', '#facc15', '#fef08a');
        } else if (this.currentMap === 'DUNGEON' && this.dungeonMap.isNearFloor2Ladder(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Masuk Makam Kuno Lantai 2 ▼', '#c084fc', '#e879f9');
        } else if (this.currentMap === 'DUNGEON_FLOOR_2' && this.dungeonFloor2.isNearLadderUp(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Naik Tangga (Lantai 1) ▲', '#38bdf8', '#93c5fd');
        } else if (this.currentMap === 'DUNGEON_FLOOR_2' && this.dungeonFloor2.isNearFloor3Portal(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Masuk Neraka Abisal Lantai 3 ▼', '#f97316', '#fdba74');
        } else if (this.currentMap === 'DUNGEON_FLOOR_3' && this.dungeonFloor3.isNearPortalUp(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Masuk Portal Naik (Lantai 2) ▲', '#38bdf8', '#93c5fd');
        } else if (this.currentMap === 'DUNGEON_ELDORIA' && this.dungeonEldoria.isNearLadderUp(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Naik Tangga (Desa Eldoria) ▲', '#4ade80', '#86efac');
        } else if (this.currentMap === 'DUNGEON_STONEWATCH' && this.dungeonStonewatch.isNearLadderUp(playerCenterX, playerCenterY)) {
          this.renderBottomActionPrompt(ctx, '[A] Naik Tangga (Desa Stonewatch) ▲', '#f59e0b', '#fde68a');
        } else if (this.currentMap === 'OVERWORLD') {
          const eldEntDist = Math.hypot(21 * CONSTANTS.TILE_SIZE + 16 - playerCenterX, 13 * CONSTANTS.TILE_SIZE + 16 - playerCenterY);
          const stoneEntDist = Math.hypot(85 * CONSTANTS.TILE_SIZE + 16 - playerCenterX, 58 * CONSTANTS.TILE_SIZE + 16 - playerCenterY);
          const nearDoor = this.buildingInteriors.getNearbyOverworldDoor(playerCenterX, playerCenterY);
          const nearMarketShop = this.villageManager.getNearbyMarketShop(playerCenterX, playerCenterY);
          const petPenDist = Math.hypot(54 * CONSTANTS.TILE_SIZE + 16 - playerCenterX, 52 * CONSTANTS.TILE_SIZE + 16 - playerCenterY);
          const nearNPC = this.villageManager.isNearAnyNPC(playerCenterX, playerCenterY);

          if (nearDoor) {
            this.renderBottomActionPrompt(ctx, `[A] Masuk ${nearDoor.name} ${nearDoor.icon}`, nearDoor.accentColor, nearDoor.accentColor);
          } else if (nearMarketShop) {
            this.renderBottomActionPrompt(ctx, nearMarketShop.prompt, nearMarketShop.accentColor, nearMarketShop.accentColor);
          } else if (petPenDist < 38) {
            this.renderBottomActionPrompt(ctx, '[A] Kunjungi Suaka & Toko Pet Mia 🐾', '#059669', '#34d399');
          } else if (this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY)) {
            this.renderBottomActionPrompt(ctx, '[A] Masuk Dungeon Goa Serena ⛰️', '#38bdf8', '#93c5fd');
          } else if (nearNPC) {
            this.renderBottomActionPrompt(ctx, `[A] Bicara dengan ${nearNPC.name} 💬`, '#facc15', '#fef08a');
          } else if (eldEntDist < 38) {
            this.renderBottomActionPrompt(
              ctx,
              this.isEldoriaDungeonUnlocked ? '[A] Masuk Kuil Roh Hutan 🌿' : 'Pecahkan Teka-Teki Elder Sylas 🔒',
              this.isEldoriaDungeonUnlocked ? '#4ade80' : '#ef4444',
              this.isEldoriaDungeonUnlocked ? '#86efac' : '#fca5a5'
            );
          } else if (stoneEntDist < 38) {
            this.renderBottomActionPrompt(
              ctx,
              this.isStonewatchDungeonUnlocked ? '[A] Masuk Tambang Abisal ⚒️' : 'Pecahkan Teka-Teki Kapten Borin 🔒',
              this.isStonewatchDungeonUnlocked ? '#f59e0b' : '#ef4444',
              this.isStonewatchDungeonUnlocked ? '#fde68a' : '#fca5a5'
            );
          }
        } else if (this.isCurrentMapInterior()) {
          const interiorId = this.getInteriorIdFromCurrentMap();
          if (interiorId) {
            const action = this.buildingInteriors.getNearbyAction(interiorId, playerCenterX, playerCenterY);
            if (action) {
              this.renderBottomActionPrompt(ctx, action.prompt, action.color || '#facc15', action.color || '#fef08a');
            }
          }
        }

        // Generic chest prompt jika pemain mendekati peti yang belum dibuka
        if (!this.bottomActionPromptRect) {
          const nearChest = activeChests.find((c) => !c.isOpen && c.isNearPlayer(playerCenterX, playerCenterY));
          if (nearChest) {
            this.renderBottomActionPrompt(ctx, '[A] Buka Peti Harta Karun 🎁', '#facc15', '#fef08a');
          }
        }
      }

      // --- MODAL DIALOG OVERLAYS (Di-render di atas seluruh elemen dunia & HUD) ---
      // 11. Inventory UI Overlay
      this.inventoryUI.render(ctx, screenWidth, screenHeight);

      // 12. Guild Appraisal Ceremony Modal
      this.guildNPC.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 13. Weaponsmith Workshop Modal
      this.blacksmithNPC.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 14. Village NPC Dialog Modal (Quest & Ambient)
      this.villageManager.renderDialogModal(ctx, screenWidth, screenHeight);

      // 15. Royal Bank Modal (Exchange & Savings)
      this.bankSystem.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 16. Market System Modal (Distrik Pasar Raya Oakhaven)
      this.marketSystem.renderModal(ctx, screenWidth, screenHeight, this.player, this.pet);

      // 17. Control Settings Modal (Gear ⚙️ & customization)
      this.controlSettingsModal.render(ctx, screenWidth, screenHeight);

      // 18. Floating Auto-Update Banner (Muncul saat ada pembaruan file baru)
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

      // 16. Anime Location Title Card
      this.renderAnimeLocationTitleCard(ctx, screenWidth, screenHeight);

      // 16.5 Anime Skill Invocation Cut-In Banner
      this.renderSkillCutInBanner(ctx, screenWidth, screenHeight);

      // 17. Topmost Modal: Premium In-Game Notification / Confirm Dialog
      NotificationModal.render(ctx, screenWidth, screenHeight);
    }
  }

  private renderBottomActionPrompt(
    ctx: CanvasRenderingContext2D,
    text: string,
    borderColor: string,
    textColor: string
  ): void {
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    const textW = ctx.measureText(text).width;
    const pW = Math.min(this.screenWidth - 24, Math.max(180, textW + 28));
    const pH = 26;
    const pX = (this.screenWidth - pW) / 2;
    const pY = this.screenHeight - 90;

    this.bottomActionPromptRect = { x: pX, y: pY, w: pW, h: pH };

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(pX, pY, pW, pH);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pX, pY, pW, pH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    const safeText = CanvasText.truncate(ctx, text, pW - 14);
    ctx.fillText(safeText, pX + pW / 2, pY + pH / 2);
    ctx.restore();
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

    if (isNear && !this.isAnyModalOpen()) {
      ctx.font = 'bold 8px sans-serif';
      const prompt = '[A] Papan Kehormatan (Top 10)';
      const pw = ctx.measureText(prompt).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(bx + 16 - pw / 2, by - 18, pw, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde047';
      ctx.fillText(prompt, bx + 16, by - 11);
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

    if (isNear && !this.isAnyModalOpen()) {
      ctx.font = 'bold 8px sans-serif';
      const prompt = '[A] Adopsi Pet Auto-Loot';
      const pw = ctx.measureText(prompt).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(px + 16 - pw / 2, py - 18, pw, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText(prompt, px + 16, py - 11);
    }
  }

  private renderForegroundProps(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number
  ): void {
    const ts = CONSTANTS.TILE_SIZE;
    const playerFeetY = playerY + playerH;
    const pcx = playerX + playerW / 2;
    const pcy = playerY + playerH / 2;

    // 1. Notice Board Kehormatan (53*ts, 48*ts)
    const nbX = 53 * ts;
    const nbY = 48 * ts;
    if (
      playerX + playerW >= nbX - 8 &&
      playerX <= nbX + 36 &&
      playerFeetY >= nbY - 10 &&
      playerFeetY <= nbY + 34
    ) {
      this.renderNoticeBoard(ctx, nbX, nbY, pcx, pcy);
    }

    // 2. Pet Pen Pagar (54*ts, 52*ts)
    const ppX = 54 * ts;
    const ppY = 52 * ts;
    if (
      playerX + playerW >= ppX - 8 &&
      playerX <= ppX + 40 &&
      playerFeetY >= ppY - 8 &&
      playerFeetY <= ppY + 28
    ) {
      this.renderPetPen(ctx, ppX, ppY, pcx, pcy);
    }

    // 3. Kuil Hutan Eldoria (21*ts, 13*ts)
    const elX = 21 * ts;
    const elY = 13 * ts;
    if (
      playerX + playerW >= elX - 8 &&
      playerX <= elX + 44 &&
      playerFeetY >= elY - 10 &&
      playerFeetY <= elY + 36
    ) {
      this.renderEldoriaEntrance(ctx, pcx, pcy);
    }

    // 4. Tambang Stonewatch (85*ts, 58*ts)
    const swX = 85 * ts;
    const swY = 58 * ts;
    if (
      playerX + playerW >= swX - 8 &&
      playerX <= swX + 44 &&
      playerFeetY >= swY - 10 &&
      playerFeetY <= swY + 36
    ) {
      this.renderStonewatchEntrance(ctx, pcx, pcy);
    }
  }

  private renderEldoriaEntrance(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    const ex = 21 * ts;
    const ey = 13 * ts;
    const isNear = Math.hypot(ex + 16 - playerCenterX, ey + 16 - playerCenterY) < 38;

    ctx.save();
    // Ancient stone archway
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ex - 4, ey - 6, 40, 38);

    // Cavern Opening
    ctx.fillStyle = '#051b11';
    ctx.beginPath();
    ctx.ellipse(ex + 16, ey + 18, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mossy stone pillars
    ctx.fillStyle = '#334155';
    ctx.fillRect(ex - 2, ey - 4, 6, 36);
    ctx.fillRect(ex + 28, ey - 4, 6, 36);

    // Keystone & ivy roots
    ctx.fillStyle = '#15803d';
    ctx.fillRect(ex + 12, ey - 8, 8, 8);
    ctx.fillRect(ex - 4, ey + 4, 4, 12);
    ctx.fillRect(ex + 32, ey + 8, 4, 14);

    if (!this.isEldoriaDungeonUnlocked) {
      // Locked: Thick thorny vine curtain with glowing magical lock
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ex + 4, ey + 2);
      ctx.lineTo(ex + 28, ey + 30);
      ctx.moveTo(ex + 28, ey + 2);
      ctx.lineTo(ex + 4, ey + 30);
      ctx.moveTo(ex + 2, ey + 16);
      ctx.lineTo(ex + 30, ey + 16);
      ctx.stroke();

      // Pulsing Emerald Runic Lock Sigil
      const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      ctx.fillStyle = `rgba(74, 222, 128, ${0.4 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(ex + 16, ey + 16, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', ex + 16, ey + 16);

      // Warning plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 2, ey + 33, 28, 9);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 2, ey + 33, 28, 9);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.fillText('Kuil Roh Hutan', ex + 16, ey + 38);
    } else {
      // Unlocked: Swirling emerald light aura pouring from the entrance
      const glow = (Math.sin(Date.now() * 0.004) + 1) * 0.5;
      const grad = ctx.createRadialGradient(ex + 16, ey + 18, 2, ex + 16, ey + 18, 20);
      grad.addColorStop(0, `rgba(74, 222, 128, ${0.7 + glow * 0.3})`);
      grad.addColorStop(0.6, `rgba(34, 197, 94, ${0.35 + glow * 0.2})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex + 16, ey + 18, 20, 0, Math.PI * 2);
      ctx.fill();

      // Light particles
      for (let i = 0; i < 3; i++) {
        const pPhase = (Date.now() * 0.002 + i * 2.1) % (Math.PI * 2);
        const px = ex + 16 + Math.cos(pPhase) * 10;
        const py = ey + 18 + Math.sin(pPhase) * 6;
        ctx.fillStyle = '#bbf7d0';
        ctx.fillRect(px, py, 2, 2);
      }

      // Open entrance badge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 2, ey + 33, 28, 9);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 2, ey + 33, 28, 9);
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.fillText('Kuil Terbuka 🌿', ex + 16, ey + 38);
    }

    if (isNear && !this.isAnyModalOpen()) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.isEldoriaDungeonUnlocked ? '#86efac' : '#fca5a5';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const text = this.isEldoriaDungeonUnlocked ? '[A] Masuk Kuil Roh Hutan' : '[A] Segel Roh Kuno (Terkunci)';
      ctx.strokeText(text, ex + 16, ey - 10);
      ctx.fillText(text, ex + 16, ey - 10);
    }
    ctx.restore();
  }

  private renderStonewatchEntrance(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    const ex = 85 * ts;
    const ey = 58 * ts;
    const isNear = Math.hypot(ex + 16 - playerCenterX, ey + 16 - playerCenterY) < 38;

    ctx.save();
    // Mine entrance framing: Heavy timber lintels
    ctx.fillStyle = '#451a03';
    ctx.fillRect(ex - 4, ey - 6, 40, 38);

    // Deep mine tunnel opening
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(ex + 16, ey + 18, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Timber posts & iron bolts
    ctx.fillStyle = '#78350f';
    ctx.fillRect(ex - 3, ey - 4, 6, 36);
    ctx.fillRect(ex + 29, ey - 4, 6, 36);
    ctx.fillRect(ex - 5, ey - 6, 42, 6);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ex - 1, ey + 2, 2, 2);
    ctx.fillRect(ex + 31, ey + 2, 2, 2);

    // Wooden railway ties & iron rails
    ctx.fillStyle = '#b45309';
    ctx.fillRect(ex + 6, ey + 28, 20, 2);
    ctx.fillRect(ex + 6, ey + 33, 20, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ex + 10, ey + 26, 2, 12);
    ctx.fillRect(ex + 20, ey + 26, 2, 12);

    if (!this.isStonewatchDungeonUnlocked) {
      // Locked: Heavy iron portcullis gate with padlock
      ctx.fillStyle = '#334155';
      for (let gx = ex + 4; gx <= ex + 28; gx += 5) {
        ctx.fillRect(gx, ey + 2, 2, 26);
      }
      ctx.fillRect(ex + 3, ey + 10, 26, 2.5);
      ctx.fillRect(ex + 3, ey + 20, 26, 2.5);

      // Massive iron padlock
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ex + 13, ey + 14, 7, 7);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ex + 16.5, ey + 14, 3, Math.PI, 0);
      ctx.stroke();

      // Plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 1, ey + 34, 30, 9);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 1, ey + 34, 30, 9);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tambang Abisal', ex + 16, ey + 39);
    } else {
      // Unlocked: Gate hoisted up! Warm amber forge lanterns glowing
      const glow = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      const grad = ctx.createRadialGradient(ex + 16, ey + 18, 2, ex + 16, ey + 18, 20);
      grad.addColorStop(0, `rgba(245, 158, 11, ${0.75 + glow * 0.25})`);
      grad.addColorStop(0.6, `rgba(217, 119, 6, ${0.35 + glow * 0.15})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex + 16, ey + 18, 20, 0, Math.PI * 2);
      ctx.fill();

      // Hanging lanterns on timber posts
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ex - 2, ey + 6, 4, 5);
      ctx.fillRect(ex + 30, ey + 6, 4, 5);

      // Open badge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 1, ey + 34, 30, 9);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 1, ey + 34, 30, 9);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tambang Terbuka ⚒️', ex + 16, ey + 39);
    }

    if (isNear && !this.isAnyModalOpen()) {
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.isStonewatchDungeonUnlocked ? '#fde68a' : '#fca5a5';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const text = this.isStonewatchDungeonUnlocked ? '[A] Masuk Tambang Abisal' : '[A] Gerbang Besi (Terkunci)';
      ctx.strokeText(text, ex + 16, ey - 10);
      ctx.fillText(text, ex + 16, ey - 10);
    }
    ctx.restore();
  }

  private renderQuestTrackerHUD(ctx: CanvasRenderingContext2D): void {
    const activeQuests = this.questManager.getActiveQuests();
    if (activeQuests.length === 0) return;

    ctx.save();
    const startX = 10;
    const startY = 138; // Tepat dan rapi di bawah kotak info HUD status
    const cardW = 175;

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
      const safeQTitle = CanvasText.truncate(ctx, `📜 ${q.title}`, cardW - 12);
      ctx.fillText(safeQTitle, startX + 6, cy + 3);

      ctx.fillStyle = q.status === 'COMPLETED' ? '#facc15' : '#cbd5e1';
      ctx.font = 'bold 8px sans-serif';
      const statusText = q.status === 'COMPLETED' ? '✓ SIAP KLAIM' : `${q.targetName}: ${q.currentCount}/${q.requiredCount}`;
      const safeQStatus = CanvasText.truncate(ctx, statusText, cardW - 52);
      ctx.fillText(safeQStatus, startX + 6, cy + 14);

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

    // Role tag & Skill Name typography (Auto-fit agar tidak keluar dari layar/banner)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxCutInW = screenWidth - 36;
    const roleTag = `【 ${banner.role} · SKILL ACTIVATION 】`;
    let roleFSize = 9.5;
    ctx.font = `bold ${roleFSize}px sans-serif`;
    while (ctx.measureText(roleTag).width > maxCutInW && roleFSize > 6.5) {
      roleFSize -= 0.5;
      ctx.font = `bold ${roleFSize.toFixed(1)}px sans-serif`;
    }
    const safeRoleTag = CanvasText.truncate(ctx, roleTag, maxCutInW);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(safeRoleTag, screenWidth / 2, centerY - 9);

    const skillTitle = banner.name.toUpperCase();
    let skillFSize = 15;
    ctx.font = `900 ${skillFSize}px sans-serif`;
    while (ctx.measureText(skillTitle).width > maxCutInW && skillFSize > 9) {
      skillFSize -= 0.5;
      ctx.font = `900 ${skillFSize.toFixed(1)}px sans-serif`;
    }
    const safeSkillTitle = CanvasText.truncate(ctx, skillTitle, maxCutInW);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = banner.color;
    ctx.shadowBlur = 10;
    ctx.fillText(safeSkillTitle, screenWidth / 2, centerY + 9);

    ctx.restore();
  }

  private renderAnimeLocationTitleCard(ctx: CanvasRenderingContext2D, screenWidth: number, _screenHeight: number): void {
    if (this.mapTransitionTimer <= 0) return;

    ctx.save();
    // Smooth fade in / out
    const alpha = Math.min(1, Math.min(this.mapTransitionTimer / 0.5, (3.2 - this.mapTransitionTimer) / 0.4));
    ctx.globalAlpha = Math.max(0, alpha);

    const cardW = Math.min(340, screenWidth - 32);
    const cardH = 50;
    const cardX = (screenWidth - cardW) / 2;
    const cardY = 50;

    let mainTheme = '#facc15';
    let subTheme = '#fef08a';
    if (this.currentMap === 'DUNGEON') {
      mainTheme = '#c084fc';
      subTheme = '#f0abfc';
    } else if (this.currentMap === 'DUNGEON_FLOOR_2') {
      mainTheme = '#60a5fa';
      subTheme = '#93c5fd';
    } else if (this.currentMap === 'DUNGEON_FLOOR_3') {
      mainTheme = '#f97316';
      subTheme = '#fdba74';
    } else if (this.currentMap === 'DUNGEON_ELDORIA') {
      mainTheme = '#4ade80';
      subTheme = '#86efac';
    } else if (this.currentMap === 'DUNGEON_STONEWATCH') {
      mainTheme = '#f59e0b';
      subTheme = '#fde68a';
    }

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

    // Title & Subtitle with anime fantasy flair (Auto-fit di dalam kartu)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxCardTextW = cardW - 24;
    let titleFSize = 12.5;
    ctx.font = `bold ${titleFSize}px sans-serif`;
    while (ctx.measureText(this.mapTransitionTitle).width > maxCardTextW && titleFSize > 8.5) {
      titleFSize -= 0.5;
      ctx.font = `bold ${titleFSize.toFixed(1)}px sans-serif`;
    }
    const safeTitle = CanvasText.truncate(ctx, this.mapTransitionTitle, maxCardTextW);
    ctx.fillStyle = subTheme;
    ctx.shadowColor = mainTheme;
    ctx.shadowBlur = 8;
    ctx.fillText(safeTitle, cardX + cardW / 2, cardY + 18);

    ctx.shadowBlur = 0;
    let subFSize = 9.5;
    ctx.font = `italic ${subFSize}px sans-serif`;
    while (ctx.measureText(this.mapTransitionSubtitle).width > maxCardTextW && subFSize > 7) {
      subFSize -= 0.5;
      ctx.font = `italic ${subFSize.toFixed(1)}px sans-serif`;
    }
    const safeSub = CanvasText.truncate(ctx, this.mapTransitionSubtitle, maxCardTextW);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(safeSub, cardX + cardW / 2, cardY + 35);

    ctx.restore();
  }

  private updateMinions(deltaTime: number, activeMonsters: Monster[]): void {
    const minions = this.player.minions;
    if (minions.length === 0) return;

    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const getActiveIsTileSolid = (tx: number, ty: number): boolean => {
      if (this.currentMap === 'OVERWORLD') return this.tileMap.isTileSolid(tx, ty, this.player.isSwimming);
      if (this.currentMap === 'DUNGEON') return this.dungeonMap.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_FLOOR_2') return this.dungeonFloor2.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_FLOOR_3') return this.dungeonFloor3.isTileSolid(tx, ty);
      if (this.currentMap === 'DUNGEON_ELDORIA') return this.dungeonEldoria.isTileSolid(tx, ty, this.player.isSwimming);
      if (this.currentMap === 'DUNGEON_STONEWATCH') return this.dungeonStonewatch.isTileSolid(tx, ty);
      return false;
    };

    const tileSize = 32;
    const canMinionMoveTo = (posX: number, posY: number): boolean => {
      const leftTile = Math.floor((posX + 4) / tileSize);
      const rightTile = Math.floor((posX + 12 - 0.01) / tileSize);
      const topTile = Math.floor((posY + 6) / tileSize);
      const bottomTile = Math.floor((posY + 16 - 0.01) / tileSize);

      for (let ty = topTile; ty <= bottomTile; ty++) {
        for (let tx = leftTile; tx <= rightTile; tx++) {
          if (getActiveIsTileSolid(tx, ty)) return false;
        }
      }
      return true;
    };

    const moveMinion = (minion: any, dx: number, dy: number) => {
      const nextX = minion.x + dx;
      if (canMinionMoveTo(nextX, minion.y)) {
        minion.x = nextX;
      }
      const nextY = minion.y + dy;
      if (canMinionMoveTo(minion.x, nextY)) {
        minion.y = nextY;
      }
    };

    for (let i = minions.length - 1; i >= 0; i--) {
      const minion = minions[i];

      // Auto recover if minion is stuck inside walls
      if (!canMinionMoveTo(minion.x, minion.y) && canMinionMoveTo(playerCenterX - 14, playerCenterY)) {
        minion.x = playerCenterX - 14;
        minion.y = playerCenterY;
      }

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
        const mRadius = Math.max(targetMonster.width, targetMonster.height) / 2;
        const reach = mRadius + (minion.type === 'bear' ? 24 : (minion.type === 'shadow' ? 20 : 18));

        if (closestDist > reach) {
          // Rush to monster without passing through walls
          const moveSpeed = minion.speed * deltaTime;
          const dx = Math.cos(angle) * moveSpeed;
          const dy = Math.sin(angle) * moveSpeed;
          moveMinion(minion, dx, dy);
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
        let targetX = playerCenterX + Math.cos(angleOffset) * formationDistance - 6;
        let targetY = playerCenterY + Math.sin(angleOffset) * formationDistance - 6;

        if (!canMinionMoveTo(targetX, targetY)) {
          targetX = playerCenterX - 8;
          targetY = playerCenterY;
        }

        const distToFormation = Math.hypot(targetX - minion.x, targetY - minion.y);
        minion.direction = playerCenterX < minion.x ? 'left' : 'right';

        if (distToFormation > 220 && canMinionMoveTo(playerCenterX - 14, playerCenterY)) {
          minion.x = playerCenterX - 14;
          minion.y = playerCenterY;
        } else if (distToFormation > 14) {
          const followAngle = Math.atan2(targetY - minion.y, targetX - minion.x);
          const followSpeed = (minion.speed * 1.15) * deltaTime;
          const stepDist = Math.min(distToFormation, followSpeed);
          const dx = Math.cos(followAngle) * stepDist;
          const dy = Math.sin(followAngle) * stepDist;
          moveMinion(minion, dx, dy);
        }
      }
    }
  }

  private handleMonsterAttackMinion(_monster: Monster, minion: any, atk: number): void {
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
