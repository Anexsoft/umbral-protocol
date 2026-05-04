import * as Phaser from "phaser";

import { BASE_UNIT_PX } from "@config/constants";

import { getTheme, hexToNumber } from "@data/theme/theme";

import type { Enemy } from "@gameplay/enemies/Enemy";
import type { SecondaryWeapon } from "@gameplay/weapons/secondary/secondary-weapon";

const theme = getTheme();
const KNIFE_HAND_OFFSET_PX = BASE_UNIT_PX * 0.34;

type SecondaryWeaponAttackHandlerInput = {
  weapon: SecondaryWeapon;
  x: number;
  y: number;
  scaledDamage?: number;
  playerLevel?: number;
};

export class SecondaryWeaponAttackHandler {
  handle({
    weapon,
    x,
    y,
    scaledDamage,
    playerLevel,
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
    this.performMeleeHit(
      weapon,
      x,
      y,
      angle,
      scaledDamage ?? 1,
      playerLevel ?? 1,
    );

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
    playerLevel: number,
  ): void {
    const slashRadius = weapon.getRadius(playerLevel);
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
    flash.setDepth(60);
    const originX = x + Math.cos(angle) * KNIFE_HAND_OFFSET_PX;
    const originY = y + Math.sin(angle) * KNIFE_HAND_OFFSET_PX;

    const swingState = {
      sweep: 0,
      reach: 0,
      alpha: 1,
    };

    const renderSwing = (): void => {
      const sweepAngle = angle - halfArc + halfArc * 2 * swingState.sweep;
      const tipX = originX + Math.cos(sweepAngle) * swingState.reach;
      const tipY = originY + Math.sin(sweepAngle) * swingState.reach;
      const bladeWidth = Math.max(10, slashRadius * 0.16);
      const normalAngle = sweepAngle + Math.PI / 2;
      const innerRadius = Math.max(10, swingState.reach * 0.22);

      const baseLeft = new Phaser.Math.Vector2(
        originX + Math.cos(normalAngle) * bladeWidth * 0.35,
        originY + Math.sin(normalAngle) * bladeWidth * 0.35,
      );
      const baseRight = new Phaser.Math.Vector2(
        originX - Math.cos(normalAngle) * bladeWidth * 0.35,
        originY - Math.sin(normalAngle) * bladeWidth * 0.35,
      );
      const midLeft = new Phaser.Math.Vector2(
        originX + Math.cos(sweepAngle) * innerRadius +
          Math.cos(normalAngle) * bladeWidth * 0.5,
        originY + Math.sin(sweepAngle) * innerRadius +
          Math.sin(normalAngle) * bladeWidth * 0.5,
      );
      const midRight = new Phaser.Math.Vector2(
        originX + Math.cos(sweepAngle) * innerRadius -
          Math.cos(normalAngle) * bladeWidth * 0.5,
        originY + Math.sin(sweepAngle) * innerRadius -
          Math.sin(normalAngle) * bladeWidth * 0.5,
      );

      flash.clear();
      flash.fillStyle(fillColor, 0.22 * swingState.alpha);
      flash.lineStyle(4, fillColor, 0.95 * swingState.alpha);
      flash.beginPath();
      flash.moveTo(baseLeft.x, baseLeft.y);
      flash.lineTo(midLeft.x, midLeft.y);
      flash.lineTo(tipX, tipY);
      flash.lineTo(midRight.x, midRight.y);
      flash.lineTo(baseRight.x, baseRight.y);
      flash.closePath();
      flash.fillPath();
      flash.strokePath();

      flash.lineStyle(2, fillColor, 0.65 * swingState.alpha);
      flash.beginPath();
      flash.moveTo(originX, originY);
      flash.lineTo(tipX, tipY);
      flash.strokePath();
    };

    renderSwing();

    weapon.scene.tweens.add({
      targets: swingState,
      sweep: 1,
      reach: slashRadius,
      alpha: 0,
      ease: "Cubic.Out",
      duration: 210,
      onUpdate: renderSwing,
      onComplete: () => flash.destroy(),
    });
  }
}
