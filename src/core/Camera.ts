import { CONSTANTS } from './Constants.ts';

/**
 * Camera - Sistem Kamera 2D Anti-Motion Sickness & Zero-Jitter
 * Mengunci dan melacak pergerakan pemain secara mulus, presisi, dan 100% stabil tanpa getaran liar.
 */
export class Camera {
  public x: number = 0;
  public y: number = 0;

  public viewportWidth: number;
  public viewportHeight: number;
  public worldWidth: number = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE;
  public worldHeight: number = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /**
   * Screen shake dinonaktifkan sepenuhnya untuk mencegah pusing & motion sickness
   */
  public shake(_intensity: number = 0, _duration: number = 0): void {
    // 100% silent & zero shake - menjaga stabilitas layar penuh
  }

  public stopShake(): void {
    // no-op
  }

  public setWorldBounds(widthPx: number, heightPx: number): void {
    this.worldWidth = widthPx;
    this.worldHeight = heightPx;
  }

  /**
   * Pindahkan kamera seketika ke target (misal saat teleport / ganti map)
   */
  public snapTo(targetX: number, targetY: number): void {
    this.update(targetX, targetY);
  }

  /**
   * Update pelacakan kamera: Terkunci langsung (Tight Lock-On)
   * Karakter berada stabil di tengah layar tanpa desinkronisasi kecepatan, tanpa lag, dan tanpa jitter
   */
  public update(targetX: number, targetY: number, _deltaTime: number = 0.016): void {
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    if (this.worldWidth > this.viewportWidth) {
      this.x = Math.max(0, Math.min(desiredX, this.worldWidth - this.viewportWidth));
    } else {
      this.x = (this.worldWidth - this.viewportWidth) / 2;
    }

    if (this.worldHeight > this.viewportHeight) {
      this.y = Math.max(0, Math.min(desiredY, this.worldHeight - this.viewportHeight));
    } else {
      this.y = (this.worldHeight - this.viewportHeight) / 2;
    }
  }

  public resize(newWidth: number, newHeight: number): void {
    this.viewportWidth = newWidth;
    this.viewportHeight = newHeight;
  }
}
