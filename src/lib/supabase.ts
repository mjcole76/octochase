import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydknktpbipfdnazqzxan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlka25rdHBiaXBmZG5henF6eGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTMwNDgsImV4cCI6MjA3MTc2OTA0OH0.gh9Q14yr8QOQrCoxiUBzgkpzNmpcVw-Hz52lWb5-XIs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Player {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_score: number
  games_played: number
  levels_completed: number
  best_combo: number
  achievements: any[]
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  player_id: string
  score: number
  level_reached: number
  combo_best: number
  duration_seconds: number
  medal: 'bronze' | 'silver' | 'gold' | null
  game_data: any
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  player_id: string
  category: string
  value: number
  game_session_id: string | null
  created_at: string
  players: Player
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
  updated_at: string
  requester: Player
  addressee: Player
}