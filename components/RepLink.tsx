/** A rep's name. Admin and CEO can click it to open the rep's profile. */
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Role } from '@/lib/types'

// A rep's name. For Admin and CEO it links to that rep's full profile; reps just see the name.
export default function RepLink({ name, className = '' }: { name: string; className?: string }) {
  const role = useParams().role as Role
  const u = useStore((state) =>
    state.users.find((user) => user.name === name && user.role === 'rep'),
  )
  if (!u || role === 'rep') return <span className={className}>{name}</span>
  return (
    <Link
      href={`/${role}/team/${u.id}`}
      onClick={(event) => event.stopPropagation()}
      title={`View ${name}’s profile`}
      className={`relative z-10 hover:text-brand hover:underline ${className}`}
    >
      {name}
    </Link>
  )
}
