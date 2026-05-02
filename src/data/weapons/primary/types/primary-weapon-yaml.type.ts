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

export interface PrimaryWeaponCoreYaml {
  name: string;
  description?: string;
  magazine_capacity: number;
}

export interface PrimaryWeaponYaml extends PrimaryWeaponCoreYaml {
  modes: Record<string, PrimaryWeaponModeYaml>;
}
