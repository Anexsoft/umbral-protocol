import * as Phaser from "phaser";

import { SceneKey } from "@core/scene-key";

import { getGameData } from "@data/game-data";
import { getTheme, hexToNumber } from "@data/theme/theme";
import type { PlayerSkillConfig } from "@data/player/types";
import type { GameDataBundle } from "@data/types";

import type { Player } from "@gameplay/player/player";

import { BackgroundFX } from "@scenes/fx/background.fx";
import {
  createPauseBlockComponent,
  PAUSE_BLOCK_GAP,
} from "./components/pause-block.component";
import {
  PauseTab,
  type PauseTabDefinition,
  type PauseBlockChildren,
  type PauseSectionOptions,
  type PauseTabRenderContext,
} from "./pause.types";
import { renderPauseSkillsTab } from "./tabs/pause-skills.tab";
import { renderPauseSummaryTab } from "./tabs/pause-summary.tab";
import { renderPauseUpgradesTab } from "./tabs/pause-upgrades.tab";
import { renderPauseWeaponTab } from "./tabs/pause-weapon.tab";

const theme = getTheme();
const PAUSE_LAYOUT_HEIGHT = 760;
const PAUSE_CONTENT_Y = 196;
const TAB_DEFINITIONS: PauseTabDefinition[] = [
  { id: PauseTab.Summary, label: "01_SUMMARY" },
  { id: PauseTab.Skills, label: "02_SKILLS" },
  { id: PauseTab.Weapon, label: "03_WEAPONS" },
  { id: PauseTab.Upgrades, label: "04_UPGRADES" },
];

export class PauseScene extends Phaser.Scene {
  private mainContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabsContainer!: Phaser.GameObjects.Container;

  private activeTab = PauseTab.Summary;
  private contentCursorY = 0;
  private player!: Player;
  private bundle!: GameDataBundle;
  private tabButtons: Array<{
    tab: PauseTab;
    background: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }> = [];

  constructor() {
    super(SceneKey.PauseHud);
  }

  create(data: { player: Player }): void {
    if (!data.player) {
      this.scene.stop();
      return;
    }

    this.player = data.player;
    this.bundle = getGameData();
    this.tabButtons = [];

    this.scene.setVisible(false, SceneKey.Game);
    this.scene.setVisible(false, SceneKey.PlayerHud);

    this.cameras.main.setBackgroundColor(
      hexToNumber(theme.semantic.surface.menu),
    );
    this.add
      .rectangle(
        0,
        0,
        this.scale.width,
        this.scale.height,
        hexToNumber(theme.semantic.surface.menu),
        1,
      )
      .setOrigin(0)
      .setDepth(0);

    const backgroundFx = new BackgroundFX(this);
    backgroundFx.setTint(theme.semantic.fx.scanline);

    this.add
      .rectangle(
        0,
        0,
        this.scale.width,
        this.scale.height,
        hexToNumber(theme.semantic.surface.scrim),
        0.78,
      )
      .setOrigin(0)
      .setDepth(1100);

    const layoutTop = Math.round((this.scale.height - PAUSE_LAYOUT_HEIGHT) / 2);

    this.mainContainer = this.add.container(0, layoutTop).setDepth(1200);
    this.createHeader();
    this.createTabBar();

    this.contentContainer = this.add
      .container(0, PAUSE_CONTENT_Y)
      .setDepth(1200);
    this.mainContainer.add(this.contentContainer);

    this.switchTab(PauseTab.Summary);
    this.createFooter();

    const resume = () => {
      this.scene.resume(SceneKey.Game);
      this.scene.resume(SceneKey.PlayerHud);
      this.scene.stop();
    };
    const nextTab = () => {
      const index = TAB_DEFINITIONS.findIndex(
        (item) => item.id === this.activeTab,
      );
      const nextIndex = (index + 1) % TAB_DEFINITIONS.length;
      this.switchTab(TAB_DEFINITIONS[nextIndex].id);
    };
    const selectSummary = () => this.switchTab(PauseTab.Summary);
    const selectSkills = () => this.switchTab(PauseTab.Skills);
    const selectWeapon = () => this.switchTab(PauseTab.Weapon);
    const selectUpgrades = () => this.switchTab(PauseTab.Upgrades);

    this.input.keyboard!.on("keydown-ESC", resume);
    this.input.keyboard!.on("keydown-ESCAPE", resume);
    this.input.keyboard!.on("keydown-TAB", nextTab);
    this.input.keyboard!.on("keydown-ONE", selectSummary);
    this.input.keyboard!.on("keydown-TWO", selectSkills);
    this.input.keyboard!.on("keydown-THREE", selectWeapon);
    this.input.keyboard!.on("keydown-FOUR", selectUpgrades);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tabButtons = [];
      this.scene.setVisible(true, SceneKey.Game);
      this.scene.setVisible(true, SceneKey.PlayerHud);
      this.input.keyboard?.off("keydown-ESC", resume);
      this.input.keyboard?.off("keydown-ESCAPE", resume);
      this.input.keyboard?.off("keydown-TAB", nextTab);
      this.input.keyboard?.off("keydown-ONE", selectSummary);
      this.input.keyboard?.off("keydown-TWO", selectSkills);
      this.input.keyboard?.off("keydown-THREE", selectWeapon);
      this.input.keyboard?.off("keydown-FOUR", selectUpgrades);
    });
  }

  private createHeader(): void {
    const marginX = this.getMarginX();
    const currentRound = Number(this.game.registry.get("match:round") ?? 1);
    const title = this.add.text(marginX, 34, "OPERATOR", {
      fontFamily: theme.typography.fonts.mono,
      fontSize: theme.typography.sizes.display_xl,
      fontStyle: theme.typography.weights.bold,
      color: theme.semantic.text.accent_scan,
      letterSpacing: theme.typography.letter_spacing.wide,
    });
    const subtitle = this.add.text(
      marginX,
      82,
      `GAME_FEED: DISCONNECTED // ZONE_ID: R-${currentRound.toString().padStart(2, "0")}`,
      {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.xs,
        color: theme.semantic.text.cooldown,
      },
    );
    const controls = this.add
      .text(this.scale.width - marginX, 82, "TAB / 1 / 2 / 3 / 4 TO NAVIGATE", {
        fontFamily: theme.typography.fonts.mono,
        fontSize: theme.typography.sizes.sm,
        color: theme.semantic.text.soft,
      })
      .setOrigin(1, 0);

    this.mainContainer.add([title, subtitle, controls]);
  }

  private createTabBar(): void {
    const marginX = this.getMarginX();
    const gap = 12;
    const totalWidth = this.getContentWidth();
    const tabWidth =
      (totalWidth - gap * (TAB_DEFINITIONS.length - 1)) /
      TAB_DEFINITIONS.length;

    this.tabsContainer = this.add.container(marginX, 126).setDepth(1200);
    this.mainContainer.add(this.tabsContainer);

    TAB_DEFINITIONS.forEach((definition, index) => {
      const x = index * (tabWidth + gap);
      const background = this.add
        .rectangle(
          x,
          0,
          tabWidth,
          42,
          hexToNumber(theme.semantic.surface.panel_elevated),
          0.82,
        )
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.switchTab(definition.id));
      const label = this.add
        .text(x + tabWidth / 2, 21, definition.label, {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.sm,
          fontStyle: theme.typography.weights.bold,
          color: theme.semantic.text.soft,
        })
        .setOrigin(0.5);

      this.tabButtons.push({ tab: definition.id, background, label });
      this.tabsContainer.add([background, label]);
    });
  }

  private switchTab(tab: PauseTab): void {
    this.activeTab = tab;
    this.contentCursorY = 0;
    this.contentContainer.removeAll(true);
    this.updateTabVisuals();

    const context: PauseTabRenderContext = {
      scene: this,
      container: this.contentContainer,
      player: this.player,
      bundle: this.bundle,
      contentWidth: this.getContentWidth(),
      refreshTab: () => this.switchTab(this.activeTab),
      drawSection: this.drawSection.bind(this),
      getModeColor: this.getModeColor.bind(this),
      getSkillStatus: this.getSkillStatus.bind(this),
      formatSkillDescription: this.formatSkillDescription.bind(this),
    };

    switch (tab) {
      case PauseTab.Skills:
        renderPauseSkillsTab(context);
        break;
      case PauseTab.Weapon:
        renderPauseWeaponTab(context);
        break;
      case PauseTab.Upgrades:
        renderPauseUpgradesTab(context);
        break;
      default:
        renderPauseSummaryTab(context);
        break;
    }
  }

  private updateTabVisuals(): void {
    this.tabButtons = this.tabButtons.filter(
      (button) =>
        Boolean(button.background.scene) &&
        Boolean(button.label.scene) &&
        button.background.active &&
        button.label.active,
    );

    this.tabButtons.forEach((button) => {
      const isActive = button.tab === this.activeTab;
      button.background
        .setFillStyle(
          hexToNumber(
            isActive
              ? theme.semantic.text.accent_scan
              : theme.semantic.surface.panel_elevated,
          ),
          isActive ? 0.18 : 0.82,
        )
        .setStrokeStyle(
          isActive ? 1 : 0,
          hexToNumber(theme.semantic.text.accent_scan),
          0.34,
        );
      button.label.setColor(
        isActive ? theme.semantic.text.primary : theme.semantic.text.separator,
      );
    });
  }

  private drawSection(
    section: string | PauseSectionOptions,
    children: PauseBlockChildren,
  ): void {
    const options = typeof section === "string" ? { title: section } : section;
    const block = createPauseBlockComponent(this, {
      title: options.title,
      subtitle: options.subtitle,
      description: options.description,
      headerRightText: options.headerRightText,
      headerRightColor: options.headerRightColor,
      y: this.contentCursorY,
      children,
    });

    this.contentContainer.add(block.root);
    this.contentCursorY += block.height + PAUSE_BLOCK_GAP;
  }

  private createFooter(): void {
    const prompt = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 28,
        "[ PRESS ESC TO RE-ESTABLISH NEURAL LINK ]",
        {
          fontFamily: theme.typography.fonts.mono,
          fontSize: theme.typography.sizes.md,
          fontStyle: theme.typography.weights.bold,
          color: theme.semantic.text.accent_scan,
        },
      )
      .setOrigin(0.5)
      .setDepth(1200);

    this.tweens.add({
      targets: prompt,
      alpha: 0.28,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private getSkillStatus(name: string): string {
    if (name === "Dash") {
      return this.player.dashCooldownTimer > 0
        ? `RECHARGING ${(this.player.dashCooldownTimer / 1000).toFixed(1)}S`
        : "";
    }

    if (name === "Blast" || name === "Blow") {
      return this.player.blowCooldownTimer > 0
        ? `RECHARGING ${(this.player.blowCooldownTimer / 1000).toFixed(1)}S`
        : "";
    }

    if (this.player.burstActive) {
      return `STATUS ACTIVE ${(this.player.burstTimerMs / 1000).toFixed(1)}S`;
    }

    return this.player.burstCooldownTimer > 0
      ? `RECHARGING ${(this.player.burstCooldownTimer / 1000).toFixed(1)}S`
      : "";
  }

  private formatSkillDescription(skill: PlayerSkillConfig): string {
    if (skill.name !== "Burst") return skill.description;

    const movePct = Math.round((skill.moveSpeedBonusRatio ?? 0) * 100);
    const cadencePct = Math.round((skill.fireRateBonusRatio ?? 0) * 100);
    const reloadPct = Math.round((skill.reloadSpeedBonusRatio ?? 0) * 100);
    const durationSec = skill.durationSec ?? 0;

    return `${skill.description} MOVE +${movePct}% | CADENCE +${cadencePct}% | RELOAD +${reloadPct}% | ${durationSec.toFixed(1)}S`;
  }

  private getModeColor(mode: string): string {
    switch (mode.toLowerCase()) {
      case "power":
        return theme.semantic.mode.power;
      case "spread":
        return theme.semantic.mode.spread;
      default:
        return theme.semantic.mode.standard;
    }
  }

  private getMarginX(): number {
    return this.scale.width * 0.05;
  }

  private getContentWidth(): number {
    return this.scale.width - this.getMarginX() * 2;
  }
}
