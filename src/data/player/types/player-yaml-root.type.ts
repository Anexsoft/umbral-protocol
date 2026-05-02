import type { PlayerBaseValues } from "@data/player/types/player-base-stats.type";

export interface PlayerYamlRoot extends PlayerBaseValues {
  name: string;
  stm_recovery_rate: number;
}
