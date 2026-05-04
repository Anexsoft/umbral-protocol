import type { GameSettingsConfig } from "@data/game/types";
import type {
  EnemyLevelScalingConfig,
  EnemyYamlEntry,
} from "@data/enemies/types";
import type {
  CreditPickupYaml,
  HealthPickupYaml,
  StaminaPickupYaml,
} from "@data/pickups/types";
import type { PlayerBalanceConfig } from "@data/player/types";
import type {
  RoundConsumableConfig,
  RoundSpawnEntry,
} from "@data/rounds/types";
import type { PrimaryWeaponYaml } from "@data/weapons/primary/types";
import type { SecondaryWeaponYaml } from "@data/weapons/secondary/types";

export interface GameDataBundle {
  gameSettings: GameSettingsConfig;
  player: PlayerBalanceConfig;
  creditPickup: CreditPickupYaml;
  healthPacks: HealthPickupYaml;
  staminaStims: StaminaPickupYaml;
  primaryWeapon: PrimaryWeaponYaml;
  secondaryWeapon: SecondaryWeaponYaml;
  enemies: EnemyYamlEntry[];
  enemyById: Map<string, EnemyYamlEntry>;
  enemyLevelScaling: EnemyLevelScalingConfig;
  roundWaves: RoundSpawnEntry[][];
  roundConsumables: RoundConsumableConfig[];
}
