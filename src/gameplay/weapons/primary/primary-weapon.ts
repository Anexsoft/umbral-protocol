import * as Phaser from "phaser";

import { getGameData } from "@data/game-data";
import type { PrimaryWeaponUpgradeYaml } from "@data/weapons/primary/types";

import { Bullet } from "@gameplay/weapons/primary/bullet";
import { PrimaryWeaponFireHandler } from "@gameplay/weapons/primary/handlers/primary-weapon-fire.handler";
import { PrimaryWeaponImprovementsHandler } from "@gameplay/weapons/primary/handlers/primary-weapon-improvements.handler";
import { PrimaryWeaponReloadHandler } from "@gameplay/weapons/primary/handlers/primary-weapon-reload.handler";
import {
  PrimaryWeaponMode,
  type PrimaryWeaponImprovementKey,
  type PrimaryWeaponImprovements,
  type WeaponModeConfig,
} from "@gameplay/weapons/primary/types";

export interface PrimaryWeaponDamageRoll {
  damage: number;
  isCritical: boolean;
}

function isEnvDebugEnabled(): boolean {
  const value = import.meta.env.VITE_GAME_DEBUG;
  if (value === undefined || value.trim() === "") return false;

  return value.trim().toLowerCase() === "true";
}

function readEnvImprovementLevel(
  value: string | undefined,
  fallback: number | undefined,
  maxLevel: number,
): number {
  if (!isEnvDebugEnabled()) {
    return readInitialImprovementLevel(fallback, maxLevel);
  }

  if (value === undefined || value.trim() === "") {
    return readInitialImprovementLevel(fallback, maxLevel);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return readInitialImprovementLevel(fallback, maxLevel);
  }

  return Phaser.Math.Clamp(Math.floor(parsed), 0, Math.max(0, maxLevel));
}

function readInitialImprovementLevel(
  value: number | undefined,
  maxLevel: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;

  return Phaser.Math.Clamp(Math.floor(value), 0, Math.max(0, maxLevel));
}

export class PrimaryWeapon {
  readonly bullets: Phaser.Physics.Arcade.Group;
  readonly scene: Phaser.Scene;

  private readonly fireHandler: PrimaryWeaponFireHandler;
  private readonly improvementsHandler: PrimaryWeaponImprovementsHandler;
  private readonly reloadHandler: PrimaryWeaponReloadHandler;
  private readonly _baseModes: WeaponModeConfig;
  private readonly _baseMagazineCapacity: number;
  private readonly _upgradeConfig: PrimaryWeaponUpgradeYaml;
  private readonly _improvements: PrimaryWeaponImprovements;
  private _ammo = 0;
  private _mode = PrimaryWeaponMode.single;
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
    this._baseModes = data.modes as unknown as WeaponModeConfig;
    this._baseMagazineCapacity = data.magazine_capacity;
    this._upgradeConfig = data.upgrades;
    this.fireHandler = new PrimaryWeaponFireHandler();
    this.improvementsHandler = new PrimaryWeaponImprovementsHandler();
    this.reloadHandler = new PrimaryWeaponReloadHandler();
    this._improvements = this.improvementsHandler.createInitialLevels();
    this._improvements.extendedMagazine = readEnvImprovementLevel(
      import.meta.env.VITE_PLAYER_PRIMARY_EXTENDED_MAGAZINE_LEVEL,
      this._upgradeConfig.extended_magazine.level,
      this._upgradeConfig.extended_magazine.max_level,
    );
    this._improvements.reloadOptimization = readEnvImprovementLevel(
      import.meta.env.VITE_PLAYER_PRIMARY_RELOAD_OPTIMIZATION_LEVEL,
      this._upgradeConfig.reload_optimization.level,
      this._upgradeConfig.reload_optimization.max_level,
    );
    this._improvements.fireRateOptimization = readEnvImprovementLevel(
      import.meta.env.VITE_PLAYER_PRIMARY_FIRE_RATE_OPTIMIZATION_LEVEL,
      this._upgradeConfig.fire_rate_optimization.level,
      this._upgradeConfig.fire_rate_optimization.max_level,
    );
    this._improvements.criticalProtocol = readEnvImprovementLevel(
      import.meta.env.VITE_PLAYER_PRIMARY_CRITICAL_PROTOCOL_LEVEL,
      this._upgradeConfig.critical_protocol.level,
      this._upgradeConfig.critical_protocol.max_level,
    );
    this._improvements.modeImprovement = readEnvImprovementLevel(
      import.meta.env.VITE_PLAYER_PRIMARY_MODE_IMPROVEMENT_LEVEL,
      this._upgradeConfig.mode_improvement.level,
      this._upgradeConfig.mode_improvement.max_level,
    );
    this._ammo = this.maxAmmo;
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
      : this.getReloadDurationMs();
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
    return this.improvementsHandler.getMaxAmmo(
      this._baseMagazineCapacity,
      this._improvements,
      this._upgradeConfig,
    );
  }

  getMaxAmmo(): number {
    return this.maxAmmo;
  }

  get modes(): WeaponModeConfig {
    return this.improvementsHandler.getModes(
      this._baseModes,
      this._improvements,
      this._upgradeConfig,
    );
  }

  get improvements(): PrimaryWeaponImprovements {
    return this._improvements;
  }

  get improvementConfig(): PrimaryWeaponUpgradeYaml {
    return this._upgradeConfig;
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

  upgradeImprovement(key: PrimaryWeaponImprovementKey): boolean {
    const didUpgrade = this.improvementsHandler.upgrade(
      key,
      this._improvements,
      this._upgradeConfig,
    );
    if (!didUpgrade) return false;

    this._ammo = Math.min(this.maxAmmo, this._ammo);
    return true;
  }

  canUpgradeImprovement(key: PrimaryWeaponImprovementKey): boolean {
    return this.improvementsHandler.canUpgrade(
      key,
      this._improvements,
      this._upgradeConfig,
    );
  }

  getNextImprovementCost(key: PrimaryWeaponImprovementKey): number {
    return this.improvementsHandler.getNextLevelCost(
      key,
      this._improvements,
      this._upgradeConfig,
    );
  }

  getFireRateIntervalMultiplier(): number {
    return this.improvementsHandler.getFireRateMultiplier(
      this._improvements,
      this._upgradeConfig,
    );
  }

  getReloadDurationMs(durationMultiplier?: number): number {
    const baseReloadMs = this.modes[this._mode].reload_time * 1000;
    return (
      baseReloadMs *
      this.improvementsHandler.getReloadTimeMultiplier(
        this._improvements,
        this._upgradeConfig,
      ) *
      Math.max(0.2, durationMultiplier ?? 1)
    );
  }

  getCriticalDamageRoll(rawDamage: number): PrimaryWeaponDamageRoll {
    return this.improvementsHandler.applyCriticalDamage(
      rawDamage,
      this._improvements,
      this._upgradeConfig,
    );
  }
}
