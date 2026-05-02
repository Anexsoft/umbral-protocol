import * as Phaser from "phaser";

const BULLET_SPEED = 2000;
const BULLET_BASE_SCALE = 1.5;

export class Bullet extends Phaser.Physics.Arcade.Image {
  readonly angle: number;
  private readonly speed: number;
  private readonly damageAmount: number;
  readonly knockback: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    damage: number,
    scaleFactor: number,
    knockback = 0,
  ) {
    super(scene, x, y, "bullet-circle");

    this.angle = angle;
    this.speed = BULLET_SPEED;
    this.damageAmount = damage;
    this.knockback = knockback;

    const scale = BULLET_BASE_SCALE * (1 + scaleFactor);
    this.scale = scale;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(scale);
    this.setDepth(20);
  }

  get damage(): number {
    return this.damageAmount;
  }

  update(): void {
    this.setVelocity(
      Math.cos(this.angle) * this.speed,
      Math.sin(this.angle) * this.speed,
    );

    const bounds = this.scene.physics.world.bounds;

    if (
      this.x < bounds.x ||
      this.x > bounds.right ||
      this.y < bounds.y ||
      this.y > bounds.bottom
    ) {
      this.destroy();
    }
  }
}
