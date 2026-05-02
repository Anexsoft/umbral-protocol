import type { PrimaryWeaponModeSingle } from "@gameplay/weapons/primary/types/primary-weapon-mode-single.type";

export interface PrimaryWeaponModePower extends PrimaryWeaponModeSingle {
  damage_multiplier: number;
  knockback_distance: number;
}
