import { Player } from '../entities/Player.ts';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  title: string;
  level: number;
  guildRank: string;
  badge: string;
  score: number;
  isPlayer?: boolean;
}

export class LeaderboardUI {
  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;

  constructor() {
    this.createUI();
  }

  private createUI(): void {
    const existing = document.getElementById('leaderboard-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'leaderboard-modal-container';
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
    this.container.onclick = (e) => {
      if (e.target === this.container) {
        this.close();
      }
    };
    document.body.appendChild(this.container);
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

    const playerScore = player.level * 350 + player.exp * 4;
    const playerRankInfo = player.adventurerRank;

    const entries: LeaderboardEntry[] = [
      {
        rank: 1,
        name: 'Aurelius sang Pedang Cahaya',
        title: 'Paladin Suci Kerajaan',
        level: 28,
        guildRank: 'S-Rank',
        badge: '👑',
        score: 12450
      },
      {
        rank: 2,
        name: 'Seraphina sang Ratu Badai',
        title: 'Penyihir Elemen Tertinggi',
        level: 26,
        guildRank: 'S-Rank',
        badge: '💎',
        score: 10800
      },
      {
        rank: 3,
        name: 'Zephyr sang Bayangan Senja',
        title: 'Master Bayangan Gaib',
        level: 25,
        guildRank: 'S-Rank',
        badge: '⚡',
        score: 9920
      },
      {
        rank: 4,
        name: player.username,
        title: playerRankInfo.title,
        level: player.level,
        guildRank: `${playerRankInfo.rank}-Rank`,
        badge: '⭐',
        score: Math.max(playerScore, 7500),
        isPlayer: true
      },
      {
        rank: 5,
        name: 'Rodric sang Perisai Baja',
        title: 'Ksatria Benteng Kerajaan',
        level: 19,
        guildRank: 'A-Rank',
        badge: '🛡️',
        score: 6800
      },
      {
        rank: 6,
        name: 'Lyra sang Bintang Mistis',
        title: 'Penyihir Alam Peri Bintang',
        level: 18,
        guildRank: 'A-Rank',
        badge: '🔮',
        score: 6240
      },
      {
        rank: 7,
        name: 'Garrick si Pembelah Bumi',
        title: 'Pendekar Kapak Raksasa',
        level: 14,
        guildRank: 'B-Rank',
        badge: '🪓',
        score: 4750
      },
      {
        rank: 8,
        name: 'Flora sang Pelindung Suci',
        title: 'Pendeta Pengasih Cahaya',
        level: 13,
        guildRank: 'B-Rank',
        badge: '🌿',
        score: 4200
      },
      {
        rank: 9,
        name: 'Rolf si Pemburu Serigala',
        title: 'Pemanah Rimba Pinus',
        level: 9,
        guildRank: 'C-Rank',
        badge: '🏹',
        score: 2850
      },
      {
        rank: 10,
        name: 'Kaelen si Pencari Jejak',
        title: 'Petualang Pengelana Baru',
        level: 6,
        guildRank: 'D-Rank',
        badge: '🗡️',
        score: 1420
      }
    ];

    // Sort by score
    entries.sort((a, b) => b.score - a.score);
    // Re-assign rank numbers
    entries.forEach((e, idx) => (e.rank = idx + 1));

    let rowsHtml = '';
    for (const e of entries) {
      const isTop3 = e.rank <= 3;
      const rankColor = e.rank === 1 ? '#facc15' : e.rank === 2 ? '#cbd5e1' : e.rank === 3 ? '#fb923c' : '#94a3b8';

      rowsHtml += `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin-bottom: 6px;
          border-radius: 8px;
          background: ${e.isPlayer ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.65)'};
          border: 1px solid ${e.isPlayer ? '#38bdf8' : (isTop3 ? rankColor : 'rgba(255, 255, 255, 0.08)')};
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 13px;
              color: ${rankColor};
              border-radius: 50%;
              background: rgba(15, 23, 42, 0.6);
            ">
              #${e.rank}
            </div>
            <div style="max-width: 220px;">
              <div style="font-weight: bold; font-size: 13px; color: ${e.isPlayer ? '#38bdf8' : '#ffffff'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${e.badge} ${e.name} ${e.isPlayer ? '<span style="font-size: 10px; color: #facc15;">[Anda]</span>' : ''}
              </div>
              <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                Lv.${e.level} • ${e.title}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 11.5px; color: #facc15;">${e.score.toLocaleString()} Poin</div>
            <div style="font-size: 10px; color: #38bdf8; font-weight: bold;">[${e.guildRank}]</div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        border: 2px solid #facc15;
        border-radius: 12px;
        width: 90%;
        max-width: 460px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 16px;
        color: #ffffff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(250, 204, 21, 0.25);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(250, 204, 21, 0.4); padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #facc15;">📜 PAPAN PENGHORMATAN GUILD (TOP 10)</div>
            <div style="font-size: 11px; color: #94a3b8;">Daftar Petualang Terhebat di Seluruh Penjuru Kerajaan</div>
          </div>
          <button id="close-leaderboard-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column;">
          ${rowsHtml}
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('close-leaderboard-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();
  }
}
