import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import type { Achievement } from '../types/progression'

interface AchievementDisplayProps {
  achievements: Achievement[]
  showOnlyUnlocked?: boolean
}

export function AchievementDisplay({ achievements, showOnlyUnlocked = false }: AchievementDisplayProps) {
  const filteredAchievements = showOnlyUnlocked 
    ? achievements.filter(a => a.unlocked)
    : achievements

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <Badge variant="outline">
          {unlockedCount} / {totalCount}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}

interface AchievementCardProps {
  achievement: Achievement
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const progressPercentage = achievement.maxProgress 
    ? Math.min(100, ((achievement.progress || 0) / achievement.maxProgress) * 100)
    : achievement.unlocked ? 100 : 0

  return (
    <Card className={`relative transition-all duration-200 ${
      achievement.unlocked 
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-md' 
        : 'bg-gray-50 border-gray-200 opacity-75'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`text-2xl flex-shrink-0 ${
            achievement.unlocked ? 'grayscale-0' : 'grayscale'
          }`}>
            {achievement.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium text-sm truncate ${
                achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {achievement.name}
              </h4>
              {achievement.unlocked && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                  ✓
                </Badge>
              )}
            </div>
            
            <p className={`text-xs mb-2 ${
              achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {achievement.description}
            </p>
            
            {achievement.maxProgress && !achievement.unlocked && (
              <div className="space-y-1">
                <Progress value={progressPercentage} className="h-1" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{achievement.progress || 0}</span>
                  <span>{achievement.maxProgress}</span>
                </div>
              </div>
            )}
            
            <div className="mt-2">
              <AchievementReward achievement={achievement} />
            </div>
          </div>
        </div>
        
        {achievement.unlocked && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AchievementRewardProps {
  achievement: Achievement
}

function AchievementReward({ achievement }: AchievementRewardProps) {
  const { reward } = achievement

  const getRewardText = () => {
    switch (reward.type) {
      case 'xp':
        return `+${reward.value} XP`
      case 'skillPoints':
        return `+${reward.value} Skill Point${reward.value > 1 ? 's' : ''}`
      case 'unlock':
        const unlockText = reward.unlockType === 'skin' ? 'Skin' :
                          reward.unlockType === 'background' ? 'Background' :
                          reward.unlockType === 'ability' ? 'Ability' : 'Item'
        return `Unlock ${unlockText}`
      case 'title':
        return 'New Title'
      default:
        return 'Reward'
    }
  }

  const getRewardIcon = () => {
    switch (reward.type) {
      case 'xp':
        return '⭐'
      case 'skillPoints':
        return '🔧'
      case 'unlock':
        return '🎁'
      case 'title':
        return '👑'
      default:
        return '🏅'
    }
  }

  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs">{getRewardIcon()}</span>
      <span className={`text-xs font-medium ${
        achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'
      }`}>
        {getRewardText()}
      </span>
    </div>
  )
}