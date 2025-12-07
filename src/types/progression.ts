export interface PlayerProgression {
  level: number
  xp: number
  xpToNext: number
  totalXp: number
  skillPoints: number
  unlockedAbilities: string[]
  unlockedSkins: string[]
  unlockedBackgrounds: string[]
  unlockedTrails: string[]
}

export interface SkillNode {
  id: string
  name: string
  description: string
  cost: number
  prerequisites: string[]
  unlocked: boolean
  effect: SkillEffect
}

export interface SkillEffect {
  type: 'speed' | 'defense' | 'attack' | 'special' | 'utility'
  value: number
  description: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: 'score' | 'survival' | 'combo' | 'level' | 'collection' | 'special'
  requirement: AchievementRequirement
  reward: AchievementReward
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

export interface AchievementRequirement {
  type: string
  value: number
  condition?: string
}

export interface AchievementReward {
  type: 'xp' | 'skillPoints' | 'unlock' | 'title'
  value: number
  unlockType?: 'skin' | 'background' | 'ability' | 'trail'
  unlockId?: string
}

export interface UnlockableContent {
  id: string
  name: string
  type: 'skin' | 'background' | 'ability' | 'trail'
  description: string
  unlockRequirement: {
    type: 'level' | 'achievement' | 'skillPoints'
    value: number | string
  }
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ProgressionState {
  player: PlayerProgression
  achievements: Achievement[]
  unlockables: UnlockableContent[]
  skillTree: SkillNode[]
}