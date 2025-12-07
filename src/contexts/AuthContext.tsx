import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Player } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  player: Player | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error: any }>
  signInAnonymously: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updatePlayer: (updates: Partial<Player>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchPlayer(session.user.id)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchPlayer(session.user.id)
        } else {
          setPlayer(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchPlayer = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Player doesn't exist, this is normal for new users
        setPlayer(null)
        return
      }

      if (error) {
        console.error('Error fetching player:', error)
        return
      }

      setPlayer(data)
    } catch (error) {
      console.error('Error fetching player:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) return { error: authError }

    // Create player profile
    if (authData.user) {
      const { error: playerError } = await supabase
        .from('players')
        .insert([
          {
            id: authData.user.id,
            username,
            display_name: displayName || username,
          }
        ])

      if (playerError) return { error: playerError }
    }

    return { error: null }
  }

  const signInAnonymously = async () => {
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

    if (authError) return { error: authError }

    // Create anonymous player profile
    if (authData.user) {
      const anonymousUsername = `Player_${Math.random().toString(36).substr(2, 9)}`
      const { error: playerError } = await supabase
        .from('players')
        .insert([
          {
            id: authData.user.id,
            username: anonymousUsername,
            display_name: `Anonymous Player`,
          }
        ])

      if (playerError) return { error: playerError }
    }

    return { error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updatePlayer = async (updates: Partial<Player>) => {
    if (!user) return { error: new Error('No authenticated user') }

    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setPlayer(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    player,
    session,
    loading,
    signIn,
    signUp,
    signInAnonymously,
    signOut,
    updatePlayer,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}