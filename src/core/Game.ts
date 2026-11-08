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
import { ROLE_INFO } from '../data/RolesData.ts';

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

    // Create Guild Receptionist Elaine near spawn
    const guildX = 51 * CONSTANTS.TILE_SIZE;
    const guildY = 48 * CONSTANTS.TILE_SIZE;
    this.guildNPC = new GuildNPC(guildX, guildY);

    this.spawnInitialWorldObjects();

    // Inisialisasi Auth & Onboarding flow
    this.authUI = new AuthUI(this.player, this.chests, this.floatingText);
    this.onboardingUI = new OnboardingUI();

    this.setupOnboardingFlow();

    // Connect touch interceptor for all UI layers
    this.input.setTouchInterceptor((touchX, touchY) => {
      if (this.onboardingUI.state !== 'PLAYING') return true;

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
    await SupabaseService.init();

    SupabaseService.onAuthChange(async (user) => {
      if (user) {
        this.authUI.isGuest = false;
        // Check if user already has cloud save
        const hasSave = await this.authUI.loadCloudSave(user.id);
        if (hasSave) {
          // Cloud save exists -> proceed directly to PLAYING!
          this.onboardingUI.setState('PLAYING');
          const roleName = ROLE_INFO[this.player.role].name;
          this.floatingText.spawn(this.player.x + 10, this.player.y - 20, `Selamat datang kembali, ${this.player.username}! (${roleName})`, '#38bdf8', 3.0);
        } else {
          // New Google User -> Go to Character Creation!
          this.onboardingUI.username = (user.user_metadata?.full_name || 'Hero').slice(0, 15);
          this.onboardingUI.setState('CHARACTER_CREATION');
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

    // 1. Process Input
    this.input.update();

    // 2. Update World Animations
    this.tileMap.update(deltaTime);
    this.skillBarUI.update(deltaTime);

    // 3. Update Player & Collisions
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const obstacleChecker = (box: { x: number; y: number; width: number; height: number }) => {
      // Chests
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
      return false;
    };

    // Freeze player if inventory, guild dialog, control settings, or notification modal is open
    const activeInput = (this.inventoryUI.isOpen || this.guildNPC.isAppraisalOpen || this.controlSettingsModal.isOpen || NotificationModal.isOpen)
      ? { axisX: 0, axisY: 0, isAction: false, isSprint: false }
      : this.input.state;

    this.player.update(deltaTime, activeInput, this.tileMap, obstacleChecker);

    // 4. Guild Receptionist Interaction
    if (!this.guildNPC.isAppraisalOpen && this.guildNPC.isNearPlayer(playerCenterX, playerCenterY)) {
      if (this.input.state.isAction) {
        this.guildNPC.openAppraisal();
      }
    }

    // 5. Update Chests & Handle Interactions
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
          // Gain exp from opening chest!
          const leveledUp = this.player.addExp(25);
          if (leveledUp) {
            this.floatingText.spawn(this.player.x + 10, this.player.y - 30, `🎉 LEVEL UP! Sekarang Lv. ${this.player.level}`, '#fde047', 3.0);
          }
          this.authUI.saveCurrentGame();
        }
      }
    }

    // 6. Update World Items (Magnet & Pickup)
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

    // 7. Update Floating Text Notifications
    this.floatingText.update(deltaTime);

    // 8. Update Auth & Cloud Auto-Save
    this.authUI.update(deltaTime);

    // 9. Update Camera to follow player
    this.camera.update(playerCenterX, playerCenterY);

    // 10. Update HUD Coordinates & Player Health/Mana Bar
    if (this.coordsEl) {
      const tileX = Math.floor(this.player.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(this.player.y / CONSTANTS.TILE_SIZE);
      const roleInfo = ROLE_INFO[this.player.role];

      this.coordsEl.innerHTML = `
        <div style="font-weight: 700; color: ${roleInfo.color}; margin-bottom: 2px;">
          ${this.player.username} · Lv.${this.player.level} [${roleInfo.tag}]
        </div>
        Tile: (${tileX}, ${tileY})<br>
        <!-- HP Bar -->
        <div style="margin-top: 3px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; width: 20px;">HP</span>
          <div style="width: 75px; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; display: inline-block;">
            <div style="width: ${(this.player.hp / this.player.maxHp) * 100}%; height: 100%; background: #22c55e;"></div>
          </div>
          <span style="font-size: 10px;">${this.player.hp}/${this.player.maxHp}</span>
        </div>
        <!-- MP Bar -->
        <div style="margin-top: 2px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; width: 20px;">MP</span>
          <div style="width: 75px; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; display: inline-block;">
            <div style="width: ${(this.player.mp / this.player.maxMp) * 100}%; height: 100%; background: #38bdf8;"></div>
          </div>
          <span style="font-size: 10px;">${this.player.mp}/${this.player.maxMp}</span>
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

    // 1. Render TileMap
    this.tileMap.render(ctx, this.camera);

    // 2. Render Guild NPC
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    this.guildNPC.render(ctx, this.guildNPC.isNearPlayer(playerCenterX, playerCenterY));

    // 3. Render Chests
    for (const chest of this.chests) {
      chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY));
    }

    // 4. Render World Items
    for (const item of this.worldItems) {
      item.render(ctx);
    }

    // 5. Render Player
    this.player.render(ctx);

    // 6. Render Spell Effects
    this.skillBarUI.renderWorldEffects(ctx);

    // 7. Render Floating Texts
    this.floatingText.render(ctx);

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

      // 14. Topmost Modal: Premium In-Game Notification / Confirm Dialog
      NotificationModal.render(ctx, screenWidth, screenHeight);
    }
  }
}
