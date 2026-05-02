import type { PrimaryWeapon } from "@gameplay/weapons/primary/primary-weapon";

type PrimaryWeaponReloadHandlerInput =
  | { weapon: PrimaryWeapon; id: "tick"; deltaMs: number }
  | { weapon: PrimaryWeapon; id: "start"; durationMultiplier?: number };

export class PrimaryWeaponReloadHandler {
  handle(command: PrimaryWeaponReloadHandlerInput): void {
    if (command.id === "start") {
      this.handleStart(command.weapon, command.durationMultiplier);
      return;
    }

    this.handleTick(command.weapon, command.deltaMs);
  }

  private handleStart(
    weapon: PrimaryWeapon,
    durationMultiplier?: number,
  ): void {
    const stats = weapon.modes[weapon.currentMode];
    if (weapon.isReloading || weapon.ammo === weapon.maxAmmo) return;
    weapon.isReloading = true;
    weapon.reloadDurationMs =
      stats.reload_time * 1000 * Math.max(0.2, durationMultiplier ?? 1);
    weapon.reloadTimerMs = weapon.reloadDurationMs;
  }

  private handleTick(weapon: PrimaryWeapon, deltaMs: number): void {
    if (!weapon.isReloading) return;

    weapon.reloadTimerMs -= deltaMs;
    if (weapon.reloadTimerMs <= 0) {
      weapon.ammo = weapon.maxAmmo;
      weapon.isReloading = false;
      weapon.reloadTimerMs = 0;
      weapon.reloadDurationMs = 0;
    }
  }
}
