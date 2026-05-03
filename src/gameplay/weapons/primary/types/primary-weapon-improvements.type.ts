export interface PrimaryWeaponImprovements {
  extendedMagazine: number;
  reloadOptimization: number;
  fireRateOptimization: number;
  criticalProtocol: number;
  modeImprovement: number;
}

export type PrimaryWeaponImprovementKey = keyof PrimaryWeaponImprovements;
