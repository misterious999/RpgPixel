import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum Floor2TileType {
  FLOOR = 0,
  MOSSY = 1,
  WALL = 2,
  PILLAR = 3,
  RUNIC = 4,
  LADDER_UP = 5
}

export interface BossTelegraph {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
}

export class DungeonFloor2 {
  public width: number = 40;
  public height: number = 40;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  private tiles: number[][] = [];
  public torches: { x: number; y: number }[] = [];
  public animTimer: number = 0;

  // Key Coordinates
  public entranceSpawnX: number = 20 * CONSTANTS.TILE_SIZE + 6;
  public entranceSpawnY: number = 36 * CONSTANTS.TILE_SIZE + 3;
  public ladderUpX: number = 20 * CONSTANTS.TILE_SIZE;
  public ladderUpY: number = 38 * CONSTANTS.TILE_SIZE;

  // Floor 3 Portal (Unlocked after defeating Floor 2 Boss Titan)
  public floor3PortalX: number = 20 * CONSTANTS.TILE_SIZE;
  public floor3PortalY: number = 5 * CONSTANTS.TILE_SIZE;
  public isFloor3Unlocked: boolean = false;

  // Boss telegraph red zone effects
  public telegraphs: BossTelegraph[] = [];

  constructor() {
    this.generateLabyrinth();
  }

  private generateLabyrinth(): void {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = Floor2TileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: Floor2TileType = Floor2TileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isMossy = Math.random() < 0.2;
            this.tiles[y][x] = isMossy ? Floor2TileType.MOSSY : type;
          }
        }
      }
    };

    // 1. Entrance Sanctuary (South)
    carve(17, 34, 23, 38);
    this.tiles[38][20] = Floor2TileType.LADDER_UP;

    // 2. Central Ancient Hall
    carve(14, 18, 26, 30);
    // Hallway from south to center
    carve(19, 30, 21, 34);

    // 3. West Crypt Room (Ruang Makam Purba)
    carve(4, 16, 12, 26);
    carve(12, 21, 14, 23); // Corridor west

    // 4. East Crystal Grotto (Gua Batu Kristal Abisal)
    carve(28, 16, 36, 26);
    carve(26, 21, 28, 23); // Corridor east

    // 5. Boss Arena: Altar Golem Purba (North)
    carve(10, 4, 30, 15);
    carve(19, 15, 21, 18); // Corridor to boss

    // Place Ancient Pillars in Boss Arena
    this.tiles[7][14] = Floor2TileType.PILLAR;
    this.tiles[7][26] = Floor2TileType.PILLAR;
    this.tiles[12][14] = Floor2TileType.PILLAR;
    this.tiles[12][26] = Floor2TileType.PILLAR;

    // Runic Circles
    this.tiles[9][20] = Floor2TileType.RUNIC;
    this.tiles[10][20] = Floor2TileType.RUNIC;

    // Torches
    this.torches = [
      { x: 19, y: 35 }, { x: 21, y: 35 },
      { x: 15, y: 20 }, { x: 25, y: 20 },
      { x: 5, y: 18 },  { x: 11, y: 18 },
      { x: 29, y: 18 }, { x: 35, y: 18 },
      { x: 11, y: 6 },  { x: 29, y: 6 }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;

    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tel = this.telegraphs[i];
      tel.timer -= deltaTime;
      if (tel.timer <= 0) {
        this.telegraphs.splice(i, 1);
      }
    }
  }

  public spawnTelegraph(x: number, y: number, radius: number, duration: number, damage: number): void {
    this.telegraphs.push({
      x,
      y,
      radius,
      timer: duration,
      maxTimer: duration,
      damage
    });
  }

  public isNearLadderUp(px: number, py: number): boolean {
    const lx = this.ladderUpX + 16;
    const ly = this.ladderUpY + 16;
    return Math.hypot(px - lx, py - ly) < 32;
  }

  public isNearFloor3Portal(px: number, py: number): boolean {
    if (!this.isFloor3Unlocked) return false;
    const lx = this.floor3PortalX + 16;
    const ly = this.floor3PortalY + 16;
    return Math.hypot(px - lx, py - ly) < 36;
  }

  public isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === Floor2TileType.WALL || t === Floor2TileType.PILLAR;
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

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tiles[r][c];
        const x = c * ts;
        const y = r * ts;
        this.renderTile(ctx, tile, x, y, ts);
      }
    }

    // Render Boss Red Telegraph Warning Zones
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();
      // Outer warning circle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Filling red danger zone
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Flashing exclamation hazard mark in center
      if (Math.sin(this.animTimer * 12) > 0) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', tel.x, tel.y);
      }
      ctx.restore();
    }

    // Render Floor 3 Infernal Portal if unlocked
    if (this.isFloor3Unlocked) {
      const px = this.floor3PortalX;
      const py = this.floor3PortalY;
      ctx.save();
      // Molten portal pit
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(px, py, ts, ts);

      // Magma vortex
      const grad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 15);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 13, 0, Math.PI * 2);
      ctx.fill();

      // Fiery spikes
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);

      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fdba74';
      ctx.fillText('▼ Ke Lantai 3', px + 16, py - 4);
      ctx.restore();
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: Floor2TileType, x: number, y: number, size: number): void {
    switch (tile) {
      case Floor2TileType.FLOOR:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;

      case Floor2TileType.MOSSY:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#065f46';
        ctx.fillRect(x + 4, y + 6, 8, 5);
        ctx.fillRect(x + 16, y + 18, 10, 6);
        break;

      case Floor2TileType.WALL:
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        break;

      case Floor2TileType.PILLAR:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 3, size - 8, size - 6, 4);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;

      case Floor2TileType.RUNIC:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(x + size / 2 - 2, y + size / 2 - 2, 4, 4);
        break;

      case Floor2TileType.LADDER_UP:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 8, y + 2, 3, size - 4);
        ctx.fillRect(x + 21, y + 2, 3, size - 4);
        ctx.fillStyle = '#b45309';
        for (let ry = 6; ry < size - 4; ry += 6) {
          ctx.fillRect(x + 8, y + ry, 16, 2.5);
        }
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
    // Deeper abyssal darkness in Floor 2
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.fillRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);

    // Warm Player Light
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 110);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
    pGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 110, 0, Math.PI * 2);
    ctx.fill();

    // Ancient Purple Torches
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 16;
      const ty = t.y * this.tileSize + 16;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 4 + t.x) * 4;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 64 + flicker);
        tGrad.addColorStop(0, 'rgba(232, 121, 249, 0.45)');
        tGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.18)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 64 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
