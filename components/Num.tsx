'use client'
import { useState } from 'react'
// Number input that lets you type freely (like "12." or an empty box) and only commits valid numbers.
export default function Num({ value, onChange, ...rest }: { value: number; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(Math.round(value * 100) / 100)
  return <input {...rest} type="number" inputMode="decimal" value={shown} onFocus={() => setDraft(String(Math.round(value * 100) / 100))} onChange={(e) => { setDraft(e.target.value); onChange(e.target.value) }} onBlur={() => setDraft(null)} />
}
