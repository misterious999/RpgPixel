import { CONSTANTS } from '../core/Constants.ts';
import { InputState } from '../core/Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { Inventory } from '../items/Inventory.ts';
import { CharacterCostume, RoleType, Skill, MagicianAffinities } from '../types/GameTypes.ts';
import { CHARACTER_COSTUMES, ROLE_INFO, getMagicianSkills, ELEMENT_INFO } from '../data/RolesData.ts';

export type Direction = 'down' | 'up' | 'left' | 'right';

export interface Minion {
  x: number;
  y: number;
  type: 'skeleton' | 'bear' | 'shadow';
  name: string;
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

  // Minions
  public minions: Minion[] = [];

  // Player Inventory
  public inventory: Inventory = new Inventory(16);

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
    this.inventory.addItem('GOLD_COIN', 50);

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
    this.exp += amount;
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
    if (this.hasBarrier) {
      amount = Math.round(amount * 0.5);
    }
    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, Math.round(this.hp) - damage);
    this.hpRegenAccumulator = 0;
    if (this.hp <= 0) {
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

  public update(deltaTime: number, input: InputState, tileMap: TileMap, obstacleChecker?: (box: { x: number; y: number; width: number; height: number }) => boolean): void {
    const { axisX, axisY, isSprint, isAction } = input;

    this.breathTimer += deltaTime * 3;

    // Passive Mana Regeneration: akumulasi sebelum menambah 1 MP integer murni (100% bebas desimal)
    if (this.mp < this.maxMp) {
      const regenRate = (this.role === 'HEALER' || this.role === 'MAGICIAN') ? 4.5 : 2.5;
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

      const moveX = axisX * speed * deltaTime;
      const moveY = axisY * speed * deltaTime;

      const collides = (box: { x: number; y: number; width: number; height: number }) => {
        if (tileMap.checkCollision(box)) return true;
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
      const worldMaxX = CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE - this.width - 32;
      const worldMaxY = CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE - this.height - 32;
      if (isNaN(this.x) || this.x < 32 || this.x > worldMaxX) this.x = 50 * CONSTANTS.TILE_SIZE;
      if (isNaN(this.y) || this.y < 32 || this.y > worldMaxY) this.y = 50 * CONSTANTS.TILE_SIZE;
    } else {
      this.animTimer = 0;
    }

    // Minion follow logic
    for (let i = 0; i < this.minions.length; i++) {
      const minion = this.minions[i];
      const targetX = this.x - (i + 1) * 16;
      const targetY = this.y + 4;
      minion.x += (targetX - minion.x) * 0.08;
      minion.y += (targetY - minion.y) * 0.08;
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

    // 1. Soft Multi-Layer Shadow with dynamic height scaling
    const shadowScale = castYOffset < 0 ? Math.max(0.42, 1 + castYOffset / 28) : 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 29, 11 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 29, 8 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

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

    // Animation variables
    const idleBob = !this.isMoving ? Math.sin(this.breathTimer) * 0.8 : 0;
    const walkStep = this.isMoving ? Math.sin(this.animTimer) : 0;
    const legOffset1 = walkStep * 4;
    const legOffset2 = -walkStep * 4;
    const capeFlutter = (this.isMoving ? Math.sin(this.animTimer * 1.5) * 2.5 : 0) + (isCasting ? Math.sin(castProgress * Math.PI * 4) * 3.5 : 0);

    const renderY = py + idleBob + castYOffset;

    // Angel Wings (Drawn behind back for Healer during cast)
    if (activeRole === 'HEALER' && isCasting) {
      this.renderAngelWings(ctx, px, renderY, castProgress);
    }

    // 4. Flowing Cape / Mantle (Drawn behind body when facing down or moving)
    const capeColor = this.costume.accentColor;
    if (this.direction !== 'up') {
      ctx.fillStyle = capeColor;
      ctx.fillRect(px + 5 + capeFlutter * 0.5, renderY + 11, 14, 15);
      // Cape folds / shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(px + 10 + capeFlutter * 0.5, renderY + 13, 4, 13);
    }

    // 5. Legs & Boots (Dual-tone retro shoes with soles)
    let legSpreadL = 0;
    let legSpreadR = 0;
    if (isCasting && activeRole === 'ASSASSIN') {
      // Lower ninja spread stance
      legSpreadL = -2;
      legSpreadR = 2;
    }
    // Left Leg & Boot
    ctx.fillStyle = '#1c1917'; // Dark pant
    ctx.fillRect(px + 5 + legSpreadL, renderY + 20 + legOffset1, 5, 5);
    ctx.fillStyle = '#451a03'; // Leather boot upper
    ctx.fillRect(px + 4 + legSpreadL, renderY + 23 + legOffset1, 6, 6);
    ctx.fillStyle = '#78350f'; // Boot knee cuff
    ctx.fillRect(px + 4 + legSpreadL, renderY + 23 + legOffset1, 6, 2);
    ctx.fillStyle = '#0f172a'; // Sole
    ctx.fillRect(px + 4 + legSpreadL, renderY + 28 + legOffset1, 6, 2);

    // Right Leg & Boot
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px + 14 + legSpreadR, renderY + 20 + legOffset2, 5, 5);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 14 + legSpreadR, renderY + 23 + legOffset2, 6, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 14 + legSpreadR, renderY + 23 + legOffset2, 6, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 14 + legSpreadR, renderY + 28 + legOffset2, 6, 2);

    // 6. Torso & Tunic / Armor
    // Base Shirt / Armor
    ctx.fillStyle = this.costume.outfitColor;
    ctx.fillRect(px + 5, renderY + 10, 14, 12);

    // Armor shading / depth highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(px + 6, renderY + 11, 5, 8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(px + 14, renderY + 11, 4, 9);

    // Collar / Neckline trim
    ctx.fillStyle = '#fed7aa'; // Neck
    ctx.fillRect(px + 10, renderY + 9, 4, 2);
    ctx.fillStyle = this.costume.accentColor;
    ctx.fillRect(px + 8, renderY + 10, 8, 2);

    // Belt & Metallic Buckle & Pouch
    ctx.fillStyle = '#292524'; // Leather belt
    ctx.fillRect(px + 5, renderY + 18, 14, 3);
    ctx.fillStyle = '#facc15'; // Gold buckle
    ctx.fillRect(px + 11, renderY + 18, 3, 3);
    ctx.fillStyle = '#78350f'; // Hip pouch / potion vial
    ctx.fillRect(px + 16, renderY + 18, 3, 4);

    // Pauldrons (Shoulder pads)
    ctx.fillStyle = this.costume.accentColor;
    ctx.fillRect(px + 3, renderY + 10, 3, 4);
    ctx.fillRect(px + 18, renderY + 10, 3, 4);

    // 7. Arms & Hands (Animated swing & dynamic skill casting stances)
    let armSwingL = -walkStep * 3;
    let armSwingR = walkStep * 3;

    if (isCasting) {
      if (activeRole === 'MAGICIAN') {
        // High staff elevation with both arms
        armSwingL = -9;
        armSwingR = -11;
      } else if (activeRole === 'HEALER') {
        // Devout prayer & scepter elevation
        armSwingL = -6;
        armSwingR = -10;
      } else if (activeRole === 'KNIGHT') {
        // Dynamic heavy sword slash arc
        const swingArc = Math.sin(castProgress * Math.PI);
        armSwingL = -4 + swingArc * 6;
        armSwingR = -10 + swingArc * 14;
      } else if (activeRole === 'ASSASSIN') {
        // Cross daggers forward thrust
        armSwingL = -6;
        armSwingR = -6;
      } else if (activeRole === 'NECROMANCER') {
        // Incantation downward gesture
        armSwingL = 3;
        armSwingR = -3;
      }
    }

    // Left Arm
    ctx.fillStyle = this.costume.outfitColor;
    ctx.fillRect(px + 2, renderY + 12 + armSwingL, 3, 6);
    ctx.fillStyle = '#fed7aa'; // Left Hand
    ctx.fillRect(px + 2, renderY + 17 + armSwingL, 3, 3);

    // Right Arm
    ctx.fillStyle = this.costume.outfitColor;
    ctx.fillRect(px + 19, renderY + 12 + armSwingR, 3, 6);
    ctx.fillStyle = '#fed7aa'; // Right Hand
    ctx.fillRect(px + 19, renderY + 17 + armSwingR, 3, 3);

    // 8. EQUIPPED WEAPON in Right Hand based on Role / Magician Element!
    this.renderEquippedWeapon(ctx, px, renderY, armSwingR, isCasting, activeRole, castProgress);

    // 9. Cape back view (if facing UP, cape covers the back)
    if (this.direction === 'up') {
      ctx.fillStyle = capeColor;
      ctx.fillRect(px + 5, renderY + 11, 14, 15);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(px + 9, renderY + 12, 6, 14);
    }

    // 10. Head & Facial Expressions
    // Chin & Face Base
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 6, renderY + 2, 12, 9);
    // Cheek blush / skin tone warmth
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.fillRect(px + 7, renderY + 7, 2, 2);
    ctx.fillRect(px + 15, renderY + 7, 2, 2);

    // 11. Hair & Headgear (Layered with highlights)
    this.renderHairAndHeadgear(ctx, px, renderY);

    // 12. Eyes & Facial Direction
    if (this.direction === 'down') {
      // Eye Whites
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 8, renderY + 5, 3, 3);
      ctx.fillRect(px + 13, renderY + 5, 3, 3);
      // Iris / Pupil (Expressive dark blue)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 9, renderY + 5, 2, 2);
      ctx.fillRect(px + 14, renderY + 5, 2, 2);
      // Eye highlight shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 9, renderY + 5, 1, 1);
      ctx.fillRect(px + 14, renderY + 5, 1, 1);
      // Mouth
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(px + 11, renderY + 9, 2, 1);
    } else if (this.direction === 'left') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, renderY + 5, 3, 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 7, renderY + 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, renderY + 5, 1, 1);
    } else if (this.direction === 'right') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 14, renderY + 5, 3, 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 15, renderY + 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 16, renderY + 5, 1, 1);
    } else if (this.direction === 'up') {
      // Back of hair
      ctx.fillStyle = this.costume.hairColor;
      ctx.fillRect(px + 6, renderY + 2, 12, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(px + 7, renderY + 7, 10, 4);
    }

    // Role-Specific Cast Overlays:
    // A. Assassin Red Eye Glare (Anime flare)
    if (activeRole === 'ASSASSIN' && isCasting && this.direction !== 'up') {
      ctx.save();
      const eyeAlpha = Math.sin(castProgress * Math.PI);
      ctx.globalAlpha = eyeAlpha;
      const eyeY = renderY + 6;
      let eyeCenterX = px + 11;
      if (this.direction === 'left') eyeCenterX = px + 8;
      else if (this.direction === 'right') eyeCenterX = px + 15;

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
      ctx.ellipse(px + 12, renderY - 5, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(px + 12, renderY - 5, 6.5, 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // C. Necromancer Orbiting Soul Wisps
    if (activeRole === 'NECROMANCER' && isCasting) {
      const angle1 = castProgress * Math.PI * 4;
      const angle2 = angle1 + Math.PI;
      this.renderSoulWisp(ctx, px + 12 + Math.cos(angle1) * 16, renderY + 14 + Math.sin(angle1) * 7);
      this.renderSoulWisp(ctx, px + 12 + Math.cos(angle2) * 16, renderY + 14 + Math.sin(angle2) * 7);
    }

    // 13. Attack Slash Swing
    if (this.attackTimer > 0) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (this.direction === 'right') ctx.arc(px + 26, renderY + 14, 16, -Math.PI * 0.35, Math.PI * 0.35);
      else if (this.direction === 'left') ctx.arc(px - 2, renderY + 14, 16, Math.PI * 0.65, Math.PI * 1.35);
      else if (this.direction === 'down') ctx.arc(px + 12, renderY + 28, 16, Math.PI * 0.15, Math.PI * 0.85);
      else if (this.direction === 'up') ctx.arc(px + 12, renderY - 4, 16, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
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

    // 15. Floating Header (Role Badge & Username)
    ctx.globalAlpha = 1.0;
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';

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

    if (this.role === 'KNIGHT' || this.role === 'NOVICE') {
      // Silver Steel Broadsword
      ctx.fillStyle = '#64748b'; // Pommel
      ctx.fillRect(wx - 1, wy + 4, 3, 2);
      ctx.fillStyle = '#facc15'; // Gold guard
      ctx.fillRect(wx - 2, wy + 2, 5, 2);
      ctx.fillStyle = '#e2e8f0'; // Blade
      ctx.fillRect(wx - 1, wy - 8, 3, 10);
      ctx.fillStyle = '#ffffff'; // Blade edge shine
      ctx.fillRect(wx, wy - 8, 1, 10);

      // Blazing golden weapon aura & slash trail when casting Knight skill
      if (isCasting && activeRole === 'KNIGHT') {
        const isRage = this.castingSkill?.id === 'berserk_overdrive';
        ctx.fillStyle = isRage ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.55)';
        ctx.fillRect(wx - 3, wy - 11, 7, 14);
        ctx.strokeStyle = isRage ? '#dc2626' : '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wx + 2, wy - 4, 15, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }
    } else if (this.role === 'MAGICIAN') {
      // Wizard Staff with glowing Elemental Orb!
      const pInfo = ELEMENT_INFO[this.magicianAffinities.primary];
      const elemColor = (this.castingSkill && this.castingSkill.color) ? this.castingSkill.color : pInfo.color;
      ctx.fillStyle = '#78350f'; // Wood staff pole
      ctx.fillRect(wx, wy - 6, 2, 14);
      // Staff Top Ring
      ctx.fillStyle = '#facc15';
      ctx.fillRect(wx - 2, wy - 9, 6, 3);

      if (isCasting && activeRole === 'MAGICIAN') {
        // Supercharged Elemental Orb Flare
        const pulse = 4.5 + Math.sin((castProgress || 0) * Math.PI * 4) * 2;
        ctx.fillStyle = elemColor;
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, pulse, 0, Math.PI * 2);
        ctx.fill();

        // White core sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Radiant beams of magical energy
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(wx + 1 - 7, wy - 11); ctx.lineTo(wx + 1 + 7, wy - 11);
        ctx.moveTo(wx + 1, wy - 11 - 7); ctx.lineTo(wx + 1, wy - 11 + 7);
        ctx.stroke();
      } else {
        // Normal floating glowing elemental crystal
        ctx.fillStyle = pInfo.color;
        ctx.beginPath();
        ctx.arc(wx + 1, wy - 11, 4, 0, Math.PI * 2);
        ctx.fill();
        // Orb core sparkle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx, wy - 12, 2, 2);
      }
    } else if (this.role === 'ASSASSIN') {
      // Twin Toxic Shadow Daggers
      ctx.fillStyle = '#22c55e'; // Poison edge
      ctx.fillRect(wx, wy - 4, 2, 7);
      ctx.fillStyle = '#0f172a'; // Dark hilt
      ctx.fillRect(wx - 1, wy + 3, 4, 2);

      if (isCasting && activeRole === 'ASSASSIN') {
        // Dual Wield: Left Hand Dagger
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + 2, wy - 4, 2, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 1, wy + 3, 4, 2);

        // Crossed dual scissor slash trails
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 1, wy + 6);
        ctx.lineTo(wx + 5, wy - 7);
        ctx.moveTo(wx + 5, wy + 6);
        ctx.lineTo(px - 1, wy - 7);
        ctx.stroke();
      }
    } else if (this.role === 'HEALER') {
      // Holy Cross Scepter
      ctx.fillStyle = '#fde047'; // Golden scepter
      ctx.fillRect(wx, wy - 8, 2, 16);
      ctx.fillRect(wx - 3, wy - 6, 8, 2);
      // Holy jewel
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(wx, wy - 10, 2, 2);

      if (isCasting && activeRole === 'HEALER') {
        // Radiant Holy Light Beaming Skyward
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.fillRect(wx - 3, wy - 28, 8, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 1, wy - 20, 4, 10);
      }
    } else if (this.role === 'NECROMANCER') {
      // Dark Bone Scythe / Wand
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx, wy - 8, 2, 15);
      ctx.fillStyle = '#a855f7'; // Purple Soul Gem
      ctx.fillRect(wx - 1, wy - 10, 4, 3);
      ctx.fillStyle = '#e2e8f0'; // Bone curve
      ctx.fillRect(wx - 4, wy - 10, 3, 2);

      if (isCasting && activeRole === 'NECROMANCER') {
        // Swirling dark soul miasma
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

    if (this.costume.hairStyle === 'short') {
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
    } else if (this.costume.hairStyle === 'spiky') {
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
    } else if (this.costume.hairStyle === 'long') {
      // Long flowing locks past shoulders
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py, 14, 5);
      ctx.fillRect(px + 3, py + 2, 4, 14);
      ctx.fillRect(px + 17, py + 2, 4, 14);
      // Forehead headband
      ctx.fillStyle = this.costume.accentColor;
      ctx.fillRect(px + 6, py + 2, 12, 2);
    } else if (this.costume.hairStyle === 'hood') {
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
    }
  }

  private renderMinion(ctx: CanvasRenderingContext2D, minion: Minion): void {
    const mx = Math.floor(minion.x);
    const my = Math.floor(minion.y);

    ctx.save();
    if (minion.type === 'skeleton') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(mx + 6, my + 14, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(mx + 3, my + 2, 6, 6);
      ctx.fillRect(mx + 4, my + 8, 4, 6);
      ctx.fillRect(mx + 3, my + 14, 2, 4);
      ctx.fillRect(mx + 7, my + 14, 2, 4);

      ctx.fillStyle = '#a855f7';
      ctx.fillRect(mx + 4, my + 4, 1, 1);
      ctx.fillRect(mx + 7, my + 4, 1, 1);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx + 10, my + 6, 2, 8);
    }
    ctx.restore();
  }
}
