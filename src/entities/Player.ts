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
  public level: number = 1;
  public exp: number = 0;
  public maxExp: number = 50;
  public role: RoleType = 'NOVICE';
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

  public setRole(newRole: RoleType, affinities?: MagicianAffinities): void {
    this.role = newRole;
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
    const prevHp = Math.floor(this.hp);
    this.hp = Math.min(this.maxHp, Math.floor(this.hp) + amount);
    return Math.floor(this.hp) - prevHp;
  }

  public restoreMp(amount: number): number {
    const prevMp = Math.floor(this.mp);
    this.mp = Math.min(this.maxMp, Math.floor(this.mp) + amount);
    return Math.floor(this.mp) - prevMp;
  }

  public consumeMp(amount: number): boolean {
    const currentMp = Math.floor(this.mp);
    if (currentMp < amount) return false;
    this.mp = Math.max(0, currentMp - amount);
    return true;
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

    // Passive Mana Regeneration (mencegah pemain kehabisan mana permanen)
    if (this.mp < this.maxMp) {
      const regenRate = (this.role === 'HEALER' || this.role === 'MAGICIAN') ? 4.5 : 2.5;
      this.mp = Math.min(this.maxMp, this.mp + regenRate * deltaTime);
    }

    // Passive Gentle Health Regeneration
    if (this.hp < this.maxHp) {
      const hpRegenRate = this.role === 'HEALER' ? 2.5 : 1.0;
      this.hp = Math.min(this.maxHp, this.hp + hpRegenRate * deltaTime);
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

    // Stealth transparency
    if (this.isStealthed) {
      ctx.globalAlpha = 0.38;
    }

    // 1. Soft Multi-Layer Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 29, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 29, 8, 3.5, 0, 0, Math.PI * 2);
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
    const capeFlutter = this.isMoving ? Math.sin(this.animTimer * 1.5) * 2.5 : 0;

    const renderY = py + idleBob;

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
    // Left Leg & Boot
    ctx.fillStyle = '#1c1917'; // Dark pant
    ctx.fillRect(px + 5, renderY + 20 + legOffset1, 5, 5);
    ctx.fillStyle = '#451a03'; // Leather boot upper
    ctx.fillRect(px + 4, renderY + 23 + legOffset1, 6, 6);
    ctx.fillStyle = '#78350f'; // Boot knee cuff
    ctx.fillRect(px + 4, renderY + 23 + legOffset1, 6, 2);
    ctx.fillStyle = '#0f172a'; // Sole
    ctx.fillRect(px + 4, renderY + 28 + legOffset1, 6, 2);

    // Right Leg & Boot
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px + 14, renderY + 20 + legOffset2, 5, 5);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 14, renderY + 23 + legOffset2, 6, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 14, renderY + 23 + legOffset2, 6, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 14, renderY + 28 + legOffset2, 6, 2);

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

    // 7. Arms & Hands (Animated swing)
    const armSwingL = -walkStep * 3;
    const armSwingR = walkStep * 3;

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
    this.renderEquippedWeapon(ctx, px, renderY, armSwingR);

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

    // 14. Floating Header (Role Badge & Username)
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

  private renderEquippedWeapon(ctx: CanvasRenderingContext2D, px: number, py: number, armSwing: number): void {
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
    } else if (this.role === 'MAGICIAN') {
      // Wizard Staff with glowing Elemental Orb!
      const pInfo = ELEMENT_INFO[this.magicianAffinities.primary];
      ctx.fillStyle = '#78350f'; // Wood staff pole
      ctx.fillRect(wx, wy - 6, 2, 14);
      // Staff Top Ring
      ctx.fillStyle = '#facc15';
      ctx.fillRect(wx - 2, wy - 9, 6, 3);
      // Floating glowing elemental crystal
      ctx.fillStyle = pInfo.color;
      ctx.beginPath();
      ctx.arc(wx + 1, wy - 11, 4, 0, Math.PI * 2);
      ctx.fill();
      // Orb core sparkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx, wy - 12, 2, 2);
    } else if (this.role === 'ASSASSIN') {
      // Twin Toxic Shadow Daggers
      ctx.fillStyle = '#22c55e'; // Poison edge
      ctx.fillRect(wx, wy - 4, 2, 7);
      ctx.fillStyle = '#0f172a'; // Dark hilt
      ctx.fillRect(wx - 1, wy + 3, 4, 2);
    } else if (this.role === 'HEALER') {
      // Holy Cross Scepter
      ctx.fillStyle = '#fde047'; // Golden scepter
      ctx.fillRect(wx, wy - 8, 2, 16);
      ctx.fillRect(wx - 3, wy - 6, 8, 2);
      // Holy jewel
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(wx, wy - 10, 2, 2);
    } else if (this.role === 'NECROMANCER') {
      // Dark Bone Scythe / Wand
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx, wy - 8, 2, 15);
      ctx.fillStyle = '#a855f7'; // Purple Soul Gem
      ctx.fillRect(wx - 1, wy - 10, 4, 3);
      ctx.fillStyle = '#e2e8f0'; // Bone curve
      ctx.fillRect(wx - 4, wy - 10, 3, 2);
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
