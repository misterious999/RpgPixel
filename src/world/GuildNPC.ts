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

  public handleTouch(
    touchX: number,
    touchY: number,
    screenWidth: number,
    screenHeight: number,
    player: Player,
    floatingText: FloatingTextManager
  ): boolean {
    if (!this.isAppraisalOpen) return false;

    // Landscape optimized dimensions
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
      this.closeAppraisal();
      return true;
    }

    // --- SCREEN 2: MAGICIAN ELEMENTAL AFFINITY SELECTION ---
    if (this.isChoosingElement) {
      const elements: MagicElement[] = ['FIRE', 'ICE', 'LIGHTNING', 'WIND', 'EARTH'];
      const colW = (modalWidth - 36) / 2;
      const col1X = modalX + 14;
      const col2X = modalX + 22 + colW;

      // 1. Primary Element Selection Cards (Col 1)
      const primaryStartY = modalY + 58;
      const cardW = (colW - 8) / 5;
      const cardH = 38;

      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const ex = col1X + i * cardW;
        if (touchX >= ex && touchX <= ex + cardW && touchY >= primaryStartY && touchY <= primaryStartY + cardH) {
          this.primaryElement = elem;
          this.secondaryElements = this.secondaryElements.filter((e) => e !== elem);
          return true;
        }
      }

      // 2. Secondary Element Toggles (Col 2)
      const secStartY = modalY + 58;
      const secCardW = (colW - 8) / 5;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const ex = col2X + i * secCardW;
        if (touchX >= ex && touchX <= ex + secCardW && touchY >= secStartY && touchY <= secStartY + cardH) {
          if (elem === this.primaryElement) return true;
          if (this.secondaryElements.includes(elem)) {
            this.secondaryElements = this.secondaryElements.filter((e) => e !== elem);
          } else {
            if (this.secondaryElements.length < 2) {
              this.secondaryElements.push(elem);
            }
          }
          return true;
        }
      }

      // Back Button
      const backBtnW = 65;
      const backBtnH = 32;
      const backBtnX = modalX + 14;
      const backBtnY = modalY + modalHeight - 40;
      if (
        touchX >= backBtnX &&
        touchX <= backBtnX + backBtnW &&
        touchY >= backBtnY &&
        touchY <= backBtnY + backBtnH
      ) {
        this.isChoosingElement = false;
        return true;
      }

      // Confirm Magician Role & Element Button
      const btnW = colW + 80;
      const btnH = 32;
      const btnX = modalX + modalWidth - btnW - 14;
      const btnY = modalY + modalHeight - 40;

      if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
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

      return true;
    }

    // --- SCREEN 1: REGULAR ROLE SELECTION TABS ---
    const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
    const tabHeight = 28;
    const tabStartY = modalY + 36;
    const tabWidth = (modalWidth - 24) / roles.length;

    for (let i = 0; i < roles.length; i++) {
      const tx = modalX + 12 + i * tabWidth;
      if (touchX >= tx && touchX <= tx + tabWidth && touchY >= tabStartY && touchY <= tabStartY + tabHeight) {
        this.selectedRole = roles[i];
        return true;
      }
    }

    // Confirmation Button
    const colW = (modalWidth - 36) / 2;
    const col2X = modalX + 22 + colW;
    const btnW = colW - 8;
    const btnH = 32;
    const btnX = col2X + 4;
    const btnY = modalY + modalHeight - 42;

    if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
      if (this.selectedRole === 'MAGICIAN') {
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
    ctx.fillRect(x + 10, y, 12, 6); // Pink hair
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 11, y + 5, 10, 6); // Face
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 13, y + 7, 2, 2); // Eyes
    ctx.fillRect(x + 17, y + 7, 2, 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x + 10, y + 11, 12, 8); // Uniform

    // 3. Name Tag
    ctx.font = 'bold 8px sans-serif';
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
      ctx.font = 'bold 9px sans-serif';
      ctx.strokeText('💬 [A] Uji Bakat Role', x + 16, y - 16 + bob);
      ctx.fillText('💬 [A] Uji Bakat Role', x + 16, y - 16 + bob);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Modal Box (Landscape 2-Column Layout)
    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 34);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.isChoosingElement ? '🔮 AFINITAS ELEMEN MAGICIAN' : '⚖️ UJI BAKAT SERIKAT GUILD',
      modalX + 16,
      modalY + 17
    );

    // Close button (X)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 17);

    const colW = (modalWidth - 36) / 2;
    const col1X = modalX + 14;
    const col2X = modalX + 22 + colW;

    // --- SCREEN 2: MAGICIAN SPECIAL ELEMENTAL SELECTION ---
    if (this.isChoosingElement) {
      const elements: MagicElement[] = ['FIRE', 'ICE', 'LIGHTNING', 'WIND', 'EARTH'];

      // Col 1: Elemen Utama (Primary)
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('🌟 1. ELEMEN UTAMA (100% Penuh):', col1X, modalY + 44);

      const cardW = (colW - 8) / 5;
      const primaryStartY = modalY + 58;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const info = ELEMENT_INFO[elem];
        const isSelected = this.primaryElement === elem;
        const ex = col1X + i * cardW;

        ctx.fillStyle = isSelected ? info.color : '#1e293b';
        ctx.fillRect(ex, primaryStartY, cardW - 2, 38);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#334155';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(ex, primaryStartY, cardW - 2, 38);

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icon, ex + (cardW - 2) / 2, primaryStartY + 13);

        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(info.name.split(' ')[0], ex + (cardW - 2) / 2, primaryStartY + 29);
      }

      // Primary Element Active Description Card
      const curPrimaryInfo = ELEMENT_INFO[this.primaryElement];
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(col1X, modalY + 104, colW - 2, 140);
      ctx.strokeStyle = curPrimaryInfo.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(col1X, modalY + 104, colW - 2, 140);

      ctx.fillStyle = curPrimaryInfo.color;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${curPrimaryInfo.name}`, col1X + 10, modalY + 112);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px sans-serif';
      ctx.fillText(curPrimaryInfo.description, col1X + 10, modalY + 130);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('✨ Keistimewaan Utama:', col1X + 10, modalY + 185);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText(`• Spesialisasi 100% Sihir ${curPrimaryInfo.name.split(' ')[0]}`, col1X + 10, modalY + 202);

      // Col 2: Elemen Sampingan (Secondary)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`⚡ 2. ELEMEN SAMPINGAN [${this.secondaryElements.length}/2]:`, col2X, modalY + 44);

      const secStartY = modalY + 58;
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        const info = ELEMENT_INFO[elem];
        const isPrimary = this.primaryElement === elem;
        const isSelectedSec = this.secondaryElements.includes(elem);
        const ex = col2X + i * cardW;

        ctx.fillStyle = isPrimary ? '#020617' : isSelectedSec ? '#0369a1' : '#1e293b';
        ctx.fillRect(ex, secStartY, cardW - 2, 38);
        ctx.strokeStyle = isSelectedSec ? '#38bdf8' : isPrimary ? '#334155' : '#475569';
        ctx.lineWidth = isSelectedSec ? 2 : 1;
        ctx.strokeRect(ex, secStartY, cardW - 2, 38);

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icon, ex + (cardW - 2) / 2, secStartY + 13);

        ctx.fillStyle = isPrimary ? '#475569' : isSelectedSec ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 7.5px sans-serif';
        const label = isPrimary ? '(Utama)' : info.name.split(' ')[0];
        ctx.fillText(label, ex + (cardW - 2) / 2, secStartY + 29);
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
      ctx.fillText('📖 Mantra Terbentuk:', col2X, modalY + 104);

      const listY = modalY + 120;
      for (let s = 0; s < Math.min(skillsBuilt.length, 4); s++) {
        const sk = skillsBuilt[s];
        const sy = listY + s * 30;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(col2X, sy, colW - 4, 26);
        ctx.strokeStyle = sk.isPrimaryElement ? curPrimaryInfo.color : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(col2X, sy, colW - 4, 26);

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sk.iconSymbol, col2X + 14, sy + 13);

        ctx.textAlign = 'left';
        ctx.fillStyle = sk.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(sk.name, col2X + 28, sy + 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '7.5px sans-serif';
        ctx.fillText(sk.description.slice(0, 32) + '...', col2X + 28, sy + 18);
      }

      // Back Button
      ctx.fillStyle = '#334155';
      ctx.fillRect(col1X, modalY + modalHeight - 40, 65, 32);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(col1X, modalY + modalHeight - 40, 65, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬅ Kembali', col1X + 32, modalY + modalHeight - 24);

      // Confirm Button
      const btnW = colW + 80;
      const btnH = 32;
      const btnX = modalX + modalWidth - btnW - 14;
      const btnY = modalY + modalHeight - 40;

      ctx.fillStyle = curPrimaryInfo.color;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`IKRAR MAGICIAN (${curPrimaryInfo.name.split(' ')[0]})`, btnX + btnW / 2, btnY + btnH / 2);

      ctx.restore();
      return;
    }

    // --- SCREEN 1: REGULAR ROLE APRAISAL TABS ---
    const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
    const tabHeight = 28;
    const tabStartY = modalY + 36;
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
    const contentY = tabStartY + tabHeight + 8;
    const contentH = modalHeight - (contentY - modalY) - 12;

    // --- KOLOM 1: ROLE OVERVIEW & DESCRIPTION ---
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col1X, contentY, colW - 2, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col1X, contentY, colW - 2, contentH);

    ctx.fillStyle = curRole.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(curRole.name, col1X + 12, contentY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9.5px sans-serif';
    ctx.fillText(curRole.description, col1X + 12, contentY + 30);

    if (this.selectedRole === 'MAGICIAN') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('✨ Spesialisasi Magician:', col1X + 12, contentY + 68);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText('• 1 Elemen Utama (100% Full Power)', col1X + 14, contentY + 86);
      ctx.fillText('• Bebas pilih hingga 2 Elemen Sampingan', col1X + 14, contentY + 102);
      ctx.fillText('• 5 Elemen: Api, Es, Petir, Angin, Bumi', col1X + 14, contentY + 118);
      ctx.fillText('• Skill abnormal anime unik per elemen!', col1X + 14, contentY + 134);
    } else if (this.selectedRole === 'KNIGHT') {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🛡️ Keunggulan Ksatria:', col1X + 12, contentY + 68);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText('• Pertahanan fisik & HP tertinggi di Guild', col1X + 14, contentY + 86);
      ctx.fillText('• Tangkal & counter serangan dengan Parrying', col1X + 14, contentY + 102);
      ctx.fillText('• Melompat ke kerumunan dengan Leap Attack', col1X + 14, contentY + 118);
      ctx.fillText('• Ultimate: Excalibur Golden Slash!', col1X + 14, contentY + 134);
    } else if (this.selectedRole === 'ASSASSIN') {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🗡️ Keunggulan Assassin:', col1X + 12, contentY + 68);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText('• Menyusup tak terlihat dengan Stealth', col1X + 14, contentY + 86);
      ctx.fillText('• Kecepatan lari kilat & critical burst', col1X + 14, contentY + 102);
      ctx.fillText('• Racun mematikan melumpuhkan lawan', col1X + 14, contentY + 118);
      ctx.fillText('• Ultimate: Anime Shadow Flash Slice!', col1X + 14, contentY + 134);
    } else if (this.selectedRole === 'HEALER') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🕊️ Keunggulan Healer:', col1X + 12, contentY + 68);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText('• Pemulihan instan HP sendiri & rekan', col1X + 14, contentY + 86);
      ctx.fillText('• Perisai suci supresi kutukan & debuff', col1X + 14, contentY + 102);
      ctx.fillText('• Regenerasi mana terus-menerus', col1X + 14, contentY + 118);
      ctx.fillText('• Ultimate: Anime Divine Sanctuary Bless!', col1X + 14, contentY + 134);
    } else if (this.selectedRole === 'NECROMANCER') {
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('💀 Keunggulan Necromancer:', col1X + 12, contentY + 68);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      ctx.fillText('• Memanggil pasukan Skeleton Warrior', col1X + 14, contentY + 86);
      ctx.fillText('• Menjinakkan Shadow Spirit Bear misterius', col1X + 14, contentY + 102);
      ctx.fillText('• Kutukan hisap nyawa musuh (Life Drain)', col1X + 14, contentY + 118);
      ctx.fillText('• Ultimate: Army of the Undead!', col1X + 14, contentY + 134);
    }

    // --- KOLOM 2: SKILLS LIST & ACTION BUTTON ---
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ Cabang Kemampuan (Skills):', col2X + 2, contentY + 2);

    const skillListStartY = contentY + 18;
    for (let sIdx = 0; sIdx < Math.min(curRole.skills.length, 4); sIdx++) {
      const skill = curRole.skills[sIdx];
      const sy = skillListStartY + sIdx * 32;

      ctx.fillStyle = skill.isAbnormal ? 'rgba(168, 85, 247, 0.15)' : '#1e293b';
      ctx.fillRect(col2X, sy, colW - 2, 28);
      ctx.strokeStyle = skill.isAbnormal ? '#a855f7' : '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(col2X, sy, colW - 2, 28);

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.iconSymbol, col2X + 14, sy + 14);

      ctx.textAlign = 'left';
      ctx.fillStyle = skill.isAbnormal ? '#d8b4fe' : '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(skill.name, col2X + 28, sy + 8);

      ctx.fillStyle = player.level >= skill.unlockLevel ? '#4ade80' : '#f87171';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'right';
      const unlockText = skill.unlockLevel === 1 ? 'Awal' : `Lv.${skill.unlockLevel}`;
      ctx.fillText(unlockText, col2X + colW - 8, sy + 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px sans-serif';
      ctx.textAlign = 'left';
      const shortDesc = skill.description.length > 36 ? skill.description.slice(0, 36) + '..' : skill.description;
      ctx.fillText(shortDesc, col2X + 28, sy + 19);
    }

    // Action Button (Bottom Right)
    const btnW = colW - 8;
    const btnH = 32;
    const btnX = col2X + 4;
    const btnY = modalY + modalHeight - 42;

    ctx.fillStyle = curRole.color;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnLabel =
      this.selectedRole === 'MAGICIAN'
        ? 'PILIH AFINITAS ELEMEN ➡'
        : `BANGKITKAN ${curRole.tag} ✨`;
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  }
}
