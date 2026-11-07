import { Game } from './core/Game.ts';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element #game-canvas not found!');
    return;
  }

  const game = new Game(canvas);
  game.start();
  console.log('🎮 Open World RPG 2D Core Engine Started!');
});
