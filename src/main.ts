import { Game } from './core/Game.ts';
import { PwaService } from './services/PwaService.ts';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize Progressive Web App (ServiceWorker, install prompt, fullscreen)
  PwaService.init();

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const threeCanvas = document.getElementById('three-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('Canvas element #game-canvas not found!');
    return;
  }

  const game = new Game(canvas, threeCanvas);
  game.start();

  // Tombol Toggle 2D / HD-2D 3D
  const toggleBtn = document.getElementById('btn-toggle-render-mode') as HTMLButtonElement | null;
  if (toggleBtn) {
    const updateBtnLabel = () => {
      const is3D = game.isHD3D();
      toggleBtn.textContent = is3D ? '✨ HD-2D 3D' : '🎨 2D Klasik';
      toggleBtn.style.color = is3D ? '#38bdf8' : '#94a3b8';
      toggleBtn.style.borderColor = is3D ? 'rgba(56, 189, 248, 0.6)' : 'rgba(148, 163, 184, 0.4)';
    };

    updateBtnLabel();

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      game.toggleRenderMode();
      updateBtnLabel();
    });
  }
  console.log('🎮 Open World RPG 2D Core Engine Started!');
});
