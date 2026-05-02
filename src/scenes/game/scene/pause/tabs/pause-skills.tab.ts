import type { PlayerSkillConfig } from "@data/player/types";
import { getTheme } from "@data/theme/theme";

import {
  createPauseMetricTable,
  type PauseMetricTableItem,
} from "../components/pause-metric-table.component";
import type { PauseTabRenderContext } from "../pause.types";

const theme = getTheme();

function renderSkillMetricColumns(
  context: PauseTabRenderContext,
  container: Phaser.GameObjects.Container,
  x: number,
  y: number,
  width: number,
  items: PauseMetricTableItem[],
): number {
  const columnCount = 3;
  const columnGap = 36;
  const columnWidth = (width - columnGap * (columnCount - 1)) / columnCount;
  const itemsPerColumn = Math.ceil(items.length / columnCount);
  let maxHeight = 0;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const columnItems = items.slice(
      columnIndex * itemsPerColumn,
      (columnIndex + 1) * itemsPerColumn,
    );

    if (columnItems.length === 0) continue;

    const height = createPauseMetricTable(context.scene, {
      container,
      x: x + columnIndex * (columnWidth + columnGap),
      y,
      width: columnWidth,
      items: columnItems,
      rowGap: 34,
    });

    maxHeight = Math.max(maxHeight, height);
  }

  return maxHeight;
}

function buildSkillMetrics(skill: PlayerSkillConfig): PauseMetricTableItem[] {
  const rows: PauseMetricTableItem[] = [
    {
      label: "COOLDOWN",
      value: `${skill.cooldownSec.toFixed(1)}S`,
      color: theme.semantic.text.soft,
    },
    {
      label: "STAMINA",
      value: String(skill.staminaCost),
      color: theme.semantic.text.warning,
    },
  ];

  if (typeof skill.radiusMax === "number")
    rows.push({
      label: "RADIUS",
      value: String(skill.radiusMax),
      color: theme.semantic.text.primary,
    });
  if (typeof skill.damageMultiplier === "number") {
    rows.push({
      label: "POWER",
      value: `x${skill.damageMultiplier.toFixed(2)}`,
      color: theme.semantic.text.emphasis,
    });
  }
  if (typeof skill.moveSpeedBonusRatio === "number") {
    rows.push({
      label: "MOVE",
      value: `+${Math.round(skill.moveSpeedBonusRatio * 100)}%`,
      color: theme.semantic.text.accent_soft,
    });
  }
  if (typeof skill.fireRateBonusRatio === "number") {
    rows.push({
      label: "CADENCE",
      value: `+${Math.round(skill.fireRateBonusRatio * 100)}%`,
      color: theme.semantic.text.accent_soft,
    });
  }
  if (typeof skill.reloadSpeedBonusRatio === "number") {
    rows.push({
      label: "RELOAD",
      value: `+${Math.round(skill.reloadSpeedBonusRatio * 100)}%`,
      color: theme.semantic.text.soft,
    });
  }
  if (typeof skill.durationSec === "number") {
    rows.push({
      label: "DURATION",
      value: `${skill.durationSec.toFixed(1)}S`,
      color: theme.semantic.text.primary,
    });
  }

  return rows;
}

export function renderPauseSkillsTab(context: PauseTabRenderContext): void {
  context.bundle.player.skills.forEach((skill) => {
    context.drawSection(
      `${skill.name.toUpperCase()} [${skill.key}]`,
      (container, width) => {
        const description = context.scene.add.text(
          0,
          0,
          context.formatSkillDescription(skill),
          {
            fontFamily: theme.typography.fonts.mono,
            fontSize: theme.typography.sizes.xs,
            color: theme.semantic.text.strong,
            wordWrap: { width },
            lineSpacing: 6,
            fontStyle: "italic",
          },
        );

        const statusText = context.getSkillStatus(skill.name);
        const metricItems = buildSkillMetrics(skill);

        if (statusText) {
          metricItems.push({
            label: "STATUS",
            value: statusText,
            color: theme.semantic.text.success,
          });
        }

        const metricsHeight = renderSkillMetricColumns(
          context,
          container,
          0,
          description.height + 18,
          width,
          metricItems,
        );

        container.add(description);

        return description.height + 18 + metricsHeight;
      },
    );
  });
}
