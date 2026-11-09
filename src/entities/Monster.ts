import { CONSTANTS } from '../core/Constants.ts';
import type { Minion } from './Player.ts';

export type MonsterType =
  | 'SLIME'
  | 'BAT'
  | 'SKELETON'
  | 'BOSS_SLIME'
  | 'FOREST_SLIME'
  | 'WILD_WOLF'
  | 'GOBLIN'
  | 'STONE_GOLEM'
  | 'CRYPT_SHADOW'
  | 'BOSS_TITAN_GOLEM'
  | 'INFERNO_HELLHOUND'
  | 'ABYSSAL_REAPER'
  | 'INFERNAL_KNIGHT'
  | 'BOSS_INFERNAL_DRAGON'
  | 'SYLVAN_SPRITE'
  | 'VINE_CREEPER'
  | 'TREANT_WARRIOR'
  | 'BOSS_ANCIENT_ENT'
  | 'CRYSTAL_SPIDER'
  | 'IRONCLAD_SKELETON'
  | 'ARMORED_GOLEM'
  | 'BOSS_OBSIDIAN_BEHEMOTH';
export type MonsterTier = 'LOW' | 'MID' | 'HIGH' | 'BOSS';

export interface MonsterDrop {
  itemId: string;
  count: number;
}

export class Monster {
  public id: string;
  public name: string;
  public type: MonsterType;
  public tier: MonsterTier = 'LOW';
  public tierLabel: string = 'Tingkat Bawah';
  public isPlayerNearby: boolean = false;
  public x: number;
  public y: number;
  public spawnX: number;
  public spawnY: number;
  public width: number;
  public height: number;

  public hp: number;
  public maxHp: number;
  public level: number;
  public attackPower: number;
  public expReward: number;
  public goldReward: number;
  public speed: number;
  public aggroRange: number = 110;

  public isDead: boolean = false;
  public respawnTimer: number = 0;
  public hurtTimer: number = 0;
  public attackCooldown: number = 0;
  public telegraphCooldown: number = 0;

  public vx: number = 0;
  public vy: number = 0;
  public knockbackX: number = 0;
  public knockbackY: number = 0;
  public direction: 'left' | 'right' = 'right';

  private animTimer: number = Math.random() * 10;
  private wanderTimer: number = 0;
  private wanderVx: number = 0;
  private wanderVy: number = 0;

  constructor(id: string, type: MonsterType, x: number, y: number) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;

    switch (type) {
      case 'SLIME':
        this.name = 'Slime Gua';
        this.width = 20;
        this.height = 18;
        this.maxHp = 45;
        this.level = 2;
        this.attackPower = 8;
        this.expReward = 25;
        this.goldReward = 16;
        this.speed = 36;
        this.aggroRange = 100;
        this.tier = 'LOW';
        this.tierLabel = 'Goa Bawah';
        break;
      case 'BAT':
        this.name = 'Kelelawar Gua';
        this.width = 22;
        this.height = 16;
        this.maxHp = 32;
        this.level = 3;
        this.attackPower = 9;
        this.expReward = 28;
        this.goldReward = 14;
        this.speed = 60;
        this.aggroRange = 120;
        this.tier = 'MID';
        this.tierLabel = 'Goa Menengah';
        break;
      case 'SKELETON':
        this.name = 'Prajurit Tengkorak';
        this.width = 22;
        this.height = 26;
        this.maxHp = 85;
        this.level = 4;
        this.attackPower = 15;
        this.expReward = 55;
        this.goldReward = 38;
        this.speed = 42;
        this.aggroRange = 115;
        this.tier = 'HIGH';
        this.tierLabel = 'Goa Elit';
        break;
      case 'BOSS_SLIME':
        this.name = 'Raja Slime Purba';
        this.width = 38;
        this.height = 34;
        this.maxHp = 300;
        this.level = 8;
        this.attackPower = 24;
        this.expReward = 280;
        this.goldReward = 180;
        this.speed = 32;
        this.aggroRange = 140;
        this.tier = 'BOSS';
        this.tierLabel = 'Penguasa Goa';
        break;
      case 'FOREST_SLIME':
        this.name = 'Slime Hutan';
        this.width = 20;
        this.height = 18;
        this.maxHp = 35;
        this.level = 1;
        this.attackPower = 5;
        this.expReward = 20;
        this.goldReward = 12;
        this.speed = 32;
        this.aggroRange = 90;
        this.tier = 'LOW';
        this.tierLabel = 'Tingkat Bawah';
        break;
      case 'WILD_WOLF':
        this.name = 'Serigala Rimba';
        this.width = 24;
        this.height = 20;
        this.maxHp = 65;
        this.level = 3;
        this.attackPower = 11;
        this.expReward = 38;
        this.goldReward = 22;
        this.speed = 48;
        this.aggroRange = 120;
        this.tier = 'MID';
        this.tierLabel = 'Tingkat Menengah';
        break;
      case 'GOBLIN':
        this.name = 'Pengawal Gerbang Goblin';
        this.width = 20;
        this.height = 24;
        this.maxHp = 80;
        this.level = 4;
        this.attackPower = 14;
        this.expReward = 50;
        this.goldReward = 32;
        this.speed = 40;
        this.aggroRange = 110;
        this.tier = 'MID';
        this.tierLabel = 'Tingkat Menengah';
        break;
      case 'STONE_GOLEM':
        this.name = 'Golem Batu Kuno';
        this.width = 28;
        this.height = 28;
        this.maxHp = 160;
        this.level = 6;
        this.attackPower = 20;
        this.expReward = 85;
        this.goldReward = 55;
        this.speed = 28;
        this.aggroRange = 105;
        this.tier = 'HIGH';
        this.tierLabel = 'Makam Kuno';
        break;
      case 'CRYPT_SHADOW':
        this.name = 'Bayangan Makam Purba';
        this.width = 22;
        this.height = 24;
        this.maxHp = 120;
        this.level = 7;
        this.attackPower = 25;
        this.expReward = 95;
        this.goldReward = 60;
        this.speed = 52;
        this.aggroRange = 130;
        this.tier = 'HIGH';
        this.tierLabel = 'Makam Kuno';
        break;
      case 'BOSS_TITAN_GOLEM':
        this.name = 'Titan Abisal Kolosal';
        this.width = 46;
        this.height = 46;
        this.maxHp = 650;
        this.level = 12;
        this.attackPower = 36;
        this.expReward = 550;
        this.goldReward = 380;
        this.speed = 26;
        this.aggroRange = 160;
        this.tier = 'BOSS';
        this.tierLabel = 'Penguasa Makam Kuno';
        break;
      case 'INFERNO_HELLHOUND':
        this.name = 'Hellhound Api Abisal';
        this.width = 26;
        this.height = 20;
        this.maxHp = 160;
        this.level = 9;
        this.attackPower = 28;
        this.expReward = 140;
        this.goldReward = 90;
        this.speed = 56;
        this.aggroRange = 130;
        this.tier = 'HIGH';
        this.tierLabel = 'Neraka Bawah';
        break;
      case 'ABYSSAL_REAPER':
        this.name = 'Penyabit Jiwa Abisal';
        this.width = 24;
        this.height = 26;
        this.maxHp = 210;
        this.level = 11;
        this.attackPower = 35;
        this.expReward = 190;
        this.goldReward = 125;
        this.speed = 46;
        this.aggroRange = 140;
        this.tier = 'HIGH';
        this.tierLabel = 'Neraka Elit';
        break;
      case 'INFERNAL_KNIGHT':
        this.name = 'Ksatria Neraka Membara';
        this.width = 26;
        this.height = 28;
        this.maxHp = 280;
        this.level = 13;
        this.attackPower = 42;
        this.expReward = 260;
        this.goldReward = 160;
        this.speed = 38;
        this.aggroRange = 135;
        this.tier = 'HIGH';
        this.tierLabel = 'Neraka Elit';
        break;
      case 'BOSS_INFERNAL_DRAGON':
        this.name = 'Raja Naga Api Ignis';
        this.width = 56;
        this.height = 52;
        this.maxHp = 1200;
        this.level = 18;
        this.attackPower = 52;
        this.expReward = 1200;
        this.goldReward = 800;
        this.speed = 30;
        this.aggroRange = 180;
        this.tier = 'BOSS';
        this.tierLabel = 'Penguasa Neraka Abisal';
        break;
      // --- MONSTER KUIL ROH HUTAN ELDORIA ---
      case 'SYLVAN_SPRITE':
        this.name = 'Peri Daun Mistis';
        this.width = 20;
        this.height = 20;
        this.maxHp = 90;
        this.level = 7;
        this.attackPower = 15;
        this.expReward = 75;
        this.goldReward = 45;
        this.speed = 52;
        this.aggroRange = 115;
        this.tier = 'LOW';
        this.tierLabel = 'Kuil Rimba';
        break;
      case 'VINE_CREEPER':
        this.name = 'Monster Sulur Berduri';
        this.width = 24;
        this.height = 22;
        this.maxHp = 150;
        this.level = 10;
        this.attackPower = 23;
        this.expReward = 125;
        this.goldReward = 75;
        this.speed = 42;
        this.aggroRange = 125;
        this.tier = 'MID';
        this.tierLabel = 'Kuil Rimba';
        break;
      case 'TREANT_WARRIOR':
        this.name = 'Prajurit Pohon Purba';
        this.width = 28;
        this.height = 32;
        this.maxHp = 250;
        this.level = 14;
        this.attackPower = 34;
        this.expReward = 220;
        this.goldReward = 130;
        this.speed = 34;
        this.aggroRange = 120;
        this.tier = 'HIGH';
        this.tierLabel = 'Kuil Elit';
        break;
      case 'BOSS_ANCIENT_ENT':
        this.name = 'Raksasa Roh Pohon Purba';
        this.width = 52;
        this.height = 52;
        this.maxHp = 1100;
        this.level = 17;
        this.attackPower = 48;
        this.expReward = 1100;
        this.goldReward = 750;
        this.speed = 28;
        this.aggroRange = 170;
        this.tier = 'BOSS';
        this.tierLabel = 'Penguasa Rimba Suci';
        break;
      // --- MONSTER TAMBANG TERKUTUK STONEWATCH ---
      case 'CRYSTAL_SPIDER':
        this.name = 'Laba-laba Kristal Tambang';
        this.width = 22;
        this.height = 18;
        this.maxHp = 120;
        this.level = 9;
        this.attackPower = 19;
        this.expReward = 95;
        this.goldReward = 55;
        this.speed = 56;
        this.aggroRange = 125;
        this.tier = 'LOW';
        this.tierLabel = 'Tambang Abisal';
        break;
      case 'IRONCLAD_SKELETON':
        this.name = 'Tengkorak Zirah Besi';
        this.width = 24;
        this.height = 28;
        this.maxHp = 210;
        this.level = 13;
        this.attackPower = 30;
        this.expReward = 175;
        this.goldReward = 100;
        this.speed = 38;
        this.aggroRange = 125;
        this.tier = 'MID';
        this.tierLabel = 'Tambang Abisal';
        break;
      case 'ARMORED_GOLEM':
        this.name = 'Golem Tambang Besi Baja';
        this.width = 30;
        this.height = 30;
        this.maxHp = 340;
        this.level = 16;
        this.attackPower = 40;
        this.expReward = 280;
        this.goldReward = 165;
        this.speed = 32;
        this.aggroRange = 130;
        this.tier = 'HIGH';
        this.tierLabel = 'Tambang Elit';
        break;
      case 'BOSS_OBSIDIAN_BEHEMOTH':
        this.name = 'Behemoth Obsidian Abisal';
        this.width = 54;
        this.height = 50;
        this.maxHp = 1400;
        this.level = 21;
        this.attackPower = 58;
        this.expReward = 1500;
        this.goldReward = 1000;
        this.speed = 30;
        this.aggroRange = 180;
        this.tier = 'BOSS';
        this.tierLabel = 'Penguasa Tambang Terkutuk';
        break;
    }

    this.hp = this.maxHp;
  }

  public takeDamage(amount: number, fromX: number, fromY: number): { isDead: boolean; damage: number } {
    if (this.isDead) return { isDead: false, damage: 0 };

    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - damage);
    this.hurtTimer = 0.22;

    // Knockback away from hit source
    const angle = Math.atan2((this.y + this.height / 2) - fromY, (this.x + this.width / 2) - fromX);
    const isHeavyBoss = this.type === 'BOSS_INFERNAL_DRAGON' || this.type === 'BOSS_OBSIDIAN_BEHEMOTH' || this.type === 'BOSS_ANCIENT_ENT';
    const knockForce = isHeavyBoss ? 15 : (this.type === 'BOSS_TITAN_GOLEM' ? 25 : (this.type === 'BOSS_SLIME' ? 60 : 140));
    this.knockbackX = Math.cos(angle) * knockForce;
    this.knockbackY = Math.sin(angle) * knockForce;

    if (this.hp <= 0) {
      this.isDead = true;
      this.respawnTimer = this.tier === 'BOSS' ? 70 : 22;
      return { isDead: true, damage };
    }

    return { isDead: false, damage };
  }

  public update(
    deltaTime: number,
    playerCenterX: number,
    playerCenterY: number,
    isTileSolid: (tileX: number, tileY: number) => boolean,
    onAttackPlayer: (atk: number) => void,
    minions?: Minion[],
    onAttackMinion?: (minion: Minion, atk: number) => void,
    companion?: { x: number; y: number; hp: number; takeDamage: (dmg: number, fromX: number, fromY: number) => void } | null,
    onSpawnTelegraph?: (x: number, y: number, radius: number, duration: number, damage: number) => void
  ): void {
    if (this.isDead) {
      this.respawnTimer -= deltaTime;
      if (this.respawnTimer <= 0) {
        this.isDead = false;
        this.hp = this.maxHp;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.knockbackX = 0;
        this.knockbackY = 0;
      }
      return;
    }

    this.animTimer += deltaTime;
    if (this.hurtTimer > 0) this.hurtTimer -= deltaTime;
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.telegraphCooldown > 0) this.telegraphCooldown -= deltaTime;

    const myCenterX = this.x + this.width / 2;
    const myCenterY = this.y + this.height / 2;
    const distToPlayer = Math.hypot(myCenterX - playerCenterX, myCenterY - playerCenterY);
    this.isPlayerNearby = distToPlayer < 85;

    // Boss Titan Golem: Telegraph AOE Ground Attack
    if (this.type === 'BOSS_TITAN_GOLEM' && onSpawnTelegraph && !this.isDead) {
      if (distToPlayer <= 180 && this.telegraphCooldown <= 0) {
        this.telegraphCooldown = 4.2;
        // Carpet red telegraph zone under player
        onSpawnTelegraph(playerCenterX, playerCenterY, 48, 1.7, 36);
        // Seismic tremor telegraph near boss
        onSpawnTelegraph(myCenterX, myCenterY, 60, 2.2, 42);
      }
    }

    // Boss Infernal Dragon: Telegraph AOE Magma & Hellfire Breath
    if (this.type === 'BOSS_INFERNAL_DRAGON' && onSpawnTelegraph && !this.isDead) {
      if (distToPlayer <= 220 && this.telegraphCooldown <= 0) {
        this.telegraphCooldown = 3.8;
        // Meteor landing circle directly under player
        onSpawnTelegraph(playerCenterX, playerCenterY, 54, 1.6, 52);
        // Fiery breath blast cone in front of dragon
        const breathX = myCenterX + (this.direction === 'left' ? -48 : 48);
        onSpawnTelegraph(breathX, myCenterY + 6, 62, 2.0, 58);
      }
    }

    // 1. Knockback Decay
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(this.knockbackX) > 5 || Math.abs(this.knockbackY) > 5) {
      moveX = this.knockbackX * deltaTime;
      moveY = this.knockbackY * deltaTime;
      this.knockbackX *= 0.82;
      this.knockbackY *= 0.82;
    } else {
      // Leash to Spawn Area (Mencegah monster hutan rimba berkeliaran keluar habitatnya)
      const distFromSpawn = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);

      if (distFromSpawn > 220) {
        // Monster terlalu jauh dari habitat aslinya, tarik kembali perlahan
        const backAngle = Math.atan2(this.spawnY - this.y, this.spawnX - this.x);
        moveX = Math.cos(backAngle) * this.speed * deltaTime * 0.85;
        moveY = Math.sin(backAngle) * this.speed * deltaTime * 0.85;
        this.direction = (this.spawnX < this.x) ? 'left' : 'right';
      } else {
        // Cek target pet/minion atau companion
        let targetMinion: Minion | null = null;
        let closestMinionDist = Infinity;

        if (minions && minions.length > 0) {
          for (const m of minions) {
            if (m.hp <= 0) continue;
            const mCenterX = m.x + 8;
            const mCenterY = m.y + 12;
            const dist = Math.hypot(myCenterX - mCenterX, myCenterY - mCenterY);
            if (dist <= Math.max(this.aggroRange, 140) && dist < closestMinionDist) {
              closestMinionDist = dist;
              targetMinion = m;
            }
          }
        }

        // Cek Companion target
        let distToCompanion = Infinity;
        let companionCenterX = 0;
        let companionCenterY = 0;
        if (companion && companion.hp > 0) {
          companionCenterX = companion.x + 12;
          companionCenterY = companion.y + 16;
          distToCompanion = Math.hypot(myCenterX - companionCenterX, myCenterY - companionCenterY);
        }

        const attackReach = (this.type === 'BOSS_INFERNAL_DRAGON' || this.type === 'BOSS_OBSIDIAN_BEHEMOTH')
          ? 44
          : (this.type === 'BOSS_TITAN_GOLEM' || this.type === 'BOSS_ANCIENT_ENT')
          ? 38
          : (this.type === 'BOSS_SLIME' ? 32 : 22);

        // PRIORITAS 1: Serang Minion/Pet
        if (targetMinion) {
          const mCenterX = targetMinion.x + 8;
          const mCenterY = targetMinion.y + 12;
          const angle = Math.atan2(mCenterY - myCenterY, mCenterX - myCenterX);
          moveX = Math.cos(angle) * this.speed * deltaTime;
          moveY = Math.sin(angle) * this.speed * deltaTime;
          this.direction = (mCenterX < myCenterX) ? 'left' : 'right';

          if (closestMinionDist <= attackReach && this.attackCooldown <= 0) {
            this.attackCooldown = 1.35;
            if (onAttackMinion) {
              onAttackMinion(targetMinion, this.attackPower);
            }
          }
        }
        // PRIORITAS 2: Serang Rekan Party / Companion jika ada di dekatnya
        else if (companion && companion.hp > 0 && distToCompanion <= Math.max(this.aggroRange, 130)) {
          const angle = Math.atan2(companionCenterY - myCenterY, companionCenterX - myCenterX);
          moveX = Math.cos(angle) * this.speed * deltaTime;
          moveY = Math.sin(angle) * this.speed * deltaTime;
          this.direction = (companionCenterX < myCenterX) ? 'left' : 'right';

          if (distToCompanion <= attackReach && this.attackCooldown <= 0) {
            this.attackCooldown = 1.35;
            companion.takeDamage(this.attackPower, myCenterX, myCenterY);
          }
        }
        // PRIORITAS 3: Serang Player jika tidak ada sekutu terdekat
        else if (distToPlayer <= this.aggroRange) {
          const angle = Math.atan2(playerCenterY - myCenterY, playerCenterX - myCenterX);
          moveX = Math.cos(angle) * this.speed * deltaTime;
          moveY = Math.sin(angle) * this.speed * deltaTime;
          this.direction = (playerCenterX < myCenterX) ? 'left' : 'right';

          if (distToPlayer <= attackReach && this.attackCooldown <= 0) {
            this.attackCooldown = 1.35;
            onAttackPlayer(this.attackPower);
          }
        } else {
          // Idle Wander
          this.wanderTimer -= deltaTime;
          if (this.wanderTimer <= 0) {
            this.wanderTimer = 1.5 + Math.random() * 2;
            if (Math.random() < 0.6) {
              const angle = Math.random() * Math.PI * 2;
              this.wanderVx = Math.cos(angle) * (this.speed * 0.4);
              this.wanderVy = Math.sin(angle) * (this.speed * 0.4);
              this.direction = this.wanderVx < 0 ? 'left' : 'right';
            } else {
              this.wanderVx = 0;
              this.wanderVy = 0;
            }
          }
          moveX = this.wanderVx * deltaTime;
          moveY = this.wanderVy * deltaTime;
        }
      }
    }

    // 3. Collision with Map Walls & Village Safe Zone Protection
    const nextX = this.x + moveX;
    const nextY = this.y + moveY;
    const ts = CONSTANTS.TILE_SIZE;
    const isOverworld = this.type === 'FOREST_SLIME' || this.type === 'WILD_WOLF' || this.type === 'GOBLIN';

    // Helper cek batas pedesaan (x: 39..61, y: 41..59)
    const isInsideVillage = (px: number, py: number) => {
      const tx = px / ts;
      const ty = py / ts;
      return tx >= 39 && tx <= 61 && ty >= 41 && ty <= 59;
    };

    // Check X move
    const leftTileX = Math.floor(nextX / ts);
    const rightTileX = Math.floor((nextX + this.width) / ts);
    const topTileY = Math.floor(this.y / ts);
    const bottomTileY = Math.floor((this.y + this.height) / ts);

    let collidesX = false;
    for (let ty = topTileY; ty <= bottomTileY; ty++) {
      for (let tx = leftTileX; tx <= rightTileX; tx++) {
        if (isTileSolid(tx, ty)) {
          collidesX = true;
          break;
        }
      }
      if (collidesX) break;
    }

    // Larangan mutlak monster masuk pedesaan pada sumbu X
    if (isOverworld && (isInsideVillage(nextX, this.y) || isInsideVillage(nextX + this.width, this.y + this.height))) {
      collidesX = true;
    }

    if (!collidesX) this.x = nextX;

    // Check Y move
    const curLeftX = Math.floor(this.x / ts);
    const curRightX = Math.floor((this.x + this.width) / ts);
    const nextTopY = Math.floor(nextY / ts);
    const nextBottomY = Math.floor((nextY + this.height) / ts);

    let collidesY = false;
    for (let ty = nextTopY; ty <= nextBottomY; ty++) {
      for (let tx = curLeftX; tx <= curRightX; tx++) {
        if (isTileSolid(tx, ty)) {
          collidesY = true;
          break;
        }
      }
      if (collidesY) break;
    }

    // Larangan mutlak monster masuk pedesaan pada sumbu Y
    if (isOverworld && (isInsideVillage(this.x, nextY) || isInsideVillage(this.x + this.width, nextY + this.height))) {
      collidesY = true;
    }

    if (!collidesY) this.y = nextY;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const isFlashing = this.hurtTimer > 0;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height, this.width / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render by Monster Type
    switch (this.type) {
      case 'SLIME':
        this.renderSlime(ctx, x, y, isFlashing);
        break;
      case 'BAT':
        this.renderBat(ctx, x, y, isFlashing);
        break;
      case 'SKELETON':
        this.renderSkeleton(ctx, x, y, isFlashing);
        break;
      case 'BOSS_SLIME':
        this.renderBossSlime(ctx, x, y, isFlashing);
        break;
      case 'FOREST_SLIME':
        this.renderForestSlime(ctx, x, y, isFlashing);
        break;
      case 'WILD_WOLF':
        this.renderWildWolf(ctx, x, y, isFlashing);
        break;
      case 'GOBLIN':
        this.renderGoblin(ctx, x, y, isFlashing);
        break;
      case 'STONE_GOLEM':
        this.renderStoneGolem(ctx, x, y, isFlashing);
        break;
      case 'CRYPT_SHADOW':
        this.renderCryptShadow(ctx, x, y, isFlashing);
        break;
      case 'BOSS_TITAN_GOLEM':
        this.renderBossTitanGolem(ctx, x, y, isFlashing);
        break;
      case 'INFERNO_HELLHOUND':
        this.renderHellhound(ctx, x, y, isFlashing);
        break;
      case 'ABYSSAL_REAPER':
        this.renderAbyssalReaper(ctx, x, y, isFlashing);
        break;
      case 'INFERNAL_KNIGHT':
        this.renderInfernalKnight(ctx, x, y, isFlashing);
        break;
      case 'BOSS_INFERNAL_DRAGON':
        this.renderBossDragon(ctx, x, y, isFlashing);
        break;
      case 'SYLVAN_SPRITE':
        this.renderSylvanSprite(ctx, x, y, isFlashing);
        break;
      case 'VINE_CREEPER':
        this.renderVineCreeper(ctx, x, y, isFlashing);
        break;
      case 'TREANT_WARRIOR':
        this.renderTreantWarrior(ctx, x, y, isFlashing);
        break;
      case 'BOSS_ANCIENT_ENT':
        this.renderBossAncientEnt(ctx, x, y, isFlashing);
        break;
      case 'CRYSTAL_SPIDER':
        this.renderCrystalSpider(ctx, x, y, isFlashing);
        break;
      case 'IRONCLAD_SKELETON':
        this.renderIroncladSkeleton(ctx, x, y, isFlashing);
        break;
      case 'ARMORED_GOLEM':
        this.renderArmoredGolem(ctx, x, y, isFlashing);
        break;
      case 'BOSS_OBSIDIAN_BEHEMOTH':
        this.renderBossObsidianBehemoth(ctx, x, y, isFlashing);
        break;
    }

    // Health Bar & Name Tag
    this.renderHealthBar(ctx, x, y);

    ctx.restore();
  }

  private renderSlime(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const squish = Math.sin(this.animTimer * 6) * 2;
    const bodyW = this.width + squish;
    const bodyH = this.height - squish;
    const bx = x - squish / 2;
    const by = y + squish;

    // Gelatinous Slime Body
    ctx.fillStyle = flash ? '#ffffff' : '#059669';
    ctx.beginPath();
    ctx.ellipse(bx + bodyW / 2, by + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!flash) {
      // Inner lighter jelly core
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.ellipse(bx + bodyW / 2, by + bodyH / 2 - 1, (bodyW / 2) * 0.7, (bodyH / 2) * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slime Eyes (Looking in direction)
      const eyeDir = this.direction === 'left' ? -2 : 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx + bodyW / 2 - 4 + eyeDir, by + 4, 2, 3);
      ctx.fillRect(bx + bodyW / 2 + 2 + eyeDir, by + 4, 2, 3);
      // Eye Highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + bodyW / 2 - 4 + eyeDir, by + 4, 1, 1);
      ctx.fillRect(bx + bodyW / 2 + 2 + eyeDir, by + 4, 1, 1);
    }
  }

  private renderBat(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const flap = Math.sin(this.animTimer * 14) * 5;
    const bx = x + this.width / 2;
    const by = y + this.height / 2;

    // Bat Wings
    ctx.fillStyle = flash ? '#ffffff' : '#1e1b4b';
    ctx.beginPath();
    // Left Wing
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 12, by - 6 + flap);
    ctx.lineTo(bx - 14, by + 2 - flap);
    ctx.lineTo(bx - 6, by + 4);
    // Right Wing
    ctx.lineTo(bx + 6, by + 4);
    ctx.lineTo(bx + 14, by + 2 - flap);
    ctx.lineTo(bx + 12, by - 6 + flap);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = flash ? '#ffffff' : '#312e81';
    ctx.beginPath();
    ctx.ellipse(bx, by, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Red Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx - 2, by - 2, 1.5, 1.5);
    ctx.fillRect(bx + 1, by - 2, 1.5, 1.5);
  }

  private renderSkeleton(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const walkStep = Math.sin(this.animTimer * 6) * 2;
    const col = flash ? '#ffffff' : '#e2e8f0';

    // Ribcage & Pelvis
    ctx.fillStyle = col;
    ctx.fillRect(x + 7, y + 8, 8, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 8, y + 10, 6, 2); // Rib gap

    // Legs
    ctx.fillStyle = col;
    ctx.fillRect(x + 7, y + 16, 2, 8 + walkStep);
    ctx.fillRect(x + 13, y + 16, 2, 8 - walkStep);

    // Skull Head
    ctx.fillStyle = col;
    ctx.fillRect(x + 6, y, 10, 8);
    // Eye Sockets (Glowing cyan)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(x + 7, y + 3, 2, 2);
    ctx.fillRect(x + 12, y + 3, 2, 2);

    // Bone Sword
    ctx.fillStyle = '#94a3b8';
    const swordX = this.direction === 'right' ? x + 16 : x + 2;
    ctx.fillRect(swordX, y + 6, 2, 12);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(swordX - 1, y + 13, 4, 2);
  }

  private renderBossSlime(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const squish = Math.sin(this.animTimer * 4) * 3;
    const bodyW = this.width + squish;
    const bodyH = this.height - squish;
    const bx = x - squish / 2;
    const by = y + squish;

    // Giant Purple Abyssal Slime Body
    ctx.fillStyle = flash ? '#ffffff' : '#6b21a8';
    ctx.beginPath();
    ctx.ellipse(bx + bodyW / 2, by + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!flash) {
      // Inner glowing core
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(bx + bodyW / 2, by + bodyH / 2 - 2, (bodyW / 2) * 0.7, (bodyH / 2) * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Menacing Eyes
      const eyeDir = this.direction === 'left' ? -3 : 3;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + bodyW / 2 - 8 + eyeDir, by + 8, 4, 4);
      ctx.fillRect(bx + bodyW / 2 + 4 + eyeDir, by + 8, 4, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bx + bodyW / 2 - 7 + eyeDir, by + 9, 2, 2);
      ctx.fillRect(bx + bodyW / 2 + 5 + eyeDir, by + 9, 2, 2);

      // Royal Golden Crown on Boss Head
      const crownX = bx + bodyW / 2 - 8;
      const crownY = by - 8;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(crownX, crownY + 4, 16, 4);
      ctx.fillRect(crownX, crownY, 3, 5);
      ctx.fillRect(crownX + 6, crownY - 2, 4, 7);
      ctx.fillRect(crownX + 13, crownY, 3, 5);
      // Red Ruby
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(crownX + 7, crownY + 4, 2, 2);
    }
  }

  private renderForestSlime(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const squish = Math.sin(this.animTimer * 6) * 2;
    const bodyW = this.width + squish;
    const bodyH = this.height - squish;
    const bx = x - squish / 2;
    const by = y + squish;

    // Forest Slime: Bright lime green body
    ctx.fillStyle = flash ? '#ffffff' : '#16a34a';
    ctx.beginPath();
    ctx.ellipse(bx + bodyW / 2, by + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!flash) {
      // Inner lighter jelly core
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(bx + bodyW / 2, by + bodyH / 2 - 1, (bodyW / 2) * 0.7, (bodyH / 2) * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slime Eyes
      const eyeDir = this.direction === 'left' ? -2 : 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + bodyW / 2 - 4 + eyeDir, by + 4, 3, 4);
      ctx.fillRect(bx + bodyW / 2 + 2 + eyeDir, by + 4, 3, 4);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(bx + bodyW / 2 - 3 + eyeDir, by + 5, 2, 2);
      ctx.fillRect(bx + bodyW / 2 + 3 + eyeDir, by + 5, 2, 2);

      // Cute Little Yellow Flower Sprout on Head
      ctx.fillStyle = '#15803d';
      ctx.fillRect(bx + bodyW / 2 - 1, by - 3, 2, 4);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bx + bodyW / 2, by - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderWildWolf(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const runOffset = Math.sin(this.animTimer * 10) * 1.5;
    const isLeft = this.direction === 'left';

    // Body
    ctx.fillStyle = flash ? '#ffffff' : '#64748b';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 6 + runOffset, 20, 10, 4);
    ctx.fill();

    if (!flash) {
      // Underbelly
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 6, y + 11 + runOffset, 12, 4);

      // Head
      const hx = isLeft ? x : x + 14;
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(hx, y + 3 + runOffset, 10, 8, 3);
      ctx.fill();

      // Pointy Ears
      ctx.fillStyle = '#334155';
      ctx.fillRect(hx + 2, y + 1 + runOffset, 2, 3);
      ctx.fillRect(hx + 6, y + 1 + runOffset, 2, 3);

      // Fierce Amber Eyes
      ctx.fillStyle = '#f59e0b';
      const eyeX = isLeft ? hx + 2 : hx + 6;
      ctx.fillRect(eyeX, y + 5 + runOffset, 2, 2);

      // Bushy Wagging Tail
      const tailWag = Math.sin(this.animTimer * 12) * 2;
      const tx = isLeft ? x + 20 : x;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(tx, y + 6 + runOffset + tailWag, 4, 4);

      // Paws
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 4, y + 15, 3, 5);
      ctx.fillRect(x + 16, y + 15, 3, 5);
    }
  }

  private renderGoblin(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const bob = Math.sin(this.animTimer * 8) * 1.5;
    const isLeft = this.direction === 'left';

    // Body (Brown ragged vest)
    ctx.fillStyle = flash ? '#ffffff' : '#78350f';
    ctx.fillRect(x + 5, y + 10 + bob, 10, 8);

    // Green Head
    ctx.fillStyle = flash ? '#ffffff' : '#15803d';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 3 + bob, 12, 8, 3);
    ctx.fill();

    if (!flash) {
      // Pointed Goblin Ears
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x + 1, y + 4 + bob, 3, 2);
      ctx.fillRect(x + 16, y + 4 + bob, 3, 2);

      // Red Bandana
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + 4, y + 2 + bob, 12, 2);

      // Yellow Eyes
      ctx.fillStyle = '#facc15';
      const ex = isLeft ? x + 6 : x + 10;
      ctx.fillRect(ex, y + 5 + bob, 2, 2);

      // Wooden Cudgel / Club Weapon
      const clubX = isLeft ? x - 1 : x + 16;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(clubX, y + 6 + bob, 3, 10);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(clubX - 1, y + 4 + bob, 5, 4);

      // Legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 6, y + 18, 3, 5);
      ctx.fillRect(x + 11, y + 18, 3, 5);
    }
  }

  private renderStoneGolem(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const bob = Math.sin(this.animTimer * 2.5) * 1.5;
    const isLeft = this.direction === 'left';

    // Stone Torso
    ctx.fillStyle = flash ? '#ffffff' : '#475569';
    ctx.fillRect(x + 4, y + 8 + bob, 20, 14);

    // Stone Armor Plates
    if (!flash) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 6, y + 10 + bob, 7, 5);
      ctx.fillRect(x + 15, y + 10 + bob, 7, 5);

      // Cyan Glowing Rune Cracks
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 13, y + 9 + bob, 2, 10);
      ctx.fillRect(x + 8, y + 14 + bob, 12, 2);

      // Stone Head
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 7, y + 2 + bob, 14, 7);

      // Cyan Eye Slits
      ctx.fillStyle = '#06b6d4';
      if (isLeft) {
        ctx.fillRect(x + 8, y + 4 + bob, 3, 2);
        ctx.fillRect(x + 13, y + 4 + bob, 3, 2);
      } else {
        ctx.fillRect(x + 12, y + 4 + bob, 3, 2);
        ctx.fillRect(x + 17, y + 4 + bob, 3, 2);
      }

      // Stone Arms / Boulder Fists
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 1, y + 10 + bob, 4, 10);
      ctx.fillRect(x + 23, y + 10 + bob, 4, 10);

      // Stone Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 6, y + 22 + bob, 6, 6);
      ctx.fillRect(x + 16, y + 22 + bob, 6, 6);
    }
  }

  private renderCryptShadow(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const floatY = Math.sin(this.animTimer * 4) * 3;
    const isLeft = this.direction === 'left';

    // Shadow Mist Aura
    ctx.fillStyle = flash ? '#ffffff' : 'rgba(88, 28, 135, 0.45)';
    ctx.beginPath();
    ctx.arc(x + 11, y + 12 + floatY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Dark Hooded Robe
    ctx.fillStyle = flash ? '#ffffff' : '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 2 + floatY);
    ctx.lineTo(x + 21, y + 22 + floatY);
    ctx.lineTo(x + 1, y + 22 + floatY);
    ctx.closePath();
    ctx.fill();

    if (!flash) {
      // Dark Inner Cowl
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(x + 11, y + 8 + floatY, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Piercing Crimson Eyes
      ctx.fillStyle = '#ef4444';
      if (isLeft) {
        ctx.fillRect(x + 8, y + 7 + floatY, 2, 2);
        ctx.fillRect(x + 12, y + 7 + floatY, 2, 2);
      } else {
        ctx.fillRect(x + 10, y + 7 + floatY, 2, 2);
        ctx.fillRect(x + 14, y + 7 + floatY, 2, 2);
      }

      // Trailing Shadow Tendrils
      ctx.fillStyle = '#581c87';
      const tendrilSway = Math.sin(this.animTimer * 6) * 2;
      ctx.fillRect(x + 4, y + 20 + floatY, 3, 5 + tendrilSway);
      ctx.fillRect(x + 10, y + 21 + floatY, 3, 6 - tendrilSway);
      ctx.fillRect(x + 16, y + 20 + floatY, 3, 5 + tendrilSway);
    }
  }

  private renderBossTitanGolem(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const stomp = Math.sin(this.animTimer * 2.2) * 2;
    const isLeft = this.direction === 'left';

    // Ancient Granite Torso
    ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
    ctx.fillRect(x + 8, y + 14 + stomp, 30, 22);

    if (!flash) {
      // Obsidian Armor Plating
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 10, y + 16 + stomp, 12, 10);
      ctx.fillRect(x + 24, y + 16 + stomp, 12, 10);

      // Glowing Magma Runic Veins across chest
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + 22, y + 15 + stomp, 2, 18);
      ctx.fillRect(x + 12, y + 24 + stomp, 22, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + 21, y + 23 + stomp, 4, 4); // Core spark

      // Massive Horned Granite Head
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 14, y + 3 + stomp, 18, 12);

      // Horn Crests
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 6 + stomp);
      ctx.lineTo(x + 8, y - 2 + stomp);
      ctx.lineTo(x + 15, y + 3 + stomp);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 34, y + 6 + stomp);
      ctx.lineTo(x + 38, y - 2 + stomp);
      ctx.lineTo(x + 31, y + 3 + stomp);
      ctx.fill();

      // Glowing Abyssal Eye Monolith
      ctx.fillStyle = '#ef4444';
      const eyeX = isLeft ? x + 18 : x + 24;
      ctx.fillRect(eyeX, y + 7 + stomp, 5, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(eyeX + 1, y + 8 + stomp, 3, 2);

      // Colossal Granite Shoulders & Fists
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 1, y + 14 + stomp, 8, 18);
      ctx.fillRect(x + 37, y + 14 + stomp, 8, 18);

      // Glowing Fist Runes
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x + 3, y + 26 + stomp, 4, 3);
      ctx.fillRect(x + 39, y + 26 + stomp, 4, 3);

      // Heavy Stone Stilt Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 11, y + 36 + stomp, 9, 10);
      ctx.fillRect(x + 26, y + 36 + stomp, 9, 10);
    }
  }

  private renderHellhound(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const isLeft = this.direction === 'left';
    const run = Math.sin(this.animTimer * 10) * 3;

    // Body
    ctx.fillStyle = flash ? '#ffffff' : '#3f0f15';
    ctx.fillRect(x + 4, y + 6, 18, 9);

    if (!flash) {
      // Fiery spine spikes
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x + 7, y + 3, 3, 3);
      ctx.fillRect(x + 12, y + 2, 3, 4);
      ctx.fillRect(x + 17, y + 4, 3, 3);

      // Head & Snout
      const headX = isLeft ? x + 1 : x + 16;
      ctx.fillStyle = '#1c0709';
      ctx.fillRect(headX, y + 3, 9, 8);

      // Glowing Jaws & Eyes
      ctx.fillStyle = '#f97316';
      ctx.fillRect(isLeft ? headX + 1 : headX + 5, y + 5, 3, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(isLeft ? headX + 2 : headX + 6, y + 5, 1, 1);

      // Legs (Prowling)
      ctx.fillStyle = '#2a080c';
      ctx.fillRect(x + 5, y + 14, 3, 6 + run);
      ctx.fillRect(x + 10, y + 14, 3, 6 - run);
      ctx.fillRect(x + 15, y + 14, 3, 6 + run);
      ctx.fillRect(x + 19, y + 14, 3, 6 - run);

      // Flaming tail
      const tailX = isLeft ? x + 21 : x + 2;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(tailX, y + 4 - run, 3, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(tailX + (isLeft ? 1 : -1), y + 2 - run, 2, 2);
    }
  }

  private renderAbyssalReaper(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const floatY = Math.sin(this.animTimer * 4.5) * 3;
    const isLeft = this.direction === 'left';

    // Demonic Shadow Aura
    ctx.fillStyle = flash ? '#ffffff' : 'rgba(185, 28, 28, 0.35)';
    ctx.beginPath();
    ctx.arc(x + 12, y + 12 + floatY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Dark Bloodstained Cowl & Robe
    ctx.fillStyle = flash ? '#ffffff' : '#18181b';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 2 + floatY);
    ctx.lineTo(x + 22, y + 23 + floatY);
    ctx.lineTo(x + 2, y + 23 + floatY);
    ctx.closePath();
    ctx.fill();

    if (!flash) {
      // Hood Interior
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(x + 12, y + 8 + floatY, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Burning Hellfire Eyes
      ctx.fillStyle = '#ea580c';
      const eyeDir = isLeft ? -2 : 1;
      ctx.fillRect(x + 10 + eyeDir, y + 7 + floatY, 2, 2);
      ctx.fillRect(x + 13 + eyeDir, y + 7 + floatY, 2, 2);

      // Floating Soul Scythe
      const scytheX = isLeft ? x + 2 : x + 19;
      // Scythe Staff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(scytheX, y + 1 + floatY, 2, 24);
      // Curved Molten Blade
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(scytheX, y + 2 + floatY);
      ctx.quadraticCurveTo(isLeft ? scytheX - 10 : scytheX + 10, y - 6 + floatY, isLeft ? scytheX - 8 : scytheX + 8, y + 8 + floatY);
      ctx.lineTo(scytheX + 1, y + 4 + floatY);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(isLeft ? scytheX - 6 : scytheX + 4, y + 1 + floatY, 3, 2);
    }
  }

  private renderInfernalKnight(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const bob = Math.sin(this.animTimer * 5) * 1.5;
    const isLeft = this.direction === 'left';

    // Obsidian Plate Armor Torso
    ctx.fillStyle = flash ? '#ffffff' : '#18181b';
    ctx.fillRect(x + 6, y + 8 + bob, 14, 12);

    if (!flash) {
      // Horned Demonic Helm
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x + 8, y + 2 + bob, 10, 8);
      // Helm Horns
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + 6, y + bob, 2, 4);
      ctx.fillRect(x + 18, y + bob, 2, 4);

      // Glowing Crimson Visor Slit
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 10 + (isLeft ? -1 : 1), y + 6 + bob, 5, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 11 + (isLeft ? -1 : 1), y + 6 + bob, 2, 1);

      // Molten Breastplate Runes
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + 9, y + 12 + bob, 8, 2);
      ctx.fillRect(x + 12, y + 10 + bob, 2, 6);

      // Armored Greaves / Legs
      ctx.fillStyle = '#27272a';
      ctx.fillRect(x + 7, y + 20 + bob, 4, 7);
      ctx.fillRect(x + 15, y + 20 + bob, 4, 7);

      // Greatsword coated in Fire
      const swordX = isLeft ? x : x + 21;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(swordX, y + 4 + bob, 3, 18);
      // Fire flame edge
      ctx.fillStyle = '#f97316';
      ctx.fillRect(swordX + (isLeft ? -2 : 2), y + 6 + bob, 2, 12);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(swordX, y + 2 + bob, 3, 3);
    }
  }

  private renderBossDragon(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const flap = Math.sin(this.animTimer * 3.5) * 6;
    const breathe = Math.sin(this.animTimer * 4) * 2;
    const isLeft = this.direction === 'left';

    ctx.save();
    const wingY = y + 12;

    // Wing Membrane (Molten Crimson)
    ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 24);
    ctx.lineTo(x - 2, wingY - 14 + flap);
    ctx.lineTo(x + 4, wingY + 12);
    ctx.lineTo(x + 18, wingY + 18);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 28, y + 24);
    ctx.lineTo(x + 58, wingY - 14 + flap);
    ctx.lineTo(x + 52, wingY + 12);
    ctx.lineTo(x + 38, wingY + 18);
    ctx.fill();

    // Wing Struts / Bones (Dark Obsidian)
    ctx.strokeStyle = flash ? '#ffffff' : '#18181b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 24);
    ctx.lineTo(x - 2, wingY - 14 + flap);
    ctx.moveTo(x + 28, y + 24);
    ctx.lineTo(x + 58, wingY - 14 + flap);
    ctx.stroke();

    // Dragon Main Torso & Abyssal Scales
    ctx.fillStyle = flash ? '#ffffff' : '#1c0709';
    ctx.beginPath();
    ctx.ellipse(x + 28, y + 28, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!flash) {
      // Molten Glowing Heart Core
      const corePulse = (Math.sin(this.animTimer * 5) + 1) * 0.5;
      const coreGrad = ctx.createRadialGradient(x + 28, y + 28, 2, x + 28, y + 28, 10);
      coreGrad.addColorStop(0, '#fef08a');
      coreGrad.addColorStop(0.5, '#f97316');
      coreGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(x + 28, y + 28, 9 + corePulse * 2, 0, Math.PI * 2);
      ctx.fill();

      // Dragon Head & Jaws
      const headX = isLeft ? x + 10 : x + 36;
      const headY = y + 10 + breathe;

      ctx.fillStyle = '#0f0203';
      ctx.beginPath();
      ctx.ellipse(headX, headY, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crown Horns
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(headX, headY - 4);
      ctx.lineTo(isLeft ? headX + 8 : headX - 8, headY - 16);
      ctx.lineTo(isLeft ? headX - 2 : headX + 2, headY - 4);
      ctx.fill();

      // Flaming Reptilian Eye
      ctx.fillStyle = '#fde047';
      const eyeDir = isLeft ? -4 : 4;
      ctx.fillRect(headX + eyeDir, headY - 2, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headX + eyeDir + 1, headY - 2, 1, 1);

      // Flaming Snout / Fangs
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(isLeft ? headX - 10 : headX + 7, headY + 2, 3, 3);

      // Claws & Talons
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(x + 18, y + 40, 6, 8);
      ctx.fillRect(x + 32, y + 40, 6, 8);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x + 16, y + 46, 3, 3);
      ctx.fillRect(x + 22, y + 46, 3, 3);
      ctx.fillRect(x + 30, y + 46, 3, 3);
      ctx.fillRect(x + 36, y + 46, 3, 3);

      // Barbed Dragon Tail
      const tailX = isLeft ? x + 44 : x + 8;
      ctx.strokeStyle = '#2a080c';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + 28, y + 36);
      ctx.quadraticCurveTo(tailX + (isLeft ? 8 : -8), y + 42, tailX + (isLeft ? 14 : -14), y + 32);
      ctx.stroke();
      // Tail Flame
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tailX + (isLeft ? 12 : -16), y + 28, 5, 5);
    }

    ctx.restore();
  }

  // --- RENDERING MONSTER KUIL ELDORIA & TAMBANG STONEWATCH ---

  private renderSylvanSprite(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const floatBob = Math.sin(this.animTimer * 6) * 3;
    const cx = x + 10;
    const cy = y + 10 + floatBob;

    // Glowing aura
    ctx.fillStyle = flash ? '#ffffff' : 'rgba(52, 211, 153, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Fairy wings
    const wingFlap = Math.sin(this.animTimer * 16) * 4;
    ctx.fillStyle = flash ? '#ffffff' : 'rgba(167, 243, 208, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 2, 6, 3 + wingFlap * 0.2, -0.4, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy - 2, 6, 3 + wingFlap * 0.2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Leaf body
    ctx.fillStyle = flash ? '#ffffff' : '#059669';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Sparkly eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 2, cy - 1, 1.5, 1.5);
    ctx.fillRect(cx + 1, cy - 1, 1.5, 1.5);
  }

  private renderVineCreeper(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const wriggle = Math.sin(this.animTimer * 7) * 2;
    ctx.fillStyle = flash ? '#ffffff' : '#14532d';
    // Bramble coiled base
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 16, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whipping thorny tendrils
    ctx.strokeStyle = flash ? '#ffffff' : '#15803d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 16);
    ctx.quadraticCurveTo(x + 6 + wriggle, y + 6, x + 4 - wriggle, y + 2);
    ctx.moveTo(x + 12, y + 16);
    ctx.quadraticCurveTo(x + 18 - wriggle, y + 7, x + 20 + wriggle, y + 3);
    ctx.stroke();

    // Crimson Thorns
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 8, y + 8, 2, 2);
    ctx.fillRect(x + 16, y + 9, 2, 2);
  }

  private renderTreantWarrior(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const isLeft = this.direction === 'left';
    const bob = Math.sin(this.animTimer * 4) * 1.5;

    // Solid Wood Trunk Body
    ctx.fillStyle = flash ? '#ffffff' : '#78350f';
    ctx.fillRect(x + 6, y + 8 + bob, 16, 20);

    // Moss & Vines
    ctx.fillStyle = flash ? '#ffffff' : '#16a34a';
    ctx.fillRect(x + 4, y + 6 + bob, 8, 4);
    ctx.fillRect(x + 16, y + 7 + bob, 8, 4);

    // Horned Branch Canopy
    ctx.strokeStyle = flash ? '#ffffff' : '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8 + bob);
    ctx.lineTo(x + 4, y + 2 + bob);
    ctx.moveTo(x + 20, y + 8 + bob);
    ctx.lineTo(x + 24, y + 2 + bob);
    ctx.stroke();

    // Glowing Ancient Eyes
    ctx.fillStyle = '#4ade80';
    const eyeX = isLeft ? x + 9 : x + 15;
    ctx.fillRect(eyeX, y + 12 + bob, 2.5, 2.5);
    ctx.fillRect(eyeX + 3.5, y + 12 + bob, 2.5, 2.5);
  }

  private renderBossAncientEnt(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const pulse = Math.sin(this.animTimer * 3) * 2;
    const isLeft = this.direction === 'left';

    // Sacred Sylvan Aura
    ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
    ctx.beginPath();
    ctx.arc(x + 26, y + 26, 32 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Enormous Ancient Oak Trunk
    ctx.fillStyle = flash ? '#ffffff' : '#451a03';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 12, 32, 36, 6);
    ctx.fill();

    // Bark details
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 14, y + 16, 8, 26);
    ctx.fillRect(x + 26, y + 18, 10, 24);

    // Giant Leaf Canopy
    ctx.fillStyle = flash ? '#ffffff' : '#15803d';
    ctx.beginPath();
    ctx.arc(x + 26, y + 10, 18, 0, Math.PI * 2);
    ctx.arc(x + 12, y + 14, 12, 0, Math.PI * 2);
    ctx.arc(x + 40, y + 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Blooming golden blossoms
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x + 18, y + 6, 3, 0, Math.PI * 2);
    ctx.arc(x + 34, y + 8, 3, 0, Math.PI * 2);
    ctx.arc(x + 26, y + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Elder Sylvan Eyes
    ctx.fillStyle = '#86efac';
    const ex = isLeft ? x + 16 : x + 28;
    ctx.fillRect(ex, y + 22, 4, 4);
    ctx.fillRect(ex + 6, y + 22, 4, 4);

    // Giant Wooden Root Fists
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 4, y + 30 + pulse, 8, 14);
    ctx.fillRect(x + 40, y + 30 - pulse, 8, 14);
  }

  private renderCrystalSpider(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const scuttle = Math.sin(this.animTimer * 12) * 2;
    // Chitin Body
    ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 9, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Cyan Gem Carapace
    ctx.fillStyle = flash ? '#ffffff' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 5);
    ctx.lineTo(x + 15, y + 9);
    ctx.lineTo(x + 11, y + 13);
    ctx.lineTo(x + 7, y + 9);
    ctx.closePath();
    ctx.fill();

    // Spidery Legs
    ctx.strokeStyle = flash ? '#ffffff' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 7); ctx.lineTo(x + 2, y + 3 + scuttle);
    ctx.moveTo(x + 7, y + 11); ctx.lineTo(x + 1, y + 13 - scuttle);
    ctx.moveTo(x + 15, y + 7); ctx.lineTo(x + 20, y + 3 - scuttle);
    ctx.moveTo(x + 15, y + 11); ctx.lineTo(x + 21, y + 13 + scuttle);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 9, y + 6, 1.5, 1.5);
    ctx.fillRect(x + 12, y + 6, 1.5, 1.5);
  }

  private renderIroncladSkeleton(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const isLeft = this.direction === 'left';
    // Steel Plate Armor
    ctx.fillStyle = flash ? '#ffffff' : '#475569';
    ctx.fillRect(x + 6, y + 8, 12, 14);

    // Skull Head
    ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
    ctx.fillRect(x + 8, y + 2, 8, 7);

    // Iron Helmet
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 7, y + 1, 10, 3);

    // Hollow eye sockets
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 9, y + 4, 2, 2);
    ctx.fillRect(x + 13, y + 4, 2, 2);

    // Tower Shield
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    const shieldX = isLeft ? x + 2 : x + 16;
    ctx.fillRect(shieldX, y + 8, 6, 16);
    ctx.strokeRect(shieldX, y + 8, 6, 16);
  }

  private renderArmoredGolem(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const bob = Math.sin(this.animTimer * 5) * 1.5;
    // Heavy Iron Plated Torso
    ctx.fillStyle = flash ? '#ffffff' : '#334155';
    ctx.fillRect(x + 5, y + 8 + bob, 20, 16);

    // Bronze Rivet Trim
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 6, y + 9 + bob, 3, 3);
    ctx.fillRect(x + 21, y + 9 + bob, 3, 3);

    // Glowing Ore Furnace Core in chest
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(x + 15, y + 16 + bob, 4, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Stone Fists
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 1, y + 12 + bob, 5, 10);
    ctx.fillRect(x + 24, y + 12 + bob, 5, 10);
  }

  private renderBossObsidianBehemoth(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean): void {
    const pulse = Math.sin(this.animTimer * 3.5) * 2;
    const isLeft = this.direction === 'left';

    // Abyssal Mine Dark Aura
    ctx.fillStyle = 'rgba(126, 34, 206, 0.22)';
    ctx.beginPath();
    ctx.arc(x + 27, y + 25, 34 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Obsidian Body
    ctx.fillStyle = flash ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 10, 38, 34, 6);
    ctx.fill();

    // Purple Obsidian Crystals protruding
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 10); ctx.lineTo(x + 8, y + 2); ctx.lineTo(x + 16, y + 8);
    ctx.moveTo(x + 42, y + 10); ctx.lineTo(x + 46, y + 2); ctx.lineTo(x + 38, y + 8);
    ctx.fill();

    // Glowing Magma Fissures
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 20); ctx.lineTo(x + 22, y + 26); ctx.lineTo(x + 18, y + 36);
    ctx.moveTo(x + 40, y + 20); ctx.lineTo(x + 32, y + 28); ctx.lineTo(x + 36, y + 38);
    ctx.stroke();

    // Blazing Core
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(x + 27, y + 26, 6 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Golem Eyes
    ctx.fillStyle = '#38bdf8';
    const ex = isLeft ? x + 18 : x + 30;
    ctx.fillRect(ex, y + 16, 4, 3);
    ctx.fillRect(ex + 6, y + 16, 4, 3);

    // Massive Crag Fists
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y + 24 + pulse, 9, 16);
    ctx.fillRect(x + 43, y + 24 - pulse, 9, 16);
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const isBoss = this.tier === 'BOSS' || this.type.startsWith('BOSS_');
    const barW = isBoss ? 64 : 24;
    const barH = isBoss ? 5 : 3;
    const barX = x + (this.width - barW) / 2;
    const barY = isBoss ? y - 16 : y - 8;

    // Tampilkan bar & nama jika bos, terluka, atau pemain berada di dekatnya
    if (this.hp < this.maxHp || isBoss || this.isPlayerNearby) {
      // Background container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // Warna bar berdasarkan tingkatan monster
      let barFillColor = '#22c55e'; // Hijau untuk tingkat bawah
      if (this.type === 'BOSS_INFERNAL_DRAGON') barFillColor = '#f97316';
      else if (this.type === 'BOSS_TITAN_GOLEM') barFillColor = '#ef4444';
      else if (this.type === 'BOSS_ANCIENT_ENT') barFillColor = '#10b981';
      else if (this.type === 'BOSS_OBSIDIAN_BEHEMOTH') barFillColor = '#8b5cf6';
      else if (this.type === 'BOSS_SLIME') barFillColor = '#ec4899';
      else if (this.tier === 'MID') barFillColor = '#f59e0b';
      else if (this.tier === 'HIGH') barFillColor = '#a855f7';

      // Health fill
      const pct = Math.min(1, Math.max(0, this.hp / this.maxHp));
      ctx.fillStyle = barFillColor;
      ctx.fillRect(barX, barY, Math.round(barW * pct), barH);

      // Name & Tier Level Tag
      ctx.font = 'bold 7.5px sans-serif';
      ctx.textAlign = 'center';

      let tagColor = '#86efac';
      if (isBoss) tagColor = '#facc15';
      else if (this.tier === 'MID') tagColor = '#fcd34d';
      else if (this.tier === 'HIGH') tagColor = '#d8b4fe';

      ctx.fillStyle = tagColor;
      ctx.fillText(
        isBoss ? `👑 ${this.name} [Lv.${this.level}]` : `[Lv.${this.level} • ${this.tierLabel}] ${this.name}`,
        x + this.width / 2,
        barY - 3
      );
    }
  }
}
