import { ControlSettingsManager } from '../core/ControlSettings.ts';

export class ControlSettingsModal {
  public isOpen: boolean = false;

  private gearBtn = {
    x: 0,
    y: 14,
    size: 34
  };

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    this.gearBtn.x = screenWidth - 92;

    // 1. Gear icon toggle check
    if (
      touchX >= this.gearBtn.x &&
      touchX <= this.gearBtn.x + this.gearBtn.size &&
      touchY >= this.gearBtn.y &&
      touchY <= this.gearBtn.y + this.gearBtn.size
    ) {
      this.toggle();
      return true;
    }

    if (!this.isOpen) return false;

    const modalWidth = Math.min(360, screenWidth - 24);
    const modalHeight = Math.min(420, screenHeight - 30);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Close button (X)
    if (
      touchX >= modalX + modalWidth - 36 &&
      touchX <= modalX + modalWidth - 8 &&
      touchY >= modalY + 6 &&
      touchY <= modalY + 34
    ) {
      this.isOpen = false;
      return true;
    }

    // 1. Ketinggian dari Bawah (Bottom Offset Options)
    // Rendah (65px) | Sedang (95px) | Tinggi (135px)
    const optY1 = modalY + 84;
    const optW = (modalWidth - 40) / 3;
    const heights = [65, 95, 135];
    for (let i = 0; i < 3; i++) {
      const ox = modalX + 20 + i * optW;
      if (touchX >= ox && touchX <= ox + optW - 4 && touchY >= optY1 && touchY <= optY1 + 32) {
        ControlSettingsManager.save({ bottomOffset: heights[i] });
        return true;
      }
    }

    // 2. Ukuran Tombol (Button Scale)
    // Kecil (0.85) | Normal (1.0) | Besar (1.25)
    const optY2 = modalY + 154;
    const scales = [0.85, 1.0, 1.25];
    for (let i = 0; i < 3; i++) {
      const ox = modalX + 20 + i * optW;
      if (touchX >= ox && touchX <= ox + optW - 4 && touchY >= optY2 && touchY <= optY2 + 32) {
        ControlSettingsManager.save({ buttonScale: scales[i] });
        return true;
      }
    }

    // 3. Jarak Sisi Layar (Side Margin)
    // Rapat (55px) | Standar (75px) | Lebar (95px)
    const optY3 = modalY + 224;
    const margins = [55, 75, 95];
    for (let i = 0; i < 3; i++) {
      const ox = modalX + 20 + i * optW;
      if (touchX >= ox && touchX <= ox + optW - 4 && touchY >= optY3 && touchY <= optY3 + 32) {
        ControlSettingsManager.save({ sideMargin: margins[i] });
        return true;
      }
    }

    // 4. Transparansi (Opacity)
    // Samar (0.5) | Normal (0.85) | Pekat (1.0)
    const optY4 = modalY + 294;
    const opacities = [0.5, 0.85, 1.0];
    for (let i = 0; i < 3; i++) {
      const ox = modalX + 20 + i * optW;
      if (touchX >= ox && touchX <= ox + optW - 4 && touchY >= optY4 && touchY <= optY4 + 32) {
        ControlSettingsManager.save({ opacity: opacities[i] });
        return true;
      }
    }

    // Reset Button
    const resetBtnW = 100;
    const resetBtnH = 34;
    const resetBtnX = modalX + 20;
    const resetBtnY = modalY + modalHeight - 48;
    if (
      touchX >= resetBtnX &&
      touchX <= resetBtnX + resetBtnW &&
      touchY >= resetBtnY &&
      touchY <= resetBtnY + resetBtnH
    ) {
      ControlSettingsManager.reset();
      return true;
    }

    // Close & Save Button
    const saveBtnW = 140;
    const saveBtnH = 34;
    const saveBtnX = modalX + modalWidth - saveBtnW - 20;
    const saveBtnY = modalY + modalHeight - 48;
    if (
      touchX >= saveBtnX &&
      touchX <= saveBtnX + saveBtnW &&
      touchY >= saveBtnY &&
      touchY <= saveBtnY + saveBtnH
    ) {
      this.isOpen = false;
      return true;
    }

    return true; // Modal consumes touch
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    this.gearBtn.x = screenWidth - 92;

    // 1. Gear Icon Button
    const { x: gx, y: gy, size: gs } = this.gearBtn;
    ctx.fillStyle = this.isOpen ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(gx + gs / 2, gy + gs / 2, gs / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙️', gx + gs / 2, gy + gs / 2);

    if (!this.isOpen) {
      ctx.restore();
      return;
    }

    // 2. Dim Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 3. Modal Box
    const modalWidth = Math.min(360, screenWidth - 24);
    const modalHeight = Math.min(420, screenHeight - 30);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 40);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙️ KUSTOMISASI TOMBOL KONTROL', modalX + 16, modalY + 20);

    // Close X
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 20, modalY + 20);

    const cfg = ControlSettingsManager.get();
    const optW = (modalWidth - 40) / 3;

    // Helper for rendering segment buttons
    const renderSegment = (label: string, startY: number, options: { name: string; val: number }[], activeVal: number) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, modalX + 20, startY - 18);

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const ox = modalX + 20 + i * optW;
        const isSelected = Math.abs(opt.val - activeVal) < 0.05;

        ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
        ctx.fillRect(ox, startY, optW - 4, 30);
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(ox, startY, optW - 4, 30);

        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.name, ox + (optW - 4) / 2, startY + 15);
      }
    };

    // 1. Ketinggian dari Bawah (Solves user's issue!)
    renderSegment(
      '🔼 Posisi Ketinggian Tombol dari Bawah:',
      modalY + 84,
      [
        { name: 'Rendah (65px)', val: 65 },
        { name: 'Sedang (95px) ★', val: 95 },
        { name: 'Tinggi (135px)', val: 135 }
      ],
      cfg.bottomOffset
    );

    // 2. Ukuran Tombol
    renderSegment(
      '🔍 Ukuran Tombol Keypad & Aksi:',
      modalY + 154,
      [
        { name: 'Kecil (85%)', val: 0.85 },
        { name: 'Normal (100%)', val: 1.0 },
        { name: 'Besar (125%)', val: 1.25 }
      ],
      cfg.buttonScale
    );

    // 3. Jarak Sisi Layar (Horizontal)
    renderSegment(
      '↔️ Jarak dari Sisi Kiri / Kanan:',
      modalY + 224,
      [
        { name: 'Rapat (55px)', val: 55 },
        { name: 'Standar (75px)', val: 75 },
        { name: 'Lebar (95px)', val: 95 }
      ],
      cfg.sideMargin
    );

    // 4. Transparansi (Opacity)
    renderSegment(
      '👁️ Transparansi Tombol di Layar:',
      modalY + 294,
      [
        { name: 'Samar (50%)', val: 0.5 },
        { name: 'Normal (85%)', val: 0.85 },
        { name: 'Pekat (100%)', val: 1.0 }
      ],
      cfg.opacity
    );

    // Bottom action buttons: Reset & Simpan
    const resetBtnW = 100;
    const resetBtnH = 34;
    const resetBtnX = modalX + 20;
    const resetBtnY = modalY + modalHeight - 46;

    ctx.fillStyle = '#334155';
    ctx.fillRect(resetBtnX, resetBtnY, resetBtnW, resetBtnH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(resetBtnX, resetBtnY, resetBtnW, resetBtnH);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Reset Default', resetBtnX + resetBtnW / 2, resetBtnY + resetBtnH / 2);

    const saveBtnW = 140;
    const saveBtnH = 34;
    const saveBtnX = modalX + modalWidth - saveBtnW - 20;
    const saveBtnY = modalY + modalHeight - 46;

    ctx.fillStyle = '#10b981';
    ctx.fillRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✓ Simpan & Tutup', saveBtnX + saveBtnW / 2, saveBtnY + saveBtnH / 2);

    ctx.restore();
  }
}
