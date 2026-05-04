import * as Phaser from "phaser";

import { SceneKey } from "@core/scene-key";

import { getTheme, hexToNumber } from "@data/theme/theme";

import { Player } from "@gameplay/player/player";
import { PrimaryWeaponMode } from "@gameplay/weapons/primary/types";

const uiTheme = getTheme();

export class PlayerHudScene extends Phaser.Scene {
  private player!: Player;

  private readonly FONT_FAMILY = uiTheme.typography.fonts.ui;
  private readonly FONT_FAMILY_MONO = uiTheme.typography.fonts.mono;

  private readonly BLINK_INTERVAL = uiTheme.motion.blink.interval_ms;
  private readonly BLINK_ALPHA_ON = uiTheme.motion.blink.alpha_on;
  private readonly BLINK_ALPHA_OFF = uiTheme.motion.blink.alpha_off;
  private _currentBlinkAlpha: number = 1;

  private readonly TXT_PRIMARY = uiTheme.semantic.text.primary;
  private readonly TXT_LABEL = uiTheme.semantic.text.label;
  private readonly TXT_ACCENT = uiTheme.semantic.text.accent;
  private readonly TXT_SUCCESS = uiTheme.semantic.text.success;
  private readonly TXT_CRITICAL = uiTheme.semantic.text.critical;
  private readonly TXT_COOLDOWN = uiTheme.semantic.text.cooldown;
  private readonly TXT_RELOAD = uiTheme.semantic.text.warning;
  private readonly TXT_SEPARATOR = uiTheme.semantic.text.separator;
  private readonly TXT_TRANSPARENT = uiTheme.semantic.transparent;

  private readonly GFX_BG = hexToNumber(uiTheme.semantic.surface.hud);
  private readonly GFX_LIFE = hexToNumber(uiTheme.semantic.gfx.life);
  private readonly GFX_STAMINA = hexToNumber(uiTheme.semantic.gfx.stamina);
  private readonly GFX_XP_BG = hexToNumber(uiTheme.semantic.gfx.xp_track);
  private readonly GFX_BAR_TRACK = hexToNumber(uiTheme.semantic.gfx.bar_track);
  private readonly GFX_FRAME = hexToNumber(uiTheme.semantic.gfx.frame);
  private readonly GFX_RELOAD = hexToNumber(uiTheme.semantic.gfx.life);

  private operatorText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpProgressBar!: Phaser.GameObjects.Graphics;
  private matchBoardFrame!: Phaser.GameObjects.Graphics;
  private roundValue!: Phaser.GameObjects.Text;
  private enemyValue!: Phaser.GameObjects.Text;
  private creditsValueText!: Phaser.GameObjects.Text;
  private xpValueText!: Phaser.GameObjects.Text;
  private lifeText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private stBar!: Phaser.GameObjects.Graphics;
  private dashText!: Phaser.GameObjects.Text;
  private dashKeyText!: Phaser.GameObjects.Text;
  private grenadeText!: Phaser.GameObjects.Text;
  private grenadeKeyText!: Phaser.GameObjects.Text;
  private blowText!: Phaser.GameObjects.Text;
  private blowKeyText!: Phaser.GameObjects.Text;
  private primaryModeText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private reloadProgress!: Phaser.GameObjects.Graphics;
  private meleeStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.PlayerHud);
  }

  public create(data: { player: Player }): void {
    this.player = data.player;

    this.setupTopLeft();
    this.setupTopCenter();
    this.setupTopRight();
    this.setupBottomLeft();
    this.setupBottomRight();
    this.setupActionCenter();
  }

  public update(time: number): void {
    if (!this.player) return;

    const isBlinkStateOn = Math.floor(time / this.BLINK_INTERVAL) % 2 === 0;
    this._currentBlinkAlpha = isBlinkStateOn
      ? this.BLINK_ALPHA_ON
      : this.BLINK_ALPHA_OFF;

    this.updateTopLeft();
    this.updateTopCenter();
    this.updateTopRight();
    this.updateBottomLeft();
    this.updateBottomRight();
    this.updateActionCenter();
  }

  private setupTopLeft(): void {
    const styleLabel = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.sm,
      color: this.TXT_LABEL,
    };
    const styleValue = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.xl,
      color: this.TXT_PRIMARY,
      fontStyle: uiTheme.typography.weights.bold,
    };

    this.add.text(40, 40, "OP:", styleLabel);
    this.operatorText = this.add
      .text(70, 40, this.player.playerName.toUpperCase(), styleValue)
      .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true);

    this.add.text(220, 40, "LVL:", styleLabel);
    this.levelText = this.add
      .text(260, 40, "01", styleValue)
      .setShadow(0, 0, this.TXT_ACCENT, 4, true, true);

    this.xpProgressBar = this.add.graphics();
  }

  private updateTopLeft(): void {
    this.levelText.setText(this.player.lvl.toString().padStart(2, "0"));
    const xpFrac = this.player.xpBarProgress;
    this.xpProgressBar
      .clear()
      .fillStyle(this.GFX_XP_BG, 0.5)
      .fillRect(40, 70, 220, 2)
      .fillStyle(this.GFX_FRAME, 0.8)
      .fillRect(40, 70, 220 * xpFrac, 2);
  }

  private setupTopCenter(): void {
    const centerX = this.scale.width / 2;
    const boardW = 320;
    const boardH = 75;
    const startY = 30;

    this.matchBoardFrame = this.add.graphics();
    this.matchBoardFrame.fillStyle(this.GFX_BG, 0.85);
    this.matchBoardFrame.fillRect(centerX - boardW / 2, startY, boardW, boardH);

    const bSize = 12;
    const left = centerX - boardW / 2;
    const right = centerX + boardW / 2;
    const top = startY;
    const bottom = startY + boardH;

    this.matchBoardFrame.lineStyle(2, this.GFX_FRAME, 0.8);
    this.matchBoardFrame
      .beginPath()
      .moveTo(left + bSize, top)
      .lineTo(left, top)
      .lineTo(left, top + bSize)
      .strokePath();
    this.matchBoardFrame
      .beginPath()
      .moveTo(right - bSize, top)
      .lineTo(right, top)
      .lineTo(right, top + bSize)
      .strokePath();
    this.matchBoardFrame
      .beginPath()
      .moveTo(left + bSize, bottom)
      .lineTo(left, bottom)
      .lineTo(left, bottom - bSize)
      .strokePath();
    this.matchBoardFrame
      .beginPath()
      .moveTo(right - bSize, bottom)
      .lineTo(right, bottom)
      .lineTo(right, bottom - bSize)
      .strokePath();

    this.matchBoardFrame
      .lineStyle(1, this.GFX_FRAME, 0.15)
      .lineBetween(centerX, top + 15, centerX, bottom - 15);

    const styleHeading = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.md,
      color: this.TXT_LABEL,
      fontStyle: uiTheme.typography.weights.bold,
    };
    const styleValue = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.display_lg,
      color: this.TXT_PRIMARY,
      fontStyle: uiTheme.typography.weights.bold,
    };

    this.add
      .text(centerX - 80, startY + 8, "OPER. PHASE", styleHeading)
      .setOrigin(0.5, 0);
    this.roundValue = this.add
      .text(centerX - 80, startY + 26, "R-01", styleValue)
      .setOrigin(0.5, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 8, true, true);

    this.add
      .text(centerX + 80, startY + 8, "HOSTILES", styleHeading)
      .setOrigin(0.5, 0);
    this.enemyValue = this.add
      .text(centerX + 80, startY + 26, "100", styleValue)
      .setOrigin(0.5, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 8, true, true);
  }

  private updateTopCenter(): void {
    const round = this.game.registry.get("match:round");
    const hostiles = this.game.registry.get("match:hostiles");

    if (typeof round === "number") {
      this.roundValue.setText(`R-${round.toString().padStart(2, "0")}`);
    }
    if (typeof hostiles === "number") {
      this.enemyValue.setText(hostiles.toString());
    }
  }

  private setupTopRight(): void {
    const rightX = this.scale.width - 40;

    this.xpValueText = this.add
      .text(rightX, 38, "00000", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.xxl,
        color: this.TXT_PRIMARY,
        fontStyle: uiTheme.typography.weights.bold,
      })
      .setOrigin(1, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 5, true, true);

    this.add
      .text(rightX - 140, 41, "XP:", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.md,
        color: this.TXT_LABEL,
      })
      .setOrigin(1, 0);

    this.creditsValueText = this.add
      .text(rightX, 72, "00000", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.xxxl,
        color: this.TXT_SUCCESS,
        fontStyle: uiTheme.typography.weights.bold,
      })
      .setOrigin(1, 0)
      .setShadow(0, 0, this.TXT_SUCCESS, 6, true, true);

    this.add
      .text(rightX - 140, 75, "CREDITS:", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.md,
        color: this.TXT_LABEL,
      })
      .setOrigin(1, 0);
  }

  private updateTopRight(): void {
    this.xpValueText.setText(this.player.totalXp.toString().padStart(5, "0"));
    this.creditsValueText.setText(
      this.player.credits.toString().padStart(5, "0"),
    );
  }

  private setupBottomLeft(): void {
    const startY = this.scale.height - 80;
    this.add
      .text(40, startY, "HP", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.md,
        color: this.TXT_RELOAD,
        fontStyle: uiTheme.typography.weights.bold,
      })
      .setShadow(0, 0, this.TXT_RELOAD, 4, true, true);
    this.add
      .text(40, startY + 25, "ST", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.md,
        color: this.TXT_ACCENT,
        fontStyle: uiTheme.typography.weights.bold,
      })
      .setShadow(0, 0, this.TXT_ACCENT, 4, true, true);

    this.hpBar = this.add.graphics();
    this.stBar = this.add.graphics();
    this.lifeText = this.add.text(260, startY, "100%", {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.md,
      color: this.TXT_PRIMARY,
    });
    this.staminaText = this.add.text(260, startY + 25, "100%", {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.md,
      color: this.TXT_PRIMARY,
    });
  }

  private updateBottomLeft(): void {
    const hpRatio = this.player.health / this.player.maxHealth;
    const stRatio = this.player.stamina / this.player.maxStamina;
    const barY = this.scale.height - 72;

    this.hpBar
      .clear()
      .fillStyle(this.GFX_BAR_TRACK, 0.5)
      .fillRect(75, barY, 130, 4)
      .fillStyle(this.GFX_LIFE, 0.9)
      .fillRect(75, barY, 130 * hpRatio, 4);
    this.stBar
      .clear()
      .fillStyle(this.GFX_BAR_TRACK, 0.5)
      .fillRect(75, barY + 25, 130, 2)
      .fillStyle(this.GFX_STAMINA, 0.9)
      .fillRect(75, barY + 25, 130 * stRatio, 2);

    this.lifeText.setText(`${Math.floor(hpRatio * 100)}%`);
    this.staminaText.setText(`${Math.floor(stRatio * 100)}%`);
  }

  private setupBottomRight(): void {
    const rightX = this.scale.width - 40;
    const startY = this.scale.height - 80;
    const keyGap = 8;
    const separatorPadding = 20;
    const styleTitle = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.xl,
      color: this.TXT_PRIMARY,
      fontStyle: uiTheme.typography.weights.bold,
    };
    const styleKey = {
      fontFamily: this.FONT_FAMILY_MONO,
      fontSize: uiTheme.typography.sizes.xs,
      color: this.TXT_ACCENT,
      backgroundColor: uiTheme.semantic.surface.keycap,
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    };

    this.add
      .text(rightX, startY, "SKILLS", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.sm,
        color: this.TXT_LABEL,
      })
      .setOrigin(1, 0);

    this.dashText = this.add
      .text(0, startY + 20, "DASH", styleTitle)
      .setOrigin(0, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true);
    this.dashKeyText = this.add
      .text(0, startY + 20, "[SPACE]", styleKey)
      .setOrigin(0, 0)
      .setAlpha(1);

    const firstSeparator = this.add
      .text(0, startY + 18, "|", {
        fontFamily: this.FONT_FAMILY_MONO,
        fontSize: uiTheme.typography.sizes.xxl,
        color: this.TXT_SEPARATOR,
      })
      .setOrigin(0.5, 0);

    this.grenadeText = this.add
      .text(0, startY + 20, "BURST", styleTitle)
      .setOrigin(0, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true);
    this.grenadeKeyText = this.add
      .text(0, startY + 20, "[E]", styleKey)
      .setOrigin(0, 0)
      .setAlpha(1);

    const secondSeparator = this.add
      .text(0, startY + 18, "|", {
        fontFamily: this.FONT_FAMILY_MONO,
        fontSize: uiTheme.typography.sizes.xxl,
        color: this.TXT_SEPARATOR,
      })
      .setOrigin(0.5, 0);

    this.blowText = this.add
      .text(0, startY + 20, "BLAST", styleTitle)
      .setOrigin(0, 0)
      .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true);
    this.blowKeyText = this.add
      .text(0, startY + 20, "[Q]", styleKey)
      .setOrigin(0, 0)
      .setAlpha(1);

    const blowGroupWidth =
      this.blowText.width + keyGap + this.blowKeyText.width;
    const blowX = rightX - blowGroupWidth;
    this.blowText.setX(blowX);
    this.blowKeyText.setX(blowX + this.blowText.width + keyGap);

    const secondSeparatorX = blowX - separatorPadding;
    secondSeparator.setX(secondSeparatorX);

    const fragGroupWidth =
      this.grenadeText.width + keyGap + this.grenadeKeyText.width;
    const fragRight = secondSeparatorX - separatorPadding;
    const fragX = fragRight - fragGroupWidth;
    this.grenadeText.setX(fragX);
    this.grenadeKeyText.setX(fragX + this.grenadeText.width + keyGap);

    const firstSeparatorX = fragX - separatorPadding;
    firstSeparator.setX(firstSeparatorX);

    const dashGroupWidth =
      this.dashText.width + keyGap + this.dashKeyText.width;
    const dashRight = firstSeparatorX - separatorPadding;
    const dashX = dashRight - dashGroupWidth;
    this.dashText.setX(dashX);
    this.dashKeyText.setX(dashX + this.dashText.width + keyGap);
  }

  private updateBottomRight(): void {
    const dCd = this.player.dashCooldownTimer || 0;
    const bCd = this.player.blowCooldownTimer || 0;
    const grenadeCd = this.player.burstCooldownTimer || 0;

    if (dCd > 0) {
      this.dashText
        .setShadow(0, 0, this.TXT_TRANSPARENT, 0)
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
      this.dashKeyText
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
    } else {
      this.dashText
        .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true)
        .setColor(this.TXT_PRIMARY)
        .setAlpha(1);
      this.dashKeyText.setColor(this.TXT_ACCENT).setAlpha(1);
    }

    if (bCd > 0) {
      this.blowText
        .setShadow(0, 0, this.TXT_TRANSPARENT, 0)
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
      this.blowKeyText
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
    } else {
      this.blowText
        .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true)
        .setColor(this.TXT_PRIMARY)
        .setAlpha(1);
      this.blowKeyText.setColor(this.TXT_ACCENT).setAlpha(1);
    }

    if (grenadeCd > 0) {
      this.grenadeText
        .setShadow(0, 0, this.TXT_TRANSPARENT, 0)
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
      this.grenadeKeyText
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
    } else {
      this.grenadeText
        .setShadow(0, 0, this.TXT_PRIMARY, 4, true, true)
        .setColor(this.TXT_PRIMARY)
        .setAlpha(1);
      this.grenadeKeyText.setColor(this.TXT_ACCENT).setAlpha(1);
    }
  }

  private setupActionCenter(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height - 80;
    const styleHeading = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.xs,
      color: this.TXT_LABEL,
    };
    const styleValue = {
      fontFamily: this.FONT_FAMILY,
      fontSize: uiTheme.typography.sizes.lg,
      color: this.TXT_PRIMARY,
      fontStyle: uiTheme.typography.weights.bold,
    };

    this.add
      .text(centerX - 120, centerY - 25, "MODE", styleHeading)
      .setOrigin(0.5, 0.5);
    this.primaryModeText = this.add
      .text(centerX - 120, centerY + 10, "[ SINGLE ]", styleValue)
      .setOrigin(0.5, 0.5);

    this.add
      .text(centerX, centerY - 25, "AMMO", styleHeading)
      .setOrigin(0.5, 0.5);
    this.ammoText = this.add
      .text(centerX, centerY + 10, "00", {
        fontFamily: this.FONT_FAMILY,
        fontSize: uiTheme.typography.sizes.display_3xl,
        color: this.TXT_PRIMARY,
        fontStyle: uiTheme.typography.weights.bold,
      })
      .setOrigin(0.5, 0.5);
    this.reloadProgress = this.add.graphics();

    this.add
      .text(centerX + 120, centerY - 25, "MELEE", styleHeading)
      .setOrigin(0.5, 0.5);
    this.meleeStatusText = this.add
      .text(centerX + 120, centerY + 10, "[ RDY ]", styleValue)
      .setOrigin(0.5, 0.5);
  }

  private updateActionCenter(): void {
    const weapon = this.player.primaryWeapon;
    const sec = this.player.secondaryWeapon;

    const modeClr = this.getStyleColorForMode(weapon.currentMode);
    this.primaryModeText
      .setText(`[ ${weapon.currentMode.toUpperCase()} ]`)
      .setColor(modeClr)
      .setShadow(0, 0, modeClr, 4, true, true);

    this.reloadProgress.clear();
    if (weapon.isReloading) {
      this.ammoText
        .setText("RLD")
        .setFontSize(uiTheme.typography.sizes.display_md)
        .setColor(this.TXT_RELOAD)
        .setShadow(0, 0, this.TXT_RELOAD, 8, true, true);
      this.reloadProgress
        .fillStyle(this.GFX_RELOAD, 1)
        .fillRect(
          this.scale.width / 2 - 30,
          this.scale.height - 45,
          60 * weapon.reloadProgress,
          4,
        );
    } else {
      const isCritical = weapon.ammo <= 3;
      this.ammoText
        .setText(weapon.ammo.toString().padStart(2, "0"))
        .setFontSize(uiTheme.typography.sizes.display_3xl)
        .setColor(isCritical ? this.TXT_CRITICAL : this.TXT_PRIMARY)
        .setShadow(
          0,
          0,
          isCritical ? this.TXT_CRITICAL : this.TXT_PRIMARY,
          8,
          true,
          true,
        );
    }

    if (sec.cooldown && sec.cooldown > 0) {
      this.meleeStatusText
        .setShadow(0, 0, this.TXT_TRANSPARENT, 0)
        .setText("--")
        .setColor(this.TXT_COOLDOWN)
        .setAlpha(this._currentBlinkAlpha);
    } else {
      this.meleeStatusText
        .setShadow(0, 0, this.TXT_ACCENT, 4, true, true)
        .setText("[ RDY ]")
        .setColor(this.TXT_ACCENT)
        .setAlpha(1);
    }
  }

  private getStyleColorForMode(mode: PrimaryWeaponMode): string {
    switch (mode) {
      case PrimaryWeaponMode.power:
        return uiTheme.semantic.mode.power;
      case PrimaryWeaponMode.spread:
        return uiTheme.semantic.mode.spread;
      default:
        return uiTheme.semantic.mode.standard;
    }
  }
}
