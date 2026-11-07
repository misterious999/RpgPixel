import { CONSTANTS } from '../core/Constants.ts';
import { InputState } from '../core/Input.ts';
import { TileMap } from '../world/TileMap.ts';
import { Inventory } from '../items/Inventory.ts';
import { CharacterCostume, RoleType, Skill } from '../types/GameTypes.ts';
import { CHARACTER_COSTUMES, ROLE_INFO } from '../data/RolesData.ts';

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
  public width: number = 20;
  public height: number = 26;

  // Identity & Customization
  public username: string = 'Petualang';
  public costume: CharacterCostume = CHARACTER_COSTUMES[0];

  // RPG Stats & Progression
  public hp: number = 100;
  public maxHp: number = 100;
  public mp: number = 60;
  public maxMp: number = 60;
  public level: number = 1;
  public exp: number = 0;
  public maxExp: number = 50;
  public role: RoleType = 'NOVICE';
  public skills: Skill[] = [];

  // Active Buffs / Effects
  public isStealthed: boolean = false;
  public stealthTimer: number = 0;
  public isBerserk: boolean = false;
  public berserkTimer: number = 0;
  public hasBarrier: boolean = false;
  public barrierTimer: number = 0;

  // Minions (e.g. Necromancer skeleton)
  public minions: Minion[] = [];

  // Player Inventory
  public inventory: Inventory = new Inventory(16);

  // Collision box relative to player (feet area for top-down perspective)
  public collisionBox = {
    offsetX: 3,
    offsetY: 16,
    width: 14,
    height: 9
  };

  public direction: Direction = 'down';
  public isMoving: boolean = false;
  private animTimer: number = 0;
  public attackTimer: number = 0;

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

  public setRole(newRole: RoleType): void {
    this.role = newRole;
    this.updateSkills();
  }

  public updateSkills(): void {
    const info = ROLE_INFO[this.role];
    if (!info) {
      this.skills = [];
      return;
    }

    // Filter available skills based on level
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
      return true; // Leveled up
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
    const prevHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prevHp;
  }

  public restoreMp(amount: number): number {
    const prevMp = this.mp;
    this.mp = Math.min(this.maxMp, this.mp + amount);
    return this.mp - prevMp;
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

    // Attack timer
    if (isAction && this.attackTimer <= 0) {
      this.attackTimer = 0.25;
      // Breaking stealth on attack
      if (this.isStealthed) {
        this.isStealthed = false;
        this.stealthTimer = 0;
      }
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    // Cooldown updates
    for (const skill of this.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - deltaTime);
      }
    }

    // Buff Timers
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

    // Movement calculation
    this.isMoving = Math.abs(axisX) > 0.05 || Math.abs(axisY) > 0.05;

    if (this.isMoving) {
      this.animTimer += deltaTime * 10;

      // Facing Direction
      if (Math.abs(axisX) > Math.abs(axisY)) {
        this.direction = axisX > 0 ? 'right' : 'left';
      } else {
        this.direction = axisY > 0 ? 'down' : 'up';
      }

      // Calculate speed (boosted by sprint, stealth, or berserk)
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

      // Axis-separated sliding
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

    // 0. Render Minions behind player
    for (const minion of this.minions) {
      this.renderMinion(ctx, minion);
    }

    // Apply Stealth Alpha
    if (this.isStealthed) {
      ctx.globalAlpha = 0.4;
    }

    // 1. Shadow Underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 24, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Barrier Aura
    if (this.hasBarrier) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + 10, py + 14, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Berserk Flame Aura
    if (this.isBerserk) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + 10, py + 14, 16 + Math.sin(this.animTimer * 2) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Leg bounce
    const step = this.isMoving ? Math.sin(this.animTimer) : 0;
    const legOffset1 = step * 3;
    const legOffset2 = -step * 3;

    // 4. Legs / Boots
    ctx.fillStyle = '#292524';
    ctx.fillRect(px + 4, py + 18 + legOffset1, 4, 7);
    ctx.fillRect(px + 12, py + 18 + legOffset2, 4, 7);

    // 5. Body / Outfit
    ctx.fillStyle = this.costume.outfitColor;
    ctx.fillRect(px + 4, py + 10, 12, 10);

    // Accent Belt / Sash
    ctx.fillStyle = this.costume.accentColor;
    ctx.fillRect(px + 4, py + 16, 12, 2);

    // 6. Head & Skin
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 5, py + 2, 10, 9);

    // 7. Hair / Hat based on Costume
    ctx.fillStyle = this.costume.hairColor;
    if (this.costume.hairStyle === 'short') {
      ctx.fillRect(px + 4, py, 12, 4);
      ctx.fillRect(px + 3, py + 2, 2, 5);
      ctx.fillRect(px + 15, py + 2, 2, 5);
    } else if (this.costume.hairStyle === 'spiky') {
      ctx.fillRect(px + 4, py - 2, 12, 6);
      ctx.fillRect(px + 2, py, 3, 5);
      ctx.fillRect(px + 15, py, 3, 5);
    } else if (this.costume.hairStyle === 'long') {
      ctx.fillRect(px + 4, py, 12, 4);
      ctx.fillRect(px + 2, py + 2, 3, 10);
      ctx.fillRect(px + 15, py + 2, 3, 10);
    } else if (this.costume.hairStyle === 'hood') {
      ctx.fillStyle = this.costume.hatColor || this.costume.outfitColor;
      ctx.fillRect(px + 3, py - 2, 14, 6);
      ctx.fillRect(px + 2, py + 2, 3, 9);
      ctx.fillRect(px + 15, py + 2, 3, 9);
    }

    // 8. Eyes
    ctx.fillStyle = '#0f172a';
    if (this.direction === 'down') {
      ctx.fillRect(px + 7, py + 5, 2, 2);
      ctx.fillRect(px + 11, py + 5, 2, 2);
    } else if (this.direction === 'up') {
      ctx.fillStyle = this.costume.hairColor;
      ctx.fillRect(px + 5, py + 2, 10, 7);
    } else if (this.direction === 'left') {
      ctx.fillRect(px + 6, py + 5, 2, 2);
    } else if (this.direction === 'right') {
      ctx.fillRect(px + 12, py + 5, 2, 2);
    }

    // 9. Slash Swing Effect
    if (this.attackTimer > 0) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (this.direction === 'right') ctx.arc(px + 22, py + 12, 12, -Math.PI * 0.3, Math.PI * 0.3);
      else if (this.direction === 'left') ctx.arc(px - 2, py + 12, 12, Math.PI * 0.7, Math.PI * 1.3);
      else if (this.direction === 'down') ctx.arc(px + 10, py + 26, 12, Math.PI * 0.2, Math.PI * 0.8);
      else if (this.direction === 'up') ctx.arc(px + 10, py - 2, 12, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }

    // 10. Floating Username & Role Tag overhead
    ctx.globalAlpha = 1.0;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';

    // Role Tag Badge
    const roleInfo = ROLE_INFO[this.role];
    ctx.fillStyle = roleInfo.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const tagText = `[${roleInfo.tag} Lv.${this.level}]`;
    ctx.strokeText(tagText, px + 10, py - 12);
    ctx.fillText(tagText, px + 10, py - 12);

    // Username
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(this.username, px + 10, py - 3);
    ctx.fillText(this.username, px + 10, py - 3);

    ctx.restore();
  }

  private renderMinion(ctx: CanvasRenderingContext2D, minion: Minion): void {
    const mx = Math.floor(minion.x);
    const my = Math.floor(minion.y);

    ctx.save();
    if (minion.type === 'skeleton') {
      // Skeleton Warrior
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(mx + 6, my + 14, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bones
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(mx + 3, my + 2, 6, 6); // Skull
      ctx.fillRect(mx + 4, my + 8, 4, 6); // Ribcage
      ctx.fillRect(mx + 3, my + 14, 2, 4); // Legs
      ctx.fillRect(mx + 7, my + 14, 2, 4);

      // Glowing Eyes
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(mx + 4, my + 4, 1, 1);
      ctx.fillRect(mx + 7, my + 4, 1, 1);

      // Sword
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx + 10, my + 6, 2, 8);
    }
    ctx.restore();
  }
}
