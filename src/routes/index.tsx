import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@descope/react-sdk'
import { LoginPage } from '../components/LoginPage'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isSessionLoading } = useSession()
<<<<<<< ours
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
=======
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/app' })
    }
  }, [isAuthenticated, navigate])
>>>>>>> theirs

  if (isSessionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <LoginPage />
}

