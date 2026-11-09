import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from './FloatingText.ts';
import { ControlSettingsManager } from '../core/ControlSettings.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export class QuickPotionUI {
  constructor(
    private player: Player,
    private floatingText: FloatingTextManager
  ) {}

  public getSlots(_screenWidth: number, screenHeight: number) {
    const cfg = ControlSettingsManager.get();
    const scale = cfg.buttonScale;
    const r = 18 * scale;

    // Tepat di atas joystick sebelah kiri bawah
    const baseY = screenHeight - cfg.bottomOffset - (64 * scale);
    const hpX = cfg.sideMargin - (20 * scale);
    const mpX = cfg.sideMargin + (26 * scale);

    return {
      hp: { x: hpX, y: baseY, radius: r },
      mp: { x: mpX, y: baseY, radius: r }
    };
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    const slots = this.getSlots(screenWidth, screenHeight);

    // 1. Cek Tombol Ramuan Darah (HP)
    const distHp = Math.hypot(touchX - slots.hp.x, touchY - slots.hp.y);
    if (distHp <= slots.hp.radius * 1.35) {
      this.useHpPotion();
      return true;
    }

    // 2. Cek Tombol Ramuan Mana (MP)
    const distMp = Math.hypot(touchX - slots.mp.x, touchY - slots.mp.y);
    if (distMp <= slots.mp.radius * 1.35) {
      this.useMpPotion();
      return true;
    }

    return false;
  }

  public useHpPotion(): void {
    const count = this.player.inventory.getItemCount('HEALTH_POTION');
    if (count <= 0) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Ramuan Darah Habis!', '#f87171');
      return;
    }

    if (this.player.hp >= this.player.maxHp) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Darah Sudah Penuh!', '#facc15');
      return;
    }

    const removed = this.player.inventory.removeItemsById('HEALTH_POTION', 1);
    if (removed) {
      const def = ITEM_DEFINITIONS['HEALTH_POTION'];
      const healAmt = def?.effectValue || 35;
      const healed = this.player.heal(healAmt);
      AudioEngine.playPotionDrink();
      this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${healed} HP Pulih!`, '#4ade80', 1.8);
    }
  }

  public useMpPotion(): void {
    const count = this.player.inventory.getItemCount('MANA_POTION');
    if (count <= 0) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Ramuan Mana Habis!', '#f87171');
      return;
    }

    if (this.player.mp >= this.player.maxMp) {
      this.floatingText.spawn(this.player.x + 10, this.player.y - 12, 'Mana Sudah Penuh!', '#38bdf8');
      return;
    }

    const removed = this.player.inventory.removeItemsById('MANA_POTION', 1);
    if (removed) {
      const def = ITEM_DEFINITIONS['MANA_POTION'];
      const restoreAmt = def?.effectValue || 40;
      const restored = this.player.restoreMp(restoreAmt);
      AudioEngine.playPotionDrink();
      this.floatingText.spawn(this.player.x + 10, this.player.y - 14, `+${restored} MP Pulih!`, '#38bdf8', 1.8);
    }
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    const cfg = ControlSettingsManager.get();
    const slots = this.getSlots(screenWidth, screenHeight);
    const hpCount = this.player.inventory.getItemCount('HEALTH_POTION');
    const mpCount = this.player.inventory.getItemCount('MANA_POTION');

    ctx.save();
    ctx.globalAlpha = Math.max(0.4, Math.min(1.0, cfg.opacity));

    // --- TOMBOL QUICK HP POTION (MERAH) ---
    const { x: hx, y: hy, radius: hr } = slots.hp;
    ctx.fillStyle = hpCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.4)';
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hpCount > 0 ? '#ef4444' : '#64748b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ikon Botol HP
    ctx.font = `${Math.floor(hr * 0.95)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍷', hx, hy - 1);

    // Badge Jumlah HP
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(hx + hr * 0.7, hy + hr * 0.7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = hpCount > 0 ? '#f8fafc' : '#94a3b8';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText(`${hpCount}`, hx + hr * 0.7, hy + hr * 0.7);

    // --- TOMBOL QUICK MP POTION (BIRU) ---
    const { x: mx, y: my, radius: mr } = slots.mp;
    ctx.fillStyle = mpCount > 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.4)';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mpCount > 0 ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ikon Botol MP
    ctx.font = `${Math.floor(mr * 0.95)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧪', mx, my - 1);

    // Badge Jumlah MP
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(mx + mr * 0.7, my + mr * 0.7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = mpCount > 0 ? '#f8fafc' : '#94a3b8';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText(`${mpCount}`, mx + mr * 0.7, my + mr * 0.7);

    ctx.restore();
  }
}
