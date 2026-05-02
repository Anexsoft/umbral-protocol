import * as Phaser from "phaser";

import { getGameData } from "@data/game-data";

import { SecondaryWeaponAttackHandler } from "@gameplay/weapons/secondary/handlers/secondary-weapon-attack.handler";
import { SecondaryWeaponCooldownHandler } from "@gameplay/weapons/secondary/handlers/secondary-weapon-cooldown.handler";

export class SecondaryWeapon {
  readonly scene: Phaser.Scene;

  private readonly attackHandler: SecondaryWeaponAttackHandler;
  private readonly cooldownHandler: SecondaryWeaponCooldownHandler;
  private _damageBonusRatio = 0;
  private _attackRadius = 0;
  private _staminaCost = 0;
  private _cooldownTimeSec = 0;
  private _isReady = true;
  private _cooldownTimerMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const data = getGameData().secondaryWeapon;
    this._damageBonusRatio = data.damage_bonus_ratio;
    this._attackRadius = data.attack_radius;
    this._staminaCost = data.stamina_cost;
    this._cooldownTimeSec = data.cooldown;
    this.attackHandler = new SecondaryWeaponAttackHandler();
    this.cooldownHandler = new SecondaryWeaponCooldownHandler();
  }

  update(deltaMs: number): void {
    this.cooldownHandler.handle({ weapon: this, deltaMs });
  }

  tryAttack(x: number, y: number, scaledDamage?: number): boolean {
    return this.attackHandler.handle({ weapon: this, x, y, scaledDamage });
  }

  get isReady(): boolean {
    return this._isReady;
  }

  set isReady(value: boolean) {
    this._isReady = value;
  }

  get staminaCost(): number {
    return this._staminaCost;
  }

  get damageBonusRatio(): number {
    return this._damageBonusRatio;
  }

  get attackRadius(): number {
    return this._attackRadius;
  }

  get cooldown(): number {
    return this._cooldownTimerMs;
  }

  get maxCooldown(): number {
    return this._cooldownTimeSec * 1000;
  }

  get cooldownTimerMs(): number {
    return this._cooldownTimerMs;
  }

  set cooldownTimerMs(value: number) {
    this._cooldownTimerMs = value;
  }

  get cooldownTimeSec(): number {
    return this._cooldownTimeSec;
  }
}
