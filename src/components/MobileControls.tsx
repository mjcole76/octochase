import React from 'react'
import { Button } from './ui/button'
import { useIsMobile, useTouchGestures, useHapticFeedback, useDeviceOrientation } from '../hooks/use-mobile'

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down') => void
  onJump: () => void
  onPause: () => void
  isGameActive: boolean
}

export function MobileControls({ onMove, onJump, onPause, isGameActive }: MobileControlsProps) {
  const isMobile = useIsMobile()
  const orientation = useDeviceOrientation()
  const { lightVibration, mediumVibration } = useHapticFeedback()
  const gameAreaRef = React.useRef<HTMLDivElement>(null)
  const { gesture, clearGesture } = useTouchGestures(gameAreaRef)

  React.useEffect(() => {
    if (gesture && isGameActive) {
      switch (gesture.type) {
        case 'swipe':
          if (gesture.direction) {
            onMove(gesture.direction)
            lightVibration()
          }
          break
        case 'tap':
          onJump()
          mediumVibration()
          break
        case 'longpress':
          onPause()
          break
      }
      clearGesture()
    }
  }, [gesture, isGameActive, onMove, onJump, onPause, clearGesture, lightVibration, mediumVibration])

  if (!isMobile) return null

  const handleDirectionPress = (direction: 'left' | 'right' | 'up' | 'down') => {
    onMove(direction)
    lightVibration()
  }

  const handleJumpPress = () => {
    onJump()
    mediumVibration()
  }

  const handlePausePress = () => {
    onPause()
    mediumVibration()
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        ref={gameAreaRef}
        className="absolute inset-0 pointer-events-auto"
        style={{ touchAction: 'none' }}
      />
      
      {orientation === 'landscape' && (
        <>
          <div className="absolute left-4 bottom-20 flex flex-col items-center space-y-2 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
              onTouchStart={() => handleDirectionPress('up')}
            >
              ↑
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                onTouchStart={() => handleDirectionPress('left')}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                onTouchStart={() => handleDirectionPress('right')}
              >
                →
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
              onTouchStart={() => handleDirectionPress('down')}
            >
              ↓
            </Button>
          </div>

          <div className="absolute right-4 bottom-20 flex flex-col space-y-4 pointer-events-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full bg-blue-500/80 border-blue-300/50 text-white hover:bg-blue-400/80 font-bold text-lg"
              onTouchStart={handleJumpPress}
            >
              JUMP
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-12 h-12 rounded-full bg-gray-500/80 border-gray-300/50 text-white hover:bg-gray-400/80"
              onTouchStart={handlePausePress}
            >
              ⏸
            </Button>
          </div>
        </>
      )}

      {orientation === 'portrait' && (
        <>
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-8 pointer-events-auto">
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                onTouchStart={() => handleDirectionPress('up')}
              >
                ↑
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                  onTouchStart={() => handleDirectionPress('left')}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                  onTouchStart={() => handleDirectionPress('right')}
                >
                  →
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full bg-black/20 border-white/30 text-white hover:bg-white/20"
                onTouchStart={() => handleDirectionPress('down')}
              >
                ↓
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full bg-blue-500/80 border-blue-300/50 text-white hover:bg-blue-400/80 font-bold text-sm"
                onTouchStart={handleJumpPress}
              >
                JUMP
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-12 h-12 rounded-full bg-gray-500/80 border-gray-300/50 text-white hover:bg-gray-400/80"
                onTouchStart={handlePausePress}
              >
                ⏸
              </Button>
            </div>
          </div>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center">
              <p>Swipe to move • Tap to jump • Long press to pause</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}