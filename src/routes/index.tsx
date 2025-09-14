import { createFileRoute } from '@tanstack/react-router'
import { useSession, useUser, useDescope } from '@descope/react-sdk'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api.js'
import { LoginPage } from '../components/LoginPage'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const { logout } = useDescope()
  const navigate = Route.useNavigate()
  const search = Route.useSearch<{ next?: string }>()
  
  // Simple test query
  const userId = (user as any)?.sub || (user as any)?.id || user?.email
  const recipes = useQuery(api.recipes.getByUser,
    isAuthenticated && userId ? { userId: userId } : "skip"
  )

  useEffect(() => {
    if (isAuthenticated && search.next) {
      navigate({ to: search.next })
    }
  }, [isAuthenticated, search.next, navigate])

  if (isSessionLoading || isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Recipe Collection</h1>
            <button onClick={() => logout()} className="px-4 py-2 bg-red-600 text-white rounded">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Connected to Convex!</h2>
          <p>Recipes: {recipes?.length || 0}</p>
        </div>
      </main>
    </div>
  )
}
