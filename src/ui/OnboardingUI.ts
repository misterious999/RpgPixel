import { CHARACTER_COSTUMES } from '../data/RolesData.ts';
import { CharacterCostume, GameState } from '../types/GameTypes.ts';
import { SupabaseService } from '../services/SupabaseService.ts';

export class OnboardingUI {
  public state: GameState = 'AUTH';
  public selectedCostumeIndex: number = 0;
  public username: string = '';
  public isGuest: boolean = false;

  private onCompleteCallback?: (username: string, costume: CharacterCostume, isGuest: boolean) => void;
  private animTimer: number = 0;

  constructor() {
    this.createDomOverlay();
  }

  public onComplete(cb: (username: string, costume: CharacterCostume, isGuest: boolean) => void): void {
    this.onCompleteCallback = cb;
  }

  private createDomOverlay(): void {
    // Check if DOM overlay container already exists
    let overlay = document.getElementById('onboarding-overlay');
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.background = 'radial-gradient(circle at center, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98))';
    overlay.style.zIndex = '100';
    overlay.style.color = '#f8fafc';
    overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const container = document.getElementById('game-container') || document.body;
    container.appendChild(overlay);

    this.renderHtml();
  }

  public setState(newState: GameState): void {
    this.state = newState;
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    if (this.state === 'PLAYING') {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'flex';
      this.renderHtml();
    }
  }

  public renderHtml(): void {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    if (this.state === 'AUTH') {
      overlay.innerHTML = `
        <div style="max-width: 360px; width: 90%; background: #0f172a; border: 2px solid #38bdf8; border-radius: 14px; padding: 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <div style="font-size: 26px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; letter-spacing: 1px;">OPEN WORLD RPG 2D</div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 24px;">Gerbang Masuk Petualangan</div>
          
          <button id="btn-google-login" style="width: 100%; padding: 14px; background: #ffffff; color: #1e293b; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <span style="font-size: 18px; color: #ea4335;">G</span>
            <span>Masuk dengan Google</span>
          </button>
          
          <div style="font-size: 11px; color: #64748b; margin-bottom: 14px;">(Progres otomatis tersimpan permanen di Cloud)</div>

          <div style="display: flex; align-items: center; margin: 16px 0;">
            <div style="flex: 1; height: 1px; background: #334155;"></div>
            <span style="padding: 0 10px; font-size: 11px; color: #64748b;">ATAU</span>
            <div style="flex: 1; height: 1px; background: #334155;"></div>
          </div>

          <button id="btn-guest-login" style="width: 100%; padding: 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #475569; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
            👤 Main sebagai Tamu (Sementara)
          </button>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 8px;">*Data tamu akan hilang saat tab ditutup</div>
        </div>
      `;

      document.getElementById('btn-google-login')?.addEventListener('click', () => {
        SupabaseService.loginWithGoogle();
      });

      document.getElementById('btn-guest-login')?.addEventListener('click', () => {
        this.isGuest = true;
        this.username = 'Tamu_' + Math.floor(1000 + Math.random() * 9000);
        this.setState('CHARACTER_CREATION');
      });

    } else if (this.state === 'CHARACTER_CREATION') {
      const costume = CHARACTER_COSTUMES[this.selectedCostumeIndex];

      overlay.innerHTML = `
        <div style="max-width: 380px; width: 92%; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 2px solid #38bdf8; border-radius: 14px; padding: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 2px;">KUSTOMISASI KARAKTER</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px;">Tentukan identitas pahlawanmu sebelum menjelajah</div>

          <!-- Live Preview Canvas -->
          <div style="margin: 0 auto 14px; width: 80px; height: 80px; background: #1e293b; border: 2px solid #38bdf8; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <canvas id="preview-avatar-canvas" width="64" height="64"></canvas>
          </div>

          <!-- Input Username -->
          <div style="text-align: left; margin-bottom: 14px;">
            <label style="font-size: 11px; font-weight: bold; color: #cbd5e1; display: block; margin-bottom: 6px;">
              Username (Maksimal 15 Karakter):
            </label>
            <input id="input-username" type="text" maxlength="15" value="${this.username}" placeholder="Nama Petualang..." 
              style="width: 100%; box-sizing: border-box; padding: 10px 14px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #ffffff; font-size: 14px; outline: none;">
            <div id="username-error" style="color: #ef4444; font-size: 10px; margin-top: 4px; display: none;">Username tidak boleh kosong!</div>
          </div>

          <!-- Costume Selection -->
          <div style="text-align: left; margin-bottom: 18px;">
            <label style="font-size: 11px; font-weight: bold; color: #cbd5e1; display: block; margin-bottom: 8px;">
              Pilihan Kostum Karakter: <span style="color: #38bdf8;" id="costume-name">${costume.name}</span>
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${CHARACTER_COSTUMES.map((c, i) => `
                <div class="costume-opt" data-idx="${i}" style="padding: 8px 4px; background: ${i === this.selectedCostumeIndex ? '#1e3a8a' : '#1e293b'}; border: 2px solid ${i === this.selectedCostumeIndex ? '#38bdf8' : '#334155'}; border-radius: 8px; cursor: pointer; text-align: center;">
                  <div style="width: 18px; height: 18px; border-radius: 50%; background: ${c.outfitColor}; margin: 0 auto 4px; border: 1px solid #ffffff;"></div>
                  <div style="font-size: 9px; font-weight: bold; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name.split(' ')[0]}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Submit Button -->
          <button id="btn-start-game" style="width: 100%; padding: 14px; background: #22c55e; color: #ffffff; border: none; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
            ⚔️ MULAI MENJELAJAH
          </button>
        </div>
      `;

      this.renderAvatarPreview();

      // Costume selection click handlers
      const optEls = overlay.querySelectorAll('.costume-opt');
      optEls.forEach(el => {
        el.addEventListener('click', (e) => {
          const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
          this.selectedCostumeIndex = idx;
          this.renderHtml();
        });
      });

      // Submit Handler
      document.getElementById('btn-start-game')?.addEventListener('click', () => {
        const input = document.getElementById('input-username') as HTMLInputElement;
        const name = input ? input.value.trim() : '';
        const errorEl = document.getElementById('username-error');

        if (!name) {
          if (errorEl) errorEl.style.display = 'block';
          return;
        }

        this.username = name.slice(0, 15);
        this.setState('PLAYING');

        if (this.onCompleteCallback) {
          this.onCompleteCallback(this.username, CHARACTER_COSTUMES[this.selectedCostumeIndex], this.isGuest);
        }
      });
    }
  }

  private renderAvatarPreview(): void {
    const canvas = document.getElementById('preview-avatar-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 64, 64);
    ctx.imageSmoothingEnabled = false;

    const costume = CHARACTER_COSTUMES[this.selectedCostumeIndex];
    const px = 22;
    const py = 16;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 26, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#292524';
    ctx.fillRect(px + 4, py + 20, 4, 7);
    ctx.fillRect(px + 12, py + 20, 4, 7);

    // Body
    ctx.fillStyle = costume.outfitColor;
    ctx.fillRect(px + 4, py + 11, 12, 10);
    // Belt
    ctx.fillStyle = costume.accentColor;
    ctx.fillRect(px + 4, py + 17, 12, 2);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 5, py + 3, 10, 9);

    // Hair / Hat
    ctx.fillStyle = costume.hairColor;
    if (costume.hairStyle === 'short') {
      ctx.fillRect(px + 4, py + 1, 12, 4);
      ctx.fillRect(px + 3, py + 3, 2, 5);
      ctx.fillRect(px + 15, py + 3, 2, 5);
    } else if (costume.hairStyle === 'spiky') {
      ctx.fillRect(px + 4, py - 1, 12, 6);
      ctx.fillRect(px + 2, py + 1, 3, 5);
      ctx.fillRect(px + 15, py + 1, 3, 5);
    } else if (costume.hairStyle === 'long') {
      ctx.fillRect(px + 4, py + 1, 12, 4);
      ctx.fillRect(px + 2, py + 3, 3, 10);
      ctx.fillRect(px + 15, py + 3, 3, 10);
    } else if (costume.hairStyle === 'hood') {
      ctx.fillStyle = costume.hatColor || costume.outfitColor;
      ctx.fillRect(px + 3, py - 1, 14, 6);
      ctx.fillRect(px + 2, py + 3, 3, 9);
      ctx.fillRect(px + 15, py + 3, 3, 9);
    }

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 7, py + 6, 2, 2);
    ctx.fillRect(px + 11, py + 6, 2, 2);
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;
  }
}
