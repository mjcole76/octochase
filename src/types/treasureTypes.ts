import type { Position } from '../components/gameEntities';

export type TreasureRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Treasure {
  id: string;
  position: Position;
  rarity: TreasureRarity;
  value: number;
  isLocked: boolean;
  keyRequired?: string;
  collected: boolean;
  revealed: boolean; // Whether the player has found the map piece
}

export interface TreasureMap {
  id: string;
  position: Position;
  collected: boolean;
  revealsArea: {
    x: number;
    y: number;
    radius: number;
  };
  treasuresRevealed: string[]; // IDs of treasures this map reveals
}

export interface TreasureKey {
  id: string;
  position: Position;
  collected: boolean;
  unlocksChest: string; // Treasure ID this key unlocks
}

export interface TreasureRadar {
  active: boolean;
  targetTreasure: string | null;
  distance: number;
  direction: 'warmer' | 'colder' | 'hot' | 'cold';
}

export const TREASURE_VALUES: Record<TreasureRarity, number> = {
  common: 100,
  rare: 500,
  epic: 1000,
  legendary: 5000
};

export const TREASURE_COLORS: Record<TreasureRarity, string> = {
  common: '#CD7F32', // Bronze
  rare: '#C0C0C0',   // Silver
  epic: '#FFD700',   // Gold
  legendary: '#9B59B6' // Purple
};

export const TREASURE_EMOJIS: Record<TreasureRarity, string> = {
  common: '📦',
  rare: '💎',
  epic: '👑',
  legendary: '🏆'
};
