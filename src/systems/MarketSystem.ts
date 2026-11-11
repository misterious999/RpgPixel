import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export interface MarketItem {
  id: string;
  name: string;
  category: 'potion' | 'scroll' | 'material';
  price: number; // in Val (𝒱)
  desc: string;
}

export const MARKET_ITEMS: MarketItem[] = [
  { id: 'HEALTH_POTION', name: 'Ramuan Darah (HP)', category: 'potion', price: 40, desc: 'Memulihkan 35 HP seketika saat darurat tempur.' },
  { id: 'MANA_POTION', name: 'Ramuan Tenaga Sihir (MP)', category: 'potion', price: 50, desc: 'Memulihkan 25 MP untuk sihir & keahlian peran.' },
  { id: 'ELIXIR_FULL', name: 'Elixir Agung Kerajaan', category: 'potion', price: 250, desc: 'Ramuan legendaris pemulih 100% HP & MP penuh.' },
  { id: 'PORTAL_SCROLL', name: 'Gulungan Teleportasi Desa', category: 'scroll', price: 300, desc: 'Mantra teleportasi instan kembali ke alun-alun desa.' },
  { id: 'DUNGEON_GEM', name: 'Permata Kristal Abisal', category: 'scroll', price: 500, desc: 'Kristal mineral bersinar sarat energi magis murni.' },
  { id: 'ANCIENT_BONE', name: 'Tulang Purba Abisal', category: 'material', price: 100, desc: 'Fosil purba langka untuk alkimia dan material tempa.' },
  { id: 'DARK_IRON_ORE', name: 'Bijih Besi Gelap', category: 'material', price: 120, desc: 'Bijih tambang utama penempaan senjata Master Brokk.' },
  { id: 'WOOD_LOG', name: 'Kayu Rimba Pilihan', category: 'material', price: 35, desc: 'Kayu padat untuk bahan baku busur panah & kuali masak.' },
  { id: 'WOLF_MEAT', name: 'Daging Serigala Segar', category: 'material', price: 75, desc: 'Bahan masak Steak Serigala berprotein di Dapur Gaston.' },
  { id: 'MAGIC_FLOWER', name: 'Bunga Mistis Rimba', category: 'material', price: 60, desc: 'Kelopak bunga magis untuk sup herbal dan ramuan Lily.' },
  { id: 'SLIME_JELLY', name: 'Jeli Slime Hijau', category: 'material', price: 45, desc: 'Ekstrak jeli kenyal untuk sirup stamina dan alkimia.' }
];

/**
 * Harga jual standar item ke pasar untuk menghasilkan Val & mengurangi beban tas
 */
export function getItemSellPrice(itemId: string): number {
  const sellPrices: Record<string, number> = {
    BRONZE_COIN: 10,
    SILVER_COIN: 100,
    GOLD_COIN: 1000,
    PLATINUM_COIN: 10000,
    HEALTH_POTION: 20,
    MANA_POTION: 25,
    ELIXIR_FULL: 125,
    PORTAL_SCROLL: 150,
    DUNGEON_GEM: 250,
    ANCIENT_BONE: 50,
    DARK_IRON_ORE: 60,
    WOOD_LOG: 18,
    WOLF_MEAT: 38,
    MAGIC_FLOWER: 30,
    SLIME_JELLY: 22,
    WOLF_STEAK: 85,
    SLIME_PUDDING: 75,
    MYSTIC_SOUP: 70
  };
  return sellPrices[itemId] ?? 20;
}

/**
 * Cek apakah item dapat dijual (Kartu Petualang tidak boleh dijual karena identitas permanen)
 */
export function isItemSellable(itemId: string): boolean {
  if (itemId === 'ADVENTURER_CARD') return false;
  return true;
}

export class MarketSystem {
  public isOpen: boolean = false;
  public activeMode: 'BUY' | 'SELL' = 'BUY';
  public activeCategory: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL' = 'ALL';
  public selectedItemIndex: number = 0;
  public selectedSellIndex: number = 0;
  public onBuySuccess?: () => void;

  // Saved hitboxes for mobile touch interaction
  private closeBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private buyModeTabRect = { x: 0, y: 0, w: 0, h: 0 };
  private sellModeTabRect = { x: 0, y: 0, w: 0, h: 0 };

  // Buy Mode hitboxes
  private categoryRects: { category: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL'; x: number; y: number; w: number; h: number }[] = [];
  private itemCardRects: { index: number; x: number; y: number; w: number; h: number }[] = [];
  private buy1BtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private buy5BtnRect = { x: 0, y: 0, w: 0, h: 0 };

  // Sell Mode hitboxes
  private sellCardRects: { slotIndex: number; listIndex: number; x: number; y: number; w: number; h: number }[] = [];
  private sell1BtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private sellAllBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  private animTimer: number = 0;

  public update(deltaTime: number): void {
    if (this.isOpen) {
      this.animTimer += deltaTime * 3;
    }
  }

  public open(): void {
    this.isOpen = true;
    this.activeMode = 'BUY';
    this.activeCategory = 'ALL';
    this.selectedItemIndex = 0;
    this.selectedSellIndex = 0;
    AudioEngine.playButtonClick();
  }

  public close(): void {
    this.isOpen = false;
    AudioEngine.playButtonClick();
  }

  public getFilteredItems(): MarketItem[] {
    if (this.activeCategory === 'ALL') return MARKET_ITEMS;
    if (this.activeCategory === 'POTION') return MARKET_ITEMS.filter((i) => i.category === 'potion');
    if (this.activeCategory === 'SCROLL') return MARKET_ITEMS.filter((i) => i.category === 'scroll');
    return MARKET_ITEMS.filter((i) => i.category === 'material');
  }

  /**
   * Mengambil daftar seluruh item yang ada di tas pemain untuk dijual
   */
  public getSellableInventory(player: Player): { slotIndex: number; itemId: string; count: number }[] {
    const list: { slotIndex: number; itemId: string; count: number }[] = [];
    for (let i = 0; i < player.inventory.capacity; i++) {
      const slot = player.inventory.slots[i];
      if (slot && slot.count > 0) {
        list.push({ slotIndex: i, itemId: slot.itemId, count: slot.count });
      }
    }
    return list;
  }

  /**
   * Pembelian barang dari pasar menggunakan Val (𝒱)
   */
  public buyItem(player: Player, item: MarketItem, quantity: number, floatingText?: FloatingTextManager): boolean {
    const def = ITEM_DEFINITIONS[item.id];
    if (!def) return false;

    const totalPrice = item.price * quantity;
    if (player.val < totalPrice) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Val tidak cukup! Butuh ${totalPrice.toLocaleString()} 𝒱`, '#f87171', 2.0);
      }
      AudioEngine.playPlayerHurt();
      return false;
    }

    const added = player.inventory.addItem(item.id, quantity);
    if (added <= 0) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Tas Petualang Penuh (16/16 Slot)!', '#f87171', 2.5);
      }
      AudioEngine.playPlayerHurt();
      return false;
    }

    const actualCost = item.price * added;
    player.removeVal(actualCost);
    AudioEngine.playItemPickup(true);

    if (floatingText) {
      if (added < quantity) {
        floatingText.spawn(player.x + 10, player.y - 18, `🛒 Beli ${added}x ${def.name} (-${actualCost.toLocaleString()} 𝒱, Tas Penuh)!`, '#facc15', 3.0);
      } else {
        floatingText.spawn(player.x + 10, player.y - 18, `🛒 Beli ${added}x ${def.name} (-${actualCost.toLocaleString()} 𝒱)!`, '#4ade80', 2.5);
      }
    }
    this.onBuySuccess?.();
    return true;
  }

  /**
   * Penjualan item dari inventory pemain ke pasar untuk menghasilkan Val & mengosongkan slot tas
   */
  public sellItem(
    player: Player,
    slotIndex: number,
    quantity: number,
    floatingText?: FloatingTextManager
  ): boolean {
    const slot = player.inventory.getSlot(slotIndex);
    if (!slot || slot.count <= 0) return false;

    if (!isItemSellable(slot.itemId)) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Item ini terikat dan tidak bisa dijual!', '#f87171', 2.0);
      }
      AudioEngine.playPlayerHurt();
      return false;
    }

    const def = ITEM_DEFINITIONS[slot.itemId];
    const toSell = Math.min(quantity, slot.count);
    const unitPrice = getItemSellPrice(slot.itemId);
    const totalVal = unitPrice * toSell;

    // Hapus dari inventory dan tambahkan Val
    player.inventory.removeItem(slotIndex, toSell);
    player.addVal(totalVal);
    AudioEngine.playItemPickup(true);

    if (floatingText) {
      floatingText.spawn(
        player.x + 10,
        player.y - 18,
        `💰 Terjual ${toSell}x ${def ? def.name : slot.itemId} (+${totalVal.toLocaleString()} 𝒱)!`,
        '#facc15',
        2.5
      );
    }

    // Perbarui index seleksi jika item habis
    const remainingItems = this.getSellableInventory(player);
    if (this.selectedSellIndex >= remainingItems.length) {
      this.selectedSellIndex = Math.max(0, remainingItems.length - 1);
    }

    return true;
  }

  /**
   * Menangani sentuhan layar untuk navigasi mode, filter kategori, pemilihan item, dan tombol beli/jual
   */
  public handleTouch(
    touchX: number,
    touchY: number,
    player: Player,
    floatingText?: FloatingTextManager
  ): boolean {
    if (!this.isOpen) return false;

    // 1. Tombol Tutup [✕]
    const { x: cx, y: cy, w: cw, h: ch } = this.closeBtnRect;
    if (touchX >= cx && touchX <= cx + cw && touchY >= cy && touchY <= cy + ch) {
      this.close();
      return true;
    }

    // 2. Tab Pemilihan Mode [BELI DARI TOKO] vs [JUAL DARI TAS]
    const { x: bmx, y: bmy, w: bmw, h: bmh } = this.buyModeTabRect;
    if (touchX >= bmx && touchX <= bmx + bmw && touchY >= bmy && touchY <= bmy + bmh) {
      if (this.activeMode !== 'BUY') {
        this.activeMode = 'BUY';
        this.selectedItemIndex = 0;
        AudioEngine.playButtonClick();
      }
      return true;
    }

    const { x: smx, y: smy, w: smw, h: smh } = this.sellModeTabRect;
    if (touchX >= smx && touchX <= smx + smw && touchY >= smy && touchY <= smy + smh) {
      if (this.activeMode !== 'SELL') {
        this.activeMode = 'SELL';
        this.selectedSellIndex = 0;
        AudioEngine.playButtonClick();
      }
      return true;
    }

    // ==========================================
    // 3. INTERAKSI DALAM MODE BELI (BUY MODE)
    // ==========================================
    if (this.activeMode === 'BUY') {
      // 3.1 Kategori Filter Tab
      for (const cat of this.categoryRects) {
        if (touchX >= cat.x && touchX <= cat.x + cat.w && touchY >= cat.y && touchY <= cat.y + cat.h) {
          this.activeCategory = cat.category;
          this.selectedItemIndex = 0;
          AudioEngine.playButtonClick();
          return true;
        }
      }

      // 3.2 Pemilihan Item Card di List Kiri
      const filtered = this.getFilteredItems();
      for (const card of this.itemCardRects) {
        if (touchX >= card.x && touchX <= card.x + card.w && touchY >= card.y && touchY <= card.y + card.h) {
          if (card.index < filtered.length) {
            this.selectedItemIndex = card.index;
            AudioEngine.playButtonClick();
          }
          return true;
        }
      }

      // 3.3 Tombol Beli 1x
      const selectedItem = filtered[this.selectedItemIndex] || filtered[0];
      if (selectedItem) {
        const { x: b1x, y: b1y, w: b1w, h: b1h } = this.buy1BtnRect;
        if (touchX >= b1x && touchX <= b1x + b1w && touchY >= b1y && touchY <= b1y + b1h) {
          this.buyItem(player, selectedItem, 1, floatingText);
          return true;
        }

        // 3.4 Tombol Beli 5x
        const { x: b5x, y: b5y, w: b5w, h: b5h } = this.buy5BtnRect;
        if (touchX >= b5x && touchX <= b5x + b5w && touchY >= b5y && touchY <= b5y + b5h) {
          this.buyItem(player, selectedItem, 5, floatingText);
          return true;
        }
      }
    }

    // ==========================================
    // 4. INTERAKSI DALAM MODE JUAL (SELL MODE)
    // ==========================================
    if (this.activeMode === 'SELL') {
      const invItems = this.getSellableInventory(player);

      // 4.1 Pemilihan Item Tas di List Kiri
      for (const card of this.sellCardRects) {
        if (touchX >= card.x && touchX <= card.x + card.w && touchY >= card.y && touchY <= card.y + card.h) {
          if (card.listIndex < invItems.length) {
            this.selectedSellIndex = card.listIndex;
            AudioEngine.playButtonClick();
          }
          return true;
        }
      }

      // 4.2 Tombol Jual 1x & Jual Semua
      const selected = invItems[this.selectedSellIndex];
      if (selected) {
        const { x: s1x, y: s1y, w: s1w, h: s1h } = this.sell1BtnRect;
        if (touchX >= s1x && touchX <= s1x + s1w && touchY >= s1y && touchY <= s1y + s1h) {
          this.sellItem(player, selected.slotIndex, 1, floatingText);
          return true;
        }

        const { x: sax, y: say, w: saw, h: sah } = this.sellAllBtnRect;
        if (touchX >= sax && touchX <= sax + saw && touchY >= say && touchY <= say + sah) {
          this.sellItem(player, selected.slotIndex, selected.count, floatingText);
          return true;
        }
      }
    }

    return true; // Menelan sentuhan agar tidak bocor ke game world
  }

  /**
   * Render Modal Pasar Raya Oakhaven (2-Column Landscape, Mode Beli & Mode Jual)
   */
  public renderModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    player: Player
  ): void {
    if (!this.isOpen) return;

    ctx.save();

    // 1. Dim Backdrop
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Modal Dimensions (Responsive Landscape)
    const modalW = Math.min(540, screenWidth - 20);
    const modalH = Math.min(300, screenHeight - 16);
    const modalX = Math.round((screenWidth - modalW) / 2);
    const modalY = Math.round((screenHeight - modalH) / 2);

    // Modal Background & Frame Tenda Pasar
    ctx.fillStyle = '#0b1120';
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalW, modalH, 10);
    ctx.fill();

    // Ornate Golden Market Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 3, modalY + 3, modalW - 6, modalH - 6);

    // 3. Header Bar Kanopi Belang Merah-Kuning Pasar
    const headerH = 32;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(modalX + 3, modalY + 3, modalW - 6, headerH);

    // Awning stripes accent
    const stripeW = 20;
    for (let sx = modalX + 3; sx < modalX + modalW - 6; sx += stripeW * 2) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(sx, modalY + 3, stripeW, 4);
    }

    // Title & Merchant Info
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛒 PASAR RAYA OAKHAVEN', modalX + 12, modalY + 3 + headerH / 2);

    // Saldo Dompet Val di Kanan Header
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'right';
    ctx.fillText(`👛 ${player.val.toLocaleString()} 𝒱`, modalX + modalW - 36, modalY + 3 + headerH / 2);

    // Close Button [✕]
    const closeX = modalX + modalW - 30;
    const closeY = modalY + 6;
    const closeSize = 20;
    this.closeBtnRect = { x: closeX, y: closeY, w: closeSize, h: closeSize };

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(closeX + closeSize / 2, closeY + closeSize / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX + closeSize / 2, closeY + closeSize / 2);

    // 4. Sub-banner: 2 Mode Tabs [🛒 BELI DARI TOKO] & [💰 JUAL DARI TAS]
    const modeTabY = modalY + headerH + 4;
    const modeTabH = 22;
    const modeTabW = Math.floor((modalW - 20) / 2);

    // Tab Beli
    const isBuyActive = this.activeMode === 'BUY';
    const isSellActive = this.activeMode === 'SELL';
    const bTabX = modalX + 8;
    const sTabX = bTabX + modeTabW + 4;

    this.buyModeTabRect = { x: bTabX, y: modeTabY, w: modeTabW, h: modeTabH };
    this.sellModeTabRect = { x: sTabX, y: modeTabY, w: modeTabW, h: modeTabH };

    // Draw Tab Beli
    ctx.fillStyle = isBuyActive ? '#16a34a' : 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bTabX, modeTabY, modeTabW, modeTabH, 4);
    ctx.fill();
    ctx.strokeStyle = isBuyActive ? '#4ade80' : '#475569';
    ctx.lineWidth = isBuyActive ? 1.8 : 0.8;
    ctx.stroke();

    ctx.font = isBuyActive ? 'bold 9px sans-serif' : '8.5px sans-serif';
    ctx.fillStyle = isBuyActive ? '#ffffff' : '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛒 BELI DARI TOKO', bTabX + modeTabW / 2, modeTabY + modeTabH / 2);

    // Draw Tab Jual
    const usedSlots = player.inventory.slots.filter((s) => s !== null).length;
    ctx.fillStyle = isSellActive ? '#d97706' : 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(sTabX, modeTabY, modeTabW, modeTabH, 4);
    ctx.fill();
    ctx.strokeStyle = isSellActive ? '#fde047' : '#475569';
    ctx.lineWidth = isSellActive ? 1.8 : 0.8;
    ctx.stroke();

    ctx.font = isSellActive ? 'bold 9px sans-serif' : '8.5px sans-serif';
    ctx.fillStyle = isSellActive ? '#ffffff' : '#94a3b8';
    ctx.fillText(`💰 JUAL DARI TAS (${usedSlots}/16)`, sTabX + modeTabW / 2, modeTabY + modeTabH / 2);

    // ==========================================
    // RENDER BODY SESUAI MODE
    // ==========================================
    if (this.activeMode === 'BUY') {
      this.renderBuyModeBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player);
    } else {
      this.renderSellModeBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player);
    }

    ctx.restore();
  }

  /**
   * Render Konten Mode Beli
   */
  private renderBuyModeBody(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalW: number,
    modalH: number,
    startY: number,
    player: Player
  ): void {
    // 1. Category Filter Tabs Bar
    const tabY = startY;
    const tabH = 20;
    const categories: { id: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL'; label: string }[] = [
      { id: 'ALL', label: '🏷️ Semua' },
      { id: 'POTION', label: '🧪 Ramuan' },
      { id: 'SCROLL', label: '📜 Gulungan' },
      { id: 'MATERIAL', label: '🥩 Bahan Alami' }
    ];

    const tabW = Math.floor((modalW - 16) / categories.length);
    this.categoryRects = [];

    categories.forEach((cat, idx) => {
      const tx = modalX + 8 + idx * tabW;
      this.categoryRects.push({ category: cat.id, x: tx, y: tabY, w: tabW - 4, h: tabH });

      const isActive = this.activeCategory === cat.id;
      ctx.fillStyle = isActive ? '#0284c7' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(tx, tabY, tabW - 4, tabH, 3);
      ctx.fill();

      ctx.strokeStyle = isActive ? '#38bdf8' : '#334155';
      ctx.lineWidth = isActive ? 1.5 : 0.8;
      ctx.stroke();

      ctx.font = isActive ? 'bold 8px sans-serif' : '7.5px sans-serif';
      ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.label, tx + (tabW - 4) / 2, tabY + tabH / 2);
    });

    // 2. Main 2-Column Content Area
    const contentY = tabY + tabH + 6;
    const contentH = modalH - (contentY - modalY) - 8;
    const colGap = 8;
    const col1W = Math.floor((modalW - 24) * 0.52);
    const col2W = modalW - 24 - col1W - colGap;
    const col1X = modalX + 8;
    const col2X = col1X + col1W + colGap;

    // --- KOLOM KIRI: DAFTAR ITEM TOKO ---
    const filteredItems = this.getFilteredItems();
    if (this.selectedItemIndex >= filteredItems.length) {
      this.selectedItemIndex = 0;
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(col1X, contentY, col1W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.itemCardRects = [];

    const itemCols = 2;
    const itemRows = 3;
    const cardGap = 4;
    const cardW = Math.floor((col1W - cardGap * 3) / itemCols);
    const cardH = Math.floor((contentH - cardGap * 4) / itemRows);

    for (let i = 0; i < Math.min(filteredItems.length, itemCols * itemRows); i++) {
      const item = filteredItems[i];
      const col = i % itemCols;
      const row = Math.floor(i / itemCols);
      const cx = col1X + cardGap + col * (cardW + cardGap);
      const cy = contentY + cardGap + row * (cardH + cardGap);

      this.itemCardRects.push({ index: i, x: cx, y: cy, w: cardW, h: cardH });

      const isSelected = this.selectedItemIndex === i;
      const canAfford = player.val >= item.price;

      ctx.fillStyle = isSelected ? '#1e3a8a' : (canAfford ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.7)');
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 4);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#38bdf8' : (canAfford ? '#475569' : '#334155');
      ctx.lineWidth = isSelected ? 2 : 0.8;
      ctx.stroke();

      const def = ITEM_DEFINITIONS[item.id];
      if (def) {
        def.renderIcon(ctx, cx + 4, cy + 4, cardH - 8);
      }

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : (canAfford ? '#f8fafc' : '#94a3b8');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const maxNW = cardW - (cardH - 8) - 10;
      const safeN = CanvasText.truncate(ctx, item.name, maxNW);
      ctx.fillText(safeN, cx + cardH, cy + 5);

      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillStyle = canAfford ? '#facc15' : '#ef4444';
      ctx.fillText(`${item.price.toLocaleString()} 𝒱`, cx + cardH, cy + cardH - 12);
    }

    // --- KOLOM KANAN: DETAIL ITEM TERPILIH & TOMBOL BELI ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(col2X, contentY, col2W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    const selectedItem = filteredItems[this.selectedItemIndex] || filteredItems[0];
    if (selectedItem) {
      const def = ITEM_DEFINITIONS[selectedItem.id];
      const iconSize = 34;
      if (def) {
        def.renderIcon(ctx, col2X + 8, contentY + 8, iconSize);
      }

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const nameW = col2W - iconSize - 18;
      const safeTitle = CanvasText.truncate(ctx, selectedItem.name, nameW);
      ctx.fillText(safeTitle, col2X + iconSize + 12, contentY + 8);

      const owned = player.inventory.getItemCount(selectedItem.id);
      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      const catText = selectedItem.category === 'potion' ? 'Obat-Obatan' : (selectedItem.category === 'scroll' ? 'Gulungan Ajaib' : 'Bahan Kerajinan');
      ctx.fillText(`Kategori: ${catText}`, col2X + iconSize + 12, contentY + 22);
      ctx.fillText(`🎒 Di Tas: ${owned} buah`, col2X + iconSize + 12, contentY + 32);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(col2X + 8, contentY + 48);
      ctx.lineTo(col2X + col2W - 8, contentY + 48);
      ctx.stroke();

      const descY = contentY + 54;
      const descMaxW = col2W - 16;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8px sans-serif';
      CanvasText.drawWrappedText(ctx, selectedItem.desc, col2X + 8, descY, descMaxW, 11, 2);

      const priceBoxY = contentY + contentH - 58;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.roundRect(col2X + 8, priceBoxY, col2W - 16, 20, 3);
      ctx.fill();

      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Harga Beli Satuan:', col2X + 14, priceBoxY + 10);

      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'right';
      ctx.fillText(`${selectedItem.price.toLocaleString()} 𝒱`, col2X + col2W - 14, priceBoxY + 10);

      const btnAreaY = contentY + contentH - 32;
      const btnH = 26;
      const btnGap = 6;
      const bW = Math.floor((col2W - 16 - btnGap) / 2);

      const b1X = col2X + 8;
      const b5X = b1X + bW + btnGap;

      this.buy1BtnRect = { x: b1X, y: btnAreaY, w: bW, h: btnH };
      this.buy5BtnRect = { x: b5X, y: btnAreaY, w: bW, h: btnH };

      const can1 = player.val >= selectedItem.price;
      const can5 = player.val >= selectedItem.price * 5;

      ctx.fillStyle = can1 ? '#16a34a' : '#334155';
      ctx.beginPath();
      ctx.roundRect(b1X, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = can1 ? '#4ade80' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = can1 ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Beli 1x', b1X + bW / 2, btnAreaY + btnH / 2);

      ctx.fillStyle = can5 ? '#d97706' : '#334155';
      ctx.beginPath();
      ctx.roundRect(b5X, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = can5 ? '#fde047' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = can5 ? '#ffffff' : '#94a3b8';
      ctx.fillText('Beli 5x', b5X + bW / 2, btnAreaY + btnH / 2);
    }
  }

  /**
   * Render Konten Mode Jual (Mengurangi isi tas dan mendapatkan Val)
   */
  private renderSellModeBody(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalW: number,
    modalH: number,
    startY: number,
    player: Player
  ): void {
    const contentY = startY;
    const contentH = modalH - (contentY - modalY) - 8;
    const colGap = 8;
    const col1W = Math.floor((modalW - 24) * 0.52);
    const col2W = modalW - 24 - col1W - colGap;
    const col1X = modalX + 8;
    const col2X = col1X + col1W + colGap;

    const invItems = this.getSellableInventory(player);

    if (this.selectedSellIndex >= invItems.length) {
      this.selectedSellIndex = Math.max(0, invItems.length - 1);
    }

    // --- KOLOM KIRI: DAFTAR ITEM DARI TAS PEMAIN ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(col1X, contentY, col1W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.sellCardRects = [];

    if (invItems.length === 0) {
      // Tas kosong
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎒 Tas Kosong!', col1X + col1W / 2, contentY + contentH / 2 - 8);
      ctx.font = '7.5px sans-serif';
      ctx.fillText('Tidak ada item untuk dijual.', col1X + col1W / 2, contentY + contentH / 2 + 8);
    } else {
      const itemCols = 2;
      const itemRows = 3;
      const cardGap = 4;
      const cardW = Math.floor((col1W - cardGap * 3) / itemCols);
      const cardH = Math.floor((contentH - cardGap * 4) / itemRows);

      for (let i = 0; i < Math.min(invItems.length, itemCols * itemRows); i++) {
        const itemInfo = invItems[i];
        const col = i % itemCols;
        const row = Math.floor(i / itemCols);
        const cx = col1X + cardGap + col * (cardW + cardGap);
        const cy = contentY + cardGap + row * (cardH + cardGap);

        this.sellCardRects.push({ slotIndex: itemInfo.slotIndex, listIndex: i, x: cx, y: cy, w: cardW, h: cardH });

        const isSelected = this.selectedSellIndex === i;
        const sellPrice = getItemSellPrice(itemInfo.itemId);
        const sellable = isItemSellable(itemInfo.itemId);

        ctx.fillStyle = isSelected ? '#854d0e' : (sellable ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.7)');
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 4);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#facc15' : (sellable ? '#64748b' : '#334155');
        ctx.lineWidth = isSelected ? 2 : 0.8;
        ctx.stroke();

        const def = ITEM_DEFINITIONS[itemInfo.itemId];
        if (def) {
          def.renderIcon(ctx, cx + 4, cy + 4, cardH - 8);
        }

        // Nama & Jumlah
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const maxNW = cardW - (cardH - 8) - 10;
        const itemName = def ? `${def.name} x${itemInfo.count}` : `${itemInfo.itemId} x${itemInfo.count}`;
        const safeN = CanvasText.truncate(ctx, itemName, maxNW);
        ctx.fillText(safeN, cx + cardH, cy + 5);

        // Nilai Jual
        ctx.font = 'bold 7.5px sans-serif';
        ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
        const tagText = sellable ? `+${sellPrice.toLocaleString()} 𝒱` : 'Terikat';
        ctx.fillText(tagText, cx + cardH, cy + cardH - 12);
      }
    }

    // --- KOLOM KANAN: DETAIL ITEM TERPILIH & TOMBOL JUAL ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(col2X, contentY, col2W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    const selected = invItems[this.selectedSellIndex];
    if (selected) {
      const def = ITEM_DEFINITIONS[selected.itemId];
      const iconSize = 34;
      if (def) {
        def.renderIcon(ctx, col2X + 8, contentY + 8, iconSize);
      }

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const nameW = col2W - iconSize - 18;
      const safeTitle = CanvasText.truncate(ctx, def ? def.name : selected.itemId, nameW);
      ctx.fillText(safeTitle, col2X + iconSize + 12, contentY + 8);

      const sellPrice = getItemSellPrice(selected.itemId);
      const sellable = isItemSellable(selected.itemId);

      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`🎒 Jumlah di Tas: ${selected.count} buah`, col2X + iconSize + 12, contentY + 22);
      ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
      ctx.fillText(sellable ? `Status: Siap Dijual (+${sellPrice} 𝒱/buah)` : 'Status: 🔒 Terikat Jiwa (Tidak Bisa Dijual)', col2X + iconSize + 12, contentY + 32);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(col2X + 8, contentY + 48);
      ctx.lineTo(col2X + col2W - 8, contentY + 48);
      ctx.stroke();

      const descY = contentY + 54;
      const descMaxW = col2W - 16;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8px sans-serif';
      const desc = def ? def.description : 'Item dari tas petualang.';
      CanvasText.drawWrappedText(ctx, desc, col2X + 8, descY, descMaxW, 11, 2);

      // Price Tag Box
      const priceBoxY = contentY + contentH - 58;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.roundRect(col2X + 8, priceBoxY, col2W - 16, 20, 3);
      ctx.fill();

      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Total Nilai Stack (${selected.count}x):`, col2X + 14, priceBoxY + 10);

      const totalVal = sellPrice * selected.count;
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
      ctx.textAlign = 'right';
      ctx.fillText(sellable ? `+${totalVal.toLocaleString()} 𝒱` : '0 𝒱', col2X + col2W - 14, priceBoxY + 10);

      // Action Buttons (Jual 1x dan Jual Semua)
      const btnAreaY = contentY + contentH - 32;
      const btnH = 26;
      const btnGap = 6;
      const bW = Math.floor((col2W - 16 - btnGap) / 2);

      const s1X = col2X + 8;
      const saX = s1X + bW + btnGap;

      this.sell1BtnRect = { x: s1X, y: btnAreaY, w: bW, h: btnH };
      this.sellAllBtnRect = { x: saX, y: btnAreaY, w: bW, h: btnH };

      // Tombol Jual 1x
      ctx.fillStyle = sellable ? '#16a34a' : '#334155';
      ctx.beginPath();
      ctx.roundRect(s1X, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = sellable ? '#4ade80' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = sellable ? '#ffffff' : '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sellable ? 'Jual 1x' : 'Terikat', s1X + bW / 2, btnAreaY + btnH / 2);

      // Tombol Jual Semua
      ctx.fillStyle = sellable ? '#d97706' : '#334155';
      ctx.beginPath();
      ctx.roundRect(saX, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = sellable ? '#fde047' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = sellable ? '#ffffff' : '#64748b';
      ctx.fillText(sellable ? `Jual Semua (${selected.count}x)` : 'Terikat', saX + bW / 2, btnAreaY + btnH / 2);
    } else {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Pilih item di sebelah kiri untuk melihat nilai jual.', col2X + col2W / 2, contentY + contentH / 2);
    }
  }
}
