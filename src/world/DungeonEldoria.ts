import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum EldoriaTileType {
  FLOOR = 0,
  MOSS_STONE = 1,
  WALL = 2,
  ROOT_PILLAR = 3,
  SACRED_WATER = 4,
  LADDER_EXIT = 5
}

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

  public isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === EldoriaTileType.WALL || t === EldoriaTileType.ROOT_PILLAR || t === EldoriaTileType.SACRED_WATER;
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
          case EldoriaTileType.WALL:
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#022c22';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            // Ancient moss cracks
            ctx.strokeStyle = '#047857';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 3, py + 3, ts - 6, ts - 6);
            break;

          case EldoriaTileType.FLOOR:
            ctx.fillStyle = '#065f46';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = 'rgba(5, 150, 105, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, ts, ts);
            break;

          case EldoriaTileType.MOSS_STONE:
            ctx.fillStyle = '#047857';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(px + 6, py + 6, 6, 6);
            ctx.fillRect(px + 18, py + 16, 5, 5);
            break;

          case EldoriaTileType.ROOT_PILLAR:
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.roundRect(px + 4, py + 2, ts - 8, ts - 4, 6);
            ctx.fill();
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(px + 6, py + 8, 8, 4);
            ctx.fillRect(px + 16, py + 18, 6, 4);
            break;

          case EldoriaTileType.SACRED_WATER: {
            const ripple = Math.sin(this.animTimer + x * 2 + y * 2) * 2;
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.fillRect(px + 4, py + 6 + ripple, ts - 8, 3);
            break;
          }

          case EldoriaTileType.LADDER_EXIT:
            ctx.fillStyle = '#065f46';
            ctx.fillRect(px, py, ts, ts);
            // Ladder frame
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px + 6, py + 2, 4, ts - 4);
            ctx.fillRect(px + ts - 10, py + 2, 4, ts - 4);
            for (let r = 6; r < ts - 4; r += 6) {
              ctx.fillRect(px + 6, py + r, ts - 12, 2.5);
            }
            // Mystical glowing exit ring
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
            break;
        }
      }
    }

    // Render Sylvan Orbs
    for (const orb of this.sylvanOrbs) {
      const bob = Math.sin(this.animTimer * 4 + orb.x) * 3;
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(orb.x + 16, orb.y + 16 + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(orb.x + 16, orb.y + 16 + bob, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Boss Danger Telegraphs
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      grad.addColorStop(0, 'rgba(74, 222, 128, 0.65)');
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

  public renderAtmosphericLighting(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerCenterX: number,
    playerCenterY: number
  ): void {
    const screenW = camera.viewportWidth;
    const screenH = camera.viewportHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(2, 44, 34, 0.65)'; // Sylvan deep emerald ambient darkness
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.globalCompositeOperation = 'destination-out';

    // Player Sylvan Aura
    const pScreenX = playerCenterX - camera.x;
    const pScreenY = playerCenterY - camera.y;
    const pGrad = ctx.createRadialGradient(pScreenX, pScreenY, 20, pScreenX, pScreenY, 115);
    pGrad.addColorStop(0, 'rgba(0,0,0,1)');
    pGrad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(pScreenX, pScreenY, 115, 0, Math.PI * 2);
    ctx.fill();

    // Sylvan Orbs light cutouts
    for (const orb of this.sylvanOrbs) {
      const ox = orb.x + 16 - camera.x;
      const oy = orb.y + 16 - camera.y;
      if (ox > -60 && ox < screenW + 60 && oy > -60 && oy < screenH + 60) {
        const oGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, 70);
        oGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
        oGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, 70, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
