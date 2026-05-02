import * as Phaser from "phaser";

import { SceneKey } from "@core/scene-key";

import { getTheme, hexToNumber } from "@data/theme/theme";

import { BackgroundFX } from "@scenes/fx/background.fx";

const theme = getTheme();

export class LoreScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Lore });
  }

  create() {
    const { width, height } = this.cameras.main;

    new BackgroundFX(this);

    const margin = 40;
    const padding = 24;
    const colWidth = Math.floor((width - margin * 4) / 3);
    const colHeight = Math.floor(height * 0.65);
    const colY = (height - colHeight) / 2;
    const colXs = [margin, margin * 2 + colWidth, margin * 3 + colWidth * 2];

    for (let i = 0; i < 3; i++) {
      const x = colXs[i];

      this.add
        .rectangle(
          x + colWidth / 2,
          colY + colHeight / 2,
          colWidth,
          colHeight,
          hexToNumber(theme.semantic.surface.panel),
          0.9,
        )
        .setStrokeStyle(1, hexToNumber(theme.semantic.text.accent_scan), 0.3);

      const footerY = colY + colHeight - 20;
      this.add.text(
        x + padding,
        footerY,
        `LOG_ID: ${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.xxs,
          color: theme.semantic.text.accent_scan,
        },
      );
      this.add
        .text(x + colWidth - padding, footerY, "[SECURED]", {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.xxs,
          color: theme.semantic.text.accent_scan,
        })
        .setOrigin(1, 0);

      const cL = 12;
      const cC = hexToNumber(theme.semantic.text.accent_scan);
      this.add.line(x, colY, 0, 0, cL, 0, cC, 0.6).setOrigin(0);
      this.add.line(x, colY, 0, 0, 0, cL, cC, 0.6).setOrigin(0);
      this.add.line(x + colWidth, colY, 0, 0, -cL, 0, cC, 0.6).setOrigin(0);
      this.add
        .line(x + colWidth, colY + colHeight, 0, 0, 0, -cL, cC, 0.6)
        .setOrigin(0);
    }

    const x1 = colXs[0] + padding;
    let y1 = colY + 30;
    this.add.text(x1, y1, "PROTOCOL", {
      fontFamily: theme.typography.fonts.ui,
      fontSize: theme.typography.sizes.xxxl,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.emphasis,
    });
    y1 += 50;
    this.add.text(
      x1,
      y1,
      "Status: CRITICAL\nDeployment: ACTIVE\n\nSedative neutralized. Memory recovery not required for current objectives.\n\nSENTINEL XM-21 link established. You are now the apex predator of the exclusion zone.",
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        color: theme.semantic.text.strong,
        wordWrap: { width: colWidth - 50 },
        lineSpacing: 10,
      },
    );

    const x2 = colXs[1] + padding;
    let y2 = colY + 30;
    this.add.text(x2, y2, "WEAPON SYSTEM", {
      fontFamily: theme.typography.fonts.ui,
      fontSize: theme.typography.sizes.xxxl,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.accent_scan,
    });
    y2 += 50;

    const weaponConfig = [
      {
        label: "STANDARD SHOT",
        color: theme.palette.warning.gold,
        desc: "Precision fire. Optimal for individual lethality and recoil management.",
      },
      {
        label: "SPREAD SHOT",
        color: theme.palette.danger.salmon,
        desc: "Shock expansion. Evaluates area saturation on high biological density.",
      },
      {
        label: "POWER SHOT",
        color: theme.palette.success.mint,
        desc: "Kinetic impact. Pierces hardened tissue and multi-target clusters.",
      },
    ];

    weaponConfig.forEach((item) => {
      this.add.text(x2, y2, item.label, {
        fontFamily: theme.typography.fonts.ui,
        fontSize: theme.typography.sizes.sm,
        fontStyle: theme.typography.weights.bold,
        color: item.color,
      });
      y2 += 22;
      this.add.text(x2, y2, item.desc, {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        color: theme.semantic.text.muted,
        wordWrap: { width: colWidth - 50 },
        lineSpacing: 4,
      });
      y2 += 55;
    });

    const x3 = colXs[2] + padding;
    let y3 = colY + 30;
    this.add.text(x3, y3, "OBJECTIVES", {
      fontFamily: theme.typography.fonts.ui,
      fontSize: theme.typography.sizes.xxxl,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.accent_soft,
    });
    y3 += 50;
    this.add.text(
      x3,
      y3,
      "• Clear marked sectors.\n• Collect bio-telemetry.\n• No unauthorized extraction.",
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.md,
        color: theme.semantic.text.strong,
        lineSpacing: 12,
      },
    );

    y3 += 100;
    this.add.rectangle(
      x3 + (colWidth - 50) / 2,
      y3 + 45,
      colWidth - 50,
      90,
      hexToNumber(theme.semantic.fx.damage_popup_fill),
      0.05,
    );
    this.add.text(x3, y3, "CRITICAL WARNING", {
      fontFamily: theme.typography.fonts.ui,
      fontSize: theme.typography.sizes.lg,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.danger,
    });
    y3 += 30;
    this.add.text(
      x3,
      y3,
      "Frequency microbomb primed. Containment breach or 600s inactivity will trigger fuse. Finish the log.",
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        color: theme.semantic.text.danger_soft,
        wordWrap: { width: colWidth - 50 },
        lineSpacing: 5,
      },
    );

    const prompt = this.add
      .text(width / 2, height - 60, "[ PRESS SPACE TO INITIALIZE ]", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.lg,
        fontStyle: theme.typography.weights.bold,
        color: theme.semantic.text.accent_scan,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: theme.motion.durations.prompt_ms,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start(SceneKey.Game);
    });
  }
}
