import { AudioEngine } from '../audio/AudioEngine.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewardVal: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export class AchievementSystem {
  private static instance: AchievementSystem | null = null;

  public achievements: Achievement[] = [
    {
      id: 'ACH_FIRST_BLOOD',
      name: 'Langkah Pertama Pahlawan',
      description: 'Kalahkan monster pertamamu di alam bebas.',
      icon: '🗡️',
      rewardVal: 50,
      isUnlocked: false
    },
    {
      id: 'ACH_ALL_WAYSTONES',
      name: 'Penjelajah Lima Desa',
      description: 'Aktifkan seluruh 5 Prasasti Waystone di penjuru Lembah Serikat.',
      icon: '🌍',
      rewardVal: 300,
      isUnlocked: false
    },
    {
      id: 'ACH_FISHING_MASTER',
      name: 'Pemancing Ulung Danau',
      description: 'Berhasil menangkap 5 ikan segar di Danau Azure.',
      icon: '🎣',
      rewardVal: 150,
      isUnlocked: false
    },
    {
      id: 'ACH_FARMER_BOY',
      name: 'Sahabat Tani Ambervale',
      description: 'Panen 5 seikat gandum emas di ladang Dusun Ambervale.',
      icon: '🌾',
      rewardVal: 120,
      isUnlocked: false
    },
    {
      id: 'ACH_MILLER',
      name: 'Tukang Giling Tepung',
      description: 'Giling tepung gandum menggunakan batu kincir angin Ambervale.',
      icon: '⚙️',
      rewardVal: 100,
      isUnlocked: false
    },
    {
      id: 'ACH_MINER',
      name: 'Penambang Granit Stonewatch',
      description: 'Tambang 5 bongkah bijih besi abisal di tebing Stonewatch.',
      icon: '⛏️',
      rewardVal: 150,
      isUnlocked: false
    },
    {
      id: 'ACH_BOSS_SLIME',
      name: 'Penakluk Goa Makam',
      description: 'Kalahkan Raja Slime Purba di Altar Lantai 1 Dungeon Gua.',
      icon: '👑',
      rewardVal: 250,
      isUnlocked: false
    },
    {
      id: 'ACH_BOSS_TITAN',
      name: 'Penakluk Titan Kolosal',
      description: 'Tumbangkan Titan Abisal Kuno di Lantai 2 Dungeon.',
      icon: '⚡',
      rewardVal: 400,
      isUnlocked: false
    },
    {
      id: 'ACH_BOSS_DRAGON',
      name: 'Pembantai Raja Naga Ignis',
      description: 'Kalahkan Raja Naga Api Ignis di Altar Neraka Lantai 3.',
      icon: '🔥',
      rewardVal: 1000,
      isUnlocked: false
    },
    {
      id: 'ACH_PET_TAMER',
      name: 'Sahabat Sejati Satwa',
      description: 'Jinakkan seekor monster menjadi pet pendamping setiamu.',
      icon: '🐾',
      rewardVal: 200,
      isUnlocked: false
    },
    {
      id: 'ACH_RICH_HERO',
      name: 'Jutawan Kerajaan',
      description: 'Miliki saldo simpanan minimal 1.000 Val di Bank Kerajaan.',
      icon: '💎',
      rewardVal: 500,
      isUnlocked: false
    },
    {
      id: 'ACH_MASTER_CHEF',
      name: 'Koki Bintang Lima',
      description: 'Masak hidangan lezat di Dapur Kuliner Petualang Gaston.',
      icon: '🍲',
      rewardVal: 150,
      isUnlocked: false
    }
  ];

  // Counters
  public monsterKillsCount: number = 0;
  public fishCaughtCount: number = 0;
  public wheatHarvestCount: number = 0;
  public oreMinedCount: number = 0;

  // Banner Animasi Toast Pop-up
  private bannerAchievement: Achievement | null = null;
  private bannerTimer: number = 0;
  private bannerDuration: number = 4.0;

  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;

  constructor() {
    this.load();
    this.createUI();
  }

  public static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  public update(deltaTime: number): void {
    if (this.bannerTimer > 0) {
      this.bannerTimer = Math.max(0, this.bannerTimer - deltaTime);
      if (this.bannerTimer === 0) {
        this.bannerAchievement = null;
      }
    }
  }

  public unlock(id: string, player?: Player): void {
    const ach = this.achievements.find((a) => a.id === id);
    if (!ach || ach.isUnlocked) return;

    ach.isUnlocked = true;
    ach.unlockedAt = new Date().toLocaleDateString('id-ID');

    this.save();
    AudioEngine.play('quest_complete');

    // Berikan reward Val jika player ada
    if (player) {
      player.addVal(ach.rewardVal);
      FloatingTextManager.getInstance().addText(
        player.x + 16,
        player.y - 24,
        `🏆 ${ach.name}! +${ach.rewardVal} Val`,
        '#facc15'
      );
    }

    // Tampilkan banner toast
    this.bannerAchievement = ach;
    this.bannerTimer = this.bannerDuration;
  }

  // --- PROGRESS TRACKING HOOKS ---
  public onMonsterKill(player?: Player): void {
    this.monsterKillsCount++;
    this.unlock('ACH_FIRST_BLOOD', player);
    this.save();
  }

  public onFishCatch(player?: Player): void {
    this.fishCaughtCount++;
    if (this.fishCaughtCount >= 5) {
      this.unlock('ACH_FISHING_MASTER', player);
    }
    this.save();
  }

  public onHarvestWheat(player?: Player): void {
    this.wheatHarvestCount++;
    if (this.wheatHarvestCount >= 5) {
      this.unlock('ACH_FARMER_BOY', player);
    }
    this.save();
  }

  public onMineOre(player?: Player): void {
    this.oreMinedCount++;
    if (this.oreMinedCount >= 5) {
      this.unlock('ACH_MINER', player);
    }
    this.save();
  }

  public onMillFlour(player?: Player): void {
    this.unlock('ACH_MILLER', player);
  }

  public onCook(player?: Player): void {
    this.unlock('ACH_MASTER_CHEF', player);
  }

  public onTamePet(player?: Player): void {
    this.unlock('ACH_PET_TAMER', player);
  }

  public checkWaystones(unlockedCount: number, player?: Player): void {
    if (unlockedCount >= 5) {
      this.unlock('ACH_ALL_WAYSTONES', player);
    }
  }

  public checkBankVal(savings: number, player?: Player): void {
    if (savings >= 1000) {
      this.unlock('ACH_RICH_HERO', player);
    }
  }

  public onBossSlimeKill(player?: Player): void {
    this.unlock('ACH_BOSS_SLIME', player);
  }

  public onBossTitanKill(player?: Player): void {
    this.unlock('ACH_BOSS_TITAN', player);
  }

  public onBossDragonKill(player?: Player): void {
    this.unlock('ACH_BOSS_DRAGON', player);
  }

  // --- SAVE & LOAD ---
  private save(): void {
    try {
      const data = {
        achievements: this.achievements.map((a) => ({ id: a.id, isUnlocked: a.isUnlocked, unlockedAt: a.unlockedAt })),
        monsterKillsCount: this.monsterKillsCount,
        fishCaughtCount: this.fishCaughtCount,
        wheatHarvestCount: this.wheatHarvestCount,
        oreMinedCount: this.oreMinedCount
      };
      localStorage.setItem('minirpg_achievements', JSON.stringify(data));
    } catch (_e) {}
  }

  private load(): void {
    try {
      const raw = localStorage.getItem('minirpg_achievements');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.achievements) {
          for (const item of data.achievements) {
            const found = this.achievements.find((a) => a.id === item.id);
            if (found && item.isUnlocked) {
              found.isUnlocked = true;
              found.unlockedAt = item.unlockedAt;
            }
          }
        }
        this.monsterKillsCount = data.monsterKillsCount || 0;
        this.fishCaughtCount = data.fishCaughtCount || 0;
        this.wheatHarvestCount = data.wheatHarvestCount || 0;
        this.oreMinedCount = data.oreMinedCount || 0;
      }
    } catch (_e) {}
  }

  // --- MODAL UI ---
  public openModal(): void {
    this.isOpen = true;
    if (!this.container) {
      this.createUI();
    }
    this.renderUI();
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  public closeModal(): void {
    this.isOpen = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  private createUI(): void {
    const existing = document.getElementById('achievement-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'achievement-modal-container';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      font-family: system-ui, sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  private renderUI(): void {
    if (!this.container) return;

    const unlockedCount = this.achievements.filter((a) => a.isUnlocked).length;
    const totalCount = this.achievements.length;
    const percent = Math.round((unlockedCount / totalCount) * 100);

    let itemsHtml = '';
    for (const ach of this.achievements) {
      if (ach.isUnlocked) {
        itemsHtml += `
          <div style="background: rgba(30, 41, 59, 0.85); border: 1.5px solid #facc15; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${ach.icon}</span>
              <div>
                <div style="font-weight: bold; color: #fef08a; font-size: 13.5px;">${ach.name}</div>
                <div style="font-size: 11px; color: #cbd5e1;">${ach.description}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #4ade80; font-weight: bold;">+${ach.rewardVal} 𝒱</span>
              <div style="font-size: 9.5px; color: #94a3b8;">${ach.unlockedAt || 'Selesai'}</div>
            </div>
          </div>
        `;
      } else {
        itemsHtml += `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px dashed #475569; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; opacity: 0.65;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px; filter: grayscale(1);">🔒</span>
              <div>
                <div style="font-weight: bold; color: #94a3b8; font-size: 13.5px;">${ach.name}</div>
                <div style="font-size: 11px; color: #64748b;">${ach.description}</div>
              </div>
            </div>
            <span style="font-size: 11px; color: #64748b; font-weight: bold;">+${ach.rewardVal} 𝒱</span>
          </div>
        `;
      }
    }

    this.container.innerHTML = `
      <div style="background: #0f172a; border: 2px solid #facc15; border-radius: 12px; width: 92%; max-width: 450px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <!-- Header -->
        <div style="background: #1e293b; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(250, 204, 21, 0.3);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">🏆</span>
            <div>
              <div style="font-weight: bold; color: #f8fafc; font-size: 15px;">Pencapaian & Rekor Petualang</div>
              <div style="font-size: 11px; color: #facc15;">Kemajuan: ${unlockedCount}/${totalCount} (${percent}%)</div>
            </div>
          </div>
          <button id="close_ach_btn" style="background: none; border: none; color: #ef4444; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <!-- Progress Bar -->
        <div style="background: #1e293b; padding: 0 16px 10px 16px;">
          <div style="background: #334155; border-radius: 6px; height: 8px; overflow: hidden;">
            <div style="background: #facc15; height: 100%; width: ${percent}%; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- List -->
        <div style="padding: 14px; overflow-y: auto; flex: 1;">
          ${itemsHtml}
        </div>
      </div>
    `;

    document.getElementById('close_ach_btn')?.addEventListener('click', () => {
      this.closeModal();
    });
  }

  // --- RENDER CINEMATIC TOAST BANNER ---
  public renderBanner(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    if (!this.bannerAchievement || this.bannerTimer <= 0) return;

    ctx.save();
    const elapsed = this.bannerDuration - this.bannerTimer;
    let alpha = 1.0;
    if (elapsed < 0.4) {
      alpha = elapsed / 0.4;
    } else if (this.bannerTimer < 0.6) {
      alpha = this.bannerTimer / 0.6;
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const ach = this.bannerAchievement;
    const title = `🏆 PENCAPAIAN TERBUKA!`;
    const sub = `${ach.icon} ${ach.name} (+${ach.rewardVal} Val)`;

    ctx.font = 'bold 11px sans-serif';
    const tw = ctx.measureText(title).width;
    ctx.font = 'bold 10px sans-serif';
    const sw = ctx.measureText(sub).width;
    const bannerW = Math.max(220, Math.max(tw, sw) + 36);
    const bannerH = 42;
    const bannerX = (screenWidth - bannerW) / 2;
    const bannerY = 80;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Texts
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, bannerX + bannerW / 2, bannerY + 6);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(sub, bannerX + bannerW / 2, bannerY + 22);

    ctx.restore();
  }
}
