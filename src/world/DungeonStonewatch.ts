import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';
import {
  drawDungeonWall3D,
  drawDungeonFloor,
  drawBossMandala,
  drawWallTorch3D,
  DungeonLightingEngine,
  DungeonTheme
} from './DungeonVisuals.ts';

export enum StonewatchTileType {
  FLOOR = 0,
  BASALT = 1,
  WALL = 2,
  MINE_BEAM = 3,
  MOLTEN_ORE = 4,
  LADDER_EXIT = 5,
  RAIL = 6
}

const STONEWATCH_THEME: DungeonTheme = {
  wallTopBase: '#1e1b4b',
  wallTopHighlight: '#475569',
  wallTopShadow: '#090d16',
  wallFaceBase: '#0b0f19',
  wallFaceBrick1: '#1e293b',
  wallFaceBrick2: '#334155',
  wallFaceMortar: '#090d16',
  wallFaceCrack: '#38bdf8',
  floorTones: ['#1e293b', '#293548', '#18202c', '#334155'],
  floorMortar: '#0b0f19',
  floorHighlight: '#64748b',
  mossColor: '#1e3a8a',
  puddleColor: 'rgba(56, 189, 248, 0.35)'
};

interface MineTorch {
  x: number;
  y: number;
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

export class DungeonStonewatch {
  public width: number = 36;
  public height: number = 36;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  public tiles: number[][] = [];
  public torches: MineTorch[] = [];
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
        this.tiles[y][x] = StonewatchTileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: StonewatchTileType = StonewatchTileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isBasalt = Math.sin(x * 6.7 + y * 8.3) > 0.4;
            this.tiles[y][x] = isBasalt ? StonewatchTileType.BASALT : type;
          }
        }
      }
    };

    // 1. South Mine Entrance Shaft (x: 14..22, y: 30..34)
    carve(14, 30, 22, 34);

    // 2. Central Rail Corridor (x: 16..20, y: 15..29)
    carve(16, 15, 20, 29);

    // Minecart Rail down the center (x: 18, y: 16..30)
    for (let ry = 16; ry <= 30; ry++) {
      this.tiles[ry][18] = StonewatchTileType.RAIL;
    }

    // 3. West Crystal Ore Quarry (x: 4..12, y: 18..26)
    carve(4, 18, 12, 26);
    carve(12, 21, 16, 23);

    // 4. East Smelting Forge Vault (x: 24..32, y: 18..26)
    carve(24, 18, 32, 26);
    carve(20, 21, 24, 23);

    // Molten Ore Pool in East Forge
    for (let my = 21; my <= 23; my++) {
      for (let mx = 27; mx <= 29; mx++) {
        this.tiles[my][mx] = StonewatchTileType.MOLTEN_ORE;
      }
    }

    // 5. North Obsidian Behemoth Throne Chamber (x: 9..27, y: 4..14)
    carve(9, 4, 27, 14);

    // Mine Support Beams
    this.tiles[8][13] = StonewatchTileType.MINE_BEAM;
    this.tiles[8][23] = StonewatchTileType.MINE_BEAM;
    this.tiles[12][13] = StonewatchTileType.MINE_BEAM;
    this.tiles[12][23] = StonewatchTileType.MINE_BEAM;
    this.tiles[20][7] = StonewatchTileType.MINE_BEAM;
    this.tiles[20][29] = StonewatchTileType.MINE_BEAM;

    // Ladder back to Desa Stonewatch
    this.tiles[33][18] = StonewatchTileType.LADDER_EXIT;

    // Mine Torches / Lanterns
    this.torches = [
      { x: 15 * this.tileSize, y: 31 * this.tileSize },
      { x: 21 * this.tileSize, y: 31 * this.tileSize },
      { x: 6 * this.tileSize, y: 19 * this.tileSize },
      { x: 30 * this.tileSize, y: 19 * this.tileSize },
      { x: 11 * this.tileSize, y: 6 * this.tileSize },
      { x: 25 * this.tileSize, y: 6 * this.tileSize },
      { x: 18 * this.tileSize, y: 5 * this.tileSize }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 4;
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

  public isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === StonewatchTileType.WALL || t === StonewatchTileType.MINE_BEAM || t === StonewatchTileType.MOLTEN_ORE;
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
    return below !== StonewatchTileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === StonewatchTileType.WALL;
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
      }
    }

    // 2. Render Boss Arena Dwarven Forge Mandala in North Chamber (x: 18, y: 9)
    const mandalaX = 18 * ts + 16;
    const mandalaY = 9 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 44, this.animTimer, '#f59e0b', '#38bdf8', '⚒️');
    }

    // 3. Render Torches / Mining Lanterns
    for (const torch of this.torches) {
      if (
        torch.x >= camera.x - ts && torch.x <= camera.x + camera.viewportWidth + ts &&
        torch.y >= camera.y - ts && torch.y <= camera.y + camera.viewportHeight + ts
      ) {
        drawWallTorch3D(ctx, torch.x + 13, torch.y + 12, this.animTimer, ['#d97706', '#f59e0b', '#fef08a']);
      }
    }

    // 4. Render Boss Danger Telegraphs (Quake / Magma slam)
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.7)');
      grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      if (Math.sin(this.animTimer * 14) > 0) {
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚒️', tel.x, tel.y);
      }
      ctx.restore();
    }
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    tile: StonewatchTileType,
    px: number,
    py: number,
    ts: number,
    x: number,
    y: number
  ): void {
    switch (tile) {
      case StonewatchTileType.WALL: {
        drawDungeonWall3D(
          ctx,
          px,
          py,
          ts,
          x,
          y,
          this.isWallFacingFloor(x, y),
          STONEWATCH_THEME
        );

        // Cyan Mana Crystal Geode clusters embedded in walls
        if ((x * 7 + y * 13) % 4 === 0) {
          const sparkle = Math.sin(this.animTimer * 3 + x + y) * 0.3 + 0.7;
          ctx.save();
          ctx.fillStyle = `rgba(56, 189, 248, ${sparkle})`;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4;
          // Crystal clusters
          ctx.fillRect(px + 10, py + 12, 4, 7);
          ctx.fillRect(px + 17, py + 14, 3, 5);
          ctx.fillRect(px + 12, py + 19, 5, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 11, py + 13, 1.5, 2);
          ctx.restore();
        }
        break;
      }

      case StonewatchTileType.FLOOR:
        drawDungeonFloor(
          ctx,
          px,
          py,
          ts,
          x,
          y,
          STONEWATCH_THEME,
          this.animTimer,
          this.hasNorthWall(x, y)
        );
        break;

      case StonewatchTileType.BASALT: {
        drawDungeonFloor(ctx, px, py, ts, x, y, STONEWATCH_THEME, this.animTimer, this.hasNorthWall(x, y));
        // Heavy volcanic basalt block pavers
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 3, py + 3, ts - 6, ts - 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 4, py + 4, ts - 8, 2);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 4, py + ts - 6, ts - 8, 2);
        break;
      }

      case StonewatchTileType.RAIL: {
        drawDungeonFloor(ctx, px, py, ts, x, y, STONEWATCH_THEME, this.animTimer, false);

        // Realistic Dwarven Minecart Railroad Tracks
        // 1. Weathered Oak Timber Sleepers (Ties)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 3, py + 3, ts - 6, 5);
        ctx.fillRect(px + 3, py + 13, ts - 6, 5);
        ctx.fillRect(px + 3, py + 23, ts - 6, 5);

        // Timber highlights & grain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 4, py + 4, ts - 8, 2);
        ctx.fillRect(px + 4, py + 14, ts - 8, 2);
        ctx.fillRect(px + 4, py + 24, ts - 8, 2);

        // 2. Cast Iron Tie Plates & Spikes
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 6, py + 3, 6, 5);
        ctx.fillRect(px + ts - 12, py + 3, 6, 5);
        ctx.fillRect(px + 6, py + 13, 6, 5);
        ctx.fillRect(px + ts - 12, py + 13, 6, 5);
        ctx.fillRect(px + 6, py + 23, 6, 5);
        ctx.fillRect(px + ts - 12, py + 23, 6, 5);

        // 3. Heavy Iron Rails (Left & Right)
        // Rail Base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 7.5, py, 3, ts);
        ctx.fillRect(px + ts - 10.5, py, 3, ts);

        // Rail Crown (Steel Top)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 8, py, 2, ts);
        ctx.fillRect(px + ts - 10, py, 2, ts);

        // Specular highlight gleam on polished rail head
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(px + 8.5, py, 1, ts);
        ctx.fillRect(px + ts - 9.5, py, 1, ts);
        break;
      }

      case StonewatchTileType.MINE_BEAM: {
        drawDungeonFloor(ctx, px, py, ts, x, y, STONEWATCH_THEME, this.animTimer, false);

        // Heavy Dwarven Timber Post Support Trestle
        // Base Plinth
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 3, py + 21, ts - 6, 9);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 4, py + 22, ts - 8, 2);

        // Square Dark Oak Timber Pillar
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 5, py + 4, ts - 10, 18);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 6, py + 5, 3.5, 16); // Highlight edge

        // Forged Cast-Iron Reinforcement Bands & Corner Plates
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 4, py + 7, ts - 8, 3.5);
        ctx.fillRect(px + 4, py + 16, ts - 8, 3.5);

        // Iron Rivets
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 5, py + 8, 1.5, 1.5);
        ctx.fillRect(px + ts - 6.5, py + 8, 1.5, 1.5);
        ctx.fillRect(px + 5, py + 17, 1.5, 1.5);
        ctx.fillRect(px + ts - 6.5, py + 17, 1.5, 1.5);

        // Timber Header Beam (Top)
        ctx.fillStyle = '#271003';
        ctx.fillRect(px + 3, py + 2, ts - 6, 4);
        break;
      }

      case StonewatchTileType.MOLTEN_ORE: {
        // East Smelting Forge Vault - Molten Bronze / Gold Flow
        ctx.fillStyle = '#1c0a00';
        ctx.fillRect(px, py, ts, ts);

        const flow = Math.sin(this.animTimer * 3 + x * 2 + y * 2) * 2;
        ctx.fillStyle = '#c2410c'; // Deep molten rust
        ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);

        // Liquid bronze center
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(px + 3, py + 3 + flow, ts - 6, ts - 6);

        // Blazing molten gold surface
        ctx.fillStyle = '#fde047';
        ctx.fillRect(px + 6, py + 6 + flow * 0.5, ts - 12, 4);

        // Sparkling molten bubble
        const bubble = Math.sin(this.animTimer * 5 + x) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 14 + bubble, py + 14, 2, 2);

        // Iron canal rim
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
        break;
      }

      case StonewatchTileType.LADDER_EXIT: {
        drawDungeonFloor(ctx, px, py, ts, x, y, STONEWATCH_THEME, this.animTimer, false);

        // Shaft Skylight Beam
        const beamGrad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 16);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
        beamGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.12)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(px + 16, py + 16, 16, 0, Math.PI * 2);
        ctx.fill();

        // Heavy Iron Mine Cage Ladder
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 7, py + 1, 3.5, ts - 2);
        ctx.fillRect(px + 21.5, py + 1, 3.5, ts - 2);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 7.5, py + 1, 1.5, ts - 2);

        // Steel Rungs & Riveted Side Brackets
        for (let ry = 5; ry < ts - 3; ry += 5.5) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(px + 8, py + ry, 15, 2.5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px + 8, py + ry, 15, 1);
        }

        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde68a';
        ctx.shadowColor = '#f59e0b';
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

    // 1. Begin offscreen subterranean mine shaft darkness
    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(11, 15, 25, 0.72)');
    if (offCtx) {
      // Punch Player Lantern Aperture
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 120, 0.98);

      // Punch Mining Lanterns
      for (const torch of this.torches) {
        const tx = torch.x + 16 - camera.x;
        const ty = torch.y + 12 - camera.y;
        if (tx >= -80 && tx <= screenW + 80 && ty >= -80 && ty <= screenH + 80) {
          const flicker = Math.sin(this.animTimer * 5 + torch.x) * 4;
          DungeonLightingEngine.punchLight(tx, ty, 8, 72 + flicker, 0.95);
        }
      }

      // Punch Molten Ore Smelting Pool in East Forge
      const forgeX = 28 * this.tileSize + 16 - camera.x;
      const forgeY = 22 * this.tileSize + 16 - camera.y;
      if (forgeX >= -80 && forgeX <= screenW + 80 && forgeY >= -80 && forgeY <= screenH + 80) {
        DungeonLightingEngine.punchLight(forgeX, forgeY, 18, 85, 0.9);
      }

      // Punch Dwarven Forge Mandala in North Chamber
      const mandalaX = 18 * this.tileSize + 16 - camera.x;
      const mandalaY = 9 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -90 && mandalaX <= screenW + 90 && mandalaY >= -90 && mandalaY <= screenH + 90) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 18, 90, 0.92);
      }

      // Punch Exit Ladder Shaft
      const lx = this.ladderX + 16 - camera.x;
      const ly = this.ladderY + 16 - camera.y;
      if (lx >= -60 && lx <= screenW + 60 && ly >= -60 && ly <= screenH + 60) {
        DungeonLightingEngine.punchLight(lx, ly, 12, 65, 0.9);
      }

      // 2. Render Darkness Mask over World Context
      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // 3. Ambient Colored Glow Pass (Warm Golden Lanterns & Cyan Mana Crystals)
    ctx.save();
    // Warm Player Lantern Halo
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 12, playerCenterX, playerCenterY, 115);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
    pGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.14)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 115, 0, Math.PI * 2);
    ctx.fill();

    // Mine Lantern Warm Gold Halos
    for (const torch of this.torches) {
      const tx = torch.x + 16;
      const ty = torch.y + 12;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 5 + torch.x) * 4;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 68 + flicker);
        tGrad.addColorStop(0, 'rgba(254, 240, 138, 0.36)');
        tGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)');
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
