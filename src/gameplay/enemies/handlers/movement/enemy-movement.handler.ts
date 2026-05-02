import * as Phaser from "phaser";

import type { Enemy } from "@gameplay/enemies/enemy";

type EnemyMovementHandlerInput = {
  enemy: Enemy;
  deltaMs: number;
};

export class EnemyMovementHandler {
  handle({ enemy, deltaMs }: EnemyMovementHandlerInput): void {
    if (!enemy.isAlive || !enemy.target.isAlive) {
      enemy.setVelocity(0, 0);
      return;
    }

    if (enemy.knockbackActive) {
      enemy.setVelocity(enemy.knockbackX, enemy.knockbackY);
      enemy.tickKnockback(deltaMs);
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      enemy.target.x,
      enemy.target.y,
    );

    enemy.setVelocity(
      Math.cos(angle) * enemy.speed,
      Math.sin(angle) * enemy.speed,
    );
    enemy.setRotation(angle);
  }
}
