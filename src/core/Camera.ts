import { CONSTANTS } from './Constants.ts';

export class Camera {
  // Posisi dasar kamera (pelacakan halus terbebas dari getaran)
  private baseX: number = 0;
  private baseY: number = 0;

  // Posisi aktual kamera untuk rendering (base + shake)
  public x: number = 0;
  public y: number = 0;

  public viewportWidth: number;
  public viewportHeight: number;
  public worldWidth: number = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE;
  public worldHeight: number = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE;
  private lerpSpeed: number = 0.14;

  // Dynamic Screen Shake
  private shakeTimer: number = 0;
  private shakeDuration: number = 0.18;
  private shakeIntensity: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public shake(intensity: number = 2.5, duration: number = 0.14): void {
    // Batasi intensitas agar tidak memusingkan dan tidak bergetar liar
    this.shakeIntensity = Math.min(intensity, 3.5);
    this.shakeDuration = Math.max(0.06, duration);
    this.shakeTimer = this.shakeDuration;
  }

  public stopShake(): void {
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  public setWorldBounds(widthPx: number, heightPx: number): void {
    this.worldWidth = widthPx;
    this.worldHeight = heightPx;
  }

  /**
   * Pindahkan kamera seketika ke target tanpa lerp (misal saat teleport / ganti map)
   */
  public snapTo(targetX: number, targetY: number): void {
    this.stopShake();
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    if (this.worldWidth > this.viewportWidth) {
      this.baseX = Math.max(0, Math.min(desiredX, this.worldWidth - this.viewportWidth));
    } else {
      this.baseX = (this.worldWidth - this.viewportWidth) / 2;
    }

    if (this.worldHeight > this.viewportHeight) {
      this.baseY = Math.max(0, Math.min(desiredY, this.worldHeight - this.viewportHeight));
    } else {
      this.baseY = (this.worldHeight - this.viewportHeight) / 2;
    }

    this.x = this.baseX;
    this.y = this.baseY;
  }

  public update(targetX: number, targetY: number, deltaTime: number = 0.016): void {
    // 1. Posisi tujuan kamera (pusat di targetX, targetY)
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    // 2. Smooth movement (lerp) pada baseX dan baseY (TERPISAH DARI SHAKE!)
    const safeDelta = Math.max(0.001, Math.min(deltaTime, 0.1));
    const factor = Math.min(1.0, Math.max(0.06, this.lerpSpeed * (safeDelta / 0.016)));

    const diffX = desiredX - this.baseX;
    const diffY = desiredY - this.baseY;

    // Snap jika sudah sangat dekat untuk mencegah subpixel creeping/jittering saat diam
    if (Math.abs(diffX) < 0.25) {
      this.baseX = desiredX;
    } else {
      this.baseX += diffX * factor;
    }

    if (Math.abs(diffY) < 0.25) {
      this.baseY = desiredY;
    } else {
      this.baseY += diffY * factor;
    }

    // 3. Batasi baseX dan baseY di dalam batas dunia
    if (this.worldWidth > this.viewportWidth) {
      this.baseX = Math.max(0, Math.min(this.baseX, this.worldWidth - this.viewportWidth));
    } else {
      this.baseX = (this.worldWidth - this.viewportWidth) / 2;
    }

    if (this.worldHeight > this.viewportHeight) {
      this.baseY = Math.max(0, Math.min(this.baseY, this.worldHeight - this.viewportHeight));
    } else {
      this.baseY = (this.worldHeight - this.viewportHeight) / 2;
    }

    // 4. Hitung Screen Shake effect secara independen dengan decay mulus
    if (this.shakeTimer > 0) {
      this.shakeTimer -= safeDelta;
      const decay = Math.max(0, Math.min(1.0, this.shakeTimer / this.shakeDuration));
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
    } else {
      this.shakeTimer = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // 5. Terapkan shake hanya ke koordinat render (x dan y)
    this.x = this.baseX + this.shakeOffsetX;
    this.y = this.baseY + this.shakeOffsetY;
  }

  public resize(newWidth: number, newHeight: number): void {
    this.viewportWidth = newWidth;
    this.viewportHeight = newHeight;
  }
}
