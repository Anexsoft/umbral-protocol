import * as Phaser from "phaser";

import { SceneRegistry } from "@core/scene-registry";

import { ensureGameDataLoaded } from "@data/game-data";
import { getTheme } from "@data/theme/theme";

import "./style.css";

ensureGameDataLoaded();

function readEnvBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return fallback;
}

const isDebugMode = readEnvBoolean(import.meta.env.VITE_GAME_DEBUG, false);

const theme = getTheme();

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: theme.semantic.surface.app,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: isDebugMode,
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
