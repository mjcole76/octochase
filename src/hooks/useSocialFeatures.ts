import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GameService, type GameStats } from '@/lib/gameService'

export interface SocialGameStats extends GameStats {
  totalEnemiesDefeated?: number
  totalFoodCollected?: number
  timesSurvived?: number
  powerUpsUsed?: number
}

export const useSocialFeatures = () => {
  const { user, player } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitGameSession = useCallback(async (gameStats: SocialGameStats) => {
    if (!user) {
      setSubmitError('Please sign in to save your progress')
      return false
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setUnlockedAchievements([])

    try {
      // Submit the game session
      const result = await GameService.submitGameSession(gameStats)
      
      if (!result.success) {
        setSubmitError(result.error || 'Failed to save game data')
        return false
      }

      // Check for achievement unlocks
      const newAchievements = await GameService.checkAndUnlockAchievements(user.id, gameStats)
      if (newAchievements.length > 0) {
        setUnlockedAchievements(newAchievements)
      }

      return true
    } catch (error) {
      console.error('Error submitting game session:', error)
      setSubmitError('Network error - please try again')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [user])

  const clearAchievements = useCallback(() => {
    setUnlockedAchievements([])
  }, [])

  const clearError = useCallback(() => {
    setSubmitError(null)
  }, [])

  return {
    isAuthenticated: !!user,
    player,
    isSubmitting,
    submitGameSession,
    unlockedAchievements,
    clearAchievements,
    submitError,
    clearError
  }
}