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
  CLIFF = 7, // Solid
  COBBLESTONE = 8
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
        // Jalan utara berakhir rapi tepat di depan pintu masuk gua (y >= 33)
        const isNorthOfCave = y < 33 && Math.abs(x - 50) <= 2;
        if (!isNorthOfCave && (Math.abs(x - 50) <= 2 || Math.abs(y - 50) <= 2)) {
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

    // --- WILAYAH PEDESAAN KHUSUS (DESA SERIKAT OAKHAVEN) ---
    // Bersihkan area pedesaan (x=41..59, y=42..56) dari pohon liar penghalang bangunan
    for (let vy = 42; vy <= 56; vy++) {
      for (let vx = 41; vx <= 59; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.GRASS;
        }
      }
    }

    // Alun-alun & Jalan Utama Paving Batu (Cobblestone Plaza)
    // Tepat di tengah-tengahnya berdiri Balai Serikat Guild & Air Mancur Desa
    for (let py = 46; py <= 54; py++) {
      for (let px = 47; px <= 53; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = TileType.COBBLESTONE;
        }
      }
    }

    // Jalan Raya Utama Desa (Utara-Selatan & Barat-Timur)
    for (let vy = 42; vy <= 56; vy++) {
      for (let vx = 49; vx <= 51; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.COBBLESTONE;
        }
      }
    }
    for (let vy = 49; vy <= 51; vy++) {
      for (let vx = 43; vx <= 57; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.COBBLESTONE;
        }
      }
    }

    // Kebun Bunga Desa di sekitar Toko Bunga Lily
    for (let fy = 44; fy <= 46; fy++) {
      for (let fx = 55; fx <= 58; fx++) {
        if (this.tiles[fy] && this.tiles[fy][fx] !== undefined) {
          this.tiles[fy][fx] = TileType.GRASS_FLOWERS;
        }
      }
    }

    // Tebing pegunungan megah melingkari Pintu Masuk Dungeon Gua (Utara Plaza)
    // Tembok tebing belakang (y=30..31) tanpa menembus danau atau pantai berpasir di barat
    for (let cy = 30; cy <= 31; cy++) {
      for (let cx = 48; cx <= 54; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = TileType.CLIFF;
        }
      }
    }
    // Tebing dinding samping mengapit pintu gua di y=32 (kiri x=48, kanan x=51..54, pintu di x=49..50)
    if (this.tiles[32] && this.tiles[32][48] !== undefined) {
      this.tiles[32][48] = TileType.CLIFF;
    }
    for (let cx = 51; cx <= 54; cx++) {
      if (this.tiles[32] && this.tiles[32][cx] !== undefined) {
        this.tiles[32][cx] = TileType.CLIFF;
      }
    }

    // Jalan setapak megah langsung menuju pintu gua (y=33..36, x=49..51)
    for (let py = 33; py <= 36; py++) {
      for (let px = 49; px <= 51; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = TileType.DIRT_PATH;
        }
      }
    }
  }

  public getTileAt(tileX: number, tileY: number): TileType {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return TileType.CLIFF;
    }
    return this.tiles[tileY]?.[tileX] ?? TileType.GRASS;
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
        // Base rugged mountain bedrock
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(x, y, size, size);

        // Stratified rock layers / chiseled stone texture
        ctx.fillStyle = '#3b4759';
        ctx.fillRect(x + 1, y + 2, size - 2, 7);
        ctx.fillRect(x + 1, y + 11, size - 2, 9);
        ctx.fillRect(x + 1, y + 22, size - 2, 8);

        // Rocky horizontal ridges & shelf highlights
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(x + 2, y + 2, size - 4, 2);
        ctx.fillRect(x + 2, y + 11, size - 4, 2);
        ctx.fillRect(x + 2, y + 22, size - 4, 2);

        // Chiseled highlights on prominent rock edges
        ctx.fillStyle = '#718096';
        ctx.fillRect(x + 4, y + 2, 10, 1.5);
        ctx.fillRect(x + 18, y + 11, 8, 1.5);
        ctx.fillRect(x + 8, y + 22, 12, 1.5);

        // Deep shadowy crevices & vertical fissures
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(x, y + size - 2, size, 2); // Bottom shadow
        ctx.fillRect(x + 14, y + 4, 2, 7);
        ctx.fillRect(x + 26, y + 13, 2, 8);

        // Seamless Top Moss / Grass Overhang if tile above is not cliff
        const tileAbove = this.tiles[tileY - 1]?.[tileX];
        if (tileAbove !== TileType.CLIFF) {
          // Lush green moss & grass crest drooping over the rock edge
          ctx.fillStyle = '#276749';
          ctx.fillRect(x, y, size, 5);
          ctx.fillStyle = '#38a169';
          ctx.fillRect(x, y, size, 3);
          // Grass tufts / blades
          ctx.fillStyle = '#48bb78';
          ctx.fillRect(x + 3, y + 3, 3, 3);
          ctx.fillRect(x + 11, y + 3, 4, 3);
          ctx.fillRect(x + 21, y + 3, 3, 4);
          ctx.fillRect(x + 27, y + 3, 2, 2);
        }

        // Shaded left edge if exposed
        const tileLeft = this.tiles[tileY]?.[tileX - 1];
        if (tileLeft !== TileType.CLIFF) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(x, y, 2, size);
        }

        // Highlighted or shaded right edge if exposed
        const tileRight = this.tiles[tileY]?.[tileX + 1];
        if (tileRight !== TileType.CLIFF) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(x + size - 2, y, 2, size);
        }

        break;
      }
      case TileType.COBBLESTONE: {
        // Paver stone base
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x, y, size, size);

        // Mortar lines separating pavers
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, size, 1);
        ctx.fillRect(x, y, 1, size);
        ctx.fillRect(x, y + 16, size, 1);
        ctx.fillRect(x + 16, y, 1, size);

        // Subtle stone bevel highlights
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 2, y + 2, 13, 1.5);
        ctx.fillRect(x + 18, y + 2, 13, 1.5);
        ctx.fillRect(x + 2, y + 18, 13, 1.5);
        ctx.fillRect(x + 18, y + 18, 13, 1.5);

        // Variasi tekstur alami batu
        if ((tileX * 7 + tileY * 11) % 3 === 0) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 5, y + 6, 4, 3);
          ctx.fillRect(x + 21, y + 22, 5, 3);
        } else if ((tileX + tileY) % 2 === 0) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 20, y + 7, 4, 3);
          ctx.fillRect(x + 6, y + 23, 4, 3);
        }
        break;
      }
    }
  }
}
