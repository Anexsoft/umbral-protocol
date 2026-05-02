import * as Phaser from "phaser";

import { SceneKey } from "@core/scene-key";

import { getTheme, hexToNumber } from "@data/theme/theme";

import { BackgroundFX } from "@scenes/fx/background.fx";

const theme = getTheme();

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.GameOver);
  }

  create(): void {
    const { width, height } = this.scale;

    new BackgroundFX(this);

    const colWidth = Math.floor(width * 0.6);
    const colHeight = Math.floor(height * 0.45);
    const x = (width - colWidth) / 2;
    const y = (height - colHeight) / 2;

    this.add
      .rectangle(
        width / 2,
        height / 2,
        colWidth,
        colHeight,
        hexToNumber(theme.semantic.surface.panel),
        0.8,
      )
      .setStrokeStyle(2, hexToNumber(theme.semantic.text.accent_scan), 0.4);

    const cL = 20;
    const cC = hexToNumber(theme.semantic.text.accent_scan);
    const cornerConfig = [
      [x, y, cL, 0],
      [x, y, 0, cL],
      [x + colWidth, y, -cL, 0],
      [x + colWidth, y, 0, cL],
      [x, y + colHeight, cL, 0],
      [x, y + colHeight, 0, -cL],
      [x + colWidth, y + colHeight, -cL, 0],
      [x + colWidth, y + colHeight, 0, -cL],
    ];
    cornerConfig.forEach((c) =>
      this.add.line(c[0], c[1], 0, 0, c[2], c[3], cC, 1).setOrigin(0),
    );

    const title = this.add
      .text(width / 2, height / 2 - 40, "GAME OVER", {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.hero,
        color: theme.semantic.text.primary,
        fontStyle: theme.typography.weights.bold,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, theme.semantic.fx.damage_popup_fill, 15, true, true);

    const status = this.add
      .text(width / 2, height / 2 + 40, ">> SIGNAL LOST / EXPERIMENT FAILED", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.lg,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.danger,
      })
      .setOrigin(0.5);

    const subtext = this.add
      .text(
        width / 2,
        height / 2 + 75,
        "SUBJECT UNRESPONSIVE... TERMINATING LINK",
        {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.sm,
          color: theme.semantic.text.accent_scan,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0.6);

    const prompt = this.add
      .text(width / 2, height - 80, "[ RE-INITIALIZE SYSTEM - PRESS SPACE ]", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.accent_scan,
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 150,
      callback: () => {
        if (Math.random() > 0.85) {
          const originalText = "GAME OVER";
          const scrambled = originalText
            .split("")
            .map((char) =>
              Math.random() > 0.7
                ? String.fromCharCode(33 + Math.floor(Math.random() * 26))
                : char,
            )
            .join("");

          title.setText(scrambled);
          title.setAlpha(0.3 + Math.random() * 0.7);
          title.x = width / 2 + (Math.random() * 10 - 5);

          this.time.delayedCall(100, () => {
            title.setText(originalText);
            title.setAlpha(1);
            title.x = width / 2;
          });
        }
      },
      loop: true,
    });

    this.tweens.add({
      targets: title,
      alpha: 0,
      duration: 4000,
      ease: "Cubic.easeIn",
      delay: 1000,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: theme.motion.durations.long_ms,
      yoyo: true,
      repeat: -1,
    });

    const returnToMainMenu = (): void => {
      this.scene.start(SceneKey.MainMenu);
    };

    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    spaceKey?.reset();
    spaceKey?.once("down", returnToMainMenu);
  }
}
