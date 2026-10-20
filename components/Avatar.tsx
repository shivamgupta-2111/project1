const V = ['bg-brand/15 text-brand', 'bg-brand text-white', 'bg-slate-500/15 text-slate-500', 'bg-green-600/15 text-green-600']
export const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?'
export default function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  const h = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % V.length
  return photo
    ? <img src={photo} alt={name} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <span aria-label={name} className={`grid shrink-0 place-items-center rounded-full font-semibold ${V[h]}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>{initials(name)}</span>
}
