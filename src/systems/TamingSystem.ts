import { Player } from '../entities/Player.ts';
import { WorldItem } from '../world/WorldItem.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export type PetType = 'SLIME_PET' | 'WOLF_PET';

export interface PetInfo {
  type: PetType;
  name: string;
  species: string;
  description: string;
  tameItem: string;
  tameCount: number;
}

export const PET_DATA: Record<PetType, PetInfo> = {
  SLIME_PET: {
    type: 'SLIME_PET',
    name: 'Puni',
    species: 'Slime Kristal Mungil',
    description: 'Slime mini yang sangat setia. Mengumpulkan koin dan item drop di sekitarmu secara otomatis!',
    tameItem: 'SLIME_JELLY',
    tameCount: 2
  },
  WOLF_PET: {
    type: 'WOLF_PET',
    name: 'Lobo',
    species: 'Anak Serigala Rimba',
    description: 'Anak serigala berbulu lebat dan lincah yang rajin mengendus dan memungut jarahan monster.',
    tameItem: 'MAGIC_FLOWER',
    tameCount: 2
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
  }

  public update(
    deltaTime: number,
    player: Player,
    worldItems: WorldItem[],
    floatingText: FloatingTextManager
  ): void {
    this.animTimer += deltaTime;
    if (this.heartTimer > 0) this.heartTimer -= deltaTime;

    const myCenterX = this.x + this.width / 2;
    const myCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    // 1. Auto-Loot Magnet AI
    // Find closest item within 135px radius
    let nearestItem: WorldItem | null = null;
    let nearestDist = 135;

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
      this.x += Math.cos(angle) * (this.speed * 1.3) * deltaTime;
      this.y += Math.sin(angle) * (this.speed * 1.3) * deltaTime;
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
      // 2. Follow Player
      const followOffsetX = player.direction === 'left' ? 22 : -22;
      const targetX = playerCenterX + followOffsetX;
      const targetY = playerCenterY + 12;
      const distToPlayer = Math.hypot(this.x - targetX, this.y - targetY);

      if (distToPlayer > 18) {
        const speed = distToPlayer > 120 ? this.speed * 1.6 : this.speed;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * speed * deltaTime;
        this.y += Math.sin(angle) * speed * deltaTime;
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
    } else {
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
