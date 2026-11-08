import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum DungeonTileType {
  FLOOR = 0,
  CRACKED = 1,
  WALL = 2,
  PILLAR = 3,
  LAVA = 4,
  LADDER_EXIT = 5
}

interface DungeonTorch {
  x: number;
  y: number;
}

export class DungeonMap {
  public width: number = 40;
  public height: number = 40;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  private tiles: number[][] = [];
  public torches: DungeonTorch[] = [];
  private animTimer: number = 0;

  // Key Coordinates
  public entranceSpawnX: number = 20 * CONSTANTS.TILE_SIZE + 6;
  public entranceSpawnY: number = 34 * CONSTANTS.TILE_SIZE + 3;
  public ladderX: number = 20 * CONSTANTS.TILE_SIZE;
  public ladderY: number = 36 * CONSTANTS.TILE_SIZE;

  constructor() {
    this.generateDungeon();
  }

  private generateDungeon(): void {
    // 1. Initialize all cells as solid WALL
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = DungeonTileType.WALL;
      }
    }

    // Helper to carve a rectangular room
    const carve = (x1: number, y1: number, x2: number, y2: number, type: DungeonTileType = DungeonTileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            // Randomly scatter cracked tiles for ancient atmosphere
            const isCracked = Math.sin(x * 12.3 + y * 7.7) > 0.45;
            this.tiles[y][x] = isCracked ? DungeonTileType.CRACKED : type;
          }
        }
      }
    };

    // 2. Carve Rooms & Corridors
    // Room 1: Entrance Vestibule (South)
    carve(17, 32, 23, 36);
    this.tiles[36][20] = DungeonTileType.LADDER_EXIT;

    // Corridor 1: Entrance to Great Hall
    carve(19, 26, 21, 31);

    // Room 2: The Great Hall of Ancients (Center)
    carve(13, 15, 27, 25);
    // Pillars in Great Hall
    this.tiles[18][16] = DungeonTileType.PILLAR;
    this.tiles[18][24] = DungeonTileType.PILLAR;
    this.tiles[22][16] = DungeonTileType.PILLAR;
    this.tiles[22][24] = DungeonTileType.PILLAR;

    // Corridor West: to Bone Crypt
    carve(6, 19, 13, 21);

    // Room 3: The Bone Crypt (West)
    carve(4, 14, 11, 24);
    this.tiles[19][7] = DungeonTileType.CRACKED;

    // Corridor East: to Crystal Cavern
    carve(27, 19, 34, 21);

    // Room 4: The Crystal Cavern (East)
    carve(29, 14, 36, 24);
    // Glowing mineral pool in Crystal Cavern
    for (let py = 19; py <= 21; py++) {
      for (let px = 32; px <= 34; px++) {
        this.tiles[py][px] = DungeonTileType.LAVA;
      }
    }

    // Corridor North: to Abyssal Altar
    carve(19, 9, 21, 14);

    // Room 5: The Abyssal Altar / Boss Room (North)
    carve(13, 2, 27, 8);
    // Boss Room Corner Pillars
    this.tiles[3][14] = DungeonTileType.PILLAR;
    this.tiles[3][26] = DungeonTileType.PILLAR;
    this.tiles[7][14] = DungeonTileType.PILLAR;
    this.tiles[7][26] = DungeonTileType.PILLAR;

    // 3. Place Wall Torches at strategic locations
    this.torches = [
      { x: 18, y: 32 },
      { x: 22, y: 32 },
      { x: 15, y: 15 },
      { x: 25, y: 15 },
      { x: 15, y: 25 },
      { x: 25, y: 25 },
      { x: 5,  y: 14 },
      { x: 10, y: 14 },
      { x: 30, y: 14 },
      { x: 35, y: 14 },
      { x: 16, y: 2 },
      { x: 24, y: 2 }
    ];
  }

  public isTileSolid(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return true;
    }
    const tile = this.tiles[tileY][tileX];
    return tile === DungeonTileType.WALL ||
           tile === DungeonTileType.PILLAR ||
           tile === DungeonTileType.LAVA;
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

  public isNearLadder(playerCenterX: number, playerCenterY: number): boolean {
    const lx = this.ladderX + 16;
    const ly = this.ladderY + 16;
    return Math.hypot(lx - playerCenterX, ly - playerCenterY) < 32;
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 4;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;

    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.tiles[y][x];
        const px = x * ts;
        const py = y * ts;
        this.drawTile(ctx, tile, px, py, ts, x, y);
      }
    }

    // Render Wall Torches
    for (const t of this.torches) {
      const tx = t.x * ts;
      const ty = t.y * ts;
      if (tx >= camera.x - ts && tx <= camera.x + camera.viewportWidth + ts &&
          ty >= camera.y - ts && ty <= camera.y + camera.viewportHeight + ts) {
        this.drawWallTorch(ctx, tx + 12, ty + 10);
      }
    }
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    type: DungeonTileType,
    x: number,
    y: number,
    size: number,
    tileX: number,
    tileY: number
  ): void {
    switch (type) {
      case DungeonTileType.FLOOR: {
        // Dark slate cobblestone pavers
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, size, 1);
        ctx.fillRect(x, y, 1, size);
        // Subtle brick texture
        if ((tileX + tileY) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        }
        break;
      }
      case DungeonTileType.CRACKED: {
        ctx.fillStyle = '#172033';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(x, y, size, 1);
        ctx.fillRect(x, y, 1, size);
        // Ancient cracks / moss
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 6, y + 8, 8, 2);
        ctx.fillRect(x + 12, y + 10, 2, 7);
        ctx.fillRect(x + 18, y + 20, 6, 2);
        // Faint turquoise runic glow
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.fillRect(x + 14, y + 14, 3, 3);
        break;
      }
      case DungeonTileType.WALL: {
        // Heavy obsidian / slate dungeon wall
        ctx.fillStyle = '#090d16';
        ctx.fillRect(x, y, size, size);
        // Stone block shading & mortar lines
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 2, size - 4, (size / 2) - 3);
        ctx.fillRect(x + 2, y + (size / 2) + 1, size - 4, (size / 2) - 3);
        // Highlight top rim
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 2, y + 2, size - 4, 1.5);
        ctx.fillRect(x + 2, y + (size / 2) + 1, size - 4, 1.5);
        break;
      }
      case DungeonTileType.PILLAR: {
        // Floor underneath
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        // Pillar Base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 4, y + 22, 24, 8);
        // Pillar Shaft
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 6, y + 6, 20, 18);
        // Pillar Highlights
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 8, y + 6, 4, 18);
        // Pillar Capital (Top)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 4, y + 2, 24, 5);
        break;
      }
      case DungeonTileType.LAVA: {
        // Subterranean Crystal Pool / Mineral Magma
        const bubble = Math.sin(this.animTimer * 1.5 + tileX + tileY) * 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#0891b2'; // Deep cyan pool
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(x + 4, y + 6, size - 8, size - 12);
        // Glowing bubble
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(x + 12 + bubble, y + 14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 11 + bubble, y + 13, 1.5, 1.5);
        break;
      }
      case DungeonTileType.LADDER_EXIT: {
        // Stone Floor base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, size, size);
        // Hole in the ceiling with sunlight shaft
        ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 16, 14, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wooden Ladder
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 8, y + 2, 3, size - 4);
        ctx.fillRect(x + 21, y + 2, 3, size - 4);
        // Ladder rungs
        ctx.fillStyle = '#b45309';
        for (let ry = 6; ry < size - 4; ry += 6) {
          ctx.fillRect(x + 8, y + ry, 16, 2.5);
        }
        break;
      }
    }
  }

  private drawWallTorch(ctx: CanvasRenderingContext2D, tx: number, ty: number): void {
    // Torch bracket
    ctx.fillStyle = '#475569';
    ctx.fillRect(tx, ty, 6, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx + 1, ty - 4, 4, 8);

    // Animated flame
    const flicker = Math.sin(this.animTimer + tx) * 1.5;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(tx + flicker * 0.5, ty - 8, 6, 6);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(tx + 1 + flicker * 0.5, ty - 10, 4, 5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(tx + 2, ty - 11, 2, 3);
  }

  /**
   * Renders the atmospheric subterranean darkness overlay with radial lighting
   */
  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    ctx.save();
    // Ambient cave darkness
    const darknessAlpha = 0.55;

    // Use a secondary offscreen composite for lighting holes
    const screenX = playerCenterX;
    const screenY = playerCenterY;

    // Draw dark overlay covering camera viewport
    ctx.fillStyle = `rgba(3, 7, 18, ${darknessAlpha})`;
    ctx.fillRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);

    // Warm Player Torch Light
    const pGrad = ctx.createRadialGradient(screenX, screenY, 15, screenX, screenY, 115);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    pGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 115, 0, Math.PI * 2);
    ctx.fill();

    // Wall Torch Lighting Auras
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 15;
      const ty = t.y * this.tileSize + 12;
      if (tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
          ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80) {
        const flicker = Math.sin(this.animTimer + t.x) * 4;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 60 + flicker);
        tGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
        tGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.15)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 60 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
