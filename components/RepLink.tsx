'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useStore, Role } from '@/lib/store'
// A rep's name. For Admin and CEO it links to that rep's full profile; reps just see the name.
export default function RepLink({ name, className = '' }: { name: string; className?: string }) {
  const role = useParams().role as Role; const u = useStore((s) => s.users.find((x) => x.name === name && x.role === 'rep'))
  if (!u || role === 'rep') return <span className={className}>{name}</span>
  return <Link href={`/${role}/team/${u.id}`} onClick={(e) => e.stopPropagation()} title={`View ${name}’s profile`} className={`relative z-10 hover:text-brand hover:underline ${className}`}>{name}</Link>
}
