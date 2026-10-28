/** QR code picker for Settings: shrinks the image so it fits in browser storage. */
'use client'
import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { toast } from '@/components/Toaster'

const shrink = (file: File) =>
  new Promise<string>((res, rej) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 400
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      res(canvas.toDataURL('image/png'))
    }
    img.onerror = () => rej(new Error('bad image'))
    img.src = url
  })
export default function QrUpload() {
  const qr = useStore((state) => state.settings.qr)
  const setSettings = useStore((state) => state.setSettings)
  const ref = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose an image file')
    if (file.size > 8 * 1024 * 1024) return toast('Image is too large (max 8 MB)')
    try {
      setSettings({ qr: await shrink(file) })
      toast('QR code saved')
    } catch {
      toast('Could not read that image')
    }
  }
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-28 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-line bg-white">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Payment QR code" className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-mute">No QR yet</span>
        )}
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => ref.current?.click()}>
            {qr ? 'Change QR' : 'Upload QR'}
          </button>
          {qr && (
            <button
              className="btn2"
              onClick={() => {
                setSettings({ qr: undefined })
                toast('QR removed')
              }}
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-mute">UPI or bank QR image (PNG or JPG).</p>
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
