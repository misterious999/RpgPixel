import { CONSTANTS } from '../core/Constants.ts';
import { Player } from '../entities/Player.ts';
import { QuestManager } from './QuestManager.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { CanvasText } from '../utils/CanvasText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';

export interface VillageNPCData {
  id: string;
  name: string;
  title: string;
  roleType: 'QUEST' | 'AMBIENT';
  questId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  avatarIcon: string;
  greetingText: string;
  loreText: string;
  actionPrompt: string;
  isCat?: boolean;
}

export class VillageManager {
  private questManager: QuestManager;
  private animTimer: number = 0;

  // Active Dialog State
  public activeDialogNPC: VillageNPCData | null = null;
  public isDialogOpen: boolean = false;
  private dialogOpenTime: number = 0;

  // Village NPCs
  public npcs: VillageNPCData[] = [];

  constructor(questManager: QuestManager) {
    this.questManager = questManager;
    this.initNPCs();
  }

  private initNPCs(): void {
    const ts = CONSTANTS.TILE_SIZE;

    this.npcs = [
      // --- 4 NPC MISI GUILD SERIKAT (Mengapit Balai Serikat) ---
      {
        id: 'galahad',
        name: 'Kapten Galahad',
        title: 'Komandan Patroli Perbatasan',
        roleType: 'QUEST',
        questId: 'Q_FOREST_SLIME',
        x: 48 * ts,
        y: 48 * ts,
        width: 32,
        height: 32,
        hairColor: '#e2e8f0', // Silver knight hair
        outfitColor: '#1e3a8a', // Royal blue & plate armor
        accentColor: '#38bdf8',
        avatarIcon: '🛡️',
        greetingText: 'Salam damai, Petualang! Wilayah lembah butuh pahlawan tangguh.',
        loreText: 'Kawanan Slime Hutan di luar lembah mulai meresahkan pedagang dan warga desa kita. Kalahkan 4 Slime Hutan demi menjaga ketertiban perbatasan!',
        actionPrompt: '🛡️ [A] Misi Slime'
      },
      {
        id: 'kaelen',
        name: 'Ranger Kaelen',
        title: 'Pemburu Rimba Timur',
        roleType: 'QUEST',
        questId: 'Q_WILD_WOLF',
        x: 53 * ts,
        y: 48 * ts,
        width: 32,
        height: 32,
        hairColor: '#78350f', // Brown hair
        outfitColor: '#166534', // Forest green tunic & bow
        accentColor: '#4ade80',
        avatarIcon: '🏹',
        greetingText: 'Ssshh... Angin timur membawa kabar tentang serigala liar yang ganas.',
        loreText: 'Kawanan serigala buas bersembunyi di hutan lebat sebelah timur desa. Kalahkan 3 Serigala Liar untuk melindungi para pengelana!',
        actionPrompt: '🏹 [A] Misi Serigala'
      },
      {
        id: 'ignis',
        name: 'Cendekiawan Ignis',
        title: 'Peneliti Misteri Abisal',
        roleType: 'QUEST',
        questId: 'Q_DUNGEON_BAT',
        x: 49 * ts,
        y: 46 * ts + 16,
        width: 32,
        height: 32,
        hairColor: '#9333ea', // Mystic purple hood
        outfitColor: '#4c1d95', // Arcane robes
        accentColor: '#c084fc',
        avatarIcon: '🔮',
        greetingText: 'Goa purba di utara memancarkan gelombang energi magis yang misterius!',
        loreText: 'Dungeon bawah tanah dipenuhi kelelawar gua purba dan kristal abisal. Beranikan dirimu menuruni gua dan basmi 4 Kelelawar Gua!',
        actionPrompt: '🔮 [A] Misi Goa'
      },
      {
        id: 'morgrim',
        name: 'Morgrim sang Jagal',
        title: 'Veteran Pemburu Monster Legendaris',
        roleType: 'QUEST',
        questId: 'Q_BOSS_SLIME',
        x: 52 * ts,
        y: 46 * ts + 16,
        width: 32,
        height: 32,
        hairColor: '#475569', // Grizzled grey hair & beard
        outfitColor: '#7f1d1d', // Heavy bear-fur armor
        accentColor: '#f87171',
        avatarIcon: '⚔️',
        greetingText: 'Hahaha! Hanya mereka yang bernyali baja yang pantas bicara denganku!',
        loreText: 'Di ruang altar terdalam gua bawah tanah, bersemayam Raja Slime Purba berkekuatan dahsyat. Buktikan kekuatanmu dan taklukkan sang raja!',
        actionPrompt: '👑 [A] Misi Raja Goa'
      },

      // --- 5 NPC AMBIENT / PAJANGAN (Warga Pedesaan Oakhaven) ---
      {
        id: 'aldrich',
        name: 'Tetua Aldrich',
        title: 'Kepala Desa Oakhaven',
        roleType: 'AMBIENT',
        x: 43 * ts + 16,
        y: 46 * ts,
        width: 32,
        height: 32,
        hairColor: '#f8fafc', // White elder beard
        outfitColor: '#065f46', // Elder robe
        accentColor: '#34d399',
        avatarIcon: '👴',
        greetingText: 'Selamat datang di Desa Oakhaven, pahlawan muda!',
        loreText: 'Desa kami makmur berkat perlindungan Serikat Guild di alun-alun tengah. Warga desa selalu menyambut petualang ramah seperti dirimu dengan tangan terbuka.',
        actionPrompt: '💬 [A] Bicara'
      },
      {
        id: 'lily',
        name: 'Florist Lily',
        title: 'Gadis Kebun Bunga',
        roleType: 'AMBIENT',
        x: 56 * ts,
        y: 46 * ts,
        width: 32,
        height: 32,
        hairColor: '#f59e0b', // Golden blonde hair with straw hat
        outfitColor: '#db2777', // Floral pink dress
        accentColor: '#f472b6',
        avatarIcon: '🌻',
        greetingText: 'Halo petualang! Apakah kamu mencium semerbak mawar ini?',
        loreText: 'Bunga matahari dan mawar di kebun desa mekar indah karena berkah air mancur suci serikat. Semoga harimu menyenangkan dan penuh keberuntungan!',
        actionPrompt: '🌻 [A] Sapa Lily'
      },
      {
        id: 'bucky',
        name: 'Penyair Bucky',
        title: 'Petualang Santai di Bangku',
        roleType: 'AMBIENT',
        x: 56 * ts + 10,
        y: 53 * ts + 4,
        width: 32,
        height: 32,
        hairColor: '#b45309', // Orange-brown bard cap
        outfitColor: '#d97706', // Stylish vest
        accentColor: '#fde047',
        avatarIcon: '🪕',
        greetingText: 'Tra-la-la~ Pedang boleh tajam, tapi istirahat itu wajib, kawan!',
        loreText: 'Setelah menantang dungeon kemarin lusa, duduk santai di bangku kayu dekat kedai sambil menikmati teh hangat adalah surga dunia sejati!',
        actionPrompt: '🪕 [A] Ngobrol'
      },
      {
        id: 'rolf',
        name: 'Pengawal Rolf',
        title: 'Penjaga Gerbang Selatan',
        roleType: 'AMBIENT',
        x: 48 * ts + 16,
        y: 56 * ts,
        width: 32,
        height: 32,
        hairColor: '#334155', // Steel kettle helm
        outfitColor: '#475569', // Iron chainmail
        accentColor: '#cbd5e1',
        avatarIcon: '💂',
        greetingText: 'Berhenti sejenak, kawan! Gerbang Selatan di bawah pengawasanku.',
        loreText: 'Desa Oakhaven adalah zona aman netral. Namun berhati-hatilah saat melangkah ke luar batas gerbang, banyak monster liar mengintai di alam bebas.',
        actionPrompt: '💂 [A] Tanya Rolf'
      },
      {
        id: 'mimi',
        name: 'Mimi si Kucing',
        title: 'Kucing Belang Penjaga Air Mancur',
        roleType: 'AMBIENT',
        x: 51 * ts + 10,
        y: 52 * ts + 6,
        width: 24,
        height: 24,
        hairColor: '#ea580c', // Orange calico
        outfitColor: '#fed7aa',
        accentColor: '#fbbf24',
        avatarIcon: '🐾',
        greetingText: 'Nyaa~ Meoowww! 🐾',
        loreText: '(Mimi mendengkur manja berputar-putar di kakimu, lalu mengusapkan pipi lembutnya dengan hangat)',
        actionPrompt: '🐱 [A] Belai Kucing',
        isCat: true
      }
    ];
  }

  public update(deltaTime: number): void {
    this.animTimer += deltaTime * 3.5;
  }

  public isNearAnyNPC(playerCenterX: number, playerCenterY: number): VillageNPCData | null {
    for (const npc of this.npcs) {
      const cx = npc.x + npc.width / 2;
      const cy = npc.y + npc.height / 2;
      if (Math.hypot(cx - playerCenterX, cy - playerCenterY) < 38) {
        return npc;
      }
    }
    return null;
  }

  public openDialog(npc: VillageNPCData): void {
    this.activeDialogNPC = npc;
    this.isDialogOpen = true;
    this.dialogOpenTime = Date.now();
    AudioEngine.playButtonClick();
  }

  public closeDialog(): void {
    this.activeDialogNPC = null;
    this.isDialogOpen = false;
  }

  /**
   * Cek collision terhadap bangunan fisik desa (Rumah, Balai, Kedai, Air Mancur)
   */
  public checkCollision(box: { x: number; y: number; width: number; height: number }): boolean {
    const ts = CONSTANTS.TILE_SIZE;

    // 1. Air Mancur Alun-alun Desa (Center: 50*ts + 16, 52*ts + 16)
    const fx = 49.5 * ts;
    const fy = 51.5 * ts;
    const fw = 42;
    const fh = 42;
    if (box.x < fx + fw && box.x + box.width > fx && box.y < fy + fh && box.y + box.height > fy) {
      return true;
    }

    // 2. Balai Desa / Rumah Kakek Aldrich (Barat Laut: 43*ts, 44*ts)
    const h1x = 42.5 * ts;
    const h1y = 43 * ts;
    const h1w = 76;
    const h1h = 64;
    if (box.x < h1x + h1w && box.x + box.width > h1x && box.y < h1y + h1h && box.y + box.height > h1y + 24) {
      return true;
    }

    // 3. Toko Bunga Lily (Timur Laut: 56.5*ts, 43*ts)
    const h2x = 56 * ts;
    const h2y = 43 * ts;
    const h2w = 74;
    const h2h = 64;
    if (box.x < h2x + h2w && box.x + box.width > h2x && box.y < h2y + h2h && box.y + box.height > h2y + 24) {
      return true;
    }

    // 4. Kedai Petualang Oakhaven (Tenggara: 56*ts, 51.5*ts)
    const h3x = 56 * ts;
    const h3y = 51 * ts;
    const h3w = 78;
    const h3h = 66;
    if (box.x < h3x + h3w && box.x + box.width > h3x && box.y < h3y + h3h && box.y + box.height > h3y + 24) {
      return true;
    }

    // 5. Pagar Kayu Pembatas Desa
    const f1x = 45 * ts;
    const f1y = 42 * ts;
    if (box.x < f1x + 32 && box.x + box.width > f1x && box.y < f1y + 8 && box.y + box.height > f1y) return true;

    return false;
  }

  public handleTouch(
    touchX: number,
    touchY: number,
    screenWidth: number,
    screenHeight: number,
    player: Player,
    floatingText: FloatingTextManager
  ): boolean {
    if (!this.isDialogOpen || !this.activeDialogNPC) return false;

    // Prevent immediate accidental clicks upon opening
    if (Date.now() - this.dialogOpenTime < 180) {
      return true;
    }

    const modalWidth = Math.min(500, screenWidth - 24);
    const modalHeight = Math.min(260, screenHeight - 20);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // 1. Close Button (X)
    if (
      touchX >= modalX + modalWidth - 36 &&
      touchX <= modalX + modalWidth - 4 &&
      touchY >= modalY + 4 &&
      touchY <= modalY + 36
    ) {
      this.closeDialog();
      AudioEngine.playButtonClick();
      return true;
    }

    // 2. Quest Actions Button
    if (this.activeDialogNPC.roleType === 'QUEST' && this.activeDialogNPC.questId) {
      const q = this.questManager.quests.find((item) => item.id === this.activeDialogNPC!.questId);
      if (q) {
        const btnW = 160;
        const btnH = 32;
        const btnX = modalX + (modalWidth - btnW) / 2;
        const btnY = modalY + modalHeight - 44;

        if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
          if (q.status === 'AVAILABLE') {
            this.questManager.acceptQuest(q.id);
            floatingText.spawn(player.x + 10, player.y - 20, `📜 Misi Diterima: ${q.title}!`, '#38bdf8', 3.0);
            this.closeDialog();
            return true;
          } else if (q.status === 'COMPLETED') {
            this.questManager.turnInQuest(q.id, player, floatingText);
            this.closeDialog();
            return true;
          } else if (q.status === 'ACTIVE' || q.status === 'TURNED_IN') {
            this.closeDialog();
            return true;
          }
        }
      }
    } else {
      // Ambient NPC: Button [Mengerti / Tutup]
      const btnW = 130;
      const btnH = 30;
      const btnX = modalX + (modalWidth - btnW) / 2;
      const btnY = modalY + modalHeight - 42;

      if (touchX >= btnX && touchX <= btnX + btnW && touchY >= btnY && touchY <= btnY + btnH) {
        this.closeDialog();
        AudioEngine.playButtonClick();
        return true;
      }
    }

    // Tap outside to close
    if (
      touchX < modalX ||
      touchX > modalX + modalWidth ||
      touchY < modalY ||
      touchY > modalY + modalHeight
    ) {
      this.closeDialog();
      AudioEngine.playButtonClick();
      return true;
    }

    return true; // Swallow touch while dialog is open
  }

  /**
   * Render seluruh dekorasi bangunan pedesaan khusus & arsitektur Balai Serikat Guild
   */
  public renderEnvironment(ctx: CanvasRenderingContext2D, playerCenterX: number, playerCenterY: number): void {
    const ts = CONSTANTS.TILE_SIZE;
    ctx.save();

    // 1. ARSITEKTUR BALAI BESAR SERIKAT GUILD (Tepat di tengah desa: 50*ts, 48*ts)
    const gx = 50 * ts - 24;
    const gy = 47 * ts - 8;
    const gw = 80;
    const gh = 52;

    // Guild Grand Wooden Flooring
    ctx.fillStyle = '#451a03';
    ctx.fillRect(gx - 4, gy + 14, gw + 8, gh - 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gx - 2, gy + 16, gw + 4, gh - 14);

    // Carved Guild Stone Pillars
    const pillY = gy + 14;
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx - 2, pillY, 8, gh - 14);
    ctx.fillRect(gx + gw - 6, pillY, 8, gh - 14);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(gx, pillY, 4, gh - 14);
    ctx.fillRect(gx + gw - 4, pillY, 4, gh - 14);

    // Guild Roof Eaves & Canopy (Royal Blue with Golden Trim)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(gx - 8, gy + 18);
    ctx.lineTo(gx + gw / 2, gy - 6);
    ctx.lineTo(gx + gw + 8, gy + 18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Guild Royal Emblem Ribbon
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(gx + 12, gy + 14, gw - 24, 7);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ SERIKAT GUILD OAKHAVEN ★', gx + gw / 2, gy + 19.5);

    // Papan Pengumuman Misi Serikat (Notice Board) di kanan
    const nbX = 53 * ts + 18;
    const nbY = 48 * ts + 4;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(nbX, nbY, 18, 22);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(nbX + 2, nbY + 2, 14, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(nbX + 4, nbY + 4, 4, 5); // Quest paper 1
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(nbX + 9, nbY + 4, 5, 5); // Quest paper 2
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(nbX + 4, nbY + 10, 8, 4); // Boss notice
    ctx.fillStyle = '#451a03';
    ctx.fillRect(nbX + 7, nbY + 16, 4, 10); // Wooden leg

    // 2. AIR MANCUR ALUN-ALUN PUSAT DESA (Central Village Fountain: 50*ts, 52*ts)
    const fx = 50 * ts + 16;
    const fy = 52 * ts + 16;

    // Stone Cobblestone Base Ring
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(fx, fy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Outer Stone Basin Rim
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(fx, fy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling Blue Pool Water
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(fx, fy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Animated Fountain Ripples
    const wave = Math.sin(this.animTimer) * 2;
    ctx.fillStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.beginPath();
    ctx.arc(fx, fy, 10 + wave, 0, Math.PI * 2);
    ctx.stroke();

    // Fountain Center Spire & Spray
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx - 1, fy - 6 - Math.abs(wave), 2, 4);

    // 3. BALAI DESA / RUMAH TETUA ALDRICH (Barat Laut: 43*ts, 44*ts)
    const h1x = 42.5 * ts;
    const h1y = 43 * ts;
    this.drawCottage(ctx, h1x, h1y, 76, 64, '#991b1b', '#b45309', 'Balai Desa Aldrich');

    // 4. TOKO BUNGA LILY (Timur Laut: 56*ts, 43*ts)
    const h2x = 56 * ts;
    const h2y = 43 * ts;
    this.drawCottage(ctx, h2x, h2y, 74, 64, '#15803d', '#d97706', 'Toko Bunga Lily');

    // 5. KEDAI & PENGINAPAN PETUALANG (Tenggara: 56*ts, 51*ts)
    const h3x = 56 * ts;
    const h3y = 51 * ts;
    this.drawCottage(ctx, h3x, h3y, 78, 66, '#78350f', '#ca8a04', 'Kedai Petualang');

    // Bangku santai luar kedai di mana Bucky duduk
    ctx.fillStyle = '#92400e';
    ctx.fillRect(55 * ts + 4, 53 * ts + 10, 24, 7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(55 * ts + 6, 53 * ts + 17, 3, 5);
    ctx.fillRect(55 * ts + 23, 53 * ts + 17, 3, 5);

    // 6. GERBANG SELATAN DESA (South Village Gate: 50*ts, 56*ts)
    const gxGate = 50 * ts - 18;
    const gyGate = 56 * ts - 6;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(gxGate - 6, gyGate, 8, 38);
    ctx.fillRect(gxGate + 54, gyGate, 8, 38);
    // Arch Beam
    ctx.fillStyle = '#92400e';
    ctx.fillRect(gxGate - 8, gyGate - 4, 72, 8);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GERBANG DESA OAKHAVEN', gxGate + 28, gyGate + 2);

    // 7. LENTERA JALAN ALUN-ALUN (4 Plaza Streetlamps dengan ambient glow)
    const lamps = [
      { x: 47 * ts + 8, y: 46 * ts },
      { x: 53 * ts + 24, y: 46 * ts },
      { x: 47 * ts + 8, y: 54 * ts },
      { x: 53 * ts + 24, y: 54 * ts }
    ];
    for (const l of lamps) {
      this.drawStreetlamp(ctx, l.x, l.y);
    }

    // 8. RENDER SELURUH NPC DESA (Quest & Pajangan)
    for (const npc of this.npcs) {
      this.renderNPC(ctx, npc, playerCenterX, playerCenterY);
    }

    ctx.restore();
  }

  private drawCottage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    roofColor: string,
    wallColor: string,
    nameTag: string
  ): void {
    // Stone foundation
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

    // Wooden timber walls
    ctx.fillStyle = wallColor;
    ctx.fillRect(x + 4, y + 20, w - 8, h - 28);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 4, y + 20, 4, h - 28);
    ctx.fillRect(x + w - 8, y + 20, 4, h - 28);

    // Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + w / 2 - 8, y + h - 26, 16, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + w / 2 + 3, y + h - 14, 2, 2); // Doorknob

    // Shuttered Windows
    ctx.fillStyle = '#fde047'; // Warm glowing window
    ctx.fillRect(x + 12, y + 28, 12, 12);
    ctx.fillRect(x + w - 24, y + 28, 12, 12);
    ctx.fillStyle = '#78350f';
    ctx.strokeRect(x + 12, y + 28, 12, 12);
    ctx.strokeRect(x + w - 24, y + 28, 12, 12);

    // Pitched Roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 22);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 4, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Chimney with animated smoke
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + w - 16, y - 6, 8, 14);
    const smokeBob = Math.sin(this.animTimer + x) * 2;
    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.beginPath();
    ctx.arc(x + w - 12 + smokeBob, y - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Signpost Plaque
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 6, y + h - 4, w - 12, 12);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(x + 6, y + h - 4, w - 12, 12);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(nameTag, x + w / 2, y + h + 4);
  }

  private drawStreetlamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Lamp pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 2, y, 4, 22);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 4, y + 20, 8, 3);

    // Lantern Bracket & Glass
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y - 4, 8, 5);

    // Warm radial glow
    const flicker = Math.sin(this.animTimer * 1.5 + x) * 2;
    const grad = ctx.createRadialGradient(x, y - 1, 2, x, y - 1, 22 + flicker);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 1, 22 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Lantern core bulb
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  private renderNPC(ctx: CanvasRenderingContext2D, npc: VillageNPCData, playerCenterX: number, playerCenterY: number): void {
    const x = Math.floor(npc.x);
    const y = Math.floor(npc.y);
    const isNear = Math.hypot(npc.x + npc.width / 2 - playerCenterX, npc.y + npc.height / 2 - playerCenterY) < 38;

    ctx.save();

    if (npc.isCat) {
      // Kucing Mimi (Animasi Lucu)
      const tailWag = Math.sin(this.animTimer * 2) * 3;
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 4, y + 8, 14, 8); // Badan
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y + 10, 8, 5); // Perut putih
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 14, y + 4, 8, 8); // Kepala
      // Telinga
      ctx.fillRect(x + 14, y + 2, 3, 3);
      ctx.fillRect(x + 19, y + 2, 3, 3);
      // Mata & Hidung
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 19, y + 6, 2, 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x + 21, y + 8, 1, 1);
      // Ekor meliuk
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 2, y + 6 + tailWag * 0.5, 3, 5);
    } else {
      // NPC Humanoid (Pixel Art Rapi)
      // 1. Kaki / Sepatu
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 9, y + 24, 4, 6);
      ctx.fillRect(x + 17, y + 24, 4, 6);

      // 2. Busana / Zirah Utama
      ctx.fillStyle = npc.outfitColor;
      ctx.fillRect(x + 8, y + 12, 14, 13);

      // 3. Wajah & Kulit
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x + 9, y + 5, 12, 8);

      // 4. Mata
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 12, y + 8, 2, 2);
      ctx.fillRect(x + 17, y + 8, 2, 2);

      // 5. Rambut / Topi / Mahkota
      ctx.fillStyle = npc.hairColor;
      ctx.fillRect(x + 8, y + 2, 14, 5);
      if (npc.hairColor === '#f8fafc') {
        // Janggut putih tetua
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x + 11, y + 11, 8, 6);
      }

      // Aksesoris Karakter (Senjata / Tongkat / Keranjang)
      if (npc.id === 'galahad') {
        // Pedang ksatria
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 23, y + 8, 2, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 21, y + 12, 6, 2);
      } else if (npc.id === 'kaelen') {
        // Busur panah di punggung
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 5, y + 6, 2, 18);
      } else if (npc.id === 'ignis') {
        // Staf sihir kristal
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 23, y + 4, 2, 22);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(x + 24, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.id === 'aldrich') {
        // Tongkat jalan kayu
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 23, y + 10, 2, 18);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(x + 22, y + 9, 4, 2);
      }
    }

    // Nama & Gelap di atas kepala
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    const labelY = y - 6;
    ctx.strokeText(npc.name, x + npc.width / 2, labelY);
    ctx.fillStyle = npc.roleType === 'QUEST' ? '#fde047' : '#f8fafc';
    ctx.fillText(npc.name, x + npc.width / 2, labelY);

    // Indikator Interaksi Prompt [A] saat dekat
    if (isNear) {
      const bob = Math.sin(this.animTimer) * 2;
      const promptY = y - 18 + bob;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(x + npc.width / 2 - 40, promptY - 10, 80, 14);
      ctx.strokeStyle = npc.accentColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + npc.width / 2 - 40, promptY - 10, 80, 14);

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(npc.actionPrompt, x + npc.width / 2, promptY);
    }

    ctx.restore();
  }

  /**
   * Render RPG Dialog Modal di layar saat pemain berinteraksi dengan salah satu NPC
   */
  public renderDialogModal(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.isDialogOpen || !this.activeDialogNPC) return;

    ctx.save();
    const npc = this.activeDialogNPC;

    const modalWidth = Math.min(500, screenWidth - 24);
    const modalHeight = Math.min(260, screenHeight - 20);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Modal Box Frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 10);
    ctx.fill();

    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header Ribbon
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 2, modalY + 2, modalWidth - 4, 30);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${npc.avatarIcon} ${npc.name}`, modalX + 14, modalY + 17);

    ctx.fillStyle = npc.accentColor;
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`[${npc.title}]`, modalX + modalWidth - 40, modalY + 17);

    // Close button (X)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(modalX + modalWidth - 18, modalY + 17, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 17);

    // Content: Portrait Left, Speech & Quest Right
    const portSize = 64;
    const portX = modalX + 16;
    const portY = modalY + 44;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(portX, portY, portSize, portSize);

    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.avatarIcon, portX + portSize / 2, portY + portSize / 2);

    // Speech Text on Right
    const textX = portX + portSize + 14;
    const textW = modalWidth - portSize - 44;
    let textY = modalY + 44;

    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic bold 10.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    CanvasText.drawWrappedText(ctx, `"${npc.greetingText}"`, textX, textY, textW, 14, 2);
    textY += 32;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    CanvasText.drawWrappedText(ctx, npc.loreText, textX, textY, textW, 13, 4);

    // --- QUEST NPC PANEL KHUSUS ---
    if (npc.roleType === 'QUEST' && npc.questId) {
      const q = this.questManager.quests.find((item) => item.id === npc.questId);
      if (q) {
        const qBoxY = modalY + 138;
        const qBoxW = modalWidth - 32;
        const qBoxX = modalX + 16;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(qBoxX, qBoxY, qBoxW, 58);
        ctx.strokeStyle = q.themeColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(qBoxX, qBoxY, qBoxW, 58);

        // Quest Title & Badge
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`📜 Misi: ${q.title}`, qBoxX + 10, qBoxY + 8);

        let statusText = 'TERSEDIA';
        let statusColor = '#38bdf8';
        if (q.status === 'ACTIVE') {
          statusText = `SEDANG BERJALAN (${q.currentCount}/${q.requiredCount})`;
          statusColor = '#facc15';
        } else if (q.status === 'COMPLETED') {
          statusText = '★ SELESAI! SIAP KLAIM HADIAH';
          statusColor = '#4ade80';
        } else if (q.status === 'TURNED_IN') {
          statusText = '✓ TELAH DISELESAIKAN';
          statusColor = '#94a3b8';
        }

        ctx.fillStyle = statusColor;
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`[${statusText}]`, qBoxX + qBoxW - 10, qBoxY + 8);

        // Quest Target & Rewards
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Target: Basmi ${q.requiredCount} ${q.targetName}`, qBoxX + 10, qBoxY + 24);
        ctx.fillStyle = '#fde047';
        ctx.fillText(`Hadiah: +${q.rewardGold} Emas, +${q.rewardExp} EXP`, qBoxX + 10, qBoxY + 38);

        // Action Button: Terima / Klaim / Tutup
        const btnW = 160;
        const btnH = 30;
        const btnX = modalX + (modalWidth - btnW) / 2;
        const btnY = modalY + modalHeight - 42;

        let btnLabel = 'TERIMA MISI INI';
        let btnBg = '#16a34a';
        let btnBorder = '#4ade80';

        if (q.status === 'ACTIVE') {
          btnLabel = 'MISI SEDANG BERJALAN';
          btnBg = '#ca8a04';
          btnBorder = '#fef08a';
        } else if (q.status === 'COMPLETED') {
          btnLabel = '🎁 KLAIM SEMUA HADIAH!';
          btnBg = '#0284c7';
          btnBorder = '#38bdf8';
        } else if (q.status === 'TURNED_IN') {
          btnLabel = '✓ MISI SELESAI (TUTUP)';
          btnBg = '#334155';
          btnBorder = '#64748b';
        }

        ctx.fillStyle = btnBg;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = btnBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);
      }
    } else {
      // Ambient NPC: Button Tutup / Mengerti
      const btnW = 140;
      const btnH = 30;
      const btnX = modalX + (modalWidth - btnW) / 2;
      const btnY = modalY + modalHeight - 44;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = npc.accentColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕ MENGERTI / TUTUP', btnX + btnW / 2, btnY + btnH / 2);
    }

    ctx.restore();
  }
}
