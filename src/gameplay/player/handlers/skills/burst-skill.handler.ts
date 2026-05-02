import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Player } from "@gameplay/player/player";
import type { SkillInput } from "@gameplay/player/types";

const theme = getTheme();

type BurstSkillHandlerInput = {
  player: Player;
  input: SkillInput;
};

export class BurstSkillHandler {
  constructor(private readonly scene: Phaser.Scene) {}

  handle({ player, input }: BurstSkillHandlerInput): void {
    if (!input.e || !Phaser.Input.Keyboard.JustDown(input.e)) return;
    if (
      player.burstCooldownTimer > 0 ||
      player.stamina < player.burstStaminaCost
    ) {
      return;
    }

    if (!player.consumeStamina(player.burstStaminaCost)) return;

    player.startBurstCooldown();
    player.activateBurstMode();
    this.spawnActivationFx(player);
  }

  private spawnActivationFx(player: Player): void {
    const flare = this.scene.add.circle(
      player.x,
      player.y,
      18,
      hexToNumber(theme.semantic.fx.grenade),
      0.22,
    );
    flare.setDepth(6);
    flare.setStrokeStyle(3, hexToNumber(theme.semantic.fx.grenade_burst), 0.9);

    this.scene.tweens.add({
      targets: flare,
      alpha: 0,
      scale: 2.6,
      duration: 240,
      ease: "Sine.easeOut",
      onUpdate: () => {
        flare.setPosition(player.x, player.y);
      },
      onComplete: () => flare.destroy(),
    });
  }
}
