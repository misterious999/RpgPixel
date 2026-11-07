export interface FloatingMessage {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export class FloatingTextManager {
  private messages: FloatingMessage[] = [];

  public spawn(x: number, y: number, text: string, color: string = '#facc15', duration: number = 1.2): void {
    this.messages.push({
      x,
      y,
      text,
      color,
      lifetime: duration,
      maxLifetime: duration
    });
  }

  public update(deltaTime: number): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      msg.lifetime -= deltaTime;
      msg.y -= deltaTime * 20; // float upwards
      if (msg.lifetime <= 0) {
        this.messages.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.messages.length === 0) return;

    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';

    for (const msg of this.messages) {
      const alpha = Math.max(0, msg.lifetime / msg.maxLifetime);
      ctx.globalAlpha = alpha;

      // Dark shadow outline for readability
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(msg.text, msg.x, msg.y);

      // Main colored text
      ctx.fillStyle = msg.color;
      ctx.fillText(msg.text, msg.x, msg.y);
    }

    ctx.restore();
  }
}
