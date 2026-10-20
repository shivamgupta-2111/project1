import { useEffect } from 'react'
// Calls fn when Escape is pressed, only while `active` is true
export function useEsc(active: boolean, fn: () => void) {
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') fn() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
}
