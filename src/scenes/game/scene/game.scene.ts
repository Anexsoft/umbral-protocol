import * as Phaser from "phaser";

import { GRID_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "@config/constants";

import { SceneKey } from "@core/scene-key";

import { getGameData } from "@data/game-data";
import { getTheme, hexToNumber } from "@data/theme/theme";
import type { RoundSpawnEntry } from "@data/rounds/types";

import { Enemy } from "@gameplay/enemies/enemy";
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
const BETWEEN_WAVE_SECONDS = 15;
const OVERLAY_DEPTH = 14000;
const theme = getTheme();

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private readonly blowSkillImpactHandler = new BlowSkillImpactHandler();
  private readonly intermissionOverlay = new GameIntermissionOverlay();
  private readonly gameOverlay = new GameOverlay();
  private readonly waveHandler = new GameWaveHandler();
  private readonly preventContextMenu = (event: Event) =>
    event.preventDefault();
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
  private roundUiBlocking = false;
  private intermissionTimer?: Phaser.Time.TimerEvent;
  private intermissionCleanup?: () => void;
  private skipEnterHandler?: () => void;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    this.game.canvas.addEventListener("contextmenu", this.preventContextMenu);

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
        this.playerContactCooldownMs = PLAYER_CONTACT_INVULN_MS;
      },
    );

    this.physics.add.collider(this.enemies, this.enemies);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scene.launch(SceneKey.PlayerHud, { player: this.player });

    this.physics.add.overlap(
      this.player.primaryWeapon.bullets,
      this.enemies,
      (bulletObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        const bullet = bulletObj as Bullet;

        if (!enemy.isAlive) return;

        enemy.takeDamage(bullet.damage);
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
      this.input.keyboard?.off("keydown-ESC", this.pauseHandler);
    });

    this.input.keyboard!.on("keydown-ESC", this.pauseHandler);

    this.beginMatchFlow();
  }

  private beginMatchFlow(): void {
    this.waveIndex = 0;
    this.showRoundIntroBanner(1, () => {
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
    score: number;
    xp: number;
  }): void {
    if (!this.player?.isAlive || this.roundUiBlocking) return;

    const p = payload ?? { credits: 0, score: 0, xp: 0 };
    this.player.addKillRewards(p.credits, p.score, p.xp);

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

    this.beginIntermission();
  }

  private clearIntermissionTimer(): void {
    if (this.intermissionTimer) {
      this.intermissionTimer.destroy();
      this.intermissionTimer = undefined;
    }
    if (this.skipEnterHandler) {
      this.input.keyboard?.off("keydown-ENTER", this.skipEnterHandler);
      this.skipEnterHandler = undefined;
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
      secondsRemaining: BETWEEN_WAVE_SECONDS,
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
    this.intermissionTimer = controls.timer;
    this.skipEnterHandler = controls.skipHandler;
    this.input.keyboard!.once("keydown-ENTER", this.skipEnterHandler);
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

    if (this.roundUiBlocking || !this.player?.isAlive) return;

    const pointer = this.input.activePointer;

    const currentInput = {
      ...this.keys,
      leftClick: pointer.leftButtonDown(),
      rightClick: pointer.rightButtonDown(),
    } as PlayerInput;

    this.player.update(delta, currentInput, time);
  }

  private drawGrid(): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, hexToNumber(theme.semantic.gfx.grid), 1);

    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SIZE) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SIZE) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }

    grid.setDepth(0);
  }
}
