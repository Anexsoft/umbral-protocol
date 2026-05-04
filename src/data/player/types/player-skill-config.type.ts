export interface PlayerSkillConfig {
  name: string;
  key: string;
  description: string;
  cooldownSec: number;
  staminaCost: number;
  durationSec?: number;
  durationSecMaxLevel?: number;
  damageMultiplier?: number;
  distanceBonusRatioMaxLevel?: number;
  moveSpeedBonusRatio?: number;
  moveSpeedBonusRatioMaxLevel?: number;
  fireRateBonusRatio?: number;
  fireRateBonusRatioMaxLevel?: number;
  reloadSpeedBonusRatio?: number;
  reloadSpeedBonusRatioMaxLevel?: number;
  radiusMax?: number;
  radiusBonusRatioMaxLevel?: number;
}
