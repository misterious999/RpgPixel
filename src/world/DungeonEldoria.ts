import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';
import {
  drawDungeonWall3D,
  drawDungeonFloor,
  drawRoyalCarpet,
  drawBossMandala,
  DungeonLightingEngine,
  DungeonTheme
} from './DungeonVisuals.ts';

export enum EldoriaTileType {
  FLOOR = 0,
  MOSS_STONE = 1,
  WALL = 2,
  ROOT_PILLAR = 3,
  SACRED_WATER = 4,
  LADDER_EXIT = 5
}

const ELDORIA_THEME: DungeonTheme = {
  wallTopBase: '#064e3b',
  wallTopHighlight: '#059669',
  wallTopShadow: '#022c22',
  wallFaceBase: '#022c22',
  wallFaceBrick1: '#064e3b',
  wallFaceBrick2: '#047857',
  wallFaceMortar: '#022c22',
  wallFaceCrack: '#34d399',
  floorTones: ['#064e3b', '#065f46', '#047857', '#022c22'],
  floorMortar: '#012018',
  floorHighlight: '#34d399',
  mossColor: '#10b981',
  puddleColor: 'rgba(52, 211, 153, 0.4)'
};

interface SylvanOrb {
  x: number;
  y: number;
  color: string;
}

export interface BossTelegraph {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
  type: 'circle' | 'line';
}

export class DungeonEldoria {
  public width: number = 36;
  public height: number = 36;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  public tiles: number[][] = [];
  public sylvanOrbs: SylvanOrb[] = [];
  public telegraphs: BossTelegraph[] = [];
  private animTimer: number = 0;

  // Key Coordinates
  public entranceSpawnX: number = 18 * CONSTANTS.TILE_SIZE + 8;
  public entranceSpawnY: number = 32 * CONSTANTS.TILE_SIZE + 4;
  public ladderX: number = 18 * CONSTANTS.TILE_SIZE;
  public ladderY: number = 33 * CONSTANTS.TILE_SIZE;

  constructor() {
    this.generateDungeon();
  }

  private generateDungeon(): void {
    // 1. Initialize all cells as solid WALL
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = EldoriaTileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: EldoriaTileType = EldoriaTileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isMossy = Math.sin(x * 8.3 + y * 9.1) > 0.35;
            this.tiles[y][x] = isMossy ? EldoriaTileType.MOSS_STONE : type;
          }
        }
      }
    };

    // 1. South Entrance Chamber (x: 14..22, y: 30..34)
    carve(14, 30, 22, 34);

    // 2. Central Trunk Hallway (x: 16..20, y: 15..29)
    carve(16, 15, 20, 29);

    // 3. West Bramble Crypt (x: 4..12, y: 18..26)
    carve(4, 18, 12, 26);
    carve(12, 21, 16, 23); // Coridor West

    // 4. East Spore Sanctum (x: 24..32, y: 18..26)
    carve(24, 18, 32, 26);
    carve(20, 21, 24, 23); // Coridor East

    // 5. Sacred Spring Pool in center (x: 17..19, y: 21..23)
    for (let py = 21; py <= 23; py++) {
      for (let px = 17; px <= 19; px++) {
        this.tiles[py][px] = EldoriaTileType.SACRED_WATER;
      }
    }

    // 6. North Grand Sanctum of the Ancient Ent (x: 9..27, y: 4..14)
    carve(9, 4, 27, 14);

    // Giant Root Pillars
    this.tiles[8][13] = EldoriaTileType.ROOT_PILLAR;
    this.tiles[8][23] = EldoriaTileType.ROOT_PILLAR;
    this.tiles[12][13] = EldoriaTileType.ROOT_PILLAR;
    this.tiles[12][23] = EldoriaTileType.ROOT_PILLAR;
    this.tiles[20][7] = EldoriaTileType.ROOT_PILLAR;
    this.tiles[20][29] = EldoriaTileType.ROOT_PILLAR;

    // Ladder back to Desa Eldoria
    this.tiles[33][18] = EldoriaTileType.LADDER_EXIT;

    // Sylvan Glowing Orbs
    this.sylvanOrbs = [
      { x: 15 * this.tileSize, y: 31 * this.tileSize, color: '#34d399' },
      { x: 21 * this.tileSize, y: 31 * this.tileSize, color: '#34d399' },
      { x: 6 * this.tileSize, y: 19 * this.tileSize, color: '#a7f3d0' },
      { x: 30 * this.tileSize, y: 19 * this.tileSize, color: '#a7f3d0' },
      { x: 12 * this.tileSize, y: 6 * this.tileSize, color: '#4ade80' },
      { x: 24 * this.tileSize, y: 6 * this.tileSize, color: '#4ade80' },
      { x: 18 * this.tileSize, y: 4 * this.tileSize, color: '#facc15' }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 3.5;
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tel = this.telegraphs[i];
      tel.timer -= deltaTime;
      if (tel.timer <= 0) {
        this.telegraphs.splice(i, 1);
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

  public isNearLadder(playerCenterX: number, playerCenterY: number): boolean {
    const lx = this.ladderX + 16;
    const ly = this.ladderY + 16;
    return Math.hypot(lx - playerCenterX, ly - playerCenterY) < 36;
  }

  public isNearLadderUp(playerCenterX: number, playerCenterY: number): boolean {
    return this.isNearLadder(playerCenterX, playerCenterY);
  }

  public isTileWater(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
    return this.tiles[ty][tx] === EldoriaTileType.SACRED_WATER;
  }

  public isTileSolid(tx: number, ty: number, canSwim: boolean = false): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    if (t === EldoriaTileType.SACRED_WATER) {
      // Jika canSwim=true, air suci bisa direnangi
      return !canSwim;
    }
    return t === EldoriaTileType.WALL || t === EldoriaTileType.ROOT_PILLAR;
  }

  public checkCollision(rect: { x: number; y: number; width: number; height: number }, canSwim: boolean = false): boolean {
    const leftTile = Math.floor(rect.x / this.tileSize);
    const rightTile = Math.floor((rect.x + rect.width - 0.01) / this.tileSize);
    const topTile = Math.floor(rect.y / this.tileSize);
    const bottomTile = Math.floor((rect.y + rect.height - 0.01) / this.tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isTileSolid(tx, ty, canSwim)) {
          return true;
        }
      }
    }
    return false;
  }

  private isWallFacingFloor(tx: number, ty: number): boolean {
    if (ty + 1 >= this.height) return false;
    const below = this.tiles[ty + 1][tx];
    return below !== EldoriaTileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === EldoriaTileType.WALL;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // 1. Render Base Map Tiles
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.tiles[y][x];
        const px = x * ts;
        const py = y * ts;
        this.renderTile(ctx, tile, px, py, ts, x, y);

        // Render Sylvan Floral Path in Central Trunk Corridor (x = 18)
        if (x === 18 && y >= 15 && y <= 29 && tile !== EldoriaTileType.WALL && tile !== EldoriaTileType.SACRED_WATER) {
          drawRoyalCarpet(ctx, px, py, ts, y === 15, y === 29);
        }
      }
    }

    // 2. Render Boss Arena Ancient Ent Mandala in North Sanctum (x: 18, y: 9)
    const mandalaX = 18 * ts + 16;
    const mandalaY = 9 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 44, this.animTimer, '#34d399', '#facc15', '🌳');
    }

    // 3. Render Sylvan Glowing Orbs with bobbing motion, layered halos, and fairy sparks
    for (const orb of this.sylvanOrbs) {
      const bob = Math.sin(this.animTimer * 4 + orb.x) * 3.5;
      const ox = orb.x + 16;
      const oy = orb.y + 16 + bob;

      if (
        ox >= camera.x - 40 && ox <= camera.x + camera.viewportWidth + 40 &&
        oy >= camera.y - 40 && oy <= camera.y + camera.viewportHeight + 40
      ) {
        ctx.save();
        // Outer soft halo
        const oGrad = ctx.createRadialGradient(ox, oy, 2, ox, oy, 14);
        oGrad.addColorStop(0, orb.color);
        oGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.35)');
        oGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Core orb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Trailing fairy dust spark
        const sparkY = oy - 8 - ((this.animTimer * 12 + orb.x) % 8);
        ctx.fillStyle = '#a7f3d0';
        ctx.fillRect(ox - 1, sparkY, 1.5, 1.5);
        ctx.restore();
      }
    }

    // 4. Render Boss Danger Telegraphs (Nature Briar / Sylvan Burst)
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      grad.addColorStop(0, 'rgba(74, 222, 128, 0.7)');
      grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      if (Math.sin(this.animTimer * 14) > 0) {
        ctx.fillStyle = '#bbf7d0';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌿', tel.x, tel.y);
      }
      ctx.restore();
    }
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    tile: EldoriaTileType,
    px: number,
    py: number,
    ts: number,
    x: number,
    y: number
  ): void {
    switch (tile) {
      case EldoriaTileType.WALL:
        drawDungeonWall3D(
          ctx,
          px,
          py,
          ts,
          x,
          y,
          this.isWallFacingFloor(x, y),
          ELDORIA_THEME
        );
        break;

      case EldoriaTileType.FLOOR:
        drawDungeonFloor(
          ctx,
          px,
          py,
          ts,
          x,
          y,
          ELDORIA_THEME,
          this.animTimer,
          this.hasNorthWall(x, y)
        );
        break;

      case EldoriaTileType.MOSS_STONE: {
        drawDungeonFloor(ctx, px, py, ts, x, y, ELDORIA_THEME, this.animTimer, this.hasNorthWall(x, y));
        // Overgrown sylvan moss patches with tiny blooming flowers
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 4, py + 5, 8, 7);
        ctx.fillRect(px + 16, py + 16, 10, 8);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(px + 6, py + 7, 4, 3);
        ctx.fillRect(px + 18, py + 18, 5, 4);

        // Tiny blooming white/gold sylvan flowers
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 5, py + 6, 2, 2);
        ctx.fillRect(px + 23, py + 17, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 10, py + 10, 2, 2);
        break;
      }

      case EldoriaTileType.ROOT_PILLAR: {
        drawDungeonFloor(ctx, px, py, ts, x, y, ELDORIA_THEME, this.animTimer, false);
        // Colossal Living Tree of Life Root Column
        // Base roots spreading into floor
        ctx.fillStyle = '#271003';
        ctx.beginPath();
        ctx.roundRect(px + 2, py + 20, ts - 4, 10, 4);
        ctx.fill();

        // Gnarled Tree Trunk
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.roundRect(px + 5, py + 4, ts - 10, 18, 5);
        ctx.fill();

        // Bark highlights & wood grain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 7, py + 5, 3.5, 16);
        ctx.fillRect(px + 17, py + 5, 3, 16);

        // Climbing Ivy & Bioluminescent Moss
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(px + 6, py + 8, 6, 4);
        ctx.fillRect(px + 16, py + 14, 7, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 8, py + 9, 3, 2);

        // Glowing Sylvan Spore Node in trunk
        const sporePulse = Math.sin(this.animTimer * 4 + x + y) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(110, 231, 183, ${sporePulse})`;
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + 13, 3, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Root Capital (Top)
        ctx.fillStyle = '#271003';
        ctx.fillRect(px + 3, py + 2, ts - 6, 4);
        break;
      }

      case EldoriaTileType.SACRED_WATER: {
        // Pure Crystal-Clear Sacred Spring Pool
        ctx.fillStyle = '#022c22';
        ctx.fillRect(px, py, ts, ts);

        // Deep aquatic basin
        const ripple = Math.sin(this.animTimer * 2.5 + x * 2 + y * 2) * 2;
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);

        // Radiant crystal turquoise water
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(px + 2, py + 3, ts - 4, ts - 6);

        // Shimmering caustics
        ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.fillRect(px + 4, py + 6 + ripple, ts - 8, 3.5);

        // Floating Green Water Lily Pad with Lotus Blossom
        const padX = px + 10 + Math.sin(this.animTimer + x) * 3;
        const padY = py + 12 + Math.cos(this.animTimer + y) * 2;
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(padX, padY, 4.5, 0, Math.PI * 1.8);
        ctx.fill();

        // Pink Lotus Blossom in center of lily pad
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(padX - 1, padY - 1, 2.5, 2.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX - 0.5, padY - 0.5, 1.5, 1.5);

        // Stone edge border
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
        break;
      }

      case EldoriaTileType.LADDER_EXIT: {
        drawDungeonFloor(ctx, px, py, ts, x, y, ELDORIA_THEME, this.animTimer, false);

        // Sunbeam ray cutting down through canopy
        const beamGrad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 16);
        beamGrad.addColorStop(0, 'rgba(167, 243, 208, 0.45)');
        beamGrad.addColorStop(0.7, 'rgba(52, 211, 153, 0.15)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(px + 16, py + 16, 16, 0, Math.PI * 2);
        ctx.fill();

        // Living Vine Ladder with Wood Rungs
        ctx.fillStyle = '#14532d'; // Thick green vine side ropes
        ctx.fillRect(px + 7, py + 1, 3.5, ts - 2);
        ctx.fillRect(px + 21.5, py + 1, 3.5, ts - 2);

        // Wooden Rungs with small leaf buds
        for (let ry = 5; ry < ts - 3; ry += 5.5) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px + 8, py + ry, 15, 2.5);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px + 6, py + ry - 1, 2, 2); // Leaf bud
        }

        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#86efac';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 4;
        ctx.fillText('▲ Ke Desa', px + 16, py - 4);
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

    // 1. Begin offscreen sylvan deep emerald ambient darkness
    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(1, 23, 16, 0.68)');
    if (offCtx) {
      // Punch Player Sylvan Aura Aperture
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 125, 0.98);

      // Punch Sylvan Orbs light apertures
      for (const orb of this.sylvanOrbs) {
        const ox = orb.x + 16 - camera.x;
        const oy = orb.y + 16 - camera.y;
        if (ox >= -80 && ox <= screenW + 80 && oy >= -80 && oy <= screenH + 80) {
          DungeonLightingEngine.punchLight(ox, oy, 10, 75, 0.95);
        }
      }

      // Punch Sacred Spring Pool in Center
      const poolX = 18 * this.tileSize + 16 - camera.x;
      const poolY = 22 * this.tileSize + 16 - camera.y;
      if (poolX >= -80 && poolX <= screenW + 80 && poolY >= -80 && poolY <= screenH + 80) {
        DungeonLightingEngine.punchLight(poolX, poolY, 16, 80, 0.88);
      }

      // Punch Ancient Ent Mandala in North Sanctum
      const mandalaX = 18 * this.tileSize + 16 - camera.x;
      const mandalaY = 9 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -90 && mandalaX <= screenW + 90 && mandalaY >= -90 && mandalaY <= screenH + 90) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 18, 90, 0.92);
      }

      // Punch Exit Ladder
      const lx = this.ladderX + 16 - camera.x;
      const ly = this.ladderY + 16 - camera.y;
      if (lx >= -60 && lx <= screenW + 60 && ly >= -60 && ly <= screenH + 60) {
        DungeonLightingEngine.punchLight(lx, ly, 12, 65, 0.9);
      }

      // 2. Render Darkness Mask over World Context
      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // 3. Ambient Sylvan Glow Pass (Mint & Gold Orbs & Shimmering Waters)
    ctx.save();
    // Warm Player Sylvan Halo
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 120);
    pGrad.addColorStop(0, 'rgba(167, 243, 208, 0.35)');
    pGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.15)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Sylvan Orbs Colored Halos
    for (const orb of this.sylvanOrbs) {
      const ox = orb.x + 16;
      const oy = orb.y + 16;
      if (
        ox >= camera.x - 80 && ox <= camera.x + camera.viewportWidth + 80 &&
        oy >= camera.y - 80 && oy <= camera.y + camera.viewportHeight + 80
      ) {
        const oGrad = ctx.createRadialGradient(ox, oy, 6, ox, oy, 72);
        oGrad.addColorStop(0, 'rgba(167, 243, 208, 0.38)');
        oGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.15)');
        oGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, 72, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
