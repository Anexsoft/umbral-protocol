import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Player } from "@gameplay/player/player";

const theme = getTheme();

type AimLaserHandlerInput = { id: "draw"; player: Player } | { id: "destroy" };

export class AimLaserHandler {
  private readonly laser: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.laser = scene.add.graphics().setDepth(10);
  }

  handle(command: AimLaserHandlerInput): void {
    if (command.id === "destroy") {
      this.laser.destroy();
      return;
    }

    const { player } = command;
    this.laser.clear();
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y,
    );
    const angle = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      worldPoint.x,
      worldPoint.y,
    );

    player.setRotation(angle);

    this.laser.lineStyle(4, hexToNumber(theme.semantic.fx.laser), 0.4);
    this.laser.beginPath();
    this.laser.moveTo(player.x, player.y);
    this.laser.lineTo(worldPoint.x, worldPoint.y);
    this.laser.strokePath();
  }
}
