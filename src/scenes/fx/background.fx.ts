import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

const theme = getTheme();

export class BackgroundFX {
  private scene: Phaser.Scene;
  private scanline!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createScanline();
  }

  private createScanline(): void {
    const { width, height } = this.scene.scale;
    const scanlineColor = hexToNumber(theme.semantic.fx.scanline);

    this.scanline = this.scene.add
      .rectangle(width / 2, 0, width, 2, scanlineColor, 0.06)
      .setOrigin(0.5, 0)
      .setDepth(1000);

    this.scene.tweens.add({
      targets: this.scanline,
      y: height,
      duration: theme.motion.durations.scanline_ms,
      repeat: -1,
      ease: "Linear",
    });
  }

  public setTint(color: number | string): void {
    this.scanline.setFillStyle(
      typeof color === "number" ? color : hexToNumber(color),
      0.1,
    );
  }
}
