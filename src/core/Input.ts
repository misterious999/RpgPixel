import { ControlSettingsManager } from './ControlSettings.ts';
import { UpdateService } from '../services/UpdateService.ts';

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
  private maxJoystickRadius = 42;

  private actionTouchId: number | null = null;
  private sprintTouchId: number | null = null;
  private touchInterceptor?: (touchX: number, touchY: number) => boolean;
  public isActionJustPressed: boolean = false;
  private prevAction: boolean = false;

  public state: InputState = {
    axisX: 0,
    axisY: 0,
    isAction: false,
    isSprint: false
  };

  constructor(private canvas: HTMLCanvasElement) {
    ControlSettingsManager.load();
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  public consumeAction(): void {
    this.state.isAction = false;
    this.isActionJustPressed = false;
    this.prevAction = false;
    this.actionTouchId = null;
    this.keys.delete('Space');
    this.keys.delete('KeyE');
  }

  public setTouchInterceptor(fn: (touchX: number, touchY: number) => boolean): void {
    this.touchInterceptor = fn;
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      UpdateService.reportActivity();
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  private setupTouchListeners(): void {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      UpdateService.reportActivity();
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cfg = ControlSettingsManager.get();
      const scale = cfg.buttonScale;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        if (this.touchInterceptor && this.touchInterceptor(clientX, clientY)) {
          continue;
        }

        // Left 50% of landscape screen -> Dynamic Joystick
        if (clientX < width * 0.5) {
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
          // Right half: Landscape Gamepad layout
          const actionBtnX = width - cfg.sideMargin;
          const actionBtnY = height - cfg.bottomOffset;
          const sprintBtnX = width - cfg.sideMargin - (58 * scale);
          const sprintBtnY = height - cfg.bottomOffset - (8 * scale);

          const actionRadius = 28 * scale;
          const sprintRadius = 23 * scale;

          const distAction = Math.hypot(clientX - actionBtnX, clientY - actionBtnY);
          const distSprint = Math.hypot(clientX - sprintBtnX, clientY - sprintBtnY);

          if (distSprint < sprintRadius * 1.45) {
            this.sprintTouchId = touch.identifier;
            this.state.isSprint = true;
          } else if (distAction < actionRadius * 1.45) {
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

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;

    const keyboardSprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const keyboardAction = this.keys.has('Space') || this.keys.has('KeyE');

    if (this.joystickTouch) {
      const dx = this.joystickTouch.currentX - this.joystickTouch.startX;
      const dy = this.joystickTouch.currentY - this.joystickTouch.startY;
      const distance = Math.hypot(dx, dy);

      if (distance > 4) {
        const factor = Math.min(distance, this.maxJoystickRadius) / this.maxJoystickRadius;
        x = (dx / distance) * factor;
        y = (dy / distance) * factor;
      }
    } else if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y);
      if (len > 0) {
        x /= len;
        y /= len;
      }
    }

    this.state.axisX = x;
    this.state.axisY = y;
    this.state.isSprint = keyboardSprint || this.sprintTouchId !== null;
    const currentAction = keyboardAction || this.actionTouchId !== null;
    this.isActionJustPressed = currentAction && !this.prevAction;
    this.prevAction = currentAction;
    this.state.isAction = currentAction;
  }

  public renderTouchUI(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const cfg = ControlSettingsManager.get();
    const scale = cfg.buttonScale;
    const alpha = cfg.opacity;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Left Thumbstick
    if (this.joystickTouch) {
      const { startX, startY, currentX, currentY } = this.joystickTouch;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const thumbDist = Math.min(distance, this.maxJoystickRadius);
      const thumbX = startX + Math.cos(angle) * thumbDist;
      const thumbY = startY + Math.sin(angle) * thumbDist;

      ctx.beginPath();
      ctx.arc(startX, startY, this.maxJoystickRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(thumbX, thumbY, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Landscape Resting Guide
      const restX = cfg.sideMargin + 18;
      const restY = height - cfg.bottomOffset - 12;

      ctx.beginPath();
      ctx.arc(restX, restY, 40 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `${Math.floor(10 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sentuh disini', restX, restY);
    }

    // 2. Action Button (A)
    const actionRadius = 27 * scale;
    const actionBtnX = width - cfg.sideMargin;
    const actionBtnY = height - cfg.bottomOffset;

    ctx.beginPath();
    ctx.arc(actionBtnX, actionBtnY, actionRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.state.isAction ? 'rgba(239, 68, 68, 0.88)' : 'rgba(239, 68, 68, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(15 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', actionBtnX, actionBtnY);

    // 3. Sprint Button (RUN) - Left of A
    const sprintRadius = 22 * scale;
    const sprintBtnX = width - cfg.sideMargin - (58 * scale);
    const sprintBtnY = height - cfg.bottomOffset - (8 * scale);

    ctx.beginPath();
    ctx.arc(sprintBtnX, sprintBtnY, sprintRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.state.isSprint ? 'rgba(16, 185, 129, 0.88)' : 'rgba(16, 185, 129, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(12 * scale)}px sans-serif`;
    ctx.fillText('RUN', sprintBtnX, sprintBtnY);

    ctx.restore();
  }
}
