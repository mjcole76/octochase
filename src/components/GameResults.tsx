import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Star, Share, Users, TrendingUp, Clock, Target, Zap } from 'lucide-react'
import { AuthDialog } from './AuthDialog'
import { Leaderboard } from './Leaderboard'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface GameResultsProps {
  isOpen: boolean
  gameStats: {
    score: number
    level: number
    combo: number
    gameTime: number
    medal: 'bronze' | 'silver' | 'gold' | null
    survivalBonus: number
    lives: number
  }
  levelName: string
  unlockedAchievements?: string[]
  onRetry: () => void
  onNextLevel: () => void
  onMainMenu: () => void
  canContinue: boolean
  showSubmitError?: string | null
  onClearError?: () => void
  isSubmitting?: boolean
}

const achievementInfo: { [key: string]: { name: string; description: string; icon: string } } = {
  first_game: { name: 'First Splash', description: 'Complete your first game', icon: '🎮' },
  score_1000: { name: 'Point Collector', description: 'Score 1,000 points in a single game', icon: '💯' },
  score_5000: { name: 'Score Master', description: 'Score 5,000 points in a single game', icon: '🏆' },
  combo_10: { name: 'Combo Starter', description: 'Achieve a 10x combo multiplier', icon: '⚡' },
  combo_25: { name: 'Combo Master', description: 'Achieve a 25x combo multiplier', icon: '🔥' },
  level_5: { name: 'Deep Explorer', description: 'Reach level 5', icon: '🌊' },
  level_10: { name: 'Ocean Veteran', description: 'Reach level 10', icon: '🏔️' },
  gold_medal: { name: 'Golden Octopus', description: 'Earn a gold medal', icon: '🥇' },
  survival_60s: { name: 'Survivor', description: 'Survive for 60 seconds', icon: '⏱️' },
  survival_300s: { name: 'Ocean Endurance', description: 'Survive for 5 minutes', icon: '🏅' },
}

export const GameResults: React.FC<GameResultsProps> = ({
  isOpen,
  gameStats,
  levelName,
  unlockedAchievements = [],
  onRetry,
  onNextLevel,
  onMainMenu,
  canContinue,
  showSubmitError,
  onClearError,
  isSubmitting = false
}) => {
  const { user, player } = useAuth()
  const [activeTab, setActiveTab] = useState('results')
  const [showAuth, setShowAuth] = useState(false)

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const shareScore = () => {
    if (navigator.share) {
      navigator.share({
        title: 'OctoSprint Score',
        text: `I just scored ${gameStats.score.toLocaleString()} points in OctoSprint! ${gameStats.medal ? `Earned a ${gameStats.medal} medal! 🏆` : ''}`,
        url: window.location.href
      })
    } else {
      // Fallback to clipboard
      const shareText = `I just scored ${gameStats.score.toLocaleString()} points in OctoSprint! ${gameStats.medal ? `Earned a ${gameStats.medal} medal! 🏆` : ''}`
      navigator.clipboard.writeText(shareText)
    }
  }

  const getMedalColor = (medal: string | null) => {
    switch (medal) {
      case 'gold': return 'text-yellow-500'
      case 'silver': return 'text-gray-400'
      case 'bronze': return 'text-amber-600'
      default: return 'text-muted-foreground'
    }
  }

  const getMedalEmoji = (medal: string | null) => {
    switch (medal) {
      case 'gold': return '🥇'
      case 'silver': return '🥈'
      case 'bronze': return '🥉'
      default: return '🎯'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            {gameStats.lives > 0 ? 'Level Complete!' : 'Game Over'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="text-8xl mb-2">{getMedalEmoji(gameStats.medal)}</div>
                <CardTitle className={cn("text-3xl", getMedalColor(gameStats.medal))}>
                  {gameStats.medal?.toUpperCase() || 'COMPLETED'}
                </CardTitle>
                <CardDescription className="text-lg">{levelName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{gameStats.score.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Final Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+{gameStats.survivalBonus.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Survival Bonus</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-muted/50 rounded">
                    <Target className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-semibold">{gameStats.level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                    <div className="font-semibold">{gameStats.combo}x</div>
                    <div className="text-xs text-muted-foreground">Best Combo</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <div className="font-semibold">{formatTime(gameStats.gameTime)}</div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>

                {showSubmitError && (
                  <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                      {showSubmitError}
                      {onClearError && (
                        <Button variant="ghost" size="sm" onClick={onClearError}>
                          Dismiss
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {!user && (
                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      Sign in to save your score and compete on leaderboards!
                      <AuthDialog open={showAuth} onOpenChange={setShowAuth}>
                        <Button variant="outline" size="sm">
                          Sign In
                        </Button>
                      </AuthDialog>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={onRetry} variant="outline">
                    Retry Level
                  </Button>
                  {canContinue && (
                    <Button onClick={onNextLevel} className="bg-green-600 hover:bg-green-700">
                      Next Level
                    </Button>
                  )}
                  <Button onClick={shareScore} variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={onMainMenu}>
                    Main Menu
                  </Button>
                </div>
              </CardContent>
            </Card>

            {unlockedAchievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    New Achievements Unlocked!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {unlockedAchievements.map((achievementType) => {
                      const achievement = achievementInfo[achievementType]
                      if (!achievement) return null
                      
                      return (
                        <div key={achievementType} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <div className="font-semibold text-yellow-800 dark:text-yellow-200">{achievement.name}</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">{achievement.description}</div>
                          </div>
                          <Badge variant="secondary" className="ml-auto">NEW</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  {user ? `Track your progress as ${player?.display_name || player?.username}` : 'Sign in to unlock achievements'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Achievement tracking coming soon!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your achievements are being saved and will be displayed here.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Sign in to start earning achievements!</p>
                    <AuthDialog>
                      <Button>Sign In to Play</Button>
                    </AuthDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}