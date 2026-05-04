export interface GameSettingsConfig {
  startRound: number;
  difficultyScaling: number;
}

export interface GameSettingsYaml {
  start_round?: number;
  difficulty_scaling?: number;
}