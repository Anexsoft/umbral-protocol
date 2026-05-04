import { getTheme } from "@data/theme/theme";

import {
  createPauseMetricTable,
  type PauseMetricTableItem,
} from "../components/pause-metric-table.component";
import type { PauseTabRenderContext } from "../pause.types";

const theme = getTheme();

export function renderPauseSummaryTab(context: PauseTabRenderContext): void {
  const currentRound = Number(
    context.scene.game.registry.get("match:round") ?? 1,
  );
  const hostiles = Number(
    context.scene.game.registry.get("match:hostiles") ?? 0,
  );
  const currentDamage = context.player.damage;
  const progressPct = Math.round(context.player.xpBarProgress * 100);

  context.drawSection(
    "SECTION_01: BIO-DATA & MISSION STATUS",
    (container, width) => {
      const columnGap = 36;
      const columnWidth = (width - columnGap * 2) / 3;
      const operatorHeight = createPauseMetricTable(context.scene, {
        container,
        x: 0,
        y: 0,
        width: columnWidth,
        items: [
          {
            label: "OPERATOR",
            value: context.player.playerName.toUpperCase(),
            color: theme.semantic.text.primary,
          },
          {
            label: "LEVEL",
            value: `LVL_${context.player.lvl}`,
            color: theme.semantic.text.accent_scan,
          },
          {
            label: "XP_TOTAL",
            value: String(context.player.totalXp),
            color: theme.semantic.text.soft,
          },
        ],
      });
      const resourceHeight = createPauseMetricTable(context.scene, {
        container,
        x: columnWidth + columnGap,
        y: 0,
        width: columnWidth,
        items: [
          {
            label: "VITALITY",
            value: `${Math.round(context.player.health)}/${Math.round(context.player.maxHealth)}`,
            color: theme.semantic.text.danger,
          },
          {
            label: "STAMINA",
            value: `${Math.round(context.player.stamina)}/${Math.round(context.player.maxStamina)}`,
            color: theme.semantic.text.warning,
          },
          {
            label: "MOVE_SPEED",
            value: `${Math.round(context.player.moveSpeed)}`,
            color: theme.semantic.text.accent_soft,
          },
        ],
      });
      const combatHeight = createPauseMetricTable(context.scene, {
        container,
        x: (columnWidth + columnGap) * 2,
        y: 0,
        width: columnWidth,
        items: [
          {
            label: "DAMAGE_STAT",
            value: String(currentDamage),
            color: theme.semantic.text.emphasis,
          },
          {
            label: "CREDITS",
            value: String(context.player.credits),
            color: theme.semantic.text.success,
          },
          {
            label: "XP_PROGRESS",
            value: `${progressPct}%`,
            color: theme.semantic.text.primary,
          },
        ],
      });

      return Math.max(operatorHeight, resourceHeight, combatHeight);
    },
  );

  context.drawSection("SECTION_02: COMBAT TELEMETRY", (container, width) => {
    const columnGap = 36;
    const columnWidth = (width - columnGap * 2) / 3;
    const roundHeight = createPauseMetricTable(context.scene, {
      container,
      x: 0,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "CURRENT_ROUND",
          value: `R-${currentRound.toString().padStart(2, "0")}`,
          color: theme.semantic.text.primary,
        },
        {
          label: "HOSTILES_PENDING",
          value: String(hostiles),
          color: theme.semantic.text.emphasis,
        },
        {
          label: "MATCH_STATUS",
          value: hostiles > 0 ? "ENGAGED" : "CLEARED",
          color:
            hostiles > 0
              ? theme.semantic.text.accent_scan
              : theme.semantic.text.success,
        },
      ],
    });
    const combatHeight = createPauseMetricTable(context.scene, {
      container,
      x: columnWidth + columnGap,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "ELIMINATED",
          value: String(context.player.enemiesDefeated),
          color: theme.semantic.text.success,
        },
        {
          label: "XP_PROGRESS",
          value: `${progressPct}%`,
          color: theme.semantic.text.accent_soft,
        },
        {
          label: "XP_REMAINING",
          value: String(context.player.xpRemainingToNextLevel),
          color: theme.semantic.text.soft,
        },
      ],
    });

    return Math.max(roundHeight, combatHeight);
  });

  context.drawSection("SECTION_03: LOADOUT", (container, width) => {
    const columnGap = 36;
    const columnWidth = (width - columnGap * 2) / 3;
    const primaryHeight = createPauseMetricTable(context.scene, {
      container,
      x: 0,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "PRIMARY",
          value: context.bundle.primaryWeapon.name,
          color: theme.semantic.text.accent_scan,
        },
        {
          label: "DAMAGE",
          value: String(currentDamage),
          color: theme.semantic.text.emphasis,
        },
      ],
    });
    const modeHeight = createPauseMetricTable(context.scene, {
      container,
      x: columnWidth + columnGap,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "MODE",
          value: String(context.player.primaryWeapon.currentMode).toUpperCase(),
          color: context.getModeColor(context.player.primaryWeapon.currentMode),
        },
        {
          label: "AMMO_STATE",
          value: `${context.player.primaryWeapon.ammo}/${context.player.primaryWeapon.maxAmmo}`,
          color: theme.semantic.text.primary,
        },
      ],
    });
    const secondaryHeight = createPauseMetricTable(context.scene, {
      container,
      x: (columnWidth + columnGap) * 2,
      y: 0,
      width: columnWidth,
      items: [
        {
          label: "SECONDARY",
          value: context.bundle.secondaryWeapon.name,
          color: theme.semantic.text.primary,
        },
        {
          label: "DAMAGE",
          value: String(
            context.player.scaleDamage(
              1 + context.bundle.secondaryWeapon.damage_bonus_ratio,
            ),
          ),
          color: theme.semantic.text.emphasis,
        },
      ],
    });

    return Math.max(primaryHeight, modeHeight, secondaryHeight);
  });
}
