import { useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT } from '../constants'

const query = `(max-width: ${MOBILE_BREAKPOINT}px)`

/** True when the viewport is at or below the mobile breakpoint. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
