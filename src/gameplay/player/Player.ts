import * as Phaser from "phaser";

import { getGameData } from "@data/game-data";
import { getTheme, hexToNumber } from "@data/theme/theme";
import type { PlayerBalanceConfig } from "@data/player/types";

import { MovementHandler } from "@gameplay/player/handlers/movement/movement.handler";
import { BlowSkillHandler } from "@gameplay/player/handlers/skills/blow-skill.handler";
import { BurstSkillHandler } from "@gameplay/player/handlers/skills/burst-skill.handler";
import { DashHandler } from "@gameplay/player/handlers/skills/dash.handler";
import { AimLaserHandler } from "@gameplay/player/handlers/weapon/aim-laser.handler";
import { WeaponControlHandler } from "@gameplay/player/handlers/weapon/weapon-control.handler";
import type { PlayerInput, SkillInput } from "@gameplay/player/types";
import { PrimaryWeapon } from "@gameplay/weapons/primary/primary-weapon";
import { SecondaryWeapon } from "@gameplay/weapons/secondary/secondary-weapon";

type PlayerCombatValues = {
  hp: number;
  damage: number;
  stamina: number;
  speed: number;
};

const theme = getTheme();

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly primaryWeapon: PrimaryWeapon;
  readonly secondaryWeapon: SecondaryWeapon;
  readonly dashDirection = new Phaser.Math.Vector2(0, 0);

  private readonly balance: PlayerBalanceConfig;
  private readonly movement: MovementHandler;
  private readonly dash: DashHandler;
  private readonly burstSkill: BurstSkillHandler;
  private readonly aimLaser: AimLaserHandler;
  private readonly weapons: WeaponControlHandler;
  private readonly blowSkill: BlowSkillHandler;

  private _health = 1;
  private _maxHealth = 1;
  private _stamina = 1;
  private _maxStamina = 1;
  private _moveSpeed = 1;
  private _dashCooldownTimerMs = 0;
  private _blowCooldownTimerMs = 0;
  private _burstCooldownTimerMs = 0;
  private _burstTimerMs = 0;
  private _level = 1;
  private _totalXp = 0;
  private _scorePoints = 0;
  private _credits = 0;
  private _enemiesDefeated = 0;
  private _dashActive = false;
  private _dashTimerMs = 0;
  private burstAura?: Phaser.GameObjects.Arc;
  private burstAuraTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");

    this.balance = getGameData().player;
    this.initializeState();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setPushable(false);
    this.setScale(this.playerScale);

    this.primaryWeapon = new PrimaryWeapon(scene);
    this.secondaryWeapon = new SecondaryWeapon(scene);

    this.movement = new MovementHandler();
    this.dash = new DashHandler();
    this.burstSkill = new BurstSkillHandler(scene);
    this.aimLaser = new AimLaserHandler(scene);
    this.weapons = new WeaponControlHandler();
    this.blowSkill = new BlowSkillHandler(scene);
  }

  update(
    deltaMs: number,
    input: PlayerInput & SkillInput,
    time: number = 0,
  ): void {
    if (!this.isAlive) return;

    this.tickState(deltaMs);

    if (this.dashActive) {
      this.dash.handle({ player: this, input, deltaMs });
    } else {
      this.movement.handle({ player: this, input });
      this.aimLaser.handle({ id: "draw", player: this });
      this.burstSkill.handle({ player: this, input });
      this.weapons.handle({ player: this, input, time });
      this.blowSkill.handle({ player: this, input });
      this.dash.handle({ player: this, input, deltaMs });
    }

    this.primaryWeapon.update(deltaMs);
    this.secondaryWeapon.update(deltaMs);
  }

  destroy(fromScene?: boolean): void {
    this.disableBurstVisuals();
    this.aimLaser.handle({ id: "destroy" });
    super.destroy(fromScene);
  }

  applyDamage(amount: number): void {
    this._health = Math.max(0, this._health - amount);
    if (!this.isAlive) this.setVelocity(0, 0);
  }

  addKillRewards(credits: number, score: number, xp: number): void {
    const previousLevel = this._level;
    this._enemiesDefeated += 1;
    this._credits += Math.max(0, Math.round(credits));
    this._scorePoints += Math.max(0, Math.round(score));
    this._totalXp += Math.max(0, Math.round(xp));
    this.syncLevelFromXp();
    if (this._level !== previousLevel) {
      this.recomputeAllFromLevel(false);
      this._health = this._maxHealth;
      this._stamina = this._maxStamina;
      this.playLevelUpEffect();
    }
  }

  addCredits(amount: number): void {
    this._credits += Math.max(0, Math.round(amount));
  }

  healByRatio(ratio: number): number {
    const amount = Math.max(0, Math.round(this._maxHealth * ratio));
    const previous = this._health;
    this._health = Math.min(this._maxHealth, this._health + amount);
    return this._health - previous;
  }

  restoreStaminaByRatio(ratio: number): number {
    const amount = Math.max(0, Math.round(this._maxStamina * ratio));
    const previous = this._stamina;
    this._stamina = Math.min(this._maxStamina, this._stamina + amount);
    return this._stamina - previous;
  }

  consumeStamina(amount: number): boolean {
    if (this._stamina < amount) return false;
    this._stamina -= amount;
    return true;
  }

  spendCredits(amount: number): boolean {
    const cost = Math.max(0, Math.round(amount));
    if (this._credits < cost) return false;
    this._credits -= cost;
    return true;
  }

  startDashCooldown(): void {
    this._dashCooldownTimerMs = this.balance.dashCooldownSec * 1000;
  }

  startBlowCooldown(): void {
    this._blowCooldownTimerMs = this.balance.blowCooldownSec * 1000;
  }

  startBurstCooldown(): void {
    this._burstCooldownTimerMs = this.balance.burstCooldownSec * 1000;
  }

  activateBurstMode(): void {
    this._burstTimerMs = this.balance.burstDurationSec * 1000;
    this.enableBurstVisuals();
  }

  scaleDamage(multiplier = 1): number {
    return Math.max(1, Math.round(this.damage * multiplier));
  }

  get dashActive(): boolean {
    return this._dashActive;
  }

  set dashActive(value: boolean) {
    this._dashActive = value;
  }

  get dashTimerMs(): number {
    return this._dashTimerMs;
  }

  set dashTimerMs(value: number) {
    this._dashTimerMs = value;
  }

  get playerName(): string {
    return this.balance.name;
  }

  get health(): number {
    return this._health;
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  get stamina(): number {
    return this._stamina;
  }

  get maxStamina(): number {
    return this._maxStamina;
  }

  get isAlive(): boolean {
    return this._health > 0;
  }

  get lvl(): number {
    return this._level;
  }

  get score(): number {
    return this._scorePoints;
  }

  get credits(): number {
    return this._credits;
  }

  get enemiesDefeated(): number {
    return this._enemiesDefeated;
  }

  get xpBarProgress(): number {
    const thresholds = this.balance.levelXpThresholds;
    if (this._level >= 50) return 1;

    const floorXp = thresholds[this._level - 1] ?? 0;
    const ceilingXp = thresholds[this._level] ?? floorXp + 1;
    const span = Math.max(1, ceilingXp - floorXp);
    const intoLevel = this._totalXp - floorXp;
    return Math.min(1, Math.max(0, intoLevel / span));
  }

  get totalXp(): number {
    return this._totalXp;
  }

  get xpIntoCurrentLevel(): number {
    const thresholds = this.balance.levelXpThresholds;
    const floorXp = thresholds[this._level - 1] ?? 0;
    return Math.max(0, this._totalXp - floorXp);
  }

  get xpNeededForNextLevel(): number {
    if (this._level >= 50) return 0;
    const thresholds = this.balance.levelXpThresholds;
    const floorXp = thresholds[this._level - 1] ?? 0;
    const ceilingXp = thresholds[this._level] ?? floorXp;
    return Math.max(0, ceilingXp - floorXp);
  }

  get xpRemainingToNextLevel(): number {
    if (this._level >= 50) return 0;
    const thresholds = this.balance.levelXpThresholds;
    const nextThreshold = thresholds[this._level] ?? this._totalXp;
    return Math.max(0, nextThreshold - this._totalXp);
  }

  get dashCooldownTimer(): number {
    return this._dashCooldownTimerMs;
  }

  get dashCooldownMax(): number {
    return this.balance.dashCooldownSec * 1000;
  }

  get blowCooldownTimer(): number {
    return this._blowCooldownTimerMs;
  }

  get blowCooldownMax(): number {
    return this.balance.blowCooldownSec * 1000;
  }

  get burstCooldownTimer(): number {
    return this._burstCooldownTimerMs;
  }

  get burstCooldownMax(): number {
    return this.balance.burstCooldownSec * 1000;
  }

  get dashStaminaCost(): number {
    return this.balance.dashStaminaCost;
  }

  get blowStaminaCost(): number {
    return Math.min(this.balance.blowStaminaCost, this.maxStamina);
  }

  get blowRadiusMax(): number {
    return this.balance.blowRadiusMax;
  }

  get burstStaminaCost(): number {
    return Math.min(this.balance.burstStaminaCost, this.maxStamina);
  }

  get moveSpeed(): number {
    if (!this.burstActive) return this._moveSpeed;
    return this._moveSpeed * (1 + this.balance.burstMoveSpeedBonusRatio);
  }

  get staminaRecoveryPerSecond(): number {
    return this._maxStamina * this.balance.staminaRecoveryRate;
  }

  get damage(): number {
    return Math.max(1, Math.round(this.getCurrentValues().damage));
  }

  get blowDamage(): number {
    return Math.max(
      1,
      Math.round(this.scaleDamage(this.balance.blowDamageMultiplier)),
    );
  }

  get burstActive(): boolean {
    return this._burstTimerMs > 0;
  }

  get burstDurationMs(): number {
    return this.balance.burstDurationSec * 1000;
  }

  get playerScale(): number {
    return this.balance.baseValues.scale;
  }

  get burstTimerMs(): number {
    return this._burstTimerMs;
  }

  get primaryFireIntervalMultiplier(): number {
    if (!this.burstActive) return 1;
    return 1 / (1 + this.balance.burstFireRateBonusRatio);
  }

  get primaryReloadDurationMultiplier(): number {
    if (!this.burstActive) return 1;
    return 1 / (1 + this.balance.burstReloadSpeedBonusRatio);
  }

  private initializeState(): void {
    this._totalXp =
      typeof this.balance.baseValues.xp === "number"
        ? this.balance.baseValues.xp
        : 0;
    this._scorePoints = this.balance.baseValues.score ?? 0;
    this._credits = this.balance.baseValues.credits ?? 0;
    this.syncLevelFromXp();
    this.recomputeAllFromLevel(true);
  }

  private getCurrentValues(): PlayerCombatValues {
    const base = this.balance.baseValues;
    const growth = this.balance.levelGrowth;
    const steps = Math.max(0, this._level - 1);
    return {
      hp: base.hp + steps * growth.hp_per_level,
      damage: base.damage + steps * growth.damage_per_level,
      stamina: base.stamina + steps * growth.stamina_per_level,
      speed: base.speed + steps * growth.speed_per_level,
    };
  }

  private recomputeAllFromLevel(isInitial: boolean): void {
    const values = this.getCurrentValues();
    const newMaxHealth = values.hp;
    const newMaxStamina = values.stamina;
    const newMoveSpeed = values.speed;

    if (isInitial) {
      this._maxHealth = newMaxHealth;
      this._health = newMaxHealth;
      this._maxStamina = newMaxStamina;
      this._stamina = newMaxStamina;
      this._moveSpeed = newMoveSpeed;
      return;
    }

    const healthRatio =
      this._maxHealth > 0 ? this._health / this._maxHealth : 1;
    const staminaRatio =
      this._maxStamina > 0 ? this._stamina / this._maxStamina : 1;

    this._maxHealth = newMaxHealth;
    this._maxStamina = newMaxStamina;
    this._moveSpeed = newMoveSpeed;
    this._health = Math.min(
      newMaxHealth,
      Math.round(newMaxHealth * healthRatio),
    );
    this._stamina = Math.min(
      newMaxStamina,
      Math.round(newMaxStamina * staminaRatio),
    );
  }

  private syncLevelFromXp(): void {
    const thresholds = this.balance.levelXpThresholds;
    let level = 1;
    for (let nextLevel = 2; nextLevel <= 50; nextLevel++) {
      const neededXp = thresholds[nextLevel - 1] ?? 0;
      if (this._totalXp >= neededXp) level = nextLevel;
      else break;
    }
    this._level = level;
  }

  private tickState(deltaMs: number): void {
    if (this._stamina < this._maxStamina) {
      const recovery =
        this._maxStamina * this.balance.staminaRecoveryRate * (deltaMs / 1000);
      this._stamina = Math.min(this._maxStamina, this._stamina + recovery);
    }

    this._dashCooldownTimerMs = Math.max(
      0,
      this._dashCooldownTimerMs - deltaMs,
    );
    this._blowCooldownTimerMs = Math.max(
      0,
      this._blowCooldownTimerMs - deltaMs,
    );
    this._burstCooldownTimerMs = Math.max(
      0,
      this._burstCooldownTimerMs - deltaMs,
    );
    this._burstTimerMs = Math.max(0, this._burstTimerMs - deltaMs);

    if (this.burstActive) this.syncBurstVisuals();
    else if (this.burstAura) this.disableBurstVisuals();
  }

  private enableBurstVisuals(): void {
    this.setTint(hexToNumber(theme.semantic.fx.grenade));
    if (!this.burstAura) {
      this.burstAura = this.scene.add.circle(
        this.x,
        this.y,
        22,
        hexToNumber(theme.semantic.fx.grenade),
        0.16,
      );
      this.burstAura.setDepth(this.depth - 1);
      this.burstAura.setStrokeStyle(
        2,
        hexToNumber(theme.semantic.fx.grenade_burst),
        0.85,
      );
    }

    if (!this.burstAuraTween) {
      this.burstAuraTween = this.scene.tweens.add({
        targets: this.burstAura,
        alpha: { from: 0.14, to: 0.38 },
        scale: { from: 0.95, to: 1.4 },
        duration: 280,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.syncBurstVisuals();
  }

  private syncBurstVisuals(): void {
    if (!this.burstAura) return;
    this.burstAura.setPosition(this.x, this.y);
  }

  private playLevelUpEffect(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: this.playerScale * 1.16,
      scaleY: this.playerScale * 1.16,
      duration: 300,
      yoyo: true,
      repeat: 1,
      ease: "Back.Out",
      onComplete: () => {
        if (this.active) this.setScale(this.playerScale);
      },
    });

    const ring = this.scene.add
      .circle(this.x, this.y, 20, hexToNumber(theme.semantic.fx.grenade), 0.18)
      .setDepth(this.depth - 1)
      .setStrokeStyle(2, hexToNumber(theme.semantic.text.success), 0.9);
    const text = this.scene.add
      .text(this.x, this.y - 34, `LVL ${this._level}`, {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.display_md,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.success,
        stroke: theme.semantic.surface.menu,
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(this.depth + 1);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 3.2,
      scaleY: 3.2,
      alpha: 0,
      duration: 360,
      ease: "Cubic.Out",
      onComplete: () => ring.destroy(),
    });
    this.scene.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: 650,
      ease: "Cubic.Out",
      onComplete: () => text.destroy(),
    });
  }

  private disableBurstVisuals(): void {
    this.clearTint();
    this.burstAuraTween?.stop();
    this.burstAuraTween = undefined;
    this.burstAura?.destroy();
    this.burstAura = undefined;
  }
}
