import { supabase, type GameSession, type Player } from './supabase'

export interface GameStats {
  score: number
  level: number
  combo: number
  duration: number
  medal: 'bronze' | 'silver' | 'gold' | null
  totalEnemiesDefeated?: number
  totalFoodCollected?: number
  timesSurvived?: number
  powerUpsUsed?: number
}

export class GameService {
  static async submitGameSession(stats: GameStats): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Insert game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert([{
          player_id: user.id,
          score: stats.score,
          level_reached: stats.level,
          combo_best: stats.combo,
          duration_seconds: Math.floor(stats.duration / 1000),
          medal: stats.medal,
          game_data: {
            totalEnemiesDefeated: stats.totalEnemiesDefeated || 0,
            totalFoodCollected: stats.totalFoodCollected || 0,
            timesSurvived: stats.timesSurvived || 0,
            powerUpsUsed: stats.powerUpsUsed || 0
          }
        }])
        .select()
        .single()

      if (sessionError) {
        return { success: false, error: sessionError.message }
      }

      // Update player statistics
      await this.updatePlayerStats(user.id, stats)

      // Update leaderboards
      await this.updateLeaderboards(user.id, stats, sessionData.id)

      return { success: true }
    } catch (error) {
      console.error('Error submitting game session:', error)
      return { success: false, error: 'Failed to submit game session' }
    }
  }

  private static async updatePlayerStats(playerId: string, stats: GameStats): Promise<void> {
    // Get current player stats
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('players')
      .select('total_score, games_played, levels_completed, best_combo')
      .eq('id', playerId)
      .single()

    if (fetchError) {
      console.error('Error fetching current player stats:', fetchError)
      return
    }

    // Calculate updated stats
    const updatedStats = {
      total_score: (currentPlayer.total_score || 0) + stats.score,
      games_played: (currentPlayer.games_played || 0) + 1,
      levels_completed: Math.max(currentPlayer.levels_completed || 0, stats.level),
      best_combo: Math.max(currentPlayer.best_combo || 0, stats.combo),
      updated_at: new Date().toISOString()
    }

    // Update player record
    const { error: updateError } = await supabase
      .from('players')
      .update(updatedStats)
      .eq('id', playerId)

    if (updateError) {
      console.error('Error updating player stats:', updateError)
    }
  }

  private static async updateLeaderboards(
    playerId: string, 
    stats: GameStats, 
    sessionId: string
  ): Promise<void> {
    // Get current player data for leaderboard calculations
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('total_score, best_combo, levels_completed')
      .eq('id', playerId)
      .single()

    if (playerError) {
      console.error('Error fetching player for leaderboard update:', playerError)
      return
    }

    const leaderboardUpdates = [
      {
        player_id: playerId,
        category: 'total_score',
        value: player.total_score,
        game_session_id: sessionId
      },
      {
        player_id: playerId,
        category: 'best_combo',
        value: player.best_combo,
        game_session_id: sessionId
      },
      {
        player_id: playerId,
        category: 'levels_completed',
        value: player.levels_completed,
        game_session_id: sessionId
      }
    ]

    // Upsert leaderboard entries
    for (const update of leaderboardUpdates) {
      const { error } = await supabase
        .from('leaderboards')
        .upsert(update, {
          onConflict: 'player_id,category'
        })

      if (error) {
        console.error(`Error updating ${update.category} leaderboard:`, error)
      }
    }
  }

  static async getPlayerGameHistory(playerId: string, limit: number = 10): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching game history:', error)
      return []
    }

    return data || []
  }

  static async checkAndUnlockAchievements(playerId: string, stats: GameStats): Promise<string[]> {
    const unlockedAchievements: string[] = []

    // Define achievement conditions
    const achievements = [
      {
        type: 'first_game',
        condition: () => true, // Always unlock on first game submission
        name: 'First Splash',
        description: 'Complete your first game'
      },
      {
        type: 'score_1000',
        condition: (stats: GameStats) => stats.score >= 1000,
        name: 'Point Collector',
        description: 'Score 1,000 points in a single game'
      },
      {
        type: 'score_5000',
        condition: (stats: GameStats) => stats.score >= 5000,
        name: 'Score Master',
        description: 'Score 5,000 points in a single game'
      },
      {
        type: 'combo_10',
        condition: (stats: GameStats) => stats.combo >= 10,
        name: 'Combo Starter',
        description: 'Achieve a 10x combo multiplier'
      },
      {
        type: 'combo_25',
        condition: (stats: GameStats) => stats.combo >= 25,
        name: 'Combo Master',
        description: 'Achieve a 25x combo multiplier'
      },
      {
        type: 'level_5',
        condition: (stats: GameStats) => stats.level >= 5,
        name: 'Deep Explorer',
        description: 'Reach level 5'
      },
      {
        type: 'level_10',
        condition: (stats: GameStats) => stats.level >= 10,
        name: 'Ocean Veteran',
        description: 'Reach level 10'
      },
      {
        type: 'gold_medal',
        condition: (stats: GameStats) => stats.medal === 'gold',
        name: 'Golden Octopus',
        description: 'Earn a gold medal'
      },
      {
        type: 'survival_60s',
        condition: (stats: GameStats) => stats.duration >= 60000,
        name: 'Survivor',
        description: 'Survive for 60 seconds'
      },
      {
        type: 'survival_300s',
        condition: (stats: GameStats) => stats.duration >= 300000,
        name: 'Ocean Endurance',
        description: 'Survive for 5 minutes'
      }
    ]

    // Check existing achievements
    const { data: existingAchievements } = await supabase
      .from('player_achievements')
      .select('achievement_type')
      .eq('player_id', playerId)

    const existingTypes = existingAchievements?.map(a => a.achievement_type) || []

    // Check and unlock new achievements
    for (const achievement of achievements) {
      if (!existingTypes.includes(achievement.type) && achievement.condition(stats)) {
        const { error } = await supabase
          .from('player_achievements')
          .insert([{
            player_id: playerId,
            achievement_type: achievement.type,
            achievement_data: {
              name: achievement.name,
              description: achievement.description,
              game_stats: stats
            }
          }])

        if (!error) {
          unlockedAchievements.push(achievement.type)
        }
      }
    }

    return unlockedAchievements
  }

  static async getFriends(playerId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        requester:requester_id,
        addressee:addressee_id,
        requester_profile:players!friendships_requester_id_fkey(*),
        addressee_profile:players!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${playerId},addressee_id.eq.${playerId}`)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching friends:', error)
      return []
    }

    // Return the friend profiles (not the current player)
    return data?.map((friendship: any) => 
      friendship.requester === playerId 
        ? friendship.addressee_profile 
        : friendship.requester_profile
    ).filter(Boolean) || []
  }

  static async sendFriendRequest(fromPlayerId: string, toUsername: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the target player by username
      const { data: targetPlayer, error: findError } = await supabase
        .from('players')
        .select('id')
        .eq('username', toUsername)
        .single()

      if (findError || !targetPlayer) {
        return { success: false, error: 'Player not found' }
      }

      if (targetPlayer.id === fromPlayerId) {
        return { success: false, error: 'Cannot send friend request to yourself' }
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${fromPlayerId},addressee_id.eq.${targetPlayer.id}),and(requester_id.eq.${targetPlayer.id},addressee_id.eq.${fromPlayerId})`)
        .single()

      if (existing) {
        return { success: false, error: 'Friend request already exists' }
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert([{
          requester_id: fromPlayerId,
          addressee_id: targetPlayer.id,
          status: 'pending'
        }])

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending friend request:', error)
      return { success: false, error: 'Failed to send friend request' }
    }
  }
}