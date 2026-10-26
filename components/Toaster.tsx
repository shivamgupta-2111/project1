/** Small pop-up message ("Saved", "Copied"...). Call toast("text") from anywhere. */
'use client'
import { create } from 'zustand'
const useToastStore = create<{ msg: string | null }>(() => ({ msg: null }))
let hideTimer: ReturnType<typeof setTimeout>
export const toast = (msg: string) => {
  useToastStore.setState({ msg })
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => useToastStore.setState({ msg: null }), 3000)
}
export default function Toaster() {
  const msg = useToastStore((s) => s.msg)
  return msg ? (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1a1a2e] px-4 py-2.5 text-sm text-white shadow-lg md:bottom-6"
    >
      {msg}
    </div>
  ) : null
}
