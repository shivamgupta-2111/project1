/** Profile photo picker that crops and shrinks the image. */
'use client'
import { useRef } from 'react'
import Avatar from '@/components/Avatar'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'
import { User } from '@/lib/types'

// Crops to a centred square and shrinks to 256px so it fits in browser storage
const cropToSquare = (file: File) =>
  new Promise<string>((res, rej) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const SIZE = 256
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = SIZE
      const shortSide = Math.min(img.width, img.height)
      canvas
        .getContext('2d')!
        .drawImage(
          img,
          (img.width - shortSide) / 2,
          (img.height - shortSide) / 2,
          shortSide,
          shortSide,
          0,
          0,
          SIZE,
          SIZE,
        )
      URL.revokeObjectURL(url)
      res(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => rej(new Error('bad image'))
    img.src = url
  })
export default function PhotoUpload({ user }: { user: User }) {
  const updateUser = useStore((state) => state.updateUser)
  const ref = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose an image file')
    if (file.size > 8 * 1024 * 1024) return toast('Image is too large (max 8 MB)')
    try {
      updateUser(user.id, { photo: await cropToSquare(file) })
      toast('Photo updated')
    } catch {
      toast('Could not read that image')
    }
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <Avatar name={user.name} photo={user.photo} size={80} />
      <div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => ref.current?.click()}>
            {user.photo ? 'Change photo' : 'Upload photo'}
          </button>
          {user.photo && (
            <button
              className="btn2"
              onClick={() => {
                updateUser(user.id, { photo: undefined })
                toast('Photo removed')
              }}
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-mute">
          JPG or PNG. Your initials show until you add a photo.
        </p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
