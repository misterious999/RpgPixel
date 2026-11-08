import { CONSTANTS } from '../core/Constants.ts';
import { Camera } from '../core/Camera.ts';

export enum TileType {
  GRASS = 0,
  GRASS_FLOWERS = 1,
  DIRT_PATH = 2,
  SAND = 3,
  WATER = 4, // Solid
  TREE = 5,  // Solid
  ROCK = 6,  // Solid
  CLIFF = 7  // Solid
}

export class TileMap {
  public width: number;
  public height: number;
  public tileSize: number;
  private tiles: number[][];
  private waterAnimationTimer: number = 0;

  constructor() {
    this.width = CONSTANTS.MAP_WIDTH;
    this.height = CONSTANTS.MAP_HEIGHT;
    this.tileSize = CONSTANTS.TILE_SIZE;
    this.tiles = [];
    this.generateWorld();
  }

  private generateWorld(): void {
    // Initialize 2D grid with grass
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Border cliffs
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.tiles[y][x] = TileType.CLIFF;
          continue;
        }

        // Noise / procedural pattern using math sin/cos
        const n1 = Math.sin(x * 0.12) + Math.cos(y * 0.12);
        const n2 = Math.sin(x * 0.05 + 1.2) * Math.cos(y * 0.05 + 0.8);

        // Water lakes
        if (n1 + n2 * 1.5 < -1.1) {
          this.tiles[y][x] = TileType.WATER;
          continue;
        }

        // Beach / Sand around water
        if (n1 + n2 * 1.5 < -0.9) {
          this.tiles[y][x] = TileType.SAND;
          continue;
        }

        // Trees & Forests (jauh dari jalan dan area spawn)
        const isNearMainPath = Math.abs(x - 50) <= 3 || Math.abs(y - 50) <= 3;
        const treeNoise = Math.sin(x * 0.35) * Math.sin(y * 0.35);
        if (treeNoise > 0.48 && Math.hypot(x - 50, y - 50) > 10 && !isNearMainPath) {
          this.tiles[y][x] = TileType.TREE;
          continue;
        }

        // Batu-batuan padat penghalang dijelajah DIHAPUS sesuai permintaan user.
        // Area luas bebas hambatan untuk petualangan leluasa!

        // Roads / paths through center (lebar & lega)
        if (Math.abs(x - 50) <= 2 || Math.abs(y - 50) <= 2) {
          this.tiles[y][x] = TileType.DIRT_PATH;
          continue;
        }

        // Flower patches
        if (Math.sin(x * 0.25) * Math.cos(y * 0.25) > 0.3) {
          this.tiles[y][x] = TileType.GRASS_FLOWERS;
        } else {
          this.tiles[y][x] = TileType.GRASS;
        }
      }
    }

    // Pastikan area spawn utama & guild plaza luas dan bersih (radius 5 tile)
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const sx = 50 + dx;
        const sy = 50 + dy;
        if (this.tiles[sy] && this.tiles[sy][sx] !== undefined) {
          this.tiles[sy][sx] = (Math.abs(dx) <= 2 || Math.abs(dy) <= 2) ? TileType.DIRT_PATH : TileType.GRASS;
        }
      }
    }

    // Mountain cliff ridge flanking the Cave / Dungeon Entrance (North of plaza)
    for (let cy = 31; cy <= 33; cy++) {
      for (let cx = 45; cx <= 48; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = TileType.CLIFF;
        }
      }
      for (let cx = 52; cx <= 55; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = TileType.CLIFF;
        }
      }
    }
    for (let py = 33; py <= 36; py++) {
      for (let px = 49; px <= 51; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = TileType.DIRT_PATH;
        }
      }
    }
  }

  public isTileSolid(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return true; // Outside bounds is solid
    }
    const tile = this.tiles[tileY][tileX];
    // Batu tidak lagi padat (tidak menghalangi jalan petualang)
    return tile === TileType.WATER ||
           tile === TileType.TREE ||
           tile === TileType.CLIFF;
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

  public update(deltaTime: number): void {
    this.waterAnimationTimer += deltaTime * 2;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;

    // Viewport Culling: Only render visible tiles
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
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    type: TileType,
    x: number,
    y: number,
    size: number,
    tileX: number,
    tileY: number
  ): void {
    switch (type) {
      case TileType.GRASS: {
        ctx.fillStyle = '#3f7c32';
        ctx.fillRect(x, y, size, size);
        // Subtle grass accents
        if ((tileX + tileY) % 3 === 0) {
          ctx.fillStyle = '#4c933d';
          ctx.fillRect(x + 4, y + 8, 3, 4);
          ctx.fillRect(x + 18, y + 20, 3, 4);
        }
        break;
      }
      case TileType.GRASS_FLOWERS: {
        ctx.fillStyle = '#438335';
        ctx.fillRect(x, y, size, size);
        // Yellow & red flowers
        ctx.fillStyle = (tileX % 2 === 0) ? '#fde047' : '#f87171';
        ctx.fillRect(x + 10, y + 10, 4, 4);
        ctx.fillRect(x + 22, y + 18, 4, 4);
        break;
      }
      case TileType.DIRT_PATH: {
        ctx.fillStyle = '#a17a4a';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#8f6a3d';
        ctx.fillRect(x + 6, y + 14, 4, 3);
        ctx.fillRect(x + 20, y + 6, 5, 3);
        break;
      }
      case TileType.SAND: {
        ctx.fillStyle = '#d4b26f';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#c5a35f';
        ctx.fillRect(x + 8, y + 8, 3, 3);
        break;
      }
      case TileType.WATER: {
        const wave = Math.sin(this.waterAnimationTimer + tileX * 0.5 + tileY * 0.5) * 2;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x + 4 + wave, y + 10, size - 12, 3);
        ctx.fillRect(x + 8 - wave, y + 22, size - 16, 2);
        break;
      }
      case TileType.TREE: {
        // Base grass underneath
        ctx.fillStyle = '#3f7c32';
        ctx.fillRect(x, y, size, size);
        // Trunk
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x + 12, y + 18, 8, 14);
        // Foliage
        ctx.fillStyle = '#1e5e22';
        ctx.beginPath();
        ctx.arc(x + 16, y + 13, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(x + 14, y + 11, 9, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TileType.ROCK: {
        ctx.fillStyle = '#3f7c32';
        ctx.fillRect(x, y, size, size);
        // Rock body
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 18, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(x + 14, y + 15, 6, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TileType.CLIFF: {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 4, size - 4, size - 8);
        break;
      }
    }
  }
}
