import { getTheme, hexToNumber } from "@data/theme/theme";

import type { PauseTabRenderContext } from "../pause.types";

const theme = getTheme();

const COLUMN_GAP = 28;
const ENTRY_GAP = 18;
const ENTRY_PADDING_X = 16;
const ENTRY_PADDING_Y = 14;
const BUTTON_SIZE = 42;

type UpgradeEntryData = {
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  nextCost: number;
  currentValues: string[];
  accentColor: string;
  canPurchase: boolean;
  purchase: () => boolean;
};

function formatCredits(value: number): string {
  return Math.max(0, Math.round(value)).toString().padStart(5, "0");
}

function formatCost(value: number): string {
  return Math.max(0, Math.round(value)).toString().padStart(4, "0");
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function createUpgradeButton(
  context: PauseTabRenderContext,
  container: Phaser.GameObjects.Container,
  x: number,
  y: number,
  accentColor: string,
  nextCost: number,
  enabled: boolean,
  onPurchase: () => void,
): number {
  const costText = context.scene.add
    .text(x, y + 10, formatCost(nextCost), {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.md,
      fontStyle: theme.typography.weights.bold,
      color: enabled
        ? theme.semantic.text.success
        : theme.semantic.text.cooldown,
    })
    .setAlpha(enabled ? 1 : 0.45);
  const buttonX = x + costText.width + 12;
  const background = context.scene.add
    .rectangle(
      buttonX,
      y,
      BUTTON_SIZE,
      BUTTON_SIZE,
      hexToNumber(theme.semantic.surface.overlay),
      enabled ? 0.96 : 0.45,
    )
    .setOrigin(0)
    .setStrokeStyle(
      1,
      hexToNumber(enabled ? accentColor : theme.semantic.text.separator),
      enabled ? 0.55 : 0.35,
    );
  const label = context.scene.add
    .text(buttonX + BUTTON_SIZE / 2, y + BUTTON_SIZE / 2, "+", {
      fontFamily: theme.typography.fonts.display,
      fontSize: theme.typography.sizes.display_md,
      fontStyle: theme.typography.weights.bold,
      color: enabled ? accentColor : theme.semantic.text.cooldown,
    })
    .setOrigin(0.5)
    .setAlpha(enabled ? 1 : 0.45);

  if (enabled) {
    background
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onPurchase);
  }

  container.add([costText, background, label]);
  return costText.width + 12 + BUTTON_SIZE;
}

function splitCurrentValues(values: string[]): [string[], string[]] {
  if (values.length <= 2) return [values, []];

  const firstColumnCount = Math.ceil(values.length / 2);
  return [values.slice(0, firstColumnCount), values.slice(firstColumnCount)];
}

function renderUpgradeEntry(
  context: PauseTabRenderContext,
  container: Phaser.GameObjects.Container,
  x: number,
  y: number,
  width: number,
  entry: UpgradeEntryData,
): number {
  const root = context.scene.add.container(x, y);
  container.add(root);

  const col1Width = width * 0.34;
  const col2Width = width * 0.19;
  const col3Width = width * 0.19;
  const col4Width = width * 0.1;
  const col5Width = width - col1Width - col2Width - col3Width - col4Width;
  const col2X = ENTRY_PADDING_X + col1Width;
  const col3X = ENTRY_PADDING_X + col1Width + col2Width;
  const col4X = ENTRY_PADDING_X + col1Width + col2Width + col3Width;
  const col5X = ENTRY_PADDING_X + col1Width + col2Width + col3Width + col4Width;
  const canAfford = context.player.credits >= entry.nextCost;
  const canPurchase = entry.canPurchase && canAfford;
  const [valueColumnOne, valueColumnTwo] = splitCurrentValues(
    entry.currentValues,
  );

  const nameText = context.scene.add.text(
    ENTRY_PADDING_X,
    ENTRY_PADDING_Y,
    entry.name,
    {
      fontFamily: theme.typography.fonts.display,
      fontSize: theme.typography.sizes.lg,
      fontStyle: theme.typography.weights.bold,
      color: entry.accentColor,
    },
  );
  const descriptionText = context.scene.add.text(
    ENTRY_PADDING_X,
    ENTRY_PADDING_Y + nameText.height + 6,
    entry.description,
    {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.xs,
      color: theme.semantic.text.strong,
      wordWrap: { width: col1Width - ENTRY_PADDING_X * 1.25 },
      lineSpacing: 4,
    },
  );

  const currentValuesColumnOne = context.scene.add.text(
    col2X,
    ENTRY_PADDING_Y + 2,
    valueColumnOne.join("\n"),
    {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.sm,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.primary,
      wordWrap: { width: col2Width - ENTRY_PADDING_X },
      lineSpacing: 5,
    },
  );
  const currentValuesColumnTwo = context.scene.add.text(
    col3X,
    ENTRY_PADDING_Y + 2,
    valueColumnTwo.join("\n"),
    {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.sm,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.primary,
      wordWrap: { width: col3Width - ENTRY_PADDING_X },
      lineSpacing: 5,
    },
  );

  const levelValue = context.scene.add
    .text(
      col4X + col4Width / 2,
      ENTRY_PADDING_Y + 8,
      `${entry.level}/${entry.maxLevel}`,
      {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.display_lg,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.primary,
      },
    )
    .setOrigin(0.5, 0);
  const buttonSpan = createUpgradeButton(
    context,
    root,
    col5X + Math.max(0, (col5Width - 90) / 2),
    ENTRY_PADDING_Y + 10,
    entry.accentColor,
    entry.nextCost,
    canPurchase,
    () => {
      if (!entry.purchase()) return;
      context.refreshTab();
    },
  );

  const height =
    Math.max(
      descriptionText.y + descriptionText.height,
      currentValuesColumnOne.y + currentValuesColumnOne.height,
      currentValuesColumnTwo.y + currentValuesColumnTwo.height,
      levelValue.y + levelValue.height,
      ENTRY_PADDING_Y + Math.max(BUTTON_SIZE, buttonSpan > 0 ? BUTTON_SIZE : 0),
    ) + ENTRY_PADDING_Y;
  const background = context.scene.add
    .rectangle(
      width / 2,
      height / 2,
      width,
      height,
      hexToNumber(theme.semantic.surface.panel_elevated),
      0.78,
    )
    .setOrigin(0.5)
    .setStrokeStyle(1, hexToNumber(entry.accentColor), 0.18);
  const accent = context.scene.add
    .rectangle(0, 0, 4, height, hexToNumber(entry.accentColor), 0.92)
    .setOrigin(0);

  root.add([
    background,
    accent,
    nameText,
    descriptionText,
    currentValuesColumnOne,
    currentValuesColumnTwo,
    levelValue,
  ]);
  root.sendToBack(background);
  root.sendToBack(accent);

  return height;
}

function renderUpgradeColumn(
  context: PauseTabRenderContext,
  container: Phaser.GameObjects.Container,
  x: number,
  y: number,
  width: number,
  title: string,
  accentColor: string,
  entries: UpgradeEntryData[],
): number {
  const titleText = context.scene.add.text(x, y, title, {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.display_sm,
    fontStyle: theme.typography.weights.bold,
    color: accentColor,
  });
  const rule = context.scene.add
    .rectangle(
      x,
      y + titleText.height + 10,
      width,
      2,
      hexToNumber(accentColor),
      0.5,
    )
    .setOrigin(0, 0);
  container.add([titleText, rule]);

  let cursorY = y + titleText.height + 24;
  entries.forEach((entry) => {
    const entryHeight = renderUpgradeEntry(
      context,
      container,
      x,
      cursorY,
      width,
      entry,
    );
    cursorY += entryHeight + ENTRY_GAP;
  });

  return cursorY - y - ENTRY_GAP;
}

export function renderPauseUpgradesTab(context: PauseTabRenderContext): void {
  context.drawSection(
    {
      title: "AVAILABLE UPGRADES",
      headerRightText: formatCredits(context.player.credits),
      headerRightColor: theme.semantic.text.success,
    },
    (container, width) => {
      const columnWidth = (width - COLUMN_GAP) / 2;
      const primaryEntries: UpgradeEntryData[] = [
        {
          name: context.player.primaryWeapon.improvementConfig.extended_magazine.name.toUpperCase(),
          description:
            context.player.primaryWeapon.improvementConfig.extended_magazine
              .description ?? "",
          level: context.player.primaryWeapon.improvements.extendedMagazine,
          maxLevel:
            context.player.primaryWeapon.improvementConfig.extended_magazine
              .max_level,
          nextCost:
            context.player.primaryWeapon.getNextImprovementCost(
              "extendedMagazine",
            ),
          accentColor: theme.semantic.text.primary,
          canPurchase:
            context.player.primaryWeapon.canUpgradeImprovement(
              "extendedMagazine",
            ),
          purchase: () => {
            const cost =
              context.player.primaryWeapon.getNextImprovementCost(
                "extendedMagazine",
              );
            if (
              !context.player.primaryWeapon.canUpgradeImprovement(
                "extendedMagazine",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.primaryWeapon.upgradeImprovement(
              "extendedMagazine",
            );
          },
          currentValues: [
            `AMMO_BONUS +${context.player.primaryWeapon.improvements.extendedMagazine * context.player.primaryWeapon.improvementConfig.extended_magazine.ammo_bonus_per_level}`,
            `MAX_AMMO ${context.player.primaryWeapon.maxAmmo}`,
          ],
        },
        {
          name: context.player.primaryWeapon.improvementConfig.reload_optimization.name.toUpperCase(),
          description:
            context.player.primaryWeapon.improvementConfig.reload_optimization
              .description ?? "",
          level: context.player.primaryWeapon.improvements.reloadOptimization,
          maxLevel:
            context.player.primaryWeapon.improvementConfig.reload_optimization
              .max_level,
          nextCost:
            context.player.primaryWeapon.getNextImprovementCost(
              "reloadOptimization",
            ),
          accentColor: theme.semantic.text.accent_scan,
          canPurchase:
            context.player.primaryWeapon.canUpgradeImprovement(
              "reloadOptimization",
            ),
          purchase: () => {
            const cost =
              context.player.primaryWeapon.getNextImprovementCost(
                "reloadOptimization",
              );
            if (
              !context.player.primaryWeapon.canUpgradeImprovement(
                "reloadOptimization",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.primaryWeapon.upgradeImprovement(
              "reloadOptimization",
            );
          },
          currentValues: [
            `RELOAD_REDUCTION -${formatPercent(context.player.primaryWeapon.improvements.reloadOptimization * context.player.primaryWeapon.improvementConfig.reload_optimization.reload_time_reduction_ratio_per_level)}`,
            `RELOAD_TIME ${context.player.primaryWeapon.modes[context.player.primaryWeapon.currentMode].reload_time.toFixed(2)}S`,
          ],
        },
        {
          name: context.player.primaryWeapon.improvementConfig.fire_rate_optimization.name.toUpperCase(),
          description:
            context.player.primaryWeapon.improvementConfig
              .fire_rate_optimization.description ?? "",
          level: context.player.primaryWeapon.improvements.fireRateOptimization,
          maxLevel:
            context.player.primaryWeapon.improvementConfig
              .fire_rate_optimization.max_level,
          nextCost: context.player.primaryWeapon.getNextImprovementCost(
            "fireRateOptimization",
          ),
          accentColor: theme.semantic.text.emphasis,
          canPurchase: context.player.primaryWeapon.canUpgradeImprovement(
            "fireRateOptimization",
          ),
          purchase: () => {
            const cost = context.player.primaryWeapon.getNextImprovementCost(
              "fireRateOptimization",
            );
            if (
              !context.player.primaryWeapon.canUpgradeImprovement(
                "fireRateOptimization",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.primaryWeapon.upgradeImprovement(
              "fireRateOptimization",
            );
          },
          currentValues: [
            `FIRE_RATE_REDUCTION -${formatPercent(context.player.primaryWeapon.improvements.fireRateOptimization * context.player.primaryWeapon.improvementConfig.fire_rate_optimization.fire_rate_reduction_ratio_per_level)}`,
            `SHOT_INTERVAL ${(context.player.primaryWeapon.modes[context.player.primaryWeapon.currentMode].fire_rate * context.player.primaryWeapon.getFireRateIntervalMultiplier()).toFixed(2)}S`,
          ],
        },
        {
          name: context.player.primaryWeapon.improvementConfig.critical_protocol.name.toUpperCase(),
          description:
            context.player.primaryWeapon.improvementConfig.critical_protocol
              .description ?? "",
          level: context.player.primaryWeapon.improvements.criticalProtocol,
          maxLevel:
            context.player.primaryWeapon.improvementConfig.critical_protocol
              .max_level,
          nextCost:
            context.player.primaryWeapon.getNextImprovementCost(
              "criticalProtocol",
            ),
          accentColor: theme.semantic.text.warning,
          canPurchase:
            context.player.primaryWeapon.canUpgradeImprovement(
              "criticalProtocol",
            ),
          purchase: () => {
            const cost =
              context.player.primaryWeapon.getNextImprovementCost(
                "criticalProtocol",
              );
            if (
              !context.player.primaryWeapon.canUpgradeImprovement(
                "criticalProtocol",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.primaryWeapon.upgradeImprovement(
              "criticalProtocol",
            );
          },
          currentValues: [
            `CRIT_CHANCE ${Math.round(context.player.primaryWeapon.improvements.criticalProtocol * context.player.primaryWeapon.improvementConfig.critical_protocol.crit_chance_ratio_per_level * 100)}%`,
            `CRIT_DAMAGE x${context.player.primaryWeapon.improvementConfig.critical_protocol.crit_damage_multiplier.toFixed(2)}`,
          ],
        },
        {
          name: context.player.primaryWeapon.improvementConfig.mode_improvement.name.toUpperCase(),
          description:
            context.player.primaryWeapon.improvementConfig.mode_improvement
              .description ?? "",
          level: context.player.primaryWeapon.improvements.modeImprovement,
          maxLevel:
            context.player.primaryWeapon.improvementConfig.mode_improvement
              .max_level,
          nextCost:
            context.player.primaryWeapon.getNextImprovementCost(
              "modeImprovement",
            ),
          accentColor: theme.semantic.text.accent_soft,
          canPurchase:
            context.player.primaryWeapon.canUpgradeImprovement(
              "modeImprovement",
            ),
          purchase: () => {
            const cost =
              context.player.primaryWeapon.getNextImprovementCost(
                "modeImprovement",
              );
            if (
              !context.player.primaryWeapon.canUpgradeImprovement(
                "modeImprovement",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.primaryWeapon.upgradeImprovement(
              "modeImprovement",
            );
          },
          currentValues: [
            `SINGLE_RATE -${formatPercent(context.player.primaryWeapon.improvements.modeImprovement * context.player.primaryWeapon.improvementConfig.mode_improvement.single.fire_rate_reduction_ratio_per_level)}`,
            `SPREAD_PELLETS +${Math.floor(context.player.primaryWeapon.improvements.modeImprovement / Math.max(1, context.player.primaryWeapon.improvementConfig.mode_improvement.spread.bonus_pellets_every_levels))}`,
            `SPREAD_DAMAGE +${formatPercent(context.player.primaryWeapon.improvements.modeImprovement * context.player.primaryWeapon.improvementConfig.mode_improvement.spread.spread_damage_multiplier_bonus_per_level)}`,
            `POWER_DAMAGE +${formatPercent(context.player.primaryWeapon.improvements.modeImprovement * context.player.primaryWeapon.improvementConfig.mode_improvement.power.damage_multiplier_bonus_per_level)}`,
          ],
        },
      ];
      const knifeEntries: UpgradeEntryData[] = [
        {
          name: context.player.secondaryWeapon.improvementConfig.knife_enhancement.name.toUpperCase(),
          description:
            context.player.secondaryWeapon.improvementConfig.knife_enhancement
              .description ?? "",
          level: context.player.secondaryWeapon.improvements.knifeEnhancement,
          maxLevel:
            context.player.secondaryWeapon.improvementConfig.knife_enhancement
              .max_level,
          nextCost:
            context.player.secondaryWeapon.getNextImprovementCost(
              "knifeEnhancement",
            ),
          accentColor: theme.semantic.text.emphasis,
          canPurchase:
            context.player.secondaryWeapon.canUpgradeImprovement(
              "knifeEnhancement",
            ),
          purchase: () => {
            const cost =
              context.player.secondaryWeapon.getNextImprovementCost(
                "knifeEnhancement",
              );
            if (
              !context.player.secondaryWeapon.canUpgradeImprovement(
                "knifeEnhancement",
              )
            )
              return false;
            if (!context.player.spendCredits(cost)) return false;
            return context.player.secondaryWeapon.upgradeImprovement(
              "knifeEnhancement",
            );
          },
          currentValues: [
            `DAMAGE_RATIO +${formatPercent(context.player.secondaryWeapon.improvements.knifeEnhancement * context.player.secondaryWeapon.improvementConfig.knife_enhancement.damage_bonus_ratio_per_level)}`,
            `ATTACK_RADIUS +${context.player.secondaryWeapon.improvements.knifeEnhancement * context.player.secondaryWeapon.improvementConfig.knife_enhancement.attack_radius_bonus_per_level}`,
          ],
        },
      ];

      const primaryHeight = renderUpgradeColumn(
        context,
        container,
        0,
        0,
        columnWidth,
        context.bundle.primaryWeapon.name.toUpperCase(),
        theme.semantic.text.accent_scan,
        primaryEntries,
      );
      const knifeHeight = renderUpgradeColumn(
        context,
        container,
        columnWidth + COLUMN_GAP,
        0,
        columnWidth,
        context.bundle.secondaryWeapon.name.toUpperCase(),
        theme.semantic.text.emphasis,
        knifeEntries,
      );

      return Math.max(primaryHeight, knifeHeight);
    },
  );
}
