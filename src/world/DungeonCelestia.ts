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

export enum CelestiaDungeonTileType {
  FLOOR = 0,
  AMETHYST_FLOOR = 1,
  WALL = 2,
  CRYSTAL_CLUSTER = 3,
  MANA_POOL = 4,
  LADDER_EXIT = 5
}

const CELESTIA_THEME: DungeonTheme = {
  wallTopBase: '#3b0764',
  wallTopHighlight: '#9333ea',
  wallTopShadow: '#1e1b4b',
  wallFaceBase: '#1e1b4b',
  wallFaceBrick1: '#4c1d95',
  wallFaceBrick2: '#6d28d9',
  wallFaceMortar: '#0f172a',
  wallFaceCrack: '#38bdf8',
  floorTones: ['#4c1d95', '#3b0764', '#2e1065', '#1e1b4b'],
  floorMortar: '#0f172a',
  floorHighlight: '#c084fc',
  mossColor: '#a855f7',
  puddleColor: 'rgba(56, 189, 248, 0.35)'
};

interface AstralOrb {
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

export class DungeonCelestia {
  public width: number = 36;
  public height: number = 36;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  public tiles: number[][] = [];
  public astralOrbs: AstralOrb[] = [];
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
    // 1. Inisialisasi seluruh sel sebagai WALL padat
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = CelestiaDungeonTileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: CelestiaDungeonTileType = CelestiaDungeonTileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isAmethyst = Math.sin(x * 7.1 + y * 8.3) > 0.38;
            this.tiles[y][x] = isAmethyst ? CelestiaDungeonTileType.AMETHYST_FLOOR : type;
          }
        }
      }
    };

    // 1. Gerbang Masuk Kristal Selatan (x: 14..22, y: 30..34)
    carve(14, 30, 22, 34);

    // 2. Koridor Astral Tengah (x: 16..20, y: 15..29)
    carve(16, 15, 20, 29);

    // 3. Goa Geode Ametis Barat (x: 4..12, y: 18..26)
    carve(4, 18, 12, 26);
    carve(12, 21, 16, 23); // Koridor barat

    // 4. Labirin Spire Kristal Timur (x: 24..32, y: 18..26)
    carve(24, 18, 32, 26);
    carve(20, 21, 24, 23); // Koridor timur

    // 5. Kolam Cairan Mana Kosmik di tengah koridor (x: 17..19, y: 21..23)
    for (let py = 21; py <= 23; py++) {
      for (let px = 17; px <= 19; px++) {
        this.tiles[py][px] = CelestiaDungeonTileType.MANA_POOL;
      }
    }

    // 6. Takhta Primordial Naga Kristal Utara (Arena Boss x: 9..27, y: 4..14)
    carve(9, 4, 27, 14);

    // Kluster Kristal Raksasa Pembeda
    this.tiles[8][13] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;
    this.tiles[8][23] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;
    this.tiles[12][13] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;
    this.tiles[12][23] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;
    this.tiles[20][7] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;
    this.tiles[20][29] = CelestiaDungeonTileType.CRYSTAL_CLUSTER;

    // Tangga keluar menuju Lembah Celestia
    this.tiles[33][18] = CelestiaDungeonTileType.LADDER_EXIT;

    // Prisma Kristal Mengambang Berpendar
    this.astralOrbs = [
      { x: 15 * this.tileSize, y: 31 * this.tileSize, color: '#38bdf8' },
      { x: 21 * this.tileSize, y: 31 * this.tileSize, color: '#38bdf8' },
      { x: 6 * this.tileSize, y: 19 * this.tileSize, color: '#c084fc' },
      { x: 30 * this.tileSize, y: 19 * this.tileSize, color: '#c084fc' },
      { x: 12 * this.tileSize, y: 6 * this.tileSize, color: '#67e8f9' },
      { x: 24 * this.tileSize, y: 6 * this.tileSize, color: '#67e8f9' },
      { x: 18 * this.tileSize, y: 4 * this.tileSize, color: '#e879f9' }
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
    return this.tiles[ty][tx] === CelestiaDungeonTileType.MANA_POOL;
  }

  public isTileSolid(tx: number, ty: number, canSwim: boolean = false): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    if (t === CelestiaDungeonTileType.MANA_POOL) {
      return !canSwim;
    }
    return t === CelestiaDungeonTileType.WALL || t === CelestiaDungeonTileType.CRYSTAL_CLUSTER;
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
    return below !== CelestiaDungeonTileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === CelestiaDungeonTileType.WALL;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / ts));

    // 1. Render Ubin Dasar
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tile = this.tiles[y][x];
        const px = x * ts;
        const py = y * ts;
        this.renderTile(ctx, tile, px, py, ts, x, y);

        // Karpet Indigo Kristal di koridor tengah (x = 18)
        if (x === 18 && y >= 15 && y <= 29 && tile !== CelestiaDungeonTileType.WALL && tile !== CelestiaDungeonTileType.MANA_POOL) {
          drawRoyalCarpet(ctx, px, py, ts, y === 15, y === 29);
        }
      }
    }

    // 2. Render Mandala Kristal Naga di Takhta Utara (x: 18, y: 9)
    const mandalaX = 18 * ts + 16;
    const mandalaY = 9 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 48, this.animTimer, '#38bdf8', '#c084fc', '💎');
    }

    // 3. Render Prisma Mengambang
    for (const orb of this.astralOrbs) {
      const bob = Math.sin(this.animTimer * 4 + orb.x) * 3.5;
      const ox = orb.x + 16;
      const oy = orb.y + 16 + bob;

      if (
        ox >= camera.x - 40 && ox <= camera.x + camera.viewportWidth + 40 &&
        oy >= camera.y - 40 && oy <= camera.y + camera.viewportHeight + 40
      ) {
        // Cincin partikel berputar
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ox, oy, 10, 4, this.animTimer * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        // Berlian kristal melayang
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.moveTo(ox, oy - 7);
        ctx.lineTo(ox + 5, oy);
        ctx.lineTo(ox, oy + 7);
        ctx.lineTo(ox - 5, oy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Boss Telegraphs
    for (const tel of this.telegraphs) {
      const pct = 1 - tel.timer / tel.maxTimer;
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.fill();

      // Expanding charge ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * pct, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: number, px: number, py: number, ts: number, x: number, y: number): void {
    if (tile === CelestiaDungeonTileType.WALL) {
      const isFacing = this.isWallFacingFloor(x, y);
      drawDungeonWall3D(ctx, px, py, ts, x, y, isFacing, CELESTIA_THEME);
      return;
    }

    if (tile === CelestiaDungeonTileType.CRYSTAL_CLUSTER) {
      // Bongkahan Kluster Kristal Raksasa
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px, py, ts, ts);

      // Kristal ametis sudut tajam
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.moveTo(px + ts / 2, py + 2);
      ctx.lineTo(px + ts - 4, py + ts - 2);
      ctx.lineTo(px + 4, py + ts - 2);
      ctx.closePath();
      ctx.fill();

      // Faset kristal berkilau
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(px + ts / 2, py + 2);
      ctx.lineTo(px + ts / 2 + 5, py + ts - 4);
      ctx.lineTo(px + ts / 2 - 5, py + ts - 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + ts / 2 - 1, py + 8, 2, 8);
      return;
    }

    if (tile === CelestiaDungeonTileType.MANA_POOL) {
      // Kolam Mana Cair Abisal
      const shimmer = Math.sin(this.animTimer * 3 + x + y) * 2;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px, py, ts, ts);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);

      ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px + ts / 2, py + ts / 2, ts / 2 - 4 + shimmer * 0.4, ts / 2 - 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 6 + shimmer, py + 8, 2, 2);
      return;
    }

    if (tile === CelestiaDungeonTileType.LADDER_EXIT) {
      drawDungeonFloor(ctx, px, py, ts, x, y, CELESTIA_THEME, this.animTimer, false);
      // Tangga kristal keluar
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(px + 6, py + 4, ts - 12, ts - 8);
      ctx.fillStyle = '#38bdf8';
      for (let ly = py + 7; ly < py + ts - 6; ly += 5) {
        ctx.fillRect(px + 8, ly, ts - 16, 2);
      }
      return;
    }

    // Default Floor / Amethyst Floor
    const isSpecial = tile === CelestiaDungeonTileType.AMETHYST_FLOOR;
    drawDungeonFloor(ctx, px, py, ts, x, y, CELESTIA_THEME, this.animTimer, this.hasNorthWall(x, y));

    if (isSpecial) {
      // Kilau prisma kecil di ubin
      ctx.fillStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.fillRect(px + ts / 2 - 1, py + ts / 2 - 1, 3, 3);
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

    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(10, 6, 28, 0.74)');
    if (offCtx) {
      // Cahaya di sekitar pemain
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 125, 0.98);

      // Cahaya dari prisma kristal mengambang
      for (const orb of this.astralOrbs) {
        const ox = orb.x + 16 - camera.x;
        const oy = orb.y + 16 - camera.y;
        if (ox >= -80 && ox <= screenW + 80 && oy >= -80 && oy <= screenH + 80) {
          DungeonLightingEngine.punchLight(ox, oy, 12, 85, 0.95);
        }
      }

      // Cahaya Kolam Mana
      const poolX = 18 * this.tileSize + 16 - camera.x;
      const poolY = 22 * this.tileSize + 16 - camera.y;
      if (poolX >= -80 && poolX <= screenW + 80 && poolY >= -80 && poolY <= screenH + 80) {
        DungeonLightingEngine.punchLight(poolX, poolY, 16, 80, 0.9);
      }

      // Cahaya Altar Mandala Kristal Naga
      const mandalaX = 18 * this.tileSize + 16 - camera.x;
      const mandalaY = 9 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -90 && mandalaX <= screenW + 90 && mandalaY >= -90 && mandalaY <= screenH + 90) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 20, 95, 0.94);
      }

      // Cahaya Tangga Keluar
      const lx = this.ladderX + 16 - camera.x;
      const ly = this.ladderY + 16 - camera.y;
      if (lx >= -60 && lx <= screenW + 60 && ly >= -60 && ly <= screenH + 60) {
        DungeonLightingEngine.punchLight(lx, ly, 12, 65, 0.9);
      }

      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // Lapisan pendar kosmik ambient
    ctx.save();
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 125);
    pGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    pGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.15)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 125, 0, Math.PI * 2);
    ctx.fill();

    for (const orb of this.astralOrbs) {
      const ox = orb.x + 16;
      const oy = orb.y + 16;
      if (
        ox >= camera.x - 80 && ox <= camera.x + camera.viewportWidth + 80 &&
        oy >= camera.y - 80 && oy <= camera.y + camera.viewportHeight + 80
      ) {
        const oGrad = ctx.createRadialGradient(ox, oy, 6, ox, oy, 75);
        oGrad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
        oGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.15)');
        oGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, 75, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
