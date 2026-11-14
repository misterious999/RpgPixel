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

export enum PyramidTileType {
  FLOOR = 0,
  HIEROGLYPH_FLOOR = 1,
  WALL = 2,
  OBELISK_PILLAR = 3,
  LADDER_EXIT = 5
}

const PYRAMID_THEME: DungeonTheme = {
  wallTopBase: '#78350f',
  wallTopHighlight: '#d97706',
  wallTopShadow: '#451a03',
  wallFaceBase: '#451a03',
  wallFaceBrick1: '#92400e',
  wallFaceBrick2: '#b45309',
  wallFaceMortar: '#292524',
  wallFaceCrack: '#fde047',
  floorTones: ['#b45309', '#92400e', '#78350f', '#451a03'],
  floorMortar: '#292524',
  floorHighlight: '#fde047',
  mossColor: '#d97706',
  puddleColor: 'rgba(234, 179, 8, 0.3)'
};

interface SunTorch {
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

export class DungeonPyramid {
  public width: number = 36;
  public height: number = 36;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  public tiles: number[][] = [];
  public sunTorches: SunTorch[] = [];
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
        this.tiles[y][x] = PyramidTileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: PyramidTileType = PyramidTileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isHieroglyph = Math.sin(x * 6.7 + y * 7.9) > 0.42;
            this.tiles[y][x] = isHieroglyph ? PyramidTileType.HIEROGLYPH_FLOOR : type;
          }
        }
      }
    };

    // 1. Ruang Masuk Gerbang Selatan (x: 14..22, y: 30..34)
    carve(14, 30, 22, 34);

    // 2. Koridor Utama Menuju Altar Firaun (x: 16..20, y: 15..29)
    carve(16, 15, 20, 29);

    // 3. Katakombe Mumi Barat (x: 4..12, y: 18..26)
    carve(4, 18, 12, 26);
    carve(12, 21, 16, 23); // Koridor barat

    // 4. Kuil Relik Anubis Timur (x: 24..32, y: 18..26)
    carve(24, 18, 32, 26);
    carve(20, 21, 24, 23); // Koridor timur

    // 5. Altar Pemujaan Surya Tertinggi Utara (Arena Boss Firaun x: 9..27, y: 4..14)
    carve(9, 4, 27, 14);

    // Pilar-pilar Obelisk Batu Pasir Purba
    this.tiles[8][13] = PyramidTileType.OBELISK_PILLAR;
    this.tiles[8][23] = PyramidTileType.OBELISK_PILLAR;
    this.tiles[12][13] = PyramidTileType.OBELISK_PILLAR;
    this.tiles[12][23] = PyramidTileType.OBELISK_PILLAR;
    this.tiles[20][7] = PyramidTileType.OBELISK_PILLAR;
    this.tiles[20][29] = PyramidTileType.OBELISK_PILLAR;

    // Tangga keluar menuju Gurun Valoria
    this.tiles[33][18] = PyramidTileType.LADDER_EXIT;

    // Obor Api Surya Abadi
    this.sunTorches = [
      { x: 15 * this.tileSize, y: 31 * this.tileSize, color: '#f59e0b' },
      { x: 21 * this.tileSize, y: 31 * this.tileSize, color: '#f59e0b' },
      { x: 6 * this.tileSize, y: 19 * this.tileSize, color: '#fbbf24' },
      { x: 30 * this.tileSize, y: 19 * this.tileSize, color: '#fbbf24' },
      { x: 12 * this.tileSize, y: 6 * this.tileSize, color: '#f59e0b' },
      { x: 24 * this.tileSize, y: 6 * this.tileSize, color: '#f59e0b' },
      { x: 18 * this.tileSize, y: 4 * this.tileSize, color: '#f97316' }
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

  public isTileSolid(tx: number, ty: number, _canSwim: boolean = false): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === PyramidTileType.WALL || t === PyramidTileType.OBELISK_PILLAR;
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
    return below !== PyramidTileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === PyramidTileType.WALL;
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

        // Karpet Merah Emas di koridor tengah (x = 18)
        if (x === 18 && y >= 15 && y <= 29 && tile !== PyramidTileType.WALL) {
          drawRoyalCarpet(ctx, px, py, ts, y === 15, y === 29);
        }
      }
    }

    // 2. Render Mandala Surya Firaun di Altar Utara (x: 18, y: 9)
    const mandalaX = 18 * ts + 16;
    const mandalaY = 9 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 46, this.animTimer, '#f59e0b', '#fbbf24', '☀️');
    }

    // 3. Render Obor Surya Abadi
    for (const torch of this.sunTorches) {
      const flicker = Math.sin(this.animTimer * 6 + torch.x) * 2;
      const tx = torch.x + 16;
      const ty = torch.y + 16;

      if (
        tx >= camera.x - 40 && tx <= camera.x + camera.viewportWidth + 40 &&
        ty >= camera.y - 40 && ty <= camera.y + camera.viewportHeight + 40
      ) {
        // Penyangga Obor Emas
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 3, ty + 2, 6, 8);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(tx - 2, ty + 3, 4, 6);

        // Cawan Obor
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(tx - 5, ty + 2);
        ctx.lineTo(tx + 5, ty + 2);
        ctx.lineTo(tx + 3, ty + 5);
        ctx.lineTo(tx - 3, ty + 5);
        ctx.closePath();
        ctx.fill();

        // Api Surya Berdenyut
        ctx.fillStyle = torch.color;
        ctx.beginPath();
        ctx.arc(tx, ty - 2 + flicker * 0.3, 5 + flicker * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(tx, ty - 2 + flicker * 0.2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Boss Telegraphs
    for (const tel of this.telegraphs) {
      const pct = 1 - tel.timer / tel.maxTimer;
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.fill();

      // Expanding charge ring
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * pct, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: number, px: number, py: number, ts: number, x: number, y: number): void {
    if (tile === PyramidTileType.WALL) {
      const isFacing = this.isWallFacingFloor(x, y);
      drawDungeonWall3D(ctx, px, py, ts, x, y, isFacing, PYRAMID_THEME);
      return;
    }

    if (tile === PyramidTileType.OBELISK_PILLAR) {
      // Obelisk Emas Purba
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px, py, ts, ts);

      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 4, py + 2, ts - 8, ts - 4);

      // Guratan hieroglif emas
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 8, py + 6, ts - 16, 2);
      ctx.fillRect(px + 10, py + 12, ts - 20, 2);
      ctx.fillRect(px + 7, py + 18, ts - 14, 2);
      ctx.fillRect(px + 9, py + 24, ts - 18, 2);

      // Puncak Obelisk Piramida Mini
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(px + ts / 2, py);
      ctx.lineTo(px + ts - 4, py + 6);
      ctx.lineTo(px + 4, py + 6);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (tile === PyramidTileType.LADDER_EXIT) {
      drawDungeonFloor(ctx, px, py, ts, x, y, PYRAMID_THEME, this.animTimer, false);
      // Tangga batu keluar
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 6, py + 4, ts - 12, ts - 8);
      ctx.fillStyle = '#f59e0b';
      for (let ly = py + 7; ly < py + ts - 6; ly += 5) {
        ctx.fillRect(px + 8, ly, ts - 16, 2);
      }
      return;
    }

    // Default Floor / Hieroglyph Floor
    const isSpecial = tile === PyramidTileType.HIEROGLYPH_FLOOR;
    drawDungeonFloor(ctx, px, py, ts, x, y, PYRAMID_THEME, this.animTimer, this.hasNorthWall(x, y));

    if (isSpecial) {
      // Simbol hieroglif surya kecil di lantai
      ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.beginPath();
      ctx.arc(px + ts / 2, py + ts / 2, 4, 0, Math.PI * 2);
      ctx.fill();
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

    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(24, 12, 2, 0.72)');
    if (offCtx) {
      // Cahaya di sekitar pemain
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 120, 0.98);

      // Cahaya dari obor surya
      for (const torch of this.sunTorches) {
        const tx = torch.x + 16 - camera.x;
        const ty = torch.y + 16 - camera.y;
        if (tx >= -80 && tx <= screenW + 80 && ty >= -80 && ty <= screenH + 80) {
          DungeonLightingEngine.punchLight(tx, ty, 12, 85, 0.96);
        }
      }

      // Cahaya Altar Mandala Surya
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

    // Lapisan pendar hangat ambient
    ctx.save();
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 120);
    pGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    pGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.15)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 120, 0, Math.PI * 2);
    ctx.fill();

    for (const torch of this.sunTorches) {
      const tx = torch.x + 16;
      const ty = torch.y + 16;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 75);
        tGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        tGrad.addColorStop(0.6, 'rgba(180, 83, 9, 0.15)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 75, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
