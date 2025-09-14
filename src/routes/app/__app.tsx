// src/routes/app/__app.tsx - Fixed authentication guard
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/__app')({
  beforeLoad: ({ location }) => {
    // Check multiple possible Descope session indicators
    const hasDescopeSession = !!(
      localStorage.getItem('DS') || 
      localStorage.getItem('DSR') ||
      sessionStorage.getItem('DS') ||
      // Check for any Descope-related items
      Object.keys(localStorage).some(key => key.startsWith('DS')) ||
      Object.keys(sessionStorage).some(key => key.startsWith('DS'))
    )
    
    console.log('Auth Guard Check:', {
      hasDescopeSession,
      currentPath: location.pathname,
      localStorage: Object.keys(localStorage).filter(k => k.startsWith('DS')),
      sessionStorage: Object.keys(sessionStorage).filter(k => k.startsWith('DS'))
    })
    
    if (!hasDescopeSession) {
      console.log('No authentication found, redirecting to login')
      throw redirect({ 
        to: '/', 
        search: { 
          redirect: location.href 
        } 
      })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}

// src/routes/index.tsx - Fixed login page with better redirect handling
import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@descope/react-sdk'
import { LoginPage } from '../components/LoginPage'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || '/app',
    }
  },
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const navigate = Route.useNavigate()
  const { redirect } = Route.useSearch()

  useEffect(() => {
    if (isAuthenticated && !isSessionLoading) {
      console.log('User authenticated, redirecting to:', redirect)
      // Use a small delay to ensure session is fully established
      setTimeout(() => {
        navigate({ to: redirect as any })
      }, 100)
    }
  }, [isAuthenticated, isSessionLoading, navigate, redirect])

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🍳</div>
          <div className="text-lg font-medium">Checking authentication...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🔄</div>
          <div className="text-lg font-medium">Redirecting to your recipes...</div>
        </div>
      </div>
    )
  }

  return <LoginPage />
}