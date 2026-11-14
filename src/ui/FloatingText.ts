export interface FloatingMessage {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
  fontSize: number;
  isCrit: boolean;
  scale: number;
}

export class FloatingTextManager {
  private static instance: FloatingTextManager | null = null;
  private messages: FloatingMessage[] = [];

  constructor() {
    FloatingTextManager.instance = this;
  }

  public static getInstance(): FloatingTextManager {
    if (!FloatingTextManager.instance) {
      FloatingTextManager.instance = new FloatingTextManager();
    }
    return FloatingTextManager.instance;
  }

  public addText(
    x: number,
    y: number,
    text: string,
    color: string = '#facc15',
    duration: number = 1.2,
    fontSize: number = 10
  ): void {
    this.spawn(x, y, text, color, duration, fontSize);
  }

  public spawn(
    x: number,
    y: number,
    text: string,
    color: string = '#facc15',
    duration: number = 1.2,
    fontSize: number = 10
  ): void {
    const isCrit = text.includes('CRIT') || text.includes('LEVEL UP') || text.includes('DIKALAHKAN');
    const actualFontSize = isCrit ? Math.max(fontSize, 13) : fontSize;
    this.messages.push({
      x,
      y,
      text,
      color,
      lifetime: duration,
      maxLifetime: duration,
      fontSize: actualFontSize,
      isCrit,
      scale: isCrit ? 1.5 : 1.25 // Anime Pop-In Scale
    });
  }

  public update(deltaTime: number): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      msg.lifetime -= deltaTime;
      // Smooth anime float upwards with easing
      const floatSpeed = msg.isCrit ? 26 : 20;
      msg.y -= deltaTime * floatSpeed;

      // Pop-in scale settles to 1.0
      if (msg.scale > 1.0) {
        msg.scale = Math.max(1.0, msg.scale - deltaTime * 3.5);
      }

      if (msg.lifetime <= 0) {
        this.messages.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.messages.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const msg of this.messages) {
      const alpha = Math.max(0, Math.min(1, msg.lifetime / (msg.maxLifetime * 0.4)));
      ctx.globalAlpha = Math.min(1, alpha);

      ctx.save();
      ctx.translate(Math.floor(msg.x), Math.floor(msg.y));
      ctx.scale(msg.scale, msg.scale);

      ctx.font = `900 ${msg.fontSize}px sans-serif`;

      // Thick dark shadow outline for readability
      ctx.strokeStyle = msg.isCrit ? '#78350f' : 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = msg.isCrit ? 4.5 : 3;
      ctx.strokeText(msg.text, 0, 0);

      if (msg.isCrit) {
        // Outer glow stroke for critical hits
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.strokeText(msg.text, 0, 0);
      }

      // Main colored text
      ctx.fillStyle = msg.color;
      ctx.fillText(msg.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}
