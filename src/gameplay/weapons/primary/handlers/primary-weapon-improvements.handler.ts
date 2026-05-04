import type { PrimaryWeaponUpgradeYaml } from "@data/weapons/primary/types";

import type { PrimaryWeaponDamageRoll } from "@gameplay/weapons/primary/primary-weapon";
import {
  PrimaryWeaponMode,
  type PrimaryWeaponImprovementKey,
  type PrimaryWeaponImprovements,
  type WeaponModeConfig,
} from "@gameplay/weapons/primary/types";

export class PrimaryWeaponImprovementsHandler {
  private getUpgradeProgress(level: number, maxLevel: number): number {
    if (maxLevel <= 0) return 0;
    return Math.max(0, Math.min(1, level / maxLevel));
  }

  createInitialLevels(): PrimaryWeaponImprovements {
    return {
      extendedMagazine: 0,
      reloadOptimization: 0,
      fireRateOptimization: 0,
      criticalProtocol: 0,
      modeImprovement: 0,
    };
  }

  upgrade(
    key: PrimaryWeaponImprovementKey,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): boolean {
    if (!this.canUpgrade(key, levels, upgrades)) return false;
    levels[key] += 1;
    return true;
  }

  canUpgrade(
    key: PrimaryWeaponImprovementKey,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): boolean {
    return levels[key] < this.getMaxLevel(key, upgrades);
  }

  getMaxLevel(
    key: PrimaryWeaponImprovementKey,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): number {
    switch (key) {
      case "extendedMagazine":
        return upgrades.extended_magazine.max_level;
      case "reloadOptimization":
        return upgrades.reload_optimization.max_level;
      case "fireRateOptimization":
        return upgrades.fire_rate_optimization.max_level;
      case "criticalProtocol":
        return upgrades.critical_protocol.max_level;
      case "modeImprovement":
        return upgrades.mode_improvement.max_level;
    }
  }

  getNextLevelCost(
    key: PrimaryWeaponImprovementKey,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): number {
    const config = this.getProgressionConfig(key, upgrades);
    const level = levels[key];
    return Math.round(
      config.base_cost * Math.pow(config.next_level_cost_multiplier, level),
    );
  }

  getMaxAmmo(
    baseMagazineCapacity: number,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): number {
    const progress = this.getUpgradeProgress(
      levels.extendedMagazine,
      upgrades.extended_magazine.max_level,
    );

    return (
      baseMagazineCapacity +
      Math.round(upgrades.extended_magazine.ammo_bonus_max_level * progress)
    );
  }

  getReloadTimeMultiplier(
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): number {
    const progress = this.getUpgradeProgress(
      levels.reloadOptimization,
      upgrades.reload_optimization.max_level,
    );
    const reduction =
      upgrades.reload_optimization.reload_time_reduction_ratio_max_level *
      progress;
    return Math.max(0.2, 1 - reduction);
  }

  getFireRateMultiplier(
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): number {
    const progress = this.getUpgradeProgress(
      levels.fireRateOptimization,
      upgrades.fire_rate_optimization.max_level,
    );
    const reduction =
      upgrades.fire_rate_optimization.fire_rate_reduction_ratio_max_level *
      progress;
    return Math.max(0.2, 1 - reduction);
  }

  getModes(
    baseModes: WeaponModeConfig,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): WeaponModeConfig {
    const modeLevel = levels.modeImprovement;
    const modeProgress = this.getUpgradeProgress(
      modeLevel,
      upgrades.mode_improvement.max_level,
    );
    const singleReduction =
      upgrades.mode_improvement.single.fire_rate_reduction_ratio_max_level *
      modeProgress;
    const spreadPelletBonus = Math.round(
      upgrades.mode_improvement.spread.bonus_pellets_max_level * modeProgress,
    );
    const spreadDamageBonus =
      upgrades.mode_improvement.spread
        .spread_damage_multiplier_bonus_max_level * modeProgress;
    const powerDamageBonus =
      upgrades.mode_improvement.power.damage_multiplier_bonus_max_level *
      modeProgress;

    return {
      [PrimaryWeaponMode.single]: {
        ...baseModes[PrimaryWeaponMode.single],
        fire_rate: Math.max(
          0.1,
          baseModes[PrimaryWeaponMode.single].fire_rate * (1 - singleReduction),
        ),
      },
      [PrimaryWeaponMode.spread]: {
        ...baseModes[PrimaryWeaponMode.spread],
        spread_count:
          baseModes[PrimaryWeaponMode.spread].spread_count + spreadPelletBonus,
        spread_damage_multiplier:
          baseModes[PrimaryWeaponMode.spread].spread_damage_multiplier +
          spreadDamageBonus,
      },
      [PrimaryWeaponMode.power]: {
        ...baseModes[PrimaryWeaponMode.power],
        damage_multiplier:
          baseModes[PrimaryWeaponMode.power].damage_multiplier +
          powerDamageBonus,
      },
    };
  }

  applyCriticalDamage(
    rawDamage: number,
    levels: PrimaryWeaponImprovements,
    upgrades: PrimaryWeaponUpgradeYaml,
  ): PrimaryWeaponDamageRoll {
    const level = levels.criticalProtocol;
    const critical = upgrades.critical_protocol;
    if (level < critical.unlocks_critical_on_level) {
      return { damage: rawDamage, isCritical: false };
    }

    const progress = this.getUpgradeProgress(level, critical.max_level);

    const criticalChance = Math.min(
      1,
      critical.crit_chance_ratio_max_level * progress,
    );
    if (Math.random() >= criticalChance) {
      return { damage: rawDamage, isCritical: false };
    }

    return {
      damage: rawDamage * critical.crit_damage_multiplier,
      isCritical: true,
    };
  }

  private getProgressionConfig(
    key: PrimaryWeaponImprovementKey,
    upgrades: PrimaryWeaponUpgradeYaml,
  ) {
    switch (key) {
      case "extendedMagazine":
        return upgrades.extended_magazine;
      case "reloadOptimization":
        return upgrades.reload_optimization;
      case "fireRateOptimization":
        return upgrades.fire_rate_optimization;
      case "criticalProtocol":
        return upgrades.critical_protocol;
      case "modeImprovement":
        return upgrades.mode_improvement;
    }
  }
}
