export interface PlayerSkillConfig {
  name: string;
  key: string;
  description: string;
  cooldownSec: number;
  staminaCost: number;
  durationSec?: number;
  damageMultiplier?: number;
  moveSpeedBonusRatio?: number;
  fireRateBonusRatio?: number;
  reloadSpeedBonusRatio?: number;
  radiusMax?: number;
}
