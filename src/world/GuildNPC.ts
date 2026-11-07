import { RoleType } from '../types/GameTypes.ts';
import { ROLE_INFO } from '../data/RolesData.ts';
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
  }

  public closeAppraisal(): void {
    this.isAppraisalOpen = false;
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number, player: Player, floatingText: FloatingTextManager): boolean {
    if (!this.isAppraisalOpen) return false;

    const modalWidth = Math.min(380, screenWidth - 20);
    const modalHeight = Math.min(480, screenHeight - 30);
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

    // Role selection tabs (Knight, Magician, Assassin, Healer, Necromancer)
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

    // "PILIH ROLE INI" Confirmation Button
    const btnW = 200;
    const btnH = 40;
    const btnX = modalX + (modalWidth - btnW) / 2;
    const btnY = modalY + modalHeight - 52;

    if (
      touchX >= btnX &&
      touchX <= btnX + btnW &&
      touchY >= btnY &&
      touchY <= btnY + btnH
    ) {
      player.setRole(this.selectedRole);
      const roleName = ROLE_INFO[this.selectedRole].name;
      floatingText.spawn(player.x + 10, player.y - 18, `✨ Role Diperoleh: ${roleName}!`, '#facc15', 3.0);
      this.closeAppraisal();
      return true;
    }

    return true; // Modal consumes touch
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
    ctx.fillRect(x + 24, y + 8, 2, 7); // Quill

    // 2. Receptionist Elaine (behind desk)
    // Hair
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 10, y, 12, 6);
    ctx.fillRect(x + 8, y + 2, 3, 10);
    ctx.fillRect(x + 21, y + 2, 3, 10);
    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 11, y + 4, 10, 8);
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 13, y + 7, 2, 2);
    ctx.fillRect(x + 17, y + 7, 2, 2);
    // Smile
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 14, y + 10, 4, 1);
    // Uniform (Gold badge)
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

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    const modalWidth = Math.min(380, screenWidth - 20);
    const modalHeight = Math.min(480, screenHeight - 30);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Modal Box
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
    ctx.fillText('⚖️ UJI BAKAT SERIKAT GUILD', modalX + 16, modalY + 21);

    // Close button
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 20, modalY + 21);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Pilih jalur takdirmu untuk membangkitkan skill sejati:', modalX + 16, modalY + 54);

    // Role Tabs (5 Roles)
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

    // Role Details Panel
    const curRole = ROLE_INFO[this.selectedRole];
    const detailY = tabStartY + tabHeight + 10;
    const detailH = modalY + modalHeight - detailY - 60;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 12, detailY, modalWidth - 24, detailH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 12, detailY, modalWidth - 24, detailH);

    // Role Title & Desc
    ctx.fillStyle = curRole.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(curRole.name, modalX + 22, detailY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.fillText(curRole.description, modalX + 22, detailY + 28);

    // Skills List Header
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('⚡ Cabang Kemampuan (Skills):', modalX + 22, detailY + 48);

    // List Skills
    const skillListStartY = detailY + 64;
    for (let sIdx = 0; sIdx < curRole.skills.length; sIdx++) {
      const skill = curRole.skills[sIdx];
      const sy = skillListStartY + sIdx * 34;

      // Skill slot bg
      ctx.fillStyle = skill.isAbnormal ? 'rgba(168, 85, 247, 0.15)' : '#0f172a';
      ctx.fillRect(modalX + 20, sy, modalWidth - 40, 30);
      ctx.strokeStyle = skill.isAbnormal ? '#a855f7' : '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(modalX + 20, sy, modalWidth - 40, 30);

      // Icon symbol
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.iconSymbol, modalX + 34, sy + 15);

      // Skill Name & Unlock Level
      ctx.textAlign = 'left';
      ctx.fillStyle = skill.isAbnormal ? '#d8b4fe' : '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(skill.name, modalX + 48, sy + 8);

      ctx.fillStyle = player.level >= skill.unlockLevel ? '#4ade80' : '#f87171';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      const unlockText = skill.unlockLevel === 1 ? 'Terbuka Awal' : `Lv. ${skill.unlockLevel}`;
      ctx.fillText(unlockText, modalX + modalWidth - 28, sy + 8);

      // Short desc
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      const shortDesc = skill.description.length > 48 ? skill.description.slice(0, 48) + '...' : skill.description;
      ctx.fillText(shortDesc, modalX + 48, sy + 20);
    }

    // Confirmation Button "PILIH ROLE INI"
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
