import { CONSTANTS } from './Constants.ts';
import { Camera } from './Camera.ts';
import { InputManager } from './Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { Player } from '../entities/Player.ts';
import { WorldItem } from '../world/WorldItem.ts';
import { Chest } from '../world/Chest.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { InventoryUI } from '../ui/InventoryUI.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private camera: Camera;
  private tileMap: TileMap;
  private player: Player;
  private floatingText: FloatingTextManager;
  private inventoryUI: InventoryUI;

  // World objects
  private worldItems: WorldItem[] = [];
  private chests: Chest[] = [];

  private lastTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  // Render scale
  private scale: number = 1;
  private virtualWidth: number = CONSTANTS.INTERNAL_WIDTH;
  private virtualHeight: number = CONSTANTS.INTERNAL_HEIGHT;

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

    this.floatingText = new FloatingTextManager();
    this.inventoryUI = new InventoryUI(this.player.inventory, this.player, this.floatingText);

    // Connect touch interceptor for Backpack and Inventory UI
    this.input.setTouchInterceptor((touchX, touchY) => {
      return this.inventoryUI.handleTouch(touchX, touchY, this.canvas.width, this.canvas.height);
    });

    this.fpsEl = document.getElementById('fps-display');
    this.coordsEl = document.getElementById('coords-display');

    this.spawnInitialWorldObjects();

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 150);
    });
  }

  private spawnInitialWorldObjects(): void {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. Spawn Treasure Chests around the area
    this.chests.push(
      new Chest(52 * ts + 5, 48 * ts + 6, [
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

    // 2. Scatter World Items (Bunga, Kayu, Koin, Potion)
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

  private handleResize(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.canvas.width = screenWidth;
    this.canvas.height = screenHeight;

    const targetInternalW = 420;
    const computedScale = Math.max(1, Math.round(screenWidth / targetInternalW));
    this.scale = computedScale;

    this.virtualWidth = Math.ceil(screenWidth / this.scale);
    this.virtualHeight = Math.ceil(screenHeight / this.scale);

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
    // 1. Process Input
    this.input.update();

    // 2. Update World Animations
    this.tileMap.update(deltaTime);

    // 3. Update Player & Collisions (Chests act as solid obstacles)
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    const chestObstacleChecker = (box: { x: number; y: number; width: number; height: number }) => {
      for (const chest of this.chests) {
        const cb = chest.getCollisionBox();
        if (
          box.x < cb.x + cb.width &&
          box.x + box.width > cb.x &&
          box.y < cb.y + cb.height &&
          box.y + box.height > cb.y
        ) {
          return true;
        }
      }
      return false;
    };

    // Don't move player if inventory modal is open
    const activeInput = this.inventoryUI.isOpen
      ? { axisX: 0, axisY: 0, isAction: false, isSprint: false }
      : this.input.state;

    this.player.update(deltaTime, activeInput, this.tileMap, chestObstacleChecker);

    // 4. Update Chests & Handle Interactions
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
        }
      }
    }

    // 5. Update World Items (Magnet & Pickup)
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

    // 6. Update Floating Text Notifications
    this.floatingText.update(deltaTime);

    // 7. Update Camera to follow player
    this.camera.update(playerCenterX, playerCenterY);

    // 8. Update HUD Coordinates & Player Health
    if (this.coordsEl) {
      const tileX = Math.floor(this.player.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(this.player.y / CONSTANTS.TILE_SIZE);
      this.coordsEl.innerHTML = `
        Tile: (${tileX}, ${tileY})<br>
        <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
          <span>HP:</span>
          <div style="width: 80px; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; display: inline-block;">
            <div style="width: ${(this.player.hp / this.player.maxHp) * 100}%; height: 100%; background: #22c55e;"></div>
          </div>
          <span>${this.player.hp}/${this.player.maxHp}</span>
        </div>
      `;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Disable image smoothing for pixel-art clarity
    ctx.imageSmoothingEnabled = false;

    // --- WORLD RENDERING (SCALED & TRANSLATED) ---
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 1. Render TileMap
    this.tileMap.render(ctx, this.camera);

    // 2. Render Chests
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    for (const chest of this.chests) {
      chest.render(ctx, chest.isNearPlayer(playerCenterX, playerCenterY));
    }

    // 3. Render World Items
    for (const item of this.worldItems) {
      item.render(ctx);
    }

    // 4. Render Player
    this.player.render(ctx);

    // 5. Render Floating Texts
    this.floatingText.render(ctx);

    ctx.restore();

    // --- SCREEN SPACE 1:1 RENDERING ---
    // 6. Mobile Touch Controls (D-pad & action buttons)
    if (!this.inventoryUI.isOpen) {
      this.input.renderTouchUI(ctx, screenWidth, screenHeight);
    }

    // 7. Inventory UI Overlay (Backpack button & Modal)
    this.inventoryUI.render(ctx, screenWidth, screenHeight);
  }
}
