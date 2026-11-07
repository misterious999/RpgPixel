import { SupabaseService, GameSaveData } from '../services/SupabaseService.ts';
import { Player } from '../entities/Player.ts';
import { Chest } from '../world/Chest.ts';
import { FloatingTextManager } from './FloatingText.ts';
import { RoleType } from '../types/GameTypes.ts';
import { PwaService } from '../services/PwaService.ts';

export class AuthUI {
  private player: Player;
  private chests: Chest[];
  private floatingText: FloatingTextManager;

  public isGuest: boolean = false;
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
        this.isGuest = false;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = avatarUrl;
          img.onload = () => {
            this.avatarImg = img;
          };
        }
      } else {
        this.avatarImg = null;
      }
    });
  }

  public async loadCloudSave(userId: string): Promise<boolean> {
    const save = await SupabaseService.loadGameSave(userId);
    if (!save) return false;

    if (save.display_name) this.player.username = save.display_name;
    if (typeof save.world_x === 'number') this.player.x = save.world_x;
    if (typeof save.world_y === 'number') this.player.y = save.world_y;
    if (typeof save.hp === 'number') this.player.hp = save.hp;
    if (typeof save.max_hp === 'number') this.player.maxHp = save.max_hp;
    if (typeof save.mp === 'number') this.player.mp = save.mp;
    if (typeof save.max_mp === 'number') this.player.maxMp = save.max_mp;
    if (typeof save.level === 'number') this.player.level = save.level;
    if (typeof save.exp === 'number') this.player.exp = save.exp;
    if (typeof save.max_exp === 'number') this.player.maxExp = save.max_exp;
    if (save.magician_affinities) this.player.magicianAffinities = save.magician_affinities;
    if (save.role) this.player.setRole(save.role as RoleType, save.magician_affinities);

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

    return true;
  }

  public async saveCurrentGame(): Promise<void> {
    if (this.isGuest) return; // Guest mode does not write to Cloud

    const user = SupabaseService.currentUser;
    if (!user || this.isSaving) return;

    this.isSaving = true;
    const openedChestsIndices: number[] = [];
    this.chests.forEach((chest, idx) => {
      if (chest.isOpen) openedChestsIndices.push(idx);
    });

    const saveData: Partial<GameSaveData> = {
      display_name: this.player.username,
      avatar_url: user.user_metadata?.avatar_url || '',
      costume_id: this.player.costume.id,
      role: this.player.role,
      magician_affinities: this.player.magicianAffinities,
      level: this.player.level,
      exp: this.player.exp,
      max_exp: this.player.maxExp,
      hp: this.player.hp,
      max_hp: this.player.maxHp,
      mp: this.player.mp,
      max_mp: this.player.maxMp,
      world_x: this.player.x,
      world_y: this.player.y,
      inventory: this.player.inventory.slots,
      opened_chests: openedChestsIndices
    };

    const success = await SupabaseService.saveGame(user.id, saveData);
    this.isSaving = false;

    if (success) {
      const now = new Date();
      this.lastSavedTimeText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      this.floatingText.spawn(this.player.x + 10, this.player.y - 15, '💾 Cloud Save Tersimpan!', '#38bdf8', 1.5);
    }
  }

  public update(deltaTime: number): void {
    if (!this.isGuest && SupabaseService.currentUser) {
      this.autoSaveTimer += deltaTime;
      if (this.autoSaveTimer >= 30) {
        this.autoSaveTimer = 0;
        this.saveCurrentGame();
      }
    }
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number): boolean {
    const baseRight = PwaService.isInstallable ? 235 : 150;

    if (this.isGuest) {
      // Guest: Option to bind account to Google
      const bindBtnW = 100;
      const bindBtnH = 32;
      const bindBtnX = screenWidth - baseRight - bindBtnW;
      const bindBtnY = 12;

      if (
        touchX >= bindBtnX &&
        touchX <= bindBtnX + bindBtnW &&
        touchY >= bindBtnY &&
        touchY <= bindBtnY + bindBtnH
      ) {
        if (confirm('Hubungkan dengan Google untuk menyimpan progres game ke Cloud?')) {
          SupabaseService.loginWithGoogle();
        }
        return true;
      }
      return false;
    }

    const user = SupabaseService.currentUser;
    if (user) {
      // "💾 Simpan" button
      const saveBtnW = 60;
      const saveBtnH = 30;
      const saveBtnX = screenWidth - baseRight - saveBtnW;
      const saveBtnY = 12;

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
      const logoutBtnW = 50;
      const logoutBtnH = 30;
      const logoutBtnX = saveBtnX - logoutBtnW - 6;
      const logoutBtnY = 12;

      if (
        touchX >= logoutBtnX &&
        touchX <= logoutBtnX + logoutBtnW &&
        touchY >= logoutBtnY &&
        touchY <= logoutBtnY + logoutBtnH
      ) {
        if (confirm('Apakah Anda yakin ingin logout? Progres lokal akan ditutup.')) {
          SupabaseService.logout();
          window.location.reload();
        }
        return true;
      }
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    ctx.save();
    const baseRight = PwaService.isInstallable ? 235 : 150;

    if (this.isGuest) {
      // --- Guest Profile Tag ---
      const pillW = 100;
      const pillH = 32;
      const pillX = screenWidth - baseRight - pillW;
      const pillY = 12;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(pillX, pillY, pillW, pillH);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('👤 Akun Tamu', pillX + 10, pillY + 13);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.fillText('Data Sementara', pillX + 10, pillY + 24);

      ctx.restore();
      return;
    }

    const user = SupabaseService.currentUser;
    if (user) {
      const name = this.player.username || user.user_metadata?.full_name || 'Petualang';

      const saveBtnW = 60;
      const saveBtnH = 30;
      const saveBtnX = screenWidth - baseRight - saveBtnW;
      const saveBtnY = 12;

      const logoutBtnW = 50;
      const logoutBtnH = 30;
      const logoutBtnX = saveBtnX - logoutBtnW - 6;
      const logoutBtnY = 12;

      // 1. "Keluar" (Logout) button
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

      // 3. User Avatar Pill
      const pillW = 95;
      const pillH = 30;
      const pillX = logoutBtnX - pillW - 6;
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
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0).toUpperCase(), avX, avY);
      }
      ctx.restore();

      // Display Name
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const displayName = name.length > 8 ? name.substring(0, 7) + '..' : name;
      ctx.fillText(displayName, pillX + 34, pillY + 6);

      // Cloud status dot
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
