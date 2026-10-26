/** A rep's own profile and target progress. */
'use client'
import { useParams } from 'next/navigation'
import Shell from '@/components/Shell'
import RepProgress from '@/components/RepProgress'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'

export default function Profile() {
  const role = useParams().role as Role
  const me = useStore((state) => state.users.find((user) => user.id === state.meId))
  return (
    <Shell role={role}>
      <h1 className="text-2xl font-semibold">{role === 'rep' ? 'My progress' : 'My profile'}</h1>
      <p className="mb-6 text-sm text-mute">
        {role === 'rep' ? 'Your target, results, photo and details.' : 'Your photo and details.'}
      </p>
      {me ? (
        <RepProgress key={me.id} user={me} manager={false} progress={role === 'rep'} />
      ) : (
        <p className="box text-sm text-mute">Sign in again to see your progress.</p>
      )}
    </Shell>
  )
}
