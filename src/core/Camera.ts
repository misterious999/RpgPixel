import { CONSTANTS } from './Constants.ts';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number;
  public viewportHeight: number;
  public worldWidth: number = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE;
  public worldHeight: number = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE;
  private lerpSpeed: number = 0.12;

  // Dynamic Anime Impact Screen Shake
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public shake(intensity: number = 3.5, duration: number = 0.18): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  public setWorldBounds(widthPx: number, heightPx: number): void {
    this.worldWidth = widthPx;
    this.worldHeight = heightPx;
  }

  public update(targetX: number, targetY: number, deltaTime: number = 0.016): void {
    // Camera center should align with target center
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    // Smooth movement (lerp)
    this.x += (desiredX - this.x) * this.lerpSpeed;
    this.y += (desiredY - this.y) * this.lerpSpeed;

    // Screen Shake effect
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const decay = Math.max(0, this.shakeTimer / 0.18);
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    this.x += this.shakeOffsetX;
    this.y += this.shakeOffsetY;

    // Clamp camera within map bounds
    if (this.worldWidth > this.viewportWidth) {
      this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
    } else {
      this.x = (this.worldWidth - this.viewportWidth) / 2;
    }

    if (this.worldHeight > this.viewportHeight) {
      this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));
    } else {
      this.y = (this.worldHeight - this.viewportHeight) / 2;
    }
  }

  public resize(newWidth: number, newHeight: number): void {
    this.viewportWidth = newWidth;
    this.viewportHeight = newHeight;
  }
}
