/** Hook: run a function when Escape is pressed. */
import { useEffect } from 'react'
// Calls fn when Escape is pressed, only while `active` is true
export function useEsc(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })
}
