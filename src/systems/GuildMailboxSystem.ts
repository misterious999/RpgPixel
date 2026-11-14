import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CONSTANTS } from '../core/Constants.ts';

export class GuildMailboxSystem {
  private static instance: GuildMailboxSystem | null = null;

  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;
  public lastClaimDate: string = '';

  constructor() {
    this.load();
    this.createUI();
  }

  public static getInstance(): GuildMailboxSystem {
    if (!GuildMailboxSystem.instance) {
      GuildMailboxSystem.instance = new GuildMailboxSystem();
    }
    return GuildMailboxSystem.instance;
  }

  private load(): void {
    try {
      this.lastClaimDate = localStorage.getItem('minirpg_mailbox_claim') || '';
    } catch (_e) {}
  }

  private save(): void {
    try {
      localStorage.setItem('minirpg_mailbox_claim', this.lastClaimDate);
    } catch (_e) {}
  }

  public canClaimToday(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return this.lastClaimDate !== today;
  }

  public isNearMailbox(playerX: number, playerY: number, currentMap: string): boolean {
    if (currentMap !== 'OVERWORLD') return false;
    const ts = CONSTANTS.TILE_SIZE;
    const mbX = 53 * ts + 10;
    const mbY = 50 * ts;
    const dist = Math.hypot(playerX + 16 - mbX, playerY + 16 - mbY);
    return dist <= 38;
  }

  public openModal(player: Player): void {
    this.isOpen = true;
    if (!this.container) {
      this.createUI();
    }
    this.renderUI(player);
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
    const existing = document.getElementById('mailbox-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'mailbox-modal-container';
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

  private renderUI(player: Player): void {
    if (!this.container) return;

    const canClaim = this.canClaimToday();

    this.container.innerHTML = `
      <div style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px; width: 92%; max-width: 420px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <!-- Header -->
        <div style="background: #1e293b; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.3);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">📬</span>
            <div>
              <div style="font-weight: bold; color: #f8fafc; font-size: 15px;">Kotak Pos Serikat Petualang</div>
              <div style="font-size: 11px; color: #38bdf8;">Layanan Logistik & Hadiah Harian Oakhaven</div>
            </div>
          </div>
          <button id="close_mailbox_btn" style="background: none; border: none; color: #ef4444; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <!-- Body Content -->
        <div style="padding: 16px;">
          <!-- Daily Login Reward Box -->
          <div style="background: rgba(30, 41, 59, 0.85); border: 1.5px solid ${canClaim ? '#facc15' : '#475569'}; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: bold; color: #fef08a; font-size: 13px;">🎁 Ransum Bantuan Harian Petualang</span>
              <span style="font-size: 10px; color: ${canClaim ? '#4ade80' : '#94a3b8'}; font-weight: bold;">
                ${canClaim ? 'SIAP KLAIM' : 'SUDAH DIKLAIM HARI INI'}
              </span>
            </div>
            <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 10px;">
              Isi paket: <b>+50 Val</b>, <b>2x Ramuan HP</b>, <b>1x Ramuan MP</b>, & <b>1x Koin Perak</b>.
            </div>
            ${
              canClaim
                ? `<button id="claim_reward_btn" style="width: 100%; background: #facc15; color: #0f172a; border: none; border-radius: 6px; padding: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
                    ✨ Klaim Ransum Harian
                  </button>`
                : `<button disabled style="width: 100%; background: #334155; color: #64748b; border: none; border-radius: 6px; padding: 8px; font-weight: bold; font-size: 13px; cursor: not-allowed;">
                    ✅ Sudah Diambil (Kembali Besok)
                  </button>`
            }
          </div>

          <!-- Guild Letter / Bulletin -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px;">
            <div style="font-weight: bold; color: #38bdf8; font-size: 12px; margin-bottom: 4px;">📜 Surat Maklumat Serikat Petualang:</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              "Kepada seluruh petualang terhormat, berhati-hatilah saat melintasi rimba menuju goa bawah tanah di utara. Jangan lupa memanfaatkan kincir angin Ambervale untuk menggiling gandum dan mancing ikan segar di danau Tirta Kencana untuk memulihkan tenaga!"
              <br><br>
              <i>— Tertanda, Komandan Galahad & Tetua Aldrich</i>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close_mailbox_btn')?.addEventListener('click', () => {
      this.closeModal();
    });

    if (canClaim) {
      document.getElementById('claim_reward_btn')?.addEventListener('click', () => {
        const today = new Date().toISOString().slice(0, 10);
        this.lastClaimDate = today;
        this.save();

        player.gold = (player.gold || 0) + 50;
        player.inventory.addItem('HEALTH_POTION', 2);
        player.inventory.addItem('MANA_POTION', 1);
        player.inventory.addItem('SILVER_COIN', 1);

        AudioEngine.play('quest_complete');
        FloatingTextManager.getInstance().addText(player.x + 16, player.y - 20, '🎁 Ransum Harian Berhasil Diklaim!', '#facc15');

        this.renderUI(player);
      });
    }
  }

  // --- RENDER VISUAL KOTAK POS DI ALUN-ALUN ---
  public render(ctx: CanvasRenderingContext2D, currentMap: string): void {
    if (currentMap !== 'OVERWORLD') return;
    const ts = CONSTANTS.TILE_SIZE;
    const mbX = 53 * ts + 10;
    const mbY = 50 * ts;

    ctx.save();
    // Tiang Kayu
    ctx.fillStyle = '#78350f';
    ctx.fillRect(mbX - 2, mbY + 8, 4, 14);

    // Kotak Pos Merah/Biru Klasik
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(mbX - 7, mbY - 4, 14, 14, [4, 4, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Celah Surat Kuning
    ctx.fillStyle = '#fde047';
    ctx.fillRect(mbX - 4, mbY, 8, 2);

    // Ikon Amplop / Tanda Notif jika belum diklaim
    if (this.canClaimToday()) {
      const pulse = Math.sin(Date.now() * 0.008) * 2;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(mbX + 5, mbY - 6 + pulse, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mbX + 5, mbY - 6 + pulse, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
