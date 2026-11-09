import { CHARACTER_COSTUMES } from '../data/RolesData.ts';
import { CharacterCostume, GameState } from '../types/GameTypes.ts';
import { SupabaseService } from '../services/SupabaseService.ts';

export class OnboardingUI {
  public state: GameState = 'CHARACTER_CREATION';
  public selectedCostumeIndex: number = 0;
  public username: string = 'Petualang';
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
        <div style="max-width: 560px; width: 94%; max-height: 94vh; background: #0f172a; border: 2px solid #38bdf8; border-radius: 14px; padding: 14px 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.85); box-sizing: border-box; overflow-y: auto;">
          <div style="font-size: 17px; font-weight: 800; color: #38bdf8; margin-bottom: 2px; letter-spacing: 0.5px;">KUSTOMISASI KARAKTER</div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 10px;">Detail kostum dari ujung kepala hingga kaki & gaya petualang</div>

          <!-- 2-Column Responsive Layout -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px; text-align: left; margin-bottom: 10px;">
            <!-- Kolom Kiri: Avatar Preview & Specs & Username Input -->
            <div style="flex: 1 1 200px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; background: #1e293b; padding: 8px 10px; border-radius: 8px; border: 1px solid #334155;">
                <div style="width: 64px; height: 64px; background: #0b1329; border: 2px solid #38bdf8; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <canvas id="preview-avatar-canvas" width="64" height="64"></canvas>
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 12px; font-weight: 800; color: #38bdf8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="costume-name">${costume.name}</div>
                  <div style="font-size: 9px; color: #cbd5e1; margin-top: 2px;">
                    <div>👤 Kulit: <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${costume.skinTone || '#fed7aa'};vertical-align:middle;"></span> | Mata: <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${costume.eyeColor || '#0f172a'};vertical-align:middle;"></span></div>
                    <div>🛡️ ${costume.outfitStyle || 'tunic'} | 👢 ${costume.bootStyle || 'boots'}</div>
                    <div style="color: #facc15; font-weight: 600;">🥊 Senjata: Tinju Kosong</div>
                  </div>
                </div>
              </div>

              <div>
                <label style="font-size: 10px; font-weight: bold; color: #cbd5e1; display: block; margin-bottom: 4px;">
                  Username Petualang:
                </label>
                <input id="input-username" type="text" maxlength="15" value="${this.username}" placeholder="Nama Petualang..." 
                  style="width: 100%; box-sizing: border-box; padding: 7px 10px; background: #1e293b; border: 1px solid #475569; border-radius: 6px; color: #ffffff; font-size: 12px; outline: none;">
                <div id="username-error" style="color: #ef4444; font-size: 9px; margin-top: 3px; display: none;">Username tidak boleh kosong!</div>
              </div>
            </div>

            <!-- Kolom Kanan: Pilihan 16 Kostum & Tombol Mulai -->
            <div style="flex: 1 1 240px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 10px; font-weight: bold; color: #cbd5e1;">
                    Pilih Setelan Kostum (${CHARACTER_COSTUMES.length} Variasi):
                  </label>
                  <span style="font-size: 9px; color: #38bdf8; font-weight: 600;">#${this.selectedCostumeIndex + 1} / ${CHARACTER_COSTUMES.length}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; max-height: 130px; overflow-y: auto; padding: 3px; margin-bottom: 8px; border: 1px solid #1e293b; border-radius: 6px; background: rgba(15, 23, 42, 0.6);">
                  ${CHARACTER_COSTUMES.map((c, i) => `
                    <div class="costume-opt" data-idx="${i}" style="padding: 4px 2px; background: ${i === this.selectedCostumeIndex ? '#1e3a8a' : '#1e293b'}; border: 1.5px solid ${i === this.selectedCostumeIndex ? '#38bdf8' : '#334155'}; border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.15s ease;">
                      <div style="display: flex; justify-content: center; gap: 2px; margin-bottom: 2px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${c.hairColor}; border: 0.5px solid #fff;"></span>
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${c.outfitColor}; border: 0.5px solid #fff;"></span>
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${c.bootColor || '#451a03'}; border: 0.5px solid #fff;"></span>
                      </div>
                      <div style="font-size: 7.5px; font-weight: bold; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name.split(' ')[0]}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Pilihan Mode Permainan: Online vs Offline -->
              <div style="margin-top: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; margin-bottom: 5px; text-align: center;">
                  PILIH CARA BERMAIN:
                </div>
                <div style="display: flex; gap: 8px;">
                  <!-- Tombol Mode Online -->
                  <button id="btn-play-online" style="flex: 1; padding: 10px 4px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; border: 1.5px solid #38bdf8; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4); transition: transform 0.1s ease;">
                    <span style="font-size: 12.5px;">🌐 MAIN ONLINE</span>
                    <span style="font-size: 8.5px; color: #bae6fd; font-weight: 500;">Simpan Cloud (Google)</span>
                  </button>

                  <!-- Tombol Mode Offline -->
                  <button id="btn-play-offline" style="flex: 1; padding: 10px 4px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; border: 1.5px solid #64748b; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); transition: transform 0.1s ease;">
                    <span style="font-size: 12.5px;">📴 MAIN OFFLINE</span>
                    <span style="font-size: 8.5px; color: #94a3b8; font-weight: 500;">Tanpa Internet (Lokal)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.renderAvatarPreview();

      // Listen to input changes so username is never lost
      const inputEl = document.getElementById('input-username') as HTMLInputElement;
      inputEl?.addEventListener('input', (e) => {
        this.username = (e.target as HTMLInputElement).value;
      });

      // Costume selection click handlers
      const optEls = overlay.querySelectorAll('.costume-opt');
      optEls.forEach(el => {
        el.addEventListener('click', (e) => {
          const curInput = document.getElementById('input-username') as HTMLInputElement;
          if (curInput) this.username = curInput.value;
          const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
          this.selectedCostumeIndex = idx;
          this.renderHtml();
        });
      });

      // 1. Submit Handler: MAIN OFFLINE
      document.getElementById('btn-play-offline')?.addEventListener('click', () => {
        const input = document.getElementById('input-username') as HTMLInputElement;
        const name = input ? input.value.trim() : '';
        const errorEl = document.getElementById('username-error');

        if (!name) {
          if (errorEl) errorEl.style.display = 'block';
          return;
        }

        this.username = name.slice(0, 15);
        this.isGuest = true;
        this.setState('PLAYING');

        if (this.onCompleteCallback) {
          this.onCompleteCallback(this.username, CHARACTER_COSTUMES[this.selectedCostumeIndex], true);
        }
      });

      // 2. Submit Handler: MAIN ONLINE
      document.getElementById('btn-play-online')?.addEventListener('click', () => {
        const input = document.getElementById('input-username') as HTMLInputElement;
        const name = input ? input.value.trim() : '';
        const errorEl = document.getElementById('username-error');

        if (!name) {
          if (errorEl) errorEl.style.display = 'block';
          return;
        }

        this.username = name.slice(0, 15);
        const user = SupabaseService.currentUser;

        if (user) {
          // Pengguna sudah login dengan Google
          this.isGuest = false;
          this.setState('PLAYING');
          if (this.onCompleteCallback) {
            this.onCompleteCallback(this.username, CHARACTER_COSTUMES[this.selectedCostumeIndex], false);
          }
        } else {
          // Pengguna belum login Google, tampilkan modal konfirmasi login online
          this.showOnlineLoginModal();
        }
      });
    }
  }

  private showOnlineLoginModal(): void {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    let modal = document.getElementById('online-login-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'online-login-modal';
    modal.style.position = 'absolute';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.85)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '110';

    modal.innerHTML = `
      <div style="max-width: 380px; width: 90%; background: #0f172a; border: 2px solid #38bdf8; border-radius: 14px; padding: 22px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.95);">
        <div style="font-size: 28px; margin-bottom: 6px;">🌐</div>
        <div style="font-size: 16px; font-weight: 800; color: #38bdf8; margin-bottom: 6px; letter-spacing: 0.5px;">AKTIFKAN MODE ONLINE</div>
        <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.5; margin-bottom: 18px;">
          Karakter <b style="color: #facc15;">${this.username}</b> akan disinkronkan ke server Cloud. Silakan hubungkan dengan Akun Google agar data tersimpan abadi dan bisa dimainkan di perangkat lain.
        </div>

        <!-- Tombol Masuk Google -->
        <button id="btn-modal-google" style="width: 100%; padding: 12px; background: #ffffff; color: #0f172a; border: none; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; box-shadow: 0 4px 14px rgba(255,255,255,0.25);">
          <span style="font-size: 17px; color: #ea4335;">G</span>
          <span>Masuk dengan Google (Cloud Save)</span>
        </button>

        <!-- Tombol Beralih ke Offline -->
        <button id="btn-modal-fallback-offline" style="width: 100%; padding: 10px; background: #1e293b; color: #cbd5e1; border: 1px solid #475569; border-radius: 8px; font-size: 11.5px; font-weight: 600; cursor: pointer; margin-bottom: 10px;">
          📴 Main Mode Offline Saja (Tanpa Login)
        </button>

        <!-- Tombol Batal -->
        <button id="btn-modal-cancel" style="background: transparent; color: #94a3b8; border: none; font-size: 11px; cursor: pointer; padding: 4px;">
          ✕ Batal & Kembali Kustomisasi
        </button>
      </div>
    `;

    overlay.appendChild(modal);

    document.getElementById('btn-modal-google')?.addEventListener('click', () => {
      try {
        localStorage.setItem('rpg2d_pending_character', JSON.stringify({
          username: this.username,
          costumeIndex: this.selectedCostumeIndex,
          mode: 'ONLINE'
        }));
      } catch (e) {}
      SupabaseService.loginWithGoogle();
    });

    document.getElementById('btn-modal-fallback-offline')?.addEventListener('click', () => {
      modal?.remove();
      this.isGuest = true;
      this.setState('PLAYING');
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.username, CHARACTER_COSTUMES[this.selectedCostumeIndex], true);
      }
    });

    document.getElementById('btn-modal-cancel')?.addEventListener('click', () => {
      modal?.remove();
    });
  }

  private renderAvatarPreview(): void {
    const canvas = document.getElementById('preview-avatar-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 64, 64);
    ctx.imageSmoothingEnabled = false;

    const costume = CHARACTER_COSTUMES[this.selectedCostumeIndex];
    const px = 20;
    const py = 14;

    const skin = costume.skinTone || '#fed7aa';
    const eyes = costume.eyeColor || '#0f172a';
    const pants = costume.pantsColor || '#1c1917';
    const pantsStyle = costume.pantsStyle || 'trousers';
    const boots = costume.bootColor || '#451a03';
    const bootStyle = costume.bootStyle || 'boots';
    const cape = costume.capeColor || costume.accentColor;
    const capeStyle = costume.capeStyle || 'cape';
    const outfitStyle = costume.outfitStyle || 'tunic';

    // 1. Soft Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 30, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Flowing Cape Behind
    if (capeStyle !== 'none') {
      ctx.fillStyle = cape;
      if (capeStyle === 'scarf') {
        ctx.fillRect(px + 6, py + 12, 12, 8);
        ctx.fillRect(px + 3, py + 14, 5, 11);
      } else if (capeStyle === 'mantle') {
        ctx.fillRect(px + 4, py + 12, 16, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + 10, py + 14, 4, 10);
      } else {
        ctx.fillRect(px + 5, py + 12, 14, 15);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + 10, py + 14, 4, 13);
      }
    }

    // 3. Legs & Boots
    ctx.fillStyle = pants;
    ctx.fillRect(px + 5, py + 21, 5, pantsStyle === 'shorts' ? 3 : 5);
    ctx.fillRect(px + 14, py + 21, 5, pantsStyle === 'shorts' ? 3 : 5);
    if (pantsStyle === 'shorts') {
      ctx.fillStyle = skin;
      ctx.fillRect(px + 5, py + 24, 5, 2);
      ctx.fillRect(px + 14, py + 24, 5, 2);
    }
    // Boots
    ctx.fillStyle = boots;
    ctx.fillRect(px + 4, py + 24, 6, 6);
    ctx.fillRect(px + 14, py + 24, 6, 6);
    if (bootStyle === 'sabatons') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(px + 5, py + 25, 4, 2);
      ctx.fillRect(px + 15, py + 25, 4, 2);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(px + 4, py + 24, 6, 2);
      ctx.fillRect(px + 14, py + 24, 6, 2);
    }
    ctx.fillStyle = '#0f172a'; // Sole
    ctx.fillRect(px + 4, py + 29, 6, 2);
    ctx.fillRect(px + 14, py + 29, 6, 2);

    // 4. Torso & Shaded Outfit
    ctx.fillStyle = costume.outfitColor;
    ctx.fillRect(px + 5, py + 11, 14, 12);

    if (outfitStyle === 'plate') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(px + 6, py + 12, 4, 8);
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 11, py + 12, 2, 8);
    } else if (outfitStyle === 'robe') {
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 11, py + 11, 2, 12);
      ctx.fillRect(px + 7, py + 21, 10, 2);
    } else if (outfitStyle === 'gi') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(px + 7, py + 12, 3, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(px + 11, py + 11, 2, 2);
    } else if (outfitStyle === 'noble') {
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 7, py + 11, 3, 11);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 12, py + 13, 2, 2);
      ctx.fillRect(px + 12, py + 16, 2, 2);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(px + 6, py + 12, 5, 8);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(px + 14, py + 12, 4, 9);
    }

    // Neck & Collar
    ctx.fillStyle = skin;
    ctx.fillRect(px + 10, py + 10, 4, 2);
    ctx.fillStyle = costume.accentColor;
    ctx.fillRect(px + 8, py + 11, 8, 2);

    // Belt & Gold Buckle & Pouch
    ctx.fillStyle = '#292524';
    ctx.fillRect(px + 5, py + 19, 14, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px + 11, py + 19, 3, 3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 16, py + 19, 3, 4);

    // Pauldrons (Shoulder Armor)
    ctx.fillStyle = costume.accentColor;
    ctx.fillRect(px + 3, py + 11, 3, 4);
    ctx.fillRect(px + 18, py + 11, 3, 4);

    // Arms & Bare Clenched Fists (Unarmed Novice Stance - NO SWORD)
    ctx.fillStyle = costume.outfitColor;
    ctx.fillRect(px + 2, py + 13, 3, 6);
    ctx.fillRect(px + 19, py + 13, 3, 6);
    ctx.fillStyle = skin;
    ctx.fillRect(px + 2, py + 18, 3, 3);
    ctx.fillRect(px + 19, py + 18, 3, 3);
    // Knuckle shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(px + 3, py + 18, 2, 1);
    ctx.fillRect(px + 20, py + 18, 2, 1);

    // 5. Head & Facial Expressions
    ctx.fillStyle = skin;
    ctx.fillRect(px + 6, py + 3, 12, 9);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)'; // Cheek blush
    ctx.fillRect(px + 7, py + 8, 2, 2);
    ctx.fillRect(px + 15, py + 8, 2, 2);

    // Layered Hair & Headgear
    const hair = costume.hairColor;
    const style = costume.hairStyle;
    if (style === 'short') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py + 1, 14, 5);
      ctx.fillRect(px + 4, py + 3, 3, 6);
      ctx.fillRect(px + 17, py + 3, 3, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 7, py + 2, 7, 2);
    } else if (style === 'spiky') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py - 1, 14, 7);
      ctx.fillRect(px + 3, py + 1, 3, 7);
      ctx.fillRect(px + 18, py + 1, 3, 7);
      ctx.fillRect(px + 6, py - 3, 3, 3);
      ctx.fillRect(px + 11, py - 4, 3, 4);
      ctx.fillRect(px + 15, py - 3, 3, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 8, py, 6, 2);
    } else if (style === 'long') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py + 1, 14, 5);
      ctx.fillRect(px + 3, py + 3, 4, 14);
      ctx.fillRect(px + 17, py + 3, 4, 14);
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 6, py + 3, 12, 2);
    } else if (style === 'hood') {
      const hoodCol = costume.hatColor || costume.outfitColor;
      ctx.fillStyle = hoodCol;
      ctx.fillRect(px + 4, py - 1, 16, 7);
      ctx.fillRect(px + 3, py + 3, 4, 10);
      ctx.fillRect(px + 17, py + 3, 4, 10);
      ctx.fillRect(px + 10, py - 3, 4, 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(px + 6, py + 3, 12, 3);
    } else if (style === 'ponytail') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py + 1, 14, 5);
      ctx.fillRect(px + 4, py + 3, 3, 6);
      ctx.fillRect(px + 17, py + 3, 3, 6);
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 17, py - 1, 3, 3);
      ctx.fillStyle = hair;
      ctx.fillRect(px + 19, py, 4, 12);
      ctx.fillRect(px + 21, py + 9, 3, 5);
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 6, py + 3, 12, 2);
    } else if (style === 'wild') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 4, py - 1, 16, 7);
      ctx.fillRect(px + 1, py + 1, 4, 10);
      ctx.fillRect(px + 19, py + 1, 4, 10);
      ctx.fillRect(px + 6, py - 3, 4, 3);
      ctx.fillRect(px + 14, py - 4, 4, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(px + 7, py, 10, 2);
    } else if (style === 'helmet') {
      const helmCol = costume.hatColor || '#475569';
      ctx.fillStyle = helmCol;
      ctx.fillRect(px + 4, py - 2, 16, 9);
      ctx.fillRect(px + 3, py + 3, 4, 8);
      ctx.fillRect(px + 17, py + 3, 4, 8);
      ctx.fillStyle = costume.accentColor;
      ctx.fillRect(px + 10, py - 5, 4, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 4, py + 3, 16, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 7, py + 5, 10, 2);
    } else if (style === 'crown') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py + 1, 14, 5);
      ctx.fillRect(px + 4, py + 3, 3, 6);
      ctx.fillRect(px + 17, py + 3, 3, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + 5, py - 1, 14, 3);
      ctx.fillRect(px + 5, py - 4, 3, 3);
      ctx.fillRect(px + 10, py - 5, 4, 4);
      ctx.fillRect(px + 16, py - 4, 3, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + 11, py, 2, 2);
    } else if (style === 'bandana') {
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py - 1, 14, 4);
      ctx.fillRect(px + 7, py - 3, 3, 3);
      ctx.fillRect(px + 14, py - 3, 3, 3);
      ctx.fillStyle = costume.hatColor || costume.accentColor;
      ctx.fillRect(px + 4, py + 2, 16, 4);
      ctx.fillRect(px + 19, py + 3, 3, 3);
      ctx.fillRect(px + 21, py + 5, 2, 5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 6, py + 2, 12, 1);
    }

    // Expressive Eyes with custom eyeColor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 8, py + 6, 3, 3);
    ctx.fillRect(px + 13, py + 6, 3, 3);
    ctx.fillStyle = eyes;
    ctx.fillRect(px + 9, py + 6, 2, 2);
    ctx.fillRect(px + 14, py + 6, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 9, py + 6, 1, 1);
    ctx.fillRect(px + 14, py + 6, 1, 1);
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;
  }
}
