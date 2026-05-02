import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

const theme = getTheme();

export type GameIntermissionOverlayInput = {
  scene: Phaser.Scene;
  depth: number;
  secondsRemaining: number;
  onProceed: () => void;
};

export interface GameIntermissionOverlayControls {
  cleanup: () => void;
  skipHandler: () => void;
  timer: Phaser.Time.TimerEvent;
}

export class GameIntermissionOverlay {
  show({
    scene,
    depth,
    secondsRemaining,
    onProceed,
  }: GameIntermissionOverlayInput): GameIntermissionOverlayControls {
    const { width, height } = scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bg = scene.add
      .rectangle(
        cx,
        cy,
        width,
        height,
        hexToNumber(theme.semantic.surface.overlay),
        0.88,
      )
      .setScrollFactor(0)
      .setDepth(depth);

    const heading = scene.add
      .text(cx, cy - 100, "WAVE COMPLETE", {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.display_xl,
        color: theme.palette.danger.crimson,
        fontStyle: theme.typography.weights.bold,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    let remainingSeconds = secondsRemaining;
    const countdown = scene.add
      .text(cx, cy + 10, `Next wave in ${remainingSeconds}s`, {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.xxl,
        color: theme.semantic.text.soft,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    const hint = scene.add
      .text(cx, cy + 52, "[ ENTER - SKIP ]", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        color: theme.semantic.text.accent_scan,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    scene.tweens.add({
      targets: hint,
      alpha: 0.35,
      duration: theme.motion.durations.prompt_ms,
      yoyo: true,
      repeat: -1,
    });

    let intermissionEnded = false;
    const proceedToNextWave = (): void => {
      if (intermissionEnded) return;
      intermissionEnded = true;
      onProceed();
    };

    const timer = scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        remainingSeconds -= 1;
        if (remainingSeconds <= 0) {
          proceedToNextWave();
          return;
        }
        countdown.setText(`Next wave in ${remainingSeconds}s`);
      },
    });

    return {
      cleanup: () => {
        bg.destroy();
        heading.destroy();
        countdown.destroy();
        hint.destroy();
      },
      skipHandler: () => {
        proceedToNextWave();
      },
      timer,
    };
  }
}
