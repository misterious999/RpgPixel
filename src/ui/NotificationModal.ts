export interface ModalOptions {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert';
  variant?: 'primary' | 'warning' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class NotificationModal {
  private static currentModal: ModalOptions | null = null;
  public static isOpen: boolean = false;
  private static openTime: number = 0;

  // Active button rectangles for touch detection
  private static confirmBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private static cancelBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  public static confirm(options: Omit<ModalOptions, 'type'>): void {
    this.currentModal = {
      ...options,
      type: 'confirm',
      variant: options.variant || 'primary'
    };
    this.isOpen = true;
    this.openTime = Date.now();
  }

  public static alert(options: Omit<ModalOptions, 'type'>): void {
    this.currentModal = {
      ...options,
      type: 'alert',
      variant: options.variant || 'primary'
    };
    this.isOpen = true;
    this.openTime = Date.now();
  }

  public static close(): void {
    this.isOpen = false;
    this.currentModal = null;
  }

  public static handleTouch(touchX: number, touchY: number, _screenWidth?: number, _screenHeight?: number): boolean {
    if (!this.isOpen || !this.currentModal) return false;

    // Debounce to prevent click-through immediately upon opening (250ms)
    if (Date.now() - this.openTime < 250) {
      return true; // Consume touch without activating buttons
    }

    const modal = this.currentModal;

    // Check Confirm Button
    const cb = this.confirmBtnRect;
    if (touchX >= cb.x && touchX <= cb.x + cb.w && touchY >= cb.y && touchY <= cb.y + cb.h) {
      const cbFn = modal.onConfirm;
      this.close();
      if (cbFn) cbFn();
      return true;
    }

    // Check Cancel Button (Only if confirm modal)
    if (modal.type === 'confirm') {
      const cc = this.cancelBtnRect;
      if (touchX >= cc.x && touchX <= cc.x + cc.w && touchY >= cc.y && touchY <= cc.y + cc.h) {
        const cancelFn = modal.onCancel;
        this.close();
        if (cancelFn) cancelFn();
        return true;
      }
    }

    return true; // Modal consumes all touches when open
  }

  public static render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.isOpen || !this.currentModal) return;

    const modal = this.currentModal;

    ctx.save();

    // 1. Dark Blur Backdrop
    ctx.fillStyle = 'rgba(4, 7, 15, 0.82)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Modal Dimensions (Landscape Optimized)
    const modalWidth = Math.min(460, screenWidth - 32);
    const modalHeight = Math.min(240, screenHeight - 24);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Accent color based on variant
    const accentColor =
      modal.variant === 'danger'
        ? '#ef4444'
        : modal.variant === 'warning'
        ? '#f59e0b'
        : '#38bdf8';

    // Outer Glow / Shadow
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.shadowBlur = 0; // reset shadow

    // Double Border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 4, modalY + 4, modalWidth - 8, modalHeight - 8);

    // Corner Rivets (Fantasy RPG Style)
    const rivet = (rx: number, ry: number) => {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 2, ry - 2, 4, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(rx - 1, ry - 1, 2, 2);
    };
    rivet(modalX + 8, modalY + 8);
    rivet(modalX + modalWidth - 8, modalY + 8);
    rivet(modalX + 8, modalY + modalHeight - 8);
    rivet(modalX + modalWidth - 8, modalY + modalHeight - 8);

    // Header Banner
    ctx.fillStyle = '#111827';
    ctx.fillRect(modalX + 5, modalY + 5, modalWidth - 10, 42);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(modalX + 5, modalY + 47);
    ctx.lineTo(modalX + modalWidth - 5, modalY + 47);
    ctx.stroke();

    // Icon Circle
    const icon = modal.icon || (modal.type === 'confirm' ? '🛡️' : '💡');
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, modalX + 30, modalY + 26);

    // Title
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(modal.title, modalX + 52, modalY + 26);

    // Message Body (With Multi-Line Word Wrapping)
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const maxTextWidth = modalWidth - 44;
    const lines: string[] = [];
    const paragraphs = modal.message.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    const startTextY = modalY + 60;
    const lineHeight = 17;
    for (let l = 0; l < Math.min(lines.length, 6); l++) {
      ctx.fillText(lines[l], modalX + 22, startTextY + l * lineHeight);
    }

    // Action Buttons
    const btnHeight = 34;
    const btnY = modalY + modalHeight - 48;

    if (modal.type === 'confirm') {
      const btnWidth = (modalWidth - 60) / 2;

      // Cancel Button
      const cancelX = modalX + 20;
      this.cancelBtnRect = { x: cancelX, y: btnY, w: btnWidth, h: btnHeight };

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cancelX, btnY, btnWidth, btnHeight);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cancelX, btnY, btnWidth, btnHeight);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(modal.cancelText || 'Batal', cancelX + btnWidth / 2, btnY + btnHeight / 2);

      // Confirm Button
      const confirmX = cancelX + btnWidth + 20;
      this.confirmBtnRect = { x: confirmX, y: btnY, w: btnWidth, h: btnHeight };

      ctx.fillStyle =
        modal.variant === 'danger'
          ? '#dc2626'
          : modal.variant === 'warning'
          ? '#d97706'
          : '#0284c7';
      ctx.fillRect(confirmX, btnY, btnWidth, btnHeight);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(confirmX, btnY, btnWidth, btnHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(modal.confirmText || 'Lanjutkan', confirmX + btnWidth / 2, btnY + btnHeight / 2);
    } else {
      // Single Alert Button (Centered)
      const btnWidth = Math.min(180, modalWidth - 60);
      const btnX = modalX + (modalWidth - btnWidth) / 2;
      this.confirmBtnRect = { x: btnX, y: btnY, w: btnWidth, h: btnHeight };

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(modal.confirmText || '✓ Mengerti', btnX + btnWidth / 2, btnY + btnHeight / 2);
    }

    ctx.restore();
  }
}
