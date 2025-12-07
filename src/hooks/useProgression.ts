import { useState, useEffect, useCallback } from 'react'
import { ProgressionService } from '../lib/progressionService'
import { GameService } from '../lib/gameService'
import type { 
  PlayerProgression, 
  Achievement, 
  SkillNode, 
  UnlockableContent,
  ProgressionState 
} from '../types/progression'
import type { GameStats } from '../lib/gameService'
import { useAuth } from '../contexts/AuthContext'

export function useProgression() {
  const { user } = useAuth()
  const [state, setState] = useState<ProgressionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgression = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const [progression, skills, achievements] = await Promise.all([
        ProgressionService.getPlayerProgression(user.id),
        ProgressionService.getPlayerSkills(user.id),
        loadPlayerAchievements(user.id)
      ])

      const unlockables = getUnlockableContent(progression)

      setState({
        player: progression,
        achievements,
        unlockables,
        skillTree: skills
      })
      
      setError(null)
    } catch (err) {
      console.error('Error loading progression:', err)
      setError('Failed to load progression data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const processGameEnd = useCallback(async (stats: GameStats) => {
    if (!user?.id || !state) return { xpGained: 0, leveledUp: false, newAchievements: [] }

    try {
      // Calculate XP from game stats
      const xpGained = ProgressionService.calculateXpFromGameStats(stats)
      
      // Update progression
      const progressionResult = await ProgressionService.addXpAndUpdateProgression(user.id, xpGained)
      
      // Check for new achievements
      const newAchievements = await ProgressionService.updateAchievementProgress(user.id, stats)
      
      // Submit game session (existing functionality)
      await GameService.submitGameSession(stats)
      
      // Reload progression data
      await loadProgression()
      
      return {
        xpGained,
        leveledUp: progressionResult.leveledUp,
        newLevel: progressionResult.newLevel,
        skillPointsGained: progressionResult.skillPointsGained,
        newAchievements
      }
    } catch (err) {
      console.error('Error processing game end:', err)
      return { xpGained: 0, leveledUp: false, newAchievements: [] }
    }
  }, [user?.id, state, loadProgression])

  const unlockSkill = useCallback(async (skillId: string) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' }

    const result = await ProgressionService.unlockSkill(user.id, skillId)
    
    if (result.success) {
      await loadProgression()
    }
    
    return result
  }, [user?.id, loadProgression])

  const getActiveSkillEffects = useCallback(() => {
    if (!state) return []
    
    return state.skillTree
      .filter(skill => skill.unlocked)
      .map(skill => skill.effect)
  }, [state])

  const getUnlockedContent = useCallback((type: 'skins' | 'backgrounds' | 'abilities' | 'trails') => {
    if (!state) return []
    
    switch (type) {
      case 'skins':
        return state.player.unlockedSkins
      case 'backgrounds':
        return state.player.unlockedBackgrounds
      case 'abilities':
        return state.player.unlockedAbilities
      case 'trails':
        return state.player.unlockedTrails
      default:
        return []
    }
  }, [state])

  const hasUnlocked = useCallback((type: 'skin' | 'background' | 'ability' | 'trail', id: string) => {
    if (!state) return false
    
    const unlocked = getUnlockedContent(`${type}s` as any)
    return unlocked.includes(id)
  }, [state, getUnlockedContent])

  useEffect(() => {
    loadProgression()
  }, [loadProgression])

  return {
    progression: state,
    loading,
    error,
    processGameEnd,
    unlockSkill,
    getActiveSkillEffects,
    getUnlockedContent,
    hasUnlocked,
    reload: loadProgression
  }
}

async function loadPlayerAchievements(playerId: string): Promise<Achievement[]> {
  const allAchievements = ProgressionService.getAchievements()
  
  // Get unlocked achievements from database
  const { data: unlockedAchievements } = await supabase
    .from('player_achievements')
    .select('achievement_id, progress, unlocked_at')
    .eq('player_id', playerId)
  
  const unlockedMap = new Map(
    unlockedAchievements?.map(a => [a.achievement_id, a]) || []
  )
  
  return allAchievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedMap.has(achievement.id),
    progress: unlockedMap.get(achievement.id)?.progress || 0
  }))
}

function getUnlockableContent(progression: PlayerProgression): UnlockableContent[] {
  return [
    // Skins
    {
      id: 'golden_octopus',
      name: 'Golden Octopus',
      type: 'skin',
      description: 'A shimmering golden octopus skin',
      unlockRequirement: { type: 'achievement', value: 'ten_thousand' },
      unlocked: progression.unlockedSkins.includes('golden_octopus'),
      rarity: 'epic'
    },
    {
      id: 'crystal_octopus',
      name: 'Crystal Octopus',
      type: 'skin',
      description: 'Translucent crystal octopus skin',
      unlockRequirement: { type: 'achievement', value: 'perfect_game' },
      unlocked: progression.unlockedSkins.includes('crystal_octopus'),
      rarity: 'legendary'
    },
    {
      id: 'rainbow_octopus',
      name: 'Rainbow Octopus',
      type: 'skin',
      description: 'Colorful rainbow octopus skin',
      unlockRequirement: { type: 'level', value: 25 },
      unlocked: progression.unlockedSkins.includes('rainbow_octopus'),
      rarity: 'rare'
    },
    
    // Backgrounds
    {
      id: 'deep_ocean',
      name: 'Deep Ocean',
      type: 'background',
      description: 'Dark depths of the ocean',
      unlockRequirement: { type: 'achievement', value: 'survivor_120' },
      unlocked: progression.unlockedBackgrounds.includes('deep_ocean'),
      rarity: 'rare'
    },
    {
      id: 'coral_reef',
      name: 'Coral Reef',
      type: 'background',
      description: 'Vibrant coral reef environment',
      unlockRequirement: { type: 'level', value: 15 },
      unlocked: progression.unlockedBackgrounds.includes('coral_reef'),
      rarity: 'common'
    },
    {
      id: 'underwater_cave',
      name: 'Underwater Cave',
      type: 'background',
      description: 'Mysterious underwater cave',
      unlockRequirement: { type: 'level', value: 30 },
      unlocked: progression.unlockedBackgrounds.includes('underwater_cave'),
      rarity: 'epic'
    },
    
    // Abilities
    {
      id: 'speed_boost',
      name: 'Speed Boost',
      type: 'ability',
      description: 'Temporary speed increase ability',
      unlockRequirement: { type: 'achievement', value: 'level_10' },
      unlocked: progression.unlockedAbilities.includes('speed_boost'),
      rarity: 'common'
    },
    {
      id: 'shield',
      name: 'Protective Shield',
      type: 'ability',
      description: 'Temporary invincibility shield',
      unlockRequirement: { type: 'level', value: 20 },
      unlocked: progression.unlockedAbilities.includes('shield'),
      rarity: 'rare'
    },
    
    // Trails
    {
      id: 'lightning_trail',
      name: 'Lightning Trail',
      type: 'trail',
      description: 'Electric particle trail behind octopus',
      unlockRequirement: { type: 'achievement', value: 'combo_streak_20' },
      unlocked: progression.unlockedTrails.includes('lightning_trail'),
      rarity: 'epic'
    }
  ]
}

// Import supabase at the top
import { supabase } from '../lib/supabase'