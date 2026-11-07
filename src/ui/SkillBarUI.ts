import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from './FloatingText.ts';

export interface VisualEffect {
  x: number;
  y: number;
  type: 'slash' | 'fireball' | 'frost' | 'lightning' | 'heal' | 'summon' | 'barrier';
  timer: number;
  maxTimer: number;
  radius: number;
  color: string;
}

export class SkillBarUI {
  private player: Player;
  private floatingText: FloatingTextManager;
  public visualEffects: VisualEffect[] = [];

  constructor(player: Player, floatingText: FloatingTextManager) {
    this.player = player;
    this.floatingText = floatingText;
  }

  public update(deltaTime: number): void {
    // Update visual spell effects in the world
    for (let i = this.visualEffects.length - 1; i >= 0; i--) {
      const fx = this.visualEffects[i];
      fx.timer -= deltaTime;
      if (fx.timer <= 0) {
        this.visualEffects.splice(i, 1);
      }
    }
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    const skills = this.player.skills;
    if (skills.length === 0) return false;

    // 4 Skill buttons placed neatly above the right action buttons
    // Right buttons are at width - 65. Let's arrange skills in an arc or horizontal row
    const btnSize = 36;
    const gap = 10;
    const totalW = 4 * btnSize + 3 * gap;
    const startX = screenWidth - totalW - 16;
    const startY = screenHeight - 175; // above RUN & A buttons

    for (let i = 0; i < 4; i++) {
      const bx = startX + i * (btnSize + gap);
      const by = startY;

      if (
        touchX >= bx &&
        touchX <= bx + btnSize &&
        touchY >= by &&
        touchY <= by + btnSize
      ) {
        if (skills[i]) {
          this.castSkill(i);
        }
        return true;
      }
    }

    return false;
  }

  public castSkill(index: number): void {
    const skill = this.player.skills[index];
    if (!skill) return;

    // Check level lock
    if (this.player.level < skill.unlockLevel) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, `Terkunci! Butuh Lv. ${skill.unlockLevel}`, '#f87171');
      return;
    }

    // Check Cooldown
    if (skill.currentCooldown > 0) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, `Cooldown: ${skill.currentCooldown.toFixed(1)}s`, '#fbbf24');
      return;
    }

    // Check Mana
    if (this.player.mp < skill.manaCost) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Mana Tidak Cukup!', '#38bdf8');
      return;
    }

    // Deduct Mana & Set Cooldown
    this.player.mp -= skill.manaCost;
    skill.currentCooldown = skill.cooldown;

    const px = this.player.x + 10;
    const py = this.player.y + 14;

    // Trigger Visual & Mechanical Skill Effects
    this.floatingText.spawn(px, py - 22, `[${skill.name}]`, skill.color, 1.4);

    switch (skill.id) {
      // KNIGHT SKILLS
      case 'slash':
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'slash',
          timer: 0.3,
          maxTimer: 0.3,
          radius: 28,
          color: '#f97316'
        });
        break;
      case 'shield_bash':
      case 'leap_attack':
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'barrier',
          timer: 0.4,
          maxTimer: 0.4,
          radius: 35,
          color: '#fb923c'
        });
        break;
      case 'parrying':
      case 'berserk_overdrive':
        this.player.isBerserk = true;
        this.player.berserkTimer = 8.0;
        this.floatingText.spawn(px, py - 32, '💥 BERSERK OVERDRIVE ACTIVATED!', '#dc2626', 2.0);
        break;

      // MAGICIAN SKILLS
      case 'fireball':
        this.visualEffects.push({
          x: px + (this.player.direction === 'right' ? 30 : this.player.direction === 'left' ? -30 : 0),
          y: py + (this.player.direction === 'down' ? 30 : this.player.direction === 'up' ? -30 : 0),
          type: 'fireball',
          timer: 0.5,
          maxTimer: 0.5,
          radius: 24,
          color: '#ef4444'
        });
        break;
      case 'frost_nova':
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'frost',
          timer: 0.6,
          maxTimer: 0.6,
          radius: 48,
          color: '#38bdf8'
        });
        break;
      case 'chain_lightning':
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'lightning',
          timer: 0.4,
          maxTimer: 0.4,
          radius: 40,
          color: '#fde047'
        });
        break;
      case 'teleport':
        const distance = 80;
        if (this.player.direction === 'right') this.player.x += distance;
        else if (this.player.direction === 'left') this.player.x -= distance;
        else if (this.player.direction === 'down') this.player.y += distance;
        else if (this.player.direction === 'up') this.player.y -= distance;
        this.visualEffects.push({
          x: this.player.x + 10,
          y: this.player.y + 14,
          type: 'barrier',
          timer: 0.3,
          maxTimer: 0.3,
          radius: 25,
          color: '#a855f7'
        });
        break;

      // ASSASSIN SKILLS
      case 'stealth':
        this.player.isStealthed = true;
        this.player.stealthTimer = 7.0;
        this.floatingText.spawn(px, py - 30, '👤 SILENT STEALTH', '#06b6d4', 2.0);
        break;
      case 'critical_strike':
      case 'poison_blade':
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'slash',
          timer: 0.35,
          maxTimer: 0.35,
          radius: 32,
          color: '#22c55e'
        });
        break;

      // HEALER SKILLS
      case 'holy_heal':
        this.player.heal(45);
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'heal',
          timer: 0.8,
          maxTimer: 0.8,
          radius: 28,
          color: '#4ade80'
        });
        break;
      case 'divine_barrier':
        this.player.hasBarrier = true;
        this.player.barrierTimer = 10.0;
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'barrier',
          timer: 0.5,
          maxTimer: 0.5,
          radius: 30,
          color: '#facc15'
        });
        break;

      // NECROMANCER SKILLS
      case 'raise_skeleton':
        if (this.player.minions.length < 3) {
          this.player.minions.push({
            x: this.player.x - 20,
            y: this.player.y,
            type: 'skeleton',
            name: 'Skeleton Minion'
          });
          this.visualEffects.push({
            x: px - 20,
            y: py,
            type: 'summon',
            timer: 0.7,
            maxTimer: 0.7,
            radius: 30,
            color: '#a855f7'
          });
          this.floatingText.spawn(px, py - 25, '💀 Prajurit Kerangka Bangkit!', '#c084fc', 2.0);
        } else {
          this.floatingText.spawn(px, py - 20, 'Batas Minion Penuh (Maks 3)!', '#94a3b8');
        }
        break;
      case 'soul_drain':
        this.player.heal(25);
        this.player.restoreMp(20);
        this.visualEffects.push({
          x: px,
          y: py,
          type: 'heal',
          timer: 0.6,
          maxTimer: 0.6,
          radius: 32,
          color: '#9333ea'
        });
        break;
    }
  }

  public renderWorldEffects(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const fx of this.visualEffects) {
      const alpha = Math.max(0, fx.timer / fx.maxTimer);
      ctx.globalAlpha = alpha;

      if (fx.type === 'slash') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 1.5);
        ctx.stroke();
      } else if (fx.type === 'fireball') {
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - alpha * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.type === 'frost') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
      } else if (fx.type === 'lightning') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx.x - 20, fx.y - 30);
        ctx.lineTo(fx.x, fx.y);
        ctx.lineTo(fx.x + 20, fx.y - 15);
        ctx.stroke();
      } else if (fx.type === 'heal') {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Green sparkles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx.x - 4, fx.y - 8, 8, 2);
        ctx.fillRect(fx.x - 1, fx.y - 11, 2, 8);
      } else if (fx.type === 'summon' || fx.type === 'barrier') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  public renderTouchSkillBar(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    const skills = this.player.skills;
    if (skills.length === 0) return;

    ctx.save();
    const btnSize = 36;
    const gap = 10;
    const totalW = 4 * btnSize + 3 * gap;
    const startX = screenWidth - totalW - 16;
    const startY = screenHeight - 175;

    for (let i = 0; i < 4; i++) {
      const skill = skills[i];
      const bx = startX + i * (btnSize + gap);
      const by = startY;

      if (!skill) continue;

      const isUnlocked = this.player.level >= skill.unlockLevel;
      const isOnCooldown = skill.currentCooldown > 0;

      // Button background
      ctx.fillStyle = isUnlocked ? (isOnCooldown ? '#1e293b' : 'rgba(15, 23, 42, 0.85)') : 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.arc(bx + btnSize / 2, by + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = isUnlocked ? (isOnCooldown ? '#475569' : skill.color) : '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Symbol
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isUnlocked) {
        ctx.fillText(skill.iconSymbol, bx + btnSize / 2, by + btnSize / 2);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText('🔒', bx + btnSize / 2, by + btnSize / 2 - 2);
      }

      // Unlock requirement badge
      if (!isUnlocked) {
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText(`Lv.${skill.unlockLevel}`, bx + btnSize / 2, by + btnSize - 6);
      }

      // Cooldown sweep overlay
      if (isUnlocked && isOnCooldown) {
        const sweep = skill.currentCooldown / skill.cooldown;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.moveTo(bx + btnSize / 2, by + btnSize / 2);
        ctx.arc(bx + btnSize / 2, by + btnSize / 2, btnSize / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(skill.currentCooldown.toFixed(1), bx + btnSize / 2, by + btnSize / 2);
      }

      // Small Skill Tag (1, 2, 3, 4)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(`${i + 1}`, bx + 6, by + 6);
    }

    ctx.restore();
  }
}
