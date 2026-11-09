import { MonsterType } from '../entities/Monster.ts';
import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'TURNED_IN';

export interface Quest {
  id: string;
  title: string;
  category: 'OVERWORLD' | 'DUNGEON' | 'BOSS';
  giver: string;
  description: string;
  targetType: 'KILL_MONSTER' | 'COLLECT_ITEM';
  targetMonsterType?: MonsterType;
  targetItemId?: string;
  targetName: string;
  currentCount: number;
  requiredCount: number;
  rewardGold: number;
  rewardExp: number;
  rewardItems?: { itemId: string; count: number }[];
  status: QuestStatus;
  badge: string;
  themeColor: string;
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'Q_FOREST_SLIME',
    title: 'Perburuan Slime Lembah',
    category: 'OVERWORLD',
    giver: 'Kapten Galahad',
    description: 'Slime liar mulai berkembang biak di padang rumput luar desa. Basmi 4 Slime Hutan untuk menjaga ketertiban perbatasan.',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'FOREST_SLIME',
    targetName: 'Slime Hutan',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 80,
    rewardExp: 100,
    rewardItems: [{ itemId: 'HEALTH_POTION', count: 2 }],
    status: 'AVAILABLE',
    badge: 'PEMULA',
    themeColor: '#22c55e'
  },
  {
    id: 'Q_WILD_WOLF',
    title: 'Ancaman Rimba Liar',
    category: 'OVERWORLD',
    giver: 'Ranger Kaelen',
    description: 'Kawanan serigala buas mengintai dari dalam hutan lebat timur desa. Kalahkan 3 Serigala Liar demi keselamatan para pengelana.',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'WILD_WOLF',
    targetName: 'Serigala Liar',
    currentCount: 0,
    requiredCount: 3,
    rewardGold: 120,
    rewardExp: 150,
    rewardItems: [{ itemId: 'MANA_POTION', count: 2 }],
    status: 'AVAILABLE',
    badge: 'MENENGAH',
    themeColor: '#f59e0b'
  },
  {
    id: 'Q_DUNGEON_BAT',
    title: 'Eksplorasi Goa Purba',
    category: 'DUNGEON',
    giver: 'Cendekiawan Ignis',
    description: 'Goa bawah tanah dipenuhi kelelawar misterius dan hawa dingin abisal. Jelajahi goa terdalam dan basmi 4 Kelelawar Gua.',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BAT',
    targetName: 'Kelelawar Gua',
    currentCount: 0,
    requiredCount: 4,
    rewardGold: 160,
    rewardExp: 200,
    rewardItems: [{ itemId: 'DARK_IRON_ORE', count: 3 }],
    status: 'AVAILABLE',
    badge: 'DUNGEON',
    themeColor: '#a855f7'
  },
  {
    id: 'Q_BOSS_SLIME',
    title: 'Tantangan Raja Goa Purba',
    category: 'BOSS',
    giver: 'Morgrim sang Jagal',
    description: 'Di ruang altar utara goa terdalam bersemayam Raja Slime Purba berkekuatan dahsyat. Kalahkan sang penguasa kegelapan goa!',
    targetType: 'KILL_MONSTER',
    targetMonsterType: 'BOSS_SLIME',
    targetName: 'Raja Slime Purba',
    currentCount: 0,
    requiredCount: 1,
    rewardGold: 400,
    rewardExp: 450,
    rewardItems: [
      { itemId: 'DUNGEON_GEM', count: 2 },
      { itemId: 'HEALTH_POTION', count: 3 }
    ],
    status: 'AVAILABLE',
    badge: 'LEGENDARIS',
    themeColor: '#ec4899'
  }
];

export class QuestManager {
  public quests: Quest[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
  }

  /**
   * Menerima misi dari Elaine
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
      if (q.status === 'ACTIVE' && q.targetType === 'KILL_MONSTER' && q.targetMonsterType === type) {
        q.currentCount = Math.min(q.requiredCount, q.currentCount + 1);
        if (q.currentCount >= q.requiredCount) {
          q.status = 'COMPLETED';
          AudioEngine.playQuestComplete();
          if (floatingText) {
            floatingText.spawn(playerX + 10, playerY - 30, `📜 Misi Selesai: [${q.title}]! Lapor ke ${q.giver} di Serikat.`, '#facc15', 3.5);
          }
        } else {
          if (floatingText) {
            floatingText.spawn(playerX + 10, playerY - 26, `📜 ${q.title}: (${q.currentCount}/${q.requiredCount})`, '#38bdf8', 2.0);
          }
        }
      }
    }
  }

  /**
   * Menyerahkan misi ke Elaine dan klaim hadiah
   */
  public turnInQuest(questId: string, player: Player, floatingText: FloatingTextManager): boolean {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.status !== 'COMPLETED') return false;

    // Klaim Hadiah
    q.status = 'TURNED_IN';
    AudioEngine.playQuestComplete();

    // 1. Emas
    player.inventory.addItem('GOLD_COIN', q.rewardGold);
    floatingText.spawn(player.x + 10, player.y - 12, `+${q.rewardGold} Koin Emas!`, '#facc15', 2.5);

    // 2. EXP
    const leveledUp = player.addExp(q.rewardExp);
    floatingText.spawn(player.x + 10, player.y - 24, `+${q.rewardExp} EXP Misi!`, '#38bdf8', 2.5);

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
   * Deserialisasi data misi
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
