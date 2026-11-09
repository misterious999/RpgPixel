import { RoleType, MagicElement, MagicianAffinities } from '../types/GameTypes.ts';
import { ROLE_INFO, ELEMENT_INFO } from '../data/RolesData.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { QuestManager } from './QuestManager.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';

export class GuildNPC {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 32;
  public name: string = 'Resepsionis Guild Elaine';

  public isAppraisalOpen: boolean = false;
  private openTime: number = 0;
  public questManager: QuestManager | null = null;
  public activeTab: 'QUESTS' | 'CARD' = 'QUESTS';

  // Ceremony State for Novices (Random Awakening by System)
  public ceremonyState: 'READY' | 'SPINNING' | 'AWAKENED' = 'READY';
  private spinTimer: number = 0;
  private spinDuration: number = 1.6;
  private rouletteIndex: number = 0;
  private lastSpinTick: number = 0;
  public candidateRole: RoleType = 'KNIGHT';
  public candidateAffinities: MagicianAffinities = { primary: 'FIRE', secondaries: ['LIGHTNING'] };

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public isNearPlayer(playerCenterX: number, playerCenterY: number): boolean {
    const npcCenterX = this.x + 16;
    const npcCenterY = this.y + 16;
    return Math.hypot(npcCenterX - playerCenterX, npcCenterY - playerCenterY) < 38;
  }

  public openAppraisal(): void {
    this.isAppraisalOpen = true;
    this.ceremonyState = 'READY';
    this.openTime = Date.now();
  }

  public closeAppraisal(): void {
    this.isAppraisalOpen = false;
    this.ceremonyState = 'READY';
  }

  public startAwakeningCeremony(): void {
    this.ceremonyState = 'SPINNING';
    this.spinTimer = 0;
    this.lastSpinTick = Date.now();

    // Roll random role completely determined by the system
    const possibleRoles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
    const chosen = possibleRoles[Math.floor(Math.random() * possibleRoles.length)];
    this.candidateRole = chosen;

    if (chosen === 'MAGICIAN') {
      const elements: MagicElement[] = ['FIRE', 'ICE', 'LIGHTNING', 'WIND', 'EARTH'];
      const primary = elements[Math.floor(Math.random() * elements.length)];
      const rem = elements.filter((e) => e !== primary);
      const secondary = rem[Math.floor(Math.random() * rem.length)];
      this.candidateAffinities = {
        primary,
        secondaries: [secondary]
      };
    }
  }

  public handleTouch(
    touchX: number,
    touchY: number,
    screenWidth: number,
    screenHeight: number,
    player: Player,
    floatingText: FloatingTextManager
  ): boolean {
    if (!this.isAppraisalOpen) return false;

    // Debounce to prevent click-through immediately upon opening
    if (Date.now() - this.openTime < 220) {
      return true;
    }

    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Close Button (X)
    if (
      touchX >= modalX + modalWidth - 36 &&
      touchX <= modalX + modalWidth - 6 &&
      touchY >= modalY + 4 &&
      touchY <= modalY + 32
    ) {
      // If user closes while role is awakened, finalize and award it so it's not lost
      if (this.ceremonyState === 'AWAKENED') {
        this.confirmAndAwardRole(player, floatingText);
      } else {
        this.closeAppraisal();
      }
      return true;
    }

    // --- CASE A: PLAYER ALREADY HAS A LOCKED ROLE (OFFICIAL CERTIFICATE & QUEST BOARD) ---
    if (player.hasLockedRole || player.role !== 'NOVICE') {
      // 1. Tab Selector Navigation (Misi Guild vs Kartu Petualang)
      const tabY = modalY + 36;
      const tabH = 26;
      const tabW = (modalWidth - 28) / 2;

      if (touchY >= tabY && touchY <= tabY + tabH) {
        if (touchX >= modalX + 14 && touchX < modalX + 14 + tabW) {
          this.activeTab = 'QUESTS';
          AudioEngine.playButtonClick();
          return true;
        } else if (touchX >= modalX + 14 + tabW && touchX <= modalX + 14 + tabW * 2) {
          this.activeTab = 'CARD';
          AudioEngine.playButtonClick();
          return true;
        }
      }

      // 2. Interaksi di Tab MISI GUILD
      if (this.activeTab === 'QUESTS' && this.questManager) {
        const colW = (modalWidth - 36) / 2;
        const cardH = (modalHeight - 74) / 2;
        const startY = modalY + 66;

        const quests = this.questManager.quests;
        for (let i = 0; i < quests.length; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = col === 0 ? modalX + 14 : modalX + 22 + colW;
          const cy = startY + row * (cardH + 6);

          // Area Tombol Aksi di Bawah Kartu Misi
          const btnX = cx + 8;
          const btnY = cy + cardH - 24;
          const btnW = colW - 18;
          const btnH = 20;

          if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
            const q = quests[i];
            if (q.status === 'AVAILABLE') {
              this.questManager.acceptQuest(q.id);
              floatingText.spawn(player.x + 10, player.y - 18, `📜 Misi Diterima: ${q.title}!`, '#4ade80', 2.5);
              return true;
            } else if (q.status === 'COMPLETED') {
              this.questManager.turnInQuest(q.id, player, floatingText);
              return true;
            }
          }
        }
        return true;
      }

      // Bottom Close Button: "TUTUP (KEMBALI BERPETUALANG)"
      const btnW = 200;
      const btnH = 34;
      const btnX = modalX + modalWidth - btnW - 16;
      const btnY = modalY + modalHeight - 44;

      if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
        this.closeAppraisal();
        return true;
      }
      return true;
    }

    // --- CASE B: NOVICE AWAKENING CEREMONY ---
    if (this.ceremonyState === 'READY') {
      // Button: "🔮 BANGKITKAN TAKDIR JIWA (ACAK OLEH SISTEM)"
      const btnW = modalWidth - 32;
      const btnH = 36;
      const btnX = modalX + 16;
      const btnY = modalY + modalHeight - 48;

      if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
        this.startAwakeningCeremony();
        return true;
      }
      return true;
    }

    if (this.ceremonyState === 'SPINNING') {
      // Spinning takes 1.6s; swallow touches
      return true;
    }

    if (this.ceremonyState === 'AWAKENED') {
      // Button: "🪪 TERIMA KARTU PETUALANG & MULAI PETUALANGAN"
      const btnW = modalWidth - 32;
      const btnH = 36;
      const btnX = modalX + 16;
      const btnY = modalY + modalHeight - 48;

      if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
        this.confirmAndAwardRole(player, floatingText);
        return true;
      }
      return true;
    }

    return true;
  }

  private confirmAndAwardRole(player: Player, floatingText: FloatingTextManager): void {
    player.setRole(this.candidateRole, this.candidateAffinities, true);
    player.hasLockedRole = true;

    // Tambahkan Kartu Petualang resmi langsung ke dalam inventaris
    player.inventory.addItem('ADVENTURER_CARD', 1);

    const roleName = ROLE_INFO[this.candidateRole].name;
    floatingText.spawn(player.x + 10, player.y - 18, `✨ Takdir Jiwa Bangkit: ${roleName}!`, '#facc15', 3.5);
    floatingText.spawn(player.x + 10, player.y - 32, '🪪 Menerima Kartu Petualang Resmi!', '#38bdf8', 3.5);

    this.closeAppraisal();
  }

  public render(ctx: CanvasRenderingContext2D, isNear: boolean, player?: Player): void {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    ctx.save();

    // 1. Guild Receptionist Desk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y + 14, 40, 16);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x - 6, y + 12, 44, 4);

    // Desk Papers & Quill
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 2, y + 10, 8, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 24, y + 8, 2, 7);

    // 2. Receptionist Elaine
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 10, y, 12, 6); // Pink hair
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 11, y + 5, 10, 6); // Face
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 13, y + 7, 2, 2); // Eyes
    ctx.fillRect(x + 17, y + 7, 2, 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x + 10, y + 11, 12, 8); // Uniform

    // 3. Name Tag
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('Elaine (Guild)', x + 16, y - 6);
    ctx.fillText('Elaine (Guild)', x + 16, y - 6);

    // 4. Interaction Indicator
    if (isNear) {
      const bob = Math.sin(Date.now() / 200) * 2;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9.5px sans-serif';

      const isLocked = player ? (player.hasLockedRole || player.role !== 'NOVICE') : false;
      const promptText = isLocked ? '🪪 [A] Kartu Petualang' : '🔮 [A] Uji Takdir Jiwa (Acak)';

      ctx.strokeText(promptText, x + 16, y - 16 + bob);
      ctx.fillText(promptText, x + 16, y - 16 + bob);
    }

    ctx.restore();
  }

  public renderModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    player: Player
  ): void {
    if (!this.isAppraisalOpen) return;

    ctx.save();

    // 1. Dim Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Modal Dimensions (Landscape 2-Column Layout)
    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Top Header Banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 34);

    const isLocked = player.hasLockedRole || player.role !== 'NOVICE';
    const headerTitle = isLocked
      ? '🏛️ SERIKAT PETUALANG ELAINE'
      : '🔮 UPACARA KEBANGKITAN TAKDIR JIWA (ACAK)';

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(headerTitle, modalX + 16, modalY + 17);

    // Close button (X)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 17);

    // ROUTING:
    if (isLocked) {
      // Tab Bar (Misi vs Kartu)
      const tabY = modalY + 36;
      const tabH = 26;
      const tabW = (modalWidth - 28) / 2;

      // Tab 1: Misi
      ctx.fillStyle = this.activeTab === 'QUESTS' ? '#eab308' : '#1e293b';
      ctx.fillRect(modalX + 14, tabY, tabW, tabH);
      ctx.fillStyle = this.activeTab === 'QUESTS' ? '#0f172a' : '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📜 PAPAN MISI GUILD', modalX + 14 + tabW / 2, tabY + 13);

      // Tab 2: Kartu Petualang
      ctx.fillStyle = this.activeTab === 'CARD' ? '#38bdf8' : '#1e293b';
      ctx.fillRect(modalX + 14 + tabW, tabY, tabW, tabH);
      ctx.fillStyle = this.activeTab === 'CARD' ? '#0f172a' : '#94a3b8';
      ctx.fillText('🪪 KARTU IDENTITAS RESMI', modalX + 14 + tabW + tabW / 2, tabY + 13);

      if (this.activeTab === 'QUESTS') {
        this.renderQuestsModal(ctx, modalX, modalY, modalWidth, modalHeight, player);
      } else {
        this.renderCertificateModal(ctx, modalX, modalY, modalWidth, modalHeight, player);
      }
    } else {
      this.renderAwakeningModal(ctx, modalX, modalY, modalWidth, modalHeight, player);
    }

    ctx.restore();
  }

  private renderQuestsModal(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    _player: Player
  ): void {
    if (!this.questManager) return;
    const quests = this.questManager.quests;

    const colW = (modalWidth - 36) / 2;
    const cardH = (modalHeight - 82) / 2;
    const startY = modalY + 68;

    for (let i = 0; i < quests.length; i++) {
      const q = quests[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = col === 0 ? modalX + 14 : modalX + 22 + colW;
      const cy = startY + row * (cardH + 6);

      // Card Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx, cy, colW, cardH);
      ctx.strokeStyle = q.themeColor;
      ctx.lineWidth = q.status === 'COMPLETED' ? 2 : 1;
      ctx.strokeRect(cx, cy, colW, cardH);

      // Quest Badge & Title
      ctx.fillStyle = q.themeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const safeQTitle = CanvasText.truncate(ctx, `[${q.badge}] ${q.title}`, colW - 16);
      ctx.fillText(safeQTitle, cx + 8, cy + 6);

      // Target Objective & Count
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8.5px sans-serif';
      const safeQTarget = CanvasText.truncate(ctx, `Target: ${q.targetName} (${q.currentCount}/${q.requiredCount})`, colW - 16);
      ctx.fillText(safeQTarget, cx + 8, cy + 20);

      // Progress Bar
      const pBarW = colW - 16;
      const pBarH = 4;
      const pct = Math.min(1, q.currentCount / q.requiredCount);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx + 8, cy + 34, pBarW, pBarH);
      ctx.fillStyle = q.themeColor;
      ctx.fillRect(cx + 8, cy + 34, Math.round(pBarW * pct), pBarH);

      // Rewards line
      ctx.fillStyle = '#eab308';
      ctx.font = '8px sans-serif';
      const safeQRewards = CanvasText.truncate(ctx, `Hadiah: +${q.rewardGold} Emas · +${q.rewardExp} EXP`, colW - 16);
      ctx.fillText(safeQRewards, cx + 8, cy + 42);

      // Button at bottom
      const btnX = cx + 8;
      const btnY = cy + cardH - 22;
      const btnW = colW - 16;
      const btnH = 18;

      if (q.status === 'AVAILABLE') {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('➕ TERIMA MISI', btnX + btnW / 2, btnY + btnH / 2);
      } else if (q.status === 'ACTIVE') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⏳ BERJALAN (${q.currentCount}/${q.requiredCount})`, btnX + btnW / 2, btnY + btnH / 2);
      } else if (q.status === 'COMPLETED') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁 KLAIM HADIAH!', btnX + btnW / 2, btnY + btnH / 2);
      } else {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓ MISI TUNTAS', btnX + btnW / 2, btnY + btnH / 2);
      }
    }
  }

  /**
   * Tampilan Sertifikat & Kartu Petualang Resmi saat player sudah memiliki role terkunci permanen.
   * User tidak dapat mengganti rolenya lagi walau mati!
   */
  private renderCertificateModal(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    player: Player
  ): void {
    const colW = (modalWidth - 36) / 2;
    const col1X = modalX + 14;
    const col2X = modalX + 22 + colW;
    const contentY = modalY + 66;
    const contentH = modalHeight - 76;

    const curRole = ROLE_INFO[player.role] || ROLE_INFO.NOVICE;

    // --- KOLOM 1: VISUAL KARTU PETUALANG MEWAH (PASSPORT IDENTITAS) ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(col1X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(col1X, contentY, colW - 2, contentH);

    // Card Gold Ribbon Header
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(col1X + 2, contentY + 2, colW - 6, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ SERIKAT GUILD ELAINE ★', col1X + colW / 2, contentY + 13);

    // Role Emblem Portrait Box
    const portX = col1X + 12;
    const portY = contentY + 34;
    const portSize = 52;

    ctx.fillStyle = curRole.color;
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(portX, portY, portSize, portSize);

    // Main Role Symbol Icon
    const mainIcon = curRole.skills[0]?.iconSymbol || '⚔️';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainIcon, portX + portSize / 2, portY + portSize / 2);

    // Identity Details on Right of Portrait
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    const safeName = CanvasText.truncate(ctx, player.username, colW - portSize - 32);
    ctx.fillText(safeName, portX + portSize + 10, portY + 2);

    ctx.fillStyle = curRole.color;
    ctx.font = 'bold 10.5px sans-serif';
    let roleText = curRole.name;
    if (player.role === 'MAGICIAN') {
      const pInfo = ELEMENT_INFO[player.magicianAffinities.primary];
      roleText = `Magician (${pInfo.name.split(' ')[0]})`;
    }
    const safeRoleName = CanvasText.truncate(ctx, roleText, colW - portSize - 32);
    ctx.fillText(safeRoleName, portX + portSize + 10, portY + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Peringkat: Lv.${player.level}`, portX + portSize + 10, portY + 34);

    // Status Badge Box (Terikat Permanen Seumur Hidup)
    const badgeY = portY + portSize + 12;
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(col1X + 12, badgeY, colW - 26, 26);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(col1X + 12, badgeY, colW - 26, 26);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✔ STATUS: TERIKAT PERMANEN SEUMUR HIDUP', col1X + colW / 2, badgeY + 9);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '7.5px sans-serif';
    ctx.fillText('Role jiwa ini tidak dapat diubah lagi walau mati.', col1X + colW / 2, badgeY + 19);

    // Red Wax Seal Stamp
    const sealX = col1X + colW - 32;
    const sealY = contentY + contentH - 28;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GUILD', sealX, sealY - 3);
    ctx.fillText('SEAL', sealX, sealY + 4);

    // ID Tag
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`#ID-SOUL-${player.role}-${player.level}`, col1X + 12, contentY + contentH - 14);

    // --- KOLOM 2: ELAINE'S DIALOGUE & KETERANGAN HUKUM GUILD ---
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col2X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col2X, contentY, colW - 2, contentH);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('📜 DEKRIT RESMI SERIKAT GUILD:', col2X + 12, contentY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    const speech = `Halo, Petualang ${player.username}! Kartu Petualangmu mencatat bahwa jiwamu telah terikat secara permanen pada role ${roleText}.\n\nBerdasarkan Hukum Suci Guild, setiap jiwa petualang hanya memiliki 1 takdir sejati yang tidak dapat diubah lagi seumur hidup, bahkan jika kamu gugur dalam pertempuran.`;

    const speechH = CanvasText.drawWrappedText(ctx, speech, col2X + 12, contentY + 26, colW - 24, 12, 6);

    // Skills Summary Box
    const skY = contentY + 26 + speechH + 8;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillText('⚡ Kemampuan Jiwa Aktif:', col2X + 12, skY);

    const skillsToShow = player.skills.slice(0, 3);
    for (let s = 0; s < skillsToShow.length; s++) {
      const sk = skillsToShow[s];
      const lineY = skY + 14 + s * 14;
      ctx.fillStyle = sk.color;
      ctx.font = 'bold 8.5px sans-serif';
      const skName = CanvasText.truncate(ctx, `${sk.iconSymbol} ${sk.name}`, colW - 28);
      ctx.fillText(skName, col2X + 14, lineY);
    }

    // Action Button: "TUTUP (KEMBALI BERPETUALANG)"
    const btnW = colW - 24;
    const btnH = 32;
    const btnX = col2X + 12;
    const btnY = contentY + contentH - 38;

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TUTUP & LANJUT PETUALANGAN', btnX + btnW / 2, btnY + btnH / 2);
  }

  /**
   * Tampilan Upacara Acak oleh Sistem untuk Novice.
   */
  private renderAwakeningModal(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    player: Player
  ): void {
    const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];

    // Update spin timer if spinning
    if (this.ceremonyState === 'SPINNING') {
      const now = Date.now();
      const elapsed = (now - this.lastSpinTick) / 1000;
      this.lastSpinTick = now;
      this.spinTimer += elapsed;

      // Cycle roulette visual index every 80ms
      this.rouletteIndex = Math.floor(this.spinTimer * 12) % roles.length;

      if (this.spinTimer >= this.spinDuration) {
        this.ceremonyState = 'AWAKENED';
      }
    }

    if (this.ceremonyState === 'READY') {
      this.renderReadyState(ctx, modalX, modalY, modalWidth, modalHeight, player);
    } else if (this.ceremonyState === 'SPINNING') {
      this.renderSpinningState(ctx, modalX, modalY, modalWidth, modalHeight, roles);
    } else if (this.ceremonyState === 'AWAKENED') {
      this.renderAwakenedState(ctx, modalX, modalY, modalWidth, modalHeight, player);
    }
  }

  private renderReadyState(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    player: Player
  ): void {
    const colW = (modalWidth - 36) / 2;
    const col1X = modalX + 14;
    const col2X = modalX + 22 + colW;
    const contentY = modalY + 44;
    const contentH = modalHeight - 100;

    // Col 1: Ancient Divination Pedestal & Lore
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col1X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col1X, contentY, colW - 2, contentH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🔮 BATU TAKDIR KUNO GUILD', col1X + 12, contentY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    const lore = `Selamat datang di Serikat Guild, calon petualang ${player.username}!\n\nSerikat kami menggunakan Batu Takdir Kuno untuk membaca afinitas jiwa sejatimu. Takdir ini ditentukan oleh SISTEM SECARA ACAK.\n\nSetelah bangkit, kamu akan langsung menerima Kartu Petualang resmi dan role ini TERKUNCI PERMANEN seumur hidup walau kamu mati.`;

    CanvasText.drawWrappedText(ctx, lore, col1X + 12, contentY + 26, colW - 24, 12, 8);

    // Col 2: The 5 Soul Callings
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col2X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col2X, contentY, colW - 2, contentH);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🌟 5 KEMUNGKINAN TAKDIR JIWA:', col2X + 12, contentY + 10);

    const callings = [
      { tag: '⚔️ Knight', name: 'Ksatria Tangguh & Perisai', col: '#f97316' },
      { tag: '🔮 Magician', name: 'Penyihir Elemen Alam', col: '#8b5cf6' },
      { tag: '🗡️ Assassin', name: 'Pembunuh Senyap & Racun', col: '#06b6d4' },
      { tag: '🕊️ Healer', name: 'Penyembuh Cahaya Suci', col: '#10b981' },
      { tag: '💀 Necromancer', name: 'Penguasa Jiwa & Kerangka', col: '#a855f7' }
    ];

    for (let i = 0; i < callings.length; i++) {
      const c = callings[i];
      const cy = contentY + 28 + i * 22;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(col2X + 10, cy, colW - 24, 18);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(col2X + 10, cy, colW - 24, 18);

      ctx.fillStyle = c.col;
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.tag, col2X + 14, cy + 9);

      const tagW = ctx.measureText(c.tag).width;
      const remainingW = Math.max(20, (colW - 24) - tagW - 14);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px sans-serif';
      const safeCallingName = CanvasText.truncate(ctx, c.name, remainingW);
      ctx.fillText(safeCallingName, col2X + 18 + tagW, cy + 9);
    }

    // Full-width Bottom Action Button: "🔮 BANGKITKAN TAKDIR JIWA (ACAK OLEH SISTEM)"
    const btnW = modalWidth - 28;
    const btnH = 36;
    const btnX = modalX + 14;
    const btnY = modalY + modalHeight - 48;

    const pulse = Math.sin(Date.now() / 150) * 0.15;
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.85 + pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = btnW < 340 ? 'bold 10px sans-serif' : 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const safeAwakenBtn = CanvasText.truncate(ctx, '🔮 BANGKITKAN TAKDIR JIWA (ACAK OLEH SISTEM)', btnW - 14);
    ctx.fillText(safeAwakenBtn, btnX + btnW / 2, btnY + btnH / 2);
  }

  private renderSpinningState(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    roles: RoleType[]
  ): void {
    const centerBoxW = modalWidth - 36;
    const centerBoxH = modalHeight - 64;
    const boxX = modalX + 18;
    const boxY = modalY + 44;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(boxX, boxY, centerBoxW, centerBoxH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, centerBoxW, centerBoxH);

    // Spinning Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ BATU TAKDIR SEDANG MEMBACA AFINITAS JIWAMU...', boxX + centerBoxW / 2, boxY + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px sans-serif';
    ctx.fillText('Menyelaraskan frekuensi elemen jiwa dengan takdir semesta...', boxX + centerBoxW / 2, boxY + 34);

    // Carousel Cards in the Center
    const currentActiveRole = roles[this.rouletteIndex];
    const roleInfo = ROLE_INFO[currentActiveRole];

    const cardW = 160;
    const cardH = 90;
    const cardX = boxX + (centerBoxW - cardW) / 2;
    const cardY = boxY + 54;

    ctx.fillStyle = roleInfo.color;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    const icon = roleInfo.skills[0]?.iconSymbol || '✨';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, cardX + cardW / 2, cardY + 35);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`[ ${roleInfo.name.toUpperCase()} ]`, cardX + cardW / 2, cardY + 68);

    // Spinning Progress Bar
    const progW = centerBoxW - 60;
    const progH = 8;
    const progX = boxX + 30;
    const progY = boxY + centerBoxH - 24;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(progX, progY, progW, progH);
    const progress = Math.min(1, this.spinTimer / this.spinDuration);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(progX, progY, progW * progress, progH);
  }

  private renderAwakenedState(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    player: Player
  ): void {
    const colW = (modalWidth - 36) / 2;
    const col1X = modalX + 14;
    const col2X = modalX + 22 + colW;
    const contentY = modalY + 44;
    const contentH = modalHeight - 96;

    const roleInfo = ROLE_INFO[this.candidateRole];

    // Col 1: Revealed Role Card
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(col1X, contentY, colW - 2, contentH);
    ctx.strokeStyle = roleInfo.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(col1X, contentY, colW - 2, contentH);

    ctx.fillStyle = roleInfo.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🌟 TAKDIR SEJATI TELAH DITENTUKAN!', col1X + colW / 2, contentY + 10);

    const icon = roleInfo.skills[0]?.iconSymbol || '✨';
    ctx.font = '36px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, col1X + colW / 2, contentY + 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(roleInfo.name, col1X + colW / 2, contentY + 80);

    if (this.candidateRole === 'MAGICIAN') {
      const pInfo = ELEMENT_INFO[this.candidateAffinities.primary];
      const sInfo = ELEMENT_INFO[this.candidateAffinities.secondaries[0]];
      ctx.fillStyle = pInfo.color;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`Elemen: ${pInfo.name.split(' ')[0]} + ${sInfo?.name.split(' ')[0] || ''}`, col1X + colW / 2, contentY + 98);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8.5px sans-serif';
      const safeDesc = CanvasText.truncate(ctx, roleInfo.description, colW - 20);
      ctx.fillText(safeDesc, col1X + colW / 2, contentY + 98);
    }

    // Col 2: Adventurer Card Issued Notice
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col2X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(col2X, contentY, colW - 2, contentH);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🪪 KARTU PETUALANG RESMI DITERBITKAN!', col2X + 12, contentY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8.5px sans-serif';
    const notice = `Selamat, ${player.username}!\n\nBatu Takdir telah mengunci jiwamu ke dalam role ${roleInfo.name}.\n\n• Kartu Petualang resmi langsung ditambahkan ke inventarismu.\n• Role ini terikat seumur hidup dan TIDAK BISA DIGANTI LAGI walau gugur dalam pertarungan.`;

    CanvasText.drawWrappedText(ctx, notice, col2X + 12, contentY + 28, colW - 24, 12, 6);

    // Full-width Bottom Button: "🪪 TERIMA KARTU PETUALANG & MULAI PETUALANGAN"
    const btnW = modalWidth - 28;
    const btnH = 36;
    const btnX = modalX + 14;
    const btnY = modalY + modalHeight - 48;

    ctx.fillStyle = '#16a34a';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = btnW < 340 ? 'bold 10px sans-serif' : 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const safeAcceptBtn = CanvasText.truncate(ctx, '🪪 TERIMA KARTU PETUALANG & MULAI PETUALANGAN', btnW - 14);
    ctx.fillText(safeAcceptBtn, btnX + btnW / 2, btnY + btnH / 2);
  }
}
