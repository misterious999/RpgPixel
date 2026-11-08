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

  // Map & Dungeon state
  public currentMap: 'OVERWORLD' | 'DUNGEON' = 'OVERWORLD';
  private caveEntrance: CaveEntrance;
  private dungeonMap: DungeonMap;
  private dungeonMonsters: Monster[] = [];
  private dungeonChests: Chest[] = [];
  private dungeonWorldItems: WorldItem[] = [];
  private mapTransitionTimer: number = 0;
  private mapTransitionTitle: string = '';
  private mapTransitionSubtitle: string = '';

  // World objects
  private worldItems: WorldItem[] = [];
  private chests: Chest[] = [];
  private guildNPC: GuildNPC;

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

    // Create Guild Receptionist Elaine near spawn
    const guildX = 51 * CONSTANTS.TILE_SIZE;
    const guildY = 48 * CONSTANTS.TILE_SIZE;
    this.guildNPC = new GuildNPC(guildX, guildY);

    // Inisialisasi Pintu Masuk Goa (Dungeon Entrance) di Overworld (Utara Kota)
    this.caveEntrance = new CaveEntrance(49, 32);

    // Inisialisasi Dungeon Bawah Tanah, Monster & Peti Rahasia
    this.dungeonMap = new DungeonMap();
    this.spawnInitialDungeonObjects();

    this.spawnInitialWorldObjects();

    // Inisialisasi Auth & Onboarding flow
    this.authUI = new AuthUI(this.player, this.chests, this.floatingText);
    this.authUI.getCurrentMap = () => this.currentMap;
    this.controlSettingsModal.onLogoutRequested = () => {
      this.authUI.performLogout();
    };
    this.onboardingUI = new OnboardingUI();

    this.setupOnboardingFlow();

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

      // 1. Guild Appraisal Modal
      if (this.guildNPC.handleTouch(touchX, touchY, this.screenWidth, this.screenHeight, this.player, this.floatingText)) {
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
    // 1. Pulihkan sesi jika pengguna baru saja me-refresh dari auto-update
    const hasSessionSave = this.restoreSessionSnapshot();
    if (hasSessionSave) {
      this.onboardingUI.setState('PLAYING');
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
          const hasSave = await this.authUI.loadCloudSave(user.id);
          if (hasSave) {
            this.onboardingUI.setState('PLAYING');
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

      // Initial save to cloud if logged in
      if (!isGuest) {
        this.authUI.saveCurrentGame();
      }

      this.floatingText.spawn(this.player.x + 10, this.player.y - 18, `Selamat datang, ${username}! Temui Pihak Guild untuk memilih Role.`, '#facc15', 3.5);
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
        { itemId: 'ANCIENT_BONE', count: 3 }
      ]),
      // Peti 2: Gua Kristal Mineral (East Cavern)
      new Chest(34 * ts + 5, 15 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 180 },
        { itemId: 'MANA_POTION', count: 3 },
        { itemId: 'DUNGEON_GEM', count: 1 }
      ]),
      // Peti 3: Harta Karun Legendaris di Belakang Altar Bos (North Chamber)
      new Chest(20 * ts + 5, 3 * ts + 6, [
        { itemId: 'GOLD_COIN', count: 350 },
        { itemId: 'DUNGEON_GEM', count: 3 },
        { itemId: 'HEALTH_POTION', count: 4 },
        { itemId: 'MANA_POTION', count: 4 }
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

  public enterDungeon(): void {
    this.currentMap = 'DUNGEON';
    this.player.x = this.dungeonMap.entranceSpawnX;
    this.player.y = this.dungeonMap.entranceSpawnY;
    this.player.direction = 'up';

    // Perbarui batas kamera untuk map Dungeon (40x40 tile)
    this.camera.setWorldBounds(this.dungeonMap.width * CONSTANTS.TILE_SIZE, this.dungeonMap.height * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('🏰 GOA BAWAH TANAH', 'Dungeon Tingkat 1');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '⛩️ Memasuki Goa Bawah Tanah!', '#c084fc', 3.0);
    this.saveSessionSnapshot();
  }

  public exitDungeon(): void {
    this.currentMap = 'OVERWORLD';
    // Tempatkan pemain tepat di depan pintu masuk goa di Dunia Luar
    this.player.x = 50 * CONSTANTS.TILE_SIZE + 6;
    this.player.y = 35 * CONSTANTS.TILE_SIZE + 3;
    this.player.direction = 'down';

    // Perbarui batas kamera untuk Dunia Luar (100x100 tile)
    this.camera.setWorldBounds(CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE);
    this.camera.update(this.player.x, this.player.y);

    this.triggerMapTransition('🌤️ LEMBAH SERIKAT', 'Dunia Luar (Overworld)');
    this.floatingText.spawn(this.player.x + 10, this.player.y - 18, '🌤️ Kembali ke Permukaan', '#facc15', 3.0);
    this.saveSessionSnapshot();
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
    } else {
      this.dungeonMap.update(deltaTime);
    }
    this.skillBarUI.update(deltaTime);

    // 3. Update Player & Collisions
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const obstacleChecker = (box: { x: number; y: number; width: number; height: number }) => {
      if (this.currentMap === 'OVERWORLD') {
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

    // Freeze player if inventory, guild dialog, control settings, or notification modal is open
    const activeInput = (this.inventoryUI.isOpen || this.guildNPC.isAppraisalOpen || this.controlSettingsModal.isOpen || NotificationModal.isOpen)
      ? { axisX: 0, axisY: 0, isAction: false, isSprint: false }
      : this.input.state;

    const activeMap = this.currentMap === 'OVERWORLD' ? this.tileMap : this.dungeonMap;
    this.player.update(deltaTime, activeInput, activeMap, obstacleChecker);

    // --- OVERWORLD SPECIFIC UPDATES ---
    if (this.currentMap === 'OVERWORLD') {
      // 4. Guild Receptionist Interaction
      if (!this.guildNPC.isAppraisalOpen && this.guildNPC.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.state.isAction) {
          this.guildNPC.openAppraisal();
        }
      }

      // 5. Cave Entrance (Masuk Goa / Dungeon)
      if (this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY)) {
        if (this.input.state.isAction) {
          this.enterDungeon();
          return;
        }
      }

      // 6. Update Chests & Handle Interactions
      for (const chest of this.chests) {
        chest.update(deltaTime);
        if (!chest.isOpen && chest.isNearPlayer(playerCenterX, playerCenterY)) {
          if (this.input.state.isAction) {
            const rewards = chest.open();
            for (const reward of rewards) {
              this.player.inventory.addItem(reward.itemId, reward.count);
              const def = ITEM_DEFINITIONS[reward.itemId];
              const name = def ? def.name : reward.itemId;
              this.floatingText.spawn(chest.x + 11, chest.y - 12, `+${reward.count} ${name}`, '#facc15', 1.8);
            }
            const leveledUp = this.player.addExp(25);
            if (leveledUp) {
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
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.worldItems.splice(i, 1);
          }
        }
      }
    } else {
      // --- DUNGEON SPECIFIC UPDATES ---
      // 4. Exit Ladder to Surface
      if (this.dungeonMap.isNearLadder(playerCenterX, playerCenterY)) {
        if (this.input.state.isAction) {
          this.exitDungeon();
          return;
        }
      }

      // 5. Dungeon Chests
      for (const chest of this.dungeonChests) {
        chest.update(deltaTime);
        if (!chest.isOpen && chest.isNearPlayer(playerCenterX, playerCenterY)) {
          if (this.input.state.isAction) {
            const rewards = chest.open();
            for (const reward of rewards) {
              this.player.inventory.addItem(reward.itemId, reward.count);
              const def = ITEM_DEFINITIONS[reward.itemId];
              const name = def ? def.name : reward.itemId;
              this.floatingText.spawn(chest.x + 11, chest.y - 12, `+${reward.count} ${name}`, '#facc15', 2.0);
            }
            const leveledUp = this.player.addExp(50);
            if (leveledUp) {
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
            const def = ITEM_DEFINITIONS[item.itemId];
            const name = def ? def.name : item.itemId;
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${added} ${name}`, '#38bdf8');
            this.dungeonWorldItems.splice(i, 1);
          }
        }
      }

      // 7. Dungeon Monsters Update (AI, Movement & Player Attack)
      for (const monster of this.dungeonMonsters) {
        monster.update(
          deltaTime,
          playerCenterX,
          playerCenterY,
          (tx, ty) => this.dungeonMap.isTileSolid(tx, ty),
          (atk) => {
            this.player.takeDamage(atk);
            this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `-${atk} HP`, '#ef4444');
            if (this.player.hp <= 0) {
              this.exitDungeon(); // Safe respawn to town plaza
            }
          }
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
            const hitText = isCrit ? `💥 CRIT -${res.damage}!` : `-${res.damage}`;
            this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 10, hitText, isCrit ? '#facc15' : '#ffffff');

            if (res.isDead) {
              const leveledUp = this.player.addExp(monster.expReward);
              this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 20, `+${monster.expReward} EXP!`, '#facc15', 2.0);

              // Gold drop
              this.dungeonWorldItems.push(new WorldItem(monster.x + 4, monster.y + 4, 'GOLD_COIN', monster.goldReward));

              // Unique Monster Drops
              if (monster.type === 'SLIME' && Math.random() < 0.65) {
                this.dungeonWorldItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'SLIME_JELLY', 1));
              } else if (monster.type === 'BAT' && Math.random() < 0.5) {
                this.dungeonWorldItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'MAGIC_FLOWER', 2));
              } else if (monster.type === 'SKELETON') {
                if (Math.random() < 0.7) {
                  this.dungeonWorldItems.push(new WorldItem(monster.x + 12, monster.y + 8, 'ANCIENT_BONE', 1));
                }
                if (Math.random() < 0.35) {
                  this.dungeonWorldItems.push(new WorldItem(monster.x + 6, monster.y + 12, 'MANA_POTION', 1));
                }
              } else if (monster.type === 'BOSS_SLIME') {
                this.dungeonWorldItems.push(new WorldItem(monster.x + 16, monster.y + 8, 'DUNGEON_GEM', 2));
                this.dungeonWorldItems.push(new WorldItem(monster.x + 24, monster.y + 14, 'HEALTH_POTION', 3));
                this.dungeonWorldItems.push(new WorldItem(monster.x + 8, monster.y + 14, 'MANA_POTION', 3));
                this.floatingText.spawn(monster.x + 16, monster.y - 32, '🏆 RAJA SLIME DIKALAHKAN!!', '#facc15', 3.5);
              }

              if (leveledUp) {
                this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
              }
            }
          }
        }
      }

      // 9. Player Skill Effects vs Monsters (Sihir & Skill Serangan)
      for (const effect of this.skillBarUI.visualEffects) {
        if (['slash', 'fire', 'ice', 'lightning', 'wind', 'earth', 'abnormal'].includes(effect.type)) {
          for (const monster of this.dungeonMonsters) {
            if (monster.isDead) continue;
            const dist = Math.hypot(effect.x - (monster.x + monster.width / 2), effect.y - (monster.y + monster.height / 2));
            if (dist < effect.radius + monster.width / 2) {
              if (monster.hurtTimer <= 0) {
                const spellDmg = effect.type === 'abnormal' ? 65 + this.player.level * 6 : 28 + this.player.level * 3.5;
                const res = monster.takeDamage(spellDmg, effect.x, effect.y);
                this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 8, `✨ -${res.damage}`, effect.color);
                if (res.isDead) {
                  const leveledUp = this.player.addExp(monster.expReward);
                  this.floatingText.spawn(monster.x + monster.width / 2, monster.y - 18, `+${monster.expReward} EXP!`, '#facc15', 2.0);
                  this.dungeonWorldItems.push(new WorldItem(monster.x + 4, monster.y + 4, 'GOLD_COIN', monster.goldReward));
                  if (leveledUp) {
                    this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 10. Update Floating Text Notifications
    this.floatingText.update(deltaTime);

    // 11. Update Auth & Cloud Auto-Save
    this.authUI.update(deltaTime);

    // 12. Update Camera to follow player
    this.camera.update(playerCenterX, playerCenterY);

    // 13. Update HUD Coordinates & Player Health/Mana Bar
    if (this.coordsEl) {
      const tileX = Math.floor(this.player.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(this.player.y / CONSTANTS.TILE_SIZE);
      const roleInfo = ROLE_INFO[this.player.role];
      const locText = this.currentMap === 'DUNGEON'
        ? '<span style="color: #c084fc; font-weight: 700;">🏰 Goa Bawah Tanah (Dungeon Lt.1)</span>'
        : '<span style="color: #4ade80; font-weight: 700;">🌍 Lembah Serikat (Overworld)</span>';

      this.coordsEl.innerHTML = `
        <div style="font-weight: 700; color: ${roleInfo.color}; margin-bottom: 2px;">
          ${this.player.username} · Lv.${this.player.level} [${roleInfo.tag}]
        </div>
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

      // 2. Render Cave / Dungeon Entrance
      this.caveEntrance.render(ctx, this.caveEntrance.isNearPlayer(playerCenterX, playerCenterY));

      // 3. Render Guild NPC
      this.guildNPC.render(ctx, this.guildNPC.isNearPlayer(playerCenterX, playerCenterY), this.player);

      // 4. Render Overworld Chests
      for (const chest of this.chests) {
        chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY));
      }

      // 5. Render Overworld Items
      for (const item of this.worldItems) {
        item.render(ctx);
      }

      // 6. Render Player
      this.player.render(ctx);

      // 7. Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // 8. Render Floating Texts
      this.floatingText.render(ctx);
    } else {
      // --- DUNGEON WORLD RENDERING ---
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

      // 5. Render Player
      this.player.render(ctx);

      // 6. Render Spell Effects
      this.skillBarUI.renderWorldEffects(ctx);

      // 7. Render Floating Texts
      this.floatingText.render(ctx);

      // 8. Render Atmospheric Subterranean Torch Lighting & Fog of War
      this.dungeonMap.renderAtmosphericLighting(ctx, this.camera, playerCenterX, playerCenterY);
    }

    ctx.restore();

    // 4. High-DPI UI & Text rendering: Enable smooth anti-aliased font and vector card rendering
    ctx.imageSmoothingEnabled = true;

    // --- SCREEN SPACE 1:1 RENDERING ---
    if (this.onboardingUI.state === 'PLAYING') {
      // 8. Mobile Touch D-Pad & Action Buttons
      if (!this.inventoryUI.isOpen && !this.guildNPC.isAppraisalOpen && !this.controlSettingsModal.isOpen) {
        this.input.renderTouchUI(ctx, screenWidth, screenHeight);
        // Mobile Skill Bar
        this.skillBarUI.renderTouchSkillBar(ctx, screenWidth, screenHeight);
      }

      // 9. Auth Status Pill / Logout
      this.authUI.render(ctx, screenWidth);

      // 10. Inventory UI Overlay
      this.inventoryUI.render(ctx, screenWidth, screenHeight);

      // 11. Guild Appraisal Ceremony Modal
      this.guildNPC.renderModal(ctx, screenWidth, screenHeight, this.player);

      // 12. Control Settings Modal (Gear ⚙️ & customization)
      this.controlSettingsModal.render(ctx, screenWidth, screenHeight);

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

      // 16. Map Transition Announcement Banner
      if (this.mapTransitionTimer > 0) {
        ctx.save();
        const transAlpha = Math.min(1, Math.min(this.mapTransitionTimer, 1));
        ctx.globalAlpha = transAlpha;
        const tW = 260;
        const tH = 44;
        const tX = (screenWidth - tW) / 2;
        const tY = 48;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(tX, tY, tW, tH);
        ctx.strokeStyle = this.currentMap === 'DUNGEON' ? '#c084fc' : '#facc15';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(tX, tY, tW, tH);

        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.currentMap === 'DUNGEON' ? '#f0abfc' : '#fef08a';
        ctx.fillText(this.mapTransitionTitle, tX + tW / 2, tY + 18);

        ctx.font = '9.5px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(this.mapTransitionSubtitle, tX + tW / 2, tY + 34);
        ctx.restore();
      }

      // 17. Topmost Modal: Premium In-Game Notification / Confirm Dialog
      NotificationModal.render(ctx, screenWidth, screenHeight);
    }
  }
}
