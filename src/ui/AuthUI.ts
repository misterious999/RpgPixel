import { SupabaseService, GameSaveData } from '../services/SupabaseService.ts';
import { Player } from '../entities/Player.ts';
import { Chest } from '../world/Chest.ts';
import { FloatingTextManager } from './FloatingText.ts';

export class AuthUI {
  private player: Player;
  private chests: Chest[];
  private floatingText: FloatingTextManager;

  private avatarImg: HTMLImageElement | null = null;
  private isSaving: boolean = false;
  private autoSaveTimer: number = 0;
  private lastSavedTimeText: string = '';

  constructor(player: Player, chests: Chest[], floatingText: FloatingTextManager) {
    this.player = player;
    this.chests = chests;
    this.floatingText = floatingText;

    SupabaseService.onAuthChange((user) => {
      if (user) {
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = avatarUrl;
          img.onload = () => {
            this.avatarImg = img;
          };
        }
        // Load cloud save
        this.loadCloudSave(user.id);
      } else {
        this.avatarImg = null;
      }
    });
  }

  private async loadCloudSave(userId: string): Promise<void> {
    this.floatingText.spawn(this.player.x + 10, this.player.y - 10, 'Memuat Cloud Save...', '#38bdf8', 2.0);
    const save = await SupabaseService.loadGameSave(userId);

    if (save) {
      if (typeof save.world_x === 'number' && typeof save.world_y === 'number') {
        this.player.x = save.world_x;
        this.player.y = save.world_y;
      }
      if (typeof save.hp === 'number') {
        this.player.hp = save.hp;
      }
      if (typeof save.max_hp === 'number') {
        this.player.maxHp = save.max_hp;
      }

      // Restore Inventory
      if (Array.isArray(save.inventory)) {
        this.player.inventory.slots = new Array(this.player.inventory.capacity).fill(null);
        for (let i = 0; i < Math.min(save.inventory.length, this.player.inventory.capacity); i++) {
          this.player.inventory.slots[i] = save.inventory[i];
        }
      }

      // Restore opened chests
      if (Array.isArray(save.opened_chests)) {
        for (const idx of save.opened_chests) {
          if (this.chests[idx]) {
            this.chests[idx].isOpen = true;
          }
        }
      }

      const name = SupabaseService.currentUser?.user_metadata?.full_name || 'Petualang';
      this.floatingText.spawn(this.player.x + 10, this.player.y - 20, `Halo, ${name}! Game dimuat.`, '#4ade80', 2.5);
    } else {
      // First time saving
      await this.saveCurrentGame();
    }
  }

  public async saveCurrentGame(): Promise<void> {
    const user = SupabaseService.currentUser;
    if (!user || this.isSaving) return;

    this.isSaving = true;
    const openedChestsIndices: number[] = [];
    this.chests.forEach((chest, idx) => {
      if (chest.isOpen) openedChestsIndices.push(idx);
    });

    const saveData: GameSaveData = {
      user_id: user.id,
      hp: this.player.hp,
      max_hp: this.player.maxHp,
      world_x: this.player.x,
      world_y: this.player.y,
      inventory: this.player.inventory.slots,
      opened_chests: openedChestsIndices,
      display_name: user.user_metadata?.full_name || user.email || 'Petualang',
      avatar_url: user.user_metadata?.avatar_url || ''
    } as any;

    const success = await SupabaseService.saveGame(user.id, saveData);
    this.isSaving = false;

    if (success) {
      const now = new Date();
      this.lastSavedTimeText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      this.floatingText.spawn(this.player.x + 10, this.player.y - 15, '💾 Cloud Save Berhasil!', '#38bdf8', 1.5);
    }
  }

  public update(deltaTime: number): void {
    // Auto-save every 30 seconds if user is logged in
    if (SupabaseService.currentUser) {
      this.autoSaveTimer += deltaTime;
      if (this.autoSaveTimer >= 30) {
        this.autoSaveTimer = 0;
        this.saveCurrentGame();
      }
    }
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number): boolean {
    const user = SupabaseService.currentUser;

    if (!user) {
      // "Masuk Google" button at top right (left of backpack)
      const btnW = 120;
      const btnH = 34;
      const btnX = screenWidth - 180;
      const btnY = 14;

      if (
        touchX >= btnX &&
        touchX <= btnX + btnW &&
        touchY >= btnY &&
        touchY <= btnY + btnH
      ) {
        SupabaseService.loginWithGoogle();
        return true;
      }
    } else {
      // Logged in UI area:
      // "💾 Simpan" button
      const saveBtnW = 60;
      const saveBtnH = 30;
      const saveBtnX = screenWidth - 220;
      const saveBtnY = 14;

      if (
        touchX >= saveBtnX &&
        touchX <= saveBtnX + saveBtnW &&
        touchY >= saveBtnY &&
        touchY <= saveBtnY + saveBtnH
      ) {
        this.saveCurrentGame();
        return true;
      }

      // "Keluar" (Logout) button
      const logoutBtnW = 55;
      const logoutBtnH = 30;
      const logoutBtnX = screenWidth - 280;
      const logoutBtnY = 14;

      if (
        touchX >= logoutBtnX &&
        touchX <= logoutBtnX + logoutBtnW &&
        touchY >= logoutBtnY &&
        touchY <= logoutBtnY + logoutBtnH
      ) {
        if (confirm('Apakah Anda yakin ingin logout?')) {
          SupabaseService.logout();
        }
        return true;
      }
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    ctx.save();
    const user = SupabaseService.currentUser;

    if (!user) {
      // --- Tombol Masuk Google ---
      const btnW = 120;
      const btnH = 34;
      const btnX = screenWidth - 180;
      const btnY = 14;

      // Button background with glass blur look
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      // Google 'G' icon badge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(btnX + 18, btnY + btnH / 2, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea4335';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('G', btnX + 18, btnY + btnH / 2);

      // Button label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Masuk Google', btnX + 34, btnY + btnH / 2);
    } else {
      // --- User Logged In Profile Pill ---
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Petualang';

      // 1. "Keluar" (Logout) button
      const logoutBtnW = 55;
      const logoutBtnH = 30;
      const logoutBtnX = screenWidth - 280;
      const logoutBtnY = 14;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(logoutBtnX, logoutBtnY, logoutBtnW, logoutBtnH);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(logoutBtnX, logoutBtnY, logoutBtnW, logoutBtnH);

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Keluar', logoutBtnX + logoutBtnW / 2, logoutBtnY + logoutBtnH / 2);

      // 2. "💾 Simpan" Button
      const saveBtnW = 60;
      const saveBtnH = 30;
      const saveBtnX = screenWidth - 220;
      const saveBtnY = 14;

      ctx.fillStyle = this.isSaving ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.isSaving ? 'Menyimpan..' : '💾 Simpan', saveBtnX + saveBtnW / 2, saveBtnY + saveBtnH / 2);

      // 3. User Avatar Pill (next to backpack)
      const pillW = 95;
      const pillH = 34;
      const pillX = screenWidth - 152;
      const pillY = 12;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pillX, pillY, pillW, pillH);

      // Avatar circle
      const avX = pillX + 17;
      const avY = pillY + pillH / 2;
      const avR = 12;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avX, avY, avR, 0, Math.PI * 2);
      ctx.clip();

      if (this.avatarImg && this.avatarImg.complete) {
        ctx.drawImage(this.avatarImg, avX - avR, avY - avR, avR * 2, avR * 2);
      } else {
        // Fallback Initial
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0).toUpperCase(), avX, avY);
      }
      ctx.restore();

      // User name truncated
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const displayName = name.length > 8 ? name.substring(0, 7) + '..' : name;
      ctx.fillText(displayName, pillX + 34, pillY + 6);

      // Cloud green dot
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(pillX + 38, pillY + 23, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.fillText(this.lastSavedTimeText ? `Save ${this.lastSavedTimeText}` : 'Cloud Aktif', pillX + 44, pillY + 19);
    }

    ctx.restore();
  }
}
