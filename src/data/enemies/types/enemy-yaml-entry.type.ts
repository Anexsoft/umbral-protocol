import type { EnemyBaseStats } from "@data/enemies/types/enemy-base-stats.type";

export type EnemyAttackType = "melee" | "range";

export interface EnemyYamlEntry {
  id: string;
  name: string;
  description?: string;
  boss?: boolean;
  attack_id?: EnemyAttackType;
  attack_range?: number;
  base_stats: EnemyBaseStats;
}
