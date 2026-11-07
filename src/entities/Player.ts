import { CONSTANTS } from '../core/Constants.ts';
import { InputState } from '../core/Input.ts';
import { TileMap } from '../world/TileMap.ts';

export type Direction = 'down' | 'up' | 'left' | 'right';

export class Player {
  public x: number;
  public y: number;
  public width: number = 20;
  public height: number = 26;

  // Collision box relative to player (feet area for 2D top-down perspective)
  public collisionBox = {
    offsetX: 3,
    offsetY: 16,
    width: 14,
    height: 9
  };

  public direction: Direction = 'down';
  public isMoving: boolean = false;
  private animTimer: number = 0;
  private attackTimer: number = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public update(deltaTime: number, input: InputState, tileMap: TileMap): void {
    const { axisX, axisY, isSprint, isAction } = input;

    if (isAction && this.attackTimer <= 0) {
      this.attackTimer = 0.25; // 250ms attack swing
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    this.isMoving = Math.abs(axisX) > 0.05 || Math.abs(axisY) > 0.05;

    if (this.isMoving) {
      this.animTimer += deltaTime * 10;

      // Update facing direction
      if (Math.abs(axisX) > Math.abs(axisY)) {
        this.direction = axisX > 0 ? 'right' : 'left';
      } else {
        this.direction = axisY > 0 ? 'down' : 'up';
      }

      // Calculate speed
      const speed = CONSTANTS.PLAYER_SPEED * (isSprint ? CONSTANTS.PLAYER_SPRINT_MULTIPLIER : 1.0);
      const moveX = axisX * speed * deltaTime;
      const moveY = axisY * speed * deltaTime;

      // Move with Axis Separation for smooth sliding against walls
      // 1. Try X movement
      const nextBoxX = {
        x: this.x + moveX + this.collisionBox.offsetX,
        y: this.y + this.collisionBox.offsetY,
        width: this.collisionBox.width,
        height: this.collisionBox.height
      };
      if (!tileMap.checkCollision(nextBoxX)) {
        this.x += moveX;
      }

      // 2. Try Y movement
      const nextBoxY = {
        x: this.x + this.collisionBox.offsetX,
        y: this.y + moveY + this.collisionBox.offsetY,
        width: this.collisionBox.width,
        height: this.collisionBox.height
      };
      if (!tileMap.checkCollision(nextBoxY)) {
        this.y += moveY;
      }
    } else {
      this.animTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const px = Math.floor(this.x);
    const py = Math.floor(this.y);

    ctx.save();

    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 24, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walk cycle leg bounce
    const step = this.isMoving ? Math.sin(this.animTimer) : 0;
    const legOffset1 = step * 3;
    const legOffset2 = -step * 3;

    // 2. Legs / Boots (Brown)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 4, py + 18 + legOffset1, 4, 7);
    ctx.fillRect(px + 12, py + 18 + legOffset2, 4, 7);

    // 3. Body / Tunic (Hero Blue)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(px + 4, py + 10, 12, 10);
    // Belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 4, py + 16, 12, 2);
    // Buckle
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px + 9, py + 16, 2, 2);

    // 4. Head / Face (Skin tone)
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 5, py + 2, 10, 9);

    // 5. Hair (Reddish Brown / Hero Hair)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px + 4, py, 12, 4);
    ctx.fillRect(px + 3, py + 2, 2, 5);
    ctx.fillRect(px + 15, py + 2, 2, 5);

    // 6. Eyes based on direction
    ctx.fillStyle = '#1e293b';
    if (this.direction === 'down') {
      ctx.fillRect(px + 7, py + 5, 2, 2);
      ctx.fillRect(px + 11, py + 5, 2, 2);
    } else if (this.direction === 'up') {
      // Back of head, show more hair
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 5, py + 2, 10, 7);
    } else if (this.direction === 'left') {
      ctx.fillRect(px + 6, py + 5, 2, 2);
    } else if (this.direction === 'right') {
      ctx.fillRect(px + 12, py + 5, 2, 2);
    }

    // 7. Attack Slash Effect
    if (this.attackTimer > 0) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (this.direction === 'right') {
        ctx.arc(px + 22, py + 12, 12, -Math.PI * 0.3, Math.PI * 0.3);
      } else if (this.direction === 'left') {
        ctx.arc(px - 2, py + 12, 12, Math.PI * 0.7, Math.PI * 1.3);
      } else if (this.direction === 'down') {
        ctx.arc(px + 10, py + 26, 12, Math.PI * 0.2, Math.PI * 0.8);
      } else if (this.direction === 'up') {
        ctx.arc(px + 10, py - 2, 12, Math.PI * 1.2, Math.PI * 1.8);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
