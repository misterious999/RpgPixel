import { CONSTANTS } from '../core/Constants.ts';
import { Player } from '../entities/Player.ts';
import { Monster } from '../entities/Monster.ts';
import { Chest } from '../world/Chest.ts';
import { TileMap, TileType } from '../world/TileMap.ts';
import { DungeonMap } from '../world/DungeonMap.ts';

export type MiniMapMode = 'NORMAL' | 'EXPANDED' | 'MINIMIZED';

export class MiniMapUI {
  public mode: MiniMapMode = 'NORMAL';

  // Cache offscreen canvases for terrain so we don't redraw 10,000 tiles every frame!
  private overworldCanvas: HTMLCanvasElement | null = null;
  private dungeonCanvas: HTMLCanvasElement | null = null;

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
   * Menghasilkan peta statis dungeon
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
      if (touchX >= x + w - 38 && touchX <= x + w - 6 && touchY >= y + 4 && touchY <= y + 36) {
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
    currentMap: 'OVERWORLD' | 'DUNGEON',
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
    blacksmithY: number
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

    const isOverworld = currentMap === 'OVERWORLD';
    const sourceCanvas = isOverworld ? this.overworldCanvas : this.dungeonCanvas;
    const mapTileWidth = isOverworld ? CONSTANTS.MAP_WIDTH : dungeonMap.width;
    const mapTileHeight = isOverworld ? CONSTANTS.MAP_HEIGHT : dungeonMap.height;

    const pTileX = player.x / CONSTANTS.TILE_SIZE;
    const pTileY = player.y / CONSTANTS.TILE_SIZE;

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
      ctx.fillStyle = isOverworld ? '#4ade80' : '#c084fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(isOverworld ? '🌍 Lembah' : '🏰 Goa B.T.', mx + 6, my + 4);

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
      const viewTileRadius = 24; // Luas tile yang terlihat di radar
      const srcX = Math.max(0, Math.min(mapTileWidth - viewTileRadius * 2, pTileX - viewTileRadius));
      const srcY = Math.max(0, Math.min(mapTileHeight - viewTileRadius * 2, pTileY - viewTileRadius));
      const srcW = viewTileRadius * 2;
      const srcH = viewTileRadius * 2;

      ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, radarX, radarY, radarW, radarH);

      // Hitung fungsi proyeksi tile ke koordinat radar
      const toRadarX = (tx: number) => radarX + ((tx - srcX) / srcW) * radarW;
      const toRadarY = (ty: number) => radarY + ((ty - srcY) / srcH) * radarH;

      // 1. Tampilkan Titik Ikon Khusus di Overworld
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
          if (m.type === 'BOSS_SLIME') {
            mColor = '#f43f5e';
          } else if (isOverworld) {
            mColor = m.tier === 'MID' ? `rgba(245, 158, 11, ${0.7 + pulse * 0.3})` : `rgba(34, 197, 94, ${0.7 + pulse * 0.3})`;
          }
          ctx.fillStyle = mColor;
          ctx.beginPath();
          ctx.arc(mx, my, m.type === 'BOSS_SLIME' ? 3.5 : 2.2, 0, Math.PI * 2);
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
      ctx.fillText(isOverworld ? '🗺️ Peta Wilayah Lembah Serikat' : '🏰 Peta Goa Bawah Tanah Tingkat 1', mx + 16, my + 18);

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
          if (m.type === 'BOSS_SLIME') {
            mColor = '#f43f5e';
          } else if (isOverworld) {
            mColor = m.tier === 'MID' ? '#f59e0b' : '#22c55e';
          }
          ctx.fillStyle = mColor;
          ctx.beginPath();
          ctx.arc(mxPos, myPos, m.type === 'BOSS_SLIME' ? 5 : (m.tier === 'MID' ? 3.5 : 2.5), 0, Math.PI * 2);
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

      const legends = isOverworld
        ? [
            { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
            { color: '#eab308', label: 'Resepsionis Guild Elaine' },
            { color: '#f97316', label: 'Pandai Besi Brokk' },
            { color: '#c084fc', label: 'Pintu Goa (Dungeon)' },
            { color: '#fde047', label: 'Peti Harta Karun' },
            { color: '#22c55e', label: 'Monster Tingkat Bawah (Rimba Luar)' },
            { color: '#f59e0b', label: 'Monster Tingkat Menengah (Sekitar Dungeon)' }
          ]
        : [
            { color: '#38bdf8', label: 'Posisi Kamu (Hero)' },
            { color: '#c084fc', label: 'Tangga Keluar Permukaan' },
            { color: '#f43f5e', label: 'Altar Raja Slime (Bos)' },
            { color: '#ef4444', label: 'Monster Goa' },
            { color: '#fde047', label: 'Peti Rahasia Bawah Tanah' }
          ];

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
