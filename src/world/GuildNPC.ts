import { RoleType, MagicElement, MagicianAffinities } from '../types/GameTypes.ts';
import { ROLE_INFO, ELEMENT_INFO, getMagicianSkills } from '../data/RolesData.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';

export class GuildNPC {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 32;
  public name: string = 'Resepsionis Guild Elaine';

  public isAppraisalOpen: boolean = false;
  private selectedRole: RoleType = 'KNIGHT';

  // Special Magician Elemental Affinity Selection state
  public isChoosingElement: boolean = false;
  private primaryElement: MagicElement = 'FIRE';
  private secondaryElements: MagicElement[] = [];

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
    this.isChoosingElement = false;
  }

  public closeAppraisal(): void {
    this.isAppraisalOpen = false;
    this.isChoosingElement = false;
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number, player: Player, floatingText: FloatingTextManager): boolean {
    if (!this.isAppraisalOpen) return false;

    const modalWidth = Math.min(380, screenWidth - 20);
    const modalHeight = Math.min(490, screenHeight - 20);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Close Button (X)
    if (
      touchX >= modalX + modalWidth - 36 &&
      touchX <= modalX + modalWidth - 8 &&
      touchY >= modalY + 6 &&
      touchY <= modalY + 34
    ) {
      this.closeAppraisal();
      return true;
    }

    // --- SCREEN 2: MAGICIAN ELEMENTAL AFFINITY SELECTION ---
    if (this.isChoosingElement) {
      const elements: MagicElement[] = ['FIRE', 'ICE', 'LIGHTNING', 'WIND', 'EARTH'];

      // 1. Primary Element Selection Cards (Grid)
      const primaryStartY = modalY + 84;
      const cardW = (modalWidth - 28) / 5;
      const cardH = 46;

      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const ex = modalX + 14 + i * cardW;
        if (
          touchX >= ex &&
          touchX <= ex + cardW &&
          touchY >= primaryStartY &&
          touchY <= primaryStartY + cardH
        ) {
          this.primaryElement = elem;
          // If secondary contained this new primary, remove it
          this.secondaryElements = this.secondaryElements.filter(e => e !== elem);
          return true;
        }
      }

      // 2. Secondary Element Toggles (Max 2)
      const secStartY = modalY + 215;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const ex = modalX + 14 + i * cardW;
        if (
          touchX >= ex &&
          touchX <= ex + cardW &&
          touchY >= secStartY &&
          touchY <= secStartY + cardH
        ) {
          // Cannot pick primary as secondary
          if (elem === this.primaryElement) return true;

          if (this.secondaryElements.includes(elem)) {
            this.secondaryElements = this.secondaryElements.filter(e => e !== elem);
          } else {
            if (this.secondaryElements.length < 2) {
              this.secondaryElements.push(elem);
            }
          }
          return true;
        }
      }

      // 3. Confirm Magician Role & Element Button
      const btnW = 220;
      const btnH = 38;
      const btnX = modalX + (modalWidth - btnW) / 2;
      const btnY = modalY + modalHeight - 48;

      if (
        touchX >= btnX &&
        touchX <= btnX + btnW &&
        touchY >= btnY &&
        touchY <= btnY + btnH
      ) {
        const affinities: MagicianAffinities = {
          primary: this.primaryElement,
          secondaries: [...this.secondaryElements]
        };
        player.setRole('MAGICIAN', affinities);

        const pName = ELEMENT_INFO[this.primaryElement].name.split(' ')[0];
        floatingText.spawn(player.x + 10, player.y - 18, `✨ Bangkit: Magician ${pName}!`, '#a855f7', 3.0);
        this.closeAppraisal();
        return true;
      }

      // Back Button
      const backBtnW = 60;
      const backBtnH = 28;
      const backBtnX = modalX + 14;
      const backBtnY = modalY + modalHeight - 44;
      if (
        touchX >= backBtnX &&
        touchX <= backBtnX + backBtnW &&
        touchY >= backBtnY &&
        touchY <= backBtnY + backBtnH
      ) {
        this.isChoosingElement = false;
        return true;
      }

      return true;
    }

    // --- SCREEN 1: REGULAR ROLE APRAISAL TABS ---
    const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
    const tabHeight = 36;
    const tabStartY = modalY + 70;
    const tabWidth = (modalWidth - 24) / roles.length;

    for (let i = 0; i < roles.length; i++) {
      const tx = modalX + 12 + i * tabWidth;
      if (
        touchX >= tx &&
        touchX <= tx + tabWidth &&
        touchY >= tabStartY &&
        touchY <= tabStartY + tabHeight
      ) {
        this.selectedRole = roles[i];
        return true;
      }
    }

    // Confirmation Button "PILIH ROLE INI"
    const btnW = 220;
    const btnH = 40;
    const btnX = modalX + (modalWidth - btnW) / 2;
    const btnY = modalY + modalHeight - 52;

    if (
      touchX >= btnX &&
      touchX <= btnX + btnW &&
      touchY >= btnY &&
      touchY <= btnY + btnH
    ) {
      if (this.selectedRole === 'MAGICIAN') {
        // Magician proceeds to Elemental Specialization Screen!
        this.isChoosingElement = true;
        return true;
      }

      player.setRole(this.selectedRole);
      const roleName = ROLE_INFO[this.selectedRole].name;
      floatingText.spawn(player.x + 10, player.y - 18, `✨ Role Diperoleh: ${roleName}!`, '#facc15', 3.0);
      this.closeAppraisal();
      return true;
    }

    return true;
  }

  public render(ctx: CanvasRenderingContext2D, isNear: boolean): void {
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
    ctx.fillRect(x + 10, y, 12, 6);
    ctx.fillRect(x + 8, y + 2, 3, 10);
    ctx.fillRect(x + 21, y + 2, 3, 10);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 11, y + 4, 10, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 13, y + 7, 2, 2);
    ctx.fillRect(x + 17, y + 7, 2, 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 14, y + 10, 4, 1);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x + 10, y + 12, 12, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 15, y + 13, 2, 2);

    // 3. Guild Flag / Emblem Overhead
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('🏛️ SERIKAT PETUALANG', x + 16, y - 14);
    ctx.fillText('🏛️ SERIKAT PETUALANG', x + 16, y - 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px sans-serif';
    ctx.strokeText('Resepsionis Elaine', x + 16, y - 4);
    ctx.fillText('Resepsionis Elaine', x + 16, y - 4);

    // 4. Interactive Hint
    if (isNear) {
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.strokeText('Tekan [A] Uji Bakat Role', x + 16, y + 36);
      ctx.fillText('Tekan [A] Uji Bakat Role', x + 16, y + 36);
    }

    ctx.restore();
  }

  public renderModal(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, player: Player): void {
    if (!this.isAppraisalOpen) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    const modalWidth = Math.min(380, screenWidth - 20);
    const modalHeight = Math.min(490, screenHeight - 20);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.isChoosingElement ? '🔮 AFINITAS ELEMEN MAGICIAN' : '⚖️ UJI BAKAT SERIKAT GUILD', modalX + 16, modalY + 21);

    // Close button
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 20, modalY + 21);

    // --- SCREEN 2: MAGICIAN SPECIAL ELEMENTAL SELECTION ---
    if (this.isChoosingElement) {
      const elements: MagicElement[] = ['FIRE', 'ICE', 'LIGHTNING', 'WIND', 'EARTH'];

      // Intro
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Pilih 1 Elemen Utama (100% Daya) & Maks. 2 Elemen Sampingan:', modalX + 16, modalY + 54);

      // Section 1: Elemen Utama (Primary)
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🌟 1. ELEMEN UTAMA (Spesialisasi 100% Penuh):', modalX + 16, modalY + 74);

      const cardW = (modalWidth - 28) / 5;
      const primaryStartY = modalY + 84;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const info = ELEMENT_INFO[elem];
        const isSelected = this.primaryElement === elem;
        const ex = modalX + 14 + i * cardW;

        ctx.fillStyle = isSelected ? info.color : '#1e293b';
        ctx.fillRect(ex, primaryStartY, cardW - 2, 42);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#334155';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(ex, primaryStartY, cardW - 2, 42);

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icon, ex + (cardW - 2) / 2, primaryStartY + 14);

        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(info.name.split(' ')[0], ex + (cardW - 2) / 2, primaryStartY + 32);
      }

      // Primary Element Active Description
      const curPrimaryInfo = ELEMENT_INFO[this.primaryElement];
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(modalX + 14, modalY + 134, modalWidth - 28, 48);
      ctx.strokeStyle = curPrimaryInfo.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(modalX + 14, modalY + 134, modalWidth - 28, 48);

      ctx.fillStyle = curPrimaryInfo.color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Elemen Utama: ${curPrimaryInfo.name}`, modalX + 22, modalY + 140);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px sans-serif';
      ctx.fillText(curPrimaryInfo.description, modalX + 22, modalY + 154);

      // Section 2: Elemen Sampingan (Secondary)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`⚡ 2. ELEMEN SAMPINGAN (Pilih 0 - 2 Opsional) [${this.secondaryElements.length}/2]:`, modalX + 16, modalY + 198);

      const secStartY = modalY + 210;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const info = ELEMENT_INFO[elem];
        const isPrimary = this.primaryElement === elem;
        const isSelectedSec = this.secondaryElements.includes(elem);
        const ex = modalX + 14 + i * cardW;

        ctx.fillStyle = isPrimary ? '#020617' : (isSelectedSec ? '#0369a1' : '#1e293b');
        ctx.fillRect(ex, secStartY, cardW - 2, 42);
        ctx.strokeStyle = isSelectedSec ? '#38bdf8' : (isPrimary ? '#334155' : '#475569');
        ctx.lineWidth = isSelectedSec ? 2 : 1;
        ctx.strokeRect(ex, secStartY, cardW - 2, 42);

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icon, ex + (cardW - 2) / 2, secStartY + 14);

        ctx.fillStyle = isPrimary ? '#475569' : (isSelectedSec ? '#ffffff' : '#94a3b8');
        ctx.font = 'bold 8px sans-serif';
        const label = isPrimary ? '(Utama)' : info.name.split(' ')[0];
        ctx.fillText(label, ex + (cardW - 2) / 2, secStartY + 32);
      }

      // Preview Skills Built
      const previewAffinities: MagicianAffinities = {
        primary: this.primaryElement,
        secondaries: this.secondaryElements
      };
      const skillsBuilt = getMagicianSkills(previewAffinities);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('📖 Cabang Mantra yang Terbentuk:', modalX + 16, modalY + 264);

      const listY = modalY + 280;
      for (let s = 0; s < Math.min(skillsBuilt.length, 4); s++) {
        const sk = skillsBuilt[s];
        const sy = listY + s * 34;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(modalX + 16, sy, modalWidth - 32, 28);
        ctx.strokeStyle = sk.isPrimaryElement ? curPrimaryInfo.color : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(modalX + 16, sy, modalWidth - 32, 28);

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sk.iconSymbol, modalX + 28, sy + 14);

        ctx.textAlign = 'left';
        ctx.fillStyle = sk.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(sk.name, modalX + 42, sy + 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText(sk.description.slice(0, 42) + '...', modalX + 42, sy + 19);
      }

      // Back Button
      ctx.fillStyle = '#334155';
      ctx.fillRect(modalX + 14, modalY + modalHeight - 48, 55, 36);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(modalX + 14, modalY + modalHeight - 48, 55, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬅ Kembali', modalX + 41, modalY + modalHeight - 30);

      // Confirm Button
      const btnW = 200;
      const btnH = 38;
      const btnX = modalX + modalWidth - btnW - 14;
      const btnY = modalY + modalHeight - 48;

      ctx.fillStyle = curPrimaryInfo.color;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`IKRAR MAGICIAN (${curPrimaryInfo.name.split(' ')[0]})`, btnX + btnW / 2, btnY + btnH / 2);

      ctx.restore();
      return;
    }

    // --- SCREEN 1: REGULAR ROLE SELECTION ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Pilih jalur takdirmu untuk membangkitkan skill sejati:', modalX + 16, modalY + 54);

    const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
    const tabHeight = 32;
    const tabStartY = modalY + 68;
    const tabWidth = (modalWidth - 24) / roles.length;

    for (let i = 0; i < roles.length; i++) {
      const r = roles[i];
      const tx = modalX + 12 + i * tabWidth;
      const isSelected = this.selectedRole === r;
      const info = ROLE_INFO[r];

      ctx.fillStyle = isSelected ? info.color : '#1e293b';
      ctx.fillRect(tx, tabStartY, tabWidth - 2, tabHeight);

      ctx.strokeStyle = isSelected ? '#ffffff' : '#334155';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.strokeRect(tx, tabStartY, tabWidth - 2, tabHeight);

      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.tag, tx + (tabWidth - 2) / 2, tabStartY + tabHeight / 2);
    }

    const curRole = ROLE_INFO[this.selectedRole];
    const detailY = tabStartY + tabHeight + 10;
    const detailH = modalY + modalHeight - detailY - 60;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 12, detailY, modalWidth - 24, detailH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 12, detailY, modalWidth - 24, detailH);

    ctx.fillStyle = curRole.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(curRole.name, modalX + 22, detailY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.fillText(curRole.description, modalX + 22, detailY + 28);

    if (this.selectedRole === 'MAGICIAN') {
      // Special Magician Explanation
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('✨ Keistimewaan Khusus Magician:', modalX + 22, detailY + 54);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px sans-serif';
      ctx.fillText('• Spesialisasi 1 Elemen Utama (100% Full Power)', modalX + 26, detailY + 74);
      ctx.fillText('• Bebas memilih hingga 2 Elemen Sampingan (Pendukung)', modalX + 26, detailY + 92);
      ctx.fillText('• Tersedia 5 Elemen: Api, Es, Petir, Angin, & Bumi', modalX + 26, detailY + 110);
      ctx.fillText('• Termasuk skill abnormal anime unik sesuai elemen utama!', modalX + 26, detailY + 128);

      const previewBtnW = 200;
      const previewBtnH = 38;
      const previewBtnX = modalX + (modalWidth - previewBtnW) / 2;
      const previewBtnY = modalY + modalHeight - 48;

      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(previewBtnX, previewBtnY, previewBtnW, previewBtnH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(previewBtnX, previewBtnY, previewBtnW, previewBtnH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PILIH AFINITAS ELEMEN ➡', previewBtnX + previewBtnW / 2, previewBtnY + previewBtnH / 2);

      ctx.restore();
      return;
    }

    // Regular skills list for non-magicians
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('⚡ Cabang Kemampuan (Skills):', modalX + 22, detailY + 48);

    const skillListStartY = detailY + 64;
    for (let sIdx = 0; sIdx < curRole.skills.length; sIdx++) {
      const skill = curRole.skills[sIdx];
      const sy = skillListStartY + sIdx * 34;

      ctx.fillStyle = skill.isAbnormal ? 'rgba(168, 85, 247, 0.15)' : '#0f172a';
      ctx.fillRect(modalX + 20, sy, modalWidth - 40, 30);
      ctx.strokeStyle = skill.isAbnormal ? '#a855f7' : '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(modalX + 20, sy, modalWidth - 40, 30);

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.iconSymbol, modalX + 34, sy + 15);

      ctx.textAlign = 'left';
      ctx.fillStyle = skill.isAbnormal ? '#d8b4fe' : '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(skill.name, modalX + 48, sy + 8);

      ctx.fillStyle = player.level >= skill.unlockLevel ? '#4ade80' : '#f87171';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      const unlockText = skill.unlockLevel === 1 ? 'Terbuka Awal' : `Lv. ${skill.unlockLevel}`;
      ctx.fillText(unlockText, modalX + modalWidth - 28, sy + 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      const shortDesc = skill.description.length > 48 ? skill.description.slice(0, 48) + '...' : skill.description;
      ctx.fillText(shortDesc, modalX + 48, sy + 20);
    }

    const btnW = 200;
    const btnH = 38;
    const btnX = modalX + (modalWidth - btnW) / 2;
    const btnY = modalY + modalHeight - 48;

    ctx.fillStyle = curRole.color;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BANGKITKAN ${curRole.tag.toUpperCase()}`, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  }
}
