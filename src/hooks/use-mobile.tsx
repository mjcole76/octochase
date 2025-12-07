import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'longpress'
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
  duration?: number
  scale?: number
}

export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const [gesture, setGesture] = React.useState<TouchGesture | null>(null)
  
  const touchStartRef = React.useRef<{ x: number; y: number; time: number; touches: number } | null>(null)
  const touchEndRef = React.useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        touches: e.touches.length
      }

      longPressTimerRef.current = setTimeout(() => {
        setGesture({ type: 'longpress' })
      }, 500)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      const touch = e.changedTouches[0]
      const touchStart = touchStartRef.current
      
      if (!touchStart) return

      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      const deltaX = touchEndRef.current.x - touchStart.x
      const deltaY = touchEndRef.current.y - touchStart.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = touchEndRef.current.time - touchStart.time

      if (distance < 10 && duration < 300) {
        setGesture({ type: 'tap' })
      } else if (distance > 30) {
        let direction: 'left' | 'right' | 'up' | 'down' = 'right'
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        setGesture({
          type: 'swipe',
          direction,
          distance,
          duration
        })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [elementRef])

  const clearGesture = React.useCallback(() => {
    setGesture(null)
  }, [])

  return { gesture, clearGesture }
}

export function useHapticFeedback() {
  const vibrate = React.useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [])

  const lightVibration = React.useCallback(() => vibrate(50), [vibrate])
  const mediumVibration = React.useCallback(() => vibrate(100), [vibrate])
  const strongVibration = React.useCallback(() => vibrate([100, 50, 100]), [vibrate])

  return {
    vibrate,
    lightVibration,
    mediumVibration,
    strongVibration
  }
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [])

  return orientation
}

export function useMobilePerformance() {
  const [isLowPerformance, setIsLowPerformance] = React.useState(false)
  
  React.useEffect(() => {
    const connection = (navigator as any).connection
    if (connection) {
      const checkPerformance = () => {
        const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
        const isLowEndDevice = navigator.hardwareConcurrency <= 2
        setIsLowPerformance(isSlowConnection || isLowEndDevice)
      }
      
      checkPerformance()
      connection.addEventListener('change', checkPerformance)
      
      return () => connection.removeEventListener('change', checkPerformance)
    }
  }, [])

  return { isLowPerformance }
}
