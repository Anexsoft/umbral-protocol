import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Enemy } from "@gameplay/enemies/enemy";
import type { SecondaryWeapon } from "@gameplay/weapons/secondary/secondary-weapon";

const theme = getTheme();

type SecondaryWeaponAttackHandlerInput = {
  weapon: SecondaryWeapon;
  x: number;
  y: number;
  scaledDamage?: number;
};

export class SecondaryWeaponAttackHandler {
  handle({
    weapon,
    x,
    y,
    scaledDamage,
  }: SecondaryWeaponAttackHandlerInput): boolean {
    if (!weapon.isReady) {
      return false;
    }

    const pointer = weapon.scene.input.activePointer;
    const worldPoint = weapon.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y,
    );
    const angle = Phaser.Math.Angle.Between(x, y, worldPoint.x, worldPoint.y);
    this.performMeleeHit(weapon, x, y, angle, scaledDamage ?? 1);

    weapon.isReady = false;
    weapon.cooldownTimerMs = weapon.cooldownTimeSec * 1000;
    return true;
  }

  private performMeleeHit(
    weapon: SecondaryWeapon,
    x: number,
    y: number,
    angle: number,
    damage: number,
  ): void {
    const slashRadius = weapon.attackRadius;
    const halfArc = Phaser.Math.DegToRad(48);
    const sceneWithEnemies = weapon.scene as Phaser.Scene & {
      enemies?: Phaser.Physics.Arcade.Group;
    };
    const enemies = (sceneWithEnemies.enemies?.getChildren() ?? []) as Enemy[];

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive) continue;

      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      const enemyRadius =
        Math.max(enemy.displayWidth, enemy.displayHeight) * 0.35;
      const enemyAngle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));

      if (distance <= slashRadius + enemyRadius && angleDiff <= halfArc) {
        enemy.takeDamage(damage);
      }
    }

    const flash = weapon.scene.add.graphics();
    const fillColor = hexToNumber(theme.semantic.gfx.melee_flash);
    const points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(x, y)];

    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      const arcAngle = angle - halfArc + halfArc * 2 * t;
      points.push(
        new Phaser.Math.Vector2(
          x + Math.cos(arcAngle) * slashRadius,
          y + Math.sin(arcAngle) * slashRadius,
        ),
      );
    }

    flash.setDepth(60);
    flash.fillStyle(fillColor, 0.32);
    flash.lineStyle(3, fillColor, 0.9);
    flash.beginPath();
    flash.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      flash.lineTo(point.x, point.y);
    }
    flash.closePath();
    flash.fillPath();
    flash.strokePath();

    weapon.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 120,
      onComplete: () => flash.destroy(),
    });
  }
}
