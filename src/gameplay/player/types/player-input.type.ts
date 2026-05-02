import type { MovementInput } from "@gameplay/player/types/movement-input.type";
import type { SkillInput } from "@gameplay/player/types/skill-input.type";
import type { WeaponInput } from "@gameplay/player/types/weapon-input.type";

export interface PlayerInput extends MovementInput, WeaponInput, SkillInput {}
