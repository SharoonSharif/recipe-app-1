import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@descope/react-sdk'
import { LoginPage } from '../components/LoginPage'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const navigate = Route.useNavigate()
  const search = Route.useSearch<{ next?: string }>()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: search.next ?? '/app' })
    }
  }, [isAuthenticated, navigate, search.next])

  if (isSessionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <LoginPage />
}

