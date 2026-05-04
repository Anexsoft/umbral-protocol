import * as Phaser from "phaser";

import { BASE_UNIT_PX } from "@config/constants";

import { getTheme, hexToNumber } from "@data/theme/theme";

const theme = getTheme();
const DEFAULT_LIFETIME_MS = 7000;

export type ConsumablePickupKind = "health" | "stamina";

export class ConsumablePickup extends Phaser.GameObjects.Container {
  readonly kind: ConsumablePickupKind;
  readonly ratio: number;

  private readonly glow: Phaser.GameObjects.Arc;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly core: Phaser.GameObjects.Arc;
  private glowTween?: Phaser.Tweens.Tween;
  private blinkTween?: Phaser.Tweens.Tween;
  private bobTween?: Phaser.Tweens.Tween;
  private warningTimer?: Phaser.Time.TimerEvent;
  private expireTimer?: Phaser.Time.TimerEvent;
  private bobBaseY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: ConsumablePickupKind,
    ratio: number,
    scale = 1,
    lifetimeMs = DEFAULT_LIFETIME_MS,
  ) {
    super(scene, x, y);

    this.kind = kind;
    this.ratio = Math.max(0, ratio);
    this.bobBaseY = y;

    const color = this.getTintColor();
    const visualScale = Math.max(0.25, scale);
    const sizePx = BASE_UNIT_PX * visualScale;
    const glowRadius = Math.round(sizePx * 0.5);
    const ringRadius = Math.round(sizePx * 0.34);
    const coreRadius = Math.round(sizePx * 0.22);

    this.glow = scene.add
      .circle(0, 0, glowRadius, color, 0.18)
      .setStrokeStyle(1, color, 0.3);
    this.ring = scene.add
      .circle(0, 0, ringRadius, color, 0.15)
      .setStrokeStyle(2, color, 0.95);
    this.core = scene.add.circle(0, 0, coreRadius, color, 0.95);

    this.add([this.glow, this.ring, this.core]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const bodyRadius = Math.max(
      ringRadius,
      coreRadius + Math.round(sizePx * 0.06),
    );
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.pushable = false;
    body.setCircle(bodyRadius, -bodyRadius, -bodyRadius);

    this.glowTween = scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.12, to: 0.32 },
      scaleX: { from: 0.94, to: 1.08 },
      scaleY: { from: 0.94, to: 1.08 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.blinkTween = scene.tweens.add({
      targets: [this.ring, this.core],
      alpha: { from: 0.72, to: 1 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.bobTween = scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const warningDelay = Math.max(0, lifetimeMs - 1200);
    this.warningTimer = scene.time.delayedCall(warningDelay, () => {
      this.blinkTween?.stop();
      this.blinkTween = scene.tweens.add({
        targets: [this.ring, this.core, this.glow],
        alpha: { from: 0.25, to: 1 },
        duration: 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    this.expireTimer = scene.time.delayedCall(lifetimeMs, () => this.expire());
  }

  attractTo(targetX: number, targetY: number, deltaMs: number): void {
    if (!this.active) return;

    this.bobTween?.stop();
    this.bobTween = undefined;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) return;

    const speed = Phaser.Math.Clamp(180 + distance * 3.2, 180, 540);
    const step = Math.min(distance, (speed * deltaMs) / 1000);
    const nextX = this.x + (dx / distance) * step;
    const nextY = this.y + (dy / distance) * step;

    this.setPosition(nextX, nextY);
    this.bobBaseY = nextY;

    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    body?.updateFromGameObject();
  }

  collect(): void {
    if (!this.active) return;
    this.disableBody();
    this.stopRuntimeTweens();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      y: this.y - 8,
      duration: 160,
      ease: "Cubic.Out",
      onComplete: () => this.destroy(),
    });
  }

  expire(): void {
    if (!this.active) return;
    this.disableBody();
    this.stopRuntimeTweens();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.82,
      scaleY: 0.82,
      duration: 220,
      ease: "Quad.In",
      onComplete: () => this.destroy(),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.stopRuntimeTweens();
    this.warningTimer?.destroy();
    this.expireTimer?.destroy();
    super.destroy(fromScene);
  }

  private disableBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.enable = false;
    }
  }

  private stopRuntimeTweens(): void {
    this.glowTween?.stop();
    this.blinkTween?.stop();
    this.bobTween?.stop();
  }

  private getTintColor(): number {
    return this.kind === "health"
      ? hexToNumber(theme.semantic.gfx.life)
      : hexToNumber(theme.semantic.gfx.stamina);
  }
}
