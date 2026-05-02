import type { PrimaryWeaponModeSingle } from "@gameplay/weapons/primary/types/primary-weapon-mode-single.type";

export interface PrimaryWeaponModeSpread extends PrimaryWeaponModeSingle {
  spread_damage_multiplier: number;
  spread_count: number;
}
