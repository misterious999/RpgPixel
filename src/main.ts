import { Game } from './core/Game.ts';
import { PwaService } from './services/PwaService.ts';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize Progressive Web App (ServiceWorker, install prompt, fullscreen)
  PwaService.init();

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element #game-canvas not found!');
    return;
  }

  const game = new Game(canvas);
  game.start();
  console.log('🎮 Open World RPG 2D Core Engine Started!');
});
