import * as Phaser from "phaser";

import type { Player } from "@gameplay/player/player";
import type { PlayerInput } from "@gameplay/player/types";

type MovementHandlerInput = {
  player: Player;
  input: PlayerInput;
};

export class MovementHandler {
  handle({ player, input }: MovementHandlerInput): void {
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (input.left?.isDown) velocity.x -= 1;
    if (input.right?.isDown) velocity.x += 1;
    if (input.up?.isDown) velocity.y -= 1;
    if (input.down?.isDown) velocity.y += 1;

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(player.moveSpeed);
    }

    player.setVelocity(velocity.x, velocity.y);
  }
}
