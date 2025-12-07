import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import type { Achievement } from '../types/progression'

interface AchievementNotificationProps {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementNotification({ achievements, onDismiss }: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (achievements.length === 0) return

    const timer = setTimeout(() => {
      if (currentIndex < achievements.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setIsVisible(false)
        setTimeout(onDismiss, 300)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentIndex, achievements.length, onDismiss])

  if (!isVisible || achievements.length === 0) return null

  const achievement = achievements[currentIndex]

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500">
      <Card className="bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300 shadow-lg min-w-80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 text-white text-xs font-medium">
              🏆 Achievement Unlocked!
            </Badge>
            {achievements.length > 1 && (
              <span className="text-white/80 text-xs">
                {currentIndex + 1} / {achievements.length}
              </span>
            )}
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-3xl animate-bounce">
              {achievement.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                {achievement.name}
              </h3>
              <p className="text-white/90 text-sm mb-2">
                {achievement.description}
              </p>
              
              <div className="flex items-center space-x-2">
                <RewardDisplay reward={achievement.reward} />
              </div>
            </div>
          </div>
          
          <div className="mt-3 bg-white/10 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / achievements.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RewardDisplayProps {
  reward: any
}

function RewardDisplay({ reward }: RewardDisplayProps) {
  const getRewardDisplay = () => {
    switch (reward.type) {
      case 'xp':
        return { icon: '⭐', text: `+${reward.value} XP` }
      case 'skillPoints':
        return { 
          icon: '🔧', 
          text: `+${reward.value} Skill Point${reward.value > 1 ? 's' : ''}` 
        }
      case 'unlock':
        const unlockText = reward.unlockType === 'skin' ? 'Skin Unlocked' :
                          reward.unlockType === 'background' ? 'Background Unlocked' :
                          reward.unlockType === 'ability' ? 'Ability Unlocked' : 'Item Unlocked'
        return { icon: '🎁', text: unlockText }
      case 'title':
        return { icon: '👑', text: 'New Title' }
      default:
        return { icon: '🏅', text: 'Reward' }
    }
  }

  const display = getRewardDisplay()

  return (
    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
      <span className="text-sm">{display.icon}</span>
      <span className="text-white text-sm font-medium">
        {display.text}
      </span>
    </div>
  )
}