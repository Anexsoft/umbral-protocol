export interface PrimaryWeaponModeYaml {
  label?: string;
  description?: string;
  fire_rate: number;
  reload_time: number;
  spread_damage_multiplier?: number;
  spread_count?: number;
  damage_multiplier?: number;
  knockback_distance?: number;
}

export interface PrimaryWeaponUpgradeProgressionYaml {
  name: string;
  description?: string;
  max_level: number;
  base_cost: number;
  next_level_cost_multiplier: number;
}

export interface PrimaryWeaponExtendedMagazineUpgradeYaml extends PrimaryWeaponUpgradeProgressionYaml {
  ammo_bonus_per_level: number;
}

export interface PrimaryWeaponReloadOptimizationUpgradeYaml extends PrimaryWeaponUpgradeProgressionYaml {
  reload_time_reduction_ratio_per_level: number;
}

export interface PrimaryWeaponFireRateOptimizationUpgradeYaml extends PrimaryWeaponUpgradeProgressionYaml {
  fire_rate_reduction_ratio_per_level: number;
}

export interface PrimaryWeaponCriticalProtocolUpgradeYaml extends PrimaryWeaponUpgradeProgressionYaml {
  unlocks_critical_on_level: number;
  crit_chance_ratio_per_level: number;
  crit_damage_multiplier: number;
}

export interface PrimaryWeaponModeImprovementSingleUpgradeYaml {
  fire_rate_reduction_ratio_per_level: number;
}

export interface PrimaryWeaponModeImprovementSpreadUpgradeYaml {
  bonus_pellets_every_levels: number;
  spread_damage_multiplier_bonus_per_level: number;
}

export interface PrimaryWeaponModeImprovementPowerUpgradeYaml {
  damage_multiplier_bonus_per_level: number;
}

export interface PrimaryWeaponModeImprovementUpgradeYaml extends PrimaryWeaponUpgradeProgressionYaml {
  single: PrimaryWeaponModeImprovementSingleUpgradeYaml;
  spread: PrimaryWeaponModeImprovementSpreadUpgradeYaml;
  power: PrimaryWeaponModeImprovementPowerUpgradeYaml;
}

export interface PrimaryWeaponUpgradeYaml {
  extended_magazine: PrimaryWeaponExtendedMagazineUpgradeYaml;
  reload_optimization: PrimaryWeaponReloadOptimizationUpgradeYaml;
  fire_rate_optimization: PrimaryWeaponFireRateOptimizationUpgradeYaml;
  critical_protocol: PrimaryWeaponCriticalProtocolUpgradeYaml;
  mode_improvement: PrimaryWeaponModeImprovementUpgradeYaml;
}

export interface PrimaryWeaponCoreYaml {
  name: string;
  description?: string;
  magazine_capacity: number;
}

export interface PrimaryWeaponYaml extends PrimaryWeaponCoreYaml {
  modes: Record<string, PrimaryWeaponModeYaml>;
  upgrades: PrimaryWeaponUpgradeYaml;
}
