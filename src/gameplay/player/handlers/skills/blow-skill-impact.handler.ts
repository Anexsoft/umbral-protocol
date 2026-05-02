import * as Phaser from "phaser";

import type { Enemy } from "@gameplay/enemies/enemy";
import type { BlowSkillPayload } from "@gameplay/player/types";

type BlowSkillImpactHandlerInput = {
  enemies: Enemy[];
  payload: BlowSkillPayload;
};

export class BlowSkillImpactHandler {
  handle({ enemies, payload }: BlowSkillImpactHandlerInput): void {
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive) continue;

      const dist = Phaser.Math.Distance.Between(
        payload.x,
        payload.y,
        enemy.x,
        enemy.y,
      );
      const reach =
        payload.radius +
        Math.max(enemy.displayWidth, enemy.displayHeight) * 0.35;

      if (dist <= reach) {
        enemy.takeDamage(payload.damage);
      }
    }
  }
}
