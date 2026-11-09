import { SupabaseService, GameSaveData } from '../services/SupabaseService.ts';
import { Player } from '../entities/Player.ts';
import { Chest } from '../world/Chest.ts';
import { FloatingTextManager } from './FloatingText.ts';
import { RoleType } from '../types/GameTypes.ts';
import { NotificationModal } from './NotificationModal.ts';
import { CONSTANTS } from '../core/Constants.ts';

export class AuthUI {
  private player: Player;
  private chests: Chest[];
  private floatingText: FloatingTextManager;

  public isGuest: boolean = false;
  public getCurrentMap?: () => string;
  public getQuestSaveData?: () => any[];
  public onQuestDataLoaded?: (data: any[]) => void;
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
    if (save.role) {
      this.player.setRole(save.role as RoleType, save.magician_affinities, true);
      if (save.role !== 'NOVICE') {
        this.player.hasLockedRole = true;
      }
    }

    // Restore Inventory
    if (Array.isArray(save.inventory)) {
      this.player.inventory.slots = new Array(this.player.inventory.capacity).fill(null);
      for (let i = 0; i < Math.min(save.inventory.length, this.player.inventory.capacity); i++) {
        this.player.inventory.slots[i] = save.inventory[i];
      }
    }

    // Pastikan Kartu Petualang selalu ada jika role sudah terkunci
    if (this.player.hasLockedRole && this.player.role !== 'NOVICE') {
      const hasCard = this.player.inventory.slots.some(s => s && s.itemId === 'ADVENTURER_CARD');
      if (!hasCard) {
        this.player.inventory.addItem('ADVENTURER_CARD', 1);
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

    // Restore Weapons
    if (save.equipped_weapon_id) {
      this.player.equippedWeaponId = save.equipped_weapon_id;
    }
    if (Array.isArray(save.unlocked_weapons)) {
      this.player.unlockedWeaponIds = save.unlocked_weapons;
    }

    // Restore Quests
    if (Array.isArray(save.quests) && this.onQuestDataLoaded) {
      this.onQuestDataLoaded(save.quests);
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

    // Jika berada di dalam dungeon (Lt.1, Lt.2, atau Lt.3) saat cloud-save, simpan koordinat aman di depan pintu goa overworld
    const isDungeon = this.getCurrentMap && this.getCurrentMap() !== 'OVERWORLD';
    const spawnX = isDungeon ? 50 * CONSTANTS.TILE_SIZE + 6 : this.player.x;
    const spawnY = isDungeon ? 35 * CONSTANTS.TILE_SIZE + 3 : this.player.y;

    const saveData: Partial<GameSaveData> = {
      display_name: this.player.username,
      avatar_url: user.user_metadata?.avatar_url || '',
      costume_id: this.player.costume.id,
      role: this.player.role,
      magician_affinities: this.player.magicianAffinities,
      level: this.player.level,
      exp: this.player.exp,
      max_exp: this.player.maxExp,
      hp: Math.floor(this.player.hp),
      max_hp: this.player.maxHp,
      mp: Math.floor(this.player.mp),
      max_mp: this.player.maxMp,
      world_x: spawnX,
      world_y: spawnY,
      inventory: this.player.inventory.slots,
      opened_chests: openedChestsIndices,
      equipped_weapon_id: this.player.equippedWeaponId || undefined,
      unlocked_weapons: this.player.unlockedWeaponIds,
      quests: this.getQuestSaveData ? this.getQuestSaveData() : undefined
    };

    const success = await SupabaseService.saveGame(user.id, saveData);
    this.isSaving = false;

    if (success) {
      const now = new Date();
      this.lastSavedTimeText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      this.floatingText.spawn(this.player.x + 10, this.player.y - 15, '💾 Cloud Save Tersimpan!', '#38bdf8', 1.5);
    }
  }

  /**
   * Logout bersih untuk berganti akun (Google maupun Tamu)
   */
  public async performLogout(): Promise<void> {
    if (!this.isGuest && SupabaseService.currentUser) {
      try {
        await this.saveCurrentGame();
      } catch (e) {
        console.warn('Error saving game before logout:', e);
      }
    }

    try {
      localStorage.removeItem('rpg2d_session_save');
      localStorage.removeItem('rpg2d_guest_id');
    } catch (e) {
      console.warn('Error clearing local session save:', e);
    }

    await SupabaseService.logout();
    window.location.reload();
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
    const btnX = screenWidth - 212;
    const btnY = 10;
    const btnSize = 34;

    if (
      touchX >= btnX &&
      touchX <= btnX + btnSize &&
      touchY >= btnY &&
      touchY <= btnY + btnSize
    ) {
      if (this.isGuest) {
        NotificationModal.confirm({
          title: 'MODE OFFLINE (AKUN TAMU)',
          message: 'Anda saat ini bermain sebagai Akun Tamu. Sambungkan akun Google agar seluruh progres level, role, dan senjata tersimpan aman di Cloud, atau keluar untuk ganti akun?',
          icon: '📴',
          confirmText: '☁️ Hubungkan Google',
          cancelText: '🚪 Keluar Tamu',
          variant: 'primary',
          onConfirm: () => {
            SupabaseService.loginWithGoogle();
          },
          onCancel: () => {
            NotificationModal.confirm({
              title: 'KELUAR DARI AKUN TAMU',
              message: 'Keluar ke menu utama? Anda dapat login dengan akun Google atau membuat petualangan baru.',
              icon: '🚪',
              confirmText: 'Ya, Keluar',
              cancelText: 'Tetap Main',
              variant: 'danger',
              onConfirm: () => {
                this.performLogout();
              }
            });
          }
        });
        return true;
      }

      const user = SupabaseService.currentUser;
      if (user) {
        const name = this.player.username || user.user_metadata?.full_name || 'Petualang';
        NotificationModal.confirm({
          title: `AKUN CLOUD (${name})`,
          message: `Progres tersinkronisasi dengan Google Cloud.\nTerakhir disimpan: ${this.lastSavedTimeText || 'Sinkronisasi Otomatis'}.\n\nSimpan progres sekarang atau keluar untuk ganti akun?`,
          icon: '☁️',
          confirmText: '💾 Simpan Sekarang',
          cancelText: '🚪 Keluar Akun',
          variant: 'primary',
          onConfirm: () => {
            this.saveCurrentGame();
          },
          onCancel: () => {
            NotificationModal.confirm({
              title: 'KELUAR & GANTI AKUN',
              message: 'Progres akan disimpan terlebih dahulu ke Cloud sebelum keluar. Lanjutkan?',
              icon: '🚪',
              confirmText: 'Simpan & Keluar',
              cancelText: 'Tetap Main',
              variant: 'danger',
              onConfirm: () => {
                this.performLogout();
              }
            });
          }
        });
        return true;
      }
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    ctx.save();
    const btnX = screenWidth - 212;
    const btnY = 10;
    const btnSize = 34;
    const cx = btnX + btnSize / 2;
    const cy = btnY + btnSize / 2;

    if (this.isGuest) {
      // Guest Button
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, btnSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☁️', cx, cy - 1);

      // Amber dot (Offline)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(btnX + 26, btnY + 26, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
      return;
    }

    const user = SupabaseService.currentUser;
    if (user) {
      const name = this.player.username || user.user_metadata?.full_name || 'Petualang';

      ctx.fillStyle = this.isSaving ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, btnSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.isSaving ? '#38bdf8' : '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Avatar or Icon inside
      if (this.avatarImg && this.avatarImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.avatarImg, cx - 11, cy - 11, 22, 22);
        ctx.restore();
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0).toUpperCase(), cx, cy);
      }

      // Green dot (Online Sync)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(btnX + 26, btnY + 26, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}
