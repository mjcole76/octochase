// Enhanced game types for new features

import type { Position } from '../components/gameEntities';

// New power-up types
export type EnhancedPowerUpType = 
  | 'speed' 
  | 'shield' 
  | 'magnet' 
  | 'multiplier' 
  | 'time'
  | 'camouflage'
  | 'shrink'
  | 'freeze'
  | 'score_chain'
  | 'invincibility';

// New food types
export type EnhancedFoodType = 
  | 'crab' 
  | 'shrimp' 
  | 'clam' 
  | 'pearl'
  | 'golden_fish'
  | 'mystery_box'
  | 'combo_extender'
  | 'health_kelp'
  | 'speed_plankton';

// Boss system
export interface Boss {
  id: string;
  name: string;
  type: 'mega_shark' | 'kraken' | 'electric_eel';
  health: number;
  maxHealth: number;
  phase: 1 | 2 | 3;
  position: Position;
  velocity: Position;
  size: number;
  attackPattern: 'circle' | 'charge' | 'pulse' | 'tentacle';
  attackCooldown: number;
  isInvulnerable: boolean;
  specialAbilityReady: boolean;
}

// Dynamic events
export interface DynamicEvent {
  id: string;
  type: 'feeding_frenzy' | 'predator_swarm' | 'treasure_chest' | 'whirlpool' | 'darkness';
  startTime: number;
  duration: number;
  intensity: number;
  position?: Position;
  active: boolean;
}

// Upgrade system
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'ability' | 'stats' | 'passive';
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: {
    type: string;
    value: number;
  };
}

// Daily challenge
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  objective: {
    type: 'collect' | 'survive' | 'combo' | 'score' | 'speed';
    target: number;
    current: number;
  };
  reward: {
    xp: number;
    currency: number;
    item?: string;
  };
  expiresAt: Date;
  completed: boolean;
}

// Combo tricks
export interface ComboTrick {
  type: 'perfect_pickup' | 'chain_collection' | 'near_miss' | 'stylish_dash';
  multiplier: number;
  timestamp: number;
}

// Score modifiers
export interface ScoreModifier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  enabled: boolean;
  effect: string;
}

// Ghost racing data
export interface GhostData {
  positions: Array<{ time: number; position: Position; rotation: number }>;
  score: number;
  time: number;
}

// Octopus personality
export type OctopusMood = 'happy' | 'scared' | 'excited' | 'tired' | 'confident' | 'hurt';

// Bonus Goals System
export interface BonusGoal {
  id: string;
  title: string;
  description: string;
  type: 'collect_food' | 'survive_time' | 'reach_score' | 'avoid_damage' | 'collect_powerups' | 'combo_streak';
  target: number;
  current: number;
  completed: boolean;
  reward: {
    points: number;
    currency: number;
  };
  icon: string;
}

export type GameModeType = 'classic' | 'survival' | 'time_attack' | 'endless' | 'challenge' | 'speed_run' | 'zen' | 'puzzle' | 'treasure_hunt';
