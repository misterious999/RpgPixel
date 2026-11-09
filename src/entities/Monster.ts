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
  | 'BOSS_TITAN_GOLEM';
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
    const isBigBoss = this.type === 'BOSS_SLIME' || this.type === 'BOSS_TITAN_GOLEM';
    const knockForce = this.type === 'BOSS_TITAN_GOLEM' ? 25 : (this.type === 'BOSS_SLIME' ? 60 : 140);
    this.knockbackX = Math.cos(angle) * knockForce;
    this.knockbackY = Math.sin(angle) * knockForce;

    if (this.hp <= 0) {
      this.isDead = true;
      this.respawnTimer = isBigBoss ? (this.type === 'BOSS_TITAN_GOLEM' ? 60 : 45) : 22;
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

        const isBoss = this.type === 'BOSS_SLIME' || this.type === 'BOSS_TITAN_GOLEM';
        const attackReach = this.type === 'BOSS_TITAN_GOLEM' ? 36 : (this.type === 'BOSS_SLIME' ? 32 : 22);

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

  private renderHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const isBoss = this.type === 'BOSS_SLIME' || this.type === 'BOSS_TITAN_GOLEM';
    const barW = this.type === 'BOSS_TITAN_GOLEM' ? 56 : (this.type === 'BOSS_SLIME' ? 44 : 24);
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
      if (this.type === 'BOSS_TITAN_GOLEM') barFillColor = '#ef4444';
      else if (this.type === 'BOSS_SLIME') barFillColor = '#ec4899';
      else if (this.tier === 'MID') barFillColor = '#f59e0b'; // Oranye/Amber untuk tingkat menengah
      else if (this.tier === 'HIGH') barFillColor = '#a855f7'; // Ungu untuk elit

      // Health fill
      const pct = Math.min(1, Math.max(0, this.hp / this.maxHp));
      ctx.fillStyle = barFillColor;
      ctx.fillRect(barX, barY, Math.round(barW * pct), barH);

      // Name & Tier Level Tag
      ctx.font = 'bold 7.5px sans-serif';
      ctx.textAlign = 'center';

      let tagColor = '#86efac'; // Hijau terang
      if (isBoss) tagColor = '#facc15';
      else if (this.tier === 'MID') tagColor = '#fcd34d'; // Kuning keemasan untuk tingkat menengah
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
