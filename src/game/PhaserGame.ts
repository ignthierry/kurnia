import * as Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import type { GameStateEvent } from './scenes/MainScene';

export function createPhaserGame(
  containerId: string,
  onStateChange: (state: GameStateEvent) => void
): Phaser.Game {
  const mainScene = new MainScene();
  mainScene.onStateChange = onStateChange;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#070b19',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 750 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    scene: [mainScene],
  };

  return new Phaser.Game(config);
}
