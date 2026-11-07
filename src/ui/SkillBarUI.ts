import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from './FloatingText.ts';
import { ControlSettingsManager, ControlConfig } from '../core/ControlSettings.ts';

export interface VisualEffect {
  x: number;
  y: number;
  type: 'slash' | 'fire' | 'ice' | 'lightning' | 'wind' | 'earth' | 'heal' | 'summon' | 'barrier' | 'abnormal';
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

  private getSkillSlot(index: number, width: number, height: number, cfg: ControlConfig) {
    const scale = cfg.buttonScale;
    // Ergonomic Arc around Action & Run buttons for Landscape thumb reach
    const offsets = [
      { dx: -114, dy: -18 }, // S1 (Left of RUN)
      { dx: -96,  dy: -64 }, // S2 (Upper-left)
      { dx: -50,  dy: -82 }, // S3 (Top-center)
      { dx: 4,    dy: -66 }  // S4 (Above A)
    ];
    const off = offsets[index] || { dx: 0, dy: 0 };
    return {
      x: width - cfg.sideMargin + off.dx * scale,
      y: height - cfg.bottomOffset + off.dy * scale,
      radius: 17 * scale
    };
  }

  public update(deltaTime: number): void {
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

    const cfg = ControlSettingsManager.get();

    for (let i = 0; i < Math.min(skills.length, 4); i++) {
      const slot = this.getSkillSlot(i, screenWidth, screenHeight, cfg);
      const dist = Math.hypot(touchX - slot.x, touchY - slot.y);

      if (dist < slot.radius * 1.5) {
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

    if (this.player.level < skill.unlockLevel) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, `Terkunci! Butuh Lv. ${skill.unlockLevel}`, '#f87171');
      return;
    }

    if (skill.currentCooldown > 0) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, `Cooldown: ${skill.currentCooldown.toFixed(1)}s`, '#fbbf24');
      return;
    }

    if (this.player.mp < skill.manaCost) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Mana Tidak Cukup!', '#38bdf8');
      return;
    }

    this.player.mp -= skill.manaCost;
    skill.currentCooldown = skill.cooldown;

    const px = this.player.x + 10;
    const py = this.player.y + 14;

    this.floatingText.spawn(px, py - 22, `[${skill.name}]`, skill.color, 1.4);

    // 1. Magician Elemental Skills
    if (skill.role === 'MAGICIAN') {
      const dirX = this.player.direction === 'right' ? 32 : (this.player.direction === 'left' ? -32 : 0);
      const dirY = this.player.direction === 'down' ? 32 : (this.player.direction === 'up' ? -32 : 0);

      if (skill.id.startsWith('fire') || skill.id === 'abnormal_fire') {
        const isAbnormal = skill.id === 'abnormal_fire';
        this.visualEffects.push({
          x: px + dirX,
          y: py + dirY,
          type: isAbnormal ? 'abnormal' : 'fire',
          timer: isAbnormal ? 1.0 : 0.5,
          maxTimer: isAbnormal ? 1.0 : 0.5,
          radius: isAbnormal ? 70 : (skill.isPrimaryElement ? 34 : 20),
          color: '#ef4444'
        });
        if (isAbnormal) {
          this.floatingText.spawn(px, py - 35, '💥 EXPLOSION MAGIC!!', '#dc2626', 2.5);
        }
        return;
      }

      if (skill.id.startsWith('ice') || skill.id === 'abnormal_ice') {
        const isAbnormal = skill.id === 'abnormal_ice';
        this.visualEffects.push({
          x: px,
          y: py,
          type: isAbnormal ? 'abnormal' : 'ice',
          timer: isAbnormal ? 1.0 : 0.6,
          maxTimer: isAbnormal ? 1.0 : 0.6,
          radius: isAbnormal ? 80 : (skill.isPrimaryElement ? 44 : 26),
          color: '#38bdf8'
        });
        if (isAbnormal) {
          this.floatingText.spawn(px, py - 35, '❄️ ABSOLUTE ZERO DOMAIN!', '#0284c7', 2.5);
        }
        return;
      }

      if (skill.id.startsWith('lightning') || skill.id === 'abnormal_lightning') {
        const isAbnormal = skill.id === 'abnormal_lightning';
        this.visualEffects.push({
          x: px + dirX,
          y: py + dirY,
          type: isAbnormal ? 'abnormal' : 'lightning',
          timer: isAbnormal ? 0.8 : 0.45,
          maxTimer: isAbnormal ? 0.8 : 0.45,
          radius: isAbnormal ? 75 : 40,
          color: '#facc15'
        });
        if (isAbnormal) {
          this.floatingText.spawn(px, py - 35, '⚡ KIRIN THUNDER GOD!', '#eab308', 2.5);
        }
        return;
      }

      if (skill.id.startsWith('wind') || skill.id === 'abnormal_wind') {
        const isAbnormal = skill.id === 'abnormal_wind';
        this.visualEffects.push({
          x: px + dirX,
          y: py + dirY,
          type: isAbnormal ? 'abnormal' : 'wind',
          timer: isAbnormal ? 0.9 : 0.5,
          maxTimer: isAbnormal ? 0.9 : 0.5,
          radius: isAbnormal ? 70 : 36,
          color: '#4ade80'
        });
        if (isAbnormal) {
          this.floatingText.spawn(px, py - 35, '🌪️ KAMAITACHI VOID TYPHOON!', '#16a34a', 2.5);
        }
        return;
      }

      if (skill.id.startsWith('earth') || skill.id === 'abnormal_earth') {
        const isAbnormal = skill.id === 'abnormal_earth';
        this.visualEffects.push({
          x: px + dirX,
          y: py + dirY,
          type: isAbnormal ? 'abnormal' : 'earth',
          timer: isAbnormal ? 1.0 : 0.55,
          maxTimer: isAbnormal ? 1.0 : 0.55,
          radius: isAbnormal ? 75 : 36,
          color: '#a16207'
        });
        if (isAbnormal) {
          this.floatingText.spawn(px, py - 35, '☄️ GAIA CATACLYSM METEOR!', '#854d0e', 2.5);
        }
        return;
      }

      if (skill.id === 'teleport') {
        const dist = 90;
        if (this.player.direction === 'right') this.player.x += dist;
        else if (this.player.direction === 'left') this.player.x -= dist;
        else if (this.player.direction === 'down') this.player.y += dist;
        else if (this.player.direction === 'up') this.player.y -= dist;
        this.visualEffects.push({
          x: this.player.x + 10,
          y: this.player.y + 14,
          type: 'barrier',
          timer: 0.3,
          maxTimer: 0.3,
          radius: 26,
          color: '#a855f7'
        });
        return;
      }
    }

    // 2. Non-Magician Skills
    switch (skill.id) {
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
      } else if (fx.type === 'fire') {
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - alpha * 0.25), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.type === 'ice') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.fillRect(fx.x + Math.cos(a) * fx.radius * 0.7, fx.y + Math.sin(a) * fx.radius * 0.7, 4, 4);
        }
      } else if (fx.type === 'lightning') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx.x - 15, fx.y - 25);
        ctx.lineTo(fx.x, fx.y);
        ctx.lineTo(fx.x + 15, fx.y - 10);
        ctx.stroke();
      } else if (fx.type === 'wind') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - alpha * 0.3), 0, Math.PI * 1.8);
        ctx.stroke();
      } else if (fx.type === 'earth') {
        ctx.fillStyle = fx.color;
        ctx.fillRect(fx.x - 12, fx.y - 8, 24, 16);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(fx.x - 8, fx.y - 12, 16, 20);
      } else if (fx.type === 'heal') {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx.x - 4, fx.y - 8, 8, 2);
        ctx.fillRect(fx.x - 1, fx.y - 11, 2, 8);
      } else if (fx.type === 'summon' || fx.type === 'barrier') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.type === 'abnormal') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - alpha * 0.2), 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = fx.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public renderTouchSkillBar(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    const skills = this.player.skills;
    if (skills.length === 0) return;

    const cfg = ControlSettingsManager.get();
    const alpha = cfg.opacity;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (let i = 0; i < Math.min(skills.length, 4); i++) {
      const skill = skills[i];
      if (!skill) continue;

      const slot = this.getSkillSlot(i, screenWidth, screenHeight, cfg);
      const isUnlocked = this.player.level >= skill.unlockLevel;
      const isOnCooldown = skill.currentCooldown > 0;

      // Circle Button
      ctx.fillStyle = isUnlocked ? (isOnCooldown ? '#1e293b' : 'rgba(15, 23, 42, 0.85)') : 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = isUnlocked ? (isOnCooldown ? '#475569' : (skill.isPrimaryElement ? '#fbbf24' : skill.color)) : '#334155';
      ctx.lineWidth = skill.isPrimaryElement ? 2.5 : 2;
      ctx.stroke();

      // Symbol
      ctx.font = `${Math.floor(slot.radius * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isUnlocked) {
        ctx.fillText(skill.iconSymbol, slot.x, slot.y);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText('🔒', slot.x, slot.y);
      }

      // Unlock requirement badge
      if (!isUnlocked) {
        ctx.font = 'bold 7px sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText(`Lv.${skill.unlockLevel}`, slot.x, slot.y + slot.radius + 7);
      }

      // Cooldown sweep overlay
      if (isUnlocked && isOnCooldown) {
        const sweep = skill.currentCooldown / skill.cooldown;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.moveTo(slot.x, slot.y);
        ctx.arc(slot.x, slot.y, slot.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(skill.currentCooldown.toFixed(1), slot.x, slot.y);
      }

      // Small Skill Tag (★1, 2, 3, 4)
      ctx.fillStyle = skill.isPrimaryElement ? '#fde047' : '#94a3b8';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(skill.isPrimaryElement ? '★1' : `${i + 1}`, slot.x - slot.radius + 5, slot.y - slot.radius + 5);
    }

    ctx.restore();
  }
}
