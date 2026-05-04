export interface SecondaryWeaponKnifeEnhancementUpgradeYaml {
  name: string;
  description?: string;
  level?: number;
  max_level: number;
  base_cost: number;
  next_level_cost_multiplier: number;
  damage_bonus_ratio_max_level: number;
  radius_bonus_max_level: number;
}

export interface SecondaryWeaponUpgradeYaml {
  knife_enhancement: SecondaryWeaponKnifeEnhancementUpgradeYaml;
}

export interface SecondaryWeaponYaml {
  name: string;
  description?: string;
  damage_bonus_ratio: number;
  radius: number;
  radius_max_level?: number;
  stamina_cost: number;
  cooldown: number;
  upgrades: SecondaryWeaponUpgradeYaml;
}
