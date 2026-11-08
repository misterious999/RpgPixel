import { RoleType, MagicElement, MagicianAffinities } from '../types/GameTypes.ts';
import { ROLE_INFO, ELEMENT_INFO, getMagicianSkills } from '../data/RolesData.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';

export class GuildNPC {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 32;
  public name: string = 'Resepsionis Guild Elaine';

  public isAppraisalOpen: boolean = false;
  private openTime: number = 0;
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
    this.openTime = Date.now();
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

    // Debounce to prevent click-through immediately upon pressing [A] (220ms)
    if (Date.now() - this.openTime < 220) {
      return true;
    }

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
      const descH = CanvasText.drawWrappedText(
        ctx,
        curPrimaryInfo.description,
        col1X + 10,
        modalY + 128,
        colW - 20,
        12,
        4
      );

      const traitY = Math.max(modalY + 128 + descH + 8, modalY + 180);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('✨ Keistimewaan Utama:', col1X + 10, traitY);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px sans-serif';
      const traitText = CanvasText.truncate(
        ctx,
        `• Spesialisasi 100% Sihir ${curPrimaryInfo.name.split(' ')[0]}`,
        colW - 20
      );
      ctx.fillText(traitText, col1X + 10, traitY + 16);

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
        const safeSpellName = CanvasText.truncate(ctx, sk.name, colW - 42);
        ctx.fillText(safeSpellName, col2X + 28, sy + 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '7.5px sans-serif';
        const safeSpellDesc = CanvasText.truncate(ctx, sk.description, colW - 42);
        ctx.fillText(safeSpellDesc, col2X + 28, sy + 18);
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
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const safeIkrarText = CanvasText.truncate(
        ctx,
        `IKRAR MAGICIAN (${curPrimaryInfo.name.split(' ')[0]})`,
        btnW - 12
      );
      ctx.fillText(safeIkrarText, btnX + btnW / 2, btnY + btnH / 2);

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
    ctx.font = '9px sans-serif';
    const roleDescH = CanvasText.drawWrappedText(
      ctx,
      curRole.description,
      col1X + 12,
      contentY + 28,
      colW - 24,
      12,
      3
    );

    const perkStartY = contentY + 28 + Math.max(roleDescH, 24) + 6;
    const perkSpacing = 14;

    const renderPerks = (headerTitle: string, headerColor: string, bullets: string[]) => {
      ctx.fillStyle = headerColor;
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText(headerTitle, col1X + 12, perkStartY);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8px sans-serif';
      for (let b = 0; b < bullets.length; b++) {
        const by = perkStartY + 14 + b * perkSpacing;
        const text = CanvasText.truncate(ctx, bullets[b], colW - 24);
        ctx.fillText(text, col1X + 14, by);
      }
    };

    if (this.selectedRole === 'MAGICIAN') {
      renderPerks('✨ Spesialisasi Magician:', '#38bdf8', [
        '• 1 Elemen Utama (100% Full Power)',
        '• Bebas pilih hingga 2 Elemen Sampingan',
        '• 5 Elemen: Api, Es, Petir, Angin, Bumi',
        '• Skill abnormal anime unik per elemen!'
      ]);
    } else if (this.selectedRole === 'KNIGHT') {
      renderPerks('🛡️ Keunggulan Ksatria:', '#facc15', [
        '• Pertahanan fisik & HP tertinggi di Guild',
        '• Tangkal & counter serangan dg Parrying',
        '• Melompat ke musuh dengan Leap Attack',
        '• Ultimate: Excalibur Golden Slash!'
      ]);
    } else if (this.selectedRole === 'ASSASSIN') {
      renderPerks('🗡️ Keunggulan Assassin:', '#22c55e', [
        '• Menyusup tak terlihat dengan Stealth',
        '• Kecepatan lari kilat & critical burst',
        '• Racun mematikan melumpuhkan lawan',
        '• Ultimate: Anime Shadow Flash Slice!'
      ]);
    } else if (this.selectedRole === 'HEALER') {
      renderPerks('🕊️ Keunggulan Healer:', '#38bdf8', [
        '• Pemulihan instan HP sendiri & rekan',
        '• Perisai suci supresi kutukan & debuff',
        '• Regenerasi mana terus-menerus',
        '• Ultimate: Divine Sanctuary Bless!'
      ]);
    } else if (this.selectedRole === 'NECROMANCER') {
      renderPerks('💀 Keunggulan Necromancer:', '#a855f7', [
        '• Memanggil pasukan Skeleton Warrior',
        '• Menjinakkan Shadow Spirit Bear',
        '• Kutukan hisap nyawa lawan (Life Drain)',
        '• Ultimate: Army of the Undead!'
      ]);
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

      // Unlock requirement tag on the right
      const unlockText = skill.unlockLevel === 1 ? 'Awal' : `Lv.${skill.unlockLevel}`;
      ctx.font = 'bold 8px sans-serif';
      const unlockW = ctx.measureText(unlockText).width;

      ctx.fillStyle = player.level >= skill.unlockLevel ? '#4ade80' : '#f87171';
      ctx.textAlign = 'right';
      ctx.fillText(unlockText, col2X + colW - 8, sy + 8);

      // Skill Name on the left (Safe truncated so it never overlaps unlock tag)
      ctx.textAlign = 'left';
      ctx.fillStyle = skill.isAbnormal ? '#d8b4fe' : '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      const maxSkillNameW = colW - 28 - unlockW - 14;
      const safeSkillName = CanvasText.truncate(ctx, skill.name, maxSkillNameW);
      ctx.fillText(safeSkillName, col2X + 28, sy + 8);

      // Skill Description (Truncated so it never overflows card)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px sans-serif';
      ctx.textAlign = 'left';
      const safeDesc = CanvasText.truncate(ctx, skill.description, colW - 36);
      ctx.fillText(safeDesc, col2X + 28, sy + 19);
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
    const btnRawLabel =
      this.selectedRole === 'MAGICIAN'
        ? 'PILIH AFINITAS ELEMEN ➡'
        : `BANGKITKAN ${curRole.tag} ✨`;
    const btnLabel = CanvasText.truncate(ctx, btnRawLabel, btnW - 10);
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  }
}
