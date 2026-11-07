export interface ChestReward {
  itemId: string;
  count: number;
}

export class Chest {
  public x: number;
  public y: number;
  public width: number = 22;
  public height: number = 18;
  public isOpen: boolean = false;
  public rewards: ChestReward[];
  private openAnimationProgress: number = 0;

  constructor(x: number, y: number, rewards: ChestReward[]) {
    this.x = x;
    this.y = y;
    this.rewards = rewards;
  }

  public getCollisionBox() {
    return {
      x: this.x,
      y: this.y + 4,
      width: this.width,
      height: this.height - 4
    };
  }

  public isNearPlayer(playerCenterX: number, playerCenterY: number): boolean {
    const chestCenterX = this.x + this.width / 2;
    const chestCenterY = this.y + this.height / 2;
    return Math.hypot(chestCenterX - playerCenterX, chestCenterY - playerCenterY) < 32;
  }

  public open(): ChestReward[] {
    if (this.isOpen) return [];
    this.isOpen = true;
    return this.rewards;
  }

  public update(deltaTime: number): void {
    if (this.isOpen && this.openAnimationProgress < 1) {
      this.openAnimationProgress = Math.min(1, this.openAnimationProgress + deltaTime * 4);
    }
  }

  public render(ctx: CanvasRenderingContext2D, isPlayerNear: boolean): void {
    ctx.save();
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 17, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.isOpen) {
      // Base Chest Body (Wood)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, y + 6, 22, 12);

      // Iron reinforcement corners & band
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y + 6, 3, 12);
      ctx.fillRect(x + 19, y + 6, 3, 12);
      ctx.fillRect(x + 9, y + 6, 4, 12);

      // Chest Lid (Wood top)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x, y + 2, 22, 5);

      // Gold Lock in center
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 9, y + 6, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 10, y + 7, 2, 2);

      // Interactive Hint when player is near
      if (isPlayerNear) {
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2.5;
        const hintText = 'Tekan [A] Buka';
        ctx.strokeText(hintText, x + 11, y - 6);
        ctx.fillText(hintText, x + 11, y - 6);
      }
    } else {
      // Opened Chest
      // Open lid angled back
      const lidY = y - 4 * this.openAnimationProgress;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x, lidY, 22, 5);

      // Chest Interior with gold glow
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x, y + 6, 22, 12);

      // Golden sparkle inside
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 4, y + 8, 14, 4);

      // Iron bands
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y + 6, 3, 12);
      ctx.fillRect(x + 19, y + 6, 3, 12);
    }

    ctx.restore();
  }
}
