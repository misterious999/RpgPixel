import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';
import { Pet, PetType, PET_DATA } from './TamingSystem.ts';

export type MarketShopId = 'GENERAL' | 'FOOD' | 'PET' | 'ARCANE' | 'ARMORY';

export interface MarketItem {
  id: string;
  name: string;
  category: 'potion' | 'scroll' | 'material';
  price: number; // in Val (𝒱)
  desc: string;
}

export const SHOP_CATALOGS: Record<Exclude<MarketShopId, 'PET'>, MarketItem[]> = {
  GENERAL: [
    { id: 'HEALTH_POTION', name: 'Ramuan Darah (HP)', category: 'potion', price: 40, desc: 'Memulihkan 35 HP seketika saat darurat tempur.' },
    { id: 'MANA_POTION', name: 'Ramuan Tenaga Sihir (MP)', category: 'potion', price: 50, desc: 'Memulihkan 25 MP untuk sihir & keahlian peran.' },
    { id: 'ELIXIR_FULL', name: 'Elixir Agung Kerajaan', category: 'potion', price: 250, desc: 'Ramuan legendaris pemulih 100% HP & MP penuh.' },
    { id: 'PORTAL_SCROLL', name: 'Gulungan Teleportasi Desa', category: 'scroll', price: 300, desc: 'Mantra teleportasi instan kembali ke alun-alun desa.' },
    { id: 'DUNGEON_GEM', name: 'Permata Kristal Abisal', category: 'scroll', price: 500, desc: 'Kristal mineral bersinar sarat energi magis murni.' },
    { id: 'WOOD_LOG', name: 'Kayu Rimba Pilihan', category: 'material', price: 35, desc: 'Kayu padat untuk bahan baku busur panah & kuali masak.' },
    { id: 'DARK_IRON_ORE', name: 'Bijih Besi Gelap', category: 'material', price: 120, desc: 'Bijih tambang utama penempaan senjata Master Brokk.' }
  ],
  FOOD: [
    { id: 'WOLF_STEAK', name: 'Steak Serigala Rimba', category: 'material', price: 160, desc: 'Steak lezat gurih beraroma harum. Memulihkan 60 HP & +20% Serangan.' },
    { id: 'SLIME_PUDDING', name: 'Puding Kristal Slime', category: 'material', price: 140, desc: 'Puding manis kenyal berkilau. Memulihkan 50 MP & pesat regenerasi mana.' },
    { id: 'MYSTIC_SOUP', name: 'Sup Bunga Mistis', category: 'material', price: 220, desc: 'Sup herbal ajaib hangat. Memberi buff +25% Kecepatan & +25% Bonus EXP.' },
    { id: 'HEALTH_POTION', name: 'Sari Jus Buah Rimba', category: 'potion', price: 40, desc: 'Minuman buah segar manis pemulih vitalitas 35 HP.' },
    { id: 'MANA_POTION', name: 'Madu Rimba Alami', category: 'potion', price: 50, desc: 'Madu murni manis menyegarkan pikiran dan memulihkan 25 MP.' },
    { id: 'WOLF_MEAT', name: 'Daging Serigala Segar', category: 'material', price: 75, desc: 'Bahan mentah daging berotot untuk dimasak di perkemahan.' }
  ],
  ARCANE: [
    { id: 'PORTAL_SCROLL', name: 'Gulungan Teleportasi Desa', category: 'scroll', price: 300, desc: 'Mantra teleportasi instan kembali ke alun-alun desa.' },
    { id: 'DUNGEON_GEM', name: 'Permata Kristal Abisal', category: 'scroll', price: 500, desc: 'Kristal mineral bersinar sarat energi magis murni.' },
    { id: 'ELIXIR_FULL', name: 'Elixir Agung Kerajaan', category: 'potion', price: 250, desc: 'Ramuan legendaris pemulih 100% HP & MP penuh.' },
    { id: 'MANA_POTION', name: 'Ramuan Tenaga Sihir (MP)', category: 'potion', price: 50, desc: 'Memulihkan 25 MP untuk sihir & keahlian peran.' },
    { id: 'MAGIC_FLOWER', name: 'Bunga Mistis Rimba', category: 'material', price: 60, desc: 'Kelopak bunga magis untuk sup herbal dan ritual arkana.' },
    { id: 'ANCIENT_BONE', name: 'Tulang Purba Abisal', category: 'material', price: 100, desc: 'Fosil purba langka untuk alkimia dan material tempa.' }
  ],
  ARMORY: [
    { id: 'DARK_IRON_ORE', name: 'Bijih Besi Gelap', category: 'material', price: 120, desc: 'Bijih tambang utama penempaan senjata Master Brokk.' },
    { id: 'WOOD_LOG', name: 'Kayu Rimba Pilihan', category: 'material', price: 35, desc: 'Kayu padat untuk bahan baku busur panah & kuali masak.' },
    { id: 'ANCIENT_BONE', name: 'Tulang Purba Abisal', category: 'material', price: 100, desc: 'Fosil purba langka untuk material tempa zirah.' },
    { id: 'HEALTH_POTION', name: 'Ramuan Darah Tempur', category: 'potion', price: 40, desc: 'Pasokan darurat pemulih 35 HP di medan tempur sengit.' },
    { id: 'DUNGEON_GEM', name: 'Permata Kristal Pengasah', category: 'scroll', price: 500, desc: 'Kristal keras untuk mengasah ketajaman mata pedang.' }
  ]
};

export const SHOP_METADATA: Record<
  MarketShopId,
  { name: string; merchant: string; subtitle: string; icon: string; accentColor: string; bannerColor: string }
> = {
  GENERAL: {
    name: 'TOKO SERBA ADA SAUDAGAR MARCO',
    merchant: 'Saudagar Marco',
    subtitle: '~ Pusat Perbekalan Petualang & Jual Beli Segala Barang ~',
    icon: '🛒',
    accentColor: '#facc15',
    bannerColor: '#78350f'
  },
  FOOD: {
    name: 'KEDAI KULINER CHEF GASTON',
    merchant: 'Chef Gaston',
    subtitle: '~ Masakan Penguat Fisik, Ransum Petualang & Bahan Segar ~',
    icon: '🍲',
    accentColor: '#fb923c',
    bannerColor: '#9a3412'
  },
  PET: {
    name: 'SUAKA & TOKO HEWAN PENJINAK MIA',
    merchant: 'Penjinak Mia',
    subtitle: '~ Adopsi Pet Auto-Loot, Jual/Titip Peliharaan & Camilan ~',
    icon: '🐾',
    accentColor: '#34d399',
    bannerColor: '#065f46'
  },
  ARCANE: {
    name: 'PAVILIUN ARKANA SORCERESS LUNA',
    merchant: 'Sorceress Luna',
    subtitle: '~ Gulungan Mantra Kuno, Jimat Arkana & Kristal Mistis ~',
    icon: '🔮',
    accentColor: '#c084fc',
    bannerColor: '#581c87'
  },
  ARMORY: {
    name: 'KIOS PERSENJATAAN GARETH',
    merchant: 'Pengrajin Gareth',
    subtitle: '~ Persenjataan, Logam Tempa & Perkakas Ekspedisi ~',
    icon: '⚔️',
    accentColor: '#94a3b8',
    bannerColor: '#334155'
  }
};

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
  public activeShopId: MarketShopId = 'GENERAL';
  public activeMode: 'BUY' | 'SELL' | 'PET_STATUS' = 'BUY';
  public activeCategory: 'ALL' | 'POTION' | 'SCROLL' | 'MATERIAL' = 'ALL';
  public selectedItemIndex: number = 0;
  public selectedSellIndex: number = 0;
  public selectedPetType: PetType = 'SLIME_PET';
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

  // Pet Shop hitboxes
  private petCardsRects: { type: PetType; x: number; y: number; w: number; h: number }[] = [];
  private petAdoptBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private petSellBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private petReleaseBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  private animTimer: number = 0;

  public update(deltaTime: number): void {
    if (this.isOpen) {
      this.animTimer += deltaTime * 3;
    }
  }

  public open(shopId: MarketShopId = 'GENERAL'): void {
    this.isOpen = true;
    this.activeShopId = shopId;
    this.activeMode = 'BUY';
    this.activeCategory = 'ALL';
    this.selectedItemIndex = 0;
    this.selectedSellIndex = 0;
    this.selectedPetType = 'SLIME_PET';
    AudioEngine.playButtonClick();
  }

  public close(): void {
    this.isOpen = false;
    AudioEngine.playButtonClick();
  }

  public getItemsForCurrentShop(): MarketItem[] {
    if (this.activeShopId === 'PET') return [];
    return SHOP_CATALOGS[this.activeShopId] || SHOP_CATALOGS.GENERAL;
  }

  public getFilteredItems(): MarketItem[] {
    const list = this.getItemsForCurrentShop();
    if (this.activeCategory === 'ALL') return list;
    if (this.activeCategory === 'POTION') return list.filter((i) => i.category === 'potion');
    if (this.activeCategory === 'SCROLL') return list.filter((i) => i.category === 'scroll');
    return list.filter((i) => i.category === 'material');
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
   * Pembelian barang dari toko menggunakan Val (𝒱)
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

    const ok = player.inventory.removeItem(slotIndex, toSell);
    if (!ok) return false;

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
   * Adopsi Pet Baru di Toko Peliharaan Mia
   */
  public adoptPet(
    type: PetType,
    player: Player,
    currentPet: Pet | null,
    floatingText?: FloatingTextManager,
    onAdopt?: (type: PetType) => void
  ): boolean {
    if (currentPet) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Kamu sudah ditemani oleh ${currentPet.name}! Titipkan atau lepas terlebih dahulu.`, '#f87171', 2.8);
      }
      AudioEngine.playPlayerHurt();
      return false;
    }

    const info = PET_DATA[type];
    if (player.val < info.costVal) {
      if (floatingText) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Val tidak cukup! Butuh ${info.costVal.toLocaleString()} 𝒱`, '#f87171', 2.2);
      }
      AudioEngine.playPlayerHurt();
      return false;
    }

    player.removeVal(info.costVal);
    AudioEngine.playItemPickup(true);
    onAdopt?.(type);

    if (floatingText) {
      floatingText.spawn(player.x + 10, player.y - 22, `🐾 Berhasil mengadopsi ${info.name} (${info.species})!`, '#4ade80', 3.0);
    }
    return true;
  }

  /**
   * Menjual / Menitipkan kembali Pet ke Suaka Satwa Mia (Mendapatkan 50% Val)
   */
  public sellPet(
    player: Player,
    currentPet: Pet | null,
    floatingText?: FloatingTextManager,
    onDismiss?: () => void
  ): boolean {
    if (!currentPet) return false;

    const info = PET_DATA[currentPet.type];
    const refund = info.sellVal;
    player.addVal(refund);
    AudioEngine.playItemPickup(true);
    onDismiss?.();

    if (floatingText) {
      floatingText.spawn(player.x + 10, player.y - 20, `💰 Menitipkan ${currentPet.name} ke Suaka (+${refund.toLocaleString()} 𝒱)!`, '#facc15', 3.0);
    }
    return true;
  }

  /**
   * Melepas Pet secara damai ke alam bebas tanpa Val
   */
  public releasePet(
    player: Player,
    currentPet: Pet | null,
    floatingText?: FloatingTextManager,
    onDismiss?: () => void
  ): boolean {
    if (!currentPet) return false;

    onDismiss?.();
    AudioEngine.playButtonClick();

    if (floatingText) {
      floatingText.spawn(player.x + 10, player.y - 20, `🕊️ ${currentPet.name} dilepas kembali dengan damai ke alam rimba!`, '#94a3b8', 3.0);
    }
    return true;
  }

  /**
   * Menangani sentuhan layar untuk navigasi toko, filter, seleksi, dan tombol aksi
   */
  public handleTouch(
    touchX: number,
    touchY: number,
    player: Player,
    currentPet: Pet | null,
    floatingText?: FloatingTextManager,
    onAdoptPet?: (type: PetType) => void,
    onDismissPet?: () => void
  ): boolean {
    if (!this.isOpen) return false;

    // 1. Tombol Tutup [✕]
    const { x: cx, y: cy, w: cw, h: ch } = this.closeBtnRect;
    if (touchX >= cx && touchX <= cx + cw && touchY >= cy && touchY <= cy + ch) {
      this.close();
      return true;
    }

    // 2. Tab Navigasi Mode Toko
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
      const targetMode = this.activeShopId === 'PET' ? 'PET_STATUS' : 'SELL';
      if (this.activeMode !== targetMode) {
        this.activeMode = targetMode;
        this.selectedSellIndex = 0;
        AudioEngine.playButtonClick();
      }
      return true;
    }

    // ==========================================
    // 3. INTERAKSI TOKO PET MIA
    // ==========================================
    if (this.activeShopId === 'PET') {
      if (this.activeMode === 'BUY') {
        // Seleksi Kartu Pet
        for (const card of this.petCardsRects) {
          if (touchX >= card.x && touchX <= card.x + card.w && touchY >= card.y && touchY <= card.y + card.h) {
            this.selectedPetType = card.type;
            AudioEngine.playButtonClick();
            return true;
          }
        }

        // Tombol Adopsi
        const { x: abx, y: aby, w: abw, h: abh } = this.petAdoptBtnRect;
        if (touchX >= abx && touchX <= abx + abw && touchY >= aby && touchY <= aby + abh) {
          this.adoptPet(this.selectedPetType, player, currentPet, floatingText, onAdoptPet);
          return true;
        }
      } else {
        // Mode Pet Status & Jual / Lepas
        const { x: psx, y: psy, w: psw, h: psh } = this.petSellBtnRect;
        if (touchX >= psx && touchX <= psx + psw && touchY >= psy && touchY <= psy + psh) {
          this.sellPet(player, currentPet, floatingText, onDismissPet);
          return true;
        }

        const { x: prx, y: pry, w: prw, h: prh } = this.petReleaseBtnRect;
        if (touchX >= prx && touchX <= prx + prw && touchY >= pry && touchY <= pry + prh) {
          this.releasePet(player, currentPet, floatingText, onDismissPet);
          return true;
        }
      }
      return true;
    }

    // ==========================================
    // 4. INTERAKSI TOKO BARANG / MAKANAN / SIHIR
    // ==========================================
    if (this.activeMode === 'BUY') {
      // 4.1 Filter Kategori
      for (const cat of this.categoryRects) {
        if (touchX >= cat.x && touchX <= cat.x + cat.w && touchY >= cat.y && touchY <= cat.y + cat.h) {
          this.activeCategory = cat.category;
          this.selectedItemIndex = 0;
          AudioEngine.playButtonClick();
          return true;
        }
      }

      // 4.2 Pemilihan Item Card
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

      // 4.3 Tombol Beli 1x & 5x
      const selectedItem = filtered[this.selectedItemIndex] || filtered[0];
      if (selectedItem) {
        const { x: b1x, y: b1y, w: b1w, h: b1h } = this.buy1BtnRect;
        if (touchX >= b1x && touchX <= b1x + b1w && touchY >= b1y && touchY <= b1y + b1h) {
          this.buyItem(player, selectedItem, 1, floatingText);
          return true;
        }

        const { x: b5x, y: b5y, w: b5w, h: b5h } = this.buy5BtnRect;
        if (touchX >= b5x && touchX <= b5x + b5w && touchY >= b5y && touchY <= b5y + b5h) {
          this.buyItem(player, selectedItem, 5, floatingText);
          return true;
        }
      }
    } else if (this.activeMode === 'SELL') {
      const invItems = this.getSellableInventory(player);

      // 4.4 Pemilihan Item Tas
      for (const card of this.sellCardRects) {
        if (touchX >= card.x && touchX <= card.x + card.w && touchY >= card.y && touchY <= card.y + card.h) {
          if (card.listIndex < invItems.length) {
            this.selectedSellIndex = card.listIndex;
            AudioEngine.playButtonClick();
          }
          return true;
        }
      }

      // 4.5 Tombol Jual 1x & Jual Semua
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

    return true;
  }

  /**
   * Render Modal Toko Pasar Raya (2-Column Landscape, Mode Beli & Mode Jual)
   */
  public renderModal(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    player: Player,
    currentPet: Pet | null = null
  ): void {
    if (!this.isOpen) return;

    ctx.save();

    // 1. Backdrop Gelap
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Dimensi Modal Landscape
    const modalW = Math.min(540, screenWidth - 20);
    const modalH = Math.min(300, screenHeight - 16);
    const modalX = Math.round((screenWidth - modalW) / 2);
    const modalY = Math.round((screenHeight - modalH) / 2);

    const meta = SHOP_METADATA[this.activeShopId] || SHOP_METADATA.GENERAL;

    // Latar Belakang Modal
    ctx.fillStyle = '#0b1120';
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalW, modalH, 10);
    ctx.fill();

    // Border Emas Berwarna Toko
    ctx.strokeStyle = meta.accentColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 3, modalY + 3, modalW - 6, modalH - 6);

    // 3. Header Bar Toko
    const headerH = 32;
    ctx.fillStyle = meta.bannerColor;
    ctx.fillRect(modalX + 3, modalY + 3, modalW - 6, headerH);

    // Awning stripes accent
    const stripeW = 20;
    for (let sx = modalX + 3; sx < modalX + modalW - 6; sx += stripeW * 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(sx, modalY + 3, stripeW, 4);
    }

    // Judul & Ikon Toko
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${meta.icon} ${meta.name}`, modalX + 10, modalY + 3 + headerH / 2);

    // Saldo Dompet Val di Kanan Header
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'right';
    ctx.fillText(`👛 ${player.val.toLocaleString()} 𝒱`, modalX + modalW - 36, modalY + 3 + headerH / 2);

    // Tombol Tutup [✕]
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

    // 4. Sub-banner: 2 Mode Tabs
    const modeTabY = modalY + headerH + 4;
    const modeTabH = 22;
    const modeTabW = Math.floor((modalW - 20) / 2);

    const bTabX = modalX + 8;
    const sTabX = bTabX + modeTabW + 4;

    this.buyModeTabRect = { x: bTabX, y: modeTabY, w: modeTabW, h: modeTabH };
    this.sellModeTabRect = { x: sTabX, y: modeTabY, w: modeTabW, h: modeTabH };

    if (this.activeShopId === 'PET') {
      const isAdoptActive = this.activeMode === 'BUY';
      const isStatusActive = this.activeMode === 'PET_STATUS';

      // Tab Adopsi
      ctx.fillStyle = isAdoptActive ? '#059669' : 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(bTabX, modeTabY, modeTabW, modeTabH, 4);
      ctx.fill();
      ctx.strokeStyle = isAdoptActive ? '#34d399' : '#475569';
      ctx.lineWidth = isAdoptActive ? 1.8 : 0.8;
      ctx.stroke();

      ctx.font = isAdoptActive ? 'bold 9px sans-serif' : '8.5px sans-serif';
      ctx.fillStyle = isAdoptActive ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐾 ADOPSI HEWAN PELIHARAAN', bTabX + modeTabW / 2, modeTabY + modeTabH / 2);

      // Tab Status & Jual / Lepas
      ctx.fillStyle = isStatusActive ? '#d97706' : 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(sTabX, modeTabY, modeTabW, modeTabH, 4);
      ctx.fill();
      ctx.strokeStyle = isStatusActive ? '#fde047' : '#475569';
      ctx.lineWidth = isStatusActive ? 1.8 : 0.8;
      ctx.stroke();

      ctx.font = isStatusActive ? 'bold 9px sans-serif' : '8.5px sans-serif';
      ctx.fillStyle = isStatusActive ? '#ffffff' : '#94a3b8';
      const petLabel = currentPet ? `💖 PET AKTIF (${currentPet.name})` : '💖 STATUS PET / LEPAS';
      ctx.fillText(petLabel, sTabX + modeTabW / 2, modeTabY + modeTabH / 2);

      // Render Body Pet Shop
      if (this.activeMode === 'BUY') {
        this.renderPetAdoptBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player, currentPet);
      } else {
        this.renderPetStatusBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player, currentPet);
      }
    } else {
      // Standard Buy / Sell Tabs
      const isBuyActive = this.activeMode === 'BUY';
      const isSellActive = this.activeMode === 'SELL';

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

      if (this.activeMode === 'BUY') {
        this.renderBuyModeBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player);
      } else {
        this.renderSellModeBody(ctx, modalX, modalY, modalW, modalH, modeTabY + modeTabH + 4, player);
      }
    }

    ctx.restore();
  }

  /**
   * Render Konten Mode Beli Item
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

    // Main 2-Column Content Area
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

      ctx.fillStyle = isSelected ? '#1e3a8a' : canAfford ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 4);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#38bdf8' : canAfford ? '#475569' : '#334155';
      ctx.lineWidth = isSelected ? 2 : 0.8;
      ctx.stroke();

      const def = ITEM_DEFINITIONS[item.id];
      if (def) {
        def.renderIcon(ctx, cx + 4, cy + 4, cardH - 8);
      }

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : canAfford ? '#f8fafc' : '#94a3b8';
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
      const catText = selectedItem.category === 'potion' ? 'Ramuan Obat' : selectedItem.category === 'scroll' ? 'Gulungan Ajaib' : 'Bahan Kerajinan';
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
   * Render Konten Mode Jual (Mengurangi isi tas dan menghasilkan Val)
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

    const sellableList = this.getSellableInventory(player);

    if (this.selectedSellIndex >= sellableList.length) {
      this.selectedSellIndex = Math.max(0, sellableList.length - 1);
    }

    // --- KOLOM KIRI: DAFTAR BARANG DALAM TAS ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(col1X, contentY, col1W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.sellCardRects = [];

    if (sellableList.length === 0) {
      ctx.font = 'italic 8.5px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tas kosong! Tidak ada item untuk dijual.', col1X + col1W / 2, contentY + contentH / 2);
    } else {
      const itemCols = 2;
      const itemRows = 3;
      const cardGap = 4;
      const cardW = Math.floor((col1W - cardGap * 3) / itemCols);
      const cardH = Math.floor((contentH - cardGap * 4) / itemRows);

      for (let i = 0; i < Math.min(sellableList.length, itemCols * itemRows); i++) {
        const itemInfo = sellableList[i];
        const col = i % itemCols;
        const row = Math.floor(i / itemCols);
        const cx = col1X + cardGap + col * (cardW + cardGap);
        const cy = contentY + cardGap + row * (cardH + cardGap);

        this.sellCardRects.push({ slotIndex: itemInfo.slotIndex, listIndex: i, x: cx, y: cy, w: cardW, h: cardH });

        const isSelected = this.selectedSellIndex === i;
        const sellable = isItemSellable(itemInfo.itemId);

        ctx.fillStyle = isSelected ? '#854d0e' : sellable ? 'rgba(30, 41, 59, 0.85)' : 'rgba(30, 20, 20, 0.8)';
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 4);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#facc15' : sellable ? '#475569' : '#991b1b';
        ctx.lineWidth = isSelected ? 2 : 0.8;
        ctx.stroke();

        const def = ITEM_DEFINITIONS[itemInfo.itemId];
        if (def) {
          def.renderIcon(ctx, cx + 4, cy + 4, cardH - 8);
        }

        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const maxNW = cardW - (cardH - 8) - 10;
        const nameStr = def ? def.name : itemInfo.itemId;
        const safeN = CanvasText.truncate(ctx, nameStr, maxNW);
        ctx.fillText(safeN, cx + cardH, cy + 4);

        const unitVal = getItemSellPrice(itemInfo.itemId);
        ctx.font = 'bold 7px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Jml: ${itemInfo.count}x`, cx + cardH, cy + 14);

        ctx.font = 'bold 7.5px sans-serif';
        ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
        const priceTxt = sellable ? `+${(unitVal * itemInfo.count).toLocaleString()} 𝒱` : 'Terikat';
        ctx.fillText(priceTxt, cx + cardH, cy + cardH - 11);
      }
    }

    // --- KOLOM KANAN: DETAIL ITEM TERPILIH UNTUK DIJUAL ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(col2X, contentY, col2W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    const selectedItem = sellableList[this.selectedSellIndex];
    if (selectedItem) {
      const def = ITEM_DEFINITIONS[selectedItem.itemId];
      const iconSize = 34;
      if (def) {
        def.renderIcon(ctx, col2X + 8, contentY + 8, iconSize);
      }

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const nameW = col2W - iconSize - 18;
      const titleStr = def ? def.name : selectedItem.itemId;
      const safeTitle = CanvasText.truncate(ctx, titleStr, nameW);
      ctx.fillText(safeTitle, col2X + iconSize + 12, contentY + 8);

      const sellable = isItemSellable(selectedItem.itemId);
      const unitVal = getItemSellPrice(selectedItem.itemId);
      const totalVal = unitVal * selectedItem.count;

      ctx.font = '7.5px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`🎒 Jumlah di Tas: ${selectedItem.count} buah`, col2X + iconSize + 12, contentY + 22);
      ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
      ctx.fillText(sellable ? `Status: Dapat Dijual` : `Status: Terikat Permanen (Kartu Petualang)`, col2X + iconSize + 12, contentY + 32);

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
      const descStr = def ? def.description : 'Barang inventaris petualang.';
      CanvasText.drawWrappedText(ctx, descStr, col2X + 8, descY, descMaxW, 11, 2);

      const priceBoxY = contentY + contentH - 62;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.roundRect(col2X + 8, priceBoxY, col2W - 16, 24, 3);
      ctx.fill();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Harga Jual per Unit:', col2X + 14, priceBoxY + 8);
      ctx.fillText('Total Nilai Tumpukan:', col2X + 14, priceBoxY + 18);

      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = sellable ? '#4ade80' : '#ef4444';
      ctx.textAlign = 'right';
      ctx.fillText(sellable ? `+${unitVal.toLocaleString()} 𝒱` : '0 𝒱', col2X + col2W - 14, priceBoxY + 8);
      ctx.fillText(sellable ? `+${totalVal.toLocaleString()} 𝒱` : '0 𝒱', col2X + col2W - 14, priceBoxY + 18);

      const btnAreaY = contentY + contentH - 32;
      const btnH = 26;
      const btnGap = 6;
      const bW = Math.floor((col2W - 16 - btnGap) / 2);

      const s1X = col2X + 8;
      const saX = s1X + bW + btnGap;

      this.sell1BtnRect = { x: s1X, y: btnAreaY, w: bW, h: btnH };
      this.sellAllBtnRect = { x: saX, y: btnAreaY, w: bW, h: btnH };

      ctx.fillStyle = sellable ? '#b45309' : '#334155';
      ctx.beginPath();
      ctx.roundRect(s1X, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = sellable ? '#f59e0b' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = sellable ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💰 Jual 1x', s1X + bW / 2, btnAreaY + btnH / 2);

      ctx.fillStyle = sellable ? '#059669' : '#334155';
      ctx.beginPath();
      ctx.roundRect(saX, btnAreaY, bW, btnH, 4);
      ctx.fill();
      ctx.strokeStyle = sellable ? '#34d399' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = sellable ? '#ffffff' : '#94a3b8';
      ctx.fillText(`💎 Jual Semua`, saX + bW / 2, btnAreaY + btnH / 2);
    }
  }

  /**
   * Render Konten Mode Adopsi Pet Baru di Suaka Mia
   */
  private renderPetAdoptBody(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalW: number,
    modalH: number,
    startY: number,
    player: Player,
    currentPet: Pet | null
  ): void {
    const contentY = startY;
    const contentH = modalH - (contentY - modalY) - 8;
    const colGap = 8;
    const col1W = Math.floor((modalW - 24) * 0.52);
    const col2W = modalW - 24 - col1W - colGap;
    const col1X = modalX + 8;
    const col2X = col1X + col1W + colGap;

    const petTypes: PetType[] = ['SLIME_PET', 'WOLF_PET', 'FAIRY_PET', 'DRAGON_PET'];

    // --- KOLOM KIRI: DAFTAR HEWAN PELIHARAAN ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(col1X, contentY, col1W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.petCardsRects = [];
    const cardH = Math.floor((contentH - 16) / petTypes.length);

    petTypes.forEach((pType, i) => {
      const pInfo = PET_DATA[pType];
      const cy = contentY + 4 + i * (cardH + 2);
      const cx = col1X + 4;
      const cw = col1W - 8;

      this.petCardsRects.push({ type: pType, x: cx, y: cy, w: cw, h: cardH });

      const isSelected = this.selectedPetType === pType;
      const isOwned = currentPet && currentPet.type === pType;
      const canAfford = player.val >= pInfo.costVal;

      ctx.fillStyle = isSelected ? '#065f46' : isOwned ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, cardH, 4);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#34d399' : isOwned ? '#facc15' : '#475569';
      ctx.lineWidth = isSelected ? 1.8 : 0.8;
      ctx.stroke();

      // Avatar Icon
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pInfo.avatarIcon, cx + 16, cy + cardH / 2);

      // Name & Species
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(`${pInfo.name} - ${pInfo.species}`, cx + 32, cy + 8);

      // Price or Status
      ctx.font = 'bold 7.5px sans-serif';
      if (isOwned) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✨ SEDANG MENEMANIKU', cx + 32, cy + cardH - 8);
      } else {
        ctx.fillStyle = canAfford ? '#facc15' : '#ef4444';
        ctx.fillText(`Biaya Adopsi: ${pInfo.costVal.toLocaleString()} 𝒱`, cx + 32, cy + cardH - 8);
      }
    });

    // --- KOLOM KANAN: PREVIEW & DETAIL ADOPSI ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(col2X, contentY, col2W, contentH, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    const selectedInfo = PET_DATA[this.selectedPetType];

    // Header Detail
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${selectedInfo.avatarIcon} ${selectedInfo.name} (${selectedInfo.species})`, col2X + 8, contentY + 8);

    // Specialty Badge
    ctx.font = '7.5px sans-serif';
    ctx.fillStyle = '#34d399';
    const spec = this.selectedPetType === 'FAIRY_PET' ? '🌟 Jangkauan Magnetik Luas (165px) & Berkah Hutan' : this.selectedPetType === 'DRAGON_PET' ? '🔥 Gerak Cepat (80 SPD) & Pengumpul Harta Abisal' : '🐾 Auto-Loot Koin & Drop Item Otomatis';
    ctx.fillText(spec, col2X + 8, contentY + 24);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(col2X + 8, contentY + 36);
    ctx.lineTo(col2X + col2W - 8, contentY + 36);
    ctx.stroke();

    // Description text
    const descY = contentY + 42;
    const descMaxW = col2W - 16;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8px sans-serif';
    CanvasText.drawWrappedText(ctx, selectedInfo.description, col2X + 8, descY, descMaxW, 11, 3);

    // Cost info box
    const priceBoxY = contentY + contentH - 58;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.beginPath();
    ctx.roundRect(col2X + 8, priceBoxY, col2W - 16, 20, 3);
    ctx.fill();

    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Biaya Adopsi Suaka:', col2X + 14, priceBoxY + 10);

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'right';
    ctx.fillText(`${selectedInfo.costVal.toLocaleString()} 𝒱`, col2X + col2W - 14, priceBoxY + 10);

    // Tombol Aksi Adopsi
    const btnAreaY = contentY + contentH - 32;
    const btnH = 26;
    const btnW = col2W - 16;
    const btnX = col2X + 8;
    this.petAdoptBtnRect = { x: btnX, y: btnAreaY, w: btnW, h: btnH };

    const isOwned = currentPet && currentPet.type === this.selectedPetType;
    const canAdopt = !currentPet && player.val >= selectedInfo.costVal;

    ctx.fillStyle = isOwned ? '#334155' : canAdopt ? '#059669' : '#7f1d1d';
    ctx.beginPath();
    ctx.roundRect(btnX, btnAreaY, btnW, btnH, 4);
    ctx.fill();
    ctx.strokeStyle = isOwned ? '#475569' : canAdopt ? '#34d399' : '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnLabel = isOwned ? '✨ Pet Ini Sudah Aktif' : currentPet ? '⚠️ Lepas Pet Aktif Terlebih Dahulu' : canAdopt ? `🐾 Adopsi ${selectedInfo.name} (${selectedInfo.costVal} 𝒱)` : '❌ Val Tidak Cukup';
    ctx.fillText(btnLabel, btnX + btnW / 2, btnAreaY + btnH / 2);
  }

  /**
   * Render Konten Status Pet & Titip/Jual Pet Kembali ke Suaka
   */
  private renderPetStatusBody(
    ctx: CanvasRenderingContext2D,
    modalX: number,
    modalY: number,
    modalW: number,
    modalH: number,
    startY: number,
    _player: Player,
    currentPet: Pet | null
  ): void {
    const contentY = startY;
    const contentH = modalH - (contentY - modalY) - 8;
    const colW = modalW - 16;
    const colX = modalX + 8;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(colX, contentY, colW, contentH, 6);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!currentPet) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐾', colX + colW / 2, contentY + contentH / 2 - 20);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('Kamu Belum Memiliki Hewan Peliharaan Aktif', colX + colW / 2, contentY + contentH / 2);

      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Kunjungi tab "🐾 ADOPSI HEWAN PELIHARAAN" untuk memilih kawan setia petualanganmu!', colX + colW / 2, contentY + contentH / 2 + 16);
      return;
    }

    const info = PET_DATA[currentPet.type];

    // Status Card Box
    ctx.fillStyle = 'rgba(6, 95, 70, 0.25)';
    ctx.beginPath();
    ctx.roundRect(colX + 10, contentY + 10, colW - 20, 64, 4);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.avatarIcon, colX + 32, contentY + 42);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText(`🐾 ${currentPet.name} - ${info.species}`, colX + 54, contentY + 24);

    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`Status: Aktif mengawalmu & auto-loot magnet koin/item!`, colX + 54, contentY + 38);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Kecepatan Lari: ${currentPet.speed} SPD | Afeksi: 💖 Penuh Kebahagiaan`, colX + 54, contentY + 52);

    // Penjelasan Titip / Jual Pet
    const explY = contentY + 86;
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('Ingin berganti hewan peliharaan? Kamu bisa:', colX + 12, explY);
    ctx.fillText(`• Menitipkan / Menjual ${currentPet.name} kembali ke Suaka dan menerima pengembalian +${info.sellVal.toLocaleString()} 𝒱.`, colX + 12, explY + 14);
    ctx.fillText(`• Melepas ${currentPet.name} dengan damai ke alam rimba bebas tanpa kompensasi Val.`, colX + 12, explY + 28);

    // Tombol Aksi: Titip/Jual vs Lepas
    const btnAreaY = contentY + contentH - 34;
    const btnH = 26;
    const btnGap = 8;
    const bW = Math.floor((colW - 24 - btnGap) / 2);

    const bSellX = colX + 12;
    const bRelX = bSellX + bW + btnGap;

    this.petSellBtnRect = { x: bSellX, y: btnAreaY, w: bW, h: btnH };
    this.petReleaseBtnRect = { x: bRelX, y: btnAreaY, w: bW, h: btnH };

    // Tombol Jual/Titip (+Val)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(bSellX, btnAreaY, bW, btnH, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💰 Titip ke Suaka (+${info.sellVal.toLocaleString()} 𝒱)`, bSellX + bW / 2, btnAreaY + btnH / 2);

    // Tombol Lepas Damai
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(bRelX, btnAreaY, bW, btnH, 4);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`🕊️ Lepas ke Alam Rimba`, bRelX + bW / 2, btnAreaY + btnH / 2);
  }
}
