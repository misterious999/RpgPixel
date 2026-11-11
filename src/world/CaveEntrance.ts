import { CONSTANTS } from '../core/Constants.ts';

interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  maxLife: number;
  life: number;
  size: number;
}

export class CaveEntrance {
  public x: number;
  public y: number;
  public width: number = 64; // 2 tiles wide
  public height: number = 64; // 2 tiles high
  private animTimer: number = 0;
  private mistParticles: MistParticle[] = [];

  constructor(tileX: number, tileY: number) {
    this.x = tileX * CONSTANTS.TILE_SIZE;
    this.y = tileY * CONSTANTS.TILE_SIZE;
  }

  public isNearPlayer(playerCenterX: number, playerCenterY: number): boolean {
    const entranceCenterX = this.x + this.width / 2;
    const entranceCenterY = this.y + this.height - 12;
    return Math.hypot(entranceCenterX - playerCenterX, entranceCenterY - playerCenterY) < 58;
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 5;

    // Spawn subtle mystical cave mist particles
    if (Math.random() < 0.25) {
      this.mistParticles.push({
        x: this.x + 20 + Math.random() * 24,
        y: this.y + 46,
        vx: (Math.random() - 0.5) * 8,
        vy: -12 - Math.random() * 10,
        alpha: 0.6 + Math.random() * 0.3,
        maxLife: 1.6,
        life: 1.6,
        size: 3 + Math.random() * 3
      });
    }

    // Update mist particles
    for (let i = this.mistParticles.length - 1; i >= 0; i--) {
      const p = this.mistParticles[i];
      p.life -= deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      if (p.life <= 0) {
        this.mistParticles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, isPlayerNear: boolean, isSuppressed: boolean = false): void {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    ctx.save();

    // 1. Mountain Rock Backdrop & Shading (Unifies with surrounding cliffs)
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x - 4, y - 2, this.width + 8, this.height + 4);

    // 2. Heavy Jagged Rock Boulders Arch
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(x + 32, y + 28, 30, Math.PI, 0, false);
    ctx.lineTo(x + 64, y + 64);
    ctx.lineTo(x, y + 64);
    ctx.closePath();
    ctx.fill();

    // Rock Highlights & Chiselled Chunks
    ctx.fillStyle = '#3b4759';
    ctx.fillRect(x + 2, y + 16, 12, 10);
    ctx.fillRect(x + 50, y + 16, 12, 10);
    ctx.fillRect(x + 14, y + 6, 12, 8);
    ctx.fillRect(x + 38, y + 6, 12, 8);
    ctx.fillRect(x + 24, y + 2, 16, 6);

    ctx.fillStyle = '#4a5568';
    ctx.fillRect(x + 4, y + 18, 6, 3);
    ctx.fillRect(x + 52, y + 18, 6, 3);
    ctx.fillRect(x + 26, y + 4, 12, 2);

    ctx.fillStyle = '#718096';
    ctx.fillRect(x + 6, y + 8, 4, 2);
    ctx.fillRect(x + 40, y + 8, 4, 2);

    // 3. Dark Cavern Mouth (Pitch Dark Void with Deep Purple Rim)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(x + 32, y + 36, 18, Math.PI, 0, false);
    ctx.lineTo(x + 50, y + 64);
    ctx.lineTo(x + 14, y + 64);
    ctx.closePath();
    ctx.fill();

    // Inner Abyssal Glow Gradient
    const grad = ctx.createLinearGradient(x + 32, y + 18, x + 32, y + 64);
    grad.addColorStop(0, 'rgba(88, 28, 135, 0.45)');
    grad.addColorStop(0.6, 'rgba(30, 27, 75, 0.25)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + 32, y + 36, 17, Math.PI, 0, false);
    ctx.lineTo(x + 49, y + 64);
    ctx.lineTo(x + 15, y + 64);
    ctx.closePath();
    ctx.fill();

    // 4. Mystical Mist Particles Floating from Depth
    for (const p of this.mistParticles) {
      const alpha = Math.max(0, (p.life / p.maxLife) * p.alpha);
      ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }

    // 5. Left & Right Wooden Posts with Animated Torches
    // Left Post & Torch
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 6, y + 36, 4, 26);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 5, y + 34, 6, 3); // Sconce
    // Left Flame
    const flameWobbleL = Math.sin(this.animTimer + 1) * 1.5;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 5 + flameWobbleL * 0.5, y + 27, 6, 7);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 6 + flameWobbleL * 0.5, y + 25, 4, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 7, y + 24, 2, 4);

    // Right Post & Torch
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 54, y + 36, 4, 26);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 53, y + 34, 6, 3);
    // Right Flame
    const flameWobbleR = Math.cos(this.animTimer + 2) * 1.5;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 53 + flameWobbleR * 0.5, y + 27, 6, 7);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 54 + flameWobbleR * 0.5, y + 25, 4, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 55, y + 24, 2, 4);

    // 6. Ancient Stone Slab Name Header
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(x + 4, y - 13, 56, 13);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 4, y - 13, 56, 13);

    // Slab corner accents
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 5, y - 12, 2, 2);
    ctx.fillRect(x + 57, y - 12, 2, 2);
    ctx.fillRect(x + 5, y - 3, 2, 2);
    ctx.fillRect(x + 57, y - 3, 2, 2);

    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('DUNGEON GUA', x + 32, y - 3.5);

    // 7. Interactive Prompt when player is near
    if (isPlayerNear && !isSuppressed) {
      const bob = Math.sin(this.animTimer) * 2;
      const promptY = y - 29 + bob;

      // Glow box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fillRect(x - 5, promptY, 74, 15);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 5, promptY, 74, 15);

      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('[A] Masuk Dungeon', x + 32, promptY + 11);
    }

    ctx.restore();
  }
}
