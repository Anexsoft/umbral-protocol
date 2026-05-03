import * as Phaser from "phaser";

import { getTheme, hexToNumber } from "@data/theme/theme";

const theme = getTheme();

export class CreditPickup extends Phaser.GameObjects.Container {
  readonly credits: number;

  private readonly glow: Phaser.GameObjects.Rectangle;
  private readonly box: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private glowTween?: Phaser.Tweens.Tween;
  private blinkTween?: Phaser.Tweens.Tween;
  private bobTween?: Phaser.Tweens.Tween;
  private bobBaseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, credits: number) {
    super(scene, x, y);

    this.credits = Math.max(0, Math.round(credits));
    this.bobBaseY = y;

    this.glow = scene.add
      .rectangle(0, 0, 52, 24, hexToNumber(theme.semantic.fx.health_pack), 0.18)
      .setStrokeStyle(1, hexToNumber(theme.semantic.fx.health_pack), 0.32);
    this.box = scene.add
      .rectangle(
        0,
        0,
        36,
        16,
        hexToNumber(theme.semantic.surface.overlay),
        0.92,
      )
      .setStrokeStyle(1, hexToNumber(theme.semantic.fx.health_pack), 0.9);
    this.label = scene.add
      .text(0, 0, this.formatValue(), {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.success,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, theme.semantic.text.success, 8, true, true);

    this.add([this.glow, this.box, this.label]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.pushable = false;
    body.setCircle(16, -16, -16);

    this.glowTween = scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.12, to: 0.28 },
      scaleX: { from: 0.96, to: 1.08 },
      scaleY: { from: 0.96, to: 1.08 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.blinkTween = scene.tweens.add({
      targets: [this.box, this.label],
      alpha: { from: 0.7, to: 1 },
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

    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.enable = false;
    }
    this.glowTween?.stop();
    this.blinkTween?.stop();
    this.bobTween?.stop();

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

  override destroy(fromScene?: boolean): void {
    this.glowTween?.stop();
    this.blinkTween?.stop();
    this.bobTween?.stop();
    super.destroy(fromScene);
  }

  private formatValue(): string {
    return `+${this.credits.toString().padStart(2, "0")}`;
  }
}
