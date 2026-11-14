import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { CONSTANTS } from '../core/Constants.ts';

export interface HarvestNode {
  id: string;
  type: 'WHEAT' | 'ORE' | 'MILL';
  tileX: number;
  tileY: number;
  respawnTimer: number; // in seconds, 0 = ready to harvest
  maxRespawn: number;
  name: string;
}

export class LifeSkillSystem {
  private static instance: LifeSkillSystem | null = null;

  // --- FISHING STATE ---
  public isFishing: boolean = false;
  private fishingTimer: number = 0;
  private biteTimer: number = 0;
  public hasBite: boolean = false;
  private bobberPos: { x: number; y: number } = { x: 0, y: 0 };
  private fishingWaterRipples: { x: number; y: number; radius: number; alpha: number }[] = [];

  // --- HARVESTING NODES (Wheat & Mining) ---
  public harvestNodes: HarvestNode[] = [];

  // Callbacks
  public onCatchFish?: (fishId: string) => void;
  public onHarvestWheat?: () => void;
  public onMineOre?: () => void;
  public onMillFlour?: () => void;

  constructor() {
    this.initNodes();
  }

  public static getInstance(): LifeSkillSystem {
    if (!LifeSkillSystem.instance) {
      LifeSkillSystem.instance = new LifeSkillSystem();
    }
    return LifeSkillSystem.instance;
  }

  private initNodes(): void {
    // 1. Ladang Gandum Ambervale (x: 80..85, y: 20..31)
    const wheatCoords = [
      { x: 80, y: 21 },
      { x: 83, y: 22 },
      { x: 85, y: 23 },
      { x: 81, y: 28 },
      { x: 84, y: 29 },
      { x: 85, y: 31 }
    ];
    wheatCoords.forEach((c, idx) => {
      this.harvestNodes.push({
        id: `wheat_${idx}`,
        type: 'WHEAT',
        tileX: c.x,
        tileY: c.y,
        respawnTimer: 0,
        maxRespawn: 25, // 25 detik respawn
        name: 'Gandum Emas Siap Panen'
      });
    });

    // 2. Gilingan Batu Kincir Angin Ambervale (x: 75, y: 24)
    this.harvestNodes.push({
      id: 'grain_mill',
      type: 'MILL',
      tileX: 75,
      tileY: 24,
      respawnTimer: 0,
      maxRespawn: 0,
      name: 'Gilingan Gandum Kincir Angin'
    });

    // 3. Tambang Bijih Besi Stonewatch (x: 80..88, y: 58..64)
    const oreCoords = [
      { x: 80, y: 59 },
      { x: 87, y: 59 },
      { x: 79, y: 64 },
      { x: 87, y: 64 }
    ];
    oreCoords.forEach((c, idx) => {
      this.harvestNodes.push({
        id: `ore_${idx}`,
        type: 'ORE',
        tileX: c.x,
        tileY: c.y,
        respawnTimer: 0,
        maxRespawn: 35, // 35 detik respawn
        name: 'Bongkahan Bijih Besi Abisal'
      });
    });
  }

  public update(deltaTime: number, player: Player, _currentMap: string): void {
    // 1. Update Respawn Timer Nodes
    for (const node of this.harvestNodes) {
      if (node.respawnTimer > 0) {
        node.respawnTimer = Math.max(0, node.respawnTimer - deltaTime);
      }
    }

    // 2. Update Fishing State
    if (this.isFishing) {
      // Jika pemain bergerak jauh dari tempat memancing, batalkan pancing
      const dist = Math.hypot(player.x + 16 - this.bobberPos.x, player.y + 16 - this.bobberPos.y);
      if (dist > 80) {
        this.cancelFishing('Memancing dibatalkan karena bergerak.');
        return;
      }

      this.fishingTimer += deltaTime;

      // Update ripples
      if (Math.random() < 0.15) {
        this.fishingWaterRipples.push({
          x: this.bobberPos.x + (Math.random() - 0.5) * 6,
          y: this.bobberPos.y + (Math.random() - 0.5) * 4,
          radius: 2,
          alpha: 0.8
        });
      }

      for (let i = this.fishingWaterRipples.length - 1; i >= 0; i--) {
        const r = this.fishingWaterRipples[i];
        r.radius += deltaTime * 8;
        r.alpha -= deltaTime * 0.9;
        if (r.alpha <= 0) {
          this.fishingWaterRipples.splice(i, 1);
        }
      }

      // Tunggu ikan menggigit (antara 2.5 hingga 5 detik)
      if (!this.hasBite && this.fishingTimer >= this.biteTimer) {
        this.hasBite = true;
        AudioEngine.play('quest_complete');
        FloatingTextManager.getInstance().addText(
          this.bobberPos.x,
          this.bobberPos.y - 20,
          '🎣 STRIKE! Tarik Kail! [A]',
          '#facc15'
        );
      }

      // Jika strike lewat dari 3 detik tidak ditarik, ikan kabur
      if (this.hasBite && this.fishingTimer > this.biteTimer + 3.2) {
        this.cancelFishing('Yah... ikannya keburu kabur!');
      }
    }
  }

  // --- FISHING ACTIONS ---
  public isNearFishingSpot(playerX: number, playerY: number, currentMap: string): boolean {
    if (currentMap !== 'OVERWORLD') return false;
    const ts = CONSTANTS.TILE_SIZE;
    // Jangan izinkan memancing di area dermaga kapal ekspedisi samudra (mencegah tombol tertimpa)
    const isShipZone = Math.hypot(32.5 * ts + 16 - playerX, 73.5 * ts + 16 - playerY) < 55;
    if (isShipZone) return false;

    const pTileX = Math.floor(playerX / ts);
    const pTileY = Math.floor(playerY / ts);
    // Spot memancing khusus di anjungan pemancingan timur Tirta Kencana (x: 36..42, y: 72..78)
    return pTileX >= 36 && pTileX <= 42 && pTileY >= 72 && pTileY <= 78;
  }

  public startFishing(player: Player): void {
    if (this.isFishing) {
      this.pullRod(player);
      return;
    }

    this.isFishing = true;
    this.hasBite = false;
    this.fishingTimer = 0;
    this.biteTimer = 2.4 + Math.random() * 2.8; // 2.4 - 5.2 detik
    this.fishingWaterRipples = [];

    // Posisi pelampung di danau di depan dermaga
    const offsetX = player.direction === 'left' ? -36 : player.direction === 'right' ? 36 : 0;
    const offsetY = player.direction === 'up' ? -28 : 28;
    this.bobberPos = {
      x: player.x + (offsetX !== 0 ? offsetX : 28),
      y: player.y + offsetY
    };

    AudioEngine.play('potion_heal');
    FloatingTextManager.getInstance().addText(
      player.x + 16,
      player.y - 12,
      '🎣 Melempar kail pancing...',
      '#38bdf8'
    );
  }

  public pullRod(player: Player): void {
    if (!this.isFishing) return;

    if (!this.hasBite) {
      this.cancelFishing('Belum ada ikan yang menyambar.');
      return;
    }

    // Berhasil menangkap ikan!
    this.isFishing = false;
    this.hasBite = false;
    AudioEngine.play('item_pickup');

    // Menentukan jenis tangkapan
    const roll = Math.random();
    let caughtItem = 'BLUE_CARP';
    let catchName = 'Ikan Karper Azure';
    let catchColor = '#0284c7';

    if (roll < 0.12) {
      caughtItem = 'GOLDEN_KOI';
      catchName = '✨ Ikan Koi Emas Langka!';
      catchColor = '#facc15';
    } else if (roll < 0.35) {
      caughtItem = 'TREASURE_SHELL';
      catchName = '🦪 Kerang Mutiara Karang';
      catchColor = '#c7d2fe';
    } else if (roll < 0.65) {
      caughtItem = 'BLUE_CARP';
      catchName = '🐟 Ikan Karper Azure';
      catchColor = '#38bdf8';
    } else {
      caughtItem = 'LAKE_SHRIMP';
      catchName = '🦐 Udang Danau Segar';
      catchColor = '#fb923c';
    }

    const success = player.inventory.addItem(caughtItem, 1);
    if (success) {
      FloatingTextManager.getInstance().addText(
        player.x + 16,
        player.y - 18,
        `Tangkapan: ${catchName}!`,
        catchColor
      );
      if (this.onCatchFish) this.onCatchFish(caughtItem);
    } else {
      FloatingTextManager.getInstance().addText(
        player.x + 16,
        player.y - 18,
        'Tas Penuh! Ikan terlepas.',
        '#ef4444'
      );
    }
  }

  public cancelFishing(msg: string): void {
    this.isFishing = false;
    this.hasBite = false;
    this.fishingTimer = 0;
    AudioEngine.play('attack_miss');
    FloatingTextManager.getInstance().addText(
      this.bobberPos.x,
      this.bobberPos.y - 16,
      msg,
      '#94a3b8'
    );
  }

  // --- HARVESTING & MINING ACTIONS ---
  public getNearbyHarvestNode(playerX: number, playerY: number, currentMap: string): HarvestNode | null {
    if (currentMap !== 'OVERWORLD') return null;
    const ts = CONSTANTS.TILE_SIZE;
    const pCenterX = playerX + 16;
    const pCenterY = playerY + 16;

    for (const node of this.harvestNodes) {
      const nodeX = node.tileX * ts + 16;
      const nodeY = node.tileY * ts + 16;
      const dist = Math.hypot(pCenterX - nodeX, pCenterY - nodeY);
      if (dist <= 36) {
        return node;
      }
    }
    return null;
  }

  public interactNode(node: HarvestNode, player: Player): void {
    if (node.type === 'WHEAT') {
      if (node.respawnTimer > 0) {
        FloatingTextManager.getInstance().addText(
          node.tileX * CONSTANTS.TILE_SIZE + 16,
          node.tileY * CONSTANTS.TILE_SIZE,
          `Gandum sedang bertunas (${Math.ceil(node.respawnTimer)}d)`,
          '#94a3b8'
        );
        return;
      }

      node.respawnTimer = node.maxRespawn;
      const success = player.inventory.addItem('WHEAT_BUNDLE', 1);
      AudioEngine.play('item_pickup');

      if (success) {
        FloatingTextManager.getInstance().addText(
          player.x + 16,
          player.y - 14,
          '🌾 Berhasil Memanen Seikat Gandum!',
          '#facc15'
        );
        if (this.onHarvestWheat) this.onHarvestWheat();
      } else {
        FloatingTextManager.getInstance().addText(player.x + 16, player.y - 14, 'Tas Penuh!', '#ef4444');
      }
    } else if (node.type === 'ORE') {
      if (node.respawnTimer > 0) {
        FloatingTextManager.getInstance().addText(
          node.tileX * CONSTANTS.TILE_SIZE + 16,
          node.tileY * CONSTANTS.TILE_SIZE,
          `Batu bijih sedang membeku (${Math.ceil(node.respawnTimer)}d)`,
          '#94a3b8'
        );
        return;
      }

      node.respawnTimer = node.maxRespawn;
      AudioEngine.play('sword_hit');

      const isRare = Math.random() < 0.3;
      const itemToGive = isRare ? 'DUNGEON_GEM' : 'DARK_IRON_ORE';
      const itemName = isRare ? '💎 Permata Kristal Abisal' : '⛏️ Bijih Besi Gelap';
      const success = player.inventory.addItem(itemToGive, 1);

      if (success) {
        FloatingTextManager.getInstance().addText(
          player.x + 16,
          player.y - 14,
          `Tambang: ${itemName}!`,
          isRare ? '#c084fc' : '#94a3b8'
        );
        if (this.onMineOre) this.onMineOre();
      } else {
        FloatingTextManager.getInstance().addText(player.x + 16, player.y - 14, 'Tas Penuh!', '#ef4444');
      }
    } else if (node.type === 'MILL') {
      // Giling 2 Gandum jadi 1 Kantong Tepung
      const wheatCount = player.inventory.getItemCount('WHEAT_BUNDLE');
      if (wheatCount < 2) {
        FloatingTextManager.getInstance().addText(
          player.x + 16,
          player.y - 14,
          'Butuh 2 Seikat Gandum untuk menggiling tepung!',
          '#facc15'
        );
        return;
      }

      player.inventory.removeItemsById('WHEAT_BUNDLE', 2);
      player.inventory.addItem('FLOUR_BAG', 1);
      AudioEngine.play('quest_complete');
      FloatingTextManager.getInstance().addText(
        player.x + 16,
        player.y - 18,
        '⚙️ Kincir berputar: 1 Kantong Tepung Gandum dibuat!',
        '#f8fafc'
      );
      if (this.onMillFlour) this.onMillFlour();
    }
  }

  // --- RENDER VISUALS ---
  public render(ctx: CanvasRenderingContext2D, currentMap: string): void {
    if (currentMap !== 'OVERWORLD') return;
    const ts = CONSTANTS.TILE_SIZE;

    // 1. Render Nodes (Tanaman Gandum & Batu Tambang)
    for (const node of this.harvestNodes) {
      const nx = node.tileX * ts;
      const ny = node.tileY * ts;

      if (node.type === 'WHEAT') {
        if (node.respawnTimer <= 0) {
          // Gandum Emas Mekar Siap Panen
          ctx.save();
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(nx + 10, ny + 14, 12, 14);
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(nx + 13, ny + 12, 4, 0, Math.PI * 2);
          ctx.arc(nx + 19, ny + 10, 4.5, 0, Math.PI * 2);
          ctx.arc(nx + 23, ny + 13, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Kilau emas
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(nx + 17, ny + 8, 2, 2);
          ctx.restore();
        } else {
          // Jerami pendek bertunas
          ctx.fillStyle = '#65a30d';
          ctx.fillRect(nx + 12, ny + 20, 8, 4);
        }
      } else if (node.type === 'ORE') {
        if (node.respawnTimer <= 0) {
          // Batu Bijih Besi Gelap Berkilau
          ctx.save();
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(nx + 8, ny + 24);
          ctx.lineTo(nx + 16, ny + 8);
          ctx.lineTo(nx + 26, ny + 12);
          ctx.lineTo(nx + 28, ny + 24);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Bintik kristal berkilau
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(nx + 14, ny + 14, 3, 3);
          ctx.fillRect(nx + 20, ny + 18, 3, 3);
          ctx.restore();
        } else {
          // Sisa kerikil batu
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(nx + 10, ny + 22, 12, 4);
        }
      } else if (node.type === 'MILL') {
        // Meja Penggilingan Kincir Angin
        ctx.save();
        ctx.fillStyle = '#451a03';
        ctx.fillRect(nx + 6, ny + 16, 20, 12);
        // Batu Gilingan Bulat
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(nx + 16, ny + 16, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Tepung di tepi batu
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx + 14, ny + 14, 5, 4);
        ctx.restore();
      }
    }

    // 2. Render Memancing (Benang Pancing & Pelampung di Air)
    if (this.isFishing) {
      ctx.save();

      // Ripples di air
      for (const rip of this.fishingWaterRipples) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tali Senar Pancing
      // Asal pancing dari posisi pemain
      // (digambar di Game.ts atau di sini)

      // Pelampung Pancing Terapung (Fishing Bobber)
      const bobY = this.bobberPos.y + (this.hasBite ? Math.sin(Date.now() * 0.03) * 3 : Math.sin(Date.now() * 0.005) * 1.5);
      // Bagian bawah putih
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.bobberPos.x, bobY, 3, 0, Math.PI * 2);
      ctx.fill();
      // Bagian atas merah menyala
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.bobberPos.x, bobY, 3, Math.PI, 0, false);
      ctx.fill();

      // Indikator Strike Tanda Seru Merah jika sedang disambar ikan
      if (this.hasBite) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', this.bobberPos.x, bobY - 8);
      }

      ctx.restore();
    }
  }
}
