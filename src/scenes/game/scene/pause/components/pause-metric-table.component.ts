import { getTheme } from "@data/theme/theme";

import type * as Phaser from "phaser";

const theme = getTheme();

export type PauseMetricTableItem = {
  label: string;
  value: string;
  color?: string;
};

export interface PauseMetricTableOptions {
  container: Phaser.GameObjects.Container;
  x: number;
  y: number;
  width: number;
  items: PauseMetricTableItem[];
  rowGap?: number;
}

export function createPauseMetricTable(
  scene: Phaser.Scene,
  options: PauseMetricTableOptions,
): number {
  const rowGap = options.rowGap ?? 40;
  let maxY = options.y;

  options.items.forEach((item, index) => {
    const rowY = options.y + index * rowGap;
    const label = scene.add.text(options.x, rowY, item.label, {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.xs,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.soft,
    });
    const value = scene.add
      .text(options.x + options.width, rowY, item.value, {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        fontStyle: theme.typography.weights.bold,
        color: item.color ?? theme.semantic.text.primary,
      })
      .setOrigin(1, 0);

    options.container.add([label, value]);
    maxY = Math.max(maxY, rowY + Math.max(label.height, value.height));
  });

  return maxY - options.y;
}
