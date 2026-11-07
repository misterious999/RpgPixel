export interface InputState {
  axisX: number; // -1 to 1
  axisY: number; // -1 to 1
  isAction: boolean;
  isSprint: boolean;
}

interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private joystickTouch: TouchPoint | null = null;
  private maxJoystickRadius = 45;

  private actionTouchId: number | null = null;
  private sprintTouchId: number | null = null;
  private touchInterceptor?: (touchX: number, touchY: number) => boolean;

  public state: InputState = {
    axisX: 0,
    axisY: 0,
    isAction: false,
    isSprint: false
  };

  constructor(private canvas: HTMLCanvasElement) {
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  public setTouchInterceptor(fn: (touchX: number, touchY: number) => boolean): void {
    this.touchInterceptor = fn;
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  private setupTouchListeners(): void {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        // If UI consumes this touch (e.g. Backpack, Modal), ignore game movement/actions
        if (this.touchInterceptor && this.touchInterceptor(clientX, clientY)) {
          continue;
        }

        // Left half of screen -> Dynamic Joystick
        if (clientX < width * 0.55) {
          if (!this.joystickTouch) {
            this.joystickTouch = {
              id: touch.identifier,
              startX: clientX,
              startY: clientY,
              currentX: clientX,
              currentY: clientY
            };
          }
        } else {
          // Right half: Buttons
          const btnRadius = 38;
          const sprintBtnX = width - 65;
          const sprintBtnY = height - 120;
          const actionBtnX = width - 65;
          const actionBtnY = height - 55;

          const distSprint = Math.hypot(clientX - sprintBtnX, clientY - sprintBtnY);
          const distAction = Math.hypot(clientX - actionBtnX, clientY - actionBtnY);

          if (distSprint < btnRadius * 1.5) {
            this.sprintTouchId = touch.identifier;
            this.state.isSprint = true;
          } else if (distAction < btnRadius * 1.5) {
            this.actionTouchId = touch.identifier;
            this.state.isAction = true;
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouch && touch.identifier === this.joystickTouch.id) {
          this.joystickTouch.currentX = touch.clientX - rect.left;
          this.joystickTouch.currentY = touch.clientY - rect.top;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouch && touch.identifier === this.joystickTouch.id) {
          this.joystickTouch = null;
        }
        if (this.actionTouchId === touch.identifier) {
          this.actionTouchId = null;
          this.state.isAction = false;
        }
        if (this.sprintTouchId === touch.identifier) {
          this.sprintTouchId = null;
          this.state.isSprint = false;
        }
      }
    };

    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Also support desktop mouse clicks for Backpack UI
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      if (this.touchInterceptor) {
        this.touchInterceptor(clientX, clientY);
      }
    });
  }

  public update(): void {
    let x = 0;
    let y = 0;

    // Keyboard Input
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;

    const keyboardSprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const keyboardAction = this.keys.has('Space') || this.keys.has('KeyE');

    // Virtual Touch Joystick input
    if (this.joystickTouch) {
      const dx = this.joystickTouch.currentX - this.joystickTouch.startX;
      const dy = this.joystickTouch.currentY - this.joystickTouch.startY;
      const distance = Math.hypot(dx, dy);

      if (distance > 5) {
        const factor = Math.min(distance, this.maxJoystickRadius) / this.maxJoystickRadius;
        x = (dx / distance) * factor;
        y = (dy / distance) * factor;
      }
    } else if (x !== 0 || y !== 0) {
      // Normalize keyboard diagonals
      const len = Math.hypot(x, y);
      if (len > 0) {
        x /= len;
        y /= len;
      }
    }

    this.state.axisX = x;
    this.state.axisY = y;
    this.state.isSprint = keyboardSprint || this.sprintTouchId !== null;
    this.state.isAction = keyboardAction || this.actionTouchId !== null;
  }

  public renderTouchUI(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    // 1. Render Left Joystick Base & Thumb
    if (this.joystickTouch) {
      const { startX, startY, currentX, currentY } = this.joystickTouch;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const thumbDist = Math.min(distance, this.maxJoystickRadius);
      const thumbX = startX + Math.cos(angle) * thumbDist;
      const thumbY = startY + Math.sin(angle) * thumbDist;

      // Outer ring
      ctx.beginPath();
      ctx.arc(startX, startY, this.maxJoystickRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thumb stick
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(75, height - 75, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sentuh disini', 75, height - 72);
    }

    // 2. Action Button (A)
    const actionBtnX = width - 65;
    const actionBtnY = height - 55;
    ctx.beginPath();
    ctx.arc(actionBtnX, actionBtnY, 28, 0, Math.PI * 2);
    ctx.fillStyle = this.state.isAction ? 'rgba(239, 68, 68, 0.75)' : 'rgba(239, 68, 68, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', actionBtnX, actionBtnY);

    // 3. Sprint Button (B)
    const sprintBtnX = width - 65;
    const sprintBtnY = height - 120;
    ctx.beginPath();
    ctx.arc(sprintBtnX, sprintBtnY, 24, 0, Math.PI * 2);
    ctx.fillStyle = this.state.isSprint ? 'rgba(16, 185, 129, 0.75)' : 'rgba(16, 185, 129, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('RUN', sprintBtnX, sprintBtnY);

    ctx.restore();
  }
}
