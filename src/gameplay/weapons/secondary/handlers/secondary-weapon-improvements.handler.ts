import type { SecondaryWeaponUpgradeYaml } from "@data/weapons/secondary/types";

import type {
  SecondaryWeaponImprovementKey,
  SecondaryWeaponImprovements,
} from "@gameplay/weapons/secondary/types";

export class SecondaryWeaponImprovementsHandler {
  createInitialLevels(): SecondaryWeaponImprovements {
    return {
      knifeEnhancement: 0,
    };
  }

  upgrade(
    key: SecondaryWeaponImprovementKey,
    levels: SecondaryWeaponImprovements,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): boolean {
    if (!this.canUpgrade(key, levels, upgrades)) return false;
    levels[key] += 1;
    return true;
  }

  canUpgrade(
    key: SecondaryWeaponImprovementKey,
    levels: SecondaryWeaponImprovements,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): boolean {
    return levels[key] < this.getMaxLevel(key, upgrades);
  }

  getMaxLevel(
    key: SecondaryWeaponImprovementKey,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): number {
    switch (key) {
      case "knifeEnhancement":
        return upgrades.knife_enhancement.max_level;
    }
  }

  getNextLevelCost(
    key: SecondaryWeaponImprovementKey,
    levels: SecondaryWeaponImprovements,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): number {
    const config = this.getProgressionConfig(key, upgrades);
    const level = levels[key];
    return Math.round(
      config.base_cost * Math.pow(config.next_level_cost_multiplier, level),
    );
  }

  getDamageBonusRatio(
    baseDamageBonusRatio: number,
    levels: SecondaryWeaponImprovements,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): number {
    return (
      baseDamageBonusRatio +
      levels.knifeEnhancement *
        upgrades.knife_enhancement.damage_bonus_ratio_per_level
    );
  }

  getAttackRadius(
    baseAttackRadius: number,
    levels: SecondaryWeaponImprovements,
    upgrades: SecondaryWeaponUpgradeYaml,
  ): number {
    return (
      baseAttackRadius +
      levels.knifeEnhancement *
        upgrades.knife_enhancement.attack_radius_bonus_per_level
    );
  }

  private getProgressionConfig(
    key: SecondaryWeaponImprovementKey,
    upgrades: SecondaryWeaponUpgradeYaml,
  ) {
    switch (key) {
      case "knifeEnhancement":
        return upgrades.knife_enhancement;
    }
  }
}
