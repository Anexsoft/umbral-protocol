import * as Phaser from "phaser";

import { getGameData } from "@data/game-data";

import { Bullet } from "@gameplay/weapons/primary/bullet";
import { PrimaryWeaponFireHandler } from "@gameplay/weapons/primary/handlers/primary-weapon-fire.handler";
import { PrimaryWeaponReloadHandler } from "@gameplay/weapons/primary/handlers/primary-weapon-reload.handler";
import {
  PrimaryWeaponMode,
  type WeaponModeConfig,
} from "@gameplay/weapons/primary/types";

export class PrimaryWeapon {
  readonly bullets: Phaser.Physics.Arcade.Group;
  readonly scene: Phaser.Scene;

  private readonly fireHandler: PrimaryWeaponFireHandler;
  private readonly reloadHandler: PrimaryWeaponReloadHandler;
  private _ammo = 0;
  private _mode = PrimaryWeaponMode.single;
  private _modes = {} as WeaponModeConfig;
  private _magazineCapacity = 0;
  private _isReloading = false;
  private _reloadTimerMs = 0;
  private _reloadDurationMs = 0;
  private _lastShotAt = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });
    const data = getGameData().primaryWeapon;
    this._ammo = data.magazine_capacity;
    this._modes = data.modes as unknown as WeaponModeConfig;
    this._magazineCapacity = data.magazine_capacity;
    this.fireHandler = new PrimaryWeaponFireHandler();
    this.reloadHandler = new PrimaryWeaponReloadHandler();
  }

  update(deltaMs: number): void {
    this.reloadHandler.handle({ weapon: this, id: "tick", deltaMs });
  }

  tryFire(
    x: number,
    y: number,
    time: number,
    scaledBaseDamage?: number,
    fireRateIntervalMultiplier?: number,
  ): boolean {
    return this.fireHandler.handle({
      weapon: this,
      x,
      y,
      time,
      scaledBaseDamage,
      fireRateIntervalMultiplier,
    });
  }

  reload(durationMultiplier?: number): void {
    this.reloadHandler.handle({
      weapon: this,
      id: "start",
      durationMultiplier,
    });
  }

  setMode(mode: PrimaryWeaponMode): void {
    this._mode = mode;
  }

  get reloadTimer(): number {
    return this._reloadTimerMs;
  }

  get reloadTime(): number {
    return this._reloadDurationMs > 0
      ? this._reloadDurationMs
      : this._modes[this._mode].reload_time * 1000;
  }

  get reloadProgress(): number {
    if (!this._isReloading || this._reloadDurationMs <= 0) return 0;
    return (
      (this._reloadDurationMs - this._reloadTimerMs) / this._reloadDurationMs
    );
  }

  get ammo(): number {
    return this._ammo;
  }

  set ammo(value: number) {
    this._ammo = value;
  }

  get isReloading(): boolean {
    return this._isReloading;
  }

  set isReloading(value: boolean) {
    this._isReloading = value;
  }

  get currentMode(): PrimaryWeaponMode {
    return this._mode;
  }

  get maxAmmo(): number {
    return this._magazineCapacity;
  }

  getMaxAmmo(): number {
    return this._magazineCapacity;
  }

  get modes(): WeaponModeConfig {
    return this._modes;
  }

  get reloadTimerMs(): number {
    return this._reloadTimerMs;
  }

  set reloadTimerMs(value: number) {
    this._reloadTimerMs = value;
  }

  get reloadDurationMs(): number {
    return this._reloadDurationMs;
  }

  set reloadDurationMs(value: number) {
    this._reloadDurationMs = value;
  }

  get lastShotAt(): number {
    return this._lastShotAt;
  }

  set lastShotAt(value: number) {
    this._lastShotAt = value;
  }
}
