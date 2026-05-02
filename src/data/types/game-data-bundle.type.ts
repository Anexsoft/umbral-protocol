import type {
  EnemyLevelScalingConfig,
  EnemyYamlEntry,
} from "@data/enemies/types";
import type { PlayerBalanceConfig } from "@data/player/types";
import type { RoundSpawnEntry } from "@data/rounds/types";
import type { PrimaryWeaponYaml } from "@data/weapons/primary/types";
import type { SecondaryWeaponYaml } from "@data/weapons/secondary/types";

export interface GameDataBundle {
  player: PlayerBalanceConfig;
  primaryWeapon: PrimaryWeaponYaml;
  secondaryWeapon: SecondaryWeaponYaml;
  enemies: EnemyYamlEntry[];
  enemyById: Map<string, EnemyYamlEntry>;
  enemyLevelScaling: EnemyLevelScalingConfig;
  roundWaves: RoundSpawnEntry[][];
}
