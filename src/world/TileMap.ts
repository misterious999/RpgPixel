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

    // --- 1. WILAYAH PEDESAAN SERENA (IBUKOTA SERIKAT & LEMBAH PEMULA) ---
    // Diperluas (x=36..64, y=40..60) dengan Alun-alun Grand Plaza, Lapangan Latihan, & Pasar
    for (let vy = 40; vy <= 60; vy++) {
      for (let vx = 36; vx <= 64; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.GRASS;
        }
      }
    }

    // Alun-alun Megah (Cobblestone Grand Plaza)
    for (let py = 45; py <= 55; py++) {
      for (let px = 46; px <= 54; px++) {
        if (this.tiles[py] && this.tiles[py][px] !== undefined) {
          this.tiles[py][px] = TileType.COBBLESTONE;
        }
      }
    }

    // Jalan Raya Utama Desa Serena (Utara-Selatan & Barat-Timur)
    for (let vy = 40; vy <= 60; vy++) {
      for (let vx = 49; vx <= 51; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.COBBLESTONE;
        }
      }
    }
    for (let vy = 49; vy <= 51; vy++) {
      for (let vx = 38; vx <= 62; vx++) {
        if (this.tiles[vy] && this.tiles[vy][vx] !== undefined) {
          this.tiles[vy][vx] = TileType.COBBLESTONE;
        }
      }
    }

    // Area Lapangan Latihan Prajurit (Training Grounds) di Barat Daya Serena (x=38..44, y=53..58)
    for (let ty = 53; ty <= 58; ty++) {
      for (let tx = 38; tx <= 44; tx++) {
        if (this.tiles[ty] && this.tiles[ty][tx] !== undefined) {
          this.tiles[ty][tx] = (tx + ty) % 2 === 0 ? TileType.SAND : TileType.DIRT_PATH;
        }
      }
    }

    // Kebun Bunga Desa di sekitar Toko Bunga Lily
    for (let fy = 44; fy <= 46; fy++) {
      for (let fx = 55; fx <= 60; fx++) {
        if (this.tiles[fy] && this.tiles[fy][fx] !== undefined) {
          this.tiles[fy][fx] = TileType.GRASS_FLOWERS;
        }
      }
    }

    // --- 2. WILAYAH DESA ELDORIA (DESA PERI HUTAN KUNO - BARAT LAUT) ---
    // Area rimba suci (x=12..32, y=12..28) bebas dari pohon liar pengganggu
    for (let ey = 12; ey <= 28; ey++) {
      for (let ex = 12; ex <= 32; ex++) {
        if (this.tiles[ey] && this.tiles[ey][ex] !== undefined) {
          if (this.tiles[ey][ex] !== TileType.WATER && this.tiles[ey][ex] !== TileType.SAND) {
            this.tiles[ey][ex] = (ex * 3 + ey * 5) % 3 === 0 ? TileType.GRASS_FLOWERS : TileType.GRASS;
          }
        }
      }
    }

    // Jalan Setapak Kayu / Cobblestone Desa Eldoria (x=16..26, y=17..25)
    for (let ey = 17; ey <= 25; ey++) {
      for (let ex = 16; ex <= 26; ex++) {
        if (this.tiles[ey] && this.tiles[ey][ex] !== undefined) {
          if (this.tiles[ey][ex] !== TileType.WATER) {
            if (ex >= 19 && ex <= 21 || ey >= 20 && ey <= 22) {
              this.tiles[ey][ex] = TileType.COBBLESTONE;
            }
          }
        }
      }
    }

    // Tebing Kuno Pembatas Pintu Kuil Roh Hutan Eldoria (y=11..12, x=16..26)
    for (let cy = 11; cy <= 12; cy++) {
      for (let cx = 16; cx <= 26; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = TileType.CLIFF;
        }
      }
    }
    // Pintu masuk kuil terbuka di x=20..22, y=12..13
    if (this.tiles[12]) {
      this.tiles[12][20] = TileType.DIRT_PATH;
      this.tiles[12][21] = TileType.DIRT_PATH;
      this.tiles[12][22] = TileType.DIRT_PATH;
    }
    if (this.tiles[13]) {
      this.tiles[13][20] = TileType.DIRT_PATH;
      this.tiles[13][21] = TileType.DIRT_PATH;
      this.tiles[13][22] = TileType.DIRT_PATH;
    }

    // --- 3. WILAYAH DESA STONEWATCH (DESA BENTENG TAMBANG KURCACI - TENGGARA) ---
    // Area benteng tambang (x=74..94, y=56..74) dibersihkan dari rintangan
    for (let sy = 56; sy <= 74; sy++) {
      for (let sx = 74; sx <= 94; sx++) {
        if (this.tiles[sy] && this.tiles[sy][sx] !== undefined) {
          if (this.tiles[sy][sx] !== TileType.WATER && this.tiles[sy][sx] !== TileType.SAND) {
            this.tiles[sy][sx] = TileType.GRASS;
          }
        }
      }
    }

    // Pelataran Benteng Batu Granit Stonewatch (x=78..90, y=60..72)
    for (let sy = 60; sy <= 72; sy++) {
      for (let sx = 78; sx <= 90; sx++) {
        if (this.tiles[sy] && this.tiles[sy][sx] !== undefined) {
          if (this.tiles[sy][sx] !== TileType.WATER) {
            this.tiles[sy][sx] = TileType.COBBLESTONE;
          }
        }
      }
    }

    // Tebing Tambang di Utara Stonewatch (y=56..58, x=80..90)
    for (let cy = 56; cy <= 58; cy++) {
      for (let cx = 80; cx <= 90; cx++) {
        if (this.tiles[cy] && this.tiles[cy][cx] !== undefined) {
          this.tiles[cy][cx] = TileType.CLIFF;
        }
      }
    }
    // Gerbang Tambang Terkutuk di x=84..86, y=57..58
    if (this.tiles[57]) {
      this.tiles[57][84] = TileType.DIRT_PATH;
      this.tiles[57][85] = TileType.DIRT_PATH;
      this.tiles[57][86] = TileType.DIRT_PATH;
    }
    if (this.tiles[58]) {
      this.tiles[58][84] = TileType.DIRT_PATH;
      this.tiles[58][85] = TileType.DIRT_PATH;
      this.tiles[58][86] = TileType.DIRT_PATH;
    }

    // --- 4. JALAN RAYA PENGHUBUNG ANTAR DESA (INTERCONNECTING HIGHWAYS) ---
    // Jalan Raya Barat: Menghubungkan Desa Serena ke Desa Eldoria
    // Dari Serena (x=38, y=49..51) ke barat sampai (x=24), lalu belok ke utara sampai Eldoria (y=25)
    for (let rx = 24; rx <= 38; rx++) {
      for (let ry = 49; ry <= 51; ry++) {
        if (this.tiles[ry] && this.tiles[ry][rx] !== undefined && this.tiles[ry][rx] !== TileType.WATER) {
          this.tiles[ry][rx] = TileType.COBBLESTONE;
        }
      }
    }
    for (let ry = 25; ry <= 50; ry++) {
      for (let rx = 23; rx <= 25; rx++) {
        if (this.tiles[ry] && this.tiles[ry][rx] !== undefined && this.tiles[ry][rx] !== TileType.WATER) {
          this.tiles[ry][rx] = TileType.COBBLESTONE;
        }
      }
    }

    // Jalan Raya Timur: Menghubungkan Desa Serena ke Desa Stonewatch
    // Dari Serena (x=62, y=49..51) ke timur sampai (x=80), lalu belok ke selatan sampai Stonewatch (y=60)
    for (let rx = 62; rx <= 80; rx++) {
      for (let ry = 49; ry <= 51; ry++) {
        if (this.tiles[ry] && this.tiles[ry][rx] !== undefined && this.tiles[ry][rx] !== TileType.WATER) {
          this.tiles[ry][rx] = TileType.COBBLESTONE;
        }
      }
    }
    for (let ry = 51; ry <= 60; ry++) {
      for (let rx = 79; rx <= 81; rx++) {
        if (this.tiles[ry] && this.tiles[ry][rx] !== undefined && this.tiles[ry][rx] !== TileType.WATER) {
          this.tiles[ry][rx] = TileType.COBBLESTONE;
        }
      }
    }

    // Tebing pegunungan megah melingkari Pintu Masuk Dungeon Gua Kripta Kuno (Utara Plaza Serena)
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

    // --- HUTAN RIMBA SEKITAR DUNGEON (DUNGEON PERIMETER FOREST) ---
    // Hutan lebat alami yang mengelilingi tebing dan gerbang dungeon gua (y=16..40, x=38..76)
    // Dilengkapi jalan setapak menuju pintu gua, pelataran gerbang, serta glade rimba luar
    for (let fy = 16; fy <= 40; fy++) {
      for (let fx = 38; fx <= 76; fx++) {
        const cur = this.tiles[fy]?.[fx];
        // Lindungi air danau, pasir pantai, tebing tebing gua, dan batas utara desa
        if (cur === TileType.WATER || cur === TileType.SAND || cur === TileType.CLIFF) {
          continue;
        }
        if (fy >= 41) {
          continue; // Jangan merambah ke wilayah pedesaan
        }

        // 1. Jalan Raya Utama ke Dungeon Gua (x=49..51, y=32..40)
        if (fx >= 49 && fx <= 51 && fy >= 32 && fy <= 40) {
          this.tiles[fy][fx] = TileType.DIRT_PATH;
          continue;
        }

        // 2. Pelataran / Halaman Terbuka Depan Pintu Gerbang Dungeon (x=47..53, y=32..35)
        // Area pertempuran monster tingkat menengah penjaga pintu dungeon
        if (fx >= 47 && fx <= 53 && fy >= 32 && fy <= 35) {
          this.tiles[fy][fx] = (fx + fy) % 2 === 0 ? TileType.GRASS : TileType.DIRT_PATH;
          continue;
        }

        // 3. Jalur Jalan Setapak Rimba (Navigasi petualang leluasa)
        // Jalur cabang timur dari jalan raya ke rimba luar (y=36..37, x=52..72)
        const isTrailEast = (fy === 36 || fy === 37) && (fx >= 52 && fx <= 72);
        // Jalur rimba utara-timur (x=64..65, y=20..37)
        const isTrailNorthEast = (fx === 64 || fx === 65) && (fy >= 20 && fy <= 37);
        // Jalur lereng timur gua menuju punggungan atas (x=55..56, y=22..34)
        const isTrailNorthGate = (fx === 55 || fx === 56) && (fy >= 22 && fy <= 34);
        // Jalur punggungan hutan utara di atas tebing (y=22..23, x=55..66)
        const isTrailNorthRidge = (fy === 22 || fy === 23) && (fx >= 55 && fx <= 66);

        if (isTrailEast || isTrailNorthEast || isTrailNorthGate || isTrailNorthRidge) {
          this.tiles[fy][fx] = TileType.DIRT_PATH;
          continue;
        }

        // 4. Padang Terbuka Glade Rimba Luar (Tempat Monster Tingkat Bawah Slime Hutan)
        // Jaraknya agak jauh dari dungeon (> 12-20 tile dari pintu dungeon)
        const isGladeEast1 = Math.hypot(fx - 64, fy - 30) < 3.5; // Glade Rimba Timur 1
        const isGladeEast2 = Math.hypot(fx - 70, fy - 25) < 3.2; // Glade Rimba Timur Jauh
        const isGladeSouthEast = Math.hypot(fx - 66, fy - 38) < 3.2; // Glade Rimba Tenggara
        const isGladeNorth = Math.hypot(fx - 58, fy - 20) < 3.2; // Glade Rimba Utara
        const isGladeNorthEast = Math.hypot(fx - 66, fy - 21) < 3.0; // Glade Rimba Timur Laut

        if (isGladeEast1 || isGladeEast2 || isGladeSouthEast || isGladeNorth || isGladeNorthEast) {
          this.tiles[fy][fx] = (fx * 3 + fy * 7) % 3 === 0 ? TileType.GRASS_FLOWERS : TileType.GRASS;
          continue;
        }

        // 5. Pohon Rimbun Hutan Rimba Sekitar Dungeon
        const fNoise = Math.sin(fx * 0.45) * Math.cos(fy * 0.45) + Math.sin(fx * 0.22 + fy * 0.31) * 0.55;
        if (fNoise > -0.15) {
          this.tiles[fy][fx] = TileType.TREE;
        } else if (fNoise < -0.42) {
          this.tiles[fy][fx] = TileType.GRASS_FLOWERS;
        } else {
          this.tiles[fy][fx] = TileType.GRASS;
        }
      }
    }
  }

  /**
   * Menentukan apakah koordinat tile berada di dalam wilayah aman salah satu pedesaan
   */
  public isVillageArea(tileX: number, tileY: number): boolean {
    // 1. Desa Serena (Ibukota & Serikat)
    const inSerena = tileX >= 36 && tileX <= 64 && tileY >= 40 && tileY <= 60;
    // 2. Desa Eldoria (Rimba Peri Barat)
    const inEldoria = tileX >= 12 && tileX <= 32 && tileY >= 12 && tileY <= 28;
    // 3. Desa Stonewatch (Benteng Tambang Kurcaci)
    const inStonewatch = tileX >= 74 && tileX <= 94 && tileY >= 56 && tileY <= 74;

    return inSerena || inEldoria || inStonewatch;
  }

  /**
   * Mendapatkan nama desa berdasarkan koordinat ubin (jika berada di pedesaan)
   */
  public getVillageName(tileX: number, tileY: number): string | null {
    if (tileX >= 36 && tileX <= 64 && tileY >= 40 && tileY <= 60) {
      return 'Desa Serena (Ibukota Serikat)';
    }
    if (tileX >= 12 && tileX <= 32 && tileY >= 12 && tileY <= 28) {
      return 'Desa Eldoria (Rimba Peri Kuno)';
    }
    if (tileX >= 74 && tileX <= 94 && tileY >= 56 && tileY <= 74) {
      return 'Desa Stonewatch (Benteng Tambang)';
    }
    return null;
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
