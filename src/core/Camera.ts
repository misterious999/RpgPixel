import { CONSTANTS } from './Constants.ts';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number;
  public viewportHeight: number;
  private lerpSpeed: number = 0.12;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public update(targetX: number, targetY: number): void {
    // Camera center should align with target center
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    // Smooth movement (lerp)
    this.x += (desiredX - this.x) * this.lerpSpeed;
    this.y += (desiredY - this.y) * this.lerpSpeed;

    // Clamp camera within map bounds
    const worldWidth = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE;
    const worldHeight = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE;

    this.x = Math.max(0, Math.min(this.x, worldWidth - this.viewportWidth));
    this.y = Math.max(0, Math.min(this.y, worldHeight - this.viewportHeight));
  }

  public resize(newWidth: number, newHeight: number): void {
    this.viewportWidth = newWidth;
    this.viewportHeight = newHeight;
  }
}
