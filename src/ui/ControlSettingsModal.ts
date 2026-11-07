import { ControlSettingsManager, DEFAULT_CONTROL_CONFIG } from '../core/ControlSettings.ts';
import { PwaService } from '../services/PwaService.ts';

export class ControlSettingsModal {
  public isOpen: boolean = false;
  public onConfigChange?: () => void;

  private gearBtn = {
    x: 0,
    y: 10,
    size: 34
  };

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }

  public handleTouch(touchX: number, touchY: number, screenWidth: number, screenHeight: number): boolean {
    this.gearBtn.x = screenWidth - 88;

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

    // Landscape optimized modal dimensions
    const modalWidth = Math.min(540, screenWidth - 24);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    // Close button (X)
    if (
      touchX >= modalX + modalWidth - 40 &&
      touchX <= modalX + modalWidth - 4 &&
      touchY >= modalY + 4 &&
      touchY <= modalY + 36
    ) {
      this.isOpen = false;
      return true;
    }

    const colW = (modalWidth - 42) / 2;
    const col1X = modalX + 16;
    const col2X = modalX + 26 + colW;
    const optW = (colW - 8) / 3;

    // Helper for touch on 3-button segments
    const checkSegmentTouch = (
      secX: number,
      secY: number,
      options: { val: number }[],
      onSelect: (val: number) => void
    ) => {
      for (let i = 0; i < options.length; i++) {
        const ox = secX + i * (optW + 4);
        if (touchX >= ox && touchX <= ox + optW && touchY >= secY && touchY <= secY + 28) {
          onSelect(options[i].val);
          if (this.onConfigChange) this.onConfigChange();
          return true;
        }
      }
      return false;
    };

    // --- KOLOM 1 (KIRI) ---
    // 1. Jarak Kamera (Luas 1.0 | Sedang 1.25 | Dekat 1.5)
    const sec1Y = modalY + 54;
    if (
      checkSegmentTouch(col1X, sec1Y + 16, [{ val: 1.0 }, { val: 1.25 }, { val: 1.5 }], (val) => {
        ControlSettingsManager.save({ cameraZoom: val });
      })
    ) {
      return true;
    }

    // 2. Ketinggian Tombol dari Bawah (45 | 58 | 80)
    const sec2Y = sec1Y + 58;
    if (
      checkSegmentTouch(col1X, sec2Y + 16, [{ val: 45 }, { val: 58 }, { val: 80 }], (val) => {
        ControlSettingsManager.save({ bottomOffset: val });
      })
    ) {
      return true;
    }

    // 3. Transparansi Tombol (0.5 | 0.85 | 1.0)
    const sec3Y = sec2Y + 58;
    if (
      checkSegmentTouch(col1X, sec3Y + 16, [{ val: 0.5 }, { val: 0.85 }, { val: 1.0 }], (val) => {
        ControlSettingsManager.save({ opacity: val });
      })
    ) {
      return true;
    }

    // --- KOLOM 2 (KANAN) ---
    // 4. Ukuran Tombol (0.85 | 1.0 | 1.2)
    const sec4Y = modalY + 54;
    if (
      checkSegmentTouch(col2X, sec4Y + 16, [{ val: 0.85 }, { val: 1.0 }, { val: 1.2 }], (val) => {
        ControlSettingsManager.save({ buttonScale: val });
      })
    ) {
      return true;
    }

    // 5. Jarak dari Tepi Layar (45 | 58 | 75)
    const sec5Y = sec4Y + 58;
    if (
      checkSegmentTouch(col2X, sec5Y + 16, [{ val: 45 }, { val: 58 }, { val: 75 }], (val) => {
        ControlSettingsManager.save({ sideMargin: val });
      })
    ) {
      return true;
    }

    // 6. Pasang Web App / Fullscreen Button Touch
    const sec6Y = sec5Y + 54;
    const pwaBtnW = colW;
    const pwaBtnH = 32;
    const pwaBtnX = col2X;
    const pwaBtnY = sec6Y + 6;
    if (
      touchX >= pwaBtnX &&
      touchX <= pwaBtnX + pwaBtnW &&
      touchY >= pwaBtnY &&
      touchY <= pwaBtnY + pwaBtnH
    ) {
      if (PwaService.isInstallable) {
        PwaService.promptInstall();
      } else {
        PwaService.toggleFullscreen();
      }
      return true;
    }

    // Reset Default Button
    const resetBtnW = 120;
    const resetBtnH = 32;
    const resetBtnX = modalX + 16;
    const resetBtnY = modalY + modalHeight - 44;
    if (
      touchX >= resetBtnX &&
      touchX <= resetBtnX + resetBtnW &&
      touchY >= resetBtnY &&
      touchY <= resetBtnY + resetBtnH
    ) {
      ControlSettingsManager.reset();
      if (this.onConfigChange) this.onConfigChange();
      return true;
    }

    // Simpan & Tutup Button
    const saveBtnW = 150;
    const saveBtnH = 32;
    const saveBtnX = modalX + modalWidth - saveBtnW - 16;
    const saveBtnY = modalY + modalHeight - 44;
    if (
      touchX >= saveBtnX &&
      touchX <= saveBtnX + saveBtnW &&
      touchY >= saveBtnY &&
      touchY <= saveBtnY + saveBtnH
    ) {
      this.isOpen = false;
      return true;
    }

    return true; // Modal consumes touches
  }

  public render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    this.gearBtn.x = screenWidth - 88;

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 3. Modal Box (Landscape Optimized)
    const modalWidth = Math.min(540, screenWidth - 24);
    const modalHeight = Math.min(300, screenHeight - 16);
    const modalX = (screenWidth - modalWidth) / 2;
    const modalY = (screenHeight - modalHeight) / 2;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX, modalY, modalWidth, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙️ PENGATURAN KAMERA & KONTROL MOBILE', modalX + 16, modalY + 18);

    // Close X
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', modalX + modalWidth - 18, modalY + 18);

    const cfg = ControlSettingsManager.get();
    const colW = (modalWidth - 42) / 2;
    const col1X = modalX + 16;
    const col2X = modalX + 26 + colW;
    const optW = (colW - 8) / 3;

    // Helper for rendering segment buttons
    const renderSegment = (
      secX: number,
      secY: number,
      label: string,
      options: { name: string; val: number }[],
      activeVal: number
    ) => {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, secX, secY);

      const btnY = secY + 15;
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const ox = secX + i * (optW + 4);
        const isSelected = Math.abs(opt.val - activeVal) < 0.04;

        ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
        ctx.fillRect(ox, btnY, optW, 26);
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(ox, btnY, optW, 26);

        ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
        ctx.font = isSelected ? 'bold 9px sans-serif' : '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.name, ox + optW / 2, btnY + 13);
      }
    };

    // --- KOLOM 1 (KIRI) ---
    // 1. Jarak Kamera (Solves user's issue: "kurasa itu terlalu dekat")
    const sec1Y = modalY + 48;
    renderSegment(
      col1X,
      sec1Y,
      '📷 Jarak Kamera (Luas Pandang):',
      [
        { name: 'Luas ★', val: 1.0 },
        { name: 'Sedang', val: 1.25 },
        { name: 'Dekat', val: 1.5 }
      ],
      cfg.cameraZoom || DEFAULT_CONTROL_CONFIG.cameraZoom
    );

    // 2. Ketinggian Tombol dari Bawah
    const sec2Y = sec1Y + 54;
    renderSegment(
      col1X,
      sec2Y,
      '🔼 Posisi Tombol dari Bawah:',
      [
        { name: 'Rendah', val: 45 },
        { name: 'Normal ★', val: 58 },
        { name: 'Tinggi', val: 80 }
      ],
      cfg.bottomOffset
    );

    // 3. Transparansi Tombol
    const sec3Y = sec2Y + 54;
    renderSegment(
      col1X,
      sec3Y,
      '🌓 Transparansi Tombol:',
      [
        { name: 'Samar', val: 0.5 },
        { name: 'Jelas ★', val: 0.85 },
        { name: 'Pekat', val: 1.0 }
      ],
      cfg.opacity
    );

    // --- KOLOM 2 (KANAN) ---
    // 4. Ukuran Tombol
    const sec4Y = modalY + 48;
    renderSegment(
      col2X,
      sec4Y,
      '🔍 Ukuran Tombol Layar:',
      [
        { name: 'Kecil', val: 0.85 },
        { name: 'Normal ★', val: 1.0 },
        { name: 'Besar', val: 1.2 }
      ],
      cfg.buttonScale
    );

    // 5. Jarak Sisi Layar
    const sec5Y = sec4Y + 54;
    renderSegment(
      col2X,
      sec5Y,
      '↔️ Jarak dari Tepi Layar:',
      [
        { name: 'Rapat', val: 45 },
        { name: 'Standar ★', val: 58 },
        { name: 'Lebar', val: 75 }
      ],
      cfg.sideMargin
    );

    // 6. Pasang Web App (PWA) / Layar Penuh Button
    const sec6Y = sec5Y + 54;
    const pwaBtnW = colW;
    const pwaBtnH = 32;
    const pwaBtnX = col2X;
    const pwaBtnY = sec6Y + 6;

    ctx.fillStyle = PwaService.isInstallable ? '#0284c7' : '#1e293b';
    ctx.fillRect(pwaBtnX, pwaBtnY, pwaBtnW, pwaBtnH);
    ctx.strokeStyle = PwaService.isInstallable ? '#38bdf8' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pwaBtnX, pwaBtnY, pwaBtnW, pwaBtnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (PwaService.isInstalled) {
      ctx.fillText('✅ Web App Terpasang (Layar Penuh)', pwaBtnX + pwaBtnW / 2, pwaBtnY + pwaBtnH / 2);
    } else if (PwaService.isInstallable) {
      ctx.fillText('📲 Pasang Web App ke Layar HP', pwaBtnX + pwaBtnW / 2, pwaBtnY + pwaBtnH / 2);
    } else {
      ctx.fillText('⛶ Beralih Mode Layar Penuh (Fullscreen)', pwaBtnX + pwaBtnW / 2, pwaBtnY + pwaBtnH / 2);
    }

    // Footer Buttons
    // Reset Default Button
    const resetBtnW = 120;
    const resetBtnH = 30;
    const resetBtnX = modalX + 16;
    const resetBtnY = modalY + modalHeight - 40;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(resetBtnX, resetBtnY, resetBtnW, resetBtnH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(resetBtnX, resetBtnY, resetBtnW, resetBtnH);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↺ Reset Default', resetBtnX + resetBtnW / 2, resetBtnY + resetBtnH / 2);

    // Simpan & Tutup Button
    const saveBtnW = 150;
    const saveBtnH = 30;
    const saveBtnX = modalX + modalWidth - saveBtnW - 16;
    const saveBtnY = modalY + modalHeight - 40;

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(saveBtnX, saveBtnY, saveBtnW, saveBtnH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✓ Simpan & Tutup', saveBtnX + saveBtnW / 2, saveBtnY + saveBtnH / 2);

    ctx.restore();
  }
}
