import React, { useState, useEffect } from 'react'
import { supabase, type LeaderboardEntry } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trophy, Star, Zap, Target, Users, Globe, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  className?: string
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const { user, player } = useAuth()
  const [leaderboards, setLeaderboards] = useState<{
    [key: string]: LeaderboardEntry[]
  }>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('total_score')

  const categories = [
    { id: 'total_score', label: 'Total Score', icon: Trophy, description: 'All-time highest scores' },
    { id: 'best_combo', label: 'Best Combo', icon: Zap, description: 'Highest combo multipliers' },
    { id: 'levels_completed', label: 'Levels', icon: Target, description: 'Most levels completed' },
  ]

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    setLoading(true)
    
    const promises = categories.map(async (category) => {
      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          *,
          players (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('category', category.id)
        .order('value', { ascending: false })
        .limit(50)

      if (error) {
        console.error(`Error fetching ${category.id} leaderboard:`, error)
        return { category: category.id, data: [] }
      }

      return { category: category.id, data: data || [] }
    })

    const results = await Promise.all(promises)
    const newLeaderboards = results.reduce((acc, result) => {
      acc[result.category] = result.data
      return acc
    }, {} as { [key: string]: LeaderboardEntry[] })

    setLeaderboards(newLeaderboards)
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />
      default:
        return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const formatValue = (value: number, category: string) => {
    switch (category) {
      case 'total_score':
        return value.toLocaleString()
      case 'best_combo':
        return `${value}x`
      case 'levels_completed':
        return value.toString()
      default:
        return value.toString()
    }
  }

  const getCurrentPlayerRank = (categoryData: LeaderboardEntry[], playerId: string) => {
    const index = categoryData.findIndex(entry => entry.player_id === playerId)
    return index !== -1 ? index + 1 : null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Global Leaderboards</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboards}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        <CardDescription>
          Compete with players around the world
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => {
            const Icon = category.icon
            const categoryData = leaderboards[category.id] || []
            const playerRank = user ? getCurrentPlayerRank(categoryData, user.id) : null

            return (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">{category.label}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  {playerRank && (
                    <Badge variant="secondary">
                      Your Rank: #{playerRank}
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-[400px] w-full rounded-md border">
                  <div className="p-4 space-y-2">
                    {loading ? (
                      <div className="space-y-2">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-muted animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                              <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                            </div>
                            <div className="h-6 bg-muted-foreground/20 rounded w-16" />
                          </div>
                        ))}
                      </div>
                    ) : categoryData.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto mb-2" />
                          <p>No scores yet</p>
                          <p className="text-sm">Be the first to set a record!</p>
                        </div>
                      </div>
                    ) : (
                      categoryData.map((entry, index) => {
                        const rank = index + 1
                        const isCurrentPlayer = user?.id === entry.player_id
                        
                        return (
                          <div
                            key={entry.id}
                            className={cn(
                              "flex items-center space-x-4 p-3 rounded-lg transition-colors",
                              isCurrentPlayer 
                                ? "bg-primary/10 border border-primary/20" 
                                : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center justify-center w-8">
                              {getRankIcon(rank)}
                            </div>
                            
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.players.avatar_url || undefined} />
                              <AvatarFallback>
                                {entry.players.display_name?.[0] || entry.players.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium truncate",
                                isCurrentPlayer && "text-primary"
                              )}>
                                {entry.players.display_name || entry.players.username}
                                {isCurrentPlayer && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    You
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{entry.players.username}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {formatValue(entry.value, category.id)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}