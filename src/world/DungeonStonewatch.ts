import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum StonewatchTileType {
  FLOOR = 0,
  BASALT = 1,
  WALL = 2,
  MINE_BEAM = 3,
  MOLTEN_ORE = 4,
  LADDER_EXIT = 5,
  RAIL = 6
}

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

        switch (tile) {
          case StonewatchTileType.WALL:
            ctx.fillStyle = '#1e1b4b'; // Deep dark basalt
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            // Cyan mana crystal seam
            if ((x + y) % 5 === 0) {
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(px + 10, py + 12, 4, 8);
              ctx.fillRect(px + 18, py + 14, 3, 5);
            }
            break;

          case StonewatchTileType.FLOOR:
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, ts, ts);
            break;

          case StonewatchTileType.BASALT:
            ctx.fillStyle = '#334155';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#475569';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillRect(px + 16, py + 14, 10, 8);
            break;

          case StonewatchTileType.RAIL:
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, ts, ts);
            // Wooden railroad sleepers
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px + 4, py + 4, ts - 8, 4);
            ctx.fillRect(px + 4, py + 14, ts - 8, 4);
            ctx.fillRect(px + 4, py + 24, ts - 8, 4);
            // Iron rails
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px + 8, py, 2.5, ts);
            ctx.fillRect(px + ts - 11, py, 2.5, ts);
            break;

          case StonewatchTileType.MINE_BEAM:
            // Heavy Dwarven Timber Post
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px + 4, py + 2, ts - 8, ts - 4);
            // Iron reinforcement bands
            ctx.fillStyle = '#64748b';
            ctx.fillRect(px + 4, py + 6, ts - 8, 3);
            ctx.fillRect(px + 4, py + ts - 9, ts - 8, 3);
            break;

          case StonewatchTileType.MOLTEN_ORE: {
            const glow = Math.sin(this.animTimer * 3 + x + y) * 2;
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(px + 6, py + 6 + glow, ts - 12, ts - 12);
            break;
          }

          case StonewatchTileType.LADDER_EXIT:
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, ts, ts);
            // Sturdy iron ladder
            ctx.fillStyle = '#64748b';
            ctx.fillRect(px + 6, py + 2, 4, ts - 4);
            ctx.fillRect(px + ts - 10, py + 2, 4, ts - 4);
            for (let r = 6; r < ts - 4; r += 6) {
              ctx.fillRect(px + 6, py + r, ts - 12, 2.5);
            }
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
            break;
        }
      }
    }

    // Render Torches / Mining Lanterns
    for (const torch of this.torches) {
      const flicker = Math.sin(this.animTimer * 10 + torch.x) * 1.5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(torch.x + 16, torch.y + 16 + flicker, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(torch.x + 16, torch.y + 15 + flicker, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Boss Danger Telegraphs (Quake / Magma slam)
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

  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    const screenW = camera.viewportWidth;
    const screenH = camera.viewportHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)'; // Deep dark mine ambient darkness
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.globalCompositeOperation = 'destination-out';

    // Player Mining Lantern Light
    const pScreenX = playerCenterX - camera.x;
    const pScreenY = playerCenterY - camera.y;
    const pGrad = ctx.createRadialGradient(pScreenX, pScreenY, 20, pScreenX, pScreenY, 110);
    pGrad.addColorStop(0, 'rgba(0,0,0,1)');
    pGrad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(pScreenX, pScreenY, 110, 0, Math.PI * 2);
    ctx.fill();

    // Torches light cutouts
    for (const torch of this.torches) {
      const tx = torch.x + 16 - camera.x;
      const ty = torch.y + 16 - camera.y;
      if (tx > -60 && tx < screenW + 60 && ty > -60 && ty < screenH + 60) {
        const tGrad = ctx.createRadialGradient(tx, ty, 8, tx, ty, 65);
        tGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
        tGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 65, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
