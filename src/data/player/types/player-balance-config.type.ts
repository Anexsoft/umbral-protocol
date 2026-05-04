import type { PlayerBaseValues } from "@data/player/types/player-base-stats.type";
import type { PlayerLevelGrowthConfig } from "@data/player/types/player-level-growth-stats.type";
import type { PlayerSkillConfig } from "@data/player/types/player-skill-config.type";

export interface PlayerBalanceConfig {
  name: string;
  baseValues: PlayerBaseValues;
  initialLevel: number;
  staminaRecoveryRate: number;
  levelGrowth: PlayerLevelGrowthConfig;
  dashCooldownSec: number;
  dashStaminaCost: number;
  dashDistanceBonusRatioMaxLevel: number;
  blowCooldownSec: number;
  blowStaminaCost: number;
  blowDamageMultiplier: number;
  blowRadiusMax: number;
  blowRadiusBonusRatioMaxLevel: number;
  burstCooldownSec: number;
  burstDurationSec: number;
  burstDurationSecMaxLevel: number;
  burstStaminaCost: number;
  burstMoveSpeedBonusRatio: number;
  burstMoveSpeedBonusRatioMaxLevel: number;
  burstFireRateBonusRatio: number;
  burstFireRateBonusRatioMaxLevel: number;
  burstReloadSpeedBonusRatio: number;
  burstReloadSpeedBonusRatioMaxLevel: number;
  levelXpThresholds: number[];
  skills: PlayerSkillConfig[];
}
