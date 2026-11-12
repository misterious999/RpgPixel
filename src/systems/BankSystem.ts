import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CanvasText } from '../utils/CanvasText.ts';

export interface CoinExchangeRate {
  id: string;
  name: string;
  rate: number; // 1 Coin = X Val
  icon: string;
  color: string;
}

export class BankSystem {
  public isOpen: boolean = false;
  public activeTab: 'EXCHANGE' | 'SAVINGS' = 'EXCHANGE';

  // Exchange Rates (Anime Dungeon Ancient Coins -> Royal Val)
  public readonly exchangeRates: CoinExchangeRate[] = [
    { id: 'BRONZE_COIN', name: 'Koin Tembaga Purba', rate: 5, icon: '🪙', color: '#d97706' },
    { id: 'SILVER_COIN', name: 'Koin Perak Kuno', rate: 25, icon: '🥈', color: '#cbd5e1' },
    { id: 'GOLD_COIN', name: 'Koin Emas Abisal', rate: 100, icon: '🥇', color: '#facc15' },
    { id: 'PLATINUM_COIN', name: 'Koin Platina Raja Purba', rate: 500, icon: '👑', color: '#a5b4fc' }
  ];

  // Saved hitboxes for touch interaction
  private closeBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private tabRects: { tab: 'EXCHANGE' | 'SAVINGS'; x: number; y: number; w: number; h: number }[] = [];
  private exchangeActionRects: { coinId: string; type: 'single' | 'all'; x: number; y: number; w: number; h: number }[] = [];
  private autoExchangeAllRect = { x: 0, y: 0, w: 0, h: 0 };
  private savingsActionRects: { type: 'deposit' | 'withdraw'; amount: number | 'all'; x: number; y: number; w: number; h: number }[] = [];

  private animTimer: number = 0;
  private coinSparkleTimer: number = 0;
  private openTime: number = 0;
  private modalRect = { x: 0, y: 0, w: 0, h: 0 };

  public update(deltaTime: number): void {
    if (this.isOpen) {
      this.animTimer += deltaTime * 3;
      this.coinSparkleTimer += deltaTime * 5;
    }
  }

  public open(): void {
    this.isOpen = true;
    this.openTime = Date.now();
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
        floatingText.spawn(
          player.x + 10,
          player.y - 22,
          `💱 Ditukar: ${exchangeCount}x ${rateDef.name} -> +${earnedVal.toLocaleString()} 𝒱!`,
          '#facc15',
          2.8
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Menukar semua koin kuno yang ada di inventaris secara instan
   */
  public exchangeAllCoins(player: Player, floatingText?: FloatingTextManager): number {
    let totalValEarned = 0;
    let totalCoinsExchanged = 0;

    for (const rateDef of this.exchangeRates) {
      const count = player.inventory.getItemCount(rateDef.id);
      if (count > 0) {
        const removed = player.inventory.removeItemsById(rateDef.id, count);
        if (removed) {
          totalValEarned += count * rateDef.rate;
          totalCoinsExchanged += count;
        }
      }
    }

    if (totalValEarned > 0) {
      player.addVal(totalValEarned);
      AudioEngine.playLevelUp();
      if (floatingText) {
        floatingText.spawn(
          player.x + 10,
          player.y - 24,
          `✨ Ditukar ${totalCoinsExchanged} Koin Dungeon -> +${totalValEarned.toLocaleString()} 𝒱!`,
          '#facc15',
          3.2
        );
      }
      return totalValEarned;
    } else {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Tidak ada koin purba di tas untuk ditukar!', '#f87171', 2.0);
      }
      return 0;
    }
  }

  /**
   * Setor Val ke Tabungan Bank
   */
  public deposit(player: Player, amount: number | 'all', floatingText?: FloatingTextManager): boolean {
    const depositAmount = amount === 'all' ? player.val : Math.min(amount, player.val);

    if (depositAmount <= 0) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Dompet tunai kosong!', '#ef4444', 2.0);
      return false;
    }

    if (player.val < depositAmount) {
      if (floatingText) floatingText.spawn(player.x + 10, player.y - 18, '⚠️ Uang tunai tidak cukup!', '#ef4444', 2.0);
      return false;
    }

    const ok = player.depositToBank(depositAmount);
    if (ok) {
      AudioEngine.playItemPickup(true);
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 22, `📥 Disetor: ${depositAmount.toLocaleString()} 𝒱 ke Bank!`, '#34d399', 3.0);
      }
      return true;
    }
    return false;
  }

  /**
   * Tarik Val dari Tabungan Bank ke Dompet
   */
  public withdraw(player: Player, amount: number | 'all', floatingText?: FloatingTextManager): boolean {
    const withdrawAmount = amount === 'all' ? player.bankSavings : Math.min(amount, player.bankSavings);

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
      AudioEngine.playItemPickup(true);
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 22, `📤 Ditarik: ${withdrawAmount.toLocaleString()} 𝒱 ke Dompet!`, '#60a5fa', 3.0);
      }
      return true;
    }
    return false;
  }

  /**
   * Menangani input sentuhan/klik pada modal
   */
  public handleTouch(
    touchX: number,
    touchY: number,
    player: Player,
    floatingText?: FloatingTextManager
  ): boolean {
    if (!this.isOpen) return false;

    // Debounce sentuhan awal saat modal baru dibuka
    if (Date.now() - this.openTime < 180) {
      return true;
    }

    // Sentuhan di luar modal menutup jendela bank
    const { x: mx, y: my, w: mw, h: mh } = this.modalRect;
    if (mw > 0 && mh > 0 && (touchX < mx || touchX > mx + mw || touchY < my || touchY > my + mh)) {
      this.close();
      return true;
    }

    // 1. Close Button
    const { x: cx, y: cy, w: cw, h: ch } = this.closeBtnRect;
    if (touchX >= cx && touchX <= cx + cw && touchY >= cy && touchY <= cy + ch) {
      this.close();
      return true;
    }

    // 2. Tab Navigation
    for (const tab of this.tabRects) {
      if (touchX >= tab.x && touchX <= tab.x + tab.w && touchY >= tab.y && touchY <= tab.y + tab.h) {
        this.activeTab = tab.tab;
        AudioEngine.playButtonClick();
        return true;
      }
    }

    // 3. Tab: EXCHANGE Handlers
    if (this.activeTab === 'EXCHANGE') {
      // Auto Exchange All
      const { x: ax, y: ay, w: aw, h: ah } = this.autoExchangeAllRect;
      if (touchX >= ax && touchX <= ax + aw && touchY >= ay && touchY <= ay + ah) {
        this.exchangeAllCoins(player, floatingText);
        return true;
      }

      // Individual Coin Exchange Buttons
      for (const act of this.exchangeActionRects) {
        if (touchX >= act.x && touchX <= act.x + act.w && touchY >= act.y && touchY <= act.y + act.h) {
          if (act.type === 'single') {
            this.exchangeCoin(player, act.coinId, 1, floatingText);
          } else {
            this.exchangeCoin(player, act.coinId, 10, floatingText);
          }
          return true;
        }
      }
    }

    // 4. Tab: SAVINGS Handlers
    if (this.activeTab === 'SAVINGS') {
      for (const act of this.savingsActionRects) {
        if (touchX >= act.x && touchX <= act.x + act.w && touchY >= act.y && touchY <= act.y + act.h) {
          if (act.type === 'deposit') {
            this.deposit(player, act.amount, floatingText);
          } else {
            this.withdraw(player, act.amount, floatingText);
          }
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

    // Responsive dimensions
    const modalWidth = Math.min(500, screenWidth - 20);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;
    this.modalRect = { x: modalX, y: modalY, w: modalWidth, h: modalHeight };

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

    ctx.font = 'italic 8.5px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('~ Layanan Penukaran Koin Purba & Rekening Tabungan Bunga Resmi ~', modalX + 14, modalY + 26);

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

    // Responsive 3-segment player currency banner
    const col1X = modalX + 16;
    const col2X = modalX + Math.floor(modalWidth * 0.36);
    const col3X = modalX + modalWidth - 16;

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

    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const safeWallet = CanvasText.truncate(ctx, `👛 Dompet: ${player.val.toLocaleString()} 𝒱`, modalWidth * 0.32);
    ctx.fillText(safeWallet, col1X, bannerY + bannerH / 2);

    ctx.fillStyle = '#34d399';
    const safeSavings = CanvasText.truncate(ctx, `💳 Tabungan: ${player.bankSavings.toLocaleString()} 𝒱`, modalWidth * 0.32);
    ctx.fillText(safeSavings, col2X, bannerY + bannerH / 2);

    ctx.fillStyle = rankColor;
    ctx.textAlign = 'right';
    const safeRank = CanvasText.truncate(ctx, rankTag, modalWidth * 0.28);
    ctx.fillText(safeRank, col3X, bannerY + bannerH / 2);

    // --- 3. TAB NAVIGATION (2 TABS: EXCHANGE & SAVINGS) ---
    const tabY = bannerY + bannerH + 6;
    const tabH = 24;
    const tabs: { id: 'EXCHANGE' | 'SAVINGS'; label: string }[] = [
      { id: 'EXCHANGE', label: '🪙 Penukaran Koin Purba' },
      { id: 'SAVINGS', label: '💳 Tabungan & Bunga Harian (+1%)' }
    ];

    const tabGap = 6;
    const tabW = Math.floor((modalWidth - 20 - tabGap * (tabs.length - 1)) / tabs.length);
    tabs.forEach((tab, idx) => {
      const tx = modalX + 10 + idx * (tabW + tabGap);
      const isActive = this.activeTab === tab.id;
      this.tabRects.push({ tab: tab.id, x: tx, y: tabY, w: tabW, h: tabH });

      ctx.fillStyle = isActive ? '#1e293b' : 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.roundRect(tx, tabY, tabW, tabH, 4);
      ctx.fill();

      ctx.strokeStyle = isActive ? '#facc15' : '#334155';
      ctx.lineWidth = isActive ? 1.6 : 1;
      ctx.stroke();

      ctx.font = isActive ? 'bold 9.5px sans-serif' : '9px sans-serif';
      ctx.fillStyle = isActive ? '#fef08a' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tx + tabW / 2, tabY + tabH / 2);
    });

    // --- 4. TAB CONTENTS ---
    const contentY = tabY + tabH + 8;
    const contentH = modalY + modalHeight - contentY - 8;

    if (this.activeTab === 'EXCHANGE') {
      this.renderExchangeTab(ctx, modalX + 10, contentY, modalWidth - 20, contentH, player);
    } else if (this.activeTab === 'SAVINGS') {
      this.renderSavingsTab(ctx, modalX + 10, contentY, modalWidth - 20, contentH, player);
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
    ctx.fillText('💡 Koin kuno jarahan monster & peti dungeon ditukar ke mata uang Val resmi di sini.', x + 8, y + 8);

    // Tombol Auto-Exchange All Koin
    const btnW = 160;
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
      const maxTextW = w - 156;
      const safeName = CanvasText.truncate(ctx, rateDef.name, maxTextW);
      ctx.fillText(safeName, x + 28, ry + (rowH - 3) / 2 - 4);

      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      const safeInfo = CanvasText.truncate(ctx, `Kurs: 1 = ${rateDef.rate.toLocaleString()} 𝒱 | Punya: ${count} bh`, maxTextW);
      ctx.fillText(safeInfo, x + 28, ry + (rowH - 3) / 2 + 5);

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
    ctx.fillText('Tarik uang ke dompet untuk belanja di Pasar Oakhaven.', p2X + panelW / 2, y + 22);

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
}
