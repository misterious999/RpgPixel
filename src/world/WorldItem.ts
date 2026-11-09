import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export class WorldItem {
  public x: number;
  public y: number;
  public itemId: string;
  public count: number;
  public width: number = 14;
  public height: number = 14;
  public isCollected: boolean = false;
  private animTimer: number;

  constructor(x: number, y: number, itemId: string, count: number = 1) {
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.count = count;
    this.animTimer = Math.random() * Math.PI * 2;
  }

  public update(deltaTime: number, playerX: number, playerY: number): boolean {
    this.animTimer += deltaTime * 3;

    // Distance to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    // Magnetic pickup attraction
    const magnetDistance = 32;
    if (dist < magnetDistance && dist > 1) {
      const speed = 120 * deltaTime;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }

    // Pickup threshold
    return dist < 14;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const def = ITEM_DEFINITIONS[this.itemId];
    if (!def) return;

    const bobOffset = Math.sin(this.animTimer) * 3;
    const renderY = this.y + bobOffset;

    ctx.save();

    // Small ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 7, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glow
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(this.x, renderY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Render item icon centered
    const iconSize = 14;
    def.renderIcon(ctx, this.x - iconSize / 2, renderY - iconSize / 2, iconSize);

    // If count > 1, show small count tag
    if (this.count > 1) {
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(`x${this.count}`, this.x + 8, renderY + 6);
      ctx.fillText(`x${this.count}`, this.x + 8, renderY + 6);
    }

    ctx.restore();
  }
}
