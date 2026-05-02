import { getTheme } from "@data/theme/theme";

import {
  createPauseMetricTable,
  type PauseMetricTableItem,
} from "../components/pause-metric-table.component";
import type { PauseTabRenderContext } from "../pause.types";

const theme = getTheme();

type FireModeMetricSource = {
  fire_rate?: number;
  reload_time?: number;
  damage_multiplier?: number;
  spread_damage_multiplier?: number;
  spread_count?: number;
};

function buildPrimarySystemMetrics(
  context: PauseTabRenderContext,
): PauseMetricTableItem[] {
  return [
    {
      label: "AMMO",
      value: `${context.player.primaryWeapon.ammo}/${context.player.primaryWeapon.maxAmmo}`,
      color: theme.semantic.text.primary,
    },
    {
      label: "PLAYER_DAMAGE",
      value: String(context.player.damage),
      color: theme.semantic.text.emphasis,
    },
    {
      label: "CURRENT_MODE",
      value: String(context.player.primaryWeapon.currentMode).toUpperCase(),
      color: context.getModeColor(context.player.primaryWeapon.currentMode),
    },
  ];
}

function buildFireModeMetrics(
  key: string,
  mode: FireModeMetricSource,
): PauseMetricTableItem[] {
  let detailLabel = "DAMAGE";
  let detailValue = "x1.00";
  let detailColor = theme.semantic.text.primary;

  if (key === "spread") {
    detailLabel = "PELLETS";
    detailValue = String(mode.spread_count ?? 0);
    detailColor = theme.semantic.text.emphasis;
  } else if (typeof mode.damage_multiplier === "number") {
    detailValue = `x${mode.damage_multiplier.toFixed(2)}`;
    detailColor = theme.semantic.text.emphasis;
  } else if (typeof mode.spread_damage_multiplier === "number") {
    detailValue = `x${mode.spread_damage_multiplier.toFixed(2)}`;
    detailColor = theme.semantic.text.emphasis;
  }

  return [
    {
      label: "FIRE_RATE",
      value: `${(Number(mode.fire_rate) || 0).toFixed(2)}S`,
      color: theme.semantic.text.soft,
    },
    {
      label: detailLabel,
      value: detailValue,
      color: detailColor,
    },
  ];
}

export function renderPauseWeaponTab(context: PauseTabRenderContext): void {
  context.drawSection("SECTION_01: PRIMARY WEAPON", (container, width) => {
    const columnGap = 36;
    const columnWidth = (width - columnGap * 2) / 3;
    const currentModeStats =
      context.player.primaryWeapon.modes[
        context.player.primaryWeapon.currentMode
      ];

    const primaryHeader = context.scene.add.text(
      0,
      0,
      context.bundle.primaryWeapon.name,
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.accent_soft,
      },
    );
    const primaryDescription = context.scene.add.text(
      0,
      28,
      context.bundle.primaryWeapon.description ?? "",
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.xs,
        color: theme.semantic.text.strong,
        wordWrap: { width: columnWidth },
        lineSpacing: 6,
      },
    );
    const primaryMetricsHeight = createPauseMetricTable(context.scene, {
      container,
      x: columnWidth + columnGap,
      y: 0,
      width: columnWidth,
      items: buildPrimarySystemMetrics(context),
      rowGap: 34,
    });

    const reloadMetricsHeight = createPauseMetricTable(context.scene, {
      container,
      x: (columnWidth + columnGap) * 2,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "MAX_AMMO",
          value: String(context.player.primaryWeapon.maxAmmo),
          color: theme.semantic.text.primary,
        },
        {
          label: "RELOAD_TIME",
          value: `${currentModeStats.reload_time.toFixed(2)}S`,
          color: theme.semantic.text.soft,
        },
      ],
      rowGap: 34,
    });

    container.add([primaryHeader, primaryDescription]);

    return Math.max(
      primaryDescription.height + 28,
      primaryMetricsHeight,
      reloadMetricsHeight,
    );
  });

  context.drawSection("SECTION_02: FIRE MODES", (container, width) => {
    const columnGap = 36;
    const columnWidth = (width - columnGap * 2) / 3;
    let maxHeight = 0;

    Object.entries(context.bundle.primaryWeapon.modes).forEach(
      ([key, mode], index) => {
        const columnX = index * (columnWidth + columnGap);
        const isCurrent = key === context.player.primaryWeapon.currentMode;
        const modeLabel = context.scene.add.text(
          columnX,
          0,
          `${isCurrent ? "> " : ""}${mode.label}`,
          {
            fontFamily: theme.typography.fonts.mono,
            fontSize: theme.typography.sizes.md,
            fontStyle: theme.typography.weights.bold,
            color: isCurrent
              ? context.getModeColor(key)
              : theme.semantic.text.cooldown,
          },
        );
        const modeDescription = context.scene.add.text(
          columnX,
          28,
          mode.description ?? "",
          {
            fontFamily: theme.typography.fonts.mono,
            fontSize: theme.typography.sizes.xs,
            color: theme.semantic.text.cooldown,
            wordWrap: { width: columnWidth },
            lineSpacing: 5,
          },
        );
        const modeMetricsHeight = createPauseMetricTable(context.scene, {
          container,
          x: columnX,
          y: modeDescription.height + 44,
          width: columnWidth,
          items: buildFireModeMetrics(key, mode),
          rowGap: 28,
        });

        container.add([modeLabel, modeDescription]);
        maxHeight = Math.max(
          maxHeight,
          modeDescription.height + 44 + modeMetricsHeight,
        );
      },
    );

    return maxHeight;
  });

  context.drawSection("SECTION_03: SECONDARY WEAPON", (container, width) => {
    const columnGap = 36;
    const columnWidth = (width - columnGap * 2) / 3;

    const secondaryHeader = context.scene.add.text(
      0,
      0,
      context.bundle.secondaryWeapon.name,
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.accent_soft,
      },
    );
    const secondaryDescription = context.scene.add.text(
      0,
      28,
      context.bundle.secondaryWeapon.description ?? "",
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.xs,
        color: theme.semantic.text.strong,
        wordWrap: { width: columnWidth },
        lineSpacing: 6,
      },
    );
    const secondaryMetricsHeight = createPauseMetricTable(context.scene, {
      container,
      x: columnWidth + columnGap,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "DAMAGE",
          value: String(
            context.player.scaleDamage(
              1 + context.bundle.secondaryWeapon.damage_bonus_ratio,
            ),
          ),
          color: theme.semantic.text.emphasis,
        },
        {
          label: "STAMINA",
          value: String(context.bundle.secondaryWeapon.stamina_cost),
          color: theme.semantic.text.warning,
        },
      ],
      rowGap: 34,
    });

    const secondaryAuxHeight = createPauseMetricTable(context.scene, {
      container,
      x: (columnWidth + columnGap) * 2,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "BONUS",
          value: `+${Math.round(context.bundle.secondaryWeapon.damage_bonus_ratio * 100)}%`,
          color: theme.semantic.text.accent_scan,
        },
        {
          label: "COOLDOWN",
          value: `${context.bundle.secondaryWeapon.cooldown.toFixed(1)}S`,
          color: theme.semantic.text.soft,
        },
      ],
      rowGap: 34,
    });

    container.add([secondaryHeader, secondaryDescription]);

    return Math.max(
      secondaryDescription.height + 28,
      secondaryMetricsHeight,
      secondaryAuxHeight,
    );
  });
}
