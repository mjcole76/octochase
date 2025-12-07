import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface LevelUpNotificationProps {
  visible: boolean
  newLevel: number
  skillPointsGained: number
  xpGained: number
  onDismiss: () => void
}

export function LevelUpNotification({ 
  visible, 
  newLevel, 
  skillPointsGained, 
  xpGained, 
  onDismiss 
}: LevelUpNotificationProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!visible) {
      setStage(0)
      return
    }

    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2500)
    ]

    return () => timers.forEach(clearTimeout)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 border-none shadow-2xl min-w-96">
        <CardContent className="p-8 text-center">
          {/* Level Up Header */}
          <div className={`mb-6 transition-all duration-1000 ${stage >= 1 ? 'animate-in zoom-in' : 'opacity-0'}`}>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">LEVEL UP!</h1>
            <div className="text-8xl font-black text-white/20 mb-2">
              {newLevel}
            </div>
            <p className="text-white/90 text-lg">
              You've reached level {newLevel}
            </p>
          </div>

          {/* XP Gained */}
          <div className={`mb-6 transition-all duration-1000 delay-500 ${stage >= 2 ? 'animate-in slide-in-from-left' : 'opacity-0'}`}>
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-white">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold">+{xpGained.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Skill Points Reward */}
          {skillPointsGained > 0 && (
            <div className={`mb-6 transition-all duration-1000 delay-1000 ${stage >= 3 ? 'animate-in slide-in-from-right' : 'opacity-0'}`}>
              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <div className="text-white mb-2">🎁 Level Reward</div>
                <div className="flex items-center justify-center space-x-2 text-white">
                  <span className="text-2xl">🔧</span>
                  <span className="text-xl font-bold">
                    +{skillPointsGained} Skill Point{skillPointsGained > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-white/80 text-sm mt-1">
                  Use skill points to unlock new abilities
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className={`transition-all duration-1000 delay-1500 ${stage >= 3 ? 'animate-in fade-in' : 'opacity-0'}`}>
            <Button 
              onClick={onDismiss}
              className="bg-white text-orange-600 hover:bg-white/90 font-bold px-8 py-3 text-lg"
            >
              Continue
            </Button>
          </div>

          {/* Particles Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/60 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface XpGainDisplayProps {
  xpGained: number
  visible: boolean
}

export function XpGainDisplay({ xpGained, visible }: XpGainDisplayProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (visible) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible || !animate) return null

  return (
    <div className="fixed top-20 right-4 z-40 animate-in slide-in-from-right duration-300">
      <div className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <span className="text-lg">⭐</span>
        <span className="font-bold">+{xpGained} XP</span>
      </div>
    </div>
  )
}