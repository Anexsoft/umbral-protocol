/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GAME_DEBUG?: string;
	readonly VITE_GAME_START_ROUND?: string;
	readonly VITE_DIFFICULTY_SCALING?: string;
	readonly VITE_PLAYER_NAME?: string;
	readonly VITE_PLAYER_CREDITS?: string;
	readonly VITE_PLAYER_LEVEL?: string;
	readonly VITE_PLAYER_PRIMARY_EXTENDED_MAGAZINE_LEVEL?: string;
	readonly VITE_PLAYER_PRIMARY_RELOAD_OPTIMIZATION_LEVEL?: string;
	readonly VITE_PLAYER_PRIMARY_FIRE_RATE_OPTIMIZATION_LEVEL?: string;
	readonly VITE_PLAYER_PRIMARY_CRITICAL_PROTOCOL_LEVEL?: string;
	readonly VITE_PLAYER_PRIMARY_MODE_IMPROVEMENT_LEVEL?: string;
	readonly VITE_PLAYER_SECONDARY_KNIFE_ENHANCEMENT_LEVEL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
