'use client'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import RepProgress from '@/components/RepProgress'
import { useStore, Role } from '@/lib/store'
export default function Profile() {
  const role = useParams().role as Role; const me = useStore((s) => s.users.find((u) => u.id === s.meId))
  return <Shell role={role}><h1 className="text-2xl font-semibold">My progress</h1><p className="mb-6 text-sm text-mute">Your target, results and details.</p>{me ? <RepProgress key={me.id} user={me} manager={false} /> : <p className="box text-sm text-mute">Sign in again to see your progress.</p>}</Shell>
}
