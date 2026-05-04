import gameSettingsYaml from "@data/game/game-settings.yml?raw";
import type { GameSettingsConfig, GameSettingsYaml } from "@data/game/types";
import enemiesYaml from "@data/enemies/enemies.yml?raw";
import enemyScalingYaml from "@data/enemies/enemy-scaling.yml?raw";
import creditPickupYaml from "@data/pickups/credit.yml?raw";
import healthPackYaml from "@data/pickups/health-pack.yml?raw";
import staminaStimYaml from "@data/pickups/stamina-stim.yml?raw";
import type {
  CreditPickupYaml,
  HealthPickupYaml,
  HealthPickupYamlEntry,
  StaminaPickupYaml,
  StaminaPickupYamlEntry,
} from "@data/pickups/types";
import type {
  EnemyLevelScalingConfig,
  EnemyYamlEntry,
} from "@data/enemies/types";
import playerYaml from "@data/player/player.yml?raw";
import playerLevelCurveYaml from "@data/player/level-curve.yml?raw";
import playerLevelGrowthYaml from "@data/player/level-growth.yml?raw";
import playerSkillsYaml from "@data/player/skills.yml?raw";
import type {
  PlayerBalanceConfig,
  PlayerLevelCurveYaml,
  PlayerLevelGrowthConfig,
  PlayerSkillConfig,
  PlayerSkillBlowYaml,
  PlayerSkillBurstYaml,
  PlayerSkillDashYaml,
  PlayerYamlRoot,
} from "@data/player/types";
import roundsYaml from "@data/rounds/rounds.yml?raw";
import type {
  RoundConsumableConfig,
  RoundSpawnEntry,
} from "@data/rounds/types";
import type { GameDataBundle } from "@data/types";
import primaryYaml from "@data/weapons/primary/primary.yml?raw";
import primaryModesYaml from "@data/weapons/primary/primary-modes.yml?raw";
import primaryUpgradeYaml from "@data/weapons/primary/upgrade.yml?raw";
import type {
  PrimaryWeaponCoreYaml,
  PrimaryWeaponModeYaml,
  PrimaryWeaponUpgradeYaml,
  PrimaryWeaponYaml,
} from "@data/weapons/primary/types";
import secondaryYaml from "@data/weapons/secondary/secondary.yml?raw";
import secondaryUpgradeYaml from "@data/weapons/secondary/upgrade.yml?raw";
import type {
  SecondaryWeaponUpgradeYaml,
  SecondaryWeaponYaml,
} from "@data/weapons/secondary/types";

import yaml from "js-yaml";

let cached: GameDataBundle | null = null;

function isEnvDebugEnabled(): boolean {
  const value = import.meta.env.VITE_GAME_DEBUG;
  if (value === undefined || value.trim() === "") return false;

  return value.trim().toLowerCase() === "true";
}

function readEnvNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function applyPlayerEnvOverrides(raw: PlayerYamlRoot): PlayerYamlRoot {
  if (!isEnvDebugEnabled()) return raw;

  const env = import.meta.env;

  return {
    ...raw,
    name: env.VITE_PLAYER_NAME?.trim() || raw.name,
    credits: readEnvNumber(env.VITE_PLAYER_CREDITS, raw.credits ?? 0),
    level: readEnvNumber(env.VITE_PLAYER_LEVEL, raw.level ?? 1),
  };
}

function applyGameSettingsEnvOverrides(
  raw: GameSettingsConfig,
): GameSettingsConfig {
  if (!isEnvDebugEnabled()) return raw;

  const env = import.meta.env;

  return {
    ...raw,
    startRound: Math.max(
      1,
      Math.floor(readEnvNumber(env.VITE_GAME_START_ROUND, raw.startRound)),
    ),
    difficultyScaling: Math.max(
      0.01,
      readEnvNumber(env.VITE_DIFFICULTY_SCALING, raw.difficultyScaling),
    ),
  };
}

const DEFAULT_LEVEL_GROWTH: PlayerLevelGrowthConfig = {
  hp_per_level: 1.2,
  damage_per_level: 0.08,
  stamina_per_level: 0.45,
  speed_per_level: 1,
};

const DEFAULT_ENEMY_LEVEL_SCALING: EnemyLevelScalingConfig = {
  stat_scale_per_level: 0.05,
  size_scale_per_level: 0.02,
  boss_scale_multiplier: 1.08,
};

function parseEnemyLevelScaling(raw: unknown): EnemyLevelScalingConfig {
  const partial = (raw as Partial<EnemyLevelScalingConfig>) ?? {};
  return {
    stat_scale_per_level:
      partial.stat_scale_per_level ??
      DEFAULT_ENEMY_LEVEL_SCALING.stat_scale_per_level,
    size_scale_per_level:
      partial.size_scale_per_level ??
      DEFAULT_ENEMY_LEVEL_SCALING.size_scale_per_level,
    boss_scale_multiplier:
      partial.boss_scale_multiplier ??
      DEFAULT_ENEMY_LEVEL_SCALING.boss_scale_multiplier,
  };
}

function parseGameSettings(raw: unknown): GameSettingsConfig {
  const partial = (raw as GameSettingsYaml) ?? {};

  return applyGameSettingsEnvOverrides({
    startRound: Math.max(1, Math.floor(partial.start_round ?? 1)),
    difficultyScaling:
      typeof partial.difficulty_scaling === "number" &&
      Number.isFinite(partial.difficulty_scaling) &&
      partial.difficulty_scaling > 0
        ? partial.difficulty_scaling
        : 1,
  });
}

function defaultXpToNextLevel(): number[] {
  const deltas: number[] = [];
  for (let i = 0; i < 49; i++) {
    deltas.push(Math.round(48 * Math.pow(1.082, i)));
  }
  return deltas;
}

export function buildLevelXpThresholds(xpToNextLevel: number[]): number[] {
  const deltas =
    xpToNextLevel.length === 49 ? xpToNextLevel : defaultXpToNextLevel();

  const thresholds: number[] = new Array(50).fill(0);
  thresholds[0] = 0;
  let sum = 0;
  for (let i = 0; i < 49; i++) {
    sum += deltas[i];
    thresholds[i + 1] = sum;
  }
  return thresholds;
}

function parsePlayer(
  raw: PlayerYamlRoot,
  levelGrowthRaw: PlayerLevelGrowthConfig | undefined,
  levelCurveRaw: PlayerLevelCurveYaml | undefined,
  skillsRaw:
    | Array<PlayerSkillDashYaml | PlayerSkillBlowYaml | PlayerSkillBurstYaml>
    | undefined,
): PlayerBalanceConfig {
  const skills = skillsRaw ?? [];
  const parsedSkills: PlayerSkillConfig[] = [];
  let dashCooldownSec = 3;
  let dashStaminaCost = 20;
  let dashDistanceBonusRatioMaxLevel = 0;
  let blowCooldownSec = 10;
  let blowStaminaCost = 30;
  let blowDamageMultiplier = 1.5;
  let blowRadiusMax = 120;
  let blowRadiusBonusRatioMaxLevel = 0;
  let burstCooldownSec = 6;
  let burstDurationSec = 4;
  let burstDurationSecMaxLevel = 4;
  let burstStaminaCost = 15;
  let burstMoveSpeedBonusRatio = 0.3;
  let burstMoveSpeedBonusRatioMaxLevel = 0.3;
  let burstFireRateBonusRatio = 0.45;
  let burstFireRateBonusRatioMaxLevel = 0.45;
  let burstReloadSpeedBonusRatio = 0.35;
  let burstReloadSpeedBonusRatioMaxLevel = 0.35;

  for (const skill of skills) {
    const parsedSkill: PlayerSkillConfig = {
      name: skill.name,
      key: skill.key,
      description: skill.description,
      cooldownSec: skill.cooldown,
      staminaCost: skill.stamina_cost,
    };

    if (skill.name === "Dash") {
      dashCooldownSec = skill.cooldown;
      dashStaminaCost = skill.stamina_cost;
      if (
        "distance_bonus_ratio_max_level" in skill &&
        typeof skill.distance_bonus_ratio_max_level === "number"
      ) {
        dashDistanceBonusRatioMaxLevel = skill.distance_bonus_ratio_max_level;
        parsedSkill.distanceBonusRatioMaxLevel =
          skill.distance_bonus_ratio_max_level;
      }
    }
    if (skill.name === "Blast" || skill.name === "Blow") {
      blowCooldownSec = skill.cooldown;
      blowStaminaCost = skill.stamina_cost;
      if (
        "damage_multiplier" in skill &&
        typeof skill.damage_multiplier === "number"
      ) {
        blowDamageMultiplier = skill.damage_multiplier;
        parsedSkill.damageMultiplier = skill.damage_multiplier;
      }
      if ("radius" in skill && typeof skill.radius === "number") {
        blowRadiusMax = skill.radius;
        parsedSkill.radiusMax = skill.radius;
      }
      if (
        "radius_bonus_ratio_max_level" in skill &&
        typeof skill.radius_bonus_ratio_max_level === "number"
      ) {
        blowRadiusBonusRatioMaxLevel = skill.radius_bonus_ratio_max_level;
        parsedSkill.radiusBonusRatioMaxLevel =
          skill.radius_bonus_ratio_max_level;
      }
    }
    if (skill.name === "Burst" || skill.name === "Grenade") {
      burstCooldownSec = skill.cooldown;
      burstStaminaCost = skill.stamina_cost;
      if ("duration" in skill && typeof skill.duration === "number") {
        burstDurationSec = skill.duration;
        parsedSkill.durationSec = skill.duration;
      }
      if (
        "duration_max_level" in skill &&
        typeof skill.duration_max_level === "number"
      ) {
        burstDurationSecMaxLevel = skill.duration_max_level;
        parsedSkill.durationSecMaxLevel = skill.duration_max_level;
      }
      if (
        "move_speed_bonus_ratio" in skill &&
        typeof skill.move_speed_bonus_ratio === "number"
      ) {
        burstMoveSpeedBonusRatio = skill.move_speed_bonus_ratio;
        parsedSkill.moveSpeedBonusRatio = skill.move_speed_bonus_ratio;
      }
      if (
        "move_speed_bonus_ratio_max_level" in skill &&
        typeof skill.move_speed_bonus_ratio_max_level === "number"
      ) {
        burstMoveSpeedBonusRatioMaxLevel =
          skill.move_speed_bonus_ratio_max_level;
        parsedSkill.moveSpeedBonusRatioMaxLevel =
          skill.move_speed_bonus_ratio_max_level;
      }
      if (
        "fire_rate_bonus_ratio" in skill &&
        typeof skill.fire_rate_bonus_ratio === "number"
      ) {
        burstFireRateBonusRatio = skill.fire_rate_bonus_ratio;
        parsedSkill.fireRateBonusRatio = skill.fire_rate_bonus_ratio;
      }
      if (
        "fire_rate_bonus_ratio_max_level" in skill &&
        typeof skill.fire_rate_bonus_ratio_max_level === "number"
      ) {
        burstFireRateBonusRatioMaxLevel =
          skill.fire_rate_bonus_ratio_max_level;
        parsedSkill.fireRateBonusRatioMaxLevel =
          skill.fire_rate_bonus_ratio_max_level;
      }
      if (
        "reload_speed_bonus_ratio" in skill &&
        typeof skill.reload_speed_bonus_ratio === "number"
      ) {
        burstReloadSpeedBonusRatio = skill.reload_speed_bonus_ratio;
        parsedSkill.reloadSpeedBonusRatio = skill.reload_speed_bonus_ratio;
      }
      if (
        "reload_speed_bonus_ratio_max_level" in skill &&
        typeof skill.reload_speed_bonus_ratio_max_level === "number"
      ) {
        burstReloadSpeedBonusRatioMaxLevel =
          skill.reload_speed_bonus_ratio_max_level;
        parsedSkill.reloadSpeedBonusRatioMaxLevel =
          skill.reload_speed_bonus_ratio_max_level;
      }
    }

    parsedSkills.push(parsedSkill);
  }

  const xpToNext = levelCurveRaw ?? defaultXpToNextLevel();
  const levelXpThresholds = buildLevelXpThresholds(xpToNext);
  const initialLevel = Math.min(50, Math.max(1, Math.round(raw.level ?? 1)));

  const baseValues = {
    hp: raw.hp,
    damage: raw.damage,
    stamina: raw.stamina,
    speed: raw.speed,
    scale: raw.scale,
    credits: raw.credits,
    xp: raw.xp,
  };
  if (baseValues.credits === undefined) baseValues.credits = 0;

  return {
    name: raw.name,
    baseValues,
    initialLevel,
    staminaRecoveryRate: raw.stm_recovery_rate,
    levelGrowth: levelGrowthRaw ?? DEFAULT_LEVEL_GROWTH,
    dashCooldownSec,
    dashStaminaCost,
    dashDistanceBonusRatioMaxLevel,
    blowCooldownSec,
    blowStaminaCost,
    blowDamageMultiplier,
    blowRadiusMax,
    blowRadiusBonusRatioMaxLevel,
    burstCooldownSec,
    burstDurationSec,
    burstDurationSecMaxLevel,
    burstStaminaCost,
    burstMoveSpeedBonusRatio,
    burstMoveSpeedBonusRatioMaxLevel,
    burstFireRateBonusRatio,
    burstFireRateBonusRatioMaxLevel,
    burstReloadSpeedBonusRatio,
    burstReloadSpeedBonusRatioMaxLevel,
    levelXpThresholds,
    skills: parsedSkills,
  };
}

function parsePrimaryWeapon(
  core: PrimaryWeaponCoreYaml,
  modesRaw: unknown,
  upgradesRaw: unknown,
): PrimaryWeaponYaml {
  const modes = (modesRaw as Record<string, PrimaryWeaponModeYaml>) ?? {};
  const upgrades = (upgradesRaw as PrimaryWeaponUpgradeYaml) ?? {
    extended_magazine: {
      name: "Extended Magazine",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      ammo_bonus_max_level: 0,
    },
    reload_optimization: {
      name: "Reload Optimization",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      reload_time_reduction_ratio_max_level: 0,
    },
    fire_rate_optimization: {
      name: "Fire Rate Optimization",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      fire_rate_reduction_ratio_max_level: 0,
    },
    critical_protocol: {
      name: "Critical Protocol",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      unlocks_critical_on_level: 1,
      crit_chance_ratio_max_level: 0,
      crit_damage_multiplier: 1,
    },
    mode_improvement: {
      name: "Mode Improvement",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      single: { fire_rate_reduction_ratio_max_level: 0 },
      spread: {
        bonus_pellets_max_level: 0,
        spread_damage_multiplier_bonus_max_level: 0,
      },
      power: { damage_multiplier_bonus_max_level: 0 },
    },
  };
  return {
    ...core,
    modes,
    upgrades,
  };
}

function parseSecondaryWeapon(
  raw: SecondaryWeaponYaml,
  upgradesRaw: unknown,
): SecondaryWeaponYaml {
  const upgrades = (upgradesRaw as SecondaryWeaponUpgradeYaml) ?? {
    knife_enhancement: {
      name: "Knife Enhancement",
      level: 0,
      max_level: 0,
      base_cost: 0,
      next_level_cost_multiplier: 1,
      damage_bonus_ratio_max_level: 0,
      radius_bonus_max_level: 0,
    },
  };

  const radiusMaxLevel =
    typeof raw.radius_max_level === "number" && raw.radius_max_level > 0
      ? raw.radius_max_level
      : raw.radius;

  return {
    ...raw,
    radius: raw.radius,
    radius_max_level: radiusMaxLevel,
    upgrades,
  };
}

function parseEnemies(raw: unknown): EnemyYamlEntry[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  return Object.entries(raw)
    .filter(([id, entry]) => {
      return !!id.trim() && typeof entry === "object" && entry !== null;
    })
    .map(([id, entry]) => {
      const parsed = entry as Omit<EnemyYamlEntry, "id">;
      return {
        ...parsed,
        id,
        type: parsed.type === "range" ? "range" : "melee",
        attack_cooldown:
          typeof parsed.attack_cooldown === "number" &&
          parsed.attack_cooldown > 0
            ? parsed.attack_cooldown
            : 1,
        attack_range:
          typeof parsed.attack_range === "number" && parsed.attack_range > 0
            ? parsed.attack_range
            : 48,
      };
    });
}

function parseKeyedEntries<T extends object>(raw: unknown): Record<string, T> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw).filter(([id, entry]) => {
      return !!id.trim() && typeof entry === "object" && entry !== null;
    }),
  ) as Record<string, T>;
}

function parseHealthPacks(raw: unknown): HealthPickupYaml {
  return parseKeyedEntries<HealthPickupYamlEntry>(raw);
}

function parseStaminaStims(raw: unknown): StaminaPickupYaml {
  return parseKeyedEntries<StaminaPickupYamlEntry>(raw);
}

function parseCreditPickup(raw: unknown): CreditPickupYaml {
  const parsed = (raw as Partial<CreditPickupYaml>) ?? {};
  return {
    name: parsed.name,
    scale:
      typeof parsed.scale === "number" && parsed.scale > 0 ? parsed.scale : 0.5,
  };
}

function parseRoundWaves(raw: unknown): RoundSpawnEntry[][] {
  if (!raw || !Array.isArray(raw)) return [];

  const waves: RoundSpawnEntry[][] = [];

  for (const wave of raw) {
    const spawns: RoundSpawnEntry[] = [];

    if (Array.isArray(wave)) {
      for (const entry of wave) {
        if (typeof entry !== "object" || entry === null) continue;
        const keys = Object.keys(entry as object);
        if (keys.length !== 1) continue;

        const id = keys[0];
        const level = (entry as Record<string, number>)[id];
        if (typeof level !== "number" || level < 1) continue;
        spawns.push({ id, levelMin: level, levelMax: level });
      }

      waves.push(spawns);
      continue;
    }

    if (typeof wave !== "object" || wave === null) continue;

    const roundEntry = wave as {
      round?: number;
      enemies?: Array<{
        id?: string;
        type?: string;
        count?: number;
        level?: number | [number, number];
      }>;
    };

    if (!Array.isArray(roundEntry.enemies)) {
      waves.push(spawns);
      continue;
    }

    const defaultLevel =
      typeof roundEntry.round === "number" && roundEntry.round > 0
        ? roundEntry.round
        : 1;

    for (const enemy of roundEntry.enemies) {
      const enemyId =
        typeof enemy?.id === "string" && enemy.id.trim()
          ? enemy.id
          : typeof enemy?.type === "string" && enemy.type.trim()
            ? enemy.type
            : undefined;

      if (!enemyId) {
        continue;
      }

      const count =
        typeof enemy.count === "number" && enemy.count > 0
          ? Math.floor(enemy.count)
          : 0;
      let levelMin = defaultLevel;
      let levelMax = defaultLevel;

      if (typeof enemy.level === "number" && enemy.level > 0) {
        levelMin = Math.floor(enemy.level);
        levelMax = levelMin;
      } else if (
        Array.isArray(enemy.level) &&
        enemy.level.length === 2 &&
        typeof enemy.level[0] === "number" &&
        typeof enemy.level[1] === "number"
      ) {
        levelMin = Math.max(
          1,
          Math.floor(Math.min(enemy.level[0], enemy.level[1])),
        );
        levelMax = Math.max(
          levelMin,
          Math.floor(Math.max(enemy.level[0], enemy.level[1])),
        );
      }

      for (let i = 0; i < count; i++) {
        spawns.push({ id: enemyId, levelMin, levelMax });
      }
    }

    waves.push(spawns);
  }

  return waves;
}

function parseRoundConsumables(raw: unknown): RoundConsumableConfig[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((wave) => {
    if (typeof wave !== "object" || wave === null || Array.isArray(wave)) {
      return { total: 0 };
    }

    const roundEntry = wave as {
      consumables?: {
        total?: number;
      };
    };

    return {
      total: Math.max(0, Math.floor(roundEntry.consumables?.total ?? 0)),
    };
  });
}

function buildBundle(): GameDataBundle {
  if (!gameSettingsYaml) throw new Error("game settings yml missing");
  if (!playerYaml) throw new Error("player.yml missing");
  if (!playerLevelCurveYaml) throw new Error("player level curve yml missing");
  if (!playerLevelGrowthYaml)
    throw new Error("player level growth yml missing");
  if (!playerSkillsYaml) throw new Error("player skills yml missing");
  if (!creditPickupYaml) throw new Error("credit pickup yml missing");
  if (!healthPackYaml) throw new Error("player health pack yml missing");
  if (!staminaStimYaml) throw new Error("player stamina stim yml missing");
  if (!primaryYaml) throw new Error("primary weapon yml missing");
  if (!primaryModesYaml) throw new Error("primary weapon modes yml missing");
  if (!primaryUpgradeYaml)
    throw new Error("primary weapon upgrade yml missing");
  if (!secondaryYaml) throw new Error("secondary weapon yml missing");
  if (!secondaryUpgradeYaml)
    throw new Error("secondary weapon upgrade yml missing");
  if (!enemiesYaml) throw new Error("enemies.yml missing");
  if (!enemyScalingYaml) throw new Error("enemy-scaling.yml missing");
  if (!roundsYaml) throw new Error("rounds.yml missing");

  const gameSettings = parseGameSettings(yaml.load(gameSettingsYaml));
  const playerRoot = applyPlayerEnvOverrides(
    yaml.load(playerYaml) as PlayerYamlRoot,
  );
  const playerLevelCurve = yaml.load(
    playerLevelCurveYaml,
  ) as PlayerLevelCurveYaml;
  const playerLevelGrowth = yaml.load(
    playerLevelGrowthYaml,
  ) as PlayerLevelGrowthConfig;
  const playerSkills = yaml.load(playerSkillsYaml) as Array<
    PlayerSkillDashYaml | PlayerSkillBlowYaml | PlayerSkillBurstYaml
  >;
  const creditPickup = parseCreditPickup(yaml.load(creditPickupYaml));
  const healthPacks = parseHealthPacks(yaml.load(healthPackYaml));
  const staminaStims = parseStaminaStims(yaml.load(staminaStimYaml));
  const primaryWeaponCore = yaml.load(primaryYaml) as PrimaryWeaponCoreYaml;
  const primaryWeapon = parsePrimaryWeapon(
    primaryWeaponCore,
    yaml.load(primaryModesYaml),
    yaml.load(primaryUpgradeYaml),
  );
  const secondaryWeapon = parseSecondaryWeapon(
    yaml.load(secondaryYaml) as SecondaryWeaponYaml,
    yaml.load(secondaryUpgradeYaml),
  );
  const enemies = parseEnemies(yaml.load(enemiesYaml));
  const enemyLevelScaling = parseEnemyLevelScaling(yaml.load(enemyScalingYaml));
  const roundsRaw = yaml.load(roundsYaml);
  const roundWaves = parseRoundWaves(roundsRaw);
  const roundConsumables = parseRoundConsumables(roundsRaw);
  const enemyById = new Map<string, EnemyYamlEntry>();

  for (const enemy of enemies) {
    enemyById.set(enemy.id, enemy);
  }

  return {
    gameSettings,
    player: parsePlayer(
      playerRoot,
      playerLevelGrowth,
      playerLevelCurve,
      playerSkills,
    ),
    creditPickup,
    healthPacks,
    staminaStims,
    primaryWeapon,
    secondaryWeapon,
    enemies,
    enemyById,
    enemyLevelScaling,
    roundWaves,
    roundConsumables,
  };
}

export function getGameData(): GameDataBundle {
  if (!cached) {
    cached = buildBundle();
  }
  return cached;
}

export function ensureGameDataLoaded(): void {
  getGameData();
}
