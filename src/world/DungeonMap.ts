import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';
import {
  drawDungeonWall3D,
  drawDungeonFloor,
  drawRoyalCarpet,
  drawBossMandala,
  drawWallTorch3D,
  DungeonLightingEngine,
  DungeonTheme,
  tileHash
} from './DungeonVisuals.ts';

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

const FLOOR1_THEME: DungeonTheme = {
  wallTopBase: '#1e293b',
  wallTopHighlight: '#475569',
  wallTopShadow: '#090d16',
  wallFaceBase: '#0f172a',
  wallFaceBrick1: '#1e293b',
  wallFaceBrick2: '#243147',
  wallFaceMortar: '#090d16',
  wallFaceCrack: '#06b6d4',
  floorTones: ['#1e293b', '#243147', '#1a2332', '#28354c'],
  floorMortar: '#0a0f1d',
  floorHighlight: '#64748b',
  mossColor: '#065f46',
  puddleColor: 'rgba(8, 145, 178, 0.35)'
};

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

  // Floor 2 Descent Staircase (Unlocked after defeating Floor 1 Boss)
  public floor2LadderX: number = 20 * CONSTANTS.TILE_SIZE;
  public floor2LadderY: number = 3 * CONSTANTS.TILE_SIZE;
  public isFloor2Unlocked: boolean = false;

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

  public getTiles(): number[][] {
    return this.tiles;
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

  public isNearFloor2Ladder(playerCenterX: number, playerCenterY: number): boolean {
    if (!this.isFloor2Unlocked) return false;
    const lx = this.floor2LadderX + 16;
    const ly = this.floor2LadderY + 16;
    return Math.hypot(lx - playerCenterX, ly - playerCenterY) < 36;
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 4;
  }

  private isWallFacingFloor(tx: number, ty: number): boolean {
    if (ty + 1 >= this.height) return false;
    const below = this.tiles[ty + 1][tx];
    return below !== DungeonTileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === DungeonTileType.WALL;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;

    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // 1. Render Base Tiles (Floors, 3D Walls, Pools, Pillars)
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.tiles[y][x];
        const px = x * ts;
        const py = y * ts;
        this.drawTile(ctx, tile, px, py, ts, x, y);

        // Render Royal Velvet Carpet down the Great Hall & South Corridor (x = 20)
        if (x === 20 && y >= 16 && y <= 34 && tile !== DungeonTileType.WALL) {
          drawRoyalCarpet(ctx, px, py, ts, y === 16, y === 34);
        }
      }
    }

    // 2. Render Boss Arena King Slime Runic Mandala (Center of Abyssal Altar, x: 20, y: 5)
    const mandalaX = 20 * ts + 16;
    const mandalaY = 5 * ts + 16;
    if (
      mandalaX >= camera.x - 60 && mandalaX <= camera.x + camera.viewportWidth + 60 &&
      mandalaY >= camera.y - 60 && mandalaY <= camera.y + camera.viewportHeight + 60
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 36, this.animTimer, '#06b6d4', '#a855f7', '👑');
    }

    // 3. Render Wall Torches with 3D bracket & animated 3-layer flame
    for (const t of this.torches) {
      const tx = t.x * ts;
      const ty = t.y * ts;
      if (
        tx >= camera.x - ts && tx <= camera.x + camera.viewportWidth + ts &&
        ty >= camera.y - ts && ty <= camera.y + camera.viewportHeight + ts
      ) {
        drawWallTorch3D(ctx, tx + 13, ty + 12, this.animTimer);
      }
    }

    // 4. Render Staircase Down to Floor 2 if unlocked
    if (this.isFloor2Unlocked) {
      const sx = this.floor2LadderX;
      const sy = this.floor2LadderY;
      ctx.save();
      // Chiseled stairwell opening
      ctx.fillStyle = '#020617';
      ctx.fillRect(sx, sy, ts, ts);

      // Descending stone treads
      for (let s = 0; s < 5; s++) {
        const treadY = sy + 4 + s * 5;
        const treadW = ts - 6 - s * 3;
        ctx.fillStyle = s % 2 === 0 ? '#334155' : '#475569';
        ctx.fillRect(sx + 3 + (s * 1.5), treadY, treadW, 3.5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx + 3 + (s * 1.5), treadY + 3.5, treadW, 1.5);
      }

      // Glowing violet ancient runic frame
      const pulse = Math.sin(this.animTimer * 4) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(192, 132, 252, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);

      // Floor 2 portal glyph beacon
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0abfc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 4;
      ctx.fillText('▼ KE LANTAI 2', sx + 16, sy - 5);
      ctx.restore();
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
        drawDungeonFloor(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          FLOOR1_THEME,
          this.animTimer,
          this.hasNorthWall(tileX, tileY)
        );
        break;
      }
      case DungeonTileType.CRACKED: {
        // Ancient cracked flagstone with glowing cyan subterranean rune line
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR1_THEME, this.animTimer, this.hasNorthWall(tileX, tileY));
        const hash = tileHash(tileX, tileY);

        ctx.save();
        // Cyan abyssal rune line
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 6);
        ctx.lineTo(x + 14 + (hash * 4), y + 15);
        ctx.lineTo(x + 20, y + 26);
        ctx.stroke();

        // Runic glyph dot
        ctx.fillStyle = '#a5f3fc';
        ctx.fillRect(x + 14 + (hash * 4), y + 15, 3, 3);
        ctx.restore();
        break;
      }
      case DungeonTileType.WALL: {
        drawDungeonWall3D(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          this.isWallFacingFloor(tileX, tileY),
          FLOOR1_THEME
        );
        break;
      }
      case DungeonTileType.PILLAR: {
        // Floor underneath
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR1_THEME, this.animTimer, false);

        // Ancient Chiseled Stone Pillar
        // Base Plinth
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 3, y + 21, size - 6, 9);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 5, y + 22, size - 10, 2);

        // Pillar Shaft (Fluted Stone Column)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 5, y + 6, size - 10, 16);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 7, y + 6, 4, 16); // Left highlight flute
        ctx.fillRect(x + 17, y + 6, 4, 16); // Right shadow flute
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 8, y + 6, 2, 16);

        // Glowing Turquoise Rune Band around center
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(x + 5, y + 13, size - 10, 3);
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(x + 8, y + 14, size - 16, 1);

        // Pillar Capital (Top Block)
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 3, y + 2, size - 6, 5);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 4, y + 2, size - 8, 1.5);
        break;
      }
      case DungeonTileType.LAVA: {
        // Subterranean Glowing Cyan Mineral Spring / Crystal Pool
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, size, size);

        // Water Basin
        const ripple = Math.sin(this.animTimer * 2.5 + tileX * 2 + tileY * 2) * 2;
        ctx.fillStyle = '#0e7490'; // Deep cyan
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

        // Liquid Center
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(x + 3, y + 3, size - 6, size - 6);

        // Shimmering Caustics wave
        ctx.fillStyle = 'rgba(165, 243, 252, 0.45)';
        ctx.fillRect(x + 4, y + 6 + ripple, size - 8, 3.5);

        // Floating Crystal Geode Bubbles
        const bubbleX = x + 10 + Math.sin(this.animTimer * 2 + tileX) * 5;
        const bubbleY = y + 12 + Math.cos(this.animTimer * 2 + tileY) * 4;
        ctx.fillStyle = '#cffafe';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bubbleX - 1, bubbleY - 1, 1.5, 1.5);

        // Basin stone rim
        ctx.strokeStyle = '#164e63';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        break;
      }
      case DungeonTileType.LADDER_EXIT: {
        // Floor underneath
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR1_THEME, this.animTimer, false);

        // Skylight shaft cutting down from ancient opening
        const shaftGrad = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 16);
        shaftGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
        shaftGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.12)');
        shaftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 16, 0, Math.PI * 2);
        ctx.fill();

        // Sturdy Oak Ladder with Iron Corner Braces
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 7, y + 1, 3.5, size - 2);
        ctx.fillRect(x + 21.5, y + 1, 3.5, size - 2);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x + 7.5, y + 1, 1.5, size - 2); // Highlight beam

        // Iron Rungs
        for (let ry = 5; ry < size - 3; ry += 5.5) {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(x + 8, y + ry, 15, 2.5);
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 7, y + ry - 0.5, 2, 3.5);
          ctx.fillRect(x + 22, y + ry - 0.5, 2, 3.5);
        }

        // Exit Label indicator
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('▲ Ke Desa', x + 16, y - 4);
        break;
      }
    }
  }

  /**
   * High-End Atmospheric Lighting Engine:
   * Uses an offscreen composite buffer with 'destination-out' to punch crisp, smooth
   * radial light holes in the subterranean darkness, followed by soft warm color halos.
   */
  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    const screenW = camera.viewportWidth;
    const screenH = camera.viewportHeight;

    // 1. Begin offscreen darkness mask
    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(3, 7, 18, 0.65)');
    if (offCtx) {
      // Punch Player Lantern Light Aperture
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 125, 0.98);

      // Punch Wall Torch Apertures
      for (const t of this.torches) {
        const tx = t.x * this.tileSize + 16 - camera.x;
        const ty = t.y * this.tileSize + 12 - camera.y;
        if (tx >= -80 && tx <= screenW + 80 && ty >= -80 && ty <= screenH + 80) {
          const flicker = Math.sin(this.animTimer * 5 + t.x) * 4;
          DungeonLightingEngine.punchLight(tx, ty, 8, 68 + flicker, 0.94);
        }
      }

      // Punch Mineral Spring Pool Aperture in Crystal Cavern
      const poolX = 33 * this.tileSize + 16 - camera.x;
      const poolY = 20 * this.tileSize + 16 - camera.y;
      if (poolX >= -80 && poolX <= screenW + 80 && poolY >= -80 && poolY <= screenH + 80) {
        DungeonLightingEngine.punchLight(poolX, poolY, 20, 80, 0.82);
      }

      // Punch Floor 2 Ladder if unlocked
      if (this.isFloor2Unlocked) {
        const sx = this.floor2LadderX + 16 - camera.x;
        const sy = this.floor2LadderY + 16 - camera.y;
        if (sx >= -60 && sx <= screenW + 60 && sy >= -60 && sy <= screenH + 60) {
          DungeonLightingEngine.punchLight(sx, sy, 12, 60, 0.9);
        }
      }

      // Punch Boss Altar Mandala core if visible
      const mandalaX = 20 * this.tileSize + 16 - camera.x;
      const mandalaY = 5 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -80 && mandalaX <= screenW + 80 && mandalaY >= -80 && mandalaY <= screenH + 80) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 15, 75, 0.85);
      }

      // 2. Render Darkness Mask over World Context
      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // 3. Ambient Colored Glow Pass (Warm Torch Radiance & Cyan Crystal Pool)
    ctx.save();
    // Warm Player Lantern Halo
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 12, playerCenterX, playerCenterY, 120);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
    pGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.14)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Wall Torch Warm Orange Halos
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 16;
      const ty = t.y * this.tileSize + 12;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 5 + t.x) * 3;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 64 + flicker);
        tGrad.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
        tGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.12)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 64 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Crystal Spring Cyan Halo
    const poolWorldX = 33 * this.tileSize + 16;
    const poolWorldY = 20 * this.tileSize + 16;
    if (
      poolWorldX >= camera.x - 90 && poolWorldX <= camera.x + camera.viewportWidth + 90 &&
      poolWorldY >= camera.y - 90 && poolWorldY <= camera.y + camera.viewportHeight + 90
    ) {
      const cGrad = ctx.createRadialGradient(poolWorldX, poolWorldY, 15, poolWorldX, poolWorldY, 75);
      cGrad.addColorStop(0, 'rgba(103, 232, 249, 0.35)');
      cGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.14)');
      cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(poolWorldX, poolWorldY, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
