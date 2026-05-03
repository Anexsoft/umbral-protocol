import type { EnemyLevelScalingConfig } from "@data/enemies/types";

export function enemyStatMultiplier(
  spawnLevel: number,
  c: EnemyLevelScalingConfig,
): number {
  return 1 + spawnLevel * c.stat_scale_per_level;
}

export function enemyVisualScale(
  baseScale: number,
  spawnLevel: number,
  isBoss: boolean,
  c: EnemyLevelScalingConfig,
): number {
  let s = baseScale + spawnLevel * c.size_scale_per_level;
  if (isBoss) s *= c.boss_scale_multiplier;
  return s;
}
