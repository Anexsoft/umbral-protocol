import * as Phaser from "phaser";

import {
  enemyStatMultiplier,
  enemyVisualScale,
} from "@data/enemies/enemy-level-scaling";
import { getGameData } from "@data/game-data";
import { getTheme, hexToNumber } from "@data/theme/theme";
import type { EnemyAttackType } from "@data/enemies/types";

import { EnemyMovementHandler } from "@gameplay/enemies/handlers/movement/enemy-movement.handler";
import type { EnemyTypeId } from "@gameplay/enemies/types";
import type { Player } from "@gameplay/player/player";

const theme = getTheme();
const RANGED_PROJECTILE_RADIUS = 6;
const RANGED_PROJECTILE_SPEED_PX = 280;
const RANGED_PROJECTILE_LIFETIME_MS = 2200;
const RANGED_ATTACK_COOLDOWN_MS = 1300;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly target: Player;

  private static readonly KNOCKBACK_DURATION_MS = 120;

  private readonly movementHandler: EnemyMovementHandler;
  private readonly level: number;
  private readonly knockbackVelocity = new Phaser.Math.Vector2(0, 0);
  private enemyName = "";
  private health = 0;
  private maxHealth = 0;
  private _speed = 0;
  private defense = 0;
  private rolledCredits = 0;
  private rolledScore = 0;
  private rolledXp = 0;
  private attackDamage = 0;
  private isBoss = false;
  private isDying = false;
  private attackType: EnemyAttackType = "melee";
  private attackRange = 48;
  private rangedAttackCooldownMs = 0;
  private knockbackTimerMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: EnemyTypeId,
    level: number,
    target: Player,
  ) {
    super(scene, x, y, id);
    this.target = target;
    this.level = level;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setImmovable(false);
    this.setBounce(0.3);
    this.movementHandler = new EnemyMovementHandler();
    this.initializeFromEntry(id);
    this.refreshHealthTint();
  }

  update(_time?: number, deltaMs = 16): void {
    if (!this.isAlive || !this.target.isAlive) {
      this.setVelocity(0, 0);
      return;
    }

    if (this.knockbackActive) {
      this.setVelocity(this.knockbackX, this.knockbackY);
      this.tickKnockback(deltaMs);
      return;
    }

    this.rangedAttackCooldownMs = Math.max(
      0,
      this.rangedAttackCooldownMs - deltaMs,
    );

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y,
    );
    this.setRotation(angle);

    if (this.attackType === "range") {
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.target.x,
        this.target.y,
      );

      if (distance <= this.attackRange) {
        this.setVelocity(0, 0);
        if (this.rangedAttackCooldownMs === 0) {
          this.fireProjectile(angle);
          this.rangedAttackCooldownMs = RANGED_ATTACK_COOLDOWN_MS;
        }
        return;
      }
    }

    this.movementHandler.handle({ enemy: this, deltaMs });
  }

  applyKnockbackFrom(fromX: number, fromY: number, force: number): void {
    if (!this.active || !this.body || !this.isAlive || force <= 0) return;

    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.knockbackVelocity.set((dx / len) * force, (dy / len) * force);
    this.knockbackTimerMs = Enemy.KNOCKBACK_DURATION_MS;
    this.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
  }

  takeDamage(amount: number, isCritical = false): void {
    const damage = Math.round(Math.max(1, amount * (1 - this.defense)));
    this.health = Math.max(0, this.health - damage);
    this.showDamagePopup(damage, isCritical);
    this.applyDamageEffect();
    this.refreshHealthTint();

    if (this.health === 0) {
      this.die();
    }
  }

  get enemyDisplayName(): string {
    return this.enemyName;
  }

  get isAlive(): boolean {
    return this.health > 0;
  }

  get contactDamage(): number {
    return this.attackDamage;
  }

  get canDealContactDamage(): boolean {
    return this.attackType === "melee";
  }

  get boss(): boolean {
    return this.isBoss;
  }

  get speed(): number {
    return this._speed;
  }

  get knockbackActive(): boolean {
    return this.knockbackTimerMs > 0;
  }

  get knockbackX(): number {
    return this.knockbackVelocity.x;
  }

  get knockbackY(): number {
    return this.knockbackVelocity.y;
  }

  tickKnockback(deltaMs: number): void {
    if (this.knockbackTimerMs <= 0) return;

    this.knockbackTimerMs = Math.max(0, this.knockbackTimerMs - deltaMs);
    this.knockbackVelocity.scale(0.88);

    if (this.knockbackTimerMs === 0) {
      this.knockbackVelocity.set(0, 0);
    }
  }

  private initializeFromEntry(id: EnemyTypeId): void {
    const entry = getGameData().enemyById.get(id);
    if (!entry) throw new Error(`Enemy id "${id}" not found in data.`);

    const scaling = getGameData().enemyLevelScaling;
    const levelScale = enemyStatMultiplier(this.level, scaling);
    const stats = entry.base_stats;

    this.isBoss = entry.boss ?? false;
    this.attackType = entry.attack_id ?? "melee";
    this.attackRange = entry.attack_range ?? 48;
    this.enemyName = entry.name;
    this.maxHealth = Math.round(stats.vit * levelScale);
    this.health = this.maxHealth;
    this._speed = Math.round(stats.speed * levelScale);
    this.defense = stats.defense * levelScale;
    this.attackDamage = Math.max(1, Math.round(stats.attack * levelScale));

    const [rewardMin, rewardMax] = stats.rewards;
    const [scoreMin, scoreMax] = stats.score;
    const xpRange = stats.xp ?? stats.score;
    const [xpMin, xpMax] = xpRange;

    this.rolledCredits = Phaser.Math.Between(
      Math.round(rewardMin * levelScale),
      Math.round(rewardMax * levelScale),
    );
    this.rolledScore = Phaser.Math.Between(
      Math.round(scoreMin * levelScale),
      Math.round(scoreMax * levelScale),
    );
    this.rolledXp = Phaser.Math.Between(
      Math.round(xpMin * levelScale),
      Math.round(xpMax * levelScale),
    );

    this.setScale(
      enemyVisualScale(stats.scale, this.level, this.isBoss, scaling),
    );
  }

  private fireProjectile(angle: number): void {
    const projectile = this.scene.add.circle(
      this.x,
      this.y,
      RANGED_PROJECTILE_RADIUS,
      hexToNumber(theme.semantic.fx.laser),
      0.9,
    );
    this.scene.physics.add.existing(projectile);

    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(RANGED_PROJECTILE_RADIUS);
    body.setVelocity(
      Math.cos(angle) * RANGED_PROJECTILE_SPEED_PX,
      Math.sin(angle) * RANGED_PROJECTILE_SPEED_PX,
    );

    this.scene.physics.add.overlap(projectile, this.target, () => {
      if (!projectile.active || !this.target.isAlive) return;
      this.target.applyDamage(this.attackDamage);
      projectile.destroy();
    });

    this.scene.time.delayedCall(RANGED_PROJECTILE_LIFETIME_MS, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  private refreshHealthTint(): void {
    if (!this.isAlive || this.health <= 0) return;

    const ratio = this.maxHealth > 0 ? this.health / this.maxHealth : 0;

    if (ratio <= 0.22) {
      this.setTint(hexToNumber(theme.semantic.fx.enemy_tint_high));
    } else if (ratio <= 0.38) {
      this.setTint(hexToNumber(theme.semantic.fx.enemy_tint_mid));
    } else if (ratio <= 0.55) {
      this.setTint(hexToNumber(theme.semantic.fx.enemy_tint_low));
    } else {
      this.clearTint();
    }
  }

  private applyDamageEffect(): void {
    if (!this.active || this.isDying) return;

    const baseScaleX = this.scaleX;
    const baseScaleY = this.scaleY;
    this.setTint(hexToNumber(theme.semantic.text.primary)).setTintMode(
      Phaser.TintModes.FILL,
    );

    this.scene.tweens.add({
      targets: this,
      scaleX: baseScaleX * 1.06,
      scaleY: baseScaleY * 1.06,
      alpha: 0.96,
      duration: 80,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.active || this.isDying) return;

        this.setScale(baseScaleX, baseScaleY);
        this.refreshHealthTint();
      },
    });
  }

  private showDamagePopup(amount: number, isCritical = false): void {
    const damageText = this.scene.add.text(
      this.x,
      this.y - 20,
      isCritical ? `-${amount}!` : `-${amount}`,
      {
        fontFamily: theme.typography.fonts.display,
        fontSize: isCritical
          ? theme.typography.sizes.display_lg
          : theme.typography.sizes.display_md,
        fontStyle: theme.typography.weights.bold,
        color: isCritical
          ? theme.semantic.text.warning
          : theme.semantic.fx.damage_popup_fill,
        stroke: theme.semantic.fx.damage_popup_stroke,
        strokeThickness: 3,
      },
    );
    damageText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: this.y - 60,
      alpha: 0,
      duration: 800,
      ease: "Cubic.out",
      onComplete: () => damageText.destroy(),
    });
  }

  private die(): void {
    if (this.isDying) return;

    this.isDying = true;
    this.scene.tweens.killTweensOf(this);
    this.clearTint();
    this.setVelocity(0, 0);
    this.disableBody(true, false);

    this.scene.events.emit("enemy:defeated", {
      credits: this.rolledCredits,
      score: this.rolledScore,
      xp: this.rolledXp,
      x: this.x,
      y: this.y,
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: this.scaleX * 0.88,
      scaleY: this.scaleY * 0.88,
      y: this.y - 12,
      duration: 180,
      ease: "Cubic.Out",
      onComplete: () => this.destroy(),
    });
  }
}
