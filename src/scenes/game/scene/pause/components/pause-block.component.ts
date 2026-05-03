import { getTheme, hexToNumber } from "@data/theme/theme";

import type { PauseBlockChildren } from "../pause.types";
import type * as Phaser from "phaser";

const theme = getTheme();

const HEADER_TOP_PADDING = 7;
const HEADER_TITLE_GAP = 2;
const HEADER_BOTTOM_PADDING = 8;
const PADDING_X = 22;
const PADDING_Y = 18;

export const PAUSE_BLOCK_GAP = 18;

export interface PauseBlockComponentOptions {
  title: string;
  subtitle?: string;
  description?: string;
  headerRightText?: string;
  headerRightColor?: string;
  y: number;
  x?: number;
  width?: number;
  children: PauseBlockChildren;
}

export interface PauseBlockComponentResult {
  root: Phaser.GameObjects.Container;
  height: number;
}

export function createPauseBlockComponent(
  scene: Phaser.Scene,
  options: PauseBlockComponentOptions,
): PauseBlockComponentResult {
  const marginX = scene.scale.width * 0.05;
  const blockX = options.x ?? marginX;
  const blockWidth = options.width ?? scene.scale.width - marginX * 2;
  const contentWidth = blockWidth - PADDING_X * 2;
  const subtitleText = (options.subtitle ?? options.description)?.trim();
  const root = scene.add.container(blockX, options.y);

  const label = scene.add.text(PADDING_X, HEADER_TOP_PADDING, options.title, {
    fontFamily: theme.typography.fonts.mono,
    fontSize: theme.typography.sizes.md,
    fontStyle: theme.typography.weights.bold,
    color: theme.semantic.text.primary,
    letterSpacing: theme.typography.letter_spacing.wide / 2,
  });
  const headerRight = options.headerRightText
    ? scene.add
        .text(
          blockWidth - PADDING_X,
          HEADER_TOP_PADDING + 1,
          options.headerRightText,
          {
            fontFamily: theme.typography.fonts.mono,
            fontSize: theme.typography.sizes.md,
            fontStyle: theme.typography.weights.bold,
            color: options.headerRightColor ?? theme.semantic.text.accent_scan,
          },
        )
        .setOrigin(1, 0)
    : null;
  const subtitle = subtitleText
    ? scene.add.text(
        PADDING_X,
        HEADER_TOP_PADDING + label.height + HEADER_TITLE_GAP,
        subtitleText,
        {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.xs,
          fontStyle: "italic",
          color: theme.semantic.text.cooldown,
          wordWrap: { width: contentWidth },
        },
      )
    : null;
  const headerHeight = subtitle
    ? subtitle.y + subtitle.height + HEADER_BOTTOM_PADDING
    : 36;
  const content = scene.add.container(PADDING_X, headerHeight + PADDING_Y);

  const contentHeight = options.children(content, contentWidth);
  const totalHeight = headerHeight + PADDING_Y * 2 + contentHeight;

  const body = scene.add
    .rectangle(
      blockWidth / 2,
      totalHeight / 2,
      blockWidth,
      totalHeight,
      hexToNumber(theme.semantic.surface.panel),
      0.84,
    )
    .setOrigin(0.5)
    .setStrokeStyle(1, hexToNumber(theme.semantic.text.accent_scan), 0.12);
  const headerAccent = scene.add
    .rectangle(
      blockWidth / 2,
      headerHeight / 2,
      blockWidth,
      headerHeight,
      hexToNumber(theme.semantic.text.accent_scan),
      0.18,
    )
    .setOrigin(0.5);
  const header = scene.add
    .rectangle(
      blockWidth / 2,
      headerHeight / 2,
      blockWidth,
      headerHeight,
      hexToNumber(theme.semantic.surface.overlay),
      0.96,
    )
    .setOrigin(0.5)
    .setStrokeStyle(1, hexToNumber(theme.semantic.text.accent_scan), 0.22);
  const labelBackground = scene.add
    .rectangle(
      PADDING_X - 10,
      HEADER_TOP_PADDING + label.height / 2 + 1,
      Math.min(contentWidth, 420),
      26,
      hexToNumber(theme.semantic.text.accent_scan),
      0.12,
    )
    .setOrigin(0, 0.5);

  const headerChildren: Phaser.GameObjects.GameObject[] = [
    body,
    headerAccent,
    header,
    labelBackground,
    label,
    content,
  ];

  if (subtitle) {
    headerChildren.splice(headerChildren.length - 1, 0, subtitle);
  }

  if (headerRight) {
    headerChildren.splice(headerChildren.length - 1, 0, headerRight);
  }

  root.add(headerChildren);

  return {
    root,
    height: totalHeight,
  };
}
