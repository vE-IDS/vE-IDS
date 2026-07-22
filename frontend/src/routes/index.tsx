import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated, isLoading, user, login } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-3xl font-bold">vE-IDS</h1>
        <p className="text-muted-foreground">Virtual Integrated Display System</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : isAuthenticated ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">
            Signed in as {user?.firstName} {user?.lastName} (CID {user?.cid})
          </p>
          <Link to="/ids" className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Open dashboard
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={login}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign in with VATSIM
        </button>
      )}
    </main>
  )
}
