import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum Floor3TileType {
  FLOOR = 0,
  MAGMA_CRACK = 1,
  WALL = 2,
  PILLAR = 3,
  LAVA = 4,
  PORTAL_UP = 5
}

export interface BossTelegraph {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
  type?: 'circle' | 'line';
}

export class DungeonFloor3 {
  public width: number = 40;
  public height: number = 40;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  private tiles: number[][] = [];
  public torches: { x: number; y: number }[] = [];
  public animTimer: number = 0;

  // Key Coordinates
  public entranceSpawnX: number = 20 * CONSTANTS.TILE_SIZE + 6;
  public entranceSpawnY: number = 36 * CONSTANTS.TILE_SIZE + 3;
  public portalUpX: number = 20 * CONSTANTS.TILE_SIZE;
  public portalUpY: number = 38 * CONSTANTS.TILE_SIZE;

  // Boss telegraph red danger zones
  public telegraphs: BossTelegraph[] = [];

  // Ambient embers floating in the infernal heat
  private embers: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];

  constructor() {
    this.generateInfernoLabyrinth();
    this.initEmbers();
  }

  private initEmbers(): void {
    for (let i = 0; i < 45; i++) {
      this.embers.push({
        x: Math.random() * (this.width * this.tileSize),
        y: Math.random() * (this.height * this.tileSize),
        vx: (Math.random() - 0.5) * 16,
        vy: -22 - Math.random() * 25,
        life: Math.random() * 2.5,
        maxLife: 2.5,
        size: 1 + Math.random() * 2
      });
    }
  }

  private generateInfernoLabyrinth(): void {
    // 1. Initialize all as solid WALL
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = Floor3TileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: Floor3TileType = Floor3TileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isMagma = Math.random() < 0.22;
            this.tiles[y][x] = isMagma ? Floor3TileType.MAGMA_CRACK : type;
          }
        }
      }
    };

    // 1. Entrance Bastion (South)
    carve(17, 34, 23, 38);
    this.tiles[38][20] = Floor3TileType.PORTAL_UP;

    // 2. The Bridge of Cinders over Lava Chasm
    carve(19, 28, 21, 34);
    // Lava rivers flanking bridge
    for (let ly = 29; ly <= 33; ly++) {
      this.tiles[ly][18] = Floor3TileType.LAVA;
      this.tiles[ly][22] = Floor3TileType.LAVA;
    }

    // 3. The Central Caldera Hall
    carve(12, 16, 28, 28);
    // Pillars in central caldera
    this.tiles[19][15] = Floor3TileType.PILLAR;
    this.tiles[19][25] = Floor3TileType.PILLAR;
    this.tiles[25][15] = Floor3TileType.PILLAR;
    this.tiles[25][25] = Floor3TileType.PILLAR;

    // 4. West Hellhound Kennels (Barat)
    carve(4, 15, 12, 25);
    carve(10, 19, 14, 21); // West corridor

    // 5. East Reaper Sanctum (Timur)
    carve(28, 15, 36, 25);
    carve(26, 19, 30, 21); // East corridor

    // 6. Corridor to Molten Throne
    carve(19, 13, 21, 16);

    // 7. Molten Throne of the Dragon King (North Boss Arena)
    carve(8, 2, 32, 13);

    // Massive Demonic Obsidian Pillars in Dragon Arena
    this.tiles[5][12] = Floor3TileType.PILLAR;
    this.tiles[5][28] = Floor3TileType.PILLAR;
    this.tiles[10][12] = Floor3TileType.PILLAR;
    this.tiles[10][28] = Floor3TileType.PILLAR;

    // Lava pools bordering the dragon throne
    for (let lx = 14; lx <= 26; lx++) {
      this.tiles[3][lx] = Floor3TileType.LAVA;
    }

    // Torches (Hellfire Braziers)
    this.torches = [
      { x: 18, y: 35 }, { x: 22, y: 35 },
      { x: 13, y: 17 }, { x: 27, y: 17 },
      { x: 13, y: 27 }, { x: 27, y: 27 },
      { x: 5, y: 16 },  { x: 11, y: 16 },
      { x: 29, y: 16 }, { x: 35, y: 16 },
      { x: 9, y: 4 },   { x: 31, y: 4 },
      { x: 9, y: 12 },  { x: 31, y: 12 }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;

    // Update boss telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tel = this.telegraphs[i];
      tel.timer -= deltaTime;
      if (tel.timer <= 0) {
        this.telegraphs.splice(i, 1);
      }
    }

    // Update floating embers
    for (const em of this.embers) {
      em.x += em.vx * deltaTime;
      em.y += em.vy * deltaTime;
      em.life -= deltaTime;
      if (em.life <= 0) {
        em.life = em.maxLife;
        em.x = Math.random() * (this.width * this.tileSize);
        em.y = Math.random() * (this.height * this.tileSize);
      }
    }
  }

  public spawnTelegraph(x: number, y: number, radius: number, duration: number, damage: number, type: 'circle' | 'line' = 'circle'): void {
    this.telegraphs.push({
      x,
      y,
      radius,
      timer: duration,
      maxTimer: duration,
      damage,
      type
    });
  }

  public isNearPortalUp(px: number, py: number): boolean {
    const lx = this.portalUpX + 16;
    const ly = this.portalUpY + 16;
    return Math.hypot(px - lx, py - ly) < 36;
  }

  public isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === Floor3TileType.WALL || t === Floor3TileType.PILLAR || t === Floor3TileType.LAVA;
  }

  public checkCollision(rect: { x: number; y: number; width: number; height: number }): boolean {
    const leftTile = Math.floor(rect.x / this.tileSize);
    const rightTile = Math.floor((rect.x + rect.width - 0.01) / this.tileSize);
    const topTile = Math.floor(rect.y / this.tileSize);
    const bottomTile = Math.floor((rect.y + rect.height - 0.01) / this.tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isTileSolid(tx, ty)) {
          return true;
        }
      }
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // Render Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tiles[r][c];
        const x = c * ts;
        const y = r * ts;
        this.renderTile(ctx, tile, x, y, ts);
      }
    }

    // Render Boss Red Telegraph Warning Zones (Meteors & Fire Breath)
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();

      // Outer Danger Ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Internal Magma Fill Area
      const grad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.65)');
      grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Flashing Hazard Icon
      if (Math.sin(this.animTimer * 14) > 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', tel.x, tel.y);
      }
      ctx.restore();
    }

    // Render Rising Floating Embers
    ctx.save();
    for (const em of this.embers) {
      if (em.x >= camera.x && em.x <= camera.x + camera.viewportWidth &&
          em.y >= camera.y && em.y <= camera.y + camera.viewportHeight) {
        const alpha = Math.sin((em.life / em.maxLife) * Math.PI) * 0.8;
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.fillRect(em.x, em.y, em.size, em.size);
      }
    }
    ctx.restore();
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: Floor3TileType, x: number, y: number, size: number): void {
    switch (tile) {
      case Floor3TileType.FLOOR:
        // Dark scorched volcanic basalt
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;

      case Floor3TileType.MAGMA_CRACK:
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x, y, size, size);
        // Glowing magma veins
        const pulse = (Math.sin(this.animTimer * 4 + x) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.5 ? '#f97316' : '#ea580c';
        ctx.fillRect(x + 4, y + 8, 10, 2);
        ctx.fillRect(x + 12, y + 6, 2, 12);
        ctx.fillRect(x + 18, y + 16, 8, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x + 12, y + 8, 2, 4);
        break;

      case Floor3TileType.WALL:
        // Dark Obsidian demon fortress block
        ctx.fillStyle = '#09090b';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        break;

      case Floor3TileType.PILLAR:
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x, y, size, size);
        // Demonic Obsidian Spire
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 2, size - 8, size - 4, 4);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Molten rune band
        ctx.fillStyle = '#f97316';
        ctx.fillRect(x + 5, y + size / 2 - 2, size - 10, 4);
        break;

      case Floor3TileType.LAVA:
        // Flowing Lava
        const lavaWave = Math.sin(this.animTimer * 5 + x * 0.1) * 2;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x + 2, y + 3 + lavaWave, size - 4, size - 6);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x + 6, y + 8 + lavaWave * 0.5, 8, 4);
        break;

      case Floor3TileType.PORTAL_UP:
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x, y, size, size);
        // Stone ring
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 13, 0, Math.PI * 2);
        ctx.fill();
        // Purple/cyan return vortex to Floor 2
        const grad = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 12);
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(0.6, '#38bdf8');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('▲ Ke Lt.2', x + 16, y - 3);
        break;
    }
  }

  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    ctx.save();
    // Warm infernal darkness overlay
    ctx.fillStyle = 'rgba(23, 5, 5, 0.62)';
    ctx.fillRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);

    // Warm Player Golden Torchlight
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 115);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    pGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.2)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 115, 0, Math.PI * 2);
    ctx.fill();

    // Hellfire Braziers (Bright Orange/Red Glows)
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 16;
      const ty = t.y * this.tileSize + 16;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 5 + t.x) * 5;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 70 + flicker);
        tGrad.addColorStop(0, 'rgba(254, 215, 170, 0.5)');
        tGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.25)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 70 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
