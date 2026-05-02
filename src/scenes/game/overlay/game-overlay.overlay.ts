import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

const theme = getTheme();

type GameOverlayInput =
  | {
      id: "show-round-intro";
      scene: Phaser.Scene;
      depth: number;
      delayMs: number;
      roundDisplay: number;
      onDone: () => void;
    }
  | {
      id: "show-victory";
      scene: Phaser.Scene;
      depth: number;
      onReturnToMainMenu: () => void;
    };

export class GameOverlay {
  show(input: GameOverlayInput): void {
    switch (input.id) {
      case "show-round-intro":
        this.showRoundIntro(input);
        return;
      case "show-victory":
        this.showVictory(input);
        return;
    }
  }

  private showRoundIntro(
    input: Extract<GameOverlayInput, { id: "show-round-intro" }>,
  ): void {
    const { width, height } = input.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bg = input.scene.add
      .rectangle(
        cx,
        cy,
        width,
        height,
        hexToNumber(theme.semantic.surface.scrim),
        0.82,
      )
      .setScrollFactor(0)
      .setDepth(input.depth);

    const title = input.scene.add
      .text(cx, cy - 24, `ROUND ${input.roundDisplay}`, {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.hero_sm,
        color: theme.semantic.text.primary,
        fontStyle: theme.typography.weights.bold,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(input.depth + 1);

    const sub = input.scene.add
      .text(cx, cy + 36, "HOSTILES INBOUND", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        color: theme.semantic.text.label,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(input.depth + 1);

    input.scene.time.delayedCall(input.delayMs, () => {
      bg.destroy();
      title.destroy();
      sub.destroy();
      input.onDone();
    });
  }

  private showVictory(
    input: Extract<GameOverlayInput, { id: "show-victory" }>,
  ): void {
    const { width, height } = input.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    input.scene.add
      .rectangle(
        cx,
        cy,
        width,
        height,
        hexToNumber(theme.semantic.surface.scrim),
        0.9,
      )
      .setScrollFactor(0)
      .setDepth(input.depth);

    input.scene.add
      .text(cx, cy - 40, "ALL WAVES CLEARED", {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.display_2xl,
        color: theme.semantic.text.accent_scan,
        fontStyle: theme.typography.weights.bold,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(input.depth + 1);

    input.scene.add
      .text(cx, cy + 28, "Experiment concluded.", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.lg,
        color: theme.semantic.text.label,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(input.depth + 1);

    const prompt = input.scene.add
      .text(cx, height - 72, "[ ENTER — MAIN MENU ]", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.lg,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.accent_scan,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(input.depth + 1);

    input.scene.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: theme.motion.durations.prompt_ms,
      yoyo: true,
      repeat: -1,
    });

    input.scene.input.keyboard!.once("keydown-ENTER", () => {
      input.onReturnToMainMenu();
    });
  }
}
