export type WeatherType = 'CLEAR' | 'RAIN' | 'FOG';
export type TimePhase = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
}

export class TimeWeatherEngine {
  public timeOfDay: number = 9.5; // Starts at 09:30 AM
  public timeSpeed: number = 0.08; // 1 real sec = ~0.08 in-game hours (~5 min real = 1 full game day)
  public currentWeather: WeatherType = 'CLEAR';
  public weatherTimer: number = 180; // Changes every 3 minutes

  private rainParticles: WeatherParticle[] = [];
  private fogOffsets: { x: number; y: number; speed: number; radius: number }[] = [];
  private animTimer: number = 0;

  constructor() {
    this.initWeatherParticles();
  }

  private initWeatherParticles(): void {
    // 60 rain streaks
    for (let i = 0; i < 60; i++) {
      this.rainParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: -20 - Math.random() * 15,
        vy: 240 + Math.random() * 80,
        length: 8 + Math.random() * 8,
        alpha: 0.4 + Math.random() * 0.4
      });
    }

    // 12 drifting fog clouds
    for (let i = 0; i < 12; i++) {
      this.fogOffsets.push({
        x: Math.random() * 900,
        y: Math.random() * 600,
        speed: 12 + Math.random() * 14,
        radius: 60 + Math.random() * 50
      });
    }
  }

  public update(deltaTime: number, camX: number, camY: number, viewW: number, viewH: number, isDungeon: boolean): void {
    this.animTimer += deltaTime;

    // Time cycle progression
    this.timeOfDay = (this.timeOfDay + deltaTime * this.timeSpeed) % 24;

    // Weather cycle (only in Overworld)
    if (!isDungeon) {
      this.weatherTimer -= deltaTime;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 140 + Math.random() * 120;
        const roll = Math.random();
        if (roll < 0.55) this.currentWeather = 'CLEAR';
        else if (roll < 0.85) this.currentWeather = 'RAIN';
        else this.currentWeather = 'FOG';
      }
    } else {
      this.currentWeather = 'CLEAR';
    }

    // Update rain
    if (this.currentWeather === 'RAIN' && !isDungeon) {
      const pad = 40;
      for (const p of this.rainParticles) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        if (p.y > camY + viewH + pad) {
          p.y = camY - pad;
          p.x = camX - pad + Math.random() * (viewW + pad * 2);
        }
        if (p.x < camX - pad) {
          p.x = camX + viewW + pad;
        }
      }
    }

    // Update fog
    if (this.currentWeather === 'FOG' && !isDungeon) {
      for (const f of this.fogOffsets) {
        f.x += f.speed * deltaTime;
        if (f.x > camX + viewW + 100) {
          f.x = camX - 100;
          f.y = camY + Math.random() * viewH;
        }
      }
    }
  }

  public getTimePhase(): TimePhase {
    const t = this.timeOfDay;
    if (t >= 5.0 && t < 7.5) return 'DAWN';
    if (t >= 7.5 && t < 16.5) return 'DAY';
    if (t >= 16.5 && t < 19.5) return 'SUNSET';
    return 'NIGHT';
  }

  public isNight(): boolean {
    return this.getTimePhase() === 'NIGHT';
  }

  public getFormattedTime(): string {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const phase = this.getTimePhase();
    const phaseLabel = phase === 'DAWN' ? '🌅 Fajar' : (phase === 'DAY' ? '☀️ Siang' : (phase === 'SUNSET' ? '🌇 Sore' : '🌙 Malam'));
    const weatherIcon = this.currentWeather === 'RAIN' ? ' 🌧️' : (this.currentWeather === 'FOG' ? ' 🌫️' : '');
    return `${hStr}:${mStr} [${phaseLabel}${weatherIcon}]`;
  }

  public renderWorldLighting(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    isDungeon: boolean
  ): void {
    if (isDungeon) return; // Dungeon has its own atmospheric darkness engine

    const phase = this.getTimePhase();
    let overlayColor = '';
    let alpha = 0;

    if (phase === 'DAWN') {
      overlayColor = '#f59e0b'; // Amber golden morning
      alpha = 0.16;
    } else if (phase === 'DAY') {
      overlayColor = '#38bdf8';
      alpha = 0.02; // Very slight sky crispness
    } else if (phase === 'SUNSET') {
      overlayColor = '#ea580c'; // Warm orange sunset
      alpha = 0.28;
    } else {
      // NIGHT
      overlayColor = '#0f172a'; // Deep navy night
      alpha = 0.52;
    }

    ctx.save();

    // 1. Base Atmospheric Color Wash
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = overlayColor;
      ctx.fillRect(camX - 10, camY - 10, viewW + 20, viewH + 20);
    }

    // 2. Village Lantern Radial Lighting (During Night & Sunset)
    if (phase === 'NIGHT' || phase === 'SUNSET') {
      const lanternPoints = [
        { x: 50 * 32, y: 50 * 32, radius: 65 }, // Plaza Fountain
        { x: 51 * 32 + 8, y: 48 * 32 + 10, radius: 55 }, // Guild Entrance
        { x: 46 * 32 + 10, y: 49 * 32 + 10, radius: 55 }, // Blacksmith Forge
        { x: 44 * 32, y: 44 * 32, radius: 50 }, // Village Gate North
        { x: 56 * 32, y: 52 * 32, radius: 50 }  // East Trail Lamp
      ];

      for (const lp of lanternPoints) {
        if (
          lp.x + lp.radius > camX &&
          lp.x - lp.radius < camX + viewW &&
          lp.y + lp.radius > camY &&
          lp.y - lp.radius < camY + viewH
        ) {
          const grad = ctx.createRadialGradient(lp.x, lp.y, 4, lp.x, lp.y, lp.radius);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.22)');
          grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.globalAlpha = 0.85;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lp.x, lp.y, lp.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Weather: Rain Rendering
    if (this.currentWeather === 'RAIN') {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.2;
      for (const p of this.rainParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.05, p.y + p.length);
        ctx.stroke();
      }
    }

    // 4. Weather: Fog Rendering
    if (this.currentWeather === 'FOG') {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.12)';
      for (const f of this.fogOffsets) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
