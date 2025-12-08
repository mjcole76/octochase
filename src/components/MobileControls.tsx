import React from 'react'
import { Button } from './ui/button'
import { useIsMobile, useTouchGestures, useHapticFeedback, useDeviceOrientation } from '../hooks/use-mobile'

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down') => void
  onJump: () => void
  onPause: () => void
  onInkCloud?: () => void
  isGameActive: boolean
}

export function MobileControls({ onMove, onJump, onPause, onInkCloud, isGameActive }: MobileControlsProps) {
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
          <div 
            className="absolute flex flex-col items-center space-y-2 pointer-events-auto"
            style={{ 
              left: 'max(1rem, env(safe-area-inset-left))',
              bottom: 'max(1.5rem, env(safe-area-inset-bottom))'
            }}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-14 h-14 rounded-full bg-black/30 border-white/40 text-white text-xl hover:bg-white/20 active:scale-90 transition-transform"
              onTouchStart={() => handleDirectionPress('up')}
            >
              ↑
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="w-14 h-14 rounded-full bg-black/30 border-white/40 text-white text-xl hover:bg-white/20 active:scale-90 transition-transform"
                onTouchStart={() => handleDirectionPress('left')}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-14 h-14 rounded-full bg-black/30 border-white/40 text-white text-xl hover:bg-white/20 active:scale-90 transition-transform"
                onTouchStart={() => handleDirectionPress('right')}
              >
                →
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-14 h-14 rounded-full bg-black/30 border-white/40 text-white text-xl hover:bg-white/20 active:scale-90 transition-transform"
              onTouchStart={() => handleDirectionPress('down')}
            >
              ↓
            </Button>
          </div>

          <div 
            className="absolute flex flex-col space-y-4 pointer-events-auto"
            style={{ 
              right: 'max(1rem, env(safe-area-inset-right))',
              bottom: 'max(1.5rem, env(safe-area-inset-bottom))'
            }}
          >
            <Button
              variant="outline"
              size="lg"
              className="w-[72px] h-[72px] rounded-full bg-yellow-500/90 border-yellow-300/50 text-white hover:bg-yellow-400/90 font-bold text-2xl shadow-lg shadow-yellow-500/30 active:scale-90 transition-transform"
              onTouchStart={handleJumpPress}
            >
              ⚡
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-14 h-14 rounded-full bg-gray-500/80 border-gray-300/50 text-white hover:bg-gray-400/80 text-xl active:scale-90 transition-transform"
              onTouchStart={handlePausePress}
            >
              ⏸
            </Button>
          </div>
        </>
      )}

      {orientation === 'portrait' && isGameActive && (
        <>
          {/* Portrait mode: Use joystick on canvas (bottom-left) + action buttons (bottom-right) */}
          <div 
            className="absolute right-4 flex flex-col items-center space-y-4 pointer-events-auto z-50"
            style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
          >
            <Button
              variant="outline"
              size="lg"
              className="w-[72px] h-[72px] rounded-full bg-yellow-500/90 border-yellow-300/50 text-white hover:bg-yellow-400/90 font-bold text-3xl shadow-lg shadow-yellow-500/30 active:scale-90 transition-transform"
              onTouchStart={handleJumpPress}
              title="Jet Dash"
            >
              ⚡
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-[72px] h-[72px] rounded-full bg-purple-500/90 border-purple-300/50 text-white hover:bg-purple-400/90 font-bold text-3xl shadow-lg shadow-purple-500/30 active:scale-90 transition-transform"
              onTouchStart={() => {
                if (onInkCloud) onInkCloud();
                mediumVibration();
              }}
              title="Ink Cloud"
            >
              💨
            </Button>
          </div>

          <div 
            className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto max-w-[90vw] z-50"
            style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
          >
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs text-center">
              <p>🕹️ Joystick: Move • ⚡: Dash • 💨: Ink</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}