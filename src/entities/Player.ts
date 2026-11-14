import { CONSTANTS } from '../core/Constants.ts';
import { InputState } from '../core/Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { ContinentValoria } from '../world/ContinentValoria.ts';
import { DungeonMap } from '../world/DungeonMap.ts';
import { DungeonFloor2 } from '../world/DungeonFloor2.ts';
import { DungeonFloor3 } from '../world/DungeonFloor3.ts';
import { DungeonEldoria } from '../world/DungeonEldoria.ts';
import { DungeonStonewatch } from '../world/DungeonStonewatch.ts';
import { DungeonPyramid } from '../world/DungeonPyramid.ts';
import { DungeonCelestia } from '../world/DungeonCelestia.ts';
import { BuildingInteriors } from '../world/BuildingInteriors.ts';
import { Inventory } from '../items/Inventory.ts';
import { CharacterCostume, RoleType, Skill, MagicianAffinities } from '../types/GameTypes.ts';
import { CHARACTER_COSTUMES, ROLE_INFO, getMagicianSkills, ELEMENT_INFO } from '../data/RolesData.ts';
import { WeaponData, WEAPONS_DATA } from '../data/WeaponsData.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';

export type Direction = 'down' | 'up' | 'left' | 'right';

export interface Minion {
  id: string;
  x: number;
  y: number;
  type: 'skeleton' | 'bear' | 'shadow';
  name: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  attackCooldown: number;
  attackTimer: number;
  direction: 'left' | 'right';
  targetMonsterId: string | null;
  speed: number;
  lifeTimer?: number;
}

export class Player {
  public x: number;
  public y: number;
  public width: number = 24;
  public height: number = 32;

  // Identity & Customization
  public username: string = 'Petualang';
  public costume: CharacterCostume = CHARACTER_COSTUMES[0];

  // RPG Stats & Progression
  public hp: number = 100;
  public maxHp: number = 100;
  public mp: number = 60;
  public maxMp: number = 60;
  private hpRegenAccumulator: number = 0;
  private mpRegenAccumulator: number = 0;
  public level: number = 1;
  public exp: number = 0;
  public maxExp: number = 50;
  public role: RoleType = 'NOVICE';
  public hasLockedRole: boolean = false;
  public skills: Skill[] = [];

  // Persenjataan Peran (Equipped & Unlocked Weapons)
  public equippedWeaponId: string | null = null;
  public unlockedWeaponIds: string[] = [];

  // Anime Currency & Banking System (Mata Uang Val & Tabungan Bank Kerajaan)
  public val: number = 300;          // Saldo Dompet Tunai Petualang (Val 𝒱)
  public bankSavings: number = 500;  // Saldo Tabungan Aman di Bank Kerajaan (Val 𝒱)

  public addVal(amount: number): void {
    if (amount <= 0) return;
    this.val += Math.floor(amount);
  }

  public removeVal(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.val < amount) return false;
    this.val -= Math.floor(amount);
    return true;
  }

  public depositToBank(amount: number): boolean {
    if (amount <= 0 || this.val < amount) return false;
    this.val -= Math.floor(amount);
    this.bankSavings += Math.floor(amount);
    return true;
  }

  public withdrawFromBank(amount: number): boolean {
    if (amount <= 0 || this.bankSavings < amount) return false;
    this.bankSavings -= Math.floor(amount);
    this.val += Math.floor(amount);
    return true;
  }

  public applyBankInterest(rate: number = 0.01): number {
    if (this.bankSavings <= 0) return 0;
    const interest = Math.max(1, Math.floor(this.bankSavings * rate));
    this.bankSavings += interest;
    return interest;
  }

  public get equippedWeapon(): WeaponData | null {
    if (!this.equippedWeaponId) return null;
    return WEAPONS_DATA[this.equippedWeaponId] || null;
  }

  public equipWeapon(weaponId: string | null): void {
    if (weaponId && !this.unlockedWeaponIds.includes(weaponId)) {
      this.unlockedWeaponIds.push(weaponId);
    }
    this.equippedWeaponId = weaponId;
  }

  // Special Magician Elemental Affinities
  public magicianAffinities: MagicianAffinities = {
    primary: 'FIRE',
    secondaries: []
  };

  // Active Buffs / Effects
  public isStealthed: boolean = false;
  public stealthTimer: number = 0;
  public isBerserk: boolean = false;
  public berserkTimer: number = 0;
  public hasBarrier: boolean = false;
  public barrierTimer: number = 0;
  public godspeedTimer: number = 0;
  public angelBlessingTimer: number = 0;
  public miracleRebirthReady: boolean = false;
  public predatorBuffTimer: number = 0;

  // Active Food Buffs (Dungeon Meshi Cooking System)
  public foodBuffAtkTimer: number = 0;       // Wolf Steak (+20% ATK)
  public foodBuffMpTimer: number = 0;        // Slime Pudding (Rapid MP Regen)
  public foodBuffExpSpeedTimer: number = 0;  // Mystic Soup (+25% Speed & +25% EXP)

  // Equipped Anime Title & Cosmetics
  public equippedTitle: string = '« Petualang Pemula »';
  public equippedTitleColor: string = '#94a3b8';

  // Swimming Mechanics (Berenang di Danau Overworld & Kolam Suci Eldoria)
  public isSwimming: boolean = false;
  private swimAnimTimer: number = 0;

  // Minions
  public minions: Minion[] = [];

  // Player Inventory
  public inventory: Inventory = new Inventory(16);

  // Adventurer Guild Rank (Anime Style: F to S-Rank)
  public get adventurerRank(): { rank: string; title: string; color: string; badge: string; bg: string; border: string; name: string } {
    if (this.level >= 22) return { rank: 'S', title: 'Petualang Legendaris', name: 'Petualang Legendaris', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: '#ec4899', badge: '👑 S-RANK' };
    if (this.level >= 17) return { rank: 'A', title: 'Petualang Platina', name: 'Petualang Platina', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: '#38bdf8', badge: '💎 A-RANK' };
    if (this.level >= 12) return { rank: 'B', title: 'Petualang Emas', name: 'Petualang Emas', color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: '#eab308', badge: '🏆 B-RANK' };
    if (this.level >= 8)  return { rank: 'C', title: 'Petualang Perak', name: 'Petualang Perak', color: '#e2e8f0', bg: 'rgba(226,232,240,0.15)', border: '#e2e8f0', badge: '🥈 C-RANK' };
    if (this.level >= 5)  return { rank: 'D', title: 'Petualang Perunggu', name: 'Petualang Perunggu', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', badge: '🥉 D-RANK' };
    if (this.level >= 3)  return { rank: 'E', title: 'Petualang Besi', name: 'Petualang Besi', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: '#94a3b8', badge: '⚔️ E-RANK' };
    return { rank: 'F', title: 'Petualang Pemula', name: 'Petualang Pemula', color: '#64748b', bg: 'rgba(100,116,139,0.15)', border: '#64748b', badge: '🔰 F-RANK' };
  }

  // Collision box relative to player (feet area)
  public collisionBox = {
    offsetX: 4,
    offsetY: 20,
    width: 16,
    height: 10
  };

  public direction: Direction = 'down';
  public isMoving: boolean = false;
  private animTimer: number = 0;
  private breathTimer: number = 0;
  public attackTimer: number = 0;
  public punchHand: 'left' | 'right' = 'right';

  // Role-Specific Skill Casting Animation State
  public castTimer: number = 0;
  public castDuration: number = 0.5;
  public castingSkill: Skill | null = null;
  public castRole: RoleType | null = null;
  private castParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
  }> = [];
  private castAfterImages: Array<{
    x: number;
    y: number;
    alpha: number;
    direction: Direction;
  }> = [];

  constructor(startX: number, startY: number, username: string = 'Petualang', costumeId: number = 0) {
    this.x = startX;
    this.y = startY;
    this.username = username.slice(0, 15);
    this.costume = CHARACTER_COSTUMES[costumeId] || CHARACTER_COSTUMES[0];

    // Starter Items
    this.inventory.addItem('HEALTH_POTION', 3);
    this.inventory.addItem('BRONZE_COIN', 5);

    this.updateSkills();
  }

  public setRole(newRole: RoleType, affinities?: MagicianAffinities, force: boolean = false): void {
    if (this.hasLockedRole && !force && this.role !== 'NOVICE') {
      console.warn('Role is locked permanently and cannot be changed.');
      return;
    }
    this.role = newRole;
    if (newRole !== 'NOVICE') {
      this.hasLockedRole = true;
    }
    if (affinities) {
      this.magicianAffinities = affinities;
    }
    this.updateSkills();
  }

  public updateSkills(): void {
    if (this.role === 'MAGICIAN') {
      const generated = getMagicianSkills(this.magicianAffinities);
      this.skills = generated.map(s => ({
        ...s,
        currentCooldown: 0
      }));
      return;
    }

    const info = ROLE_INFO[this.role];
    if (!info) {
      this.skills = [];
      return;
    }

    this.skills = info.skills.map(s => ({
      ...s,
      currentCooldown: 0
    }));
  }

  public getAvailableSkills(): Skill[] {
    return this.skills.filter(s => this.level >= s.unlockLevel);
  }

  public addExp(amount: number): boolean {
    const finalAmount = this.foodBuffExpSpeedTimer > 0 ? Math.round(amount * 1.25) : amount;
    this.exp += finalAmount;
    if (this.exp >= this.maxExp) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp(): void {
    this.level += 1;
    this.exp -= this.maxExp;
    this.maxExp = Math.floor(this.maxExp * 1.5);
    this.maxHp += 15;
    this.hp = this.maxHp;
    this.maxMp += 10;
    this.mp = this.maxMp;
    this.updateSkills();
  }

  public heal(amount: number): number {
    const prevHp = Math.round(this.hp);
    this.hp = Math.min(this.maxHp, Math.round(this.hp) + Math.round(amount));
    this.hpRegenAccumulator = 0;
    return this.hp - prevHp;
  }

  public restoreMp(amount: number): number {
    const prevMp = Math.round(this.mp);
    this.mp = Math.min(this.maxMp, Math.round(this.mp) + Math.round(amount));
    this.mpRegenAccumulator = 0;
    return this.mp - prevMp;
  }

  public consumeMp(amount: number): boolean {
    const currentMp = Math.round(this.mp);
    const cost = Math.round(amount);
    if (currentMp < cost) return false;
    this.mp = Math.max(0, currentMp - cost);
    return true;
  }

  public takeDamage(amount: number): boolean {
    if (this.godspeedTimer > 0) {
      // Auto-dodge semua serangan dengan Godspeed Reflexes
      return false;
    }
    if (this.hasBarrier) {
      amount = Math.round(amount * 0.5);
    }
    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, Math.round(this.hp) - damage);
    this.hpRegenAccumulator = 0;
    if (this.hp <= 0) {
      if (this.miracleRebirthReady) {
        this.miracleRebirthReady = false;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        return false;
      }
      this.die();
      return true;
    }
    return false;
  }

  public die(): void {
    // Respawn di Guild Plaza (dekat Resepsionis Elaine)
    this.x = 50 * CONSTANTS.TILE_SIZE;
    this.y = 50 * CONSTANTS.TILE_SIZE;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.hpRegenAccumulator = 0;
    this.mpRegenAccumulator = 0;
    this.isStealthed = false;
    this.stealthTimer = 0;
    this.isBerserk = false;
    this.berserkTimer = 0;
    // PENTING: Role, hasLockedRole, dan Kartu Petualang tidak pernah hilang atau direset walau mati!
  }

  public getAttackHitbox(): { x: number; y: number; width: number; height: number } | null {
    if (this.attackTimer <= 0) return null;
    const reach = 24;
    if (this.direction === 'right') {
      return { x: this.x + 18, y: this.y + 2, width: reach, height: 26 };
    } else if (this.direction === 'left') {
      return { x: this.x - reach + 4, y: this.y + 2, width: reach, height: 26 };
    } else if (this.direction === 'down') {
      return { x: this.x + 2, y: this.y + 18, width: 24, height: reach };
    } else {
      return { x: this.x + 2, y: this.y - reach + 6, width: 24, height: reach };
    }
  }

  public getAttackDamage(): { damage: number; isCrit: boolean } {
    let baseDmg = 12 + this.level * 2;
    let weaponAtk = 0;
    let weaponCrit = 0;

    const weapon = this.equippedWeapon;
    if (weapon) {
      weaponAtk = weapon.atkBonus || 0;
      weaponCrit = weapon.critBonus || 0;
    }

    if (this.role === 'KNIGHT') {
      baseDmg = 24 + this.level * 4 + weaponAtk;
      if (this.isBerserk) baseDmg *= 1.5;
    } else if (this.role === 'ASSASSIN') {
      baseDmg = 20 + this.level * 3.5 + weaponAtk;
      const totalCritChance = 0.35 + weaponCrit;
      const isCrit = Math.random() < totalCritChance;
      if (isCrit) return { damage: Math.round(baseDmg * 2.2), isCrit: true };
    } else if (this.role === 'MAGICIAN') {
      baseDmg = 16 + this.level * 3 + weaponAtk;
    } else if (this.role === 'HEALER') {
      baseDmg = 14 + this.level * 2.5 + weaponAtk;
    } else if (this.role === 'NECROMANCER') {
      baseDmg = 18 + this.level * 3 + weaponAtk;
    } else {
      // NOVICE
      baseDmg = 12 + this.level * 2 + weaponAtk;
    }

    if (this.predatorBuffTimer > 0) {
      baseDmg *= 1.35;
    }

    if (this.foodBuffAtkTimer > 0) {
      baseDmg *= 1.20; // +20% Serangan Fisik dari Steak Serigala Rimba
    }

    const isCrit = weaponCrit > 0 && Math.random() < weaponCrit;
    const variance = (Math.random() * 0.3) - 0.15;
    const finalDmg = Math.max(1, Math.round(baseDmg * (1 + variance) * (isCrit ? 1.8 : 1)));
    return { damage: finalDmg, isCrit };
  }

  public playSkillCastAnimation(skill: Skill): void {
    const isAbnormal = skill.isAbnormal || skill.id.startsWith('abnormal') || skill.id === 'berserk_overdrive';
    this.castDuration = isAbnormal ? 0.75 : 0.48;
    this.castTimer = this.castDuration;
    this.castingSkill = skill;
    this.castRole = skill.role || this.role;

    const px = this.x + 12;
    const py = this.y + 20;
    const color = skill.color || '#facc15';

    // Role-specific particle burst
    this.castParticles = [];
    const count = isAbnormal ? 20 : 12;

    for (let i = 0; i < count; i++) {
      if (this.castRole === 'HEALER') {
        // Upward floating holy light crosses
        this.castParticles.push({
          x: px + (Math.random() - 0.5) * 22,
          y: py + 4 - Math.random() * 8,
          vx: (Math.random() - 0.5) * 12,
          vy: -(26 + Math.random() * 28),
          color: Math.random() > 0.4 ? '#fde047' : '#ffffff',
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          size: 2.5 + Math.random() * 1.5
        });
      } else if (this.castRole === 'NECROMANCER') {
        // Rising dark purple miasma
        this.castParticles.push({
          x: px + (Math.random() - 0.5) * 20,
          y: py + 6 - Math.random() * 10,
          vx: (Math.random() - 0.5) * 16,
          vy: -(16 + Math.random() * 24),
          color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
          life: 0.45 + Math.random() * 0.3,
          maxLife: 0.75,
          size: 2 + Math.random() * 2
        });
      } else {
        // Radial burst for Knight, Magician, Assassin
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 28 + Math.random() * 48;
        this.castParticles.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.65,
          color: color,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          size: 2 + Math.random() * 2
        });
      }
    }

    // If Assassin or Godspeed: spawn ghost after-images trailing behind
    if (this.castRole === 'ASSASSIN') {
      const offsetX = this.direction === 'right' ? -14 : (this.direction === 'left' ? 14 : 0);
      const offsetY = this.direction === 'down' ? -12 : (this.direction === 'up' ? 12 : 0);
      this.castAfterImages = [
        { x: this.x + offsetX, y: this.y + offsetY, alpha: 0.65, direction: this.direction },
        { x: this.x + offsetX * 2, y: this.y + offsetY * 2, alpha: 0.35, direction: this.direction }
      ];
    } else {
      this.castAfterImages = [];
    }
  }

  public getCollisionBox() {
    return {
      x: this.x + this.collisionBox.offsetX,
      y: this.y + this.collisionBox.offsetY,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    };
  }

  public update(deltaTime: number, input: InputState, tileMap: TileMap | ContinentValoria | DungeonMap | DungeonFloor2 | DungeonFloor3 | DungeonEldoria | DungeonStonewatch | DungeonPyramid | DungeonCelestia | BuildingInteriors, obstacleChecker?: (box: { x: number; y: number; width: number; height: number }) => boolean): void {
    const { axisX, axisY, isSprint, isAction } = input;

    this.breathTimer += deltaTime * 3;

    // Passive Mana Regeneration: akumulasi sebelum menambah 1 MP integer murni (100% bebas desimal)
    if (this.mp < this.maxMp) {
      let regenRate = (this.role === 'HEALER' || this.role === 'MAGICIAN') ? 4.5 : 2.5;
      if (this.foodBuffMpTimer > 0) regenRate *= 3.0; // Puding Kristal Slime: Regenerasi Mana Pesat
      this.mpRegenAccumulator += regenRate * deltaTime;
      if (this.mpRegenAccumulator >= 1.0) {
        const add = Math.floor(this.mpRegenAccumulator);
        this.mp = Math.min(this.maxMp, Math.round(this.mp) + add);
        this.mpRegenAccumulator -= add;
      }
    } else {
      this.mp = this.maxMp;
      this.mpRegenAccumulator = 0;
    }

    // Passive Health Regeneration: akumulasi sebelum menambah 1 HP integer murni
    if (this.hp < this.maxHp) {
      const hpRegenRate = this.role === 'HEALER' ? 2.5 : 1.0;
      this.hpRegenAccumulator += hpRegenRate * deltaTime;
      if (this.hpRegenAccumulator >= 1.0) {
        const add = Math.floor(this.hpRegenAccumulator);
        this.hp = Math.min(this.maxHp, Math.round(this.hp) + add);
        this.hpRegenAccumulator -= add;
      }
    } else {
      this.hp = this.maxHp;
      this.hpRegenAccumulator = 0;
    }

    if (this.hp <= 0) {
      this.die();
    }

    if (isAction && this.attackTimer <= 0) {
      this.attackTimer = 0.25;
      AudioEngine.playAttackSwing(this.role);
      if (this.role === 'NOVICE') {
        this.punchHand = this.punchHand === 'right' ? 'left' : 'right';
      }
      if (this.isStealthed) {
        this.isStealthed = false;
        this.stealthTimer = 0;
      }
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    // Role-specific casting animations & particles decay
    if (this.castTimer > 0) {
      this.castTimer -= deltaTime;
      if (this.castTimer <= 0) {
        this.castTimer = 0;
        this.castingSkill = null;
        this.castRole = null;
      }
    }

    for (let i = this.castParticles.length - 1; i >= 0; i--) {
      const p = this.castParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.castParticles.splice(i, 1);
      }
    }

    for (let i = this.castAfterImages.length - 1; i >= 0; i--) {
      const img = this.castAfterImages[i];
      img.alpha -= deltaTime * 2.0;
      if (img.alpha <= 0) {
        this.castAfterImages.splice(i, 1);
      }
    }

    for (const skill of this.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - deltaTime);
      }
    }

    if (this.isStealthed) {
      this.stealthTimer -= deltaTime;
      if (this.stealthTimer <= 0) this.isStealthed = false;
    }
    if (this.isBerserk) {
      this.berserkTimer -= deltaTime;
      if (this.berserkTimer <= 0) this.isBerserk = false;
    }
    if (this.hasBarrier) {
      this.barrierTimer -= deltaTime;
      if (this.barrierTimer <= 0) this.hasBarrier = false;
    }
    if (this.godspeedTimer > 0) {
      this.godspeedTimer -= deltaTime;
    }
    if (this.angelBlessingTimer > 0) {
      this.angelBlessingTimer -= deltaTime;
      this.heal(8 * deltaTime);
      this.restoreMp(6 * deltaTime);
    }
    if (this.predatorBuffTimer > 0) {
      this.predatorBuffTimer -= deltaTime;
    }
    if (this.foodBuffAtkTimer > 0) this.foodBuffAtkTimer -= deltaTime;
    if (this.foodBuffMpTimer > 0) this.foodBuffMpTimer -= deltaTime;
    if (this.foodBuffExpSpeedTimer > 0) this.foodBuffExpSpeedTimer -= deltaTime;

    // Swimming State Detection (Cek apakah ubin di bawah pemain adalah air)
    const playerCenterX = this.x + this.width / 2;
    const playerFootY = this.y + this.height * 0.75;
    const curTileX = Math.floor(playerCenterX / CONSTANTS.TILE_SIZE);
    const curTileY = Math.floor(playerFootY / CONSTANTS.TILE_SIZE);
    const isWaterHere = typeof (tileMap as any).isTileWater === 'function' && (tileMap as any).isTileWater(curTileX, curTileY);

    if (isWaterHere && !this.isSwimming) {
      AudioEngine.playWaterSplash();
    }
    this.isSwimming = isWaterHere;
    if (this.isSwimming) {
      this.swimAnimTimer += deltaTime * 3.5;
    }

    this.isMoving = Math.abs(axisX) > 0.05 || Math.abs(axisY) > 0.05;

    if (this.isMoving) {
      this.animTimer += deltaTime * 9;

      if (Math.abs(axisX) > Math.abs(axisY)) {
        this.direction = axisX > 0 ? 'right' : 'left';
      } else {
        this.direction = axisY > 0 ? 'down' : 'up';
      }

      let speed = CONSTANTS.PLAYER_SPEED;
      if (isSprint) speed *= CONSTANTS.PLAYER_SPRINT_MULTIPLIER;
      if (this.isStealthed) speed *= 1.4;
      if (this.isBerserk) speed *= 1.6;
      if (this.godspeedTimer > 0) speed *= 1.8;
      if (this.foodBuffExpSpeedTimer > 0) speed *= 1.25; // Sup Bunga Mistis +25% Speed
      if (this.isSwimming) speed *= 0.72; // Reduksi kecepatan berenang secara natural

      const moveX = axisX * speed * deltaTime;
      const moveY = axisY * speed * deltaTime;

      const collides = (box: { x: number; y: number; width: number; height: number }) => {
        // canSwim=true agar pemain bisa berenang melintasi ubin air (WATER & SACRED_WATER)
        if (typeof (tileMap as any).checkCollision === 'function') {
          if ((tileMap as any).checkCollision(box, true)) return true;
        } else if (tileMap.checkCollision(box)) {
          return true;
        }
        if (obstacleChecker && obstacleChecker(box)) return true;
        return false;
      };

      const nextBoxX = {
        x: this.x + moveX + this.collisionBox.offsetX,
        y: this.y + this.collisionBox.offsetY,
        width: this.collisionBox.width,
        height: this.collisionBox.height
      };
      if (!collides(nextBoxX)) {
        this.x += moveX;
      }

      const nextBoxY = {
        x: this.x + this.collisionBox.offsetX,
        y: this.y + moveY + this.collisionBox.offsetY,
        width: this.collisionBox.width,
        height: this.collisionBox.height
      };
      if (!collides(nextBoxY)) {
        this.y += moveY;
      }

      // Boundary safety clamping (mencegah karakter keluar batas atau NaN)
      const mapW = ((tileMap as any).width || CONSTANTS.MAP_WIDTH);
      const mapH = ((tileMap as any).height || CONSTANTS.MAP_HEIGHT);
      const worldMaxX = mapW * CONSTANTS.TILE_SIZE - this.width - 32;
      const worldMaxY = mapH * CONSTANTS.TILE_SIZE - this.height - 32;
      if (isNaN(this.x)) {
        this.x = (mapW / 2) * CONSTANTS.TILE_SIZE;
      } else {
        this.x = Math.max(32, Math.min(worldMaxX, this.x));
      }
      if (isNaN(this.y)) {
        this.y = (mapH / 2) * CONSTANTS.TILE_SIZE;
      } else {
        this.y = Math.max(32, Math.min(worldMaxY, this.y));
      }
    } else {
      this.animTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const px = Math.floor(this.x);
    const py = Math.floor(this.y);

    ctx.save();

    // 0. Minions
    for (const minion of this.minions) {
      this.renderMinion(ctx, minion);
    }

    const isCasting = this.castTimer > 0 && this.castingSkill !== null;
    const castProgress = isCasting ? Math.min(1, Math.max(0, 1 - (this.castTimer / this.castDuration))) : 0;
    const activeRole = this.castRole || this.role;

    // Ghost After-Images (drawn first behind everything)
    if (this.castAfterImages.length > 0) {
      for (const img of this.castAfterImages) {
        this.renderGhostAfterImage(ctx, Math.floor(img.x), Math.floor(img.y), img.alpha, img.direction);
      }
    }

    // Stealth transparency
    if (this.isStealthed) {
      ctx.globalAlpha = 0.38;
    }

    // Ground Runic Circles & Summoning Sigils (under feet)
    if (isCasting) {
      this.renderGroundCastingSigil(ctx, px + 12, py + 29, activeRole, castProgress, this.castingSkill?.color || '#ffffff');
    }

    // Dynamic Cast Y-Offset (Levitation / Leap / Ninja Crouch)
    let castYOffset = 0;
    if (isCasting) {
      if (activeRole === 'MAGICIAN') {
        castYOffset = Math.sin(castProgress * Math.PI) * -8;
      } else if (activeRole === 'HEALER') {
        castYOffset = Math.sin(castProgress * Math.PI) * -7;
      } else if (activeRole === 'KNIGHT') {
        if (this.castingSkill?.id === 'leap_attack') {
          castYOffset = -Math.sin(castProgress * Math.PI) * 16;
        } else {
          castYOffset = Math.sin(castProgress * Math.PI) * -2;
        }
      } else if (activeRole === 'ASSASSIN') {
        castYOffset = 2; // Low ninja crouch
      } else if (activeRole === 'NECROMANCER') {
        castYOffset = 1;
      }
    }

    // 1. Soft Multi-Layer Shadow or Swimming Water Ripple Effect
    if (this.isSwimming) {
      // Efek air & bayangan lembut bawah air saat berenang
      ctx.fillStyle = 'rgba(12, 74, 110, 0.42)';
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 26, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animasi riak konsentris air melingkari badan
      const ripple1 = (Math.sin(this.swimAnimTimer * 2.5) + 1) * 0.5;
      const ripple2 = (Math.cos(this.swimAnimTimer * 2.5) + 1) * 0.5;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 23, 14 + ripple1 * 4, 6 + ripple1 * 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 23, 18 + ripple2 * 5, 8 + ripple2 * 2.2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Busa & gelembung cipratan air saat bergerak
      if (this.isMoving) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const splashSin = Math.sin(this.swimAnimTimer * 5);
        ctx.fillRect(px + 6 + splashSin * 3, py + 21, 2.5, 2.5);
        ctx.fillRect(px + 17 - splashSin * 3, py + 22, 2.5, 2.5);
        ctx.fillRect(px + 12, py + 25 + splashSin * 2, 2, 2);
      }
    } else {
      const shadowScale = castYOffset < 0 ? Math.max(0.42, 1 + castYOffset / 28) : 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 29, 11 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 29, 8 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Barrier Aura
    if (this.hasBarrier) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px + 12, py + 16, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Berserk Flame Aura
    if (this.isBerserk) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px + 12, py + 16, 18 + Math.sin(this.animTimer * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Costume attributes
    const skinColor = this.costume.skinTone || '#fed7aa';
    const eyeColor = this.costume.eyeColor || '#0f172a';
    const pantsColor = this.costume.pantsColor || '#1c1917';
    const pantsStyle = this.costume.pantsStyle || 'trousers';
    const bootColor = this.costume.bootColor || '#451a03';
    const bootStyle = this.costume.bootStyle || 'boots';
    const capeStyle = this.costume.capeStyle || 'cape';
    const capeColor = this.costume.capeColor || this.costume.accentColor;
    const outfitStyle = this.costume.outfitStyle || 'tunic';

    // Animation variables
    const idleBob = !this.isMoving ? Math.sin(this.breathTimer) * 0.8 : 0;
    const walkStep = this.isMoving ? Math.sin(this.animTimer) : 0;
    const legOffset1 = walkStep * 4;
    const legOffset2 = -walkStep * 4;
    const capeFlutter = (this.isMoving ? Math.sin(this.animTimer * 1.5) * 2.5 : 0) + (isCasting ? Math.sin(castProgress * Math.PI * 4) * 3.5 : 0);

    // Punching physics for NOVICE
    const isPunching = this.attackTimer > 0 && this.role === 'NOVICE';
    const punchProgress = isPunching ? Math.min(1, Math.max(0, 1 - (this.attackTimer / 0.25))) : 0;
    const punchThrust = isPunching ? Math.sin(punchProgress * Math.PI) * 11 : 0;
    let punchLeanX = 0;
    let punchLeanY = 0;
    if (isPunching) {
      if (this.direction === 'right') punchLeanX = 2;
      else if (this.direction === 'left') punchLeanX = -2;
      else if (this.direction === 'down') punchLeanY = 1.5;
      else if (this.direction === 'up') punchLeanY = -1.5;
    }

    const renderX = px + punchLeanX;
    const waterBob = this.isSwimming ? Math.sin(this.swimAnimTimer * 1.5) * 2.0 : 0;
    const renderY = py + idleBob + castYOffset + punchLeanY + waterBob;

    // Angel Wings (Drawn behind back for Healer during cast)
    if (activeRole === 'HEALER' && isCasting) {
      this.renderAngelWings(ctx, renderX, renderY, castProgress);
    }

    // 4. Flowing Cape / Mantle / Scarf (Drawn behind body when facing down or moving)
    if (capeStyle !== 'none' && this.direction !== 'up') {
      ctx.fillStyle = capeColor;
      if (capeStyle === 'scarf') {
        ctx.fillRect(renderX + 6 + capeFlutter * 0.5, renderY + 11, 12, 8);
        ctx.fillRect(renderX + (this.direction === 'left' ? 14 : 3) + capeFlutter * 0.8, renderY + 13, 5, 11);
      } else if (capeStyle === 'mantle') {
        ctx.fillRect(renderX + 4 + capeFlutter * 0.3, renderY + 11, 16, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(renderX + 10 + capeFlutter * 0.3, renderY + 13, 4, 10);
      } else {
        ctx.fillRect(renderX + 5 + capeFlutter * 0.5, renderY + 11, 14, 15);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(renderX + 10 + capeFlutter * 0.5, renderY + 13, 4, 13);
      }
    }

    // 5. Legs & Boots (Customizable Pants & Boots)
    let legSpreadL = 0;
    let legSpreadR = 0;
    if (isCasting && activeRole === 'ASSASSIN') {
      // Lower ninja spread stance
      legSpreadL = -2;
      legSpreadR = 2;
    }
    // Left Leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(renderX + 5 + legSpreadL, renderY + 20 + legOffset1, 5, pantsStyle === 'shorts' ? 3 : 5);
    if (pantsStyle === 'shorts') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(renderX + 5 + legSpreadL, renderY + 23 + legOffset1, 5, 2);
    }
    // Left Boot / Sabaton / Shoe
    ctx.fillStyle = bootColor;
    ctx.fillRect(renderX + 4 + legSpreadL, renderY + 23 + legOffset1, 6, 6);
    if (bootStyle === 'sabatons') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(renderX + 5 + legSpreadL, renderY + 24 + legOffset1, 4, 2);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(renderX + 4 + legSpreadL, renderY + 23 + legOffset1, 6, 2);
    }
    ctx.fillStyle = '#0f172a'; // Sole
    ctx.fillRect(renderX + 4 + legSpreadL, renderY + 28 + legOffset1, 6, 2);

    // Right Leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(renderX + 14 + legSpreadR, renderY + 20 + legOffset2, 5, pantsStyle === 'shorts' ? 3 : 5);
    if (pantsStyle === 'shorts') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(renderX + 14 + legSpreadR, renderY + 23 + legOffset2, 5, 2);
    }
    // Right Boot / Sabaton / Shoe
    ctx.fillStyle = bootColor;
    ctx.fillRect(renderX + 14 + legSpreadR, renderY + 23 + legOffset2, 6, 6);
    if (bootStyle === 'sabatons') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(renderX + 15 + legSpreadR, renderY + 24 + legOffset2, 4, 2);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(renderX + 14 + legSpreadR, renderY + 23 + legOffset2, 6, 2);
    }
    ctx.fillStyle = '#0f172a'; // Sole
    ctx.fillRect(renderX + 14 + legSpreadR, renderY + 28 + legOffset2, 6, 2);

    // Efek celupan air bergelombang yang menutupi kaki saat berenang
    if (this.isSwimming) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.beginPath();
      ctx.ellipse(renderX + 12, renderY + 24, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(renderX + 6, renderY + 23, 2, 0, Math.PI * 2);
      ctx.arc(renderX + 17, renderY + 23, 2, 0, Math.PI * 2);
      ctx.arc(renderX + 12, renderY + 25, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Torso & Outfit / Armor
    ctx.fillStyle = this.costume.outfitColor;
    ctx.fillRect(renderX + 5, renderY + 10, 14, 12);

    // Style-specific torso embellishments
    if (outfitStyle === 'plate') {
      // Metallic breastplate highlight & center rib
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(renderX + 6, renderY + 11, 4, 8);
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(renderX + 11, renderY + 11, 2, 8);
    } else if (outfitStyle === 'robe') {
      // Flowing robe center trim
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(renderX + 11, renderY + 10, 2, 12);
      ctx.fillRect(renderX + 7, renderY + 20, 10, 2);
    } else if (outfitStyle === 'gi') {
      // Martial gi cross fold
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(renderX + 7, renderY + 11, 3, 7);
      ctx.fillStyle = skinColor;
      ctx.fillRect(renderX + 11, renderY + 10, 2, 2);
    } else if (outfitStyle === 'noble') {
      // Noble sash & golden embroidery
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(renderX + 7, renderY + 10, 3, 11);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(renderX + 12, renderY + 12, 2, 2);
      ctx.fillRect(renderX + 12, renderY + 15, 2, 2);
    } else {
      // Tunic / Leather shading
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(renderX + 6, renderY + 11, 5, 8);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(renderX + 14, renderY + 11, 4, 9);
    }

    // Collar / Neckline trim
    ctx.fillStyle = skinColor; // Neck
    ctx.fillRect(renderX + 10, renderY + 9, 4, 2);
    ctx.fillStyle = this.costume.accentColor;
    ctx.fillRect(renderX + 8, renderY + 10, 8, 2);

    // Belt & Metallic Buckle & Pouch
    ctx.fillStyle = '#292524'; // Leather belt
    ctx.fillRect(renderX + 5, renderY + 18, 14, 3);
    ctx.fillStyle = '#facc15'; // Gold buckle
    ctx.fillRect(renderX + 11, renderY + 18, 3, 3);
    ctx.fillStyle = '#78350f'; // Hip pouch / potion vial
    ctx.fillRect(renderX + 16, renderY + 18, 3, 4);

    // Pauldrons (Shoulder pads)
    ctx.fillStyle = this.costume.accentColor;
    ctx.fillRect(renderX + 3, renderY + 10, 3, 4);
    ctx.fillRect(renderX + 18, renderY + 10, 3, 4);

    // 7. Arms & Hands (Unarmed Punching for NOVICE or weapon swing / casting stance)
    if (isPunching) {
      const activeHand = this.punchHand; // 'left' or 'right'
      const fistSize = 4;
      const armColor = this.costume.outfitColor;
      const fistColor = skinColor;
      const knuckleColor = '#ffffff';

      if (this.direction === 'right') {
        if (activeHand === 'right') {
          // Guard with left hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 5, renderY + 13, 4, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 8, renderY + 12, 4, 4);

          // Punch with right hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 16, renderY + 13, 4 + punchThrust * 0.7, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 19 + punchThrust, renderY + 12, fistSize, fistSize);
          ctx.fillStyle = knuckleColor;
          ctx.fillRect(renderX + 21 + punchThrust, renderY + 13, 2, 2);
        } else {
          // Guard with right hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 16, renderY + 15, 4, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 16, renderY + 17, 4, 4);

          // Punch with left hand (crossover)
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 14, renderY + 10, 4 + punchThrust * 0.7, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 17 + punchThrust, renderY + 9, fistSize, fistSize);
          ctx.fillStyle = knuckleColor;
          ctx.fillRect(renderX + 19 + punchThrust, renderY + 10, 2, 2);
        }
      } else if (this.direction === 'left') {
        if (activeHand === 'left') {
          // Guard with right hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 15, renderY + 13, 4, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 12, renderY + 12, 4, 4);

          // Punch with left hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 4 - punchThrust * 0.7, renderY + 13, 4 + punchThrust * 0.7, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 1 - punchThrust, renderY + 12, fistSize, fistSize);
          ctx.fillStyle = knuckleColor;
          ctx.fillRect(renderX + 1 - punchThrust, renderY + 13, 2, 2);
        } else {
          // Guard with left hand
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 4, renderY + 15, 4, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 4, renderY + 17, 4, 4);

          // Punch with right hand (crossover)
          ctx.fillStyle = armColor;
          ctx.fillRect(renderX + 6 - punchThrust * 0.7, renderY + 10, 4 + punchThrust * 0.7, 4);
          ctx.fillStyle = fistColor;
          ctx.fillRect(renderX + 3 - punchThrust, renderY + 9, fistSize, fistSize);
          ctx.fillStyle = knuckleColor;
          ctx.fillRect(renderX + 3 - punchThrust, renderY + 10, 2, 2);
        }
      } else if (this.direction === 'down') {
        const sideOffset = activeHand === 'right' ? 18 : 2;
        const otherSide = activeHand === 'right' ? 2 : 18;
        // Guard arm
        ctx.fillStyle = armColor;
        ctx.fillRect(renderX + otherSide, renderY + 11, 4, 4);
        ctx.fillStyle = fistColor;
        ctx.fillRect(renderX + otherSide, renderY + 13, 4, 4);

        // Punch arm extending down
        ctx.fillStyle = armColor;
        ctx.fillRect(renderX + sideOffset, renderY + 12, 4, 6 + punchThrust * 0.7);
        ctx.fillStyle = fistColor;
        ctx.fillRect(renderX + sideOffset - 1, renderY + 17 + punchThrust, fistSize, fistSize);
        ctx.fillStyle = knuckleColor;
        ctx.fillRect(renderX + sideOffset, renderY + 19 + punchThrust, 3, 2);
      } else if (this.direction === 'up') {
        const sideOffset = activeHand === 'right' ? 18 : 2;
        const otherSide = activeHand === 'right' ? 2 : 18;
        // Guard arm
        ctx.fillStyle = armColor;
        ctx.fillRect(renderX + otherSide, renderY + 14, 4, 4);
        ctx.fillStyle = fistColor;
        ctx.fillRect(renderX + otherSide, renderY + 12, 4, 4);

        // Punch arm extending up
        ctx.fillStyle = armColor;
        ctx.fillRect(renderX + sideOffset, renderY + 10 - punchThrust * 0.7, 4, 6 + punchThrust * 0.7);
        ctx.fillStyle = fistColor;
        ctx.fillRect(renderX + sideOffset - 1, renderY + 6 - punchThrust, fistSize, fistSize);
        ctx.fillStyle = knuckleColor;
        ctx.fillRect(renderX + sideOffset, renderY + 6 - punchThrust, 3, 2);
      }
    } else {
      let armSwingL = -walkStep * 3;
      let armSwingR = walkStep * 3;

      if (isCasting) {
        if (activeRole === 'MAGICIAN') {
          armSwingL = -9;
          armSwingR = -11;
        } else if (activeRole === 'HEALER') {
          armSwingL = -6;
          armSwingR = -10;
        } else if (activeRole === 'KNIGHT') {
          const swingArc = Math.sin(castProgress * Math.PI);
          armSwingL = -4 + swingArc * 6;
          armSwingR = -10 + swingArc * 14;
        } else if (activeRole === 'ASSASSIN') {
          armSwingL = -6;
          armSwingR = -6;
        } else if (activeRole === 'NECROMANCER') {
          armSwingL = 3;
          armSwingR = -3;
        }
      }

      // Left Arm
      ctx.fillStyle = this.costume.outfitColor;
      ctx.fillRect(renderX + 2, renderY + 12 + armSwingL, 3, 6);
      ctx.fillStyle = skinColor; // Left Hand
      ctx.fillRect(renderX + 2, renderY + 17 + armSwingL, 3, 3);

      // Right Arm
      ctx.fillStyle = this.costume.outfitColor;
      ctx.fillRect(renderX + 19, renderY + 12 + armSwingR, 3, 6);
      ctx.fillStyle = skinColor; // Right Hand
      ctx.fillRect(renderX + 19, renderY + 17 + armSwingR, 3, 3);

      // 8. EQUIPPED WEAPON in Right Hand based on Role / Magician Element!
      this.renderEquippedWeapon(ctx, renderX, renderY, armSwingR, isCasting, activeRole, castProgress);
    }

    // 9. Cape back view (if facing UP, cape covers the back)
    if (capeStyle !== 'none' && this.direction === 'up') {
      ctx.fillStyle = capeColor;
      ctx.fillRect(renderX + 5, renderY + 11, 14, 15);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(renderX + 9, renderY + 12, 6, 14);
    }

    // 10. Head & Facial Expressions
    // Chin & Face Base
    ctx.fillStyle = skinColor;
    ctx.fillRect(renderX + 6, renderY + 2, 12, 9);
    // Cheek blush / skin tone warmth
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.fillRect(renderX + 7, renderY + 7, 2, 2);
    ctx.fillRect(renderX + 15, renderY + 7, 2, 2);

    // 11. Hair & Headgear (Layered with highlights)
    this.renderHairAndHeadgear(ctx, renderX, renderY);

    // 12. Eyes & Facial Direction
    if (this.direction === 'down') {
      // Eye Whites
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 8, renderY + 5, 3, 3);
      ctx.fillRect(renderX + 13, renderY + 5, 3, 3);
      // Iris / Pupil (Custom eyeColor)
      ctx.fillStyle = eyeColor;
      ctx.fillRect(renderX + 9, renderY + 5, 2, 2);
      ctx.fillRect(renderX + 14, renderY + 5, 2, 2);
      // Eye highlight shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 9, renderY + 5, 1, 1);
      ctx.fillRect(renderX + 14, renderY + 5, 1, 1);
      // Mouth
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(renderX + 11, renderY + 9, 2, 1);
    } else if (this.direction === 'left') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 7, renderY + 5, 3, 3);
      ctx.fillStyle = eyeColor;
      ctx.fillRect(renderX + 7, renderY + 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 7, renderY + 5, 1, 1);
    } else if (this.direction === 'right') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 14, renderY + 5, 3, 3);
      ctx.fillStyle = eyeColor;
      ctx.fillRect(renderX + 15, renderY + 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(renderX + 16, renderY + 5, 1, 1);
    } else if (this.direction === 'up') {
      // Back of hair
      ctx.fillStyle = this.costume.hairColor;
      ctx.fillRect(renderX + 6, renderY + 2, 12, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(renderX + 7, renderY + 7, 10, 4);
    }

    // Role-Specific Cast Overlays:
    // A. Assassin Red Eye Glare (Anime flare)
    if (activeRole === 'ASSASSIN' && isCasting && this.direction !== 'up') {
      ctx.save();
      const eyeAlpha = Math.sin(castProgress * Math.PI);
      ctx.globalAlpha = eyeAlpha;
      const eyeY = renderY + 6;
      let eyeCenterX = renderX + 11;
      if (this.direction === 'left') eyeCenterX = renderX + 8;
      else if (this.direction === 'right') eyeCenterX = renderX + 15;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(eyeCenterX - 9, eyeY);
      ctx.lineTo(eyeCenterX + 11, eyeY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeCenterX - 1, eyeY - 1, 3, 2);
      ctx.restore();
    }

    // B. Healer Divine Golden Halo
    if (activeRole === 'HEALER' && isCasting) {
      ctx.save();
      const haloAlpha = Math.sin(castProgress * Math.PI);
      ctx.globalAlpha = haloAlpha * 0.95;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(renderX + 12, renderY - 5, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(renderX + 12, renderY - 5, 6.5, 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // C. Necromancer Orbiting Soul Wisps
    if (activeRole === 'NECROMANCER' && isCasting) {
      const angle1 = castProgress * Math.PI * 4;
      const angle2 = angle1 + Math.PI;
      this.renderSoulWisp(ctx, renderX + 12 + Math.cos(angle1) * 16, renderY + 14 + Math.sin(angle1) * 7);
      this.renderSoulWisp(ctx, renderX + 12 + Math.cos(angle2) * 16, renderY + 14 + Math.sin(angle2) * 7);
    }

    // 13. Attack Slash Swing / Punch Impact
    if (this.attackTimer > 0) {
      if (this.role === 'NOVICE') {
        this.renderPunchImpact(ctx, renderX, renderY, this.direction, punchProgress);
      } else {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (this.direction === 'right') ctx.arc(renderX + 26, renderY + 14, 16, -Math.PI * 0.35, Math.PI * 0.35);
        else if (this.direction === 'left') ctx.arc(renderX - 2, renderY + 14, 16, Math.PI * 0.65, Math.PI * 1.35);
        else if (this.direction === 'down') ctx.arc(renderX + 12, renderY + 28, 16, Math.PI * 0.15, Math.PI * 0.85);
        else if (this.direction === 'up') ctx.arc(renderX + 12, renderY - 4, 16, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    }

    // 14. Cast Particles (Foreground sparkles, crosses, embers)
    if (this.castParticles.length > 0) {
      for (const p of this.castParticles) {
        const pAlpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = pAlpha;
        ctx.fillStyle = p.color;

        if (activeRole === 'HEALER') {
          // Holy Cross (+)
          const s = Math.round(p.size);
          ctx.fillRect(Math.floor(p.x - s), Math.floor(p.y - 1), s * 2 + 1, 2);
          ctx.fillRect(Math.floor(p.x - 1), Math.floor(p.y - s), 2, s * 2 + 1);
        } else {
          // Pixel Sparkle Square
          const s = Math.max(1, Math.round(p.size));
          ctx.fillRect(Math.floor(p.x - s / 2), Math.floor(p.y - s / 2), s, s);
        }
      }
    }

    // 15. Floating Header (Role Badge, Title & Username)
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    if (this.isSwimming) {
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.strokeText('🏊 Berenang', px + 12, renderY - 33);
      ctx.fillText('🏊 Berenang', px + 12, renderY - 33);
    }

    if (this.equippedTitle) {
      ctx.font = 'bold 7.5px sans-serif';
      ctx.fillStyle = this.equippedTitleColor || '#facc15';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.strokeText(this.equippedTitle, px + 12, renderY - 24);
      ctx.fillText(this.equippedTitle, px + 12, renderY - 24);
    }

    ctx.font = 'bold 8.5px sans-serif';

    let tagText = `[${ROLE_INFO[this.role].tag} Lv.${this.level}]`;
    let tagColor = ROLE_INFO[this.role].color;

    if (this.role === 'MAGICIAN') {
      const pInfo = ELEMENT_INFO[this.magicianAffinities.primary];
      tagText = `[Mage·${pInfo.name.split(' ')[0]} Lv.${this.level}]`;
      tagColor = pInfo.color;
    }

    ctx.fillStyle = tagColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeText(tagText, px + 12, renderY - 14);
    ctx.fillText(tagText, px + 12, renderY - 14);

    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(this.username, px + 12, renderY - 4);
    ctx.fillText(this.username, px + 12, renderY - 4);

    ctx.restore();
  }

  private renderGroundCastingSigil(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    role: RoleType,
    progress: number,
    color: string
  ): void {
    ctx.save();
    const alpha = Math.sin(progress * Math.PI) * 0.85;
    ctx.globalAlpha = alpha;

    if (role === 'MAGICIAN') {
      // Rotating Elemental Runic Circle
      const r = 18;
      const rot = progress * Math.PI * 2;
      // Outer ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner rotating diamond / square rune
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = rot + (i * Math.PI) / 2;
        const x = cx + Math.cos(ang) * (r * 0.7);
        const y = cy + Math.sin(ang) * (r * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // 4 Elemental Spark Nodes
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const ang = -rot + (i * Math.PI) / 2;
        const nx = cx + Math.cos(ang) * r;
        const ny = cy + Math.sin(ang) * (r * 0.5);
        ctx.fillRect(nx - 1.5, ny - 1.5, 3, 3);
      }
    } else if (role === 'NECROMANCER') {
      // Dark Purple Pentagram Summoning Sigil
      const r = 19;
      const rot = -progress * Math.PI * 1.5;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      // Outer ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 5-Pointed Star
      ctx.strokeStyle = '#c084fc';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const step = (i * 2) % 5;
        const ang = rot + (step * Math.PI * 2) / 5 - Math.PI / 2;
        const sx = cx + Math.cos(ang) * (r * 0.85);
        const sy = cy + Math.sin(ang) * (r * 0.42);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (role === 'KNIGHT') {
      // Impact Shockwave Dust Ring
      const r = 6 + progress * 20;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.65, r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (role === 'HEALER') {
      // Sacred Blessing Halo on ground
      const r = 17;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Glowing cross on ground
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy - 1, 12, 2);
      ctx.fillRect(cx - 1, cy - 4, 2, 8);
    } else if (role === 'ASSASSIN') {
      // Shadow Dash Ring
      const r = 15;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderAngelWings(ctx: CanvasRenderingContext2D, px: number, py: number, flapProgress: number): void {
    ctx.save();
    const flap = Math.sin(flapProgress * Math.PI * 3) * 3;
    const wingY = py + 12;

    // Outer golden glow base
    ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(px + 6, wingY);
    ctx.quadraticCurveTo(px - 6, wingY - 14 + flap, px - 16, wingY - 8 + flap);
    ctx.quadraticCurveTo(px - 14, wingY + 6 + flap, px + 5, wingY + 4);
    ctx.closePath();
    ctx.fill();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(px + 18, wingY);
    ctx.quadraticCurveTo(px + 30, wingY - 14 + flap, px + 40, wingY - 8 + flap);
    ctx.quadraticCurveTo(px + 38, wingY + 6 + flap, px + 19, wingY + 4);
    ctx.closePath();
    ctx.fill();

    // Inner pure white feathers
    ctx.fillStyle = '#ffffff';
    // Left Wing Inner
    ctx.beginPath();
    ctx.moveTo(px + 6, wingY);
    ctx.quadraticCurveTo(px - 4, wingY - 11 + flap, px - 12, wingY - 6 + flap);
    ctx.quadraticCurveTo(px - 10, wingY + 4 + flap, px + 5, wingY + 3);
    ctx.closePath();
    ctx.fill();

    // Right Wing Inner
    ctx.beginPath();
    ctx.moveTo(px + 18, wingY);
    ctx.quadraticCurveTo(px + 28, wingY - 11 + flap, px + 36, wingY - 6 + flap);
    ctx.quadraticCurveTo(px + 34, wingY + 4 + flap, px + 19, wingY + 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderGhostAfterImage(
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    alpha: number,
    _dir: Direction
  ): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.45));
    // Cyan shadow silhouette
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(gx + 5, gy + 10, 14, 12);
    ctx.fillRect(gx + 6, gy + 2, 12, 9);
    ctx.fillRect(gx + 4, gy + 22, 6, 8);
    ctx.fillRect(gx + 14, gy + 22, 6, 8);
    ctx.restore();
  }

  private renderSoulWisp(ctx: CanvasRenderingContext2D, wx: number, wy: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.beginPath();
    ctx.arc(wx, wy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(wx, wy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 1, wy - 1, 2, 2);
    ctx.restore();
  }

  private renderEquippedWeapon(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    armSwing: number,
    isCasting?: boolean,
    activeRole?: RoleType,
    castProgress?: number
  ): void {
    const wx = px + 21;
    const wy = py + 16 + armSwing;

    if (this.role === 'NOVICE') {
      // Novice has no weapon equipped, bare fists only!
      return;
    }

    const eqId = this.equippedWeaponId;

    if (this.role === 'KNIGHT') {
      if (eqId === 'KNIGHT_CUSTOM') {
        // --- PEDANG MAGMA ABYSS (EPIK DUNGEON) ---
        // Obsidian hilt & molten horned guard
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(wx - 1, wy + 4, 3, 3);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(wx - 3, wy + 2, 7, 2);

        // Obsidian blade with molten core
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx - 2, wy - 11, 5, 13);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(wx - 1, wy - 9, 3, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(wx, wy - 7, 1, 7);

        // Blazing magma aura & flame particles
        const flamePulse = Math.sin(this.animTimer * 5) * 1.5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(wx - 3, wy - 12 - flamePulse, 7, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx - 1 + flamePulse, wy - 14, 2, 2);
      } else if (eqId === 'KNIGHT_RARE') {
        // --- PEDANG KSATRIA KERAJAAN (RARE GOLD) ---
        ctx.fillStyle = '#ca8a04'; // Gold Pommel
        ctx.fillRect(wx - 1, wy + 4, 3, 3);
        // Winged gold guard with blue gem
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx - 3, wy + 2, 7, 2);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(wx, wy + 2, 1, 2);
        // Royal blue-silver blade
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(wx - 1, wy - 9, 3, 11);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(wx, wy - 7, 1, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 1, wy - 9, 1, 10);
      } else {
        // --- PEDANG BAJA STANDAR ---
        ctx.fillStyle = '#64748b'; // Pommel
        ctx.fillRect(wx - 1, wy + 4, 3, 2);
        ctx.fillStyle = '#facc15'; // Gold guard
        ctx.fillRect(wx - 2, wy + 2, 5, 2);
        ctx.fillStyle = '#e2e8f0'; // Blade
        ctx.fillRect(wx - 1, wy - 8, 3, 10);
        ctx.fillStyle = '#ffffff'; // Blade edge shine
        ctx.fillRect(wx, wy - 8, 1, 10);
      }

      // Blazing golden weapon aura & slash trail when casting Knight skill
      if (isCasting && activeRole === 'KNIGHT') {
        const isRage = this.castingSkill?.id === 'berserk_overdrive';
        ctx.fillStyle = isRage ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.55)';
        ctx.fillRect(wx - 3, wy - 12, 7, 15);
        ctx.strokeStyle = isRage ? '#dc2626' : '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wx + 2, wy - 4, 15, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }
    } else if (this.role === 'MAGICIAN') {
      const pInfo = ELEMENT_INFO[this.magicianAffinities.primary];
      const elemColor = (this.castingSkill && this.castingSkill.color) ? this.castingSkill.color : pInfo.color;

      if (eqId === 'MAGICIAN_CUSTOM') {
        // --- TONGKAT KOSMIK ABYSS (EPIK DUNGEON) ---
        // Cosmic black rod
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(wx, wy - 7, 2, 15);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx - 2, wy - 9, 6, 2);

        // Swirling galaxy void orb
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 13, 2, 2);

        // Orbiting cosmic dust
        const orbitAngle = this.animTimer * 4;
        const ox = wx + 1 + Math.cos(orbitAngle) * 7;
        const oy = wy - 12 + Math.sin(orbitAngle) * 5;
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(ox - 1, oy - 1, 2, 2);
      } else if (eqId === 'MAGICIAN_RARE') {
        // --- TONGKAT SAFIR BINTANG (RARE GOLD) ---
        ctx.fillStyle = '#94a3b8'; // Silver Staff Pole
        ctx.fillRect(wx, wy - 6, 2, 14);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(wx - 2, wy - 9, 6, 3);

        // Star Sapphire Orb
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 12, 2, 2);
      } else {
        // --- TONGKAT KAYU STANDAR ---
        ctx.fillStyle = '#78350f'; // Wood staff pole
        ctx.fillRect(wx, wy - 6, 2, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx - 2, wy - 9, 6, 3);
        ctx.fillStyle = elemColor;
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 12, 2, 2);
      }

      if (isCasting && activeRole === 'MAGICIAN') {
        // Supercharged Elemental Orb Flare
        const pulse = 4.5 + Math.sin((castProgress || 0) * Math.PI * 4) * 2;
        ctx.fillStyle = elemColor;
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(wx + 1 - 7, wy - 11); ctx.lineTo(wx + 1 + 7, wy - 11);
        ctx.moveTo(wx + 1, wy - 11 - 7); ctx.lineTo(wx + 1, wy - 11 + 7);
        ctx.stroke();
      }
    } else if (this.role === 'ASSASSIN') {
      if (eqId === 'ASSASSIN_CUSTOM') {
        // --- CAKAR IBLIS GUA (EPIK DUNGEON) ---
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(wx, wy + 3, 4, 2);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(wx - 1, wy - 5, 4, 8);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(wx - 2, wy - 3, 2, 2);
        ctx.fillRect(wx + 2, wy - 1, 2, 2);

        // Shadow smoke wisp
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fillRect(wx - 2, wy - 7, 5, 3);
      } else if (eqId === 'ASSASSIN_RARE') {
        // --- BELATI BAYANGAN KELELAWAR (RARE GOLD) ---
        ctx.fillStyle = '#090d16'; // Jet black hilt
        ctx.fillRect(wx - 1, wy + 3, 4, 2);
        ctx.fillStyle = '#06b6d4'; // Cyan razor blade
        ctx.fillRect(wx, wy - 5, 2, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 4, 1, 7);
      } else {
        // --- BELATI KEMBAR STANDAR ---
        ctx.fillStyle = '#22c55e'; // Poison edge
        ctx.fillRect(wx, wy - 4, 2, 7);
        ctx.fillStyle = '#0f172a'; // Dark hilt
        ctx.fillRect(wx - 1, wy + 3, 4, 2);
      }

      if (isCasting && activeRole === 'ASSASSIN') {
        // Dual Wield: Left Hand Dagger
        ctx.fillStyle = eqId === 'ASSASSIN_CUSTOM' ? '#dc2626' : (eqId === 'ASSASSIN_RARE' ? '#06b6d4' : '#22c55e');
        ctx.fillRect(px + 2, wy - 4, 2, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 1, wy + 3, 4, 2);

        // Crossed dual scissor slash trails
        ctx.strokeStyle = eqId === 'ASSASSIN_CUSTOM' ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 1, wy + 6);
        ctx.lineTo(wx + 5, wy - 7);
        ctx.moveTo(wx + 5, wy + 6);
        ctx.lineTo(px - 1, wy - 7);
        ctx.stroke();
      }
    } else if (this.role === 'HEALER') {
      if (eqId === 'HEALER_CUSTOM') {
        // --- RELIK SERAPHIM KUNO (EPIK DUNGEON) ---
        ctx.fillStyle = '#ca8a04'; // Gold scepter
        ctx.fillRect(wx, wy - 8, 2, 16);
        // Seraphim Angelic Wings
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(wx - 4, wy - 7, 3, 4);
        ctx.fillRect(wx + 3, wy - 7, 3, 4);
        // Holy pulsating halo
        const haloPulse = Math.sin(this.animTimer * 4) * 1;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 4.5 + haloPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 12, 2, 2);
      } else if (eqId === 'HEALER_RARE') {
        // --- TONGKAT CAHAYA FAJAR (RARE GOLD) ---
        ctx.fillStyle = '#facc15';
        ctx.fillRect(wx, wy - 8, 2, 16);
        ctx.fillRect(wx - 3, wy - 6, 8, 2);
        // Sun Jewel
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 11, 2, 2);
      } else {
        // --- TONGKAT SALIB STANDAR ---
        ctx.fillStyle = '#fde047'; // Golden scepter
        ctx.fillRect(wx, wy - 8, 2, 16);
        ctx.fillRect(wx - 3, wy - 6, 8, 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(wx, wy - 10, 2, 2);
      }

      if (isCasting && activeRole === 'HEALER') {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.fillRect(wx - 3, wy - 28, 8, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 1, wy - 20, 4, 10);
      }
    } else if (this.role === 'NECROMANCER') {
      if (eqId === 'NECROMANCER_CUSTOM') {
        // --- SABIT JIWA KEGELAPAN ABADI (EPIK DUNGEON) ---
        // Dragon bone curved shaft
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx, wy - 9, 2, 16);
        // Giant obsidian dragon scythe blade
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx - 5, wy - 11, 6, 3);
        ctx.fillRect(wx - 6, wy - 8, 3, 5);
        // Violet Void Flame aura along blade
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(wx - 4, wy - 12, 5, 2);
        ctx.fillRect(wx - 7, wy - 9, 2, 5);
        // Soul eye
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(wx - 1, wy - 10, 2, 2);
      } else if (eqId === 'NECROMANCER_RARE') {
        // --- SABIT ROH PENJARAH (RARE GOLD) ---
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(wx, wy - 8, 2, 15);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(wx - 4, wy - 10, 5, 3);
        ctx.fillRect(wx - 5, wy - 7, 2, 4);
        ctx.fillStyle = '#ef4444'; // Red Soul Eye
        ctx.fillRect(wx - 1, wy - 10, 3, 3);
      } else {
        // --- SABIT TULANG STANDAR ---
        ctx.fillStyle = '#334155';
        ctx.fillRect(wx, wy - 8, 2, 15);
        ctx.fillStyle = '#a855f7'; // Purple Soul Gem
        ctx.fillRect(wx - 1, wy - 10, 4, 3);
        ctx.fillStyle = '#e2e8f0'; // Bone curve
        ctx.fillRect(wx - 4, wy - 10, 3, 2);
      }

      if (isCasting && activeRole === 'NECROMANCER') {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.beginPath();
        ctx.arc(wx - 2, wy - 9, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(wx - 3, wy - 11, 3, 3);
      }
    }
  }

  private renderHairAndHeadgear(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    const hair = this.costume.hairColor;
    const style = this.costume.hairStyle;

    if (style === 'short') {
      // Layered bangs with volume
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py, 14, 5);
      ctx.fillRect(px + 4, py + 2, 3, 6);
      ctx.fillRect(px + 17, py + 2, 3, 6);
      // Hair highlight shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 7, py + 1, 7, 2);
      // Bang tips
      ctx.fillStyle = hair;
      ctx.fillRect(px + 7, py + 4, 2, 2);
      ctx.fillRect(px + 11, py + 4, 2, 2);
      ctx.fillRect(px + 14, py + 4, 2, 2);
    } else if (style === 'spiky') {
      // Dynamic anime spiky tufts
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py - 2, 14, 7);
      ctx.fillRect(px + 3, py, 3, 7);
      ctx.fillRect(px + 18, py, 3, 7);
      // Top spikes
      ctx.fillRect(px + 6, py - 4, 3, 3);
      ctx.fillRect(px + 11, py - 5, 3, 4);
      ctx.fillRect(px + 15, py - 4, 3, 3);
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 8, py - 1, 6, 2);
    } else if (style === 'long') {
      // Long flowing locks past shoulders
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py, 14, 5);
      ctx.fillRect(px + 3, py + 2, 4, 14);
      ctx.fillRect(px + 17, py + 2, 4, 14);
      // Forehead headband
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(px + 6, py + 2, 12, 2);
    } else if (style === 'hood') {
      // Deep cowl hood covering head with folded collar
      const hoodCol = this.costume.hatColor || this.costume.outfitColor;
      ctx.fillStyle = hoodCol;
      ctx.fillRect(px + 4, py - 2, 16, 7);
      ctx.fillRect(px + 3, py + 2, 4, 10);
      ctx.fillRect(px + 17, py + 2, 4, 10);
      // Hood peak tip
      ctx.fillRect(px + 10, py - 4, 4, 3);
      // Inner shadow of the hood
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(px + 6, py + 2, 12, 3);
    } else if (style === 'ponytail') {
      // Samurai / high tied ponytail
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py, 14, 5);
      ctx.fillRect(px + 4, py + 2, 3, 6);
      ctx.fillRect(px + 17, py + 2, 3, 6);
      // Tie band
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(px + 17, py - 2, 3, 3);
      // Ponytail arc lock
      ctx.fillStyle = hair;
      ctx.fillRect(px + 19, py - 1, 4, 12);
      ctx.fillRect(px + 21, py + 8, 3, 5);
      // Headband
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(px + 6, py + 2, 12, 2);
    } else if (style === 'wild') {
      // Messy voluminous beast / elven wild locks
      ctx.fillStyle = hair;
      ctx.fillRect(px + 4, py - 2, 16, 7);
      ctx.fillRect(px + 1, py, 4, 10);
      ctx.fillRect(px + 19, py, 4, 10);
      ctx.fillRect(px + 6, py - 4, 4, 3);
      ctx.fillRect(px + 14, py - 5, 4, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(px + 7, py - 1, 10, 2);
    } else if (style === 'helmet') {
      // Heavy metal knight/gladiator helmet
      const helmCol = this.costume.hatColor || '#475569';
      ctx.fillStyle = helmCol;
      ctx.fillRect(px + 4, py - 3, 16, 9);
      ctx.fillRect(px + 3, py + 2, 4, 8);
      ctx.fillRect(px + 17, py + 2, 4, 8);
      // Crest plume
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(px + 10, py - 6, 4, 4);
      // Brow visor rim
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 4, py + 2, 16, 2);
      // Eye slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 7, py + 4, 10, 2);
    } else if (style === 'crown') {
      // Golden royal crown over noble hair
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py, 14, 5);
      ctx.fillRect(px + 4, py + 2, 3, 6);
      ctx.fillRect(px + 17, py + 2, 3, 6);
      // Gold crown
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + 5, py - 2, 14, 3);
      ctx.fillRect(px + 5, py - 5, 3, 3);
      ctx.fillRect(px + 10, py - 6, 4, 4);
      ctx.fillRect(px + 16, py - 5, 3, 3);
      // Jewel
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + 11, py - 1, 2, 2);
    } else if (style === 'bandana') {
      // Cloth bandana wrap with spiky tufts & knot tails
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py - 2, 14, 4);
      ctx.fillRect(px + 7, py - 4, 3, 3);
      ctx.fillRect(px + 14, py - 4, 3, 3);
      // Wrap
      ctx.fillStyle = this.costume.hatColor || this.costume.accentColor;
      ctx.fillRect(px + 4, py + 1, 16, 4);
      // Flutter tails
      ctx.fillRect(px + 19, py + 2, 3, 3);
      ctx.fillRect(px + 21, py + 4, 2, 5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px + 6, py + 1, 12, 1);
    }
  }

  private renderPunchImpact(ctx: CanvasRenderingContext2D, px: number, py: number, dir: string, progress: number): void {
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    const impactAlpha = Math.sin(progress * Math.PI);
    ctx.globalAlpha = impactAlpha;

    let ix = px + 12;
    let iy = py + 14;
    if (dir === 'right') { ix = px + 28; iy = py + 14; }
    else if (dir === 'left') { ix = px - 4; iy = py + 14; }
    else if (dir === 'down') { ix = px + 12; iy = py + 28; }
    else if (dir === 'up') { ix = px + 12; iy = py; }

    // 1. Comic impact starburst (4-point diamond star)
    const starSize = 5 + Math.sin(progress * Math.PI) * 5;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(ix, iy - starSize);
    ctx.lineTo(ix + starSize * 0.35, iy - starSize * 0.35);
    ctx.lineTo(ix + starSize, iy);
    ctx.lineTo(ix + starSize * 0.35, iy + starSize * 0.35);
    ctx.lineTo(ix, iy + starSize);
    ctx.lineTo(ix - starSize * 0.35, iy + starSize * 0.35);
    ctx.lineTo(ix - starSize, iy);
    ctx.lineTo(ix - starSize * 0.35, iy - starSize * 0.35);
    ctx.closePath();
    ctx.fill();

    // 2. Punch core spark
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix - 1.5, iy - 1.5, 3, 3);

    // 3. Air woosh motion streaks
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    if (dir === 'right') {
      ctx.beginPath();
      ctx.moveTo(ix - 8, iy - 4); ctx.lineTo(ix + 6, iy - 5);
      ctx.moveTo(ix - 10, iy + 4); ctx.lineTo(ix + 6, iy + 5);
      ctx.stroke();
    } else if (dir === 'left') {
      ctx.beginPath();
      ctx.moveTo(ix + 8, iy - 4); ctx.lineTo(ix - 6, iy - 5);
      ctx.moveTo(ix + 10, iy + 4); ctx.lineTo(ix - 6, iy + 5);
      ctx.stroke();
    } else if (dir === 'down') {
      ctx.beginPath();
      ctx.moveTo(ix - 4, iy - 8); ctx.lineTo(ix - 5, iy + 6);
      ctx.moveTo(ix + 4, iy - 10); ctx.lineTo(ix + 5, iy + 6);
      ctx.stroke();
    } else if (dir === 'up') {
      ctx.beginPath();
      ctx.moveTo(ix - 4, iy + 8); ctx.lineTo(ix - 5, iy - 6);
      ctx.moveTo(ix + 4, iy + 10); ctx.lineTo(ix + 5, iy - 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderMinion(ctx: CanvasRenderingContext2D, minion: Minion): void {
    const mx = Math.floor(minion.x);
    const my = Math.floor(minion.y);
    const isRight = minion.direction !== 'left';

    ctx.save();

    if (minion.type === 'skeleton') {
      // 1. Minion shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(mx + 6, my + 18, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Bone Skull
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(mx + 2, my + 2, 8, 7);
      // Jaw
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(mx + 3, my + 8, 6, 2);

      // Glowing Necromancy Eyes
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 4;
      if (isRight) {
        ctx.fillRect(mx + 5, my + 4, 2, 2);
        ctx.fillRect(mx + 8, my + 4, 2, 2);
      } else {
        ctx.fillRect(mx + 3, my + 4, 2, 2);
        ctx.fillRect(mx + 6, my + 4, 2, 2);
      }
      ctx.shadowBlur = 0;

      // 3. Spine & Ribs
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(mx + 4, my + 10, 4, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx + 3, my + 11, 6, 1);
      ctx.fillRect(mx + 3, my + 13, 6, 1);

      // 4. Legs
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(mx + 3, my + 15, 2, 4);
      ctx.fillRect(mx + 7, my + 15, 2, 4);

      // 5. Bone Sword
      const swordX = isRight ? mx + 11 : mx - 1;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(swordX, my + 7, 2, 9);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(swordX - 1, my + 10, 4, 1.5);

      // 6. Attack Slash Arc Animation
      if (minion.attackTimer > 0) {
        const slashX = isRight ? mx + 15 : mx - 3;
        const slashAngle = isRight ? 0 : Math.PI;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(slashX, my + 9, 13, slashAngle - 0.75, slashAngle + 0.75);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 7. Mini HP Bar
      const hpPct = Math.min(1, Math.max(0, minion.hp / minion.maxHp));
      ctx.fillStyle = '#334155';
      ctx.fillRect(mx - 1, my - 4, 14, 2);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(mx - 1, my - 4, Math.round(14 * hpPct), 2);

    } else if (minion.type === 'bear') {
      // Roh Beruang Purba (Ethereal Spirit Bear)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(mx + 10, my + 20, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Translucent ethereal spirit body
      ctx.fillStyle = 'rgba(168, 85, 247, 0.85)';
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(mx, my + 4, 20, 14, 4);
      ctx.fill();

      // Bear head & muzzle
      const headX = isRight ? mx + 14 : mx - 6;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.roundRect(headX, my + 2, 11, 10, 3);
      ctx.fill();

      // Spirit eyes
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(isRight ? headX + 7 : headX + 2, my + 5, 2, 2);

      // Heavy Paws
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(mx + 2, my + 16, 4, 4);
      ctx.fillRect(mx + 14, my + 16, 4, 4);
      ctx.shadowBlur = 0;

      // Attack Claw Swipes
      if (minion.attackTimer > 0) {
        const clawX = isRight ? mx + 24 : mx - 6;
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        for (let c = -1; c <= 1; c++) {
          ctx.beginPath();
          ctx.moveTo(clawX + (isRight ? 0 : 6), my + 6 + c * 4);
          ctx.lineTo(clawX + (isRight ? 8 : -2), my + 13 + c * 4);
          ctx.stroke();
        }
      }

      // Mini HP Bar
      const hpPct = Math.min(1, Math.max(0, minion.hp / minion.maxHp));
      ctx.fillStyle = '#334155';
      ctx.fillRect(mx + 1, my - 4, 18, 2.5);
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(mx + 1, my - 4, Math.round(18 * hpPct), 2.5);

    } else if (minion.type === 'shadow') {
      // Klon Bayangan (Assassin Shadow Clone)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(mx + 6, my + 17, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.78;
      // Dark ninja body
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(mx + 2, my + 2, 8, 8);
      ctx.fillRect(mx + 3, my + 10, 6, 6);
      ctx.fillRect(mx + 3, my + 16, 2, 3);
      ctx.fillRect(mx + 7, my + 16, 2, 3);

      // Glowing Cyan Ninja Scarf & Eyes
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(mx + 2, my + 8, 8, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(isRight ? mx + 6 : mx + 3, my + 5, 2, 1.5);

      // Daggers
      ctx.fillStyle = '#67e8f9';
      const dagX = isRight ? mx + 10 : mx;
      ctx.fillRect(dagX, my + 10, 2, 6);

      // Attack Cross-Slash
      if (minion.attackTimer > 0) {
        const slashX = isRight ? mx + 14 : mx - 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(slashX - 4, my + 5); ctx.lineTo(slashX + 6, my + 15);
        ctx.moveTo(slashX + 6, my + 5); ctx.lineTo(slashX - 4, my + 15);
        ctx.stroke();
      }

      // Mini HP Bar
      const hpPct = Math.min(1, Math.max(0, minion.hp / minion.maxHp));
      ctx.fillStyle = '#334155';
      ctx.fillRect(mx - 1, my - 4, 14, 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(mx - 1, my - 4, Math.round(14 * hpPct), 2);
    }

    ctx.restore();
  }
}
