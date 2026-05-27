import { useEffect, useState } from 'react'

type ThemePref = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

const KEY = 'groundwork-theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    // ignore
  }
  return 'system'
}

function systemDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(theme: Resolved) {
  document.documentElement.dataset.theme = theme
}

/**
 * Theme state: defaults to the system preference and follows it live until the
 * user makes an explicit choice via `toggle`, which is then persisted.
 */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(systemDark)
  // Derived during render — no state mirroring inside an effect.
  const resolved: Resolved = pref === 'system' ? (systemIsDark ? 'dark' : 'light') : pref

  // Sync the resolved theme to the DOM (an external system, so an effect is the
  // right home for it).
  useEffect(() => {
    apply(resolved)
  }, [resolved])

  // While following the system preference, track its live changes.
  useEffect(() => {
    if (pref !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemIsDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  function toggle() {
    const next: Resolved = resolved === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // ignore
    }
    setPref(next)
  }

  return { theme: resolved, toggle }
}
