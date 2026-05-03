export interface SecondaryWeaponKnifeEnhancementUpgradeYaml {
  name: string;
  description?: string;
  max_level: number;
  base_cost: number;
  next_level_cost_multiplier: number;
  damage_bonus_ratio_per_level: number;
  attack_radius_bonus_per_level: number;
}

export interface SecondaryWeaponUpgradeYaml {
  knife_enhancement: SecondaryWeaponKnifeEnhancementUpgradeYaml;
}

export interface SecondaryWeaponYaml {
  name: string;
  description?: string;
  damage_bonus_ratio: number;
  attack_radius: number;
  stamina_cost: number;
  cooldown: number;
  upgrades: SecondaryWeaponUpgradeYaml;
}
