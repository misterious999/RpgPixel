import { RoleType } from '../types/GameTypes.ts';
import { ROLE_INFO } from '../data/RolesData.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { WeaponData, getWeaponsForRole } from '../data/WeaponsData.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export class BlacksmithNPC {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 32;
  public name: string = 'Master Pandai Besi Brokk';

  public isWorkshopOpen: boolean = false;
  private openTime: number = 0;
  private animTimer: number = 0;

  // Active Tab: 'BUY' (Rare) | 'CRAFT' (Custom Dungeon) | 'COLLECTION'
  public activeTab: 'BUY' | 'CRAFT' | 'COLLECTION' = 'BUY';
  public selectedRole: RoleType = 'KNIGHT';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public isNearPlayer(playerCenterX: number, playerCenterY: number): boolean {
    const npcCenterX = this.x + 16;
    const npcCenterY = this.y + 16;
    return Math.hypot(npcCenterX - playerCenterX, npcCenterY - playerCenterY) < 42;
  }

  public openWorkshop(playerRole: RoleType): void {
    this.isWorkshopOpen = true;
    this.openTime = Date.now();
    this.selectedRole = playerRole !== 'NOVICE' ? playerRole : 'KNIGHT';
    this.activeTab = 'BUY';
  }

  public closeWorkshop(): void {
    this.isWorkshopOpen = false;
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime;
  }

  public handleTouch(
    touchX: number,
    touchY: number,
    screenWidth: number,
    screenHeight: number,
    player: Player,
    floatingText: FloatingTextManager
  ): boolean {
    if (!this.isWorkshopOpen) return false;

    // Debounce to prevent click-through immediately upon opening
    if (Date.now() - this.openTime < 200) {
      return true;
    }

    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(310, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // 1. Close Button (X)
    if (
      touchX >= modalX + modalWidth - 38 &&
      touchX <= modalX + modalWidth - 6 &&
      touchY >= modalY + 4 &&
      touchY <= modalY + 34
    ) {
      this.closeWorkshop();
      return true;
    }

    // 2. Tab Navigation Buttons
    const tabY = modalY + 40;
    const tabH = 26;
    const tabW = (modalWidth - 32) / 3;

    if (touchY >= tabY && touchY <= tabY + tabH) {
      if (touchX >= modalX + 16 && touchX < modalX + 16 + tabW) {
        this.activeTab = 'BUY';
        return true;
      } else if (touchX >= modalX + 16 + tabW && touchX < modalX + 16 + tabW * 2) {
        this.activeTab = 'CRAFT';
        return true;
      } else if (touchX >= modalX + 16 + tabW * 2 && touchX <= modalX + 16 + tabW * 3) {
        this.activeTab = 'COLLECTION';
        return true;
      }
    }

    // 3. Tab: COLLECTION - Role Selector Buttons
    if (this.activeTab === 'COLLECTION') {
      const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
      const rBtnW = (modalWidth - 32 - 16) / 5;
      const rBtnY = modalY + 74;
      const rBtnH = 28;

      for (let i = 0; i < roles.length; i++) {
        const rx = modalX + 16 + i * (rBtnW + 4);
        if (touchX >= rx && touchX <= rx + rBtnW && touchY >= rBtnY && touchY <= rBtnY + rBtnH) {
          this.selectedRole = roles[i];
          return true;
        }
      }
    }

    // 4. Action Button (Buy / Craft / Equip)
    const actBtnW = 200;
    const actBtnH = 34;
    const actBtnX = modalX + modalWidth - actBtnW - 20;
    const actBtnY = modalY + modalHeight - actBtnH - 14;

    if (
      touchX >= actBtnX &&
      touchX <= actBtnX + actBtnW &&
      touchY >= actBtnY &&
      touchY <= actBtnY + actBtnH
    ) {
      this.handleActionButton(player, floatingText);
      return true;
    }

    return true; // Modal consumes touches
  }

  private handleActionButton(player: Player, floatingText: FloatingTextManager): void {
    if (player.role === 'NOVICE') {
      floatingText.spawn(player.x + 10, player.y - 20, '⚠️ Kunjungi Guild Elaine untuk memilih Role terlebih dahulu!', '#facc15', 3.0);
      return;
    }

    // Ensure player is operating on their own role's weapons for buying/crafting/equipping
    const roleWeapons = getWeaponsForRole(player.role);
    const targetTier = this.activeTab === 'CRAFT' ? 'CUSTOM' : 'RARE';
    const weapon = roleWeapons.find((w) => w.tier === targetTier);

    if (!weapon) return;

    const isOwned = player.unlockedWeaponIds.includes(weapon.id);
    const isEquipped = player.equippedWeaponId === weapon.id;

    if (isEquipped) {
      floatingText.spawn(player.x + 10, player.y - 20, '✅ Senjata ini sudah terpasang!', '#4ade80', 2.0);
      return;
    }

    if (isOwned) {
      // Re-equip previously unlocked weapon
      player.equipWeapon(weapon.id);
      floatingText.spawn(player.x + 10, player.y - 20, `⚡ Berhasil memasang ${weapon.name}!`, '#38bdf8', 2.5);
      return;
    }

    // Case 1: Buying RARE weapon with Gold
    if (targetTier === 'RARE' && weapon.goldCost) {
      const currentGold = player.inventory.getItemCount('GOLD_COIN');
      if (currentGold < weapon.goldCost) {
        floatingText.spawn(player.x + 10, player.y - 20, `⚠️ Koin Emas Kurang! Butuh ${weapon.goldCost} Emas.`, '#ef4444', 2.5);
        return;
      }

      const deducted = player.inventory.removeItemsById('GOLD_COIN', weapon.goldCost);
      if (deducted) {
        player.equipWeapon(weapon.id);
        floatingText.spawn(player.x + 10, player.y - 25, `🎉 Berhasil membeli & memasang ${weapon.name}!`, '#facc15', 3.5);
      }
      return;
    }

    // Case 2: Crafting CUSTOM weapon with Dungeon Materials
    if (targetTier === 'CUSTOM' && weapon.recipe) {
      // Check all recipe requirements
      for (const req of weapon.recipe) {
        const count = player.inventory.getItemCount(req.itemId);
        if (count < req.count) {
          const itemDef = ITEM_DEFINITIONS[req.itemId];
          const itemName = itemDef ? itemDef.name : req.itemId;
          floatingText.spawn(player.x + 10, player.y - 20, `⚠️ Bahan ${itemName} kurang (${count}/${req.count})!`, '#ef4444', 2.5);
          return;
        }
      }

      // Deduct all recipe materials
      for (const req of weapon.recipe) {
        player.inventory.removeItemsById(req.itemId, req.count);
      }

      player.equipWeapon(weapon.id);
      floatingText.spawn(player.x + 10, player.y - 28, `🔥 SUKSES MENEMPA ${weapon.name}!`, '#f87171', 4.0);
      return;
    }
  }

  public render(ctx: CanvasRenderingContext2D, isNear: boolean, _player: Player): void {
    const x = this.x;
    const y = this.y;

    ctx.save();

    // 1. Shadow beneath NPC & forge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 28, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stone Forge Furnace (Sebelah kiri NPC)
    const forgeX = x - 18;
    const forgeY = y + 8;
    // Brick base
    ctx.fillStyle = '#334155';
    ctx.fillRect(forgeX, forgeY, 18, 20);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(forgeX, forgeY, 18, 20);

    // Glowing forge mouth (Hot embers)
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(forgeX + 3, forgeY + 5, 12, 10);
    const firePulse = Math.sin(this.animTimer * 6) * 2;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(forgeX + 4, forgeY + 7 - firePulse, 10, 8 + firePulse);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(forgeX + 6, forgeY + 9, 6, 4);

    // Chimney smoke sparks
    ctx.fillStyle = '#fde047';
    const sparkY = (this.animTimer * 20) % 14;
    ctx.fillRect(forgeX + 8 + Math.sin(this.animTimer * 4) * 3, forgeY - sparkY, 2, 2);

    // 3. Blacksmith Master Brokk (Dwarf Craftsman)
    // Feet / Heavy boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 8, y + 26, 6, 5);
    ctx.fillRect(x + 18, y + 26, 6, 5);

    // Trousers
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x + 8, y + 20, 16, 7);

    // Leather Apron & Shirt
    ctx.fillStyle = '#78350f'; // Brown Leather Apron
    ctx.fillRect(x + 7, y + 10, 18, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 9, y + 12, 14, 11);

    // Apron Straps & Brass Buckles
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 9, y + 10, 2, 3);
    ctx.fillRect(x + 21, y + 10, 2, 3);

    // Arms
    ctx.fillStyle = '#fed7aa'; // Muscular skin
    ctx.fillRect(x + 4, y + 12, 4, 8);
    ctx.fillRect(x + 24, y + 12, 4, 8);

    // Right Hand holding Hammer
    const hammerSwing = Math.sin(this.animTimer * 3) * 3;
    ctx.fillStyle = '#78350f'; // Hammer handle
    ctx.fillRect(x + 26, y + 18 + hammerSwing, 2, 8);
    ctx.fillStyle = '#64748b'; // Heavy iron hammer head
    ctx.fillRect(x + 24, y + 16 + hammerSwing, 6, 4);

    // Head & Beard
    ctx.fillStyle = '#fed7aa'; // Face
    ctx.fillRect(x + 10, y + 4, 12, 8);
    // Big Bushy Red/Brown Beard
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x + 8, y + 8, 16, 8);
    ctx.fillRect(x + 11, y + 16, 10, 4);
    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 12, y + 6, 2, 2);
    ctx.fillRect(x + 18, y + 6, 2, 2);
    // Blacksmith Bandana / Headband
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 9, y + 2, 14, 4);

    // 4. Anvil (Sebelah kanan NPC)
    const anvilX = x + 28;
    const anvilY = y + 18;
    ctx.fillStyle = '#475569';
    ctx.fillRect(anvilX + 2, anvilY + 7, 10, 4);
    ctx.fillRect(anvilX, anvilY + 3, 14, 5);
    ctx.fillRect(anvilX - 2, anvilY + 2, 4, 3); // Anvil horn
    // Glowing red-hot metal bar on anvil
    ctx.fillStyle = '#f97316';
    ctx.fillRect(anvilX + 3, anvilY + 1, 6, 2);

    // 5. Floating Name & Prompt Bubble
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('⚒️ Brokk Pandai Besi', x + 16, y - 4);

    if (isNear) {
      const bubbleW = 150;
      const bubbleH = 22;
      const bubbleX = x + 16 - bubbleW / 2;
      const bubbleY = y - 28;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tekan [A] Buka Bengkel Senjata', x + 16, bubbleY + bubbleH / 2);
    }

    ctx.restore();
  }

  public renderModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    player: Player
  ): void {
    if (!this.isWorkshopOpen) return;

    ctx.save();

    // 1. Dim Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Main Modal Box (Landscape Optimized)
    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(310, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Header Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 36);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(modalX, modalY, modalWidth, 36);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛠️ BENGKEL PERSENJATAAN · MASTER BROKK', modalX + 16, modalY + 18);

    // Close Button [✕]
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 20, modalY + 18);

    // 3. Tab Buttons
    const tabY = modalY + 40;
    const tabH = 26;
    const tabW = (modalWidth - 32) / 3;

    const tabs: { id: 'BUY' | 'CRAFT' | 'COLLECTION'; label: string }[] = [
      { id: 'BUY', label: '🛒 Beli Senjata (Rare)' },
      { id: 'CRAFT', label: '🔥 Tempa Khusus (Dungeon)' },
      { id: 'COLLECTION', label: '⚔️ Koleksi Role' }
    ];

    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const tx = modalX + 16 + i * tabW;
      const isActive = this.activeTab === t.id;

      ctx.fillStyle = isActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.6)';
      ctx.fillRect(tx, tabY, tabW - 4, tabH);
      ctx.strokeStyle = isActive ? '#f59e0b' : '#334155';
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.strokeRect(tx, tabY, tabW - 4, tabH);

      ctx.fillStyle = isActive ? '#fde047' : '#94a3b8';
      ctx.font = isActive ? 'bold 10px sans-serif' : '9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const safeTabLabel = CanvasText.truncate(ctx, t.label, tabW - 10);
      ctx.fillText(safeTabLabel, tx + (tabW - 4) / 2, tabY + tabH / 2);
    }

    // Display Gold Counter on top right of subheader
    const playerGold = player.inventory.getItemCount('GOLD_COIN');

    // Display Gold Counter on top right of subheader
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 Emas Anda: ${playerGold}`, modalX + modalWidth - 18, tabY + tabH + 14);

    if (this.activeTab === 'COLLECTION') {
      // Role Switcher Strip
      const roles: RoleType[] = ['KNIGHT', 'MAGICIAN', 'ASSASSIN', 'HEALER', 'NECROMANCER'];
      const rBtnW = (modalWidth - 32 - 16) / 5;
      const rBtnY = modalY + 74;
      const rBtnH = 26;

      for (let i = 0; i < roles.length; i++) {
        const ro = roles[i];
        const rx = modalX + 16 + i * (rBtnW + 4);
        const isSel = this.selectedRole === ro;
        const info = ROLE_INFO[ro];

        ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(rx, rBtnY, rBtnW, rBtnH);
        ctx.strokeStyle = isSel ? '#38bdf8' : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, rBtnY, rBtnW, rBtnH);

        ctx.fillStyle = isSel ? '#ffffff' : info.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.tag, rx + rBtnW / 2, rBtnY + rBtnH / 2);
      }
    }

    // 4. Tab Content Area
    if (player.role === 'NOVICE' && this.activeTab !== 'COLLECTION') {
      this.renderNoviceNotice(ctx, modalX, modalY, modalWidth, modalHeight);
    } else {
      const activeRoleForView = this.activeTab === 'COLLECTION' ? this.selectedRole : player.role;
      const roleWeapons = getWeaponsForRole(activeRoleForView);
      const targetTier = this.activeTab === 'CRAFT' ? 'CUSTOM' : 'RARE';
      const weapon = roleWeapons.find((w) => w.tier === targetTier);

      if (weapon) {
        this.renderWeaponCard(ctx, modalX, modalY, modalWidth, modalHeight, weapon, player);
      }
    }

    ctx.restore();
  }

  private renderNoviceNotice(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number
  ): void {
    const boxX = modalX + 18;
    const boxY = modalY + 80;
    const boxW = modalWidth - 36;
    const boxH = modalHeight - 110;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥊', boxX + boxW / 2, boxY + 45);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KAMU MASIH BERSTATUS NOVICE (PEMULA)', boxX + boxW / 2, boxY + 75);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.fillText('Pilihlah takdir peran sejatimu ke Resepsionis Guild Elaine di sebelah kanan,', boxX + boxW / 2, boxY + 100);
    ctx.fillText('lalu kembalilah kemari untuk menempa atau membeli persenjataan khusus peranmu!', boxX + boxW / 2, boxY + 118);
  }

  private renderWeaponCard(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalWidth: number,
    modalHeight: number,
    weapon: WeaponData,
    player: Player
  ): void {
    const contentY = this.activeTab === 'COLLECTION' ? modalY + 110 : modalY + 74;
    const contentH = modalHeight - (this.activeTab === 'COLLECTION' ? 124 : 88);

    // Left Column: Big Icon Frame
    const iconBoxW = 105;
    const iconBoxH = contentH - 45;
    const iconBoxX = modalX + 16;
    const iconBoxY = contentY;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(iconBoxX, iconBoxY, iconBoxW, iconBoxH);
    ctx.strokeStyle = weapon.themeColor;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(iconBoxX, iconBoxY, iconBoxW, iconBoxH);

    // Glowing border pulse
    ctx.fillStyle = weapon.badgeBg;
    ctx.fillRect(iconBoxX, iconBoxY, iconBoxW, iconBoxH);

    // Weapon Icon
    const icSize = 64;
    const icX = iconBoxX + (iconBoxW - icSize) / 2;
    const icY = iconBoxY + (iconBoxH - icSize) / 2 - 8;
    weapon.renderIcon(ctx, icX, icY, icSize);

    // Weapon Badge
    ctx.fillStyle = weapon.badgeBorder;
    ctx.fillRect(iconBoxX + 4, iconBoxY + iconBoxH - 22, iconBoxW - 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weapon.badgeText, iconBoxX + iconBoxW / 2, iconBoxY + iconBoxH - 14);

    // Right Column: Details & Stats
    const infoX = iconBoxX + iconBoxW + 14;
    const infoW = modalWidth - iconBoxW - 46;

    // Weapon Title & Name
    ctx.fillStyle = weapon.themeColor;
    ctx.font = 'bold 12.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const safeWName = CanvasText.truncate(ctx, weapon.name, infoW - 8);
    ctx.fillText(safeWName, infoX, contentY);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 9px sans-serif';
    const safeWTitle = CanvasText.truncate(ctx, weapon.title, infoW - 8);
    ctx.fillText(safeWTitle, infoX, contentY + 16);

    // Stat Chips (ATK, HP, MP, Crit) - with auto-wrapping to next row if needed
    let chipX = infoX;
    let chipY = contentY + 32;

    const drawChip = (label: string, bg: string, border: string, textCol: string) => {
      ctx.font = 'bold 9px sans-serif';
      const tw = ctx.measureText(label).width + 10;
      if (chipX + tw > infoX + infoW && chipX > infoX) {
        chipX = infoX;
        chipY += 20;
      }
      ctx.fillStyle = bg;
      ctx.fillRect(chipX, chipY, tw, 17);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(chipX, chipY, tw, 17);
      ctx.fillStyle = textCol;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, chipX + 5, chipY + 8.5);
      chipX += tw + 4;
    };

    drawChip(`⚔️ ATK +${weapon.atkBonus}`, 'rgba(239, 68, 68, 0.25)', '#ef4444', '#fca5a5');
    if (weapon.hpBonus) drawChip(`❤️ HP +${weapon.hpBonus}`, 'rgba(34, 197, 94, 0.25)', '#22c55e', '#86efac');
    if (weapon.mpBonus) drawChip(`✨ MP +${weapon.mpBonus}`, 'rgba(56, 189, 248, 0.25)', '#38bdf8', '#bae6fd');
    if (weapon.critBonus) drawChip(`⚡ CRIT +${Math.round(weapon.critBonus * 100)}%`, 'rgba(234, 179, 8, 0.25)', '#eab308', '#fef08a');

    // Special Perk Box
    const perkY = Math.max(contentY + 54, chipY + 22);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(infoX, perkY, infoW, 24);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(infoX, perkY, infoW, 24);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '8.5px sans-serif';
    ctx.textBaseline = 'middle';
    const safePerk = CanvasText.truncate(ctx, weapon.specialPerk, infoW - 10);
    ctx.fillText(safePerk, infoX + 6, perkY + 12);

    // Requirement Checklist (Gold for Rare, Dungeon Items for Custom)
    const reqY = perkY + 28;
    if (weapon.tier === 'RARE' && weapon.goldCost) {
      const pGold = player.inventory.getItemCount('GOLD_COIN');
      const hasEnough = pGold >= weapon.goldCost;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Biaya Pembelian Langsung:', infoX, reqY);

      ctx.fillStyle = hasEnough ? '#4ade80' : '#ef4444';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.fillText(`💰 ${weapon.goldCost} Koin Emas (Milikmu: ${pGold})`, infoX, reqY + 14);
    } else if (weapon.tier === 'CUSTOM' && weapon.recipe) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Bahan Khusus Dungeon:', infoX, reqY);

      // Draw recipe items checklist with auto wrapping
      let rx = infoX;
      let ry = reqY + 14;
      for (const req of weapon.recipe) {
        const count = player.inventory.getItemCount(req.itemId);
        const itemDef = ITEM_DEFINITIONS[req.itemId];
        const isOk = count >= req.count;
        const boxW = 76;

        if (rx + boxW > infoX + infoW && rx > infoX) {
          rx = infoX;
          ry += 22;
        }

        ctx.fillStyle = isOk ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(rx, ry, boxW, 18);
        ctx.strokeStyle = isOk ? '#22c55e' : '#ef4444';
        ctx.strokeRect(rx, ry, boxW, 18);

        ctx.fillStyle = isOk ? '#86efac' : '#fca5a5';
        ctx.font = 'bold 8px sans-serif';
        ctx.textBaseline = 'middle';
        const label = `${itemDef?.name.slice(0, 5) || req.itemId}: ${count}/${req.count}`;
        ctx.fillText(label, rx + 4, ry + 9);

        rx += boxW + 4;
      }
    }

    // Bottom Action Button (Buy / Craft / Equip)
    const actBtnW = Math.min(190, modalWidth - 32);
    const actBtnH = 30;
    const actBtnX = modalX + modalWidth - actBtnW - 16;
    const actBtnY = modalY + modalHeight - actBtnH - 10;

    const isOwned = player.unlockedWeaponIds.includes(weapon.id);
    const isEquipped = player.equippedWeaponId === weapon.id;

    if (isEquipped) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.fillRect(actBtnX, actBtnY, actBtnW, actBtnH);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(actBtnX, actBtnY, actBtnW, actBtnH);

      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✅ Sedang Digunakan', actBtnX + actBtnW / 2, actBtnY + actBtnH / 2);
    } else if (isOwned) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(actBtnX, actBtnY, actBtnW, actBtnH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(actBtnX, actBtnY, actBtnW, actBtnH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ Pasang Senjata (Equip)', actBtnX + actBtnW / 2, actBtnY + actBtnH / 2);
    } else if (weapon.tier === 'RARE') {
      const pGold = player.inventory.getItemCount('GOLD_COIN');
      const canBuy = pGold >= (weapon.goldCost || 0);

      ctx.fillStyle = canBuy ? '#d97706' : '#334155';
      ctx.fillRect(actBtnX, actBtnY, actBtnW, actBtnH);
      ctx.strokeStyle = canBuy ? '#facc15' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(actBtnX, actBtnY, actBtnW, actBtnH);

      ctx.fillStyle = canBuy ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(canBuy ? `🛒 Beli (${weapon.goldCost} Emas)` : '🔒 Emas Tidak Cukup', actBtnX + actBtnW / 2, actBtnY + actBtnH / 2);
    } else if (weapon.tier === 'CUSTOM') {
      let canCraft = true;
      if (weapon.recipe) {
        for (const req of weapon.recipe) {
          if (player.inventory.getItemCount(req.itemId) < req.count) {
            canCraft = false;
            break;
          }
        }
      }

      ctx.fillStyle = canCraft ? '#b91c1c' : '#334155';
      ctx.fillRect(actBtnX, actBtnY, actBtnW, actBtnH);
      ctx.strokeStyle = canCraft ? '#ef4444' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(actBtnX, actBtnY, actBtnW, actBtnH);

      ctx.fillStyle = canCraft ? '#fef08a' : '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(canCraft ? '🔥 Tempa Senjata Khusus!' : '🔒 Kumpulkan Bahan di Dungeon', actBtnX + actBtnW / 2, actBtnY + actBtnH / 2);
    }
  }
}
