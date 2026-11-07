import { CONSTANTS } from './Constants.ts';
import { Camera } from './Camera.ts';
import { InputManager } from './Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { Player } from '../entities/Player.ts';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private camera: Camera;
  private tileMap: TileMap;
  private player: Player;

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

    this.fpsEl = document.getElementById('fps-display');
    this.coordsEl = document.getElementById('coords-display');

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 150);
    });
  }

  private handleResize(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.canvas.width = screenWidth;
    this.canvas.height = screenHeight;

    // Calculate pixel-art scale factor (keep it integer or crisp)
    // Target roughly 360-480px width on typical mobile screen
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
    // Delta time in seconds (capped at 0.1 to avoid spiral of death)
    const rawDelta = (currentTime - this.lastTime) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1);
    this.lastTime = currentTime;

    // FPS calculation
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

    // 3. Update Player & Collisions
    this.player.update(deltaTime, this.input.state, this.tileMap);

    // 4. Update Camera to follow player
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    this.camera.update(playerCenterX, playerCenterY);

    // 5. Update HUD Coordinates
    if (this.coordsEl) {
      const tileX = Math.floor(this.player.x / CONSTANTS.TILE_SIZE);
      const tileY = Math.floor(this.player.y / CONSTANTS.TILE_SIZE);
      this.coordsEl.textContent = `Tile: (${tileX}, ${tileY}) | World: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`;
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

    // Render TileMap
    this.tileMap.render(ctx, this.camera);

    // Render Player
    this.player.render(ctx);

    ctx.restore();

    // --- MOBILE TOUCH UI OVERLAY (SCREEN SPACE 1:1) ---
    this.input.renderTouchUI(ctx, screenWidth, screenHeight);
  }
}
