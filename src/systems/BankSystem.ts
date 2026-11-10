import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export interface BankShopItem {
  id: string;
  name: string;
  category: 'potion' | 'material' | 'consumable';
  price: number; // in Val (𝒱)
  icon: string;
  desc: string;
}

export interface CoinExchangeRate {
  id: string;
  name: string;
  rate: number; // 1 Coin = X Val
  icon: string;
  color: string;
}

export class BankSystem {
  public isOpen: boolean = false;
  public activeTab: 'EXCHANGE' | 'SAVINGS' | 'SHOP' = 'EXCHANGE';

  // Exchange Rates (Anime Dungeon Ancient Coins -> Royal Val)
  public readonly exchangeRates: CoinExchangeRate[] = [
    { id: 'BRONZE_COIN', name: 'Koin Tembaga Purba', rate: 10, icon: '🪙', color: '#d97706' },
    { id: 'SILVER_COIN', name: 'Koin Perak Kuno', rate: 100, icon: '🥈', color: '#cbd5e1' },
    { id: 'GOLD_COIN', name: 'Koin Emas Abisal', rate: 1000, icon: '🥇', color: '#facc15' },
    { id: 'PLATINUM_COIN', name: 'Koin Platina Raja Purba', rate: 10000, icon: '👑', color: '#a5b4fc' }
  ];

  // Shop Catalog (Belanja Kebutuhan dengan Val)
  public readonly shopItems: BankShopItem[] = [
    { id: 'HEALTH_POTION', name: 'Ramuan Darah (HP)', category: 'potion', price: 50, icon: '🧪', desc: 'Memulihkan 50 HP seketika.' },
    { id: 'MANA_POTION', name: 'Ramuan Mana (MP)', category: 'potion', price: 60, icon: '🧪', desc: 'Memulihkan 40 MP seketika.' },
    { id: 'ELIXIR_FULL', name: 'Elixir Agung', category: 'potion', price: 250, icon: '🌟', desc: 'Memulihkan 100% HP & MP penuh.' },
    { id: 'PORTAL_SCROLL', name: 'Gulungan Teleportasi', category: 'consumable', price: 300, icon: '📜', desc: 'Kembali seketika ke Alun-Alun Serena.' },
    { id: 'DARK_IRON_ORE', name: 'Bijih Besi Gelap', category: 'material', price: 150, icon: '⛏️', desc: 'Bahan utama penempaan senjata Brokk.' },
    { id: 'MAGIC_FLOWER', name: 'Bunga Mistis Rimba', category: 'material', price: 80, icon: '🌸', desc: 'Bahan ramuan & masakan herbal.' },
    { id: 'DUNGEON_GEM', name: 'Permata Kristal Abisal', category: 'material', price: 600, icon: '💎', desc: 'Kristal energi sihir tingkat tinggi.' },
    { id: 'WOLF_MEAT', name: 'Daging Serigala Lezat', category: 'material', price: 90, icon: '🥩', desc: 'Bahan masak Steak Serigala Chef Gaston.' },
    { id: 'ANCIENT_BONE', name: 'Tulang Purba Abisal', category: 'material', price: 120, icon: '🦴', desc: 'Peninggalan fosil kuno bahan alkimia.' }
  ];

  // Saved hitboxes for touch interaction
  private closeBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private tabRects: { tab: 'EXCHANGE' | 'SAVINGS' | 'SHOP'; x: number; y: number; w: number; h: number }[] = [];
  private exchangeActionRects: { coinId: string; type: 'single' | 'all'; x: number; y: number; w: number; h: number }[] = [];
  private autoExchangeAllRect = { x: 0, y: 0, w: 0, h: 0 };
  private savingsActionRects: { type: 'deposit' | 'withdraw'; amount: number | 'all'; x: number; y: number; w: number; h: number }[] = [];
  private shopBuyRects: { item: BankShopItem; x: number; y: number; w: number; h: number }[] = [];

  private animTimer: number = 0;
  private coinSparkleTimer: number = 0;

  public update(deltaTime: number): void {
    if (this.isOpen) {
      this.animTimer += deltaTime * 3;
      this.coinSparkleTimer += deltaTime * 5;
    }
  }

  public open(): void {
    this.isOpen = true;
    this.activeTab = 'EXCHANGE';
    AudioEngine.playButtonClick();
  }

  public close(): void {
    this.isOpen = false;
    AudioEngine.playButtonClick();
  }

  /**
   * Menukar 1 jenis koin dungeon menjadi Val
   */
  public exchangeCoin(player: Player, coinId: string, count: number, floatingText?: FloatingTextManager): boolean {
    const rateDef = this.exchangeRates.find((r) => r.id === coinId);
    if (!rateDef) return false;

    const currentCount = player.inventory.getItemCount(coinId);
    const exchangeCount = Math.min(count, currentCount);

    if (exchangeCount <= 0) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Kamu tidak memiliki ${rateDef.name}!`, '#ef4444', 2.0);
      }
      return false;
    }

    const removed = player.inventory.removeItemsById(coinId, exchangeCount);
    if (removed) {
      const earnedVal = exchangeCount * rateDef.rate;
      player.addVal(earnedVal);
      AudioEngine.playLevelUp();
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 22, `💰 Ditukar: +${earnedVal.toLocaleString()} 𝒱!`, '#facc15', 3.0);
      }
      return true;
    }
    return false;
  }

  /**
   * Menukar seluruh koin dungeon yang ada di tas sekaligus
   */
  public exchangeAllCoins(player: Player, floatingText?: FloatingTextManager): number {
    let totalVal = 0;
    let anyExchanged = false;

    for (const rateDef of this.exchangeRates) {
      const currentCount = player.inventory.getItemCount(rateDef.id);
      if (currentCount > 0) {
        const removed = player.inventory.removeItemsById(rateDef.id, currentCount);
        if (removed) {
          totalVal += currentCount * rateDef.rate;
          anyExchanged = true;
        }
      }
    }

    if (anyExchanged && totalVal > 0) {
      player.addVal(totalVal);
      AudioEngine.playLevelUp();
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 25, `✨ Auto-Exchange: +${totalVal.toLocaleString()} 𝒱 Val!`, '#facc15', 3.5);
      }
    } else if (floatingText) {
      floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Tidak ada koin dungeon di tas untuk ditukar.', '#ef4444', 2.5);
    }

    return totalVal;
  }

  /**
   * Menyetor uang dari dompet ke rekening tabungan bank
   */
  public deposit(player: Player, amount: number | 'all', floatingText?: FloatingTextManager): boolean {
    const depositAmount = amount === 'all' ? player.val : amount;
    if (depositAmount <= 0) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Dompet tunai kosong!', '#ef4444', 2.0);
      return false;
    }

    if (player.val < depositAmount) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Uang tunai di dompet tidak cukup!', '#ef4444', 2.0);
      return false;
    }

    const ok = player.depositToBank(depositAmount);
    if (ok) {
      AudioEngine.playButtonClick();
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 22, `📥 Disimpan: +${depositAmount.toLocaleString()} 𝒱 ke Bank!`, '#34d399', 3.0);
      }
      return true;
    }
    return false;
  }

  /**
   * Menarik uang dari rekening tabungan ke dompet tunai
   */
  public withdraw(player: Player, amount: number | 'all', floatingText?: FloatingTextManager): boolean {
    const withdrawAmount = amount === 'all' ? player.bankSavings : amount;
    if (withdrawAmount <= 0) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Saldo tabungan kosong!', '#ef4444', 2.0);
      return false;
    }

    if (player.bankSavings < withdrawAmount) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Saldo tabungan bank tidak cukup!', '#ef4444', 2.0);
      return false;
    }

    const ok = player.withdrawFromBank(withdrawAmount);
    if (ok) {
      AudioEngine.playButtonClick();
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 22, `📤 Ditarik: ${withdrawAmount.toLocaleString()} 𝒱 ke Dompet!`, '#60a5fa', 3.0);
      }
      return true;
    }
    return false;
  }

  /**
   * Membeli barang petualang menggunakan uang Val
   */
  public buyItem(player: Player, item: BankShopItem, floatingText?: FloatingTextManager): boolean {
    if (player.val < item.price) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Uang tunai kurang! Butuh ${item.price.toLocaleString()} 𝒱.`, '#ef4444', 2.5);
      }
      return false;
    }

    const def = ITEM_DEFINITIONS[item.id];
    if (!def) return false;

    const added = player.inventory.addItem(item.id, 1);
    if (!added) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Tas inventaris penuh!', '#ef4444', 2.0);
      }
      return false;
    }

    player.removeVal(item.price);
    AudioEngine.playButtonClick();
    if (floatingText) {
      floatingText.spawn(player.x + 10, player.y - 22, `🛒 Membeli ${item.name} (-${item.price.toLocaleString()} 𝒱)!`, '#4ade80', 2.8);
    }
    return true;
  }

  /**
   * Menangani input sentuhan/klik pada Modal Bank
   */
  public handleTouch(
    touchX: number,
    touchY: number,
    player: Player,
    floatingText?: FloatingTextManager
  ): boolean {
    if (!this.isOpen) return false;

    // 1. Tombol Tutup [X]
    if (
      touchX >= this.closeBtnRect.x &&
      touchX <= this.closeBtnRect.x + this.closeBtnRect.w &&
      touchY >= this.closeBtnRect.y &&
      touchY <= this.closeBtnRect.y + this.closeBtnRect.h
    ) {
      this.close();
      return true;
    }

    // 2. Tab Navigation Buttons
    for (const tabBtn of this.tabRects) {
      if (
        touchX >= tabBtn.x &&
        touchX <= tabBtn.x + tabBtn.w &&
        touchY >= tabBtn.y &&
        touchY <= tabBtn.y + tabBtn.h
      ) {
        this.activeTab = tabBtn.tab;
        AudioEngine.playButtonClick();
        return true;
      }
    }

    // 3. Tab: EXCHANGE Handlers
    if (this.activeTab === 'EXCHANGE') {
      // Auto-Exchange All
      if (
        touchX >= this.autoExchangeAllRect.x &&
        touchX <= this.autoExchangeAllRect.x + this.autoExchangeAllRect.w &&
        touchY >= this.autoExchangeAllRect.y &&
        touchY <= this.autoExchangeAllRect.y + this.autoExchangeAllRect.h
      ) {
        this.exchangeAllCoins(player, floatingText);
        return true;
      }

      // Single Coin Actions
      for (const act of this.exchangeActionRects) {
        if (
          touchX >= act.x &&
          touchX <= act.x + act.w &&
          touchY >= act.y &&
          touchY <= act.y + act.h
        ) {
          const count = act.type === 'single' ? 1 : 10;
          this.exchangeCoin(player, act.coinId, count, floatingText);
          return true;
        }
      }
    }

    // 4. Tab: SAVINGS Handlers
    if (this.activeTab === 'SAVINGS') {
      for (const act of this.savingsActionRects) {
        if (
          touchX >= act.x &&
          touchX <= act.x + act.w &&
          touchY >= act.y &&
          touchY <= act.y + act.h
        ) {
          if (act.type === 'deposit') {
            this.deposit(player, act.amount, floatingText);
          } else {
            this.withdraw(player, act.amount, floatingText);
          }
          return true;
        }
      }
    }

    // 5. Tab: SHOP Handlers
    if (this.activeTab === 'SHOP') {
      for (const buyAct of this.shopBuyRects) {
        if (
          touchX >= buyAct.x &&
          touchX <= buyAct.x + buyAct.w &&
          touchY >= buyAct.y &&
          touchY <= buyAct.y + buyAct.h
        ) {
          this.buyItem(player, buyAct.item, floatingText);
          return true;
        }
      }
    }

    return true; // Modal is consuming touch events
  }

  /**
   * Render RPG Bank Modal di layar
   */
  public renderModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    player: Player
  ): void {
    if (!this.isOpen) return;

    ctx.save();

    // Reset touch hitboxes
    this.tabRects = [];
    this.exchangeActionRects = [];
    this.savingsActionRects = [];
    this.shopBuyRects = [];

    // Responsive dimensions
    const modalWidth = Math.min(500, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Backdrop shadow wash
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Modal Background (Royal Gold & Dark Obsidian)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 10);
    ctx.fill();

    // Royal Gold Frame
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Outer subtle glow
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.lineWidth = 4.0;
    ctx.stroke();

    // --- 1. MODAL HEADER ---
    const headerH = 46;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(modalX + 2, modalY + 2, modalWidth - 4, headerH, [8, 8, 0, 0]);
    ctx.fill();

    // Header Title & Icon
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🏛️ BANK KERAJAAN OAKHAVEN', modalX + 14, modalY + 9);

    ctx.font = 'italic 8px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('~ Layanan Pertukaran Koin Purba, Rekening Tabungan & Toko Val ~', modalX + 14, modalY + 26);

    // Close Button [X]
    const cbSize = 24;
    const cbX = modalX + modalWidth - cbSize - 10;
    const cbY = modalY + 10;
    this.closeBtnRect = { x: cbX, y: cbY, w: cbSize, h: cbSize };

    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.roundRect(cbX, cbY, cbSize, cbSize, 5);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', cbX + cbSize / 2, cbY + cbSize / 2);

    // --- 2. PLAYER CURRENCY BANNER (DOMPET & TABUNGAN) ---
    const bannerY = modalY + headerH + 6;
    const bannerH = 24;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(modalX + 10, bannerY, modalWidth - 20, bannerH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dompet Tunai
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`👛 Dompet: ${player.val.toLocaleString()} 𝒱`, modalX + 18, bannerY + bannerH / 2);

    // Tabungan Bank
    ctx.fillStyle = '#34d399';
    ctx.fillText(`💳 Tabungan Bank: ${player.bankSavings.toLocaleString()} 𝒱`, modalX + 180, bannerY + bannerH / 2);

    // Tingkat Nasabah
    let rankTag = '🔰 Nasabah Perunggu';
    let rankColor = '#f59e0b';
    if (player.bankSavings >= 50000) {
      rankTag = '👑 Bangsawan Royal';
      rankColor = '#a855f7';
    } else if (player.bankSavings >= 10000) {
      rankTag = '🏆 Nasabah Emas VIP';
      rankColor = '#facc15';
    } else if (player.bankSavings >= 2500) {
      rankTag = '🥈 Nasabah Perak';
      rankColor = '#cbd5e1';
    }
    ctx.fillStyle = rankColor;
    ctx.textAlign = 'right';
    ctx.fillText(rankTag, modalX + modalWidth - 18, bannerY + bannerH / 2);

    // --- 3. TAB NAVIGATION (3 TABS) ---
    const tabY = bannerY + bannerH + 6;
    const tabH = 22;
    const tabs: { id: 'EXCHANGE' | 'SAVINGS' | 'SHOP'; label: string }[] = [
      { id: 'EXCHANGE', label: '🪙 Penukaran Koin' },
      { id: 'SAVINGS', label: '💳 Tabungan & Bunga' },
      { id: 'SHOP', label: '🛒 Belanja Kebutuhan' }
    ];

    const tabW = (modalWidth - 20) / tabs.length;
    tabs.forEach((tab, idx) => {
      const tx = modalX + 10 + idx * tabW;
      const isActive = this.activeTab === tab.id;
      this.tabRects.push({ tab: tab.id, x: tx, y: tabY, w: tabW - 4, h: tabH });

      ctx.fillStyle = isActive ? '#1e293b' : 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.roundRect(tx, tabY, tabW - 4, tabH, 4);
      ctx.fill();

      ctx.strokeStyle = isActive ? '#facc15' : '#334155';
      ctx.lineWidth = isActive ? 1.4 : 1;
      ctx.stroke();

      ctx.font = isActive ? 'bold 9px sans-serif' : '8.5px sans-serif';
      ctx.fillStyle = isActive ? '#fef08a' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tx + (tabW - 4) / 2, tabY + tabH / 2);
    });

    // --- 4. TAB CONTENTS ---
    const contentY = tabY + tabH + 8;
    const contentH = modalY + modalHeight - contentY - 8;

    if (this.activeTab === 'EXCHANGE') {
      this.renderExchangeTab(ctx, modalX + 10, contentY, modalWidth - 20, contentH, player);
    } else if (this.activeTab === 'SAVINGS') {
      this.renderSavingsTab(ctx, modalX + 10, contentY, modalWidth - 20, contentH, player);
    } else if (this.activeTab === 'SHOP') {
      this.renderShopTab(ctx, modalX + 10, contentY, modalWidth - 20, contentH, player);
    }

    ctx.restore();
  }

  /**
   * Render Tab 1: Penukaran Koin Dungeon ke Val
   */
  private renderExchangeTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    player: Player
  ): void {
    // Info sub-banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(x, y, w, 16);
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡 Koin kuno hasil jarahan monster & peti dungeon dapat ditukar ke mata uang Val di sini.', x + 8, y + 8);

    // Tombol Auto-Exchange All Koin
    const btnW = 150;
    const btnH = 20;
    const btnX = x + w - btnW - 4;
    const btnY = y + 20;
    this.autoExchangeAllRect = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 4);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Tukar Semua Koin (Auto)', btnX + btnW / 2, btnY + btnH / 2);

    // List 4 Koin Dungeon
    const startY = y + 44;
    const rowH = (h - 48) / 4;

    this.exchangeRates.forEach((rateDef, idx) => {
      const ry = startY + idx * rowH;
      const count = player.inventory.getItemCount(rateDef.id);

      // Row background
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.roundRect(x, ry, w, rowH - 3, 4);
      ctx.fill();

      // Coin Icon & Name
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rateDef.icon, x + 8, ry + (rowH - 3) / 2);

      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = rateDef.color;
      ctx.fillText(rateDef.name, x + 28, ry + (rowH - 3) / 2 - 4);

      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Kurs: 1 = ${rateDef.rate.toLocaleString()} 𝒱  |  Punya: ${count} keping`, x + 28, ry + (rowH - 3) / 2 + 5);

      // Tombol Tukar 1
      const t1W = 54;
      const tH = 15;
      const t1X = x + w - 124;
      const tY = ry + (rowH - 3 - tH) / 2;
      this.exchangeActionRects.push({ coinId: rateDef.id, type: 'single', x: t1X, y: tY, w: t1W, h: tH });

      ctx.fillStyle = count > 0 ? '#1e3a8a' : '#334155';
      ctx.beginPath();
      ctx.roundRect(t1X, tY, t1W, tH, 3);
      ctx.fill();
      ctx.strokeStyle = count > 0 ? '#38bdf8' : '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillStyle = count > 0 ? '#e0f2fe' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tukar 1', t1X + t1W / 2, tY + tH / 2);

      // Tombol Tukar 10
      const t2W = 58;
      const t2X = x + w - 64;
      this.exchangeActionRects.push({ coinId: rateDef.id, type: 'all', x: t2X, y: tY, w: t2W, h: tH });

      ctx.fillStyle = count >= 10 ? '#065f46' : (count > 0 ? '#047857' : '#334155');
      ctx.beginPath();
      ctx.roundRect(t2X, tY, t2W, tH, 3);
      ctx.fill();
      ctx.strokeStyle = count > 0 ? '#4ade80' : '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.fillStyle = count > 0 ? '#dcfce7' : '#94a3b8';
      ctx.fillText('Tukar 10', t2X + t2W / 2, tY + tH / 2);
    });
  }

  /**
   * Render Tab 2: Tabungan & Bunga Bank
   */
  private renderSavingsTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    player: Player
  ): void {
    // 2 Panel: Kiri = Setor (Deposit), Kanan = Tarik (Withdraw)
    const panelW = (w - 10) / 2;
    const panelH = h;

    // Panel 1: Setor Uang (Deposit)
    const p1X = x;
    ctx.fillStyle = 'rgba(6, 95, 70, 0.2)';
    ctx.beginPath();
    ctx.roundRect(p1X, y, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('📥 SETOR TABUNGAN (DEPOSIT)', p1X + panelW / 2, y + 8);

    ctx.font = '7.5px sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('Uang di tabungan aman 100% dari kematian di dungeon!', p1X + panelW / 2, y + 22);

    const depButtons: { label: string; amount: number | 'all' }[] = [
      { label: 'Setor 100 𝒱', amount: 100 },
      { label: 'Setor 500 𝒱', amount: 500 },
      { label: 'Setor 2.500 𝒱', amount: 2500 },
      { label: 'Setor Semua Uang Tunai', amount: 'all' }
    ];

    depButtons.forEach((btn, idx) => {
      const by = y + 38 + idx * 24;
      const bw = panelW - 20;
      const bx = p1X + 10;
      this.savingsActionRects.push({ type: 'deposit', amount: btn.amount, x: bx, y: by, w: bw, h: 20 });

      const canAfford = btn.amount === 'all' ? player.val > 0 : player.val >= btn.amount;
      ctx.fillStyle = canAfford ? '#047857' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = canAfford ? '#34d399' : '#334155';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = canAfford ? '#ffffff' : '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, bx + bw / 2, by + 10);
    });

    // Panel 2: Tarik Uang (Withdraw)
    const p2X = x + panelW + 10;
    ctx.fillStyle = 'rgba(30, 58, 138, 0.2)';
    ctx.beginPath();
    ctx.roundRect(p2X, y, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('📤 TARIK TABUNGAN (WITHDRAW)', p2X + panelW / 2, y + 8);

    ctx.font = '7.5px sans-serif';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText('Tarik uang ke dompet untuk belanja keperluan.', p2X + panelW / 2, y + 22);

    const withButtons: { label: string; amount: number | 'all' }[] = [
      { label: 'Tarik 100 𝒱', amount: 100 },
      { label: 'Tarik 500 𝒱', amount: 500 },
      { label: 'Tarik 2.500 𝒱', amount: 2500 },
      { label: 'Tarik Semua Tabungan', amount: 'all' }
    ];

    withButtons.forEach((btn, idx) => {
      const by = y + 38 + idx * 24;
      const bw = panelW - 20;
      const bx = p2X + 10;
      this.savingsActionRects.push({ type: 'withdraw', amount: btn.amount, x: bx, y: by, w: bw, h: 20 });

      const canWithdraw = btn.amount === 'all' ? player.bankSavings > 0 : player.bankSavings >= btn.amount;
      ctx.fillStyle = canWithdraw ? '#1d4ed8' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = canWithdraw ? '#60a5fa' : '#334155';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = canWithdraw ? '#ffffff' : '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, bx + bw / 2, by + 10);
    });
  }

  /**
   * Render Tab 3: Toko Kebutuhan Petualang (Shopping with Val)
   */
  private renderShopTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    player: Player
  ): void {
    // Info sub-banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(x, y, w, 15);
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛒 Beli berbagai perbekalan dungeon dengan mata uang resmi Val.', x + 8, y + 7.5);

    // Grid 3 kolom item
    const gridCols = 3;
    const gridRows = 3;
    const startY = y + 19;
    const cellW = (w - 8) / gridCols;
    const cellH = (h - 22) / gridRows;

    this.shopItems.forEach((item, idx) => {
      if (idx >= 9) return;
      const c = idx % gridCols;
      const r = Math.floor(idx / gridCols);
      const cx = x + c * cellW;
      const cy = startY + r * cellH;

      // Card Background
      const canAfford = player.val >= item.price;
      ctx.fillStyle = canAfford ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.roundRect(cx + 2, cy + 2, cellW - 4, cellH - 4, 4);
      ctx.fill();

      ctx.strokeStyle = canAfford ? '#facc15' : '#334155';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Icon & Name
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.icon, cx + 6, cy + 5);

      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillStyle = '#ffffff';
      const safeName = CanvasText.truncate(ctx, item.name, cellW - 55);
      ctx.fillText(safeName, cx + 22, cy + 6);

      // Price Tag
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`${item.price.toLocaleString()} 𝒱`, cx + 22, cy + 16);

      // Tombol Beli [Beli]
      const btnW = 34;
      const btnH = 14;
      const bx = cx + cellW - btnW - 6;
      const by = cy + (cellH - 4 - btnH) / 2 + 1;
      this.shopBuyRects.push({ item, x: bx, y: by, w: btnW, h: btnH });

      ctx.fillStyle = canAfford ? '#15803d' : '#334155';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 3);
      ctx.fill();
      ctx.strokeStyle = canAfford ? '#4ade80' : '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = canAfford ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Beli', bx + btnW / 2, by + btnH / 2);
    });
  }
}
