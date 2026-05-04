import type { Player } from "@gameplay/player/player";
import type { PlayerInput } from "@gameplay/player/types";
import { PrimaryWeaponMode } from "@gameplay/weapons/primary/types";

type WeaponControlHandlerInput = {
  player: Player;
  input: PlayerInput;
  time: number;
};

export class WeaponControlHandler {
  handle({ player, input, time }: WeaponControlHandlerInput): void {
    if (input.key1?.isDown)
      player.primaryWeapon.setMode(PrimaryWeaponMode.single);
    if (input.key2?.isDown)
      player.primaryWeapon.setMode(PrimaryWeaponMode.spread);
    if (input.key3?.isDown)
      player.primaryWeapon.setMode(PrimaryWeaponMode.power);

    if (input.leftClick) {
      const bulletDamage = player.scaleDamage();
      player.primaryWeapon.tryFire(
        player.x,
        player.y,
        time,
        bulletDamage,
        player.primaryFireIntervalMultiplier,
      );
    }

    if (
      input.rightClick &&
      player.stamina >= player.secondaryWeapon.staminaCost
    ) {
      const meleeDamage = player.scaleDamage(
        1 + player.secondaryWeapon.damageBonusRatio,
      );
      const attacked = player.secondaryWeapon.tryAttack(
        player.x,
        player.y,
        meleeDamage,
        player.lvl,
      );
      if (attacked) {
        player.consumeStamina(player.secondaryWeapon.staminaCost);
      }
    }

    if (input.keyR?.isDown) {
      player.primaryWeapon.reload(player.primaryReloadDurationMultiplier);
    }
  }
}
