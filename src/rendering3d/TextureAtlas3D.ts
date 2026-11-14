import * as THREE from 'three';

/**
 * TextureAtlas3D
 * Menghasilkan tekstur procedural pixel-art otentik untuk material 3D Three.js.
 * Menggunakan NearestFilter agar pixel art tetap tajam dan tidak buram pada perspektif 3D.
 */
export class TextureAtlas3D {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  public static getTexture(type: string): THREE.CanvasTexture {
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    switch (type) {
      case 'GRASS':
        this.drawGrass(ctx);
        break;
      case 'DIRT_PATH':
        this.drawDirt(ctx);
        break;
      case 'SAND':
        this.drawSand(ctx);
        break;
      case 'COBBLESTONE':
        this.drawCobblestone(ctx);
        break;
      case 'WOOD':
        this.drawWood(ctx);
        break;
      case 'CLIFF':
        this.drawCliff(ctx);
        break;
      case 'WATER':
        this.drawWater(ctx);
        break;
      case 'SNOW':
        this.drawSnow(ctx);
        break;
      case 'ICE':
        this.drawIce(ctx);
        break;
      case 'CRYSTAL_SOIL':
        this.drawCrystalSoil(ctx);
        break;
      case 'SAVANNA':
        this.drawSavanna(ctx);
        break;
      case 'DUNGEON_WALL':
        this.drawDungeonWall(ctx);
        break;
      case 'DUNGEON_FLOOR':
        this.drawDungeonFloor(ctx);
        break;
      default:
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, 0, 32, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set(type, texture);
    return texture;
  }

  private static drawGrass(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3f7832';
    ctx.fillRect(0, 0, 32, 32);

    // Variasi helai rumput
    ctx.fillStyle = '#4c8c3e';
    for (let i = 0; i < 18; i++) {
      const rx = (i * 7) % 30;
      const ry = (i * 11) % 30;
      ctx.fillRect(rx, ry, 2, 3);
    }

    ctx.fillStyle = '#346628';
    for (let i = 0; i < 12; i++) {
      const rx = (i * 13 + 5) % 30;
      const ry = (i * 9 + 3) % 30;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  private static drawDirt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8a623a';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#73502d';
    for (let i = 0; i < 16; i++) {
      const rx = (i * 9) % 30;
      const ry = (i * 13) % 30;
      ctx.fillRect(rx, ry, 2, 2);
    }

    ctx.fillStyle = '#a07447';
    for (let i = 0; i < 10; i++) {
      const rx = (i * 11 + 3) % 30;
      const ry = (i * 7 + 7) % 30;
      ctx.fillRect(rx, ry, 2, 1);
    }
  }

  private static drawSand(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d4b46a';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#c2a156';
    for (let i = 0; i < 20; i++) {
      const rx = (i * 11) % 31;
      const ry = (i * 7) % 31;
      ctx.fillRect(rx, ry, 1, 1);
    }

    ctx.fillStyle = '#e6c880';
    for (let i = 0; i < 15; i++) {
      const rx = (i * 13 + 2) % 31;
      const ry = (i * 5 + 4) % 31;
      ctx.fillRect(rx, ry, 1, 1);
    }
  }

  private static drawCobblestone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Pola batu paving bata
    for (let y = 0; y < 32; y += 8) {
      const offsetX = (y / 8) % 2 === 0 ? 0 : 4;
      for (let x = -4; x < 32; x += 8) {
        ctx.strokeRect(x + offsetX, y, 7, 7);
        ctx.fillStyle = ((x + y) % 3 === 0) ? '#475569' : '#64748b';
        ctx.fillRect(x + offsetX + 1, y + 1, 5, 5);
      }
    }
  }

  private static drawWood(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#784e2d';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#5c391d';
    for (let y = 0; y < 32; y += 6) {
      ctx.fillRect(0, y, 32, 1);
    }

    ctx.fillStyle = '#8f5f37';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect((i * 11) % 28, (i * 7) % 30, 4, 1);
    }
  }

  private static drawCliff(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#334155';
    for (let y = 0; y < 32; y += 4) {
      ctx.fillRect(0, y, 32, 1);
      ctx.fillRect((y * 5) % 28, y, 6, 2);
    }

    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i * 7) % 28, (i * 11) % 28, 3, 2);
    }
  }

  private static drawWater(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#3b82f6';
    for (let i = 0; i < 12; i++) {
      const rx = (i * 13) % 28;
      const ry = (i * 8) % 28;
      ctx.fillRect(rx, ry, 4, 1);
    }

    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 6; i++) {
      const rx = (i * 9 + 4) % 28;
      const ry = (i * 11 + 2) % 28;
      ctx.fillRect(rx, ry, 2, 1);
    }
  }

  private static drawSnow(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#f8fafc';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 11) % 31, (i * 7) % 31, 2, 2);
    }

    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i * 13 + 3) % 31, (i * 9 + 5) % 31, 2, 1);
    }
  }

  private static drawIce(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.lineTo(16, 12);
    ctx.lineTo(28, 8);
    ctx.stroke();

    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(8, 20, 8, 3);
  }

  private static drawCrystalSoil(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#312e81';
    ctx.fillRect(0, 0, 32, 32);

    // Partikel kristal berpendar
    ctx.fillStyle = '#a855f7';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect((i * 11) % 30, (i * 7) % 30, 2, 2);
    }

    ctx.fillStyle = '#c084fc';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect((i * 13 + 4) % 30, (i * 9 + 2) % 30, 1, 1);
    }
  }

  private static drawSavanna(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#a1a04a';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#8f8e3c';
    for (let i = 0; i < 16; i++) {
      ctx.fillRect((i * 9) % 30, (i * 13) % 30, 2, 2);
    }

    ctx.fillStyle = '#b8b759';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i * 11 + 3) % 30, (i * 7 + 5) % 30, 2, 1);
    }
  }

  private static drawDungeonWall(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let y = 0; y < 32; y += 8) {
      const offsetX = (y / 8) % 2 === 0 ? 0 : 8;
      for (let x = -8; x < 32; x += 16) {
        ctx.strokeRect(x + offsetX, y, 15, 7);
      }
    }
  }

  private static drawDungeonFloor(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 16, 16);
    ctx.strokeRect(16, 0, 16, 16);
    ctx.strokeRect(0, 16, 16, 16);
    ctx.strokeRect(16, 16, 16, 16);
  }
}
