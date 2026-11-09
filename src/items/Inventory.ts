import { ITEM_DEFINITIONS } from './ItemTypes.ts';

export interface InventorySlot {
  itemId: string;
  count: number;
}

export class Inventory {
  public capacity: number;
  public slots: (InventorySlot | null)[];

  constructor(capacity: number = 16) {
    this.capacity = capacity;
    this.slots = new Array(capacity).fill(null);
  }

  /**
   * Adds an item to the inventory. Returns the amount successfully added.
   */
  public addItem(itemId: string, count: number = 1): number {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || count <= 0) return 0;

    let remaining = count;

    // 1. First attempt to stack in existing slots of same item
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId && slot.count < def.maxStack) {
        const canTake = def.maxStack - slot.count;
        const toAdd = Math.min(canTake, remaining);
        slot.count += toAdd;
        remaining -= toAdd;
        if (remaining <= 0) break;
      }
    }

    // 2. Put leftover into first empty slots
    if (remaining > 0) {
      for (let i = 0; i < this.capacity; i++) {
        if (!this.slots[i]) {
          const toAdd = Math.min(def.maxStack, remaining);
          this.slots[i] = { itemId, count: toAdd };
          remaining -= toAdd;
          if (remaining <= 0) break;
        }
      }
    }

    return count - remaining;
  }

  public removeItem(slotIndex: number, count: number = 1): boolean {
    if (slotIndex < 0 || slotIndex >= this.capacity) return false;
    const slot = this.slots[slotIndex];
    if (!slot) return false;

    if (slot.count > count) {
      slot.count -= count;
      return true;
    } else if (slot.count === count) {
      this.slots[slotIndex] = null;
      return true;
    }
    return false;
  }

  public getSlot(slotIndex: number): InventorySlot | null {
    if (slotIndex < 0 || slotIndex >= this.capacity) return null;
    return this.slots[slotIndex];
  }

  /**
   * Menghitung total jumlah suatu item di seluruh slot tas
   */
  public getItemCount(itemId: string): number {
    let total = 0;
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  /**
   * Mengurangi sejumlah item berdasarkan ID item di seluruh slot
   */
  public removeItemsById(itemId: string, count: number): boolean {
    if (this.getItemCount(itemId) < count) return false;
    let needed = count;
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId) {
        if (slot.count > needed) {
          slot.count -= needed;
          needed = 0;
          break;
        } else {
          needed -= slot.count;
          this.slots[i] = null;
          if (needed <= 0) break;
        }
      }
    }
    return true;
  }
}
