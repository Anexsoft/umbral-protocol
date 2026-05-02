import * as Phaser from "phaser";

import { GameScene } from "@scenes/game/scene/game.scene";
import { GameOverScene } from "@scenes/game/scene/game-over.scene";
import { PauseScene } from "@scenes/game/scene/pause/pause.scene";
import { PlayerHudScene } from "@scenes/game/scene/player-hud.scene";
import { LoreScene } from "@scenes/lore/scene/lore.scene";
import { MainMenuScene } from "@scenes/main-menu/scene/main-menu.scene";

export class SceneRegistry {
  public static getScenes(): Phaser.Types.Scenes.SceneType[] {
    return [
      MainMenuScene,
      GameScene,
      PauseScene,
      LoreScene,
      PlayerHudScene,
      GameOverScene,
    ];
  }
}
