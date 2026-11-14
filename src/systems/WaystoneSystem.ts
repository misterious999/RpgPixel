import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CONSTANTS } from '../core/Constants.ts';

export interface Waystone {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  tileX: number;
  tileY: number;
  isUnlocked: boolean;
  color: string;
  map?: 'OVERWORLD' | 'CONTINENT_VALORIA';
  continentName?: string;
}

export class WaystoneSystem {
  private static instance: WaystoneSystem | null = null;

  public waystones: Waystone[] = [
    // --- BENUA 1: AETHELGARD (LEMBAH SERIKAT) ---
    {
      id: 'WAYSTONE_OAKHAVEN',
      name: 'Alun-Alun Oakhaven',
      subtitle: 'Pusat Ibukota & Serikat Guild',
      icon: '🏰',
      tileX: 48,
      tileY: 52,
      isUnlocked: true, // Oakhaven otomatis terbuka sejak awal
      color: '#38bdf8',
      map: 'OVERWORLD',
      continentName: 'Benua Aethelgard'
    },
    {
      id: 'WAYSTONE_ELDORIA',
      name: 'Rimba Suci Eldoria',
      subtitle: 'Kuil Peri Roh Hutan Purba',
      icon: '🌿',
      tileX: 23,
      tileY: 22,
      isUnlocked: false,
      color: '#10b981',
      map: 'OVERWORLD',
      continentName: 'Benua Aethelgard'
    },
    {
      id: 'WAYSTONE_STONEWATCH',
      name: 'Benteng Stonewatch',
      subtitle: 'Pelataran Tambang Besi Abisal',
      icon: '⛏️',
      tileX: 82,
      tileY: 64,
      isUnlocked: false,
      color: '#f97316',
      map: 'OVERWORLD',
      continentName: 'Benua Aethelgard'
    },
    {
      id: 'WAYSTONE_TIRTA_KENCANA',
      name: 'Dusun Tirta Kencana',
      subtitle: 'Dermaga Pesisir Danau Azure',
      icon: '🐟',
      tileX: 34,
      tileY: 72,
      isUnlocked: false,
      color: '#06b6d4',
      map: 'OVERWORLD',
      continentName: 'Benua Aethelgard'
    },
    {
      id: 'WAYSTONE_AMBERVALE',
      name: 'Dusun Ambervale',
      subtitle: 'Lembah Gandum & Kincir Angin',
      icon: '🌾',
      tileX: 75,
      tileY: 25,
      isUnlocked: false,
      color: '#ca8a04',
      map: 'OVERWORLD',
      continentName: 'Benua Aethelgard'
    },

    // --- BENUA 2: VALORIA (DUNIA BARU MISTIS) ---
    {
      id: 'WAYSTONE_PORT_VALORIA',
      name: 'Port Valoria',
      subtitle: 'Pelabuhan Samudra & Dermaga Ekspedisi',
      icon: '⚓',
      tileX: 28,
      tileY: 90,
      isUnlocked: true, // Terbuka agar pemain dapat langsung menjelajah Benua Valoria
      color: '#38bdf8',
      map: 'CONTINENT_VALORIA',
      continentName: 'Benua Valoria'
    },
    {
      id: 'WAYSTONE_AL_ZAHRA',
      name: 'Oasis Al-Zahra',
      subtitle: 'Telaga Zamrud & Kafilah Gurun Emas',
      icon: '🐫',
      tileX: 74,
      tileY: 74,
      isUnlocked: false,
      color: '#f59e0b',
      map: 'CONTINENT_VALORIA',
      continentName: 'Benua Valoria'
    },
    {
      id: 'WAYSTONE_FROSTPEAK',
      name: 'Frostpeak Haven',
      subtitle: 'Puncak Salju & Kabin Api Unggun',
      icon: '❄️',
      tileX: 32,
      tileY: 22,
      isUnlocked: false,
      color: '#a5f3fc',
      map: 'CONTINENT_VALORIA',
      continentName: 'Benua Valoria'
    },
    {
      id: 'WAYSTONE_CELESTIA',
      name: 'Lembah Celestia',
      subtitle: 'Kuil Alkemis Kristal Mana Ungu',
      icon: '🔮',
      tileX: 90,
      tileY: 28,
      isUnlocked: false,
      color: '#c084fc',
      map: 'CONTINENT_VALORIA',
      continentName: 'Benua Valoria'
    }
  ];

  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;
  public onTeleport?: (targetX: number, targetY: number, waystoneName: string, targetMap?: string) => void;
  public onWaystoneUnlocked?: (waystone: Waystone) => void;

  constructor() {
    this.createUI();
  }

  public static getInstance(): WaystoneSystem {
    if (!WaystoneSystem.instance) {
      WaystoneSystem.instance = new WaystoneSystem();
    }
    return WaystoneSystem.instance;
  }

  public update(_deltaTime: number, player: Player, currentMap: string): void {
    if (currentMap !== 'OVERWORLD' && currentMap !== 'CONTINENT_VALORIA') return;
    const ts = CONSTANTS.TILE_SIZE;
    const pCenterX = player.x + 16;
    const pCenterY = player.y + 16;

    // Cek apakah pemain mendekati waystone yang belum terbuka untuk mengaktifkannya
    for (const ws of this.waystones) {
      const wsMap = ws.map || 'OVERWORLD';
      if (wsMap !== currentMap) continue;

      const wsX = ws.tileX * ts + 16;
      const wsY = ws.tileY * ts + 16;
      const dist = Math.hypot(pCenterX - wsX, pCenterY - wsY);

      if (dist <= 48 && !ws.isUnlocked) {
        ws.isUnlocked = true;
        AudioEngine.play('quest_complete');
        FloatingTextManager.getInstance().addText(
          wsX,
          wsY - 24,
          `✨ Prasasti ${ws.name} Terbuka!`,
          '#facc15'
        );
        if (this.onWaystoneUnlocked) this.onWaystoneUnlocked(ws);
      }
    }
  }

  public getNearbyWaystone(playerX: number, playerY: number, currentMap: string): Waystone | null {
    if (currentMap !== 'OVERWORLD' && currentMap !== 'CONTINENT_VALORIA') return null;
    const ts = CONSTANTS.TILE_SIZE;
    const pCenterX = playerX + 16;
    const pCenterY = playerY + 16;

    for (const ws of this.waystones) {
      const wsMap = ws.map || 'OVERWORLD';
      if (wsMap !== currentMap) continue;

      const wsX = ws.tileX * ts + 16;
      const wsY = ws.tileY * ts + 16;
      const dist = Math.hypot(pCenterX - wsX, pCenterY - wsY);
      if (dist <= 42) {
        return ws;
      }
    }
    return null;
  }

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
    const existing = document.getElementById('waystone-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'waystone-modal-container';
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

    let itemsHtml = '';
    for (const ws of this.waystones) {
      const contTag = ws.continentName ? `<span style="font-size: 9px; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: #cbd5e1; margin-left: 6px;">${ws.continentName}</span>` : '';
      if (ws.isUnlocked) {
        itemsHtml += `
          <div style="background: rgba(30, 41, 59, 0.9); border: 1.5px solid ${ws.color}; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${ws.icon}</span>
              <div>
                <div style="font-weight: bold; color: #f8fafc; font-size: 14px; display: flex; align-items: center;">
                  <span>${ws.name}</span>
                  ${contTag}
                </div>
                <div style="font-size: 11px; color: ${ws.color};">${ws.subtitle}</div>
              </div>
            </div>
            <button id="tp_btn_${ws.id}" style="background: ${ws.color}; color: #0f172a; border: none; border-radius: 6px; padding: 6px 14px; font-weight: bold; font-size: 12px; cursor: pointer;">
              ⚡ Teleport
            </button>
          </div>
        `;
      } else {
        itemsHtml += `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px dashed #475569; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; opacity: 0.6;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🔒</span>
              <div>
                <div style="font-weight: bold; color: #94a3b8; font-size: 14px; display: flex; align-items: center;">
                  <span>${ws.name}</span>
                  ${contTag}
                </div>
                <div style="font-size: 11px; color: #64748b;">Kunjungi wilayah ini untuk membuka prasasti</div>
              </div>
            </div>
            <span style="font-size: 11px; color: #64748b; font-weight: bold;">Terkunci</span>
          </div>
        `;
      }
    }

    this.container.innerHTML = `
      <div style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px; width: 92%; max-width: 440px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <!-- Header -->
        <div style="background: #1e293b; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.3);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">⚡</span>
            <div>
              <div style="font-weight: bold; color: #f8fafc; font-size: 15px;">Jaringan Prasasti Kuno (Fast Travel)</div>
              <div style="font-size: 11px; color: #94a3b8;">Teleportasi seketika antar-pedesaan & lintas benua</div>
            </div>
          </div>
          <button id="close_waystone_btn" style="background: none; border: none; color: #ef4444; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <!-- Body List -->
        <div style="padding: 14px; overflow-y: auto; flex: 1;">
          ${itemsHtml}
        </div>
      </div>
    `;

    document.getElementById('close_waystone_btn')?.addEventListener('click', () => {
      this.closeModal();
    });

    for (const ws of this.waystones) {
      if (ws.isUnlocked) {
        document.getElementById(`tp_btn_${ws.id}`)?.addEventListener('click', () => {
          this.closeModal();
          const ts = CONSTANTS.TILE_SIZE;
          const targetX = ws.tileX * ts + 16;
          const targetY = ws.tileY * ts + 24;
          AudioEngine.play('potion_heal');
          if (this.onTeleport) {
            this.onTeleport(targetX, targetY, ws.name, ws.map || 'OVERWORLD');
          }
        });
      }
    }
  }

  // --- RENDER PRASASTI DI DUNIA ---
  public render(ctx: CanvasRenderingContext2D, currentMap: string): void {
    if (currentMap !== 'OVERWORLD' && currentMap !== 'CONTINENT_VALORIA') return;
    const ts = CONSTANTS.TILE_SIZE;

    for (const ws of this.waystones) {
      const wsMap = ws.map || 'OVERWORLD';
      if (wsMap !== currentMap) continue;

      const wx = ws.tileX * ts + 8;
      const wy = ws.tileY * ts + 4;

      ctx.save();

      // 1. Bayangan Monolit
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(wx + 8, wy + 26, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Monolit Batu Berdiri (Pilar Obelisk)
      ctx.fillStyle = ws.isUnlocked ? '#1e293b' : '#334155';
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy + 26);
      ctx.lineTo(wx + 14, wy + 26);
      ctx.lineTo(wx + 12, wy + 4);
      ctx.lineTo(wx + 8, wy);
      ctx.lineTo(wx + 4, wy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ws.isUnlocked ? ws.color : '#64748b';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 3. Rune Bercahaya di Tengah Monolit
      if (ws.isUnlocked) {
        const pulse = Math.sin(Date.now() * 0.005 + ws.tileX) * 0.4 + 0.6;
        ctx.fillStyle = ws.color;
        ctx.globalAlpha = pulse;
        ctx.fillRect(wx + 6.5, wy + 8, 3, 12);
        // Aura pendar
        ctx.fillStyle = ws.color;
        ctx.globalAlpha = pulse * 0.25;
        ctx.beginPath();
        ctx.arc(wx + 8, wy + 14, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
