export interface EnemyBaseStats {
  vit: number;
  attack: number;
  speed: number;
  defense: number;
  rewards: [number, number];
  score: [number, number];
  xp?: [number, number];
  scale: number;
}
