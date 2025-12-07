import { supabase } from './supabase'
import type { PlayerProgression, Achievement, SkillNode, UnlockableContent, ProgressionState } from '../types/progression'
import type { GameStats } from './gameService'

export class ProgressionService {
  private static readonly XP_BASE = 100
  private static readonly XP_MULTIPLIER = 1.5

  static calculateXpForLevel(level: number): number {
    return Math.floor(this.XP_BASE * Math.pow(this.XP_MULTIPLIER, level - 1))
  }

  static calculateLevelFromXp(totalXp: number): number {
    let level = 1
    let xpRequired = 0
    
    while (xpRequired <= totalXp) {
      xpRequired += this.calculateXpForLevel(level)
      if (xpRequired <= totalXp) level++
    }
    
    return level
  }

  static calculateXpFromGameStats(stats: GameStats): number {
    let xp = 0
    
    // Base XP from score
    xp += Math.floor(stats.score / 100)
    
    // Bonus XP for levels
    xp += stats.level * 50
    
    // Combo bonus
    xp += Math.floor(stats.combo / 5) * 25
    
    // Survival bonus
    xp += Math.floor(stats.duration / 10000) * 10
    
    // Medal bonus
    switch (stats.medal) {
      case 'bronze': xp += 50; break
      case 'silver': xp += 100; break
      case 'gold': xp += 200; break
    }
    
    // Additional stats bonuses
    xp += (stats.totalEnemiesDefeated || 0) * 5
    xp += (stats.totalFoodCollected || 0) * 3
    xp += (stats.powerUpsUsed || 0) * 15
    
    return Math.max(25, xp) // Minimum 25 XP per game
  }

  static async getPlayerProgression(playerId: string): Promise<PlayerProgression> {
    const { data, error } = await supabase
      .from('player_progression')
      .select('*')
      .eq('player_id', playerId)
      .single()

    if (error || !data) {
      // Create initial progression
      const initialProgression: PlayerProgression = {
        level: 1,
        xp: 0,
        xpToNext: this.calculateXpForLevel(1),
        totalXp: 0,
        skillPoints: 0,
        unlockedAbilities: [],
        unlockedSkins: ['default'],
        unlockedBackgrounds: ['ocean'],
        unlockedTrails: []
      }
      
      await this.createInitialProgression(playerId, initialProgression)
      return initialProgression
    }

    return {
      level: data.level,
      xp: data.current_xp,
      xpToNext: data.xp_to_next,
      totalXp: data.total_xp,
      skillPoints: data.skill_points,
      unlockedAbilities: data.unlocked_abilities || [],
      unlockedSkins: data.unlocked_skins || ['default'],
      unlockedBackgrounds: data.unlocked_backgrounds || ['ocean'],
      unlockedTrails: data.unlocked_trails || []
    }
  }

  private static async createInitialProgression(playerId: string, progression: PlayerProgression): Promise<void> {
    await supabase
      .from('player_progression')
      .insert([{
        player_id: playerId,
        level: progression.level,
        current_xp: progression.xp,
        xp_to_next: progression.xpToNext,
        total_xp: progression.totalXp,
        skill_points: progression.skillPoints,
        unlocked_abilities: progression.unlockedAbilities,
        unlocked_skins: progression.unlockedSkins,
        unlocked_backgrounds: progression.unlockedBackgrounds,
        unlocked_trails: progression.unlockedTrails
      }])
  }

  static async addXpAndUpdateProgression(playerId: string, xpGained: number): Promise<{ 
    leveledUp: boolean, 
    newLevel: number, 
    skillPointsGained: number,
    progression: PlayerProgression 
  }> {
    const currentProgression = await this.getPlayerProgression(playerId)
    
    const newTotalXp = currentProgression.totalXp + xpGained
    const newLevel = this.calculateLevelFromXp(newTotalXp)
    const leveledUp = newLevel > currentProgression.level
    const skillPointsGained = leveledUp ? (newLevel - currentProgression.level) : 0
    
    // Calculate current XP within level
    let currentXpInLevel = 0
    let totalXpForCurrentLevel = 0
    
    for (let i = 1; i < newLevel; i++) {
      totalXpForCurrentLevel += this.calculateXpForLevel(i)
    }
    
    currentXpInLevel = newTotalXp - totalXpForCurrentLevel
    const xpToNext = this.calculateXpForLevel(newLevel) - currentXpInLevel
    
    const updatedProgression: PlayerProgression = {
      ...currentProgression,
      level: newLevel,
      xp: currentXpInLevel,
      xpToNext,
      totalXp: newTotalXp,
      skillPoints: currentProgression.skillPoints + skillPointsGained
    }
    
    // Update database
    await supabase
      .from('player_progression')
      .update({
        level: updatedProgression.level,
        current_xp: updatedProgression.xp,
        xp_to_next: updatedProgression.xpToNext,
        total_xp: updatedProgression.totalXp,
        skill_points: updatedProgression.skillPoints,
        updated_at: new Date().toISOString()
      })
      .eq('player_id', playerId)
    
    return {
      leveledUp,
      newLevel,
      skillPointsGained,
      progression: updatedProgression
    }
  }

  static getSkillTree(): SkillNode[] {
    return [
      // Speed Branch
      {
        id: 'speed_1',
        name: 'Swift Swimming',
        description: 'Increases octopus movement speed by 15%',
        cost: 1,
        prerequisites: [],
        unlocked: false,
        effect: { type: 'speed', value: 0.15, description: '+15% movement speed' }
      },
      {
        id: 'speed_2',
        name: 'Ocean Current',
        description: 'Increases movement speed by 30%',
        cost: 2,
        prerequisites: ['speed_1'],
        unlocked: false,
        effect: { type: 'speed', value: 0.30, description: '+30% movement speed' }
      },
      {
        id: 'speed_3',
        name: 'Jet Propulsion',
        description: 'Massive speed boost with short dash ability',
        cost: 3,
        prerequisites: ['speed_2'],
        unlocked: false,
        effect: { type: 'special', value: 1, description: 'Unlock dash ability' }
      },
      
      // Defense Branch
      {
        id: 'defense_1',
        name: 'Thick Skin',
        description: 'Take 15% less damage from enemies',
        cost: 1,
        prerequisites: [],
        unlocked: false,
        effect: { type: 'defense', value: 0.15, description: '-15% damage taken' }
      },
      {
        id: 'defense_2',
        name: 'Armor Plating',
        description: 'Take 30% less damage and immunity to small enemies',
        cost: 2,
        prerequisites: ['defense_1'],
        unlocked: false,
        effect: { type: 'defense', value: 0.30, description: '-30% damage, small enemy immunity' }
      },
      {
        id: 'defense_3',
        name: 'Shield Bubble',
        description: 'Generate protective bubble that absorbs one hit',
        cost: 3,
        prerequisites: ['defense_2'],
        unlocked: false,
        effect: { type: 'special', value: 1, description: 'One-hit protection bubble' }
      },
      
      // Attack Branch
      {
        id: 'attack_1',
        name: 'Tentacle Strength',
        description: 'Destroy enemies on contact for bonus points',
        cost: 1,
        prerequisites: [],
        unlocked: false,
        effect: { type: 'attack', value: 1, description: 'Attack enemies on contact' }
      },
      {
        id: 'attack_2',
        name: 'Ink Blast',
        description: 'Release ink cloud that stuns nearby enemies',
        cost: 2,
        prerequisites: ['attack_1'],
        unlocked: false,
        effect: { type: 'special', value: 1, description: 'Ink cloud stun ability' }
      },
      {
        id: 'attack_3',
        name: 'Kraken Fury',
        description: 'Temporary invincibility and attack all enemies',
        cost: 3,
        prerequisites: ['attack_2'],
        unlocked: false,
        effect: { type: 'special', value: 1, description: 'Ultimate attack mode' }
      },
      
      // Utility Branch
      {
        id: 'utility_1',
        name: 'Treasure Hunter',
        description: 'Food gives 25% more points',
        cost: 1,
        prerequisites: [],
        unlocked: false,
        effect: { type: 'utility', value: 0.25, description: '+25% food points' }
      },
      {
        id: 'utility_2',
        name: 'Lucky Tentacles',
        description: 'Power-ups last 50% longer',
        cost: 2,
        prerequisites: ['utility_1'],
        unlocked: false,
        effect: { type: 'utility', value: 0.50, description: '+50% power-up duration' }
      },
      {
        id: 'utility_3',
        name: 'Combo Master',
        description: 'Combo multiplier increases faster and decays slower',
        cost: 3,
        prerequisites: ['utility_2'],
        unlocked: false,
        effect: { type: 'utility', value: 1, description: 'Enhanced combo system' }
      }
    ]
  }

  static async getPlayerSkills(playerId: string): Promise<SkillNode[]> {
    const { data, error } = await supabase
      .from('player_skills')
      .select('skill_id')
      .eq('player_id', playerId)

    if (error) {
      console.error('Error fetching player skills:', error)
      return []
    }

    const unlockedSkillIds = data?.map(s => s.skill_id) || []
    const skillTree = this.getSkillTree()
    
    return skillTree.map(skill => ({
      ...skill,
      unlocked: unlockedSkillIds.includes(skill.id)
    }))
  }

  static async unlockSkill(playerId: string, skillId: string): Promise<{ success: boolean, error?: string }> {
    try {
      const progression = await this.getPlayerProgression(playerId)
      const skillTree = this.getSkillTree()
      const skill = skillTree.find(s => s.id === skillId)
      
      if (!skill) {
        return { success: false, error: 'Skill not found' }
      }
      
      if (progression.skillPoints < skill.cost) {
        return { success: false, error: 'Not enough skill points' }
      }
      
      // Check prerequisites
      const playerSkills = await this.getPlayerSkills(playerId)
      const hasPrerequisites = skill.prerequisites.every(prereq => 
        playerSkills.find(s => s.id === prereq && s.unlocked)
      )
      
      if (!hasPrerequisites) {
        return { success: false, error: 'Prerequisites not met' }
      }
      
      // Unlock skill
      await supabase
        .from('player_skills')
        .insert([{
          player_id: playerId,
          skill_id: skillId
        }])
      
      // Deduct skill points
      await supabase
        .from('player_progression')
        .update({
          skill_points: progression.skillPoints - skill.cost,
          updated_at: new Date().toISOString()
        })
        .eq('player_id', playerId)
      
      return { success: true }
    } catch (error) {
      console.error('Error unlocking skill:', error)
      return { success: false, error: 'Failed to unlock skill' }
    }
  }

  static getAchievements(): Achievement[] {
    return [
      // Score Achievements
      {
        id: 'first_hundred',
        name: 'Century Swimmer',
        description: 'Score 100 points in a single game',
        icon: '💯',
        type: 'score',
        requirement: { type: 'single_score', value: 100 },
        reward: { type: 'xp', value: 50 },
        unlocked: false
      },
      {
        id: 'thousand_points',
        name: 'Point Master',
        description: 'Score 1,000 points in a single game',
        icon: '🎯',
        type: 'score',
        requirement: { type: 'single_score', value: 1000 },
        reward: { type: 'skillPoints', value: 1 },
        unlocked: false
      },
      {
        id: 'ten_thousand',
        name: 'Score Legend',
        description: 'Score 10,000 points in a single game',
        icon: '🏆',
        type: 'score',
        requirement: { type: 'single_score', value: 10000 },
        reward: { type: 'unlock', value: 1, unlockType: 'skin', unlockId: 'golden_octopus' },
        unlocked: false
      },
      
      // Survival Achievements
      {
        id: 'survivor_30',
        name: 'Deep Sea Explorer',
        description: 'Survive for 30 seconds',
        icon: '⏱️',
        type: 'survival',
        requirement: { type: 'survival_time', value: 30000 },
        reward: { type: 'xp', value: 75 },
        unlocked: false
      },
      {
        id: 'survivor_120',
        name: 'Ocean Veteran',
        description: 'Survive for 2 minutes',
        icon: '🌊',
        type: 'survival',
        requirement: { type: 'survival_time', value: 120000 },
        reward: { type: 'unlock', value: 1, unlockType: 'background', unlockId: 'deep_ocean' },
        unlocked: false
      },
      {
        id: 'survivor_300',
        name: 'Abyssal Master',
        description: 'Survive for 5 minutes',
        icon: '👑',
        type: 'survival',
        requirement: { type: 'survival_time', value: 300000 },
        reward: { type: 'skillPoints', value: 3 },
        unlocked: false
      },
      
      // Combo Achievements
      {
        id: 'combo_streak_5',
        name: 'Combo Starter',
        description: 'Achieve a 5x combo multiplier',
        icon: '🔥',
        type: 'combo',
        requirement: { type: 'combo_multiplier', value: 5 },
        reward: { type: 'xp', value: 100 },
        unlocked: false
      },
      {
        id: 'combo_streak_20',
        name: 'Combo Master',
        description: 'Achieve a 20x combo multiplier',
        icon: '⚡',
        type: 'combo',
        requirement: { type: 'combo_multiplier', value: 20 },
        reward: { type: 'unlock', value: 1, unlockType: 'trail', unlockId: 'lightning_trail' },
        unlocked: false
      },
      
      // Level Achievements
      {
        id: 'level_5',
        name: 'Depth Finder',
        description: 'Reach level 5',
        icon: '📊',
        type: 'level',
        requirement: { type: 'level_reached', value: 5 },
        reward: { type: 'skillPoints', value: 1 },
        unlocked: false
      },
      {
        id: 'level_10',
        name: 'Deep Dweller',
        description: 'Reach level 10',
        icon: '🏔️',
        type: 'level',
        requirement: { type: 'level_reached', value: 10 },
        reward: { type: 'unlock', value: 1, unlockType: 'ability', unlockId: 'speed_boost' },
        unlocked: false
      },
      
      // Collection Achievements
      {
        id: 'food_collector',
        name: 'Hungry Octopus',
        description: 'Collect 100 food items in a single game',
        icon: '🍤',
        type: 'collection',
        requirement: { type: 'food_collected', value: 100 },
        reward: { type: 'xp', value: 150 },
        unlocked: false,
        progress: 0,
        maxProgress: 100
      },
      
      // Special Achievements
      {
        id: 'perfect_game',
        name: 'Flawless Victory',
        description: 'Complete a game without taking damage',
        icon: '✨',
        type: 'special',
        requirement: { type: 'no_damage', value: 1 },
        reward: { type: 'unlock', value: 1, unlockType: 'skin', unlockId: 'crystal_octopus' },
        unlocked: false
      }
    ]
  }

  static async updateAchievementProgress(playerId: string, stats: GameStats): Promise<Achievement[]> {
    const achievements = this.getAchievements()
    const unlockedAchievements: Achievement[] = []
    
    // Get existing player achievements
    const { data: existingAchievements } = await supabase
      .from('player_achievements')
      .select('achievement_id, progress')
      .eq('player_id', playerId)
    
    const existingMap = new Map(
      existingAchievements?.map(a => [a.achievement_id, a]) || []
    )
    
    for (const achievement of achievements) {
      if (existingMap.has(achievement.id)) continue
      
      let unlocked = false
      let progress = 0
      
      switch (achievement.requirement.type) {
        case 'single_score':
          unlocked = stats.score >= achievement.requirement.value
          progress = stats.score
          break
        case 'survival_time':
          unlocked = stats.duration >= achievement.requirement.value
          progress = stats.duration
          break
        case 'combo_multiplier':
          unlocked = stats.combo >= achievement.requirement.value
          progress = stats.combo
          break
        case 'level_reached':
          unlocked = stats.level >= achievement.requirement.value
          progress = stats.level
          break
        case 'food_collected':
          progress = stats.totalFoodCollected || 0
          unlocked = progress >= achievement.requirement.value
          break
      }
      
      if (unlocked) {
        // Save achievement
        await supabase
          .from('player_achievements')
          .insert([{
            player_id: playerId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
            progress: progress
          }])
        
        // Apply rewards
        await this.applyAchievementReward(playerId, achievement.reward)
        
        unlockedAchievements.push({
          ...achievement,
          unlocked: true,
          progress
        })
      }
    }
    
    return unlockedAchievements
  }
  
  private static async applyAchievementReward(playerId: string, reward: any): Promise<void> {
    switch (reward.type) {
      case 'xp':
        await this.addXpAndUpdateProgression(playerId, reward.value)
        break
      case 'skillPoints':
        const progression = await this.getPlayerProgression(playerId)
        await supabase
          .from('player_progression')
          .update({
            skill_points: progression.skillPoints + reward.value,
            updated_at: new Date().toISOString()
          })
          .eq('player_id', playerId)
        break
      case 'unlock':
        // Handle unlocks (skins, backgrounds, abilities, trails)
        if (reward.unlockType && reward.unlockId) {
          const progression = await this.getPlayerProgression(playerId)
          let updateData: any = { updated_at: new Date().toISOString() }
          
          switch (reward.unlockType) {
            case 'skin':
              if (!progression.unlockedSkins.includes(reward.unlockId)) {
                updateData.unlocked_skins = [...progression.unlockedSkins, reward.unlockId]
              }
              break
            case 'background':
              if (!progression.unlockedBackgrounds.includes(reward.unlockId)) {
                updateData.unlocked_backgrounds = [...progression.unlockedBackgrounds, reward.unlockId]
              }
              break
            case 'ability':
              if (!progression.unlockedAbilities.includes(reward.unlockId)) {
                updateData.unlocked_abilities = [...progression.unlockedAbilities, reward.unlockId]
              }
              break
            case 'trail':
              if (!progression.unlockedTrails.includes(reward.unlockId)) {
                updateData.unlocked_trails = [...progression.unlockedTrails, reward.unlockId]
              }
              break
          }
          
          if (Object.keys(updateData).length > 1) { // More than just updated_at
            await supabase
              .from('player_progression')
              .update(updateData)
              .eq('player_id', playerId)
          }
        }
        break
    }
  }
}