import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';
import {
  drawDungeonWall3D,
  drawDungeonFloor,
  drawRoyalCarpet,
  drawBossMandala,
  drawWallTorch3D,
  DungeonLightingEngine,
  DungeonTheme
} from './DungeonVisuals.ts';

export enum Floor2TileType {
  FLOOR = 0,
  MOSSY = 1,
  WALL = 2,
  PILLAR = 3,
  RUNIC = 4,
  LADDER_UP = 5
}

const FLOOR2_THEME: DungeonTheme = {
  wallTopBase: '#1e1b4b',
  wallTopHighlight: '#4338ca',
  wallTopShadow: '#090514',
  wallFaceBase: '#0d0b21',
  wallFaceBrick1: '#1e1b4b',
  wallFaceBrick2: '#2e1065',
  wallFaceMortar: '#090514',
  wallFaceCrack: '#c084fc',
  floorTones: ['#1e1b4b', '#18182b', '#251e3e', '#131224'],
  floorMortar: '#090514',
  floorHighlight: '#818cf8',
  mossColor: '#4c1d95',
  puddleColor: 'rgba(76, 29, 149, 0.4)'
};

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

  private isWallFacingFloor(tx: number, ty: number): boolean {
    if (ty + 1 >= this.height) return false;
    const below = this.tiles[ty + 1][tx];
    return below !== Floor2TileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === Floor2TileType.WALL;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // 1. Render Map Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tiles[r][c];
        const x = c * ts;
        const y = r * ts;
        this.renderTile(ctx, tile, x, y, ts, c, r);

        // Render Royal Velvet Runner in South Corridor to Central Hall (c = 20)
        if (c === 20 && r >= 19 && r <= 33 && tile !== Floor2TileType.WALL) {
          drawRoyalCarpet(ctx, x, y, ts, r === 19, r === 33);
        }
      }
    }

    // 2. Render Boss Arena Titan Ley-Line Conduits & Summoning Mandala (North Boss Arena, c: 20, r: 9.5)
    const mandalaX = 20 * ts + 16;
    const mandalaY = 9.5 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      // Draw Ley-Lines from 4 Boss Arena Pillars
      const pillarCoords = [
        { x: 14 * ts + 16, y: 7 * ts + 16 },
        { x: 26 * ts + 16, y: 7 * ts + 16 },
        { x: 14 * ts + 16, y: 12 * ts + 16 },
        { x: 26 * ts + 16, y: 12 * ts + 16 }
      ];
      ctx.save();
      const linePulse = Math.sin(this.animTimer * 3) * 0.25 + 0.6;
      ctx.strokeStyle = `rgba(192, 132, 252, ${linePulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      for (const p of pillarCoords) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mandalaX, mandalaY);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // Draw Grand Rotating Titan Summoning Mandala
      drawBossMandala(ctx, mandalaX, mandalaY, 40, this.animTimer, '#c084fc', '#38bdf8', '⚡');
    }

    // 3. Render Wall Torches (Abyssal Soulflames)
    for (const t of this.torches) {
      const tx = t.x * ts;
      const ty = t.y * ts;
      if (
        tx >= camera.x - ts && tx <= camera.x + camera.viewportWidth + ts &&
        ty >= camera.y - ts && ty <= camera.y + camera.viewportHeight + ts
      ) {
        drawWallTorch3D(ctx, tx + 13, ty + 12, this.animTimer, ['#7c3aed', '#c084fc', '#e0e7ff']);
      }
    }

    // 4. Render Boss Red Telegraph Warning Zones
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();
      // Outer warning ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Filling red danger zone
      const tGrad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      tGrad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      tGrad.addColorStop(0.7, 'rgba(220, 38, 38, 0.35)');
      tGrad.addColorStop(1, 'rgba(153, 27, 27, 0.15)');
      ctx.fillStyle = tGrad;
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

    // 5. Render Floor 3 Infernal Portal if unlocked
    if (this.isFloor3Unlocked) {
      const px = this.floor3PortalX;
      const py = this.floor3PortalY;
      ctx.save();
      // Molten portal pit
      ctx.fillStyle = '#2b0606';
      ctx.fillRect(px, py, ts, ts);

      // Swirling Magma vortex
      const pulse = Math.sin(this.animTimer * 5) * 2;
      const grad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 14 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fde047');
      grad.addColorStop(0.65, '#ea580c');
      grad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 13 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Fiery spikes
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);

      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fdba74';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 4;
      ctx.fillText('▼ KE LANTAI 3', px + 16, py - 4);
      ctx.restore();
    }
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    tile: Floor2TileType,
    x: number,
    y: number,
    size: number,
    tileX: number,
    tileY: number
  ): void {
    switch (tile) {
      case Floor2TileType.FLOOR:
        drawDungeonFloor(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          FLOOR2_THEME,
          this.animTimer,
          this.hasNorthWall(tileX, tileY)
        );
        break;

      case Floor2TileType.MOSSY: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR2_THEME, this.animTimer, this.hasNorthWall(tileX, tileY));
        // Deep purple crypt moss patches
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(x + 4, y + 6, 9, 6);
        ctx.fillRect(x + 16, y + 17, 11, 7);
        ctx.fillStyle = '#6d28d9';
        ctx.fillRect(x + 6, y + 8, 4, 3);
        ctx.fillRect(x + 18, y + 19, 5, 3);
        break;
      }

      case Floor2TileType.WALL:
        drawDungeonWall3D(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          this.isWallFacingFloor(tileX, tileY),
          FLOOR2_THEME
        );
        break;

      case Floor2TileType.PILLAR: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR2_THEME, this.animTimer, false);
        // Crumbling Ancient Crypt Column
        // Base Plinth
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 3, y + 21, size - 6, 9);
        ctx.fillStyle = '#312e81';
        ctx.fillRect(x + 5, y + 22, size - 10, 2);

        // Pillar Shaft
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 5, y + 6, size - 10, 16);
        ctx.fillStyle = '#3730a3';
        ctx.fillRect(x + 7, y + 6, 4, 16);
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(x + 8, y + 6, 2, 16);

        // Glowing Amethyst Rune Band around center
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(x + 5, y + 13, size - 10, 3);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x + 7, y + 14, size - 14, 1);

        // Pillar Capital (Cracked Top)
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(x + 3, y + 2, size - 6, 5);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x + 4, y + 2, size - 8, 1.5);
        break;
      }

      case Floor2TileType.RUNIC: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR2_THEME, this.animTimer, this.hasNorthWall(tileX, tileY));
        // Active Arcane Power Glyph
        ctx.save();
        const pulse = Math.sin(this.animTimer * 4 + tileX + tileY) * 0.25 + 0.75;
        ctx.strokeStyle = `rgba(192, 132, 252, ${pulse})`;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 6;
        ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 4 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(x + size / 2 - 1, y + size / 2 - 1, 2, 2);
        ctx.restore();
        break;
      }

      case Floor2TileType.LADDER_UP: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR2_THEME, this.animTimer, false);

        // Portal beam to Floor 1
        const grad = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 16);
        grad.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
        grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 16, 0, Math.PI * 2);
        ctx.fill();

        // Sturdy Oak Ladder
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 7, y + 1, 3.5, size - 2);
        ctx.fillRect(x + 21.5, y + 1, 3.5, size - 2);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x + 7.5, y + 1, 1.5, size - 2);

        for (let ry = 5; ry < size - 3; ry += 5.5) {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(x + 8, y + ry, 15, 2.5);
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 7, y + ry - 0.5, 2, 3.5);
          ctx.fillRect(x + 22, y + ry - 0.5, 2, 3.5);
        }

        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e879f9';
        ctx.fillText('▲ Ke Lt.1', x + 16, y - 4);
        break;
      }
    }
  }

  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    const screenW = camera.viewportWidth;
    const screenH = camera.viewportHeight;

    // 1. Begin offscreen abyssal darkness mask
    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(2, 6, 23, 0.72)');
    if (offCtx) {
      // Punch Player Light
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 120, 0.98);

      // Punch Purple Soulflame Torches
      for (const t of this.torches) {
        const tx = t.x * this.tileSize + 16 - camera.x;
        const ty = t.y * this.tileSize + 16 - camera.y;
        if (tx >= -80 && tx <= screenW + 80 && ty >= -80 && ty <= screenH + 80) {
          const flicker = Math.sin(this.animTimer * 5 + t.x) * 4;
          DungeonLightingEngine.punchLight(tx, ty, 8, 70 + flicker, 0.95);
        }
      }

      // Punch Boss Summoning Mandala in North Arena
      const mandalaX = 20 * this.tileSize + 16 - camera.x;
      const mandalaY = 9.5 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -90 && mandalaX <= screenW + 90 && mandalaY >= -90 && mandalaY <= screenH + 90) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 18, 85, 0.9);
      }

      // Punch Floor 3 Portal if unlocked
      if (this.isFloor3Unlocked) {
        const px = this.floor3PortalX + 16 - camera.x;
        const py = this.floor3PortalY + 16 - camera.y;
        if (px >= -60 && px <= screenW + 60 && py >= -60 && py <= screenH + 60) {
          DungeonLightingEngine.punchLight(px, py, 12, 65, 0.92);
        }
      }

      // 2. Render Darkness Mask over World Context
      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // 3. Ambient Colored Glow Pass (Mystic Violet Soulflames & Warm Player Lantern)
    ctx.save();
    // Warm Player Lantern Halo
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 12, playerCenterX, playerCenterY, 115);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.3)');
    pGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 115, 0, Math.PI * 2);
    ctx.fill();

    // Ancient Purple Torch Radiance
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 16;
      const ty = t.y * this.tileSize + 16;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 5 + t.x) * 4;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 68 + flicker);
        tGrad.addColorStop(0, 'rgba(232, 121, 249, 0.35)');
        tGrad.addColorStop(0.55, 'rgba(168, 85, 247, 0.16)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 68 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
