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

export class MarketSystem {
  public isOpen: boolean = false;
  public activeCategory: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL' = 'ALL';
  public selectedItemIndex: number = 0;
  public onBuySuccess?: () => void;

  // Saved hitboxes for mobile touch interaction
  private closeBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private categoryRects: { category: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL'; x: number; y: number; w: number; h: number }[] = [];
  private itemCardRects: { index: number; x: number; y: number; w: number; h: number }[] = [];
  private buy1BtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private buy5BtnRect = { x: 0, y: 0, w: 0, h: 0 };

  private animTimer: number = 0;

  public update(deltaTime: number): void {
    if (this.isOpen) {
      this.animTimer += deltaTime * 3;
    }
  }

  public open(): void {
    this.isOpen = true;
    this.activeCategory = 'ALL';
    this.selectedItemIndex = 0;
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
   * Menangani sentuhan layar untuk navigasi kategori, pemilihan item, dan tombol beli
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

    // 2. Kategori Filter Tab
    for (const cat of this.categoryRects) {
      if (touchX >= cat.x && touchX <= cat.x + cat.w && touchY >= cat.y && touchY <= cat.y + cat.h) {
        this.activeCategory = cat.category;
        this.selectedItemIndex = 0;
        AudioEngine.playButtonClick();
        return true;
      }
    }

    // 3. Pemilihan Item Card di List Kiri
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

    // 4. Tombol Beli 1x
    const selectedItem = filtered[this.selectedItemIndex] || filtered[0];
    if (selectedItem) {
      const { x: b1x, y: b1y, w: b1w, h: b1h } = this.buy1BtnRect;
      if (touchX >= b1x && touchX <= b1x + b1w && touchY >= b1y && touchY <= b1y + b1h) {
        this.buyItem(player, selectedItem, 1, floatingText);
        return true;
      }

      // 5. Tombol Beli 5x
      const { x: b5x, y: b5y, w: b5w, h: b5h } = this.buy5BtnRect;
      if (touchX >= b5x && touchX <= b5x + b5w && touchY >= b5y && touchY <= b5y + b5h) {
        this.buyItem(player, selectedItem, 5, floatingText);
        return true;
      }
    }

    return true; // Menelan touch agar tidak bocor ke game world
  }

  /**
   * Render Modal Pasar Raya Oakhaven (2-Column Landscape, Bebas Overflow & Tumpang Tindih)
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

    // 4. Sub-banner: Ucapan Pedagang Marco & Kapasitas Tas
    const subH = 18;
    const subY = modalY + headerH + 3;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(modalX + 3, subY, modalW - 6, subH);

    ctx.font = '8.5px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const usedSlots = player.inventory.slots.filter((s) => s !== null).length;
    const bannerMsg = `🧑‍🌾 Pedagang Marco: "Barang impor terbaik!" · 🎒 Tas: ${usedSlots}/16 Slot`;
    const safeBanner = CanvasText.truncate(ctx, bannerMsg, modalW - 24);
    ctx.fillText(safeBanner, modalX + 12, subY + subH / 2);

    // 5. Category Filter Tabs Bar
    const tabY = subY + subH + 2;
    const tabH = 22;
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
      ctx.fillStyle = isActive ? '#d97706' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(tx, tabY, tabW - 4, tabH, 3);
      ctx.fill();

      ctx.strokeStyle = isActive ? '#fde047' : '#334155';
      ctx.lineWidth = isActive ? 1.5 : 0.8;
      ctx.stroke();

      ctx.font = isActive ? 'bold 8.5px sans-serif' : '8px sans-serif';
      ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.label, tx + (tabW - 4) / 2, tabY + tabH / 2);
    });

    // 6. Main 2-Column Content Area
    const contentY = tabY + tabH + 6;
    const contentH = modalH - (contentY - modalY) - 8;
    const colGap = 8;
    const col1W = Math.floor((modalW - 24) * 0.52);
    const col2W = modalW - 24 - col1W - colGap;
    const col1X = modalX + 8;
    const col2X = col1X + col1W + colGap;

    // --- KOLOM KIRI: DAFTAR ITEM (Grid 2 Kolom Kompak) ---
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

      // Render Item Icon
      const def = ITEM_DEFINITIONS[item.id];
      if (def) {
        def.renderIcon(ctx, cx + 4, cy + 4, cardH - 8);
      }

      // Name (Truncated strictly)
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : (canAfford ? '#f8fafc' : '#94a3b8');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const maxNW = cardW - (cardH - 8) - 10;
      const safeN = CanvasText.truncate(ctx, item.name, maxNW);
      ctx.fillText(safeN, cx + cardH, cy + 5);

      // Price Tag in Val
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

      // Top Detail: Icon Besar & Nama
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

      // Category & Inventory Count
      const owned = player.inventory.getItemCount(selectedItem.id);
      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      const catText = selectedItem.category === 'potion' ? 'Obat-Obatan' : (selectedItem.category === 'scroll' ? 'Gulungan Ajaib' : 'Bahan Kerajinan');
      ctx.fillText(`Kategori: ${catText}`, col2X + iconSize + 12, contentY + 22);
      ctx.fillText(`🎒 Dimiliki di Tas: ${owned} buah`, col2X + iconSize + 12, contentY + 32);

      // Divider line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(col2X + 8, contentY + 48);
      ctx.lineTo(col2X + col2W - 8, contentY + 48);
      ctx.stroke();

      // Description (Wrapped & clamped)
      const descY = contentY + 54;
      const descMaxW = col2W - 16;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8px sans-serif';
      CanvasText.drawWrappedText(ctx, selectedItem.desc, col2X + 8, descY, descMaxW, 11, 2);

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
      ctx.fillText('Harga Satuan:', col2X + 14, priceBoxY + 10);

      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'right';
      ctx.fillText(`${selectedItem.price.toLocaleString()} 𝒱`, col2X + col2W - 14, priceBoxY + 10);

      // Action Buttons (Beli 1x dan Beli 5x)
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

      // Tombol Beli 1x
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

      // Tombol Beli 5x
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

    ctx.restore();
  }
}
