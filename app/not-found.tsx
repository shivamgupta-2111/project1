/** Page shown for unknown URLs. */
import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-5xl font-semibold text-brand">404</p>
        <p className="mt-2 text-mute">This page does not exist.</p>
        <Link href="/" className="btn mt-4 inline-block">
          Back to home
        </Link>
      </div>
    </main>
  )
}
