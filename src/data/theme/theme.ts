import motionYaml from "@data/theme/motion.yml?raw";
import paletteYaml from "@data/theme/palette.yml?raw";
import semanticYaml from "@data/theme/semantic.yml?raw";
import typographyYaml from "@data/theme/typography.yml?raw";

import yaml from "js-yaml";

type PaletteDoc = {
  surface: Record<string, string>;
  neutral: Record<string, string>;
  accent: Record<string, string>;
  warning: Record<string, string>;
  danger: Record<string, string>;
  success: Record<string, string>;
  special: Record<string, string>;
};

type TypographyDoc = {
  fonts: Record<string, string>;
  sizes: Record<string, string>;
  weights: Record<string, string>;
  letter_spacing: Record<string, number>;
};

type SemanticDoc = {
  transparent: string;
  text: Record<string, string>;
  surface: Record<string, string>;
  gfx: Record<string, string>;
  fx: Record<string, string>;
  mode: Record<string, string>;
};

type MotionDoc = {
  blink: {
    interval_ms: number;
    alpha_on: number;
    alpha_off: number;
  };
  durations: Record<string, number>;
};

export type GameTheme = {
  palette: PaletteDoc;
  typography: TypographyDoc;
  semantic: SemanticDoc;
  motion: MotionDoc;
};

function parseYaml<T>(source: string): T {
  return yaml.load(source) as T;
}

const theme: GameTheme = {
  palette: parseYaml<PaletteDoc>(paletteYaml),
  typography: parseYaml<TypographyDoc>(typographyYaml),
  semantic: parseYaml<SemanticDoc>(semanticYaml),
  motion: parseYaml<MotionDoc>(motionYaml),
};

export function getTheme(): GameTheme {
  return theme;
}

export function hexToNumber(value: string): number {
  const normalized = value.trim().replace(/^#/, "");
  return Number.parseInt(normalized, 16);
}
