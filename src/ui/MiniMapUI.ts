import { CONSTANTS } from '../core/Constants.ts';
import { Player } from '../entities/Player.ts';
import { Monster } from '../entities/Monster.ts';
import { Chest } from '../world/Chest.ts';
import { TileMap, TileType } from '../world/TileMap.ts';
import { DungeonMap } from '../world/DungeonMap.ts';
import { DungeonFloor2 } from '../world/DungeonFloor2.ts';
import { DungeonFloor3 } from '../world/DungeonFloor3.ts';
import { DungeonEldoria } from '../world/DungeonEldoria.ts';
import { DungeonStonewatch } from '../world/DungeonStonewatch.ts';
import { RegionManager } from '../world/RegionManager.ts';
import { ContinentValoria, ValoriaTileType } from '../world/ContinentValoria.ts';

export type MiniMapMode = 'NORMAL' | 'EXPANDED' | 'MINIMIZED';

export class MiniMapUI {
  public mode: MiniMapMode = 'NORMAL';

  // Cache offscreen canvases for terrain so we don't redraw 10,000 tiles every frame!
  private overworldCanvas: HTMLCanvasElement | null = null;
  private dungeonCanvas: HTMLCanvasElement | null = null;
  private floor2Canvas: HTMLCanvasElement | null = null;
  private floor3Canvas: HTMLCanvasElement | null = null;
  private eldoriaCanvas: HTMLCanvasElement | null = null;
  private stonewatchCanvas: HTMLCanvasElement | null = null;
  private valoriaCanvas: HTMLCanvasElement | null = null;
  private interiorCanvas: HTMLCanvasElement | null = null;

  private pulseTimer: number = 0;

  constructor() {}

  public update(deltaTime: number): void {
    this.pulseTimer += deltaTime;
  }

  /**
   * Menghasilkan peta statis overworld sekali saja agar performa 60 FPS sangat mulus
   */
  private generateOverworldCache(tileMap: TileMap): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = CONSTANTS.MAP_WIDTH;
    c.height = CONSTANTS.MAP_HEIGHT;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
      for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
        const t = tileMap.getTileAt(x, y);
        let color = '#15803d'; // Default grass
        if (t === TileType.WATER) color = '#0284c7';
        else if (t === TileType.DIRT_PATH) color = '#a16207';
        else if (t === TileType.SAND) color = '#fef08a';
        else if (t === TileType.TREE) color = '#14532d';
        else if (t === TileType.CLIFF) color = '#334155';
        else if (t === TileType.GRASS_FLOWERS) color = '#22c55e';
        else if (t === TileType.COBBLESTONE) color = '#94a3b8';

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis dungeon Lantai 1
   */
  private generateDungeonCache(dungeonMap: DungeonMap): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = dungeonMap.width;
    c.height = dungeonMap.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < dungeonMap.height; y++) {
      for (let x = 0; x < dungeonMap.width; x++) {
        const isSolid = dungeonMap.isTileSolid(x, y);
        ctx.fillStyle = isSolid ? '#0f172a' : '#334155';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis dungeon Lantai 2
   */
  private generateFloor2Cache(dungeonFloor2: DungeonFloor2): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = dungeonFloor2.width;
    c.height = dungeonFloor2.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < dungeonFloor2.height; y++) {
      for (let x = 0; x < dungeonFloor2.width; x++) {
        const isSolid = dungeonFloor2.isTileSolid(x, y);
        ctx.fillStyle = isSolid ? '#090d16' : '#1e293b';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis dungeon Lantai 3
   */
  private generateFloor3Cache(dungeonFloor3: DungeonFloor3): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = dungeonFloor3.width;
    c.height = dungeonFloor3.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < dungeonFloor3.height; y++) {
      for (let x = 0; x < dungeonFloor3.width; x++) {
        const isSolid = dungeonFloor3.isTileSolid(x, y);
        ctx.fillStyle = isSolid ? '#09090b' : '#3f1313';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis Kuil Roh Hutan Eldoria
   */
  private generateEldoriaCache(dungeonEldoria: DungeonEldoria): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = dungeonEldoria.width;
    c.height = dungeonEldoria.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < dungeonEldoria.height; y++) {
      for (let x = 0; x < dungeonEldoria.width; x++) {
        const isSolid = dungeonEldoria.isTileSolid(x, y);
        ctx.fillStyle = isSolid ? '#022c22' : '#065f46';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis Tambang Terkutuk Stonewatch
   */
  private generateStonewatchCache(dungeonStonewatch: DungeonStonewatch): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = dungeonStonewatch.width;
    c.height = dungeonStonewatch.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < dungeonStonewatch.height; y++) {
      for (let x = 0; x < dungeonStonewatch.width; x++) {
        const isSolid = dungeonStonewatch.isTileSolid(x, y);
        ctx.fillStyle = isSolid ? '#0f172a' : '#334155';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  /**
   * Menghasilkan peta statis Benua Baru Valoria (120x120 tiles)
   */
  private generateValoriaCache(continentValoria: ContinentValoria): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = continentValoria.width;
    c.height = continentValoria.height;
    const ctx = c.getContext('2d')!;

    for (let y = 0; y < continentValoria.height; y++) {
      for (let x = 0; x < continentValoria.width; x++) {
        const t = continentValoria.getTileAt(x, y);
        let color = '#65a30d'; // Savana
        if (t === ValoriaTileType.DESERT_SAND) color = '#eab308';
        else if (t === ValoriaTileType.DUNES) color = '#d97706';
        else if (t === ValoriaTileType.WATER) color = '#0284c7';
        else if (t === ValoriaTileType.COBBLESTONE) color = '#94a3b8';
        else if (t === ValoriaTileType.DIRT_PATH) color = '#b45309';
        else if (t === ValoriaTileType.SNOW) color = '#f8fafc';
        else if (t === ValoriaTileType.ICE) color = '#7dd3fc';
        else if (t === ValoriaTileType.CRYSTAL_SOIL) color = '#7e22ce';
        else if (t === ValoriaTileType.PINE_TREE) color = '#065f46';
        else if (t === ValoriaTileType.PALM_TREE) color = '#15803d';
        else if (t === ValoriaTileType.SAVANNA_TREE) color = '#3f6212';
        else if (t === ValoriaTileType.CLIFF) color = '#334155';
        else if (t === ValoriaTileType.CRYSTAL_SPIRE) color = '#c084fc';

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    if (this.mode === 'MINIMIZED') {
      const btn = { x: screenWidth - 110, y: 52, w: 60, h: 26 };
      if (touchX >= btn.x && touchX <= btn.x + btn.w && touchY >= btn.y && touchY <= btn.y + btn.h) {
        this.mode = 'NORMAL';
        return true;
      }
      return false;
    }

    if (this.mode === 'NORMAL') {
      const mw = 100;
      const mh = 72;
      const mx = screenWidth - mw - 10;
      const my = 52;
      if (touchX >= mx && touchX <= mx + mw && touchY >= my && touchY <= my + mh) {
        this.mode = 'EXPANDED';
        return true;
      }
      return false;
    }

    if (this.mode === 'EXPANDED') {
      const w = Math.min(480, screenWidth - 30);
      const h = Math.min(300, screenHeight - 24);
      const x = (screenWidth - w) / 2;
      const y = (screenHeight - h) / 2;

      // Close button (X)
      const closeBtn = { x: x + w - 36, y: y + 6, size: 26 };
      if (
        touchX >= closeBtn.x &&
        touchX <= closeBtn.x + closeBtn.size &&
        touchY >= closeBtn.y &&
        touchY <= closeBtn.y + closeBtn.size
      ) {
        this.mode = 'NORMAL';
        return true;
      }

      // Klik sembarang luar modal untuk menutup
      if (touchX < x || touchX > x + w || touchY < y || touchY > y + h) {
        this.mode = 'NORMAL';
        return true;
      }

      return true; // Telan sentuhan saat modal terbuka
    }

    return false;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    currentMap: 'OVERWORLD' | 'CONTINENT_VALORIA' | 'DUNGEON' | 'DUNGEON_FLOOR_2' | 'DUNGEON_FLOOR_3' | 'DUNGEON_ELDORIA' | 'DUNGEON_STONEWATCH' | 'INTERIOR_GUILD' | 'INTERIOR_BLACKSMITH' | 'INTERIOR_APOTHECARY' | 'INTERIOR_KITCHEN' | 'INTERIOR_BANK' | 'INTERIOR_ELDORIA' | 'INTERIOR_STONEWATCH',
    tileMap: TileMap,
    dungeonMap: DungeonMap,
    player: Player,
    monsters: Monster[],
    chests: Chest[],
    caveEntranceX: number,
    caveEntranceY: number,
    guildX: number,
    guildY: number,
    blacksmithX: number,
    blacksmithY: number,
    dungeonFloor2?: DungeonFloor2,
    dungeonFloor3?: DungeonFloor3,
    dungeonEldoria?: DungeonEldoria,
    dungeonStonewatch?: DungeonStonewatch,
    continentValoria?: ContinentValoria
  ): void {
    ctx.save();

    if (this.mode === 'MINIMIZED') {
      // Tombol kecil untuk buka mini-map
      const bx = screenWidth - 110;
      const by = 52;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bx, by, 60, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗺️ PETA', bx + 30, by + 12);
      ctx.restore();
      return;
    }

    // Siapkan cache offscreen jika belum tersedia
    if (!this.overworldCanvas) {
      this.overworldCanvas = this.generateOverworldCache(tileMap);
    }
    if (!this.dungeonCanvas) {
      this.dungeonCanvas = this.generateDungeonCache(dungeonMap);
    }
    if (dungeonFloor2 && !this.floor2Canvas) {
      this.floor2Canvas = this.generateFloor2Cache(dungeonFloor2);
    }
    if (dungeonFloor3 && !this.floor3Canvas) {
      this.floor3Canvas = this.generateFloor3Cache(dungeonFloor3);
    }
    if (dungeonEldoria && !this.eldoriaCanvas) {
      this.eldoriaCanvas = this.generateEldoriaCache(dungeonEldoria);
    }
    if (dungeonStonewatch && !this.stonewatchCanvas) {
      this.stonewatchCanvas = this.generateStonewatchCache(dungeonStonewatch);
    }
    if (continentValoria && !this.valoriaCanvas) {
      this.valoriaCanvas = this.generateValoriaCache(continentValoria);
    }

    const pTileX = player.x / CONSTANTS.TILE_SIZE;
    const pTileY = player.y / CONSTANTS.TILE_SIZE;

    const isOverworld = currentMap === 'OVERWORLD';
    let sourceCanvas = this.overworldCanvas;
    let mapTileWidth = CONSTANTS.MAP_WIDTH;
    let mapTileHeight = CONSTANTS.MAP_HEIGHT;

    const currentRegion = RegionManager.getInstance().getRegion(currentMap, Math.floor(pTileX), Math.floor(pTileY));
    let mapTitle = `${currentRegion.icon} ${currentRegion.name}`;
    let fullMapTitle = `${currentRegion.icon} ${currentRegion.name} ${currentRegion.subtitle}`;
    let titleColor = currentRegion.themeColor;

    if (currentMap.startsWith('INTERIOR_')) {
      if (!this.interiorCanvas) {
        this.interiorCanvas = document.createElement('canvas');
        this.interiorCanvas.width = 24;
        this.interiorCanvas.height = 18;
        const ictx = this.interiorCanvas.getContext('2d')!;
        ictx.fillStyle = '#0f172a';
        ictx.fillRect(0, 0, 24, 18);
        ictx.fillStyle = '#78350f';
        ictx.fillRect(2, 2, 20, 14);
      }
      sourceCanvas = this.interiorCanvas;

      if (currentMap === 'INTERIOR_GUILD') {
        mapTitle = '🏛️ Balai Serikat';
        fullMapTitle = '🏛️ Balai Besar Serikat Petualang Oakhaven';
        titleColor = '#facc15';
        mapTileWidth = 18;
        mapTileHeight = 14;
      } else if (currentMap === 'INTERIOR_BLACKSMITH') {
        mapTitle = '⚒️ Bengkel Besi';
        fullMapTitle = '⚒️ Bengkel Pandai Besi Master Brokk';
        titleColor = '#fb923c';
        mapTileWidth = 16;
        mapTileHeight = 12;
      } else if (currentMap === 'INTERIOR_APOTHECARY') {
        mapTitle = '🍃 Toko Ramuan & Inn';
        fullMapTitle = '🍃 Toko Ramuan Mistis & Penginapan Lily';
        titleColor = '#34d399';
        mapTileWidth = 16;
        mapTileHeight = 12;
      } else if (currentMap === 'INTERIOR_KITCHEN') {
        mapTitle = '🍳 Dapur Petualang';
        fullMapTitle = '🍳 Dapur & Kedai Kuliner Petualang Chef Gaston';
        titleColor = '#f59e0b';
        mapTileWidth = 16;
        mapTileHeight = 12;
      } else if (currentMap === 'INTERIOR_BANK') {
        mapTitle = '🏦 Bank Royal Val';
        fullMapTitle = '🏦 Bank Kerajaan Oakhaven & Brankas Val';
        titleColor = '#38bdf8';
        mapTileWidth = 18;
        mapTileHeight = 13;
      } else if (currentMap === 'INTERIOR_ELDORIA') {
        mapTitle = '🌿 Pondok Roh';
        fullMapTitle = '🌿 Pondok Suci Tetua Roh Hutan Eldoria';
        titleColor = '#4ade80';
        mapTileWidth = 18;
        mapTileHeight = 13;
      } else if (currentMap === 'INTERIOR_STONEWATCH') {
        mapTitle = '⛏️ Barak Tambang';
        fullMapTitle = '⛏️ Markas Komando Tambang Stonewatch';
        titleColor = '#f59e0b';
        mapTileWidth = 18;
        mapTileHeight = 13;
      }
    } else if (currentMap === 'DUNGEON') {
      sourceCanvas = this.dungeonCanvas!;
      mapTileWidth = dungeonMap.width;
      mapTileHeight = dungeonMap.height;
      mapTitle = '🏰 Goa Lt.1';
      fullMapTitle = '🏰 Peta Goa Makam Purba (Lantai 1)';
      titleColor = '#c084fc';
    } else if (currentMap === 'DUNGEON_FLOOR_2') {
      sourceCanvas = this.floor2Canvas || this.dungeonCanvas!;
      mapTileWidth = dungeonFloor2 ? dungeonFloor2.width : 40;
      mapTileHeight = dungeonFloor2 ? dungeonFloor2.height : 40;
      mapTitle = '⚡ Makam Lt.2';
      fullMapTitle = '⚡ Peta Labirin Titan Abisal (Lantai 2)';
      titleColor = '#60a5fa';
    } else if (currentMap === 'DUNGEON_FLOOR_3') {
      sourceCanvas = this.floor3Canvas || this.dungeonCanvas!;
      mapTileWidth = dungeonFloor3 ? dungeonFloor3.width : 40;
      mapTileHeight = dungeonFloor3 ? dungeonFloor3.height : 40;
      mapTitle = '🔥 Neraka Lt.3';
      fullMapTitle = '🔥 Peta Sanctuarium Neraka Abisal (Lantai 3)';
      titleColor = '#f97316';
    } else if (currentMap === 'DUNGEON_ELDORIA') {
      sourceCanvas = this.eldoriaCanvas || this.dungeonCanvas!;
      mapTileWidth = dungeonEldoria ? dungeonEldoria.width : 36;
      mapTileHeight = dungeonEldoria ? dungeonEldoria.height : 36;
      mapTitle = '🌿 Kuil Eldoria';
      fullMapTitle = '🌿 Peta Kuil Roh Hutan Purba Eldoria';
      titleColor = '#34d399';
    } else if (currentMap === 'DUNGEON_STONEWATCH') {
      sourceCanvas = this.stonewatchCanvas || this.dungeonCanvas!;
      mapTileWidth = dungeonStonewatch ? dungeonStonewatch.width : 36;
      mapTileHeight = dungeonStonewatch ? dungeonStonewatch.height : 36;
      mapTitle = '⛏️ Tambang';
      fullMapTitle = '⛏️ Peta Tambang Terkutuk Besi Abisal Stonewatch';
      titleColor = '#f59e0b';
    } else if (currentMap === 'CONTINENT_VALORIA') {
      sourceCanvas = this.valoriaCanvas || this.overworldCanvas;
      mapTileWidth = continentValoria ? continentValoria.width : 120;
      mapTileHeight = continentValoria ? continentValoria.height : 120;
      mapTitle = '🌍 Valoria';
      fullMapTitle = '🌍 Peta Benua Mistis Valoria (Dunia Baru)';
      titleColor = '#f59e0b';
    }

    // --- MODE NORMAL (POJOK KANAN ATAS HUD) ---
    if (this.mode === 'NORMAL') {
      const mw = 104;
      const mh = 74;
      const mx = screenWidth - mw - 10;
      const my = 52;

      // Background container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(mx, my, mw, mh, 8);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Judul Mini-map
      ctx.fillStyle = titleColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(mapTitle, mx + 6, my + 4);

      // Label Perbesar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🔍 [Ketuk]', mx + mw - 6, my + 4);

      // Area Peta Terpotong (Viewport Radar berpusat pada Pemain)
      const radarX = mx + 6;
      const radarY = my + 16;
      const radarW = mw - 12;
      const radarH = mh - 22;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(radarX, radarY, radarW, radarH, 4);
      ctx.clip();

      // Gambar terrain radar
      const viewTileRadius = 24;
      const srcX = Math.max(0, Math.min(mapTileWidth - viewTileRadius * 2, pTileX - viewTileRadius));
      const srcY = Math.max(0, Math.min(mapTileHeight - viewTileRadius * 2, pTileY - viewTileRadius));
      const srcW = viewTileRadius * 2;
      const srcH = viewTileRadius * 2;

      ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, radarX, radarY, radarW, radarH);

      // Hitung fungsi proyeksi tile ke koordinat radar
      const toRadarX = (tx: number) => radarX + ((tx - srcX) / srcW) * radarW;
      const toRadarY = (ty: number) => radarY + ((ty - srcY) / srcH) * radarH;

      // 1. Tampilkan Titik Ikon Khusus di Overworld / Dungeon Floors
      if (isOverworld) {
        // Guild Elaine (Emas)
        const gx = toRadarX(guildX / CONSTANTS.TILE_SIZE);
        const gy = toRadarY(guildY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(gx - 2, gy - 2, 4, 4);

        // Pandai Besi Brokk (Oranye)
        const bx = toRadarX(blacksmithX / CONSTANTS.TILE_SIZE);
        const by = toRadarY(blacksmithY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(bx - 2, by - 2, 4, 4);

        // Pintu Masuk Goa (Ungu)
        const cx = toRadarX(caveEntranceX);
        const cy = toRadarY(caveEntranceY);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pintu Kuil Eldoria (Hijau)
        const ex = toRadarX(21);
        const ey = toRadarY(13);
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pintu Tambang Stonewatch (Oranye)
        const mx = toRadarX(85);
        const my = toRadarY(58);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 'DUNGEON') {
        // Tangga Keluar Dungeon ke Permukaan (Ungu Bercahaya)
        const lx = toRadarX(dungeonMap.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toRadarY(dungeonMap.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tangga ke Lantai 2 jika terbuka
        if (dungeonMap.isFloor2Unlocked) {
          const s2x = toRadarX(dungeonMap.floor2LadderX / CONSTANTS.TILE_SIZE);
          const s2y = toRadarY(dungeonMap.floor2LadderY / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(s2x, s2y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentMap === 'DUNGEON_FLOOR_2' && dungeonFloor2) {
        // Tangga kembali ke Lantai 1
        const lx = toRadarX(dungeonFloor2.ladderUpX / CONSTANTS.TILE_SIZE);
        const ly = toRadarY(dungeonFloor2.ladderUpY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Portal Lantai 3 jika terbuka
        if (dungeonFloor2.isFloor3Unlocked) {
          const px = toRadarX(dungeonFloor2.floor3PortalX / CONSTANTS.TILE_SIZE);
          const py = toRadarY(dungeonFloor2.floor3PortalY / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentMap === 'DUNGEON_FLOOR_3' && dungeonFloor3) {
        // Portal kembali ke Lantai 2
        const px = toRadarX(dungeonFloor3.portalUpX / CONSTANTS.TILE_SIZE);
        const py = toRadarY(dungeonFloor3.portalUpY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 'DUNGEON_ELDORIA' && dungeonEldoria) {
        // Tangga kembali ke Desa Eldoria
        const lx = toRadarX(dungeonEldoria.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toRadarY(dungeonEldoria.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 'DUNGEON_STONEWATCH' && dungeonStonewatch) {
        // Tangga kembali ke Desa Stonewatch
        const lx = toRadarX(dungeonStonewatch.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toRadarY(dungeonStonewatch.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap.startsWith('INTERIOR_')) {
        // Pintu Keluar Ruangan Interior (Kuning)
        const dx = toRadarX(mapTileWidth / 2);
        const dy = toRadarY(mapTileHeight - 1.5);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Peti Harta Karun (Kuning Bintang)
      for (const chest of chests) {
        if (!chest.isOpen) {
          const cx = toRadarX(chest.x / CONSTANTS.TILE_SIZE);
          const cy = toRadarY(chest.y / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Monster (Titik Berkedip sesuai Tingkat Monster)
      const pulse = (Math.sin(this.pulseTimer * 8) + 1) * 0.5;
      for (const m of monsters) {
        if (!m.isDead) {
          const mx = toRadarX(m.x / CONSTANTS.TILE_SIZE);
          const my = toRadarY(m.y / CONSTANTS.TILE_SIZE);
          let mColor = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
          let radius = 2.2;

          if (m.type === 'BOSS_INFERNAL_DRAGON') {
            mColor = '#f97316';
            radius = 4.5;
          } else if (m.type === 'BOSS_TITAN_GOLEM') {
            mColor = '#ef4444';
            radius = 4;
          } else if (m.type === 'BOSS_SLIME') {
            mColor = '#ec4899';
            radius = 3.5;
          } else if (m.type === 'BOSS_ANCIENT_ENT') {
            mColor = '#10b981';
            radius = 4.2;
          } else if (m.type === 'BOSS_OBSIDIAN_BEHEMOTH') {
            mColor = '#8b5cf6';
            radius = 4.2;
          } else if (isOverworld) {
            mColor = m.tier === 'MID' ? `rgba(245, 158, 11, ${0.7 + pulse * 0.3})` : `rgba(34, 197, 94, ${0.7 + pulse * 0.3})`;
          } else if (m.tier === 'HIGH') {
            mColor = `rgba(168, 85, 247, ${0.7 + pulse * 0.3})`;
          }

          ctx.fillStyle = mColor;
          ctx.beginPath();
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Posisi Pemain (Titik Cyan Terang dengan Panah Arah)
      const plRadarX = toRadarX(pTileX);
      const plRadarY = toRadarY(pTileY);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(plRadarX, plRadarY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Panah arah hadap pemain
      let dx = 0;
      let dy = 0;
      if (player.direction === 'up') dy = -4;
      else if (player.direction === 'down') dy = 4;
      else if (player.direction === 'left') dx = -4;
      else dx = 4;

      ctx.strokeStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(plRadarX, plRadarY);
      ctx.lineTo(plRadarX + dx, plRadarY + dy);
      ctx.stroke();

      ctx.restore();
    }

    // --- MODE EXPANDED (MODAL PETA BESAR DI TENGAH LAYAR) ---
    else if (this.mode === 'EXPANDED') {
      const mw = Math.min(500, screenWidth - 30);
      const mh = Math.min(310, screenHeight - 20);
      const mx = (screenWidth - mw) / 2;
      const my = (screenHeight - mh) / 2;

      // Background Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, screenWidth, screenHeight);

      // Modal Container
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(mx, my, mw, mh, 10);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Header Bar
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(mx, my, mw, 36, [10, 10, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fullMapTitle, mx + 16, my + 18);

      // Tombol Tutup (X)
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✕', mx + mw - 20, my + 18);

      // Area Tampilan Peta
      const mapDisplayW = mh - 56;
      const mapDisplayH = mh - 56;
      const mapDisplayX = mx + 16;
      const mapDisplayY = my + 44;

      // Bingkai Peta
      ctx.fillStyle = '#020617';
      ctx.fillRect(mapDisplayX - 2, mapDisplayY - 2, mapDisplayW + 4, mapDisplayH + 4);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mapDisplayX - 2, mapDisplayY - 2, mapDisplayW + 4, mapDisplayH + 4);

      // Gambar seluruh peta utuh
      ctx.drawImage(sourceCanvas, 0, 0, mapTileWidth, mapTileHeight, mapDisplayX, mapDisplayY, mapDisplayW, mapDisplayH);

      const toMapX = (tx: number) => mapDisplayX + (tx / mapTileWidth) * mapDisplayW;
      const toMapY = (ty: number) => mapDisplayY + (ty / mapTileHeight) * mapDisplayH;

      // Gambar Landmark di Peta
      if (isOverworld) {
        // Guild Elaine
        const gx = toMapX(guildX / CONSTANTS.TILE_SIZE);
        const gy = toMapY(guildY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pandai Besi
        const bx = toMapX(blacksmithX / CONSTANTS.TILE_SIZE);
        const by = toMapY(blacksmithY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pintu Masuk Goa
        const cx = toMapX(caveEntranceX);
        const cy = toMapY(caveEntranceY);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Dusun Nelayan Tirta Kencana (Marker)
        const tkX = toMapX(33);
        const tkY = toMapY(73);
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(tkX, tkY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dusun Pertanian Ambervale (Marker)
        const avX = toMapX(77);
        const avY = toMapY(25);
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(avX, avY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Desa Eldoria (Marker)
        const elX = toMapX(22);
        const elY = toMapY(20);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(elX, elY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Desa Stonewatch (Marker)
        const swX = toMapX(84);
        const swY = toMapY(65);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(swX, swY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label Nama-Nama Wilayah Utama di Canvas Peta Besar
        const regionLabels = [
          { name: '🌿 Eldoria', x: 22, y: 15, color: '#6ee7b7' },
          { name: '🏰 Oakhaven', x: 50, y: 44, color: '#fde047' },
          { name: '🎪 Pasar Raya', x: 68, y: 44, color: '#fef08a' },
          { name: '⛏️ Stonewatch', x: 84, y: 58, color: '#fdba74' },
          { name: '🐟 Tirta Kencana', x: 33, y: 69, color: '#67e8f9' },
          { name: '🌾 Ambervale', x: 77, y: 19, color: '#fde047' },
          { name: '💀 Gua Kripta', x: 50, y: 28, color: '#d8b4fe' },
          { name: '🌊 Danau Azure', x: 36, y: 84, color: '#7dd3fc' },
          { name: '🌲 Whisperwood', x: 18, y: 48, color: '#86efac' },
          { name: '🪨 Cadas Karang', x: 88, y: 44, color: '#cbd5e1' }
        ];

        ctx.save();
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const rl of regionLabels) {
          const rx = toMapX(rl.x);
          const ry = toMapY(rl.y);
          const tw = ctx.measureText(rl.name).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(rx - tw / 2 - 2, ry - 5, tw + 4, 10, 2);
          ctx.fill();
          ctx.fillStyle = rl.color;
          ctx.fillText(rl.name, rx, ry);
        }
        ctx.restore();
      } else if (currentMap === 'DUNGEON') {
        // Tangga Keluar Dungeon ke Permukaan
        const lx = toMapX(dungeonMap.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toMapY(dungeonMap.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (dungeonMap.isFloor2Unlocked) {
          const s2x = toMapX(dungeonMap.floor2LadderX / CONSTANTS.TILE_SIZE);
          const s2y = toMapY(dungeonMap.floor2LadderY / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(s2x, s2y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentMap === 'DUNGEON_FLOOR_2' && dungeonFloor2) {
        const lx = toMapX(dungeonFloor2.ladderUpX / CONSTANTS.TILE_SIZE);
        const ly = toMapY(dungeonFloor2.ladderUpY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();

        if (dungeonFloor2.isFloor3Unlocked) {
          const px = toMapX(dungeonFloor2.floor3PortalX / CONSTANTS.TILE_SIZE);
          const py = toMapY(dungeonFloor2.floor3PortalY / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentMap === 'DUNGEON_FLOOR_3' && dungeonFloor3) {
        const px = toMapX(dungeonFloor3.portalUpX / CONSTANTS.TILE_SIZE);
        const py = toMapY(dungeonFloor3.portalUpY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 'DUNGEON_ELDORIA' && dungeonEldoria) {
        const lx = toMapX(dungeonEldoria.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toMapY(dungeonEldoria.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (currentMap === 'DUNGEON_STONEWATCH' && dungeonStonewatch) {
        const lx = toMapX(dungeonStonewatch.ladderX / CONSTANTS.TILE_SIZE);
        const ly = toMapY(dungeonStonewatch.ladderY / CONSTANTS.TILE_SIZE);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (currentMap.startsWith('INTERIOR_')) {
        const lx = toMapX(mapTileWidth / 2);
        const ly = toMapY(mapTileHeight - 1.5);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Peti Harta Karun
      for (const chest of chests) {
        if (!chest.isOpen) {
          const cx = toMapX(chest.x / CONSTANTS.TILE_SIZE);
          const cy = toMapY(chest.y / CONSTANTS.TILE_SIZE);
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Monster
      for (const m of monsters) {
        if (!m.isDead) {
          const mxPos = toMapX(m.x / CONSTANTS.TILE_SIZE);
          const myPos = toMapY(m.y / CONSTANTS.TILE_SIZE);
          let mColor = '#ef4444';
          let mRadius = 2.5;

          if (m.type === 'BOSS_INFERNAL_DRAGON') {
            mColor = '#f97316';
            mRadius = 6;
          } else if (m.type === 'BOSS_TITAN_GOLEM') {
            mColor = '#ef4444';
            mRadius = 5.5;
          } else if (m.type === 'BOSS_SLIME') {
            mColor = '#ec4899';
            mRadius = 5;
          } else if (m.type === 'BOSS_ANCIENT_ENT') {
            mColor = '#10b981';
            mRadius = 5.5;
          } else if (m.type === 'BOSS_OBSIDIAN_BEHEMOTH') {
            mColor = '#8b5cf6';
            mRadius = 5.5;
          } else if (isOverworld) {
            mColor = m.tier === 'MID' ? '#f59e0b' : '#22c55e';
            mRadius = m.tier === 'MID' ? 3.5 : 2.5;
          } else if (m.tier === 'HIGH') {
            mColor = '#a855f7';
            mRadius = 3.5;
          }

          ctx.fillStyle = mColor;
          ctx.beginPath();
          ctx.arc(mxPos, myPos, mRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pemain
      const plX = toMapX(pTileX);
      const plY = toMapY(pTileY);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(plX, plY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Legend Info di Kolom Kanan
      const legX = mapDisplayX + mapDisplayW + 16;
      const legY = my + 50;

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📌 Keterangan Simbol:', legX, legY);

      let legends = [
        { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
        { color: '#eab308', label: 'Guild & Alun-Alun Oakhaven' },
        { color: '#06b6d4', label: 'Dusun Tirta Kencana (Danau)' },
        { color: '#ca8a04', label: 'Dusun Ambervale (Kincir)' },
        { color: '#10b981', label: 'Desa Rimba Peri Eldoria' },
        { color: '#f97316', label: 'Benteng Tambang Stonewatch' },
        { color: '#c084fc', label: 'Pintu Gua Makam Kuno' },
        { color: '#fde047', label: 'Peti Harta Karun' },
        { color: '#22c55e', label: 'Monster Rimba Liar' }
      ];

      if (currentMap === 'DUNGEON') {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#c084fc', label: 'Tangga Keluar Permukaan' },
          { color: '#60a5fa', label: 'Tangga Menuju Lantai 2' },
          { color: '#ec4899', label: 'Altar Raja Slime (Bos Lt.1)' },
          { color: '#ef4444', label: 'Monster Goa Makam' },
          { color: '#fde047', label: 'Peti Harta Karun' }
        ];
      } else if (currentMap === 'DUNGEON_FLOOR_2') {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#c084fc', label: 'Tangga Kembali ke Lantai 1' },
          { color: '#f97316', label: 'Portal Magma ke Lantai 3' },
          { color: '#ef4444', label: 'Titan Abisal Kolosal (Bos Lt.2)' },
          { color: '#a855f7', label: 'Monster Makam Kuno' },
          { color: '#fde047', label: 'Peti Harta Karun' }
        ];
      } else if (currentMap === 'DUNGEON_FLOOR_3') {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#38bdf8', label: 'Portal Kembali ke Lantai 2' },
          { color: '#f97316', label: 'Raja Naga Api Ignis (Bos Lt.3)' },
          { color: '#a855f7', label: 'Monster Neraka Abisal' },
          { color: '#fde047', label: 'Peti Harta Karun' }
        ];
      } else if (currentMap === 'DUNGEON_ELDORIA') {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#34d399', label: 'Tangga Keluar ke Desa Eldoria' },
          { color: '#10b981', label: 'Ent Purba Pelindung Hutan (Bos)' },
          { color: '#4ade80', label: 'Monster Roh Hutan Purba' },
          { color: '#fde047', label: 'Peti Harta Karun' }
        ];
      } else if (currentMap === 'DUNGEON_STONEWATCH') {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#f59e0b', label: 'Tangga Keluar ke Stonewatch' },
          { color: '#8b5cf6', label: 'Obsidian Behemoth Abisal (Bos)' },
          { color: '#fb923c', label: 'Monster Tambang Terkutuk' },
          { color: '#fde047', label: 'Peti Harta Karun' }
        ];
      } else if (currentMap.startsWith('INTERIOR_')) {
        legends = [
          { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
          { color: '#facc15', label: 'Pintu Keluar ke Desa' },
          { color: '#eab308', label: 'NPC / Kasir / Tempa Utama' },
          { color: '#34d399', label: 'Tempat Tidur / Perabot Suci' }
        ];
      }

      legends.forEach((item, idx) => {
        const itemY = legY + 22 + idx * 24;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legX + 8, itemY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px sans-serif';
        ctx.fillText(item.label, legX + 20, itemY + 4);
      });

      // Koordinat Pemain
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`Koordinat: Tile (${Math.floor(pTileX)}, ${Math.floor(pTileY)})`, legX, my + mh - 16);
    }

    ctx.restore();
  }
}
