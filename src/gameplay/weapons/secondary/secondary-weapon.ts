import * as Phaser from "phaser";

import { getGameData } from "@data/game-data";
import type { SecondaryWeaponUpgradeYaml } from "@data/weapons/secondary/types";

import { SecondaryWeaponAttackHandler } from "@gameplay/weapons/secondary/handlers/secondary-weapon-attack.handler";
import { SecondaryWeaponCooldownHandler } from "@gameplay/weapons/secondary/handlers/secondary-weapon-cooldown.handler";
import { SecondaryWeaponImprovementsHandler } from "@gameplay/weapons/secondary/handlers/secondary-weapon-improvements.handler";
import type {
  SecondaryWeaponImprovementKey,
  SecondaryWeaponImprovements,
} from "@gameplay/weapons/secondary/types";

export class SecondaryWeapon {
  readonly scene: Phaser.Scene;

  private readonly attackHandler: SecondaryWeaponAttackHandler;
  private readonly cooldownHandler: SecondaryWeaponCooldownHandler;
  private readonly improvementsHandler: SecondaryWeaponImprovementsHandler;
  private readonly _baseDamageBonusRatio: number;
  private readonly _baseAttackRadius: number;
  private readonly _upgradeConfig: SecondaryWeaponUpgradeYaml;
  private readonly _improvements: SecondaryWeaponImprovements;
  private _staminaCost = 0;
  private _cooldownTimeSec = 0;
  private _isReady = true;
  private _cooldownTimerMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const data = getGameData().secondaryWeapon;
    this._baseDamageBonusRatio = data.damage_bonus_ratio;
    this._baseAttackRadius = data.attack_radius;
    this._upgradeConfig = data.upgrades;
    this._staminaCost = data.stamina_cost;
    this._cooldownTimeSec = data.cooldown;
    this.attackHandler = new SecondaryWeaponAttackHandler();
    this.cooldownHandler = new SecondaryWeaponCooldownHandler();
    this.improvementsHandler = new SecondaryWeaponImprovementsHandler();
    this._improvements = this.improvementsHandler.createInitialLevels();
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
    return this.improvementsHandler.getDamageBonusRatio(
      this._baseDamageBonusRatio,
      this._improvements,
      this._upgradeConfig,
    );
  }

  get attackRadius(): number {
    return this.improvementsHandler.getAttackRadius(
      this._baseAttackRadius,
      this._improvements,
      this._upgradeConfig,
    );
  }

  get improvements(): SecondaryWeaponImprovements {
    return this._improvements;
  }

  get improvementConfig(): SecondaryWeaponUpgradeYaml {
    return this._upgradeConfig;
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

  upgradeImprovement(key: SecondaryWeaponImprovementKey): boolean {
    return this.improvementsHandler.upgrade(
      key,
      this._improvements,
      this._upgradeConfig,
    );
  }

  canUpgradeImprovement(key: SecondaryWeaponImprovementKey): boolean {
    return this.improvementsHandler.canUpgrade(
      key,
      this._improvements,
      this._upgradeConfig,
    );
  }

  getNextImprovementCost(key: SecondaryWeaponImprovementKey): number {
    return this.improvementsHandler.getNextLevelCost(
      key,
      this._improvements,
      this._upgradeConfig,
    );
  }
}
