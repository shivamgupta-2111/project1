'use client'
import { create } from 'zustand'
const useT = create<{ msg: string | null }>(() => ({ msg: null }))
let t: ReturnType<typeof setTimeout>
export const toast = (msg: string) => { useT.setState({ msg }); clearTimeout(t); t = setTimeout(() => useT.setState({ msg: null }), 3000) }
export default function Toaster() {
  const msg = useT((s) => s.msg)
  return msg ? <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-[#1a1a2e]/80 px-5 py-2.5 text-sm text-white shadow-lg backdrop-blur-xl md:bottom-6">{msg}</div> : null
}
