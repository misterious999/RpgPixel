import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';

export interface TitleDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  color: string;
}

export const TITLE_DEFINITIONS: Record<string, TitleDefinition> = {
  PEMULA: {
    id: 'PEMULA',
    name: 'Petualang Pemula',
    badge: '🔰',
    description: 'Gelar awal saat pertama kali tiba di Kerajaan Fantasi.',
    color: '#94a3b8'
  },
  SLIME_SLAYER: {
    id: 'SLIME_SLAYER',
    name: '« Pembasmi Slime »',
    badge: '🟢',
    description: 'Telah mengalahkan kawanan Slime dengan gagah perkasa.',
    color: '#4ade80'
  },
  FOREST_HUNTER: {
    id: 'FOREST_HUNTER',
    name: '« Pemburu Rimba »',
    badge: '🐺',
    description: 'Telah menaklukkan Serigala Rimba atau Pengawal Goblin.',
    color: '#f59e0b'
  },
  CRYPT_CONQUEROR: {
    id: 'CRYPT_CONQUEROR',
    name: '« Penakluk Makam Kuno »',
    badge: '👑',
    description: 'Telah mengalahkan Raja Slime di Makam Kuno Lantai 1.',
    color: '#eab308'
  },
  TITAN_BREAKER: {
    id: 'TITAN_BREAKER',
    name: '« Penghancur Titan Abisal »',
    badge: '⚡',
    description: 'Telah menumbangkan Titan Abisal Kolosal di Lantai 2!',
    color: '#ef4444'
  },
  DRAGON_SLAYER: {
    id: 'DRAGON_SLAYER',
    name: '« Pembantai Naga Abisal »',
    badge: '🐲',
    description: 'Telah menaklukkan Raja Naga Api Ignis di Lantai 3!',
    color: '#f97316'
  },
  SYLVAN_WARDEN: {
    id: 'SYLVAN_WARDEN',
    name: '« Penjaga Rimba Suci »',
    badge: '🌿',
    description: 'Telah menaklukkan Raksasa Roh Pohon Purba di Kuil Eldoria!',
    color: '#10b981'
  },
  MINE_CONQUEROR: {
    id: 'MINE_CONQUEROR',
    name: '« Penghancur Batu Abisal »',
    badge: '⛏️',
    description: 'Telah menundukkan Behemoth Obsidian di Tambang Terkutuk Stonewatch!',
    color: '#8b5cf6'
  },
  GOURMET_CHEF: {
    id: 'GOURMET_CHEF',
    name: '« Koki Bintang Lima »',
    badge: '🍳',
    description: 'Telah mengolah hasil buruan menjadi masakan lezat Dungeon Meshi.',
    color: '#fb923c'
  },
  BEAST_TAMER: {
    id: 'BEAST_TAMER',
    name: '« Penjinak Monster »',
    badge: '🐾',
    description: 'Telah memiliki hewan pendamping pengumpul jarahan.',
    color: '#38bdf8'
  },
  GUILD_LEGEND: {
    id: 'GUILD_LEGEND',
    name: '« Legenda Guild »',
    badge: '💎',
    description: 'Telah mencapai Pangkat Petualang S-Rank!',
    color: '#ec4899'
  }
};

export class TitleSystem {
  public unlockedTitles: Set<string> = new Set(['PEMULA']);
  public equippedTitleId: string = 'PEMULA';
  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;

  constructor() {
    this.createUI();
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('rpg2d_titles');
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.unlocked)) {
          data.unlocked.forEach((t: string) => this.unlockedTitles.add(t));
        }
        if (data.equipped && this.unlockedTitles.has(data.equipped)) {
          this.equippedTitleId = data.equipped;
        }
      }
    } catch (e) {
      console.warn('Could not load titles from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('rpg2d_titles', JSON.stringify({
        unlocked: Array.from(this.unlockedTitles),
        equipped: this.equippedTitleId
      }));
    } catch (e) {
      console.warn('Could not save titles to storage:', e);
    }
  }

  private createUI(): void {
    const existing = document.getElementById('titles-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'titles-modal-container';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.78);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  public unlockTitle(titleId: string, player: Player, floatingText: FloatingTextManager): boolean {
    if (this.unlockedTitles.has(titleId)) return false;

    const def = TITLE_DEFINITIONS[titleId];
    if (!def) return false;

    this.unlockedTitles.add(titleId);
    this.saveToStorage();
    AudioEngine.playLevelUp();
    floatingText.spawn(player.x + 12, player.y - 20, `🏆 Gelar Terbuka: ${def.name}!`, def.color, 3.0);
    return true;
  }

  public equipTitle(titleId: string): void {
    if (this.unlockedTitles.has(titleId)) {
      this.equippedTitleId = titleId;
      this.saveToStorage();
    }
  }

  public getEquippedTitle(): TitleDefinition {
    return TITLE_DEFINITIONS[this.equippedTitleId] || TITLE_DEFINITIONS.PEMULA;
  }

  public open(player: Player): void {
    if (!this.container) return;
    this.isOpen = true;
    this.renderContent(player);
    this.container.style.display = 'flex';
  }

  public close(): void {
    if (!this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  private renderContent(player: Player): void {
    if (!this.container) return;

    let itemsHtml = '';
    for (const [id, def] of Object.entries(TITLE_DEFINITIONS)) {
      const isUnlocked = this.unlockedTitles.has(id);
      const isEquipped = this.equippedTitleId === id;

      itemsHtml += `
        <div style="
          background: ${isEquipped ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.7)'};
          border: 1px solid ${isEquipped ? '#38bdf8' : (isUnlocked ? 'rgba(255, 255, 255, 0.15)' : '#334155')};
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: ${isUnlocked ? '1' : '0.5'};
        ">
          <div>
            <div style="font-weight: bold; font-size: 13px; color: ${isUnlocked ? def.color : '#94a3b8'};">
              ${def.badge} ${def.name} ${isEquipped ? '<span style="color: #38bdf8; font-size: 11px;">[Terpasang]</span>' : ''}
            </div>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${def.description}</div>
          </div>
          <div>
            ${
              isUnlocked
                ? `<button id="equip-title-${id}" style="
                    background: ${isEquipped ? '#0284c7' : 'linear-gradient(135deg, #3b82f6, #2563eb)'};
                    color: #ffffff;
                    border: none;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                  ">
                    ${isEquipped ? '✓ Aktif' : 'Pasang'}
                  </button>`
                : `<span style="font-size: 11px; color: #64748b;">Terkunci</span>`
            }
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        border: 2px solid #38bdf8;
        border-radius: 12px;
        width: 90%;
        max-width: 440px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 16px;
        color: #ffffff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.4); padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #38bdf8;">👑 GELAR & PENCAPAIAN PETUALANG</div>
            <div style="font-size: 11px; color: #94a3b8;">Gelar yang Anda pasang akan bersinar di atas karakter Anda!</div>
          </div>
          <button id="close-titles-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column;">
          ${itemsHtml}
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('close-titles-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    for (const [id] of Object.entries(TITLE_DEFINITIONS)) {
      const btn = document.getElementById(`equip-title-${id}`);
      if (btn) {
        btn.onclick = () => {
          this.equipTitle(id);
          this.renderContent(player);
        };
      }
    }
  }
}
