import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { AchievementDisplay } from './AchievementDisplay'
import { SkillTree } from './SkillTree'
import { useProgression } from '../hooks/useProgression'
import type { UnlockableContent } from '../types/progression'

interface ProgressionPanelProps {
  onClose: () => void
}

export function ProgressionPanel({ onClose }: ProgressionPanelProps) {
  const { progression, loading, unlockSkill } = useProgression()
  const [selectedTab, setSelectedTab] = useState('overview')

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading progression data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!progression) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Failed to load progression data</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const xpPercentage = Math.min(100, (progression.player.xp / progression.player.xpToNext) * 100)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold">Player Progression</h1>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="unlockables">Unlockables</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <PlayerOverview progression={progression.player} />
              <RecentAchievements achievements={progression.achievements.filter(a => a.unlocked).slice(0, 6)} />
            </TabsContent>

            <TabsContent value="skills">
              <SkillTree
                skills={progression.skillTree}
                progression={progression.player}
                onUnlockSkill={unlockSkill}
              />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementDisplay achievements={progression.achievements} />
            </TabsContent>

            <TabsContent value="unlockables">
              <UnlockablesDisplay unlockables={progression.unlockables} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

interface PlayerOverviewProps {
  progression: any
}

function PlayerOverview({ progression }: PlayerOverviewProps) {
  const xpPercentage = Math.min(100, (progression.xp / progression.xpToNext) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {progression.level}
            </div>
            <p className="text-gray-600">Current Level</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>XP Progress</span>
              <span>{progression.xp} / {progression.xpToNext}</span>
            </div>
            <Progress value={xpPercentage} className="h-2" />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Total XP: {progression.totalXp.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔧</span>
            <span>Skill Points</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {progression.skillPoints}
            </div>
            <p className="text-gray-600">Available Points</p>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Earn skill points by leveling up</p>
              <p>Use them to unlock powerful abilities</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎁</span>
            <span>Unlocked Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Skins</span>
              <Badge className="bg-blue-100 text-blue-800">
                {progression.unlockedSkins.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Backgrounds</span>
              <Badge className="bg-green-100 text-green-800">
                {progression.unlockedBackgrounds.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Abilities</span>
              <Badge className="bg-purple-100 text-purple-800">
                {progression.unlockedAbilities.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Trails</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {progression.unlockedTrails.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RecentAchievementsProps {
  achievements: any[]
}

function RecentAchievements({ achievements }: RecentAchievementsProps) {
  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No achievements unlocked yet. Start playing to earn your first achievement!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <div className="text-sm font-medium text-gray-900">{achievement.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface UnlockablesDisplayProps {
  unlockables: UnlockableContent[]
}

function UnlockablesDisplay({ unlockables }: UnlockablesDisplayProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  
  const filteredUnlockables = unlockables.filter(item => {
    if (filter === 'unlocked') return item.unlocked
    if (filter === 'locked') return !item.unlocked
    return true
  })

  const groupedUnlockables = filteredUnlockables.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, UnlockableContent[]>)

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'unlocked' ? 'default' : 'outline'}
          onClick={() => setFilter('unlocked')}
          size="sm"
        >
          Unlocked
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          onClick={() => setFilter('locked')}
          size="sm"
        >
          Locked
        </Button>
      </div>

      {Object.entries(groupedUnlockables).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{type}s</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <UnlockableCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface UnlockableCardProps {
  item: UnlockableContent
}

function UnlockableCard({ item }: UnlockableCardProps) {
  const getRarityColor = () => {
    switch (item.rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityTextColor = () => {
    switch (item.rarity) {
      case 'common': return 'text-gray-700'
      case 'rare': return 'text-blue-700'
      case 'epic': return 'text-purple-700'
      case 'legendary': return 'text-yellow-700'
      default: return 'text-gray-700'
    }
  }

  return (
    <Card className={`${getRarityColor()} ${!item.unlocked ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className={`font-medium ${getRarityTextColor()}`}>
            {item.name}
          </h4>
          {item.unlocked && (
            <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <Badge className={`capitalize text-xs ${getRarityTextColor()}`}>
            {item.rarity}
          </Badge>
          
          {!item.unlocked && (
            <div className="text-xs text-gray-500">
              {item.unlockRequirement.type === 'level' 
                ? `Level ${item.unlockRequirement.value}`
                : `Achievement Required`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}