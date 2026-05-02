import * as Phaser from "phaser";

import { SceneRegistry } from "@core/scene-registry";

import { ensureGameDataLoaded } from "@data/game-data";
import { getTheme } from "@data/theme/theme";

import "./style.css";

ensureGameDataLoaded();

const theme = getTheme();

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: theme.semantic.surface.app,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: SceneRegistry.getScenes(),
};

new Phaser.Game(gameConfig);
