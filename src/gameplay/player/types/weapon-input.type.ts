import type * as Phaser from "phaser";

export interface WeaponInput {
  leftClick: boolean;
  rightClick: boolean;
  key1: Phaser.Input.Keyboard.Key;
  key2: Phaser.Input.Keyboard.Key;
  key3: Phaser.Input.Keyboard.Key;
  keyR: Phaser.Input.Keyboard.Key;
}
