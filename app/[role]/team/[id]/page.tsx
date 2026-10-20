'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import RepProgress from '@/components/RepProgress'
import Avatar from '@/components/Avatar'
import { useStore, Role } from '@/lib/store'
export default function RepDetail() {
  const { role: r, id } = useParams() as { role: Role; id: string }; const u = useStore((s) => s.users.find((x) => x.id === id))
  if (r === 'rep') return <Shell role={r}><p className="box text-sm text-mute">Not available.</p></Shell>
  return <Shell role={r}><Link href={`/${r}/team`} className="text-sm text-mute hover:text-brand">← Team</Link><div className="mb-6 mt-2 flex items-center gap-3">{u && <Avatar name={u.name} photo={u.photo} size={48} />}<h1 className="text-2xl font-semibold">{u?.name || 'Rep not found'}</h1></div>{u && <RepProgress key={u.id} user={u} manager />}</Shell>
}
