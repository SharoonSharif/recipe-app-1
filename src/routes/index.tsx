import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@descope/react-sdk'
import { LoginPage } from '../components/LoginPage'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/app' })
    }
  }, [isAuthenticated, navigate])

  if (isSessionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <LoginPage />
}

