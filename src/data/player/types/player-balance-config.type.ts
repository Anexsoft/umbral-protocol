import type { PlayerBaseValues } from "@data/player/types/player-base-stats.type";
import type { PlayerLevelGrowthConfig } from "@data/player/types/player-level-growth-stats.type";
import type { PlayerSkillConfig } from "@data/player/types/player-skill-config.type";

export interface PlayerBalanceConfig {
  name: string;
  baseValues: PlayerBaseValues;
  staminaRecoveryRate: number;
  levelGrowth: PlayerLevelGrowthConfig;
  dashCooldownSec: number;
  dashStaminaCost: number;
  blowCooldownSec: number;
  blowStaminaCost: number;
  blowDamageMultiplier: number;
  blowRadiusMax: number;
  burstCooldownSec: number;
  burstDurationSec: number;
  burstStaminaCost: number;
  burstMoveSpeedBonusRatio: number;
  burstFireRateBonusRatio: number;
  burstReloadSpeedBonusRatio: number;
  levelXpThresholds: number[];
  skills: PlayerSkillConfig[];
}
