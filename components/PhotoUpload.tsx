'use client'
import { useRef } from 'react'
import Avatar from '@/components/Avatar'
import { useStore, User } from '@/lib/store'
import { toast } from '@/components/Toaster'
// Crops to a centred square and shrinks to 256px so it fits in browser storage
const fit = (file: File) => new Promise<string>((res, rej) => {
  const img = new Image(); const url = URL.createObjectURL(file)
  img.onload = () => { const S = 256; const c = document.createElement('canvas'); c.width = c.height = S; const m = Math.min(img.width, img.height)
    c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85)) }
  img.onerror = () => rej(new Error('bad image')); img.src = url })
export default function PhotoUpload({ user }: { user: User }) {
  const updateUser = useStore((s) => s.updateUser); const ref = useRef<HTMLInputElement>(null)
  const pick = async (f?: File) => { if (!f) return; if (!f.type.startsWith('image/')) return toast('Please choose an image file'); if (f.size > 8 * 1024 * 1024) return toast('Image is too large (max 8 MB)')
    try { updateUser(user.id, { photo: await fit(f) }); toast('Photo updated') } catch { toast('Could not read that image') } }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4"><Avatar name={user.name} photo={user.photo} size={80} />
      <div><div className="flex flex-wrap gap-2"><button className="btn" onClick={() => ref.current?.click()}>{user.photo ? 'Change photo' : 'Upload photo'}</button>
        {user.photo && <button className="btn2" onClick={() => { updateUser(user.id, { photo: undefined }); toast('Photo removed') }}>Remove</button>}</div>
        <p className="mt-1 text-xs text-mute">JPG or PNG. Your initials show until you add a photo.</p></div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} /></div>)
}
