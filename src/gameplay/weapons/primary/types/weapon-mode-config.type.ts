import { PrimaryWeaponMode } from "@gameplay/weapons/primary/types/primary-weapon-mode.type";
import type { PrimaryWeaponModePower } from "@gameplay/weapons/primary/types/primary-weapon-mode-power.type";
import type { PrimaryWeaponModeSingle } from "@gameplay/weapons/primary/types/primary-weapon-mode-single.type";
import type { PrimaryWeaponModeSpread } from "@gameplay/weapons/primary/types/primary-weapon-mode-spread.type";

export interface WeaponModeConfig {
  [PrimaryWeaponMode.single]: PrimaryWeaponModeSingle;
  [PrimaryWeaponMode.spread]: PrimaryWeaponModeSpread;
  [PrimaryWeaponMode.power]: PrimaryWeaponModePower;
}
