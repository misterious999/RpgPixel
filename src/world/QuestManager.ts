import { MonsterType } from '../entities/Monster.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'TURNED_IN';
export type QuestCategory = 'OVERWORLD' | 'DUNGEON' | 'BOSS' | 'ANIME_ARC';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  giver: string;
  description: string;
  targetType: 'KILL_MONSTER' | 'COLLECT_ITEM';
  targetMonsterType?: MonsterType;
  targetMonsterTypes?: MonsterType[];
  targetItemId?: string;
  targetName: string;
  currentCount: number;
  requiredCount: number;
  rewardGold: number;
  rewardVal?: number; // Mata uang Val Kerajaan
  rewardExp: number;
  rewardItems?: { itemId: string; count: number }[];
  status: QuestStatus;
  badge: string;
  themeColor: string;
  arcTitle?: string;
}

export const INITIAL_QUESTS: Quest[] = [
  // =========================================================================
  // ARC I: PEMBUKTIAN PETUALANG & LISENSI SERIKAT (ADVENTURER GUILD RITE)
  // =========================================================================
  {
    id: 'Q_FOREST_SLIME',
    title: '[Arc I] Perburuan Slime Lembah',
    category: 'ANIME_ARC',
    giver: 'Kapten Galahad',
    description: 'Kawanan Slime Hutan tingkat bawah berkembang biak di rimba luar perbatasan. Basmi 4 Slime Hutan untuk membuktikan kelayakanmu sebagai petualang!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'FOREST_SLIME',
    targetName: 'Slime Hutan',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 60,
    rewardExp: 120,
    rewardItems: [{ itemId: 'HEALTH_POTION', count: 2 }],
    status: 'AVAILABLE',
    badge: 'ARC I · PEMULA',
    themeColor: '#22c55e',
    arcTitle: 'ARC I: KELAHIRAN PAHLAWAN BARU'
  },
  {
    id: 'Q_WILD_WOLF',
    title: '[Arc I] Ancaman Rimba Serigala Hitam',
    category: 'ANIME_ARC',
    giver: 'Ranger Kaelen',
    description: 'Kawanan Serigala Rimba mengintai di hutan lebat dekat gerbang dungeon. Kalahkan 3 Serigala Rimba demi keselamatan para pengelana.',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'WILD_WOLF',
    targetName: 'Serigala Rimba',
    currentCount: 0,
    requiredCount: 3,
    rewardGold: 0,
    rewardVal: 90,
    rewardExp: 180,
    rewardItems: [{ itemId: 'MANA_POTION', count: 2 }],
    status: 'AVAILABLE',
    badge: 'ARC I · MENENGAH',
    themeColor: '#f59e0b',
    arcTitle: 'ARC I: KELAHIRAN PAHLAWAN BARU'
  },

  // =========================================================================
  // ARC II: MISTERI GOA PURBA & RAJA MAKAM KUNO (THE ANCIENT CATACOMBS ARC)
  // =========================================================================
  {
    id: 'Q_DUNGEON_BAT',
    title: '[Arc II] Eksplorasi Goa Abisal',
    category: 'ANIME_ARC',
    giver: 'Cendekiawan Ignis',
    description: 'Goa bawah tanah Lantai 1 dipenuhi kelelawar gua purba dan aura dingin. Jelajahi goa terdalam dan basmi 4 Kelelawar Gua.',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BAT',
    targetName: 'Kelelawar Gua',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 120,
    rewardExp: 220,
    rewardItems: [{ itemId: 'DARK_IRON_ORE', count: 3 }],
    status: 'AVAILABLE',
    badge: 'ARC II · GOA',
    themeColor: '#a855f7',
    arcTitle: 'ARC II: MISTERI MAKAM PURBA'
  },
  {
    id: 'Q_BOSS_SLIME',
    title: '[Arc II] Mahkota Raja Slime Purba',
    category: 'BOSS',
    giver: 'Morgrim sang Jagal',
    description: 'Di ruang altar utara goa bersemayam Raja Slime Purba berkekuatan dahsyat. Kalahkan sang penguasa kegelapan goa untuk membuka jalan ke Lantai 2!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_SLIME',
    targetName: 'Raja Slime Purba',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 1,
    rewardVal: 200,
    rewardExp: 450,
    rewardItems: [
      { itemId: 'DUNGEON_GEM', count: 2 },
      { itemId: 'HEALTH_POTION', count: 2 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC II · BOS GOA',
    themeColor: '#ec4899',
    arcTitle: 'ARC II: MISTERI MAKAM PURBA'
  },

  // =========================================================================
  // ARC III: MESIN TEMPUR PURBA & TITAN ABISAL (TITAN GOLEM ARC - FLOOR 2)
  // =========================================================================
  {
    id: 'Q_ARC_TITAN_SCOUT',
    title: '[Arc III] Penjaga Makam Reruntuhan Abisal',
    category: 'ANIME_ARC',
    giver: 'Kapten Galahad',
    description: 'Reruntuhan Makam Kuno Lantai 2 dipatroli oleh Golem Batu Kuno dan Bayangan Makam. Basmi 4 monster penjaga reruntuhan.',
    targetType: 'KILL_MONSTER',
    targetMonsterTypes: ['STONE_GOLEM', 'CRYPT_SHADOW'],
    targetName: 'Golem Batu / Bayangan Makam',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 160,
    rewardExp: 350,
    rewardItems: [{ itemId: 'ANCIENT_BONE', count: 3 }],
    status: 'AVAILABLE',
    badge: 'ARC III · ELIT',
    themeColor: '#38bdf8',
    arcTitle: 'ARC III: MESIN TEMPUR PURBA'
  },
  {
    id: 'Q_ARC_BOSS_TITAN',
    title: '[Arc III] Penghancur Titan Abisal Lantai 2',
    category: 'BOSS',
    giver: 'Morgrim sang Jagal',
    description: 'Di ruang tahta reruntuhan Lantai 2, bangkitlah Bos Raksasa Titan Golem dengan serangan getaran seismik. Tumbangkan sang titan untuk membuka portal neraka Lantai 3!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_TITAN_GOLEM',
    targetName: 'Titan Abisal Kolosal',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 2,
    rewardVal: 300,
    rewardExp: 700,
    rewardItems: [
      { itemId: 'DUNGEON_GEM', count: 3 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC III · BOS TITAN',
    themeColor: '#ef4444',
    arcTitle: 'ARC III: MESIN TEMPUR PURBA'
  },

  // =========================================================================
  // ARC IV: MURKA SANG RAJA NAGA API IGNIS (INFERNAL DRAGON ARC - FLOOR 3)
  // =========================================================================
  {
    id: 'Q_ARC_HELL_SCOUT',
    title: '[Arc IV] Barisan Pasukan Neraka Abisal',
    category: 'ANIME_ARC',
    giver: 'Cendekiawan Ignis',
    description: 'Sanctuarium Neraka Lantai 3 dipenuhi Anjing Neraka Lahar dan Ksatria Abisal Api. Kalahkan 4 monster pasukan neraka.',
    targetType: 'KILL_MONSTER',
    targetMonsterTypes: ['INFERNO_HELLHOUND', 'INFERNAL_KNIGHT', 'ABYSSAL_REAPER'],
    targetName: 'Pasukan Neraka Abisal',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 220,
    rewardExp: 450,
    rewardItems: [{ itemId: 'DARK_IRON_ORE', count: 4 }],
    status: 'AVAILABLE',
    badge: 'ARC IV · NERAKA',
    themeColor: '#f97316',
    arcTitle: 'ARC IV: MURKA RAJA NAGA API'
  },
  {
    id: 'Q_ARC_BOSS_DRAGON',
    title: '[Arc IV] Penaklukan Raja Naga Api Ignis',
    category: 'BOSS',
    giver: 'Resepsionis Guild Elaine',
    description: 'Di puncak kawah lahar Lantai 3, bersemayam Raja Naga Api Ignis sang penguasa kobaran neraka abisal. Taklukkan sang naga legendaris demi kejayaan seluruh negeri!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_INFERNAL_DRAGON',
    targetName: 'Raja Naga Api Ignis',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 3,
    rewardVal: 500,
    rewardExp: 1200,
    rewardItems: [
      { itemId: 'ELIXIR_FULL', count: 1 },
      { itemId: 'DUNGEON_GEM', count: 4 },
      { itemId: 'PLATINUM_COIN', count: 1 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC IV · BOS NAGA',
    themeColor: '#e11d48',
    arcTitle: 'ARC IV: MURKA RAJA NAGA API'
  },

  // =========================================================================
  // ARC V: MISTERI SUCI KUIL ROH HUTAN ELDORIA (SYLVAN TEMPLE ARC)
  // =========================================================================
  {
    id: 'Q_ARC_ELDORIA_SANCTUARY',
    title: '[Arc V] Pemurnian Hutan Roh Peri Eldoria',
    category: 'ANIME_ARC',
    giver: 'Elder Sylas',
    description: 'Kuil Roh Hutan Eldoria dirasuki hawa jahat sehingga Sprite Rimba dan Prajurit Pohon mengamuk. Basmi 4 monster roh terkorupsi.',
    targetType: 'KILL_MONSTER',
    targetMonsterTypes: ['SYLVAN_SPRITE', 'VINE_CREEPER', 'TREANT_WARRIOR'],
    targetName: 'Roh Pohon / Sprite Terkorupsi',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 220,
    rewardExp: 450,
    rewardItems: [{ itemId: 'MAGIC_FLOWER', count: 4 }],
    status: 'AVAILABLE',
    badge: 'ARC V · PERI',
    themeColor: '#10b981',
    arcTitle: 'ARC V: RAHASIA KUIL ROH ELDORIA'
  },
  {
    id: 'Q_ARC_BOSS_ENT',
    title: '[Arc V] Penundukan Raksasa Ent Purba',
    category: 'BOSS',
    giver: 'Elder Sylas',
    description: 'Di altar suci kuil Eldoria, bangkitlah Bos Raksasa Ent Purba berkekuatan akar bumi raksasa. Tundukkan sang ent untuk mengembalikan berkah peri abadi!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_ANCIENT_ENT',
    targetName: 'Raksasa Ent Purba Eldoria',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 2,
    rewardVal: 400,
    rewardExp: 900,
    rewardItems: [
      { itemId: 'DUNGEON_GEM', count: 3 },
      { itemId: 'PLATINUM_COIN', count: 1 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC V · BOS ENT',
    themeColor: '#059669',
    arcTitle: 'ARC V: RAHASIA KUIL ROH ELDORIA'
  },

  // =========================================================================
  // ARC VI: KUTUKAN TAMBANG BESI KURCACI STONEWATCH (STONEWATCH MINE ARC)
  // =========================================================================
  {
    id: 'Q_ARC_MINE_RECON',
    title: '[Arc VI] Pembebasan Tambang Granit Abisal',
    category: 'ANIME_ARC',
    giver: 'Kapten Borin',
    description: 'Kedalaman Tambang Stonewatch dihantui Golem Zirah Besi dan Laba-Laba Kristal. Bebaskan lorong tambang dengan membasmi 4 monster zirah.',
    targetType: 'KILL_MONSTER',
    targetMonsterTypes: ['ARMORED_GOLEM', 'IRONCLAD_SKELETON', 'CRYSTAL_SPIDER'],
    targetName: 'Golem Besi / Laba-Laba Kristal',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 0,
    rewardVal: 240,
    rewardExp: 500,
    rewardItems: [{ itemId: 'DARK_IRON_ORE', count: 5 }],
    status: 'AVAILABLE',
    badge: 'ARC VI · TAMBANG',
    themeColor: '#8b5cf6',
    arcTitle: 'ARC VI: KUTUKAN TAMBANG STONEWATCH'
  },
  {
    id: 'Q_ARC_BOSS_BEHEMOTH',
    title: '[Arc VI] Penghancur Behemoth Obsidian Abisal',
    category: 'BOSS',
    giver: 'Master Grimm',
    description: 'Di ruang tungku magma terdalam tambang kurcaci bersemayam Bos Behemoth Obsidian bertanduk batu tajam. Hancurkan monster batu abisal itu demi keselamatan benteng!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_OBSIDIAN_BEHEMOTH',
    targetName: 'Behemoth Obsidian Abisal',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 3,
    rewardVal: 500,
    rewardExp: 1100,
    rewardItems: [
      { itemId: 'DUNGEON_GEM', count: 4 },
      { itemId: 'PLATINUM_COIN', count: 1 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC VI · BOS TAMBANG',
    themeColor: '#7c3aed',
    arcTitle: 'ARC VI: KUTUKAN TAMBANG STONEWATCH'
  },

  // =========================================================================
  // ARC VII: PUSAKA PENEMPAAN MAHA KARYA BINTANG (LEGENDARY RELIC FORGING ARC)
  // =========================================================================
  {
    id: 'Q_ARC_COLLECT_GEMS',
    title: '[Arc VII] Inti Kristal Pusaka Bintang Dewata',
    category: 'ANIME_ARC',
    giver: 'Master Brokk',
    description: 'Untuk menempa senjata pusaka sakti tingkat anime, Master Brokk memerlukan 4 Permata Kristal Abisal murni dari peti atau bos dungeon.',
    targetType: 'COLLECT_ITEM',
    targetItemId: 'DUNGEON_GEM',
    targetName: 'Permata Kristal Abisal',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 1,
    rewardVal: 300,
    rewardExp: 600,
    rewardItems: [
      { itemId: 'DARK_IRON_ORE', count: 6 },
      { itemId: 'PORTAL_SCROLL', count: 1 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC VII · PUSAKA',
    themeColor: '#facc15',
    arcTitle: 'ARC VII: MAHA KARYA PUSAKA BINTANG'
  },

  // =========================================================================
  // ARC VIII: SUMPAH JAMUAN PERSAHABATAN PARTAI (ADVENTURER BANQUET ARC)
  // =========================================================================
  {
    id: 'Q_ARC_PARTY_FEAST',
    title: '[Arc VIII] Pesta Jamuan Sup Petualang Agung',
    category: 'ANIME_ARC',
    giver: 'Chef Gaston',
    description: 'Merayakan pencapaian penaklukan berbagai dungeon bersama rekan partai, Chef Gaston butuh 3 Daging Serigala Segar untuk merebus sup bergizi tinggi.',
    targetType: 'COLLECT_ITEM',
    targetItemId: 'WOLF_MEAT',
    targetName: 'Daging Serigala Segar',
    currentCount: 0,
    requiredCount: 3,
    rewardGold: 0,
    rewardVal: 180,
    rewardExp: 350,
    rewardItems: [
      { itemId: 'HEALTH_POTION', count: 2 },
      { itemId: 'MANA_POTION', count: 2 }
    ],
    status: 'AVAILABLE',
    badge: 'ARC VIII · IKATAN',
    themeColor: '#fb923c',
    arcTitle: 'ARC VIII: SUMPAH PERSAHABATAN PARTAI'
  }
];

export class QuestManager {
  public quests: Quest[] = [];
  public onQuestTurnedIn?: (quest: Quest) => void;

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
  }

  /**
   * Menerima misi petualang
   */
  public acceptQuest(questId: string): boolean {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.status !== 'AVAILABLE') return false;
    q.status = 'ACTIVE';
    AudioEngine.playButtonClick();
    return true;
  }

  /**
   * Dipanggil saat monster dikalahkan oleh pemain
   */
  public onMonsterDefeated(type: MonsterType, floatingText?: FloatingTextManager, playerX: number = 0, playerY: number = 0): void {
    for (const q of this.quests) {
      if (q.status === 'ACTIVE' && q.targetType === 'KILL_MONSTER') {
        const matches = q.targetMonsterType === type || (q.targetMonsterTypes && q.targetMonsterTypes.includes(type));
        if (matches) {
          q.currentCount = Math.min(q.requiredCount, q.currentCount + 1);
          if (q.currentCount >= q.requiredCount) {
            q.status = 'COMPLETED';
            AudioEngine.playQuestComplete();
            if (floatingText) {
              floatingText.spawn(playerX + 10, playerY - 30, `📜 Misi Selesai: [${q.title}]! Lapor ke ${q.giver}.`, '#facc15', 3.5);
            }
          } else {
            if (floatingText) {
              floatingText.spawn(playerX + 10, playerY - 26, `📜 ${q.title}: (${q.currentCount}/${q.requiredCount})`, '#38bdf8', 2.0);
            }
          }
        }
      }
    }
  }

  /**
   * Memeriksa dan memperbarui kemajuan misi pengumpulan barang (COLLECT_ITEM)
   */
  public checkCollectQuests(inventory: any, floatingText?: FloatingTextManager, playerX: number = 0, playerY: number = 0): void {
    if (!inventory) return;
    for (const q of this.quests) {
      if (q.status === 'ACTIVE' && q.targetType === 'COLLECT_ITEM' && q.targetItemId) {
        const count = typeof inventory.getItemCount === 'function' ? inventory.getItemCount(q.targetItemId) : 0;
        const oldCount = q.currentCount;
        q.currentCount = Math.min(q.requiredCount, count);
        if (q.currentCount >= q.requiredCount) {
          q.status = 'COMPLETED';
          AudioEngine.playQuestComplete();
          if (floatingText) {
            floatingText.spawn(playerX + 10, playerY - 30, `📜 Misi Selesai: [${q.title}]! Lapor ke ${q.giver}.`, '#facc15', 3.5);
          }
        } else if (q.currentCount !== oldCount && floatingText) {
          floatingText.spawn(playerX + 10, playerY - 26, `📜 ${q.title}: (${q.currentCount}/${q.requiredCount})`, '#38bdf8', 2.0);
        }
      }
    }
  }

  /**
   * Menyerahkan misi dan klaim hadiah
   */
  public turnInQuest(questId: string, player: Player, floatingText: FloatingTextManager): boolean {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.status !== 'COMPLETED') return false;

    // Verifikasi & Kurangi Item jika ini misi pengumpulan
    if (q.targetType === 'COLLECT_ITEM' && q.targetItemId) {
      if (player.inventory.getItemCount(q.targetItemId) < q.requiredCount) {
        floatingText.spawn(player.x + 10, player.y - 18, `⚠️ Kamu belum memiliki cukup ${q.targetName}!`, '#ef4444', 2.5);
        return false;
      }
      player.inventory.removeItemsById(q.targetItemId, q.requiredCount);
    }

    // Klaim Hadiah
    q.status = 'TURNED_IN';
    AudioEngine.playQuestComplete();
    this.onQuestTurnedIn?.(q);

    // 1. Emas Tradisional
    if (q.rewardGold > 0) {
      player.inventory.addItem('GOLD_COIN', q.rewardGold);
      floatingText.spawn(player.x + 10, player.y - 12, `+${q.rewardGold} Koin Emas!`, '#facc15', 2.5);
    }

    // 1.5 Mata Uang Val Kerajaan (𝒱)
    if (q.rewardVal && q.rewardVal > 0) {
      player.addVal(q.rewardVal);
      floatingText.spawn(player.x + 10, player.y - 20, `+${q.rewardVal.toLocaleString()} 𝒱 Val Kerajaan!`, '#38bdf8', 2.5);
    }

    // 2. EXP
    const leveledUp = player.addExp(q.rewardExp);
    floatingText.spawn(player.x + 10, player.y - 28, `+${q.rewardExp} EXP Misi!`, '#38bdf8', 2.5);

    // 3. Item Hadiah Khusus
    if (q.rewardItems) {
      for (const rew of q.rewardItems) {
        player.inventory.addItem(rew.itemId, rew.count);
        const def = ITEM_DEFINITIONS[rew.itemId];
        const name = def ? def.name : rew.itemId;
        floatingText.spawn(player.x + 10, player.y - 36, `+${rew.count} ${name}`, '#a855f7', 2.5);
      }
    }

    if (leveledUp) {
      floatingText.spawn(player.x + 10, player.y - 48, `🎉 LEVEL UP! Lv. ${player.level}`, '#fde047', 3.5);
    }

    return true;
  }

  /**
   * Mendapatkan daftar misi aktif saat ini
   */
  public getActiveQuests(): Quest[] {
    return this.quests.filter((q) => q.status === 'ACTIVE');
  }

  /**
   * Serialisasi data misi untuk localStorage / Supabase
   */
  public serialize(): any[] {
    return this.quests.map((q) => ({
      id: q.id,
      status: q.status,
      currentCount: q.currentCount
    }));
  }

  /**
   * Deserialisasi data misi dengan fail-safe migrasi quest baru
   */
  public deserialize(savedList: any[]): void {
    if (!Array.isArray(savedList)) return;
    for (const saved of savedList) {
      const q = this.quests.find((item) => item.id === saved.id);
      if (q) {
        if (saved.status) q.status = saved.status;
        if (typeof saved.currentCount === 'number') q.currentCount = saved.currentCount;
      }
    }
  }
}
