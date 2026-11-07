import { Inventory } from '../items/Inventory.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from './FloatingText.ts';

export class InventoryUI {
  public isOpen: boolean = false;
  private selectedSlotIndex: number | null = 0;

  // Touch button dimensions for Backpack icon
  private backpackBtn = {
    x: 0,
    y: 12,
    size: 40
  };

  constructor(private inventory: Inventory, private player: Player, private floatingText: FloatingTextManager) {}

  public toggle(): void {
    this.isOpen = !this.isOpen;
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
  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    this.backpackBtn.x = screenWidth - 52;

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

    // Modal layout bounds
    const modalWidth = Math.min(360, screenWidth - 24);
    const modalHeight = Math.min(420, screenHeight - 40);
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
    const closeBtnY = modalY + 8;
    if (
      touchX >= closeBtnX &&
      touchX <= closeBtnX + 28 &&
      touchY >= closeBtnY &&
      touchY <= closeBtnY + 28
    ) {
      this.isOpen = false;
      return true;
    }

    // Grid slots (4 columns x 4 rows)
    const slotSize = 44;
    const slotGap = 8;
    const gridStartX = modalX + (modalWidth - (4 * slotSize + 3 * slotGap)) / 2;
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

    // "Gunakan" (Use) button check
    if (this.selectedSlotIndex !== null) {
      const slot = this.inventory.getSlot(this.selectedSlotIndex);
      if (slot) {
        const def = ITEM_DEFINITIONS[slot.itemId];
        if (def && def.category === 'consumable') {
          const btnWidth = 140;
          const btnHeight = 36;
          const btnX = modalX + (modalWidth - btnWidth) / 2;
          const btnY = modalY + modalHeight - 48;

          if (
            touchX >= btnX &&
            touchX <= btnX + btnWidth &&
            touchY >= btnY &&
            touchY <= btnY + btnHeight
          ) {
            this.useSelectedItem();
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
        this.floatingText.spawn(this.player.x + 10, this.player.y - 10, 'Darah Penuh!', '#f87171');
        return;
      }
      const healed = this.player.heal(def.effectValue || 35);
      this.inventory.removeItem(this.selectedSlotIndex, 1);
      this.floatingText.spawn(this.player.x + 10, this.player.y - 10, `+${healed} HP`, '#4ade80');

      // If slot is now empty, reset or keep selection
      if (!this.inventory.getSlot(this.selectedSlotIndex)) {
        this.selectedSlotIndex = null;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    this.backpackBtn.x = screenWidth - 52;

    // 1. Always Render Backpack Icon Button in top right
    const { x: bx, y: by, size: bs } = this.backpackBtn;
    ctx.fillStyle = this.isOpen ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(bx + bs / 2, by + bs / 2, bs / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Backpack Graphic (Brown bag + buckle)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(bx + 11, by + 12, 18, 16);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx + 13, by + 10, 14, 5);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bx + 18, by + 17, 4, 4);

    if (!this.isOpen) {
      ctx.restore();
      return;
    }

    // 2. Render Modal Dim Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 3. Modal Container
    const modalWidth = Math.min(360, screenWidth - 24);
    const modalHeight = Math.min(420, screenHeight - 40);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Title Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 38);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎒 TAS PETUALANG', modalX + 16, modalY + 19);

    // Close Button (X)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 20, modalY + 19);

    // 4. Item Slots (4x4 Grid)
    const slotSize = 44;
    const slotGap = 8;
    const gridStartX = modalX + (modalWidth - (4 * slotSize + 3 * slotGap)) / 2;
    const gridStartY = modalY + 48;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const sx = gridStartX + col * (slotSize + slotGap);
        const sy = gridStartY + row * (slotSize + slotGap);

        const isSelected = this.selectedSlotIndex === index;

        // Slot Background
        ctx.fillStyle = isSelected ? '#1e293b' : '#111827';
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

            // Item Count
            if (slot.count > 1) {
              ctx.font = 'bold 11px sans-serif';
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

    // 5. Selected Item Detail Panel
    const detailY = gridStartY + 4 * (slotSize + slotGap) + 8;
    const detailHeight = modalY + modalHeight - detailY - 12;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 14, detailY, modalWidth - 28, detailHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 14, detailY, modalWidth - 28, detailHeight);

    if (this.selectedSlotIndex !== null) {
      const slot = this.inventory.getSlot(this.selectedSlotIndex);
      if (slot) {
        const def = ITEM_DEFINITIONS[slot.itemId];
        if (def) {
          // Icon preview
          def.renderIcon(ctx, modalX + 22, detailY + 12, 32);

          // Name
          ctx.fillStyle = def.color;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(def.name, modalX + 62, detailY + 12);

          // Type Tag
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px sans-serif';
          ctx.fillText(`Kategori: ${def.category.toUpperCase()} | Jumlah: ${slot.count}`, modalX + 62, detailY + 28);

          // Description
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px sans-serif';
          ctx.fillText(def.description, modalX + 22, detailY + 50);

          // Action Button if consumable
          if (def.category === 'consumable') {
            const btnWidth = 140;
            const btnHeight = 34;
            const btnX = modalX + (modalWidth - btnWidth) / 2;
            const btnY = modalY + modalHeight - 48;

            ctx.fillStyle = '#10b981';
            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GUNAKAN', btnX + btnWidth / 2, btnY + btnHeight / 2);
          }
        }
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Slot kosong', modalX + modalWidth / 2, detailY + detailHeight / 2);
      }
    }

    ctx.restore();
  }
}
