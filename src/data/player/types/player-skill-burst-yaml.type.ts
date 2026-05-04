export interface PlayerSkillBurstYaml {
  name: string;
  key: string;
  description: string;
  cooldown: number;
  duration: number;
  duration_max_level?: number;
  stamina_cost: number;
  move_speed_bonus_ratio: number;
  move_speed_bonus_ratio_max_level?: number;
  fire_rate_bonus_ratio: number;
  fire_rate_bonus_ratio_max_level?: number;
  reload_speed_bonus_ratio: number;
  reload_speed_bonus_ratio_max_level?: number;
}
