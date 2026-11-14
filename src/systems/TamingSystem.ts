import { Player } from '../entities/Player.ts';
import { WorldItem } from '../world/WorldItem.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export type PetType = 'SLIME_PET' | 'WOLF_PET' | 'FAIRY_PET' | 'DRAGON_PET';

export interface PetInfo {
  type: PetType;
  name: string;
  species: string;
  description: string;
  tameItem: string;
  tameCount: number;
  costVal: number;
  sellVal: number;
  avatarIcon: string;
  speed: number;
  pickupRadius: number;
}

export const PET_DATA: Record<PetType, PetInfo> = {
  SLIME_PET: {
    type: 'SLIME_PET',
    name: 'Puni',
    species: 'Slime Kristal Mungil',
    description: 'Slime mini kenyal yang sangat setia. Mengumpulkan koin dan drop item di sekitarmu secara otomatis!',
    tameItem: 'SLIME_JELLY',
    tameCount: 2,
    costVal: 350,
    sellVal: 175,
    avatarIcon: '🫧',
    speed: 72,
    pickupRadius: 135
  },
  WOLF_PET: {
    type: 'WOLF_PET',
    name: 'Lobo',
    species: 'Anak Serigala Rimba',
    description: 'Anak serigala berbulu lebat dan lincah yang rajin mengendus dan memungut jarahan monster.',
    tameItem: 'MAGIC_FLOWER',
    tameCount: 2,
    costVal: 500,
    sellVal: 250,
    avatarIcon: '🐺',
    speed: 76,
    pickupRadius: 140
  },
  FAIRY_PET: {
    type: 'FAIRY_PET',
    name: 'Sylph',
    species: 'Peri Cahaya Mungil',
    description: 'Peri mungil berkilau berkah hutan. Memungut koin & item dengan jangkauan magnetik lebih jauh (165px)!',
    tameItem: 'DUNGEON_GEM',
    tameCount: 1,
    costVal: 1200,
    sellVal: 600,
    avatarIcon: '✨',
    speed: 88,
    pickupRadius: 170
  },
  DRAGON_PET: {
    type: 'DRAGON_PET',
    name: 'Ignis',
    species: 'Bayi Naga Merah',
    description: 'Naga kerdil bersayap lucu dan berani. Mengendus dan memungut seluruh jarahan dungeon dengan gesit!',
    tameItem: 'ANCIENT_BONE',
    tameCount: 2,
    costVal: 2500,
    sellVal: 1250,
    avatarIcon: '🐉',
    speed: 80,
    pickupRadius: 150
  }
};

export class Pet {
  public type: PetType;
  public name: string;
  public x: number;
  public y: number;
  public width: number = 16;
  public height: number = 14;

  public speed: number = 72;
  public direction: 'left' | 'right' = 'right';

  // Emotes & Animation
  private animTimer: number = 0;
  public heartTimer: number = 0;
  public lootTarget: WorldItem | null = null;

  constructor(type: PetType, x: number, y: number) {
    this.type = type;
    this.name = PET_DATA[type].name;
    this.x = x;
    this.y = y;
    if (type === 'FAIRY_PET') {
      this.speed = 88;
    } else if (type === 'DRAGON_PET') {
      this.speed = 80;
    } else {
      this.speed = 72;
    }
  }

  public update(
    deltaTime: number,
    player: Player,
    worldItems: WorldItem[],
    floatingText: FloatingTextManager,
    isTileSolid?: (tx: number, ty: number) => boolean
  ): void {
    this.animTimer += deltaTime;
    if (this.heartTimer > 0) this.heartTimer -= deltaTime;

    const tileSize = 32;
    const canMoveTo = (posX: number, posY: number): boolean => {
      if (!isTileSolid) return true;
      const footLeft = posX + 4;
      const footRight = posX + this.width - 4;
      const footTop = posY + this.height - 10;
      const footBottom = posY + this.height - 1;

      const leftTile = Math.floor(footLeft / tileSize);
      const rightTile = Math.floor((footRight - 0.01) / tileSize);
      const topTile = Math.floor(footTop / tileSize);
      const bottomTile = Math.floor((footBottom - 0.01) / tileSize);

      for (let ty = topTile; ty <= bottomTile; ty++) {
        for (let tx = leftTile; tx <= rightTile; tx++) {
          if (isTileSolid(tx, ty)) return false;
        }
      }
      return true;
    };

    const moveStep = (dx: number, dy: number) => {
      const nextX = this.x + dx;
      if (canMoveTo(nextX, this.y)) {
        this.x = nextX;
      }
      const nextY = this.y + dy;
      if (canMoveTo(this.x, nextY)) {
        this.y = nextY;
      }
    };

    // Auto recover if pet gets stuck inside walls
    if (isTileSolid && !canMoveTo(this.x, this.y) && canMoveTo(player.x, player.y)) {
      this.x = player.x;
      this.y = player.y;
    }

    const myCenterX = this.x + this.width / 2;
    const myCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    // 1. Auto-Loot Magnet AI
    // Find closest item within magnetic radius (Fairy has widest reach 170px)
    let nearestItem: WorldItem | null = null;
    let nearestDist = this.type === 'FAIRY_PET' ? 170 : this.type === 'DRAGON_PET' ? 150 : 135;

    for (const item of worldItems) {
      if (item.isCollected) continue;
      const itemCenterX = item.x + item.width / 2;
      const itemCenterY = item.y + item.height / 2;
      const dist = Math.hypot(myCenterX - itemCenterX, myCenterY - itemCenterY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestItem = item;
      }
    }

    if (nearestItem) {
      // Dash towards dropped item
      const itemCenterX = nearestItem.x + nearestItem.width / 2;
      const itemCenterY = nearestItem.y + nearestItem.height / 2;
      const angle = Math.atan2(itemCenterY - myCenterY, itemCenterX - myCenterX);
      const dx = Math.cos(angle) * (this.speed * 1.3) * deltaTime;
      const dy = Math.sin(angle) * (this.speed * 1.3) * deltaTime;
      moveStep(dx, dy);
      this.direction = itemCenterX < myCenterX ? 'left' : 'right';

      // Pick up item when reached
      if (nearestDist < 16) {
        const added = player.inventory.addItem(nearestItem.itemId, nearestItem.count);

        if (added > 0) {
          nearestItem.count -= added;
          if (nearestItem.count <= 0) {
            nearestItem.isCollected = true;
          }
          this.heartTimer = 1.4;
          AudioEngine.playItemPickup(nearestItem.itemId === 'GOLD_COIN');
          const itemDef = ITEM_DEFINITIONS[nearestItem.itemId];
          floatingText.spawn(
            myCenterX,
            myCenterY - 12,
            `🐾 ${this.name}: +${added} ${itemDef ? itemDef.name : nearestItem.itemId}!`,
            '#facc15',
            1.8
          );
        }
      }
    } else {
      // 2. Follow Player smoothly without clipping walls
      const followOffsetX = player.direction === 'left' ? 22 : -22;
      let targetX = playerCenterX + followOffsetX;
      let targetY = playerCenterY + 12;

      if (!canMoveTo(targetX, targetY)) {
        targetX = playerCenterX;
        targetY = playerCenterY;
      }

      const distToPlayer = Math.hypot(this.x - targetX, this.y - targetY);

      if (distToPlayer > 240 && canMoveTo(playerCenterX, playerCenterY)) {
        this.x = playerCenterX;
        this.y = playerCenterY;
      } else if (distToPlayer > 18) {
        const speed = distToPlayer > 120 ? this.speed * 1.6 : this.speed;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const dx = Math.cos(angle) * speed * deltaTime;
        const dy = Math.sin(angle) * speed * deltaTime;
        moveStep(dx, dy);
        this.direction = targetX < this.x ? 'left' : 'right';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const isLeft = this.direction === 'left';
    const bob = Math.sin(this.animTimer * 8) * 1.5;

    // Soft Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 13, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'SLIME_PET') {
      // Puni: Cute Baby Slime
      const squish = Math.sin(this.animTimer * 10) * 1.2;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 8 + bob, 7 + squish, 6 - squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shiny core
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.ellipse(x + 6, y + 6 + bob, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute Big Sparkly Eyes
      ctx.fillStyle = '#0f172a';
      const eyeOffset = isLeft ? 5 : 9;
      ctx.fillRect(x + eyeOffset, y + 6 + bob, 2, 2.5);
      ctx.fillRect(x + eyeOffset + 3, y + 6 + bob, 2, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + eyeOffset, y + 6 + bob, 1, 1);
      ctx.fillRect(x + eyeOffset + 3, y + 6 + bob, 1, 1);

      // Pink Blush Cheeks
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(x + eyeOffset - 1, y + 8 + bob, 1.5, 1);
      ctx.fillRect(x + eyeOffset + 5, y + 8 + bob, 1.5, 1);
    } else if (this.type === 'WOLF_PET') {
      // Lobo: Fluffy Wolf Pup
      // Body
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 3, y + 6 + bob, 10, 6);

      // Fluffy Head
      ctx.fillStyle = '#cbd5e1';
      const headX = isLeft ? x + 1 : x + 7;
      ctx.fillRect(headX, y + 2 + bob, 8, 7);

      // Floppy / Perky Ears
      ctx.fillStyle = '#64748b';
      ctx.fillRect(headX + 1, y - 1 + bob, 2, 3);
      ctx.fillRect(headX + 5, y - 1 + bob, 2, 3);

      // Cute Eyes & Black Nose
      ctx.fillStyle = '#0f172a';
      const eyeX = isLeft ? headX + 2 : headX + 5;
      ctx.fillRect(eyeX, y + 4 + bob, 1.5, 1.5);
      ctx.fillRect(isLeft ? headX + 1 : headX + 7, y + 5 + bob, 1.5, 1.5); // Snout

      // Wagging Tail
      const tailWag = Math.sin(this.animTimer * 16) * 3;
      const tailX = isLeft ? x + 12 : x + 1;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(tailX + tailWag * 0.4, y + 4 + bob, 3, 3);

      // Tiny Paws
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 4, y + 11 + bob, 2.5, 3);
      ctx.fillRect(x + 9, y + 11 + bob, 2.5, 3);
    } else if (this.type === 'FAIRY_PET') {
      // Sylph: Cute Glowing Fairy
      const fairyBob = Math.sin(this.animTimer * 12) * 2.5;
      const wingFlutter = Math.sin(this.animTimer * 26) * 4;

      // Sparkling Fairy Aura Glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(x + 8, y + 6 + fairyBob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Translucent Wings
      ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
      ctx.beginPath();
      ctx.ellipse(x + (isLeft ? 12 : 4), y + 4 + fairyBob, 5 + Math.abs(wingFlutter) * 0.5, 3, isLeft ? -0.4 : 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Tiny Fairy Body
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 8 + fairyBob, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Head & Tiara
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(x + 8, y + 4 + fairyBob, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 7, y + 1 + fairyBob, 2, 2); // Gem on forehead

      // Tiny Cute Eyes
      ctx.fillStyle = '#0f172a';
      const eyeX = isLeft ? x + 6.5 : x + 8.5;
      ctx.fillRect(eyeX, y + 3.5 + fairyBob, 1, 1.5);
    } else if (this.type === 'DRAGON_PET') {
      // Ignis: Cute Baby Wyrm / Dragon
      const dragonBob = Math.sin(this.animTimer * 9) * 1.5;
      const flap = Math.sin(this.animTimer * 18) * 3;

      // Chubby Crimson Body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 8 + dragonBob, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Scales Belly
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(x + (isLeft ? 7 : 9), y + 9 + dragonBob, 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dragon Head
      ctx.fillStyle = '#ef4444';
      const headX = isLeft ? x + 3 : x + 9;
      ctx.fillRect(headX, y + 2 + dragonBob, 6, 6);

      // Cute Little Dragon Horns
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(headX + 1, y - 1 + dragonBob, 1.5, 3);
      ctx.fillRect(headX + 4, y - 1 + dragonBob, 1.5, 3);

      // Tiny Bat/Dragon Wings
      ctx.fillStyle = '#991b1b';
      const wingX = isLeft ? x + 11 : x + 2;
      ctx.beginPath();
      ctx.moveTo(wingX, y + 6 + dragonBob);
      ctx.lineTo(wingX + (isLeft ? 4 : -4), y + 1 + dragonBob + flap * 0.5);
      ctx.lineTo(wingX + (isLeft ? 2 : -2), y + 7 + dragonBob);
      ctx.fill();

      // Big Sparkly Dragon Eye
      ctx.fillStyle = '#fef08a';
      const eyeX = isLeft ? headX + 1 : headX + 3.5;
      ctx.fillRect(eyeX, y + 3.5 + dragonBob, 2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(eyeX + (isLeft ? 0.5 : 1), y + 4 + dragonBob, 1, 1.5);

      // Curled Tail with tiny spade tip
      ctx.fillStyle = '#dc2626';
      const tailX = isLeft ? x + 13 : x + 1;
      ctx.fillRect(tailX, y + 8 + dragonBob, 3, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(tailX + (isLeft ? 2 : -1), y + 7 + dragonBob, 2, 2);
    }

    // Floating Heart when happy
    if (this.heartTimer > 0) {
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('💖', x + 8, y - 4);
    }

    // Name Tag
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeText(`🐾 ${this.name}`, x + 8, y - 1);
    ctx.fillText(`🐾 ${this.name}`, x + 8, y - 1);

    ctx.restore();
  }
}
