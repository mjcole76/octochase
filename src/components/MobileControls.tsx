import React from 'react'
import { Button } from './ui/button'
import { useIsMobile, useHapticFeedback, useDeviceOrientation } from '../hooks/use-mobile'

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down') => void
  onJump: () => void
  onPause: () => void
  onInkCloud?: () => void
  isGameActive: boolean
  // New: continuous movement callback
  onMoveAnalog?: (x: number, y: number) => void
}

export function MobileControls({ onMove, onJump, onPause, onInkCloud, isGameActive, onMoveAnalog }: MobileControlsProps) {
  const isMobile = useIsMobile()
  const orientation = useDeviceOrientation()
  const { lightVibration, mediumVibration } = useHapticFeedback()
  
  // Virtual joystick state
  const joystickRef = React.useRef<HTMLDivElement>(null)
  const [joystickActive, setJoystickActive] = React.useState(false)
  const [joystickPos, setJoystickPos] = React.useState({ x: 0, y: 0 })
  const touchStartRef = React.useRef<{ x: number, y: number } | null>(null)

  // Handle joystick touch
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const touch = e.touches[0]
    const rect = joystickRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    touchStartRef.current = { x: centerX, y: centerY }
    setJoystickActive(true)
    lightVibration()
  }

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchStartRef.current || !joystickActive) return
    
    const touch = e.touches[0]
    const maxDistance = 50
    
    let dx = touch.clientX - touchStartRef.current.x
    let dy = touch.clientY - touchStartRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance
      dy = (dy / distance) * maxDistance
    }
    
    setJoystickPos({ x: dx, y: dy })
    
    // Call analog move if available
    if (onMoveAnalog) {
      onMoveAnalog(dx / maxDistance, dy / maxDistance)
    }
  }

  const handleJoystickEnd = () => {
    setJoystickActive(false)
    setJoystickPos({ x: 0, y: 0 })
    touchStartRef.current = null
    if (onMoveAnalog) {
      onMoveAnalog(0, 0)
    }
  }

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
          {/* Portrait mode: Virtual joystick (left) + action buttons (right) */}
          
          {/* VIRTUAL JOYSTICK - Left side */}
          <div 
            ref={joystickRef}
            className="absolute pointer-events-auto z-50"
            style={{ 
              left: '24px',
              bottom: 'max(24px, calc(env(safe-area-inset-bottom) + 16px))',
              width: '140px',
              height: '140px',
              touchAction: 'none'
            }}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
          >
            {/* Joystick base */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-white/50 bg-black/40"
              style={{ boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
            />
            {/* Joystick knob */}
            <div 
              className="absolute rounded-full bg-cyan-400 border-4 border-white shadow-lg"
              style={{ 
                width: '60px',
                height: '60px',
                left: `calc(50% - 30px + ${joystickPos.x}px)`,
                top: `calc(50% - 30px + ${joystickPos.y}px)`,
                boxShadow: joystickActive ? '0 0 25px rgba(0,255,255,0.8)' : '0 0 10px rgba(0,255,255,0.4)',
                transition: joystickActive ? 'none' : 'all 0.2s ease-out'
              }}
            />
            {/* Label */}
            {!joystickActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white/70 text-xs font-bold">MOVE</span>
              </div>
            )}
          </div>

          {/* Action buttons - Right side */}
          <div 
            className="absolute right-4 flex flex-col items-center space-y-3 pointer-events-auto z-50"
            style={{ bottom: 'max(24px, calc(env(safe-area-inset-bottom) + 16px))' }}
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
        </>
      )}
    </div>
  )
}