import type { PlayerBaseValues } from "@data/player/types/player-base-stats.type";

export interface PlayerYamlRoot extends PlayerBaseValues {
  name: string;
  level?: number;
  stm_recovery_rate: number;
}
