import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Player } from "@gameplay/player/player";
import type { PlayerInput } from "@gameplay/player/types";

const theme = getTheme();

const DASH_DURATION_MS = 150;
const DASH_SPEED_MULTIPLIER = 5;

type DashHandlerInput = {
  player: Player;
  input: PlayerInput;
  deltaMs: number;
};

export class DashHandler {
  handle({ player, input, deltaMs }: DashHandlerInput): void {
    if (player.dashActive) {
      player.dashTimerMs -= deltaMs;
      const dashSpeed = player.moveSpeed * DASH_SPEED_MULTIPLIER;
      player.setVelocity(
        player.dashDirection.x * dashSpeed,
        player.dashDirection.y * dashSpeed,
      );

      if (player.dashTimerMs <= 0) {
        player.dashActive = false;
        player.setVelocity(0, 0);
      }
      return;
    }

    if (
      !input.space ||
      !Phaser.Input.Keyboard.JustDown(input.space) ||
      player.dashCooldownTimer > 0 ||
      player.stamina < player.dashStaminaCost
    ) {
      return;
    }

    if (!player.consumeStamina(player.dashStaminaCost)) return;

    player.startDashCooldown();
    player.dashActive = true;
    player.dashTimerMs = DASH_DURATION_MS;

    const angle = player.rotation;
    player.dashDirection.set(Math.cos(angle), Math.sin(angle));
    this.spawnTrailFx(player);
  }

  private spawnTrailFx(player: Player): void {
    const shadow = player.scene.add
      .sprite(player.x, player.y, "player")
      .setScale(player.scaleX, player.scaleY)
      .setRotation(player.rotation)
      .setAlpha(0.5)
      .setTint(hexToNumber(theme.semantic.fx.dash_trail));

    player.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 300,
      onComplete: () => shadow.destroy(),
    });
  }
}
