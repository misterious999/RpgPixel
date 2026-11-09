import { Monster } from './Monster.ts';
import { Player } from './Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';

export type CompanionType = 'RODRIC' | 'LYRA' | 'FLORA';

export interface CompanionInfo {
  type: CompanionType;
  name: string;
  title: string;
  role: string;
  description: string;
  color: string;
  hireCost: number;
}

export const COMPANIONS_DATA: Record<CompanionType, CompanionInfo> = {
  RODRIC: {
    type: 'RODRIC',
    name: 'Rodric',
    title: 'Perisai Baja Kerajaan',
    role: 'Knight / Tanker',
    description: 'Ksatria tangguh berzirah baja tebal yang menarik perhatian monster dan menebas musuh dengan pedang besarnya.',
    color: '#38bdf8',
    hireCost: 50
  },
  LYRA: {
    type: 'LYRA',
    name: 'Lyra',
    title: 'Penyihir Bintang Peri',
    role: 'Elf Mage / DPS Jarak Jauh',
    description: 'Penyihir elf anggun dengan sihir bintang yang membakar monster dari kejauhan.',
    color: '#c084fc',
    hireCost: 65
  },
  FLORA: {
    type: 'FLORA',
    name: 'Flora',
    title: 'Pendeta Suci Cahaya',
    role: 'Priestess / Support Healer',
    description: 'Pendeta suci berhati mulia yang memulihkan HP Anda saat terluka parah dan melindungimu dari bahaya.',
    color: '#4ade80',
    hireCost: 50
  }
};

export class Companion {
  public type: CompanionType;
  public name: string;
  public x: number;
  public y: number;
  public width: number = 22;
  public height: number = 28;

  public hp: number;
  public maxHp: number;
  public level: number = 5;
  public attackPower: number;
  public speed: number = 58;

  public attackCooldown: number = 0;
  public healCooldown: number = 0;
  public hurtTimer: number = 0;
  public direction: 'left' | 'right' = 'right';

  // Dialogue & Speech
  public speechText: string | null = null;
  public speechTimer: number = 0;

  // Visual anim
  private animTimer: number = 0;
  public swingTimer: number = 0;

  constructor(type: CompanionType, spawnX: number, spawnY: number) {
    this.type = type;
    this.x = spawnX;
    this.y = spawnY;
    const info = COMPANIONS_DATA[type];
    this.name = info.name;

    switch (type) {
      case 'RODRIC':
        this.maxHp = 220;
        this.attackPower = 18;
        this.speed = 54;
        break;
      case 'LYRA':
        this.maxHp = 125;
        this.attackPower = 26;
        this.speed = 56;
        break;
      case 'FLORA':
        this.maxHp = 140;
        this.attackPower = 14;
        this.speed = 52;
        break;
    }

    this.hp = this.maxHp;
    this.sayRandomGreeting();
  }

  public say(text: string, duration: number = 2.4): void {
    this.speechText = text;
    this.speechTimer = duration;
  }

  public sayRandomGreeting(): void {
    if (this.type === 'RODRIC') {
      this.say('Pedang dan perisaiku siap, Kapten!');
    } else if (this.type === 'LYRA') {
      this.say('Bintang-bintang membimbing langkah kita.');
    } else {
      this.say('Semoga berkah suci melindungi perjalanan kita.');
    }
  }

  public takeDamage(amount: number, _fromX?: number, _fromY?: number): void {
    const dmg = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - dmg);
    this.hurtTimer = 0.25;

    if (Math.random() < 0.4 && this.speechTimer <= 0) {
      if (this.type === 'RODRIC') this.say('Serangan ini belum seberapa!');
      else if (this.type === 'LYRA') this.say('Ugh, mundur sejenak!');
      else this.say('Cahaya... lindungi aku!');
    }
  }

  public update(
    deltaTime: number,
    player: Player,
    monsters: Monster[],
    floatingText: FloatingTextManager,
    onHitMonster?: (m: Monster, dmg: number) => void
  ): void {
    this.animTimer += deltaTime;
    if (this.hurtTimer > 0) this.hurtTimer -= deltaTime;
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.healCooldown > 0) this.healCooldown -= deltaTime;
    if (this.swingTimer > 0) this.swingTimer -= deltaTime;

    if (this.speechTimer > 0) {
      this.speechTimer -= deltaTime;
      if (this.speechTimer <= 0) {
        this.speechText = null;
      }
    }

    // Passive regeneration out of intense battle (+3 HP / sec)
    if (this.hp < this.maxHp && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + deltaTime * 3.0);
    }

    // Revive companion if fallen after 20 seconds
    if (this.hp <= 0) {
      this.hp = 1;
      this.say('Aku kembali bangkit!');
    }

    const myCenterX = this.x + this.width / 2;
    const myCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;

    // 1. Flora Special: Healing Player or Companion
    if (this.type === 'FLORA' && this.healCooldown <= 0) {
      const playerNeedHeal = player.hp < player.maxHp * 0.75;
      const selfNeedHeal = this.hp < this.maxHp * 0.55;

      if (playerNeedHeal || selfNeedHeal) {
        this.healCooldown = 4.8;
        this.say('Cahaya Suci: Pemulihan!');
        if (playerNeedHeal) {
          const healAmt = 42;
          player.hp = Math.min(player.maxHp, player.hp + healAmt);
          floatingText.spawn(player.x + 12, player.y - 12, `💚 +${healAmt} HP`, '#4ade80', 1.8);
        }
        if (selfNeedHeal) {
          const healSelf = 35;
          this.hp = Math.min(this.maxHp, this.hp + healSelf);
          floatingText.spawn(this.x + 10, this.y - 10, `💚 +${healSelf} HP`, '#4ade80', 1.8);
        }
      }
    }

    // 2. Find closest alive monster in combat range
    let targetMonster: Monster | null = null;
    let closestDist = Infinity;

    for (const m of monsters) {
      if (m.isDead) continue;
      const mCenterX = m.x + m.width / 2;
      const mCenterY = m.y + m.height / 2;
      const dist = Math.hypot(myCenterX - mCenterX, myCenterY - mCenterY);
      const maxDetectRange = this.type === 'RODRIC' ? 145 : 185;
      if (dist < maxDetectRange && dist < closestDist) {
        closestDist = dist;
        targetMonster = m;
      }
    }

    // 3. Movement and Combat Behavior
    if (targetMonster) {
      const mCenterX = targetMonster.x + targetMonster.width / 2;
      const mCenterY = targetMonster.y + targetMonster.height / 2;
      const mRadius = Math.max(targetMonster.width, targetMonster.height) / 2;
      const desiredRange = this.type === 'RODRIC' ? (mRadius + 16) : 85;

      this.direction = (mCenterX < myCenterX) ? 'left' : 'right';

      if (closestDist > desiredRange + 6) {
        const angle = Math.atan2(mCenterY - myCenterY, mCenterX - myCenterX);
        this.x += Math.cos(angle) * this.speed * deltaTime;
        this.y += Math.sin(angle) * this.speed * deltaTime;
      }

      // Attack Execution
      if (closestDist <= desiredRange + 18 && this.attackCooldown <= 0) {
        this.attackCooldown = this.type === 'RODRIC' ? 1.25 : (this.type === 'LYRA' ? 1.5 : 1.8);
        this.swingTimer = 0.28;

        const dmg = Math.round(this.attackPower + (Math.random() * 4 - 2));
        const res = targetMonster.takeDamage(dmg, myCenterX, myCenterY);

        if (this.type === 'RODRIC') {
          if (Math.random() < 0.3) this.say('Tebasan Baja!');
          floatingText.spawn(mCenterX, mCenterY - 10, `🗡️ -${res.damage}`, '#38bdf8');
        } else if (this.type === 'LYRA') {
          if (Math.random() < 0.3) this.say('Sinar Bintang!');
          floatingText.spawn(mCenterX, mCenterY - 10, `✨ -${res.damage}`, '#c084fc');
        } else {
          floatingText.spawn(mCenterX, mCenterY - 10, `💫 -${res.damage}`, '#facc15');
        }

        if (onHitMonster) {
          onHitMonster(targetMonster, res.damage);
        }
      }
    } else {
      // 4. Follow Player smoothly
      // Desired position is slightly behind the player
      const followOffsetX = player.direction === 'left' ? 28 : (player.direction === 'right' ? -28 : 22);
      const followOffsetY = player.direction === 'up' ? 26 : (player.direction === 'down' ? -26 : 8);

      const targetX = player.x + followOffsetX;
      const targetY = player.y + followOffsetY;
      const distToFollowTarget = Math.hypot(this.x - targetX, this.y - targetY);

      if (distToFollowTarget > 18) {
        const followSpeed = distToFollowTarget > 140 ? this.speed * 1.8 : this.speed;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * followSpeed * deltaTime;
        this.y += Math.sin(angle) * followSpeed * deltaTime;
        this.direction = (playerCenterX < myCenterX) ? 'left' : 'right';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const isFlashing = this.hurtTimer > 0;
    const isLeft = this.direction === 'left';
    const bob = Math.sin(this.animTimer * 5) * 1.5;

    // Soft Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 27, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (this.type) {
      case 'RODRIC':
        this.renderRodric(ctx, x, y + bob, isFlashing, isLeft);
        break;
      case 'LYRA':
        this.renderLyra(ctx, x, y + bob, isFlashing, isLeft);
        break;
      case 'FLORA':
        this.renderFlora(ctx, x, y + bob, isFlashing, isLeft);
        break;
    }

    // Health Bar & Name
    this.renderHealthBar(ctx, x, y);

    // Speech Bubble
    if (this.speechText) {
      this.renderSpeechBubble(ctx, x + 11, y - 22, this.speechText);
    }

    ctx.restore();
  }

  private renderRodric(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean, isLeft: boolean): void {
    // Crimson Cape behind
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(isLeft ? x + 14 : x + 2, y + 8, 6, 15);

    // Silver Knight Armor Torso
    ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
    ctx.fillRect(x + 5, y + 9, 12, 11);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 7, y + 10, 8, 8);

    // Golden Knight Crest
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 9, y + 12, 4, 4);

    // Helmet & Visor
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 6, y + 2, 10, 8);
    // Helmet Plume
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 8, y - 2, 6, 4);
    // Dark Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(isLeft ? x + 6 : x + 10, y + 5, 5, 2);

    // Shield
    const shieldX = isLeft ? x + 1 : x + 15;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(shieldX, y + 10, 6, 10);
    ctx.fillStyle = '#0284c7';
    ctx.strokeRect(shieldX, y + 10, 6, 10);

    // Broadsword with Swing Animation
    const swordX = isLeft ? x - 4 : x + 18;
    ctx.fillStyle = '#e2e8f0';
    if (this.swingTimer > 0) {
      // Slashing arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(isLeft ? x - 6 : x + 24, y + 14, 14, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }
    ctx.fillRect(swordX, y + 6, 3, 13);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(swordX - 2, y + 13, 7, 2);

    // Armored Greaves / Legs
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 6, y + 20, 4, 7);
    ctx.fillRect(x + 12, y + 20, 4, 7);
  }

  private renderLyra(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean, isLeft: boolean): void {
    // Silver Hair
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x + 5, y + 2, 12, 12);

    // Elf Pointed Ears
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(x + 3, y + 5, 2, 3);
    ctx.fillRect(x + 17, y + 5, 2, 3);

    // Face & Beautiful Violet Eyes
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 6, y + 4, 10, 7);
    ctx.fillStyle = '#a855f7';
    const eyeX = isLeft ? x + 7 : x + 11;
    ctx.fillRect(eyeX, y + 6, 2, 2);

    // Wizard Robe
    ctx.fillStyle = flash ? '#ffffff' : '#4338ca';
    ctx.fillRect(x + 5, y + 11, 12, 12);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(x + 7, y + 12, 8, 10);

    // Gold Trim Belt
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 6, y + 16, 10, 2);

    // Arcane Staff with Celestial Crystal
    const staffX = isLeft ? x - 1 : x + 18;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(staffX, y + 4, 2, 18);
    // Glowing Star Crystal
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.arc(staffX + 1, y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(staffX, y + 2, 2, 2);

    // Skirt & Boots
    ctx.fillStyle = '#312e81';
    ctx.fillRect(x + 6, y + 23, 4, 4);
    ctx.fillRect(x + 12, y + 23, 4, 4);
  }

  private renderFlora(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean, isLeft: boolean): void {
    // Honey Blonde Hair & Nun Veil
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 5, y + 3, 12, 12);

    // White Veil
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 1, 14, 5);
    ctx.fillRect(x + 3, y + 5, 3, 12);
    ctx.fillRect(x + 16, y + 5, 3, 12);

    // Gentle Face & Green Eyes
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 6, y + 4, 10, 7);
    ctx.fillStyle = '#16a34a';
    const eyeX = isLeft ? x + 7 : x + 11;
    ctx.fillRect(eyeX, y + 6, 2, 2);

    // White & Gold Cleric Vestment
    ctx.fillStyle = flash ? '#ffffff' : '#f8fafc';
    ctx.fillRect(x + 5, y + 11, 12, 12);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 9, y + 11, 4, 12);
    ctx.fillRect(x + 6, y + 14, 10, 2);

    // Holy Staff with Lotus Bloom
    const staffX = isLeft ? x - 1 : x + 18;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(staffX, y + 5, 2, 18);
    // Glowing Green / Gold Lotus
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(staffX + 1, y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(staffX, y + 2, 2, 2);

    // Robe lower & Sandals
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 6, y + 23, 4, 4);
    ctx.fillRect(x + 12, y + 23, 4, 4);
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const barW = 26;
    const barH = 3;
    const barX = x + (this.width - barW) / 2;
    const barY = y - 9;

    // Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Fill
    const pct = Math.min(1, Math.max(0, this.hp / this.maxHp));
    ctx.fillStyle = pct > 0.4 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(barX, barY, Math.round(barW * pct), barH);

    // Companion Name & Title
    ctx.font = 'bold 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#93c5fd';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`🤝 ${this.name}`, x + this.width / 2, barY - 3);
    ctx.fillText(`🤝 ${this.name}`, x + this.width / 2, barY - 3);
  }

  private renderSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string): void {
    ctx.font = 'bold 8.5px sans-serif';
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const bubbleW = textW + 12;
    const bubbleH = 16;
    const bx = cx - bubbleW / 2;
    const by = cy - bubbleH;

    // Comic speech balloon
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 4);
    ctx.fill();
    ctx.stroke();

    // Little pointer tip
    ctx.beginPath();
    ctx.moveTo(cx - 3, by + bubbleH);
    ctx.lineTo(cx, by + bubbleH + 4);
    ctx.lineTo(cx + 3, by + bubbleH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text inside bubble
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, by + bubbleH / 2);
  }
}
