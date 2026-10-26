/** Round profile picture, or coloured initials when there is no photo. */
const AVATAR_COLORS = [
  'bg-brand/15 text-brand',
  'bg-brand text-white',
  'bg-slate-500/15 text-slate-500',
  'bg-green-600/15 text-green-600',
]
export const initials = (fullName: string) =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || '?'
export default function Avatar({
  name,
  photo,
  size = 36,
}: {
  name: string
  photo?: string
  size?: number
}) {
  const colorIndex =
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length
  return photo ? (
    <img
      src={photo}
      alt={name}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-label={name}
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${AVATAR_COLORS[colorIndex]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}
