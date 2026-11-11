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

export enum Floor3TileType {
  FLOOR = 0,
  MAGMA_CRACK = 1,
  WALL = 2,
  PILLAR = 3,
  LAVA = 4,
  PORTAL_UP = 5
}

const FLOOR3_THEME: DungeonTheme = {
  wallTopBase: '#18181b',
  wallTopHighlight: '#3f3f46',
  wallTopShadow: '#050505',
  wallFaceBase: '#09090b',
  wallFaceBrick1: '#18181b',
  wallFaceBrick2: '#27272a',
  wallFaceMortar: '#050505',
  wallFaceCrack: '#f97316',
  floorTones: ['#18181b', '#202024', '#141416', '#27272a'],
  floorMortar: '#09090b',
  floorHighlight: '#dc2626',
  mossColor: '#450a0a',
  puddleColor: 'rgba(234, 88, 12, 0.45)'
};

export interface BossTelegraph {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
  type?: 'circle' | 'line';
}

export class DungeonFloor3 {
  public width: number = 40;
  public height: number = 40;
  public tileSize: number = CONSTANTS.TILE_SIZE;
  private tiles: number[][] = [];
  public torches: { x: number; y: number }[] = [];
  public animTimer: number = 0;

  // Key Coordinates
  public entranceSpawnX: number = 20 * CONSTANTS.TILE_SIZE + 6;
  public entranceSpawnY: number = 36 * CONSTANTS.TILE_SIZE + 3;
  public portalUpX: number = 20 * CONSTANTS.TILE_SIZE;
  public portalUpY: number = 38 * CONSTANTS.TILE_SIZE;

  // Boss telegraph red danger zones
  public telegraphs: BossTelegraph[] = [];

  // Ambient embers floating in the infernal heat
  private embers: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];

  constructor() {
    this.generateInfernoLabyrinth();
    this.initEmbers();
  }

  private initEmbers(): void {
    for (let i = 0; i < 45; i++) {
      this.embers.push({
        x: Math.random() * (this.width * this.tileSize),
        y: Math.random() * (this.height * this.tileSize),
        vx: (Math.random() - 0.5) * 16,
        vy: -22 - Math.random() * 25,
        life: Math.random() * 2.5,
        maxLife: 2.5,
        size: 1 + Math.random() * 2
      });
    }
  }

  private generateInfernoLabyrinth(): void {
    // 1. Initialize all as solid WALL
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = Floor3TileType.WALL;
      }
    }

    const carve = (x1: number, y1: number, x2: number, y2: number, type: Floor3TileType = Floor3TileType.FLOOR) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            const isMagma = Math.random() < 0.22;
            this.tiles[y][x] = isMagma ? Floor3TileType.MAGMA_CRACK : type;
          }
        }
      }
    };

    // 1. Entrance Bastion (South)
    carve(17, 34, 23, 38);
    this.tiles[38][20] = Floor3TileType.PORTAL_UP;

    // 2. The Bridge of Cinders over Lava Chasm
    carve(19, 28, 21, 34);
    // Lava rivers flanking bridge
    for (let ly = 29; ly <= 33; ly++) {
      this.tiles[ly][18] = Floor3TileType.LAVA;
      this.tiles[ly][22] = Floor3TileType.LAVA;
    }

    // 3. The Central Caldera Hall
    carve(12, 16, 28, 28);
    // Pillars in central caldera
    this.tiles[19][15] = Floor3TileType.PILLAR;
    this.tiles[19][25] = Floor3TileType.PILLAR;
    this.tiles[25][15] = Floor3TileType.PILLAR;
    this.tiles[25][25] = Floor3TileType.PILLAR;

    // 4. West Hellhound Kennels (Barat)
    carve(4, 15, 12, 25);
    carve(10, 19, 14, 21); // West corridor

    // 5. East Reaper Sanctum (Timur)
    carve(28, 15, 36, 25);
    carve(26, 19, 30, 21); // East corridor

    // 6. Corridor to Molten Throne
    carve(19, 13, 21, 16);

    // 7. Molten Throne of the Dragon King (North Boss Arena)
    carve(8, 2, 32, 13);

    // Massive Demonic Obsidian Pillars in Dragon Arena
    this.tiles[5][12] = Floor3TileType.PILLAR;
    this.tiles[5][28] = Floor3TileType.PILLAR;
    this.tiles[10][12] = Floor3TileType.PILLAR;
    this.tiles[10][28] = Floor3TileType.PILLAR;

    // Lava pools bordering the dragon throne
    for (let lx = 14; lx <= 26; lx++) {
      this.tiles[3][lx] = Floor3TileType.LAVA;
    }

    // Torches (Hellfire Braziers)
    this.torches = [
      { x: 18, y: 35 }, { x: 22, y: 35 },
      { x: 13, y: 17 }, { x: 27, y: 17 },
      { x: 13, y: 27 }, { x: 27, y: 27 },
      { x: 5, y: 16 },  { x: 11, y: 16 },
      { x: 29, y: 16 }, { x: 35, y: 16 },
      { x: 9, y: 4 },   { x: 31, y: 4 },
      { x: 9, y: 12 },  { x: 31, y: 12 }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;

    // Update boss telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tel = this.telegraphs[i];
      tel.timer -= deltaTime;
      if (tel.timer <= 0) {
        this.telegraphs.splice(i, 1);
      }
    }

    // Update floating embers
    for (const em of this.embers) {
      em.x += em.vx * deltaTime;
      em.y += em.vy * deltaTime;
      em.life -= deltaTime;
      if (em.life <= 0) {
        em.life = em.maxLife;
        em.x = Math.random() * (this.width * this.tileSize);
        em.y = Math.random() * (this.height * this.tileSize);
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

  public isNearPortalUp(px: number, py: number): boolean {
    const lx = this.portalUpX + 16;
    const ly = this.portalUpY + 16;
    return Math.hypot(px - lx, py - ly) < 36;
  }

  public isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
    const t = this.tiles[ty][tx];
    return t === Floor3TileType.WALL || t === Floor3TileType.PILLAR || t === Floor3TileType.LAVA;
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
    return below !== Floor3TileType.WALL;
  }

  private hasNorthWall(tx: number, ty: number): boolean {
    if (ty - 1 < 0) return false;
    return this.tiles[ty - 1][tx] === Floor3TileType.WALL;
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
      }
    }

    // 2. Render Dragon King Molten Altar Mandala in North Boss Arena (c: 20, r: 7.5)
    const mandalaX = 20 * ts + 16;
    const mandalaY = 7.5 * ts + 16;
    if (
      mandalaX >= camera.x - 80 && mandalaX <= camera.x + camera.viewportWidth + 80 &&
      mandalaY >= camera.y - 80 && mandalaY <= camera.y + camera.viewportHeight + 80
    ) {
      drawBossMandala(ctx, mandalaX, mandalaY, 44, this.animTimer, '#f97316', '#dc2626', '🐲');
    }

    // 3. Render Hellfire Braziers (Torches)
    for (const t of this.torches) {
      const tx = t.x * ts;
      const ty = t.y * ts;
      if (
        tx >= camera.x - ts && tx <= camera.x + camera.viewportWidth + ts &&
        ty >= camera.y - ts && ty <= camera.y + camera.viewportHeight + ts
      ) {
        drawWallTorch3D(ctx, tx + 13, ty + 12, this.animTimer, ['#dc2626', '#f97316', '#fef08a']);
      }
    }

    // 4. Render Boss Red Danger Telegraph Warning Zones (Meteors & Fire Breath)
    for (const tel of this.telegraphs) {
      const progress = 1 - (tel.timer / tel.maxTimer);
      ctx.save();

      // Outer Danger Ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Internal Magma Fill Area
      const grad = ctx.createRadialGradient(tel.x, tel.y, 2, tel.x, tel.y, tel.radius * progress);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.75)');
      grad.addColorStop(0.55, 'rgba(239, 68, 68, 0.5)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.25)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tel.x, tel.y, tel.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Flashing Hazard Icon
      if (Math.sin(this.animTimer * 14) > 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', tel.x, tel.y);
      }
      ctx.restore();
    }

    // 5. Render Rising Floating Volcanic Embers
    ctx.save();
    for (const em of this.embers) {
      if (
        em.x >= camera.x && em.x <= camera.x + camera.viewportWidth &&
        em.y >= camera.y && em.y <= camera.y + camera.viewportHeight
      ) {
        const alpha = Math.sin((em.life / em.maxLife) * Math.PI) * 0.85;
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.fillRect(em.x, em.y, em.size, em.size);
      }
    }
    ctx.restore();
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    tile: Floor3TileType,
    x: number,
    y: number,
    size: number,
    tileX: number,
    tileY: number
  ): void {
    switch (tile) {
      case Floor3TileType.FLOOR:
        drawDungeonFloor(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          FLOOR3_THEME,
          this.animTimer,
          this.hasNorthWall(tileX, tileY)
        );
        break;

      case Floor3TileType.MAGMA_CRACK: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR3_THEME, this.animTimer, this.hasNorthWall(tileX, tileY));
        // Glowing magma veins pulsating through volcanic basalt
        const pulse = Math.sin(this.animTimer * 4 + tileX + tileY) * 0.3 + 0.7;
        ctx.save();
        ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 8);
        ctx.lineTo(x + 14, y + 15);
        ctx.lineTo(x + 24, y + 22);
        ctx.stroke();

        ctx.strokeStyle = `rgba(253, 224, 71, ${pulse * 0.9})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Molten core dot
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 13, y + 14, 2.5, 2.5);
        ctx.restore();
        break;
      }

      case Floor3TileType.WALL:
        drawDungeonWall3D(
          ctx,
          x,
          y,
          size,
          tileX,
          tileY,
          this.isWallFacingFloor(tileX, tileY),
          FLOOR3_THEME
        );
        break;

      case Floor3TileType.PILLAR: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR3_THEME, this.animTimer, false);
        // Demonic Obsidian Spire Pillar
        // Heavy base
        ctx.fillStyle = '#09090b';
        ctx.fillRect(x + 3, y + 21, size - 6, 9);
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x + 5, y + 22, size - 10, 2);

        // Obsidian Spire Shaft
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x + 5, y + 6, size - 10, 16);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(x + 7, y + 6, 4, 16);
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(x + 8, y + 6, 2, 16);

        // Molten Hellfire Rune Band
        const pulse = Math.sin(this.animTimer * 5 + tileX) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(234, 88, 12, ${pulse})`;
        ctx.fillRect(x + 5, y + 13, size - 10, 3);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x + 7, y + 14, size - 14, 1);

        // Jagged Spire Capital (Top)
        ctx.fillStyle = '#27272a';
        ctx.fillRect(x + 3, y + 2, size - 6, 5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + 4, y + 2, size - 8, 1.5);
        break;
      }

      case Floor3TileType.LAVA: {
        // Multi-Layer Flowing Boiling Magma River
        ctx.fillStyle = '#2b0606';
        ctx.fillRect(x, y, size, size);

        // Molten bed
        const lavaWave = Math.sin(this.animTimer * 4 + tileX * 1.5 + tileY * 1.5) * 2;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

        // Fiery molten flow
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x + 2, y + 3 + lavaWave, size - 4, size - 6);

        // Blazing white-gold heat crest
        ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
        ctx.fillRect(x + 5, y + 7 + lavaWave * 0.5, size - 10, 3.5);

        // Bursting Sulfur Bubble
        const bubbleProg = (this.animTimer * 2 + tileX * 3 + tileY * 5) % 3;
        if (bubbleProg < 2) {
          const bRadius = bubbleProg * 2;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(x + 12 + lavaWave, y + 15, bRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Obsidian Basin Rim
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        break;
      }

      case Floor3TileType.PORTAL_UP: {
        drawDungeonFloor(ctx, x, y, size, tileX, tileY, FLOOR3_THEME, this.animTimer, false);

        // Stone Ring
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        // Celestial Blue/Cyan return vortex to Floor 2
        const pulse = Math.sin(this.animTimer * 4) * 1.5;
        const grad = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 13 + pulse);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#bae6fd');
        grad.addColorStop(0.7, '#38bdf8');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#93c5fd';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.fillText('▲ Ke Lt.2', x + 16, y - 4);
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

    // 1. Begin offscreen infernal darkness mask
    const offCtx = DungeonLightingEngine.begin(screenW, screenH, 'rgba(23, 5, 5, 0.68)');
    if (offCtx) {
      // Punch Player Torch Light
      const pScreenX = playerCenterX - camera.x;
      const pScreenY = playerCenterY - camera.y;
      DungeonLightingEngine.punchLight(pScreenX, pScreenY, 18, 125, 0.98);

      // Punch Hellfire Braziers
      for (const t of this.torches) {
        const tx = t.x * this.tileSize + 16 - camera.x;
        const ty = t.y * this.tileSize + 16 - camera.y;
        if (tx >= -80 && tx <= screenW + 80 && ty >= -80 && ty <= screenH + 80) {
          const flicker = Math.sin(this.animTimer * 5 + t.x) * 5;
          DungeonLightingEngine.punchLight(tx, ty, 10, 75 + flicker, 0.96);
        }
      }

      // Punch Dragon King Molten Altar in North Arena
      const mandalaX = 20 * this.tileSize + 16 - camera.x;
      const mandalaY = 7.5 * this.tileSize + 16 - camera.y;
      if (mandalaX >= -90 && mandalaX <= screenW + 90 && mandalaY >= -90 && mandalaY <= screenH + 90) {
        DungeonLightingEngine.punchLight(mandalaX, mandalaY, 20, 90, 0.92);
      }

      // Punch Lava River Chasm on Bridge of Cinders
      const bridgeLavaX = 20 * this.tileSize + 16 - camera.x;
      const bridgeLavaY = 31 * this.tileSize + 16 - camera.y;
      if (bridgeLavaX >= -80 && bridgeLavaX <= screenW + 80 && bridgeLavaY >= -80 && bridgeLavaY <= screenH + 80) {
        DungeonLightingEngine.punchLight(bridgeLavaX, bridgeLavaY, 16, 75, 0.85);
      }

      // Punch Portal Up
      const px = this.portalUpX + 16 - camera.x;
      const py = this.portalUpY + 16 - camera.y;
      if (px >= -60 && px <= screenW + 60 && py >= -60 && py <= screenH + 60) {
        DungeonLightingEngine.punchLight(px, py, 12, 65, 0.9);
      }

      // 2. Render Darkness Mask over World Context
      DungeonLightingEngine.renderToWorld(ctx, camera.x, camera.y);
    }

    // 3. Ambient Fiery Glow Pass (Hellfire Braziers & Lava Rivers)
    ctx.save();
    // Warm Player Golden Torchlight Halo
    const pGrad = ctx.createRadialGradient(playerCenterX, playerCenterY, 15, playerCenterX, playerCenterY, 120);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    pGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.15)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Hellfire Brazier Glowing Orange Halos
    for (const t of this.torches) {
      const tx = t.x * this.tileSize + 16;
      const ty = t.y * this.tileSize + 16;
      if (
        tx >= camera.x - 80 && tx <= camera.x + camera.viewportWidth + 80 &&
        ty >= camera.y - 80 && ty <= camera.y + camera.viewportHeight + 80
      ) {
        const flicker = Math.sin(this.animTimer * 5 + t.x) * 5;
        const tGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, 74 + flicker);
        tGrad.addColorStop(0, 'rgba(254, 215, 170, 0.45)');
        tGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.22)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 74 + flicker, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
