import type * as Phaser from "phaser";

import { getTheme } from "@data/theme/theme";
import type { PlayerSkillConfig } from "@data/player/types";
import type { GameDataBundle } from "@data/types";

import type { Player } from "@gameplay/player/player";

export enum PauseTab {
  Summary = 0,
  Skills = 1,
  Weapon = 2,
}

export interface PauseTabDefinition {
  id: PauseTab;
  label: string;
}

export type PauseBlockChildren = (
  container: Phaser.GameObjects.Container,
  contentWidth: number,
) => number;

export interface PauseSectionOptions {
  title: string;
  subtitle?: string;
  description?: string;
}

export interface PauseTabRenderContext {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  player: Player;
  bundle: GameDataBundle;
  contentWidth: number;
  drawSection: (
    section: string | PauseSectionOptions,
    children: PauseBlockChildren,
  ) => void;
  getModeColor: (mode: string) => string;
  getSkillStatus: (name: string) => string;
  formatSkillDescription: (skill: PlayerSkillConfig) => string;
}

export type PauseTheme = ReturnType<typeof getTheme>;
