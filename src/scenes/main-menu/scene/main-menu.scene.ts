import * as Phaser from "phaser";

import { SceneKey } from "@core/scene-key";

import { getTheme, hexToNumber } from "@data/theme/theme";

import { BackgroundFX } from "@scenes/fx/background.fx";

const theme = getTheme();

export class MainMenuScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private selectorGraphic!: Phaser.GameObjects.Graphics;
  private creditsText?: Phaser.GameObjects.Text;
  private upHandler?: () => void;
  private downHandler?: () => void;
  private confirmHandler?: () => void;

  constructor() {
    super(SceneKey.MainMenu);
  }

  public create(): void {
    this.selectedIndex = 0;
    this.menuTexts = [];
    this.creditsText = undefined;

    const { width, height } = this.scale;
    const centerX = width / 2;

    this.add.rectangle(
      centerX,
      height / 2,
      width,
      height,
      hexToNumber(theme.semantic.surface.menu),
    );
    new BackgroundFX(this);

    const metaStyle = {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.xxs,
      color: theme.semantic.text.accent_scan,
      alpha: 0.4,
    };
    this.add.text(
      25,
      25,
      "SYSTEM: BOOT_SEQUENCE_COMPLETE\nKERNEL: UMBRA_OS_v4.27",
      metaStyle,
    );
    this.add
      .text(
        width - 25,
        25,
        "ENCRYPTION: AES_256_ACTIVE\nLINK: STABLE_NODE_P2P",
        metaStyle,
      )
      .setOrigin(1, 0);

    this.add
      .text(centerX, height * 0.22, "PROTOCOL", {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.hero,
        color: theme.semantic.text.emphasis,
        fontStyle: theme.typography.weights.bold,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, height * 0.22 + 60, "// TEST SUBJECT ACCEPTED //", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        color: theme.semantic.text.primary,
        letterSpacing: theme.typography.letter_spacing.wide,
      })
      .setOrigin(0.5);

    const menuItems = [
      {
        label: "[ 01 ] NEW DEPLOYMENT",
        enabled: true,
        action: () => this.scene.start(SceneKey.Lore),
      },
      { label: "[ 02 ] RESUME LOGS", enabled: false, action: () => {} },
      {
        label: "[ 03 ] CREDITS / DATA",
        enabled: true,
        action: () => this.showCredits(),
      },
    ];

    this.selectorGraphic = this.add.graphics();

    menuItems.forEach((item, i) => {
      const text = this.add
        .text(centerX, height * 0.55 + i * 75, item.label, {
          fontFamily: theme.typography.fonts.ui,
          fontSize: theme.typography.sizes.xxl,
        })
        .setOrigin(0.5);
      this.menuTexts.push(text);
    });

    this.updateMenu(menuItems);

    const navigate = (dir: number) => {
      do {
        this.selectedIndex =
          (this.selectedIndex + dir + menuItems.length) % menuItems.length;
      } while (!menuItems[this.selectedIndex].enabled);
      this.updateMenu(menuItems);
    };

    this.upHandler = () => navigate(-1);
    this.downHandler = () => navigate(1);
    this.confirmHandler = () => menuItems[this.selectedIndex].action();

    this.input.keyboard?.on("keydown-UP", this.upHandler);
    this.input.keyboard?.on("keydown-W", this.upHandler);
    this.input.keyboard?.on("keydown-DOWN", this.downHandler);
    this.input.keyboard?.on("keydown-S", this.downHandler);
    this.input.keyboard?.on("keydown-SPACE", this.confirmHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.menuTexts = [];
      this.creditsText = undefined;
      if (this.upHandler) {
        this.input.keyboard?.off("keydown-UP", this.upHandler);
        this.input.keyboard?.off("keydown-W", this.upHandler);
      }
      if (this.downHandler) {
        this.input.keyboard?.off("keydown-DOWN", this.downHandler);
        this.input.keyboard?.off("keydown-S", this.downHandler);
      }
      if (this.confirmHandler) {
        this.input.keyboard?.off("keydown-SPACE", this.confirmHandler);
      }
      this.upHandler = undefined;
      this.downHandler = undefined;
      this.confirmHandler = undefined;
    });
  }

  private updateMenu(items: any[]): void {
    this.menuTexts.forEach((text, i) => {
      const isSelected = i === this.selectedIndex;
      text.setAlpha(isSelected ? 1 : 0.5);
      text.setColor(
        isSelected
          ? theme.semantic.text.accent_scan
          : items[i].enabled
            ? theme.semantic.text.strong
            : theme.semantic.text.separator,
      );
      text.setScale(isSelected ? 1.1 : 1);
      if (isSelected) this.drawSelector(text);
    });
  }

  private drawSelector(target: Phaser.GameObjects.Text): void {
    this.selectorGraphic.clear();
    const margin = 25;
    const padding = 12;
    const x = target.x - (target.width * target.scaleX) / 2 - margin;
    const y = target.y - (target.height * target.scaleY) / 2 - padding;
    const w = target.width * target.scaleX + margin * 2;
    const h = target.height * target.scaleY + padding * 2;

    this.selectorGraphic.lineStyle(
      2,
      hexToNumber(theme.semantic.text.accent_scan),
      0.8,
    );
    const len = 15;
    this.selectorGraphic.lineBetween(x, y, x + len, y);
    this.selectorGraphic.lineBetween(x, y, x, y + len);
    this.selectorGraphic.lineBetween(x + w, y, x + w - len, y);
    this.selectorGraphic.lineBetween(x + w, y, x + w, y + len);
    this.selectorGraphic.lineBetween(x, y + h, x + len, y + h);
    this.selectorGraphic.lineBetween(x, y + h, x, y + h - len);
    this.selectorGraphic.lineBetween(x + w, y + h, x + w - len, y + h);
    this.selectorGraphic.lineBetween(x + w, y + h, x + w, y + h - len);

    if (!this.tweens.isTweening(this.selectorGraphic)) {
      this.tweens.add({
        targets: this.selectorGraphic,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private showCredits() {
    if (this.creditsText) {
      this.creditsText.destroy();
      this.creditsText = undefined;
      return;
    }
    this.creditsText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 80,
        ">> DEPLOYED BY ERP_PROJECT <<",
        {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.md,
          fontStyle: theme.typography.weights.bold,
          color: theme.semantic.text.strong,
        },
      )
      .setOrigin(0.5);
    this.creditsText.setAlpha(0);
    this.tweens.add({
      targets: this.creditsText,
      alpha: 1,
      y: "-=10",
      duration: 400,
    });
  }
}
