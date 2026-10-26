/** Store for the open in-app tabs (kept per browser tab). */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
export type Tab = { href: string; title: string; custom?: string }
type TabsState = {
  tabs: Tab[]
  main: string
  open: (href: string, title: string) => void
  rename: (href: string, name: string) => void
  close: (href: string) => string | null
  setMain: (href: string) => void
  clear: () => void
}
// Tabs are kept per browser tab (sessionStorage), so each login keeps its own open items
export const useTabs = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      main: '',
      open: (href, title) => {
        const t = get().tabs
        const existing = t.find((x) => x.href === href)
        if (!existing) set({ tabs: [...t, { href, title }] })
        else if (existing.title !== title)
          set({ tabs: t.map((x) => (x.href === href ? { ...x, title } : x)) })
      },
      rename: (href, name) =>
        set({
          tabs: get().tabs.map((x) =>
            x.href === href ? { ...x, custom: name.trim() || undefined } : x,
          ),
        }),
      close: (href) => {
        const t = get().tabs
        const i = t.findIndex((x) => x.href === href)
        const rest = t.filter((x) => x.href !== href)
        set({ tabs: rest })
        return rest[Math.max(0, i - 1)]?.href ?? null
      },
      setMain: (main) => {
        if (get().main !== main) set({ main })
      },
      clear: () => set({ tabs: [], main: '' }),
    }),
    { name: 'crm-tabs', storage: createJSONStorage(() => sessionStorage) },
  ),
)
