import Phaser from 'phaser';
import { PreloadScene } from './PreloadScene';
import { GameScene } from './GameScene';

// Bootstrap Phaser: config + auto-start
export function startFairyGame(parentEl: HTMLElement): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentEl,
    width: 640,
    height: 600,
    backgroundColor: '#0d1b2a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 900 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PreloadScene, GameScene],
  });
  return game;
}