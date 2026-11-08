import { CONSTANTS } from './Constants.ts';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number;
  public viewportHeight: number;
  public worldWidth: number = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE;
  public worldHeight: number = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE;
  private lerpSpeed: number = 0.12;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setWorldBounds(widthPx: number, heightPx: number): void {
    this.worldWidth = widthPx;
    this.worldHeight = heightPx;
  }

  public update(targetX: number, targetY: number): void {
    // Camera center should align with target center
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    // Smooth movement (lerp)
    this.x += (desiredX - this.x) * this.lerpSpeed;
    this.y += (desiredY - this.y) * this.lerpSpeed;

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
