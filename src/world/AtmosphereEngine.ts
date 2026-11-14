export interface AnimeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  swayTimer: number;
  swaySpeed: number;
  type: 'PETAL' | 'SPORE' | 'MOTE' | 'ABYSSAL' | 'FIREFLY' | 'EMBER' | 'WIND_LEAF';
}

export class AtmosphereEngine {
  private particles: AnimeParticle[] = [];
  private maxParticles: number = 42;
  private animTimer: number = 0;

  constructor() {
    this.initParticles();
  }

  private initParticles(): void {
    const types: ('PETAL' | 'SPORE' | 'MOTE')[] = ['PETAL', 'SPORE', 'MOTE'];
    for (let i = 0; i < this.maxParticles; i++) {
      const type = types[i % types.length];
      this.particles.push(this.createParticle(type, Math.random() * 800, Math.random() * 600));
    }
  }

  private createParticle(
    type: 'PETAL' | 'SPORE' | 'MOTE' | 'ABYSSAL' | 'FIREFLY' | 'EMBER' | 'WIND_LEAF',
    x: number,
    y: number
  ): AnimeParticle {
    if (type === 'PETAL') {
      // Pink/Blush/White falling flower petals
      const colors = ['#fbcfe8', '#f472b6', '#fda4af', '#ffffff'];
      return {
        x,
        y,
        vx: 12 + Math.random() * 16,
        vy: 14 + Math.random() * 18,
        size: 3 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.5 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3,
        swayTimer: Math.random() * 10,
        swaySpeed: 1.5 + Math.random() * 2,
        type: 'PETAL'
      };
    } else if (type === 'FIREFLY') {
      // Glowing green-yellow lake fireflies at night
      const colors = ['#fef08a', '#bef264', '#a3e635'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 10,
        size: 2.2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.6 + Math.random() * 0.4,
        rotation: 0,
        rotationSpeed: 0,
        swayTimer: Math.random() * 10,
        swaySpeed: 3 + Math.random() * 2,
        type: 'FIREFLY'
      };
    } else if (type === 'EMBER') {
      // Fiery orange/red embers rising from foundry
      const colors = ['#ea580c', '#f97316', '#facc15', '#dc2626'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: -16 - Math.random() * 18,
        size: 1.8 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.6 + Math.random() * 0.35,
        rotation: 0,
        rotationSpeed: 0,
        swayTimer: Math.random() * 10,
        swaySpeed: 2 + Math.random() * 3,
        type: 'EMBER'
      };
    } else if (type === 'WIND_LEAF') {
      // Golden wheat/leaf flakes swirling near windmill
      const colors = ['#fde047', '#eab308', '#ca8a04', '#fed7aa'];
      return {
        x,
        y,
        vx: 24 + Math.random() * 22,
        vy: 10 + Math.random() * 14,
        size: 3 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.55 + Math.random() * 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        swayTimer: Math.random() * 10,
        swaySpeed: 2.5 + Math.random() * 2,
        type: 'WIND_LEAF'
      };
    } else if (type === 'SPORE') {
      // Glowing green/gold forest mana spores (hikarigoke / fairy dust)
      const colors = ['#86efac', '#4ade80', '#fde047', '#a7f3d0'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -6 - Math.random() * 10,
        size: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.4 + Math.random() * 0.4,
        rotation: 0,
        rotationSpeed: 0,
        swayTimer: Math.random() * 10,
        swaySpeed: 2 + Math.random() * 2.5,
        type: 'SPORE'
      };
    } else if (type === 'ABYSSAL') {
      // Purple / Abyssal mana sparks in dungeon
      const colors = ['#c084fc', '#a855f7', '#38bdf8', '#818cf8'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -12 - Math.random() * 14,
        size: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.4 + Math.random() * 0.45,
        rotation: 0,
        rotationSpeed: 0,
        swayTimer: Math.random() * 10,
        swaySpeed: 1.8 + Math.random() * 2,
        type: 'ABYSSAL'
      };
    } else {
      // Golden sunlight motes
      const colors = ['#fef08a', '#facc15', '#ffffff'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: 4 + Math.random() * 8,
        size: 1.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.35 + Math.random() * 0.45,
        rotation: 0,
        rotationSpeed: 0,
        swayTimer: Math.random() * 10,
        swaySpeed: 1.2 + Math.random() * 2,
        type: 'MOTE'
      };
    }
  }

  public update(
    deltaTime: number,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    isDungeon: boolean,
    regionId?: string,
    isNight?: boolean
  ): void {
    this.animTimer += deltaTime;

    const pad = 30;
    const left = camX - pad;
    const right = camX + viewW + pad;
    const top = camY - pad;
    const bottom = camY + viewH + pad;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Mutate type based on map & region environment
      if (isDungeon && p.type !== 'ABYSSAL') {
        p.type = 'ABYSSAL';
        p.color = Math.random() > 0.5 ? '#c084fc' : '#38bdf8';
        p.vy = -12 - Math.random() * 14;
      } else if (!isDungeon) {
        if ((regionId === 'TIRTA_KENCANA' || regionId === 'LAKE_AZURE') && isNight) {
          if (p.type !== 'FIREFLY') {
            p.type = 'FIREFLY';
            p.color = Math.random() > 0.4 ? '#bef264' : '#fef08a';
            p.vy = (Math.random() - 0.5) * 12;
          }
        } else if (regionId === 'AMBERVALE') {
          if (p.type !== 'WIND_LEAF') {
            p.type = 'WIND_LEAF';
            p.color = Math.random() > 0.5 ? '#fde047' : '#ca8a04';
            p.vx = 22 + Math.random() * 20;
            p.vy = 10 + Math.random() * 12;
          }
        } else if (regionId === 'STONEWATCH') {
          if (p.type !== 'EMBER') {
            p.type = 'EMBER';
            p.color = Math.random() > 0.5 ? '#f97316' : '#ea580c';
            p.vy = -16 - Math.random() * 16;
          }
        } else if (regionId === 'ELDORIA') {
          if (p.type !== 'SPORE') {
            p.type = 'SPORE';
            p.color = Math.random() > 0.5 ? '#86efac' : '#34d399';
            p.vy = -6 - Math.random() * 8;
          }
        } else if (p.type === 'ABYSSAL' || p.type === 'EMBER' || (p.type === 'FIREFLY' && !isNight)) {
          p.type = Math.random() > 0.4 ? 'PETAL' : 'MOTE';
          p.color = p.type === 'PETAL' ? '#fbcfe8' : '#fef08a';
          p.vy = p.type === 'PETAL' ? 16 : 6;
        }
      }

      p.swayTimer += deltaTime * p.swaySpeed;
      const swayOffset = Math.sin(p.swayTimer) * 14 * deltaTime;

      p.x += (p.vx + swayOffset);
      p.y += p.vy * deltaTime;
      p.rotation += p.rotationSpeed * deltaTime;

      // Wrap around camera viewport seamlessly
      if (p.x < left) p.x = right;
      else if (p.x > right) p.x = left;

      if (p.vy > 0 && p.y > bottom) {
        p.y = top;
        p.x = left + Math.random() * (viewW + pad * 2);
      } else if (p.vy < 0 && p.y < top) {
        p.y = bottom;
        p.x = left + Math.random() * (viewW + pad * 2);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const pulse = (Math.sin(this.animTimer * 3 + i) + 1) * 0.25;
      const currentAlpha = Math.min(1, Math.max(0.1, p.alpha + pulse));

      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = p.color;

      if (p.type === 'PETAL' || p.type === 'WIND_LEAF') {
        // Oval petal / leaf with rotation
        ctx.save();
        ctx.translate(Math.floor(p.x), Math.floor(p.y));
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'FIREFLY') {
        // Glowing firefly with halo
        ctx.beginPath();
        ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(190, 242, 100, 0.25)';
        ctx.beginPath();
        ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing circular spore / sun mote / mana spark / ember
        ctx.beginPath();
        ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
