import * as Phaser from "phaser";

import {
  DEBUG_GRID_SIZE_PX,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@config/constants";

import { SceneKey } from "@core/scene-key";

import { getGameData } from "@data/game-data";
import { getTheme, hexToNumber } from "@data/theme/theme";
import type { RoundSpawnEntry } from "@data/rounds/types";

import { Enemy } from "@gameplay/enemies/Enemy";
import { CreditPickup } from "@gameplay/pickups/credit-pickup";
import {
  ConsumablePickup,
  type ConsumablePickupKind,
} from "@gameplay/pickups/consumable-pickup";
import { BlowSkillImpactHandler } from "@gameplay/player/handlers/skills/blow-skill-impact.handler";
import { Player } from "@gameplay/player/player";
import type { BlowSkillPayload, PlayerInput } from "@gameplay/player/types";
import { Bullet } from "@gameplay/weapons/primary/bullet";

import { GameWaveHandler } from "@scenes/game/handlers/game-wave.handler";
import { GameIntermissionOverlay } from "@scenes/game/overlay/game-intermission.overlay";
import { GameOverlay } from "@scenes/game/overlay/game-overlay.overlay";

const PLAYER_CONTACT_INVULN_MS = 480;
const SKILL_BLOW = "skill:blow";
const ENEMY_DEFEATED = "enemy:defeated";

const ROUND_INTRO_MS = 2200;
const OVERLAY_DEPTH = 14000;
const PICKUP_MAGNET_RADIUS = 140;
const ROUND_END_CREDIT_PULL_RADIUS = 99999;
const theme = getTheme();

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private creditPickups!: Phaser.Physics.Arcade.Group;
  private consumablePickups!: Phaser.Physics.Arcade.Group;
  private readonly blowSkillImpactHandler = new BlowSkillImpactHandler();
  private readonly intermissionOverlay = new GameIntermissionOverlay();
  private readonly gameOverlay = new GameOverlay();
  private readonly waveHandler = new GameWaveHandler();
  private readonly preventContextMenu = (event: Event) =>
    event.preventDefault();
  private readonly preventBrowserTabDefault = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
    }
  };
  private readonly pauseHandler = () => {
    if (this.roundUiBlocking) return;
    if (!this.player?.isAlive) return;
    if (this.scene.isActive(SceneKey.PauseHud)) return;

    this.scene.pause(SceneKey.Game);
    this.scene.pause(SceneKey.PlayerHud);
    this.scene.launch(SceneKey.PauseHud, { player: this.player });
  };

  private playerContactCooldownMs = 0;
  private handledPlayerDeath = false;

  private waves: RoundSpawnEntry[][] = [];
  private waveIndex = 0;
  private hostilesRemaining = 0;
  private roundDefeatCount = 0;
  private plannedConsumableDropKills = new Set<number>();
  private roundConsumableCount = 0;
  private roundUiBlocking = false;
  private awaitingRoundCreditCleanup = false;
  private intermissionCleanup?: () => void;
  private intermissionContinueHandler?: () => void;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    this.game.canvas.addEventListener("contextmenu", this.preventContextMenu);
    window.addEventListener("keydown", this.preventBrowserTabDefault);

    this.keys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      key1: Phaser.Input.Keyboard.KeyCodes.ONE,
      key2: Phaser.Input.Keyboard.KeyCodes.TWO,
      key3: Phaser.Input.Keyboard.KeyCodes.THREE,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      keyR: Phaser.Input.Keyboard.KeyCodes.R,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      e: Phaser.Input.Keyboard.KeyCodes.E,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(
      hexToNumber(theme.semantic.surface.gameplay),
    );

    this.drawGrid();

    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.creditPickups = this.physics.add.group({ runChildUpdate: false });
    this.consumablePickups = this.physics.add.group({ runChildUpdate: false });
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.waves = getGameData().roundWaves;
    if (this.waves.length === 0) {
      throw new Error("No rounds defined in rounds.yml");
    }

    this.game.registry.set("match:round", 1);
    this.game.registry.set("match:hostiles", 0);

    this.physics.add.collider(
      this.player,
      this.enemies,
      (_playerSprite, enemySprite) => {
        const enemy = enemySprite as Enemy;
        if (!enemy.isAlive || !this.player.isAlive) return;
        if (!enemy.canDealContactDamage) return;
        if (this.playerContactCooldownMs > 0) return;

        this.player.applyDamage(enemy.contactDamage);
        enemy.startAttackCooldown();
        this.playerContactCooldownMs = PLAYER_CONTACT_INVULN_MS;
      },
    );

    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(
      this.player,
      this.creditPickups,
      (_playerObj, pickupObj) => {
        const pickup = pickupObj as CreditPickup;
        if (!pickup.active) return;

        this.player.addCredits(pickup.credits);
        pickup.collect();
      },
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.consumablePickups,
      (_playerObj, pickupObj) => {
        const pickup = pickupObj as ConsumablePickup;
        if (!pickup.active) return;

        if (pickup.kind === "health") {
          this.player.healByRatio(pickup.ratio);
        } else {
          this.player.restoreStaminaByRatio(pickup.ratio);
        }

        pickup.collect();
      },
      undefined,
      this,
    );

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scene.launch(SceneKey.PlayerHud, { player: this.player });

    this.physics.add.overlap(
      this.player.primaryWeapon.bullets,
      this.enemies,
      (bulletObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        const bullet = bulletObj as Bullet;

        if (!enemy.isAlive) return;

        enemy.takeDamage(bullet.damage, bullet.isCritical);
        if (bullet.knockback > 0 && enemy.active && enemy.isAlive) {
          enemy.applyKnockbackFrom(bullet.x, bullet.y, bullet.knockback);
        }
        bullet.destroy();
      },
      undefined,
      this,
    );

    this.events.on(SKILL_BLOW, this.onSkillBlow, this);
    this.events.on(ENEMY_DEFEATED, this.onEnemyDefeated, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(SKILL_BLOW, this.onSkillBlow, this);
      this.events.off(ENEMY_DEFEATED, this.onEnemyDefeated, this);
      this.clearIntermissionTimer();
      this.game.canvas.removeEventListener(
        "contextmenu",
        this.preventContextMenu,
      );
      window.removeEventListener("keydown", this.preventBrowserTabDefault);
      this.input.keyboard?.off("keydown-ESC", this.pauseHandler);
    });

    this.input.keyboard!.on("keydown-ESC", this.pauseHandler);

    this.beginMatchFlow();
  }

  private beginMatchFlow(): void {
    const configuredRound = getGameData().gameSettings.startRound;
    const startRound = Phaser.Math.Clamp(
      configuredRound,
      1,
      Math.max(1, this.waves.length),
    );

    this.waveIndex = startRound - 1;
    this.showRoundIntroBanner(startRound, () => {
      this.spawnWave(this.waveIndex);
      this.roundUiBlocking = false;
      this.physics.resume();
    });
  }

  private showRoundIntroBanner(roundDisplay: number, onDone: () => void): void {
    this.roundUiBlocking = true;
    this.physics.pause();
    this.player.setVelocity(0, 0);
    this.gameOverlay.show({
      id: "show-round-intro",
      scene: this,
      depth: OVERLAY_DEPTH,
      delayMs: ROUND_INTRO_MS,
      roundDisplay,
      onDone,
    });
  }

  private spawnWave(index: number): void {
    const wave = this.waves[index];
    if (!wave?.length) return;

    this.roundDefeatCount = 0;
    this.roundConsumableCount =
      getGameData().roundConsumables[index]?.total ?? 0;
    this.plannedConsumableDropKills = this.planConsumableDropKills(
      wave.length,
      this.roundConsumableCount,
    );

    this.hostilesRemaining = this.waveHandler.handle({
      id: "spawn-wave",
      scene: this,
      enemies: this.enemies,
      player: this.player,
      wave,
    });
    this.game.registry.set("match:round", index + 1);
    this.game.registry.set("match:hostiles", this.hostilesRemaining);
  }

  private onEnemyDefeated(payload?: {
    credits: number;
    xp: number;
    x: number;
    y: number;
  }): void {
    if (!this.player?.isAlive || this.roundUiBlocking) return;

    const p = payload ?? { credits: 0, xp: 0, x: 0, y: 0 };
    this.player.addKillRewards(0, p.xp);
    this.roundDefeatCount += 1;

    if (p.credits > 0) {
      this.spawnCreditPickup(p.x, p.y, p.credits);
    }
    if (this.plannedConsumableDropKills.has(this.roundDefeatCount)) {
      this.spawnConsumablePickup(p.x, p.y);
    }

    this.hostilesRemaining = Math.max(0, this.hostilesRemaining - 1);
    this.game.registry.set("match:hostiles", this.hostilesRemaining);

    if (this.hostilesRemaining > 0) return;

    this.onWaveCleared();
  }

  private onWaveCleared(): void {
    if (this.waveIndex >= this.waves.length - 1) {
      this.showVictoryOverlay();
      return;
    }

    this.collectRoundEndCredits();
  }

  private collectRoundEndCredits(): void {
    const remainingCredits = this.getActiveCreditPickups();
    if (remainingCredits.length === 0) {
      this.beginIntermission();
      return;
    }

    this.awaitingRoundCreditCleanup = true;
    this.player.setVelocity(0, 0);
  }

  private clearIntermissionTimer(): void {
    if (this.intermissionContinueHandler) {
      this.input.off("pointerdown", this.intermissionContinueHandler);
      this.intermissionContinueHandler = undefined;
    }
    if (this.intermissionCleanup) {
      this.intermissionCleanup();
      this.intermissionCleanup = undefined;
    }
  }

  private beginIntermission(): void {
    this.roundUiBlocking = true;
    this.physics.pause();
    this.player.setVelocity(0, 0);
    this.clearIntermissionTimer();

    const controls = this.intermissionOverlay.show({
      scene: this,
      depth: OVERLAY_DEPTH,
      onProceed: () => {
        this.clearIntermissionTimer();
        this.waveIndex += 1;
        const roundDisplay = this.waveIndex + 1;
        this.showRoundIntroBanner(roundDisplay, () => {
          this.spawnWave(this.waveIndex);
          this.roundUiBlocking = false;
          this.physics.resume();
        });
      },
    });

    if (!controls) return;

    this.intermissionCleanup = controls.cleanup;
    this.intermissionContinueHandler = controls.continueHandler;
    this.input.once("pointerdown", this.intermissionContinueHandler);
  }

  private showVictoryOverlay(): void {
    this.roundUiBlocking = true;
    this.physics.pause();
    this.player.setVelocity(0, 0);
    this.gameOverlay.show({
      id: "show-victory",
      scene: this,
      depth: OVERLAY_DEPTH,
      onReturnToMainMenu: () => {
        this.scene.stop(SceneKey.PlayerHud);
        this.scene.start(SceneKey.MainMenu);
      },
    });
  }

  private onSkillBlow(payload: BlowSkillPayload): void {
    this.blowSkillImpactHandler.handle({
      enemies: this.enemies.getChildren() as Enemy[],
      payload,
    });
  }

  private spawnCreditPickup(x: number, y: number, credits: number): void {
    const spawnX = x + Phaser.Math.Between(-8, 8);
    const spawnY = y + Phaser.Math.Between(-6, 6);
    const pickup = new CreditPickup(
      this,
      spawnX,
      spawnY,
      credits,
      getGameData().creditPickup.scale,
    );
    this.creditPickups.add(pickup);
  }

  private spawnConsumablePickup(x: number, y: number): void {
    const drop = this.resolveConsumableDrop();
    if (!drop) return;

    const spawnX = x + Phaser.Math.Between(-10, 10);
    const spawnY = y + Phaser.Math.Between(-8, 8);
    const pickup = new ConsumablePickup(
      this,
      spawnX,
      spawnY,
      drop.kind,
      drop.ratio,
      drop.scale,
    );

    this.consumablePickups.add(pickup);
  }

  private resolveConsumableDrop(): {
    kind: ConsumablePickupKind;
    ratio: number;
    scale: number;
  } | null {
    const kind = this.chooseConsumableKind();
    const tier = this.getConsumableTier();

    if (kind === "health") {
      const entry = getGameData().healthPacks[`health_pack_${tier}`];
      if (!entry) return null;

      return {
        kind,
        ratio: entry.heal_ratio,
        scale: entry.scale,
      };
    }

    const entry = getGameData().staminaStims[`stamina_stim_${tier}`];
    if (!entry) return null;

    return {
      kind,
      ratio: entry.restore_ratio,
      scale: entry.scale,
    };
  }

  private chooseConsumableKind(): ConsumablePickupKind {
    const healthMissingRatio =
      this.player.maxHealth > 0
        ? (this.player.maxHealth - this.player.health) / this.player.maxHealth
        : 0;
    const staminaMissingRatio =
      this.player.maxStamina > 0
        ? (this.player.maxStamina - this.player.stamina) /
          this.player.maxStamina
        : 0;

    if (healthMissingRatio > staminaMissingRatio + 0.08) {
      return "health";
    }
    if (staminaMissingRatio > healthMissingRatio + 0.08) {
      return "stamina";
    }

    return Phaser.Math.Between(0, 1) === 0 ? "health" : "stamina";
  }

  private getConsumableTier(): number {
    return Math.min(5, Math.max(1, Math.ceil((this.waveIndex + 1) / 4)));
  }

  private planConsumableDropKills(
    totalEnemies: number,
    totalDrops: number,
  ): Set<number> {
    const plannedKills = new Set<number>();

    if (totalEnemies <= 0) return plannedKills;

    const cappedDrops = Math.min(
      totalEnemies,
      Math.max(0, Math.floor(totalDrops)),
    );
    if (cappedDrops === 0) return plannedKills;

    const step = totalEnemies / (cappedDrops + 1);
    const jitter = Math.max(0, Math.floor(step * 0.25));

    for (let index = 1; index <= cappedDrops; index += 1) {
      const center = Math.round(step * index);
      let candidate = Phaser.Math.Clamp(
        center + Phaser.Math.Between(-jitter, jitter),
        1,
        totalEnemies,
      );

      while (plannedKills.has(candidate) && candidate < totalEnemies) {
        candidate += 1;
      }
      while (plannedKills.has(candidate) && candidate > 1) {
        candidate -= 1;
      }

      plannedKills.add(candidate);
    }

    return plannedKills;
  }

  update(time: number, delta: number): void {
    this.playerContactCooldownMs = Math.max(
      0,
      this.playerContactCooldownMs - delta,
    );

    if (this.player && !this.player.isAlive && !this.handledPlayerDeath) {
      this.handledPlayerDeath = true;
      this.cameras.main.stopFollow();
      this.player.setVelocity(0, 0);
      this.clearIntermissionTimer();

      this.scene.stop(SceneKey.PlayerHud);
      this.time.delayedCall(500, () => {
        this.scene.start(SceneKey.GameOver);
      });
    }

    if (this.awaitingRoundCreditCleanup) {
      this.player.setVelocity(0, 0);
      this.applyRoundEndCreditMagnetism(delta);

      if (this.getActiveCreditPickups().length === 0) {
        this.awaitingRoundCreditCleanup = false;
        this.beginIntermission();
      }
      return;
    }

    if (this.roundUiBlocking || !this.player?.isAlive) return;

    this.applyPickupMagnetism(delta);

    const pointer = this.input.activePointer;

    const currentInput = {
      ...this.keys,
      leftClick: pointer.leftButtonDown(),
      rightClick: pointer.rightButtonDown(),
    } as PlayerInput;

    this.player.update(delta, currentInput, time);
  }

  private applyPickupMagnetism(deltaMs: number): void {
    this.attractPickupsInGroup(this.creditPickups, deltaMs);
    this.attractPickupsInGroup(this.consumablePickups, deltaMs);
  }

  private applyRoundEndCreditMagnetism(deltaMs: number): void {
    this.attractPickupsInGroup(
      this.creditPickups,
      deltaMs,
      ROUND_END_CREDIT_PULL_RADIUS,
    );
  }

  private attractPickupsInGroup(
    group: Phaser.Physics.Arcade.Group,
    deltaMs: number,
    radius: number = PICKUP_MAGNET_RADIUS,
  ): void {
    const children = group.getChildren() as Array<
      Phaser.GameObjects.GameObject & {
        x: number;
        y: number;
        active: boolean;
        attractTo?: (targetX: number, targetY: number, deltaMs: number) => void;
      }
    >;

    for (const pickup of children) {
      if (!pickup.active || !pickup.attractTo) continue;

      const distance = Phaser.Math.Distance.Between(
        pickup.x,
        pickup.y,
        this.player.x,
        this.player.y,
      );
      if (distance > radius) continue;

      pickup.attractTo(this.player.x, this.player.y, deltaMs);
    }
  }

  private getActiveCreditPickups(): CreditPickup[] {
    return (this.creditPickups.getChildren() as CreditPickup[]).filter(
      (pickup) => pickup.active,
    );
  }

  private getActiveConsumablePickups(): ConsumablePickup[] {
    return (this.consumablePickups.getChildren() as ConsumablePickup[]).filter(
      (pickup) => pickup.active,
    );
  }

  private drawGrid(): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, hexToNumber(theme.semantic.gfx.grid), 1);

    for (let x = 0; x <= WORLD_WIDTH; x += DEBUG_GRID_SIZE_PX) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += DEBUG_GRID_SIZE_PX) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }

    grid.setDepth(0);
  }
}
