import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import { Bullet } from "@gameplay/weapons/primary/bullet";
import type { PrimaryWeapon } from "@gameplay/weapons/primary/primary-weapon";
import {
  PrimaryWeaponMode,
  type PrimaryWeaponModePower,
  type PrimaryWeaponModeSpread,
} from "@gameplay/weapons/primary/types";

const theme = getTheme();

type PrimaryWeaponFireHandlerInput = {
  weapon: PrimaryWeapon;
  x: number;
  y: number;
  time: number;
  scaledBaseDamage?: number;
  fireRateIntervalMultiplier?: number;
};

export class PrimaryWeaponFireHandler {
  handle({
    weapon,
    x,
    y,
    time,
    scaledBaseDamage,
    fireRateIntervalMultiplier,
  }: PrimaryWeaponFireHandlerInput): boolean {
    const stats = weapon.modes[weapon.currentMode];
    const now = time || weapon.scene.time.now;
    const fireIntervalMs =
      stats.fire_rate * 1000 * Math.max(0.2, fireRateIntervalMultiplier ?? 1);

    if (
      weapon.isReloading ||
      weapon.ammo <= 0 ||
      now - weapon.lastShotAt < fireIntervalMs
    ) {
      return false;
    }

    weapon.lastShotAt = now;
    weapon.ammo -= 1;

    const baseDamage = scaledBaseDamage ?? 1;
    const pointer = weapon.scene.input.activePointer;
    const worldPoint = weapon.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y,
    );
    const angle = Phaser.Math.Angle.Between(x, y, worldPoint.x, worldPoint.y);

    switch (weapon.currentMode) {
      case PrimaryWeaponMode.spread:
        this.fireSpread(
          weapon,
          x,
          y,
          angle,
          stats as PrimaryWeaponModeSpread,
          baseDamage,
        );
        break;
      case PrimaryWeaponMode.power:
        this.firePower(
          weapon,
          x,
          y,
          angle,
          stats as PrimaryWeaponModePower,
          baseDamage,
        );
        break;
      default:
        this.spawnBullet(weapon, x, y, angle, baseDamage);
        break;
    }

    return true;
  }

  private fireSpread(
    weapon: PrimaryWeapon,
    x: number,
    y: number,
    angle: number,
    stats: PrimaryWeaponModeSpread,
    baseDamage: number,
  ): void {
    const chipDamage = baseDamage * stats.spread_damage_multiplier;
    this.spawnBullet(weapon, x, y, angle, chipDamage);

    const sideBullets = Math.floor((stats.spread_count - 1) / 2);
    for (let i = 1; i <= sideBullets; i++) {
      this.spawnBullet(weapon, x, y, angle + 0.2 * i, chipDamage);
      this.spawnBullet(weapon, x, y, angle - 0.2 * i, chipDamage);
    }
  }

  private firePower(
    weapon: PrimaryWeapon,
    x: number,
    y: number,
    angle: number,
    stats: PrimaryWeaponModePower,
    baseDamage: number,
  ): void {
    this.spawnBullet(
      weapon,
      x,
      y,
      angle,
      baseDamage * stats.damage_multiplier,
      0.15,
      stats.knockback_distance,
    );
  }

  private spawnBullet(
    weapon: PrimaryWeapon,
    x: number,
    y: number,
    angle: number,
    damage: number,
    scaleFactor = 0,
    knockback = 0,
  ): void {
    const key = "bullet-circle";

    if (!weapon.scene.textures.exists(key)) {
      const graphics = weapon.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(hexToNumber(theme.semantic.gfx.bullet), 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture(key, 8, 8);
      graphics.destroy();
    }

    const bullet = new Bullet(
      weapon.scene,
      x,
      y,
      angle,
      damage,
      scaleFactor,
      knockback,
    );
    weapon.bullets.add(bullet);
  }
}
