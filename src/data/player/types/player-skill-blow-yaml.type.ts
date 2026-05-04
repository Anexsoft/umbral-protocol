export interface PlayerSkillBlowYaml {
  name: string;
  key: string;
  description: string;
  cooldown: number;
  stamina_cost: number;
  damage_multiplier: number;
  radius: number;
  radius_bonus_ratio_max_level?: number;
}
