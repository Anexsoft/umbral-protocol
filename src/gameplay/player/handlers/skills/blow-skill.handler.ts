import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Player } from "@gameplay/player/player";
import type { BlowSkillPayload, SkillInput } from "@gameplay/player/types";

const theme = getTheme();

type BlowSkillHandlerInput = {
  player: Player;
  input: SkillInput;
};

export class BlowSkillHandler {
  constructor(private readonly scene: Phaser.Scene) {}

  handle({ player, input }: BlowSkillHandlerInput): void {
    if (!input.q || !Phaser.Input.Keyboard.JustDown(input.q)) return;
    if (
      player.blowCooldownTimer > 0 ||
      player.stamina < player.blowStaminaCost
    ) {
      return;
    }

    if (!player.consumeStamina(player.blowStaminaCost)) return;

    player.startBlowCooldown();
    this.spawnExplosionFx(player, player.blowRadiusMax);

    const payload: BlowSkillPayload = {
      x: player.x,
      y: player.y,
      radius: player.blowRadiusMax,
      damage: player.blowDamage,
    };

    this.scene.events.emit("skill:blow", payload);
  }

  private spawnExplosionFx(player: Player, radiusMax: number): void {
    const startRadius = Math.max(12, Math.round(radiusMax * 0.18));
    const explosion = this.scene.add
      .circle(
        player.x,
        player.y,
        startRadius,
        hexToNumber(theme.semantic.fx.blow),
        0.6,
      )
      .setDepth(5);

    explosion.setScale(0.2);
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: radiusMax / startRadius,
      duration: 240,
      ease: "Sine.easeOut",
      onComplete: () => explosion.destroy(),
    });
  }
}
