import { Inventory } from '../items/Inventory.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from './FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { ROLE_INFO } from '../data/RolesData.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';

export class InventoryUI {
  public isOpen: boolean = false;
  public isCardModalOpen: boolean = false;
  private selectedSlotIndex: number | null = 0;

  // Touch button dimensions for Backpack icon
  private backpackBtn = {
    x: 0,
    y: 10,
    size: 34
  };

  constructor(
    private inventory: Inventory,
    private player: Player,
    private floatingText: FloatingTextManager
  ) {}

  public toggle(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.isCardModalOpen = false;
    }
    AudioEngine.playButtonClick();
    if (this.isOpen) {
      // Auto-select first non-empty slot if available
      for (let i = 0; i < this.inventory.capacity; i++) {
        if (this.inventory.slots[i]) {
          this.selectedSlotIndex = i;
          return;
        }
      }
      this.selectedSlotIndex = 0;
    }
  }

  /**
   * Handles touch/click on the screen. Returns true if the touch was consumed by UI.
   */
  public handleTouch(
    touchX: number,
    touchY: number,
    screenWidth: number,
    screenHeight: number
  ): boolean {
    this.backpackBtn.x = screenWidth - 44;

    // 1. Check Backpack Toggle Button
    if (
      touchX >= this.backpackBtn.x &&
      touchX <= this.backpackBtn.x + this.backpackBtn.size &&
      touchY >= this.backpackBtn.y &&
      touchY <= this.backpackBtn.y + this.backpackBtn.size
    ) {
      this.toggle();
      return true;
    }

    if (!this.isOpen) return false;

    // Jika Modal Kartu Petualang sedang terbuka, proses sentuhan pada kartu atau tombol tutup
    if (this.isCardModalOpen) {
      const cardW = Math.min(500, screenWidth - 24);
      const cardH = Math.min(290, screenHeight - 16);
      const cardX = (screenWidth - cardW) / 2;
      const cardY = (screenHeight - cardH) / 2;

      // Close button (X) top-right
      if (
        touchX >= cardX + cardW - 36 &&
        touchX <= cardX + cardW - 4 &&
        touchY >= cardY + 4 &&
        touchY <= cardY + 36
      ) {
        this.isCardModalOpen = false;
        AudioEngine.playButtonClick();
        return true;
      }

      // Bottom Close Button: [✕ TUTUP KARTU PETUALANG]
      const bBtnW = 160;
      const bBtnH = 28;
      const bBtnX = cardX + (cardW - bBtnW) / 2;
      const bBtnY = cardY + cardH - 34;
      if (
        touchX >= bBtnX &&
        touchX <= bBtnX + bBtnW &&
        touchY >= bBtnY &&
        touchY <= bBtnY + bBtnH
      ) {
        this.isCardModalOpen = false;
        AudioEngine.playButtonClick();
        return true;
      }

      // Klik di luar kartu juga menutup modal kartu
      if (
        touchX < cardX ||
        touchX > cardX + cardW ||
        touchY < cardY ||
        touchY > cardY + cardH
      ) {
        this.isCardModalOpen = false;
        AudioEngine.playButtonClick();
        return true;
      }

      return true; // Telan sentuhan saat kartu terbuka
    }

    // Landscape 2-Column Modal layout bounds
    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Check outside touch -> close
    if (
      touchX < modalX ||
      touchX > modalX + modalWidth ||
      touchY < modalY ||
      touchY > modalY + modalHeight
    ) {
      this.isOpen = false;
      return true;
    }

    // Close button (X) at top right of modal
    const closeBtnX = modalX + modalWidth - 36;
    const closeBtnY = modalY + 4;
    if (
      touchX >= closeBtnX &&
      touchX <= closeBtnX + 32 &&
      touchY >= closeBtnY &&
      touchY <= closeBtnY + 32
    ) {
      this.isOpen = false;
      return true;
    }

    // Left Column: Grid slots (4 columns x 4 rows)
    const slotSize = 40;
    const slotGap = 6;
    const gridStartX = modalX + 16;
    const gridStartY = modalY + 44;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const sx = gridStartX + col * (slotSize + slotGap);
        const sy = gridStartY + row * (slotSize + slotGap);

        if (
          touchX >= sx &&
          touchX <= sx + slotSize &&
          touchY >= sy &&
          touchY <= sy + slotSize
        ) {
          this.selectedSlotIndex = index;
          return true;
        }
      }
    }

    // Right Column: "Gunakan" (Use) button check
    const col2X = modalX + 204;
    const col2W = modalWidth - 204 - 16;
    const btnX = col2X + 10;
    const btnY = modalY + modalHeight - 44;
    const btnWidth = col2W - 20;
    const btnHeight = 32;

    if (this.selectedSlotIndex !== null) {
      const slot = this.inventory.getSlot(this.selectedSlotIndex);
      if (slot) {
        const def = ITEM_DEFINITIONS[slot.itemId];
        if (def && def.category === 'consumable') {
          if (
            touchX >= btnX &&
            touchX <= btnX + btnWidth &&
            touchY >= btnY &&
            touchY <= btnY + btnHeight
          ) {
            this.useSelectedItem();
            return true;
          }
        } else if (def && def.id === 'ADVENTURER_CARD') {
          if (
            touchX >= btnX &&
            touchX <= btnX + btnWidth &&
            touchY >= btnY &&
            touchY <= btnY + btnHeight
          ) {
            this.inspectAdventurerCard();
            return true;
          }
        }
      }
    }

    return true; // Modal is open, so swallow touch
  }

  private useSelectedItem(): void {
    if (this.selectedSlotIndex === null) return;
    const slot = this.inventory.getSlot(this.selectedSlotIndex);
    if (!slot) return;

    const def = ITEM_DEFINITIONS[slot.itemId];
    if (!def) return;

    if (def.id === 'HEALTH_POTION') {
      if (this.player.hp >= this.player.maxHp) {
        this.floatingText.spawn(this.player.x + 10, this.player.y - 10, 'Darah Sudah Penuh!', '#f87171');
        return;
      }
      const healed = this.player.heal(def.effectValue || 35);
      this.inventory.removeItem(this.selectedSlotIndex, 1);
      AudioEngine.playPotionDrink();
      this.floatingText.spawn(this.player.x + 10, this.player.y - 10, `+${healed} HP Pulih!`, '#4ade80');

      if (!this.inventory.getSlot(this.selectedSlotIndex)) {
        let nextIndex: number | null = null;
        for (let i = 0; i < this.inventory.capacity; i++) {
          if (this.inventory.slots[i]) {
            nextIndex = i;
            break;
          }
        }
        this.selectedSlotIndex = nextIndex ?? 0;
      }
    } else if (def.id === 'MAGIC_FLOWER' || def.id === 'MANA_POTION') {
      if (this.player.mp >= this.player.maxMp) {
        this.floatingText.spawn(this.player.x + 10, this.player.y - 10, 'Mana Sudah Penuh!', '#38bdf8');
        return;
      }
      const restored = this.player.restoreMp(def.effectValue || 25);
      this.inventory.removeItem(this.selectedSlotIndex, 1);
      AudioEngine.playPotionDrink();
      this.floatingText.spawn(this.player.x + 10, this.player.y - 10, `+${restored} MP Pulih!`, '#38bdf8');

      if (!this.inventory.getSlot(this.selectedSlotIndex)) {
        let nextIndex: number | null = null;
        for (let i = 0; i < this.inventory.capacity; i++) {
          if (this.inventory.slots[i]) {
            nextIndex = i;
            break;
          }
        }
        this.selectedSlotIndex = nextIndex ?? 0;
      }
    }
  }

  private inspectAdventurerCard(): void {
    AudioEngine.playButtonClick();
    this.isCardModalOpen = true;
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    this.backpackBtn.x = screenWidth - 44;

    // 1. Always Render Backpack Icon Button in top right
    const { x: bx, y: by, size: bs } = this.backpackBtn;
    ctx.fillStyle = this.isOpen ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(bx + bs / 2, by + bs / 2, bs / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Backpack Graphic (Brown bag + buckle)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(bx + 9, by + 10, 16, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx + 11, by + 8, 12, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bx + 15, by + 14, 4, 4);

    if (!this.isOpen) {
      ctx.restore();
      return;
    }

    // 2. Render Modal Dim Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 3. Modal Container (Landscape 2-Column Layout)
    const modalWidth = Math.min(540, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Title Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 34);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎒 TAS PETUALANG (16 Slot)', modalX + 16, modalY + 17);

    // Close Button (X)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 17);

    // 4. Left Column: Item Slots (4x4 Grid)
    const slotSize = 40;
    const slotGap = 6;
    const gridStartX = modalX + 16;
    const gridStartY = modalY + 44;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const sx = gridStartX + col * (slotSize + slotGap);
        const sy = gridStartY + row * (slotSize + slotGap);

        const isSelected = this.selectedSlotIndex === index;

        // Slot Background
        ctx.fillStyle = isSelected ? '#1e3a8a' : '#111827';
        ctx.fillRect(sx, sy, slotSize, slotSize);

        // Slot Border
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(sx, sy, slotSize, slotSize);

        // Slot Content
        const slot = this.inventory.getSlot(index);
        if (slot) {
          const def = ITEM_DEFINITIONS[slot.itemId];
          if (def) {
            def.renderIcon(ctx, sx + 4, sy + 4, slotSize - 8);

            // Item Count Badge
            if (slot.count > 1) {
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = '#f1f5f9';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.strokeText(`${slot.count}`, sx + slotSize - 3, sy + slotSize - 2);
              ctx.fillText(`${slot.count}`, sx + slotSize - 3, sy + slotSize - 2);
            }
          }
        }
      }
    }

    // 5. Right Column: Selected Item Detail Panel (No Overflow!)
    const col2X = modalX + 204;
    const col2W = modalWidth - 204 - 16;
    const detailY = modalY + 44;
    const detailHeight = modalHeight - 56;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(col2X, detailY, col2W, detailHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col2X, detailY, col2W, detailHeight);

    if (this.selectedSlotIndex !== null) {
      const slot = this.inventory.getSlot(this.selectedSlotIndex);
      if (slot) {
        const def = ITEM_DEFINITIONS[slot.itemId];
        if (def) {
          // Icon preview (34x34)
          def.renderIcon(ctx, col2X + 12, detailY + 12, 34);

          // Name (Truncated if too long)
          ctx.fillStyle = def.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          const maxNameWidth = col2W - 60;
          const cleanName = CanvasText.truncate(ctx, def.name, maxNameWidth);
          ctx.fillText(cleanName, col2X + 54, detailY + 12);

          // Type Tag & Count
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px sans-serif';
          const catName =
            def.id === 'ADVENTURER_CARD'
              ? 'Kartu Identitas Resmi'
              : def.category === 'consumable'
              ? 'Ramuan Obat'
              : def.category === 'material'
              ? 'Material Alam'
              : 'Mata Uang';
          ctx.fillText(`Kategori: ${catName} · Jumlah: ${slot.count}`, col2X + 54, detailY + 30);

          // Divider Line
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(col2X + 12, detailY + 54);
          ctx.lineTo(col2X + col2W - 12, detailY + 54);
          ctx.stroke();

          // Description (Wrapped strictly inside col2W - 24)
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px sans-serif';
          const descMaxWidth = col2W - 24;
          const descHeight = CanvasText.drawWrappedText(
            ctx,
            def.description,
            col2X + 12,
            detailY + 64,
            descMaxWidth,
            14,
            3
          );

          // Effect Tag
          const effectText = def.id === 'ADVENTURER_CARD'
            ? `🪪 Pemilik: ${this.player.username} · Role: ${ROLE_INFO[this.player.role]?.name || this.player.role}`
            : (def.id === 'MANA_POTION' || def.id === 'MAGIC_FLOWER')
            ? `✨ Efek: +${def.effectValue} MP Pulih`
            : def.effectValue
            ? `✨ Efek: +${def.effectValue} HP Pulih`
            : `✨ Tipe: ${catName}`;
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9.5px sans-serif';
          CanvasText.drawWrappedText(
            ctx,
            effectText,
            col2X + 12,
            detailY + 68 + descHeight,
            descMaxWidth,
            13,
            2
          );

          // Action Button
          if (def.id === 'ADVENTURER_CARD') {
            const btnX = col2X + 12;
            const btnY = modalY + modalHeight - 44;
            const btnWidth = col2W - 24;
            const btnHeight = 32;

            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪪 CEK KARTU PETUALANG', btnX + btnWidth / 2, btnY + btnHeight / 2);
          } else if (def.category === 'consumable') {
            const btnX = col2X + 12;
            const btnY = modalY + modalHeight - 44;
            const btnWidth = col2W - 24;
            const btnHeight = 32;

            ctx.fillStyle = '#10b981';
            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GUNAKAN ITEM', btnX + btnWidth / 2, btnY + btnHeight / 2);
          }
        }
      } else {
        // Empty Slot Message (Centered & Clean)
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Slot ini kosong', col2X + col2W / 2, detailY + detailHeight / 2 - 10);
        ctx.fillStyle = '#475569';
        ctx.font = '9px sans-serif';
        ctx.fillText('Jelajahi dunia untuk menemukan item!', col2X + col2W / 2, detailY + detailHeight / 2 + 10);
      }
    }

    // Render Adventurer Card Passport Overlay jika aktif
    if (this.isCardModalOpen) {
      this.renderAdventurerCardModal(ctx, screenWidth, screenHeight);
    }

    ctx.restore();
  }

  private renderAdventurerCardModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number
  ): void {
    const cardW = Math.min(500, screenWidth - 24);
    const cardH = Math.min(290, screenHeight - 16);
    const cardX = (screenWidth - cardW) / 2;
    const cardY = (screenHeight - cardH) / 2;

    const curRole = ROLE_INFO[this.player.role] || ROLE_INFO.NOVICE;

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Card Outer Box
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 10);
    ctx.fill();

    // Ornate Golden Passport Frame
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 4, cardY + 4, cardW - 8, cardH - 8);

    // Header Gold Ribbon
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cardX + 4, cardY + 4, cardW - 8, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ KARTU RESMI IDENTITAS PETUALANG ★', cardX + cardW / 2, cardY + 16);

    // Close button (X)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cardX + cardW - 16, cardY + 16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✕', cardX + cardW - 16, cardY + 16);

    // 2-Column Passport Layout
    const colW = (cardW - 36) / 2;
    const col1X = cardX + 12;
    const col2X = cardX + 24 + colW;
    const contentY = cardY + 34;
    const contentH = cardH - 74;

    // --- KOLOM 1: IDENTITAS & EMBLEM ROLE ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(col1X, contentY, colW, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col1X, contentY, colW, contentH);

    // Role Emblem Portrait Box
    const portSize = 56;
    const portX = col1X + 10;
    const portY = contentY + 10;
    ctx.fillStyle = curRole.color;
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(portX, portY, portSize, portSize);

    // Main Role Symbol
    const mainIcon = curRole.skills[0]?.iconSymbol || '⚔️';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainIcon, portX + portSize / 2, portY + portSize / 2);

    // Identity Details on Right of Portrait
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    const safeName = CanvasText.truncate(ctx, this.player.username, colW - portSize - 28);
    ctx.fillText(safeName, portX + portSize + 10, portY + 2);

    ctx.fillStyle = curRole.color;
    ctx.font = 'bold 10.5px sans-serif';
    ctx.fillText(`[${curRole.tag}] ${curRole.name}`, portX + portSize + 10, portY + 19);

    const rank = this.player.adventurerRank;
    ctx.fillStyle = rank.color;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${rank.badge} · Lv.${this.player.level}`, portX + portSize + 10, portY + 36);

    // EXP Bar
    const expBarY = portY + portSize + 8;
    const expPct = Math.min(100, (this.player.exp / this.player.maxExp) * 100);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(portX, expBarY, colW - 20, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(portX, expBarY, ((colW - 20) * expPct) / 100, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px sans-serif';
    ctx.fillText(`EXP: ${this.player.exp}/${this.player.maxExp}`, portX, expBarY + 11);

    // Status Locked Badge
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.fillRect(portX, expBarY + 24, colW - 20, 20);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(portX, expBarY + 24, colW - 20, 20);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 STATUS: TAKDIR TERIKAT PERMANEN', portX + (colW - 20) / 2, expBarY + 29);

    // --- KOLOM 2: DATA KEMAMPUAN & STEMPEL SERIKAT ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(col2X, contentY, colW, contentH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(col2X, contentY, colW, contentH);

    // Subheader
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(col2X, contentY, colW, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📋 DATA KEMAMPUAN PETUALANG', col2X + colW / 2, contentY + 9);

    // Attributes list
    const attrY = contentY + 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9.5px sans-serif';
    ctx.fillText(`❤️ Darah Maksimal (HP): ${this.player.maxHp}`, col2X + 10, attrY);
    ctx.fillText(`💧 Tenaga Sihir (MP): ${this.player.maxMp}`, col2X + 10, attrY + 15);
    const atk = this.player.getAttackDamage().damage;
    ctx.fillText(`⚔️ Kekuatan Serangan: ${atk} ATK`, col2X + 10, attrY + 30);
    const gold = this.player.inventory.getItemCount('GOLD_COIN');
    ctx.fillText(`💰 Tabungan Emas: ${gold} Koin Emas`, col2X + 10, attrY + 45);
    const elemText = this.player.role === 'MAGICIAN' && this.player.magicianAffinities ? this.player.magicianAffinities.primary : 'Netral';
    ctx.fillText(`🔮 Afinitas Jiwa: ${elemText}`, col2X + 10, attrY + 60);

    // Guild Wax Stamp
    const sealX = col2X + colW - 36;
    const sealY = contentY + contentH - 34;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GUILD', sealX, sealY - 4);
    ctx.fillText('SEAL', sealX, sealY + 4);

    // Bottom Close Button
    const bBtnW = 160;
    const bBtnH = 26;
    const bBtnX = cardX + (cardW - bBtnW) / 2;
    const bBtnY = cardY + cardH - 32;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bBtnX, bBtnY, bBtnW, bBtnH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bBtnX, bBtnY, bBtnW, bBtnH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕ TUTUP KARTU PETUALANG', bBtnX + bBtnW / 2, bBtnY + bBtnH / 2);
  }
}
