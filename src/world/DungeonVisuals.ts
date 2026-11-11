/**
 * DungeonVisuals.ts - High-End 2.5D RPG Rendering Utilities & Atmospheric Engine
 * 
 * Provides:
 * - Deterministic, zero-allocation tile hashing (tileHash)
 * - Offscreen Atmospheric Lighting Engine with true 'destination-out' light-punching
 * - 3D Wall Perspective Rendering (Chiseled Top Rims, Vertical Ashlar Facades, Cast Drop Shadows)
 * - Multi-Tone Procedural Flagstones with Micro-Details (Cracks, Puddles, Debris, Cobwebs)
 * - Grand Royal Velvet Carpets with Gold Embroidered Borders
 * - High-Detail Boss Arena Mandalas & Runic Ley-Line Glyphs
 * - Multi-Layer Fluid Animations (Magma Currents, Sacred Spring Caustics, Torch Soulflames)
 */

export function tileHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Singleton Offscreen Lighting Buffer
 * Efficiently computes dark subterranean ambient overlays and cuts clean light apertures.
 */
export class DungeonLightingEngine {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  public static begin(width: number, height: number, ambientColor: string): CanvasRenderingContext2D | null {
    if (typeof document === 'undefined') return null;
    const w = Math.ceil(width);
    const h = Math.ceil(height);

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = Math.max(1, w);
      this.canvas.height = Math.max(1, h);
    }

    if (!this.ctx) return null;

    // Reset composite operation and paint ambient darkness mask
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = ambientColor;
    this.ctx.fillRect(0, 0, w, h);

    // Set to destination-out so subsequent draws punch holes into the darkness
    this.ctx.globalCompositeOperation = 'destination-out';
    return this.ctx;
  }

  public static punchLight(
    screenX: number,
    screenY: number,
    innerRadius: number,
    outerRadius: number,
    intensity: number = 1.0
  ): void {
    if (!this.ctx) return;
    const inner = Math.max(0, innerRadius);
    const outer = Math.max(inner + 1, outerRadius);

    const grad = this.ctx.createRadialGradient(screenX, screenY, inner, screenX, screenY, outer);
    grad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, intensity)})`);
    grad.addColorStop(0.5, `rgba(0, 0, 0, ${Math.min(1, intensity * 0.72)})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, outer, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public static renderToWorld(
    targetCtx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    if (!this.canvas) return;
    targetCtx.save();
    targetCtx.drawImage(this.canvas, cameraX, cameraY);
    targetCtx.restore();
  }
}

/**
 * Visual styling theme configuration for 3D dungeon rendering
 */
export interface DungeonTheme {
  // Wall Palette
  wallTopBase: string;
  wallTopHighlight: string;
  wallTopShadow: string;
  wallFaceBase: string;
  wallFaceBrick1: string;
  wallFaceBrick2: string;
  wallFaceMortar: string;
  wallFaceCrack: string;
  // Floor Flagstone Palette
  floorTones: [string, string, string, string];
  floorMortar: string;
  floorHighlight: string;
  // Accent & Micro-details
  accentGlow?: string;
  mossColor?: string;
  puddleColor?: string;
}

/**
 * Renders high-depth 3D stone walls with chiseled top rims and vertical brick facades
 */
export function drawDungeonWall3D(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  tileX: number,
  tileY: number,
  isFacingFloor: boolean,
  theme: DungeonTheme
): void {
  const hash = tileHash(tileX, tileY);

  if (isFacingFloor) {
    // --- 3D FRONT-FACING WALL (Top Rim + Vertical Brick Facade) ---
    const rimHeight = 10;
    const faceHeight = size - rimHeight;

    // 1. Top Rim (Chiseled Stone Ledge)
    ctx.fillStyle = theme.wallTopBase;
    ctx.fillRect(px, py, size, rimHeight);

    // Bevel highlights & shadow on rim
    ctx.fillStyle = theme.wallTopHighlight;
    ctx.fillRect(px, py, size, 2); // Top rim bevel highlight
    ctx.fillStyle = theme.wallTopShadow;
    ctx.fillRect(px, py + rimHeight - 2, size, 2); // Rim lower bevel shadow

    // Rim brick split line
    const rimSplit = 12 + Math.floor(hash * 10);
    ctx.fillRect(px + rimSplit, py, 1, rimHeight);

    // 2. Vertical Wall Facade (Stone Ashlar Bricks)
    ctx.fillStyle = theme.wallFaceBase;
    ctx.fillRect(px, py + rimHeight, size, faceHeight);

    // Mortar grid (Horizontal course)
    const midCourseY = py + rimHeight + Math.floor(faceHeight / 2);
    ctx.fillStyle = theme.wallFaceMortar;
    ctx.fillRect(px, midCourseY, size, 1.5);

    // Upper Brick Course (Two staggered bricks)
    const splitTop = 14 + Math.floor((hash * 7) % 8);
    ctx.fillStyle = hash > 0.5 ? theme.wallFaceBrick1 : theme.wallFaceBrick2;
    ctx.fillRect(px + 1, py + rimHeight + 1, splitTop - 1, (midCourseY - (py + rimHeight)) - 1);
    ctx.fillStyle = hash > 0.5 ? theme.wallFaceBrick2 : theme.wallFaceBrick1;
    ctx.fillRect(px + splitTop + 1, py + rimHeight + 1, size - splitTop - 2, (midCourseY - (py + rimHeight)) - 1);

    // Lower Brick Course (Staggered offset)
    const splitBottom = (splitTop + 16) % (size - 6) + 3;
    ctx.fillStyle = hash > 0.3 ? theme.wallFaceBrick2 : theme.wallFaceBrick1;
    ctx.fillRect(px + 1, midCourseY + 1.5, splitBottom - 1, (py + size - midCourseY) - 2.5);
    ctx.fillStyle = hash > 0.3 ? theme.wallFaceBrick1 : theme.wallFaceBrick2;
    ctx.fillRect(px + splitBottom + 1, midCourseY + 1.5, size - splitBottom - 2, (py + size - midCourseY) - 2.5);

    // Vertical mortar joints
    ctx.fillStyle = theme.wallFaceMortar;
    ctx.fillRect(px + splitTop, py + rimHeight, 1.5, midCourseY - (py + rimHeight));
    ctx.fillRect(px + splitBottom, midCourseY, 1.5, py + size - midCourseY);

    // Brick edge highlights
    ctx.fillStyle = theme.wallTopHighlight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(px + 1, py + rimHeight + 1, size - 2, 1);
    ctx.fillRect(px + 1, midCourseY + 1.5, size - 2, 1);
    ctx.globalAlpha = 1.0;

    // Wall Crack or Moss detail
    if (hash > 0.65) {
      ctx.fillStyle = theme.wallFaceCrack;
      ctx.fillRect(px + 6 + (hash * 12), py + rimHeight + 3, 1.5, 9);
      ctx.fillRect(px + 7 + (hash * 12), py + rimHeight + 7, 4, 1.5);
    }
    if (theme.mossColor && hash < 0.35) {
      ctx.fillStyle = theme.mossColor;
      ctx.fillRect(px + 2, py + size - 5, 6, 4);
      ctx.fillRect(px + 5, py + size - 3, 4, 2);
    }

    // 3. Wall Base Drop Shadow cast onto the floor directly below
    const shadowGrad = ctx.createLinearGradient(px, py + size, px, py + size + 10);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(px, py + size, size, 10);

  } else {
    // --- SOLID WALL TOP (Horizontal Ledge / Bedrock) ---
    ctx.fillStyle = theme.wallTopBase;
    ctx.fillRect(px, py, size, size);

    // Weathered Chiseled Paving Block Grid on Top
    const toneIdx = Math.floor(hash * 4) % 4;
    ctx.fillStyle = theme.floorTones[toneIdx];
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

    // Mortar border
    ctx.fillStyle = theme.wallTopShadow;
    ctx.fillRect(px, py, size, 1.5);
    ctx.fillRect(px, py, 1.5, size);
    ctx.fillStyle = theme.wallTopHighlight;
    ctx.fillRect(px + 1, py + 1, size - 2, 1);

    // Subtle stone fracturing on roof
    if (hash > 0.55) {
      ctx.fillStyle = theme.wallTopShadow;
      ctx.fillRect(px + 8, py + 10, 10, 1.5);
      ctx.fillRect(px + 14, py + 11, 1.5, 6);
    }
  }
}

/**
 * Renders procedural multi-tone stone flagstone floor tiles with rich micro-details
 */
export function drawDungeonFloor(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  tileX: number,
  tileY: number,
  theme: DungeonTheme,
  animTimer: number = 0,
  hasNorthWall: boolean = false
): void {
  const hash = tileHash(tileX, tileY);

  // 1. Mortar Base
  ctx.fillStyle = theme.floorMortar;
  ctx.fillRect(px, py, size, size);

  // 2. Multi-Paver Flagstone Grid (4 Pavers per 32x32 tile)
  const half = size / 2;
  const tones = theme.floorTones;

  const t0 = tones[Math.floor(hash * 7) % 4];
  const t1 = tones[Math.floor(hash * 13) % 4];
  const t2 = tones[Math.floor(hash * 19) % 4];
  const t3 = tones[Math.floor(hash * 29) % 4];

  // Top-Left Paver
  ctx.fillStyle = t0;
  ctx.fillRect(px + 1, py + 1, half - 1.5, half - 1.5);
  // Top-Right Paver
  ctx.fillStyle = t1;
  ctx.fillRect(px + half + 0.5, py + 1, half - 1.5, half - 1.5);
  // Bottom-Left Paver
  ctx.fillStyle = t2;
  ctx.fillRect(px + 1, py + half + 0.5, half - 1.5, half - 1.5);
  // Bottom-Right Paver
  ctx.fillStyle = t3;
  ctx.fillRect(px + half + 0.5, py + half + 0.5, half - 1.5, half - 1.5);

  // Flagstone Bevel Highlights
  ctx.fillStyle = theme.floorHighlight;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(px + 2, py + 2, half - 3, 1);
  ctx.fillRect(px + half + 1.5, py + 2, half - 3, 1);
  ctx.fillRect(px + 2, py + half + 1.5, half - 3, 1);
  ctx.fillRect(px + half + 1.5, py + half + 1.5, half - 3, 1);
  ctx.globalAlpha = 1.0;

  // 3. Drop Shadow from North Wall (if applicable)
  if (hasNorthWall) {
    const shadowGrad = ctx.createLinearGradient(px, py, px, py + 8);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(px, py, size, 8);
  }

  // 4. Procedural Micro-Details based on Tile Hash
  if (hash > 0.88) {
    // Groundwater Puddle with Animated Specular Reflection
    const puddleW = 12 + Math.floor(hash * 6);
    const puddleH = 7 + Math.floor(hash * 4);
    const pX = px + 6 + Math.floor(hash * 8);
    const pY = py + 8 + Math.floor(hash * 8);

    ctx.fillStyle = theme.puddleColor || 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.ellipse(pX + puddleW / 2, pY + puddleH / 2, puddleW / 2, puddleH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer wave
    const shimmer = Math.sin(animTimer * 2 + tileX + tileY) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * shimmer})`;
    ctx.fillRect(pX + 3, pY + 2, puddleW - 6, 1.5);

  } else if (hash > 0.72) {
    // Ancient Floor Crack with Mortar Fissure
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + 12, py + 14);
    ctx.lineTo(px + 22, py + 18);
    ctx.lineTo(px + 28, py + 26);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#090d16';
    ctx.stroke();

    // Crack highlight edge
    ctx.strokeStyle = theme.floorHighlight;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

  } else if (hash < 0.1) {
    // Weathered Stone Rubble & Pebbles
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 7, py + 19, 3, 2.5);
    ctx.fillRect(px + 21, py + 8, 2.5, 2);
    ctx.fillRect(px + 18, py + 23, 4, 3);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 7, py + 21.5, 3, 1);
    ctx.fillRect(px + 18, py + 26, 4, 1);

  } else if (hash < 0.16 && theme.mossColor) {
    // Subtle Patches of Spreading Moss
    ctx.fillStyle = theme.mossColor;
    ctx.fillRect(px + 14, py + 12, 6, 4);
    ctx.fillRect(px + 16, py + 10, 3, 2);
    ctx.fillRect(px + 17, py + 16, 4, 3);
  }
}

/**
 * Renders Royal Velvet Carpet Runner with Gold Embroidered Borders
 */
export function drawRoyalCarpet(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  isStart: boolean = false,
  isEnd: boolean = false
): void {
  // Rich Imperial Crimson Velvet
  ctx.fillStyle = '#881337'; // Deep Rose/Wine 900
  ctx.fillRect(px + 3, py, size - 6, size);

  // Center Plush Velvet Runner
  ctx.fillStyle = '#9f1239'; // Rose 800
  ctx.fillRect(px + 6, py, size - 12, size);

  // Gold Embroidered Borders
  ctx.fillStyle = '#eab308'; // Amber/Gold 500
  ctx.fillRect(px + 4, py, 2, size);
  ctx.fillRect(px + size - 6, py, 2, size);

  // Inner Gold Threading
  ctx.fillStyle = '#fde047'; // Yellow 300
  ctx.fillRect(px + 7, py, 1, size);
  ctx.fillRect(px + size - 8, py, 1, size);

  // End Fringe Tassels
  if (isStart || isEnd) {
    const fringeY = isStart ? py + 1 : py + size - 3;
    ctx.fillStyle = '#facc15';
    for (let tx = px + 4; tx <= px + size - 6; tx += 3) {
      ctx.fillRect(tx, fringeY, 1.5, 2.5);
    }
  }
}

/**
 * Renders an animated high-detail Arcane Mandala / Boss Arena Summoning Circle
 */
export function drawBossMandala(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  animTimer: number,
  primaryColor: string,
  secondaryColor: string,
  coreIcon?: string
): void {
  ctx.save();
  const pulse = Math.sin(animTimer * 2.5) * 0.15 + 0.85;

  // 1. Outer Dark Altar Dais Ring
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer Concentric Glowing Rings
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Rotating Outer Runes / Tick Marks
  const numTicks = 16;
  const rot = animTimer * 0.35;
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < numTicks; i++) {
    const angle = rot + (i * Math.PI * 2) / numTicks;
    const r1 = radius - 6;
    const r2 = radius - 1;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * r1, centerY + Math.sin(angle) * r1);
    ctx.lineTo(centerX + Math.cos(angle) * r2, centerY + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // 4. Counter-Rotating Inner Sacred Geometry (8-Point Star)
  const innerRot = -animTimer * 0.45;
  const starRadius = radius * 0.65;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a1 = innerRot + (i * Math.PI * 2) / 8;
    const a2 = innerRot + (((i + 3) % 8) * Math.PI * 2) / 8;
    ctx.moveTo(centerX + Math.cos(a1) * starRadius, centerY + Math.sin(a1) * starRadius);
    ctx.lineTo(centerX + Math.cos(a2) * starRadius, centerY + Math.sin(a2) * starRadius);
  }
  ctx.stroke();

  // 5. Pulsing Elemental Core
  const coreGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius * 0.38 * pulse);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.35, primaryColor);
  coreGrad.addColorStop(0.75, secondaryColor);
  coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.38 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // 6. Core Sigil / Icon
  if (coreIcon) {
    ctx.font = `bold ${Math.floor(radius * 0.32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(coreIcon, centerX, centerY);
  }

  ctx.restore();
}

/**
 * Renders an animated Wall Torch with bracket, 3-layer flame, and ember flicker
 */
export function drawWallTorch3D(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  animTimer: number,
  flameColors: [string, string, string] = ['#ef4444', '#f97316', '#fef08a']
): void {
  // Cast Iron Wall Sconce Bracket
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(tx - 1, ty, 8, 3); // Mounting plate
  ctx.fillRect(tx + 2, ty + 3, 2, 8); // Downward support rod
  ctx.fillStyle = '#475569';
  ctx.fillRect(tx, ty + 1, 6, 2);

  // Wooden / Metal Torch Shaft
  ctx.fillStyle = '#78350f';
  ctx.fillRect(tx + 1, ty - 4, 4, 6);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(tx + 1, ty - 4, 1.5, 6); // Highlight on shaft

  // Iron Head Wrap
  ctx.fillStyle = '#334155';
  ctx.fillRect(tx, ty - 6, 6, 2.5);

  // 3-Layer Animated Flame
  const sway = Math.sin(animTimer * 6 + tx) * 1.5;
  const bob = Math.cos(animTimer * 8 + ty) * 1.2;

  // Outer Flame (Red/Orange)
  ctx.fillStyle = flameColors[0];
  ctx.beginPath();
  ctx.ellipse(tx + 3 + sway * 0.6, ty - 10 + bob, 4.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Middle Flame (Bright Orange/Amber)
  ctx.fillStyle = flameColors[1];
  ctx.beginPath();
  ctx.ellipse(tx + 3 + sway * 0.8, ty - 10 + bob, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner White-Hot Core
  ctx.fillStyle = flameColors[2];
  ctx.beginPath();
  ctx.ellipse(tx + 3 + sway, ty - 9 + bob, 1.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny Rising Spark
  const sparkY = ty - 16 - ((animTimer * 18 + tx) % 10);
  ctx.fillStyle = flameColors[2];
  ctx.fillRect(tx + 2.5 + sway * 1.2, sparkY, 1.5, 1.5);
}
