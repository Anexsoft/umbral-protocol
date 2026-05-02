import * as Phaser from "phaser";

import { WORLD_HEIGHT, WORLD_WIDTH } from "@config/constants";

import { getGameData } from "@data/game-data";
import type { RoundSpawnEntry } from "@data/rounds/types";

import { Enemy } from "@gameplay/enemies/enemy";
import { EnemyTypeId } from "@gameplay/enemies/types";
import type { Player } from "@gameplay/player/player";

type GameWaveHandlerInput = {
  id: "spawn-wave";
  scene: Phaser.Scene;
  enemies: Phaser.Physics.Arcade.Group;
  player: Player;
  wave: RoundSpawnEntry[];
};

export class GameWaveHandler {
  handle(command: GameWaveHandlerInput): number {
    command.enemies.clear(true, true);

    let spawned = 0;
    for (let i = 0; i < command.wave.length; i++) {
      const spawn = command.wave[i];
      if (!this.isEnemyTypeId(spawn.id)) {
        console.warn(`Unknown enemy id in rounds.yml: ${spawn.id}`);
        continue;
      }
      if (!getGameData().enemyById.has(spawn.id)) {
        console.warn(`Enemy id not in enemies.yml: ${spawn.id}`);
        continue;
      }

      const pos = this.spawnPositionAtRandomEdge();
      const spawnLevel = Phaser.Math.Between(spawn.levelMin, spawn.levelMax);
      const enemy = new Enemy(
        command.scene,
        pos.x,
        pos.y,
        spawn.id,
        spawnLevel,
        command.player,
      );
      command.enemies.add(enemy);
      spawned += 1;
    }

    return spawned;
  }

  private isEnemyTypeId(id: string): id is EnemyTypeId {
    return (Object.values(EnemyTypeId) as string[]).includes(id);
  }

  private spawnPositionAtRandomEdge(): { x: number; y: number } {
    const padding = 64;
    const edge = Phaser.Math.Between(0, 3);

    switch (edge) {
      case 0:
        return {
          x: padding,
          y: Phaser.Math.Between(padding, WORLD_HEIGHT - padding),
        };
      case 1:
        return {
          x: WORLD_WIDTH - padding,
          y: Phaser.Math.Between(padding, WORLD_HEIGHT - padding),
        };
      case 2:
        return {
          x: Phaser.Math.Between(padding, WORLD_WIDTH - padding),
          y: padding,
        };
      default:
        return {
          x: Phaser.Math.Between(padding, WORLD_WIDTH - padding),
          y: WORLD_HEIGHT - padding,
        };
    }
  }
}
