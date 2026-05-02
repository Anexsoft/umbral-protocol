import type { SecondaryWeapon } from "@gameplay/weapons/secondary/secondary-weapon";

type SecondaryWeaponCooldownHandlerInput = {
  weapon: SecondaryWeapon;
  deltaMs: number;
};

export class SecondaryWeaponCooldownHandler {
  handle({ weapon, deltaMs }: SecondaryWeaponCooldownHandlerInput): void {
    if (weapon.isReady) return;

    weapon.cooldownTimerMs -= deltaMs;
    if (weapon.cooldownTimerMs <= 0) {
      weapon.isReady = true;
      weapon.cooldownTimerMs = 0;
    }
  }
}
