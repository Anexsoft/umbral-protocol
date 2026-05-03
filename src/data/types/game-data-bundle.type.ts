import type {
  EnemyLevelScalingConfig,
  EnemyYamlEntry,
} from "@data/enemies/types";
import type {
  HealthConsumableYaml,
  StaminaConsumableYaml,
} from "@data/consumables/types";
import type { PlayerBalanceConfig } from "@data/player/types";
import type {
  RoundConsumableConfig,
  RoundSpawnEntry,
} from "@data/rounds/types";
import type { PrimaryWeaponYaml } from "@data/weapons/primary/types";
import type { SecondaryWeaponYaml } from "@data/weapons/secondary/types";

export interface GameDataBundle {
  player: PlayerBalanceConfig;
  healthPacks: HealthConsumableYaml;
  staminaStims: StaminaConsumableYaml;
  primaryWeapon: PrimaryWeaponYaml;
  secondaryWeapon: SecondaryWeaponYaml;
  enemies: EnemyYamlEntry[];
  enemyById: Map<string, EnemyYamlEntry>;
  enemyLevelScaling: EnemyLevelScalingConfig;
  roundWaves: RoundSpawnEntry[][];
  roundConsumables: RoundConsumableConfig[];
}
