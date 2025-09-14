// src/main.tsx - Fixed authentication integration
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider, useSession } from '@descope/react-sdk'
import { ConvexReactClient, ConvexProviderWithAuth } from 'convex/react'
import App from './App'
import './styles.css'

// Validate environment variables
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
const DESCOPE_PROJECT_ID = import.meta.env.VITE_DESCOPE_PROJECT_ID

if (!CONVEX_URL) {
  throw new Error('VITE_CONVEX_URL environment variable is required')
}

if (!DESCOPE_PROJECT_ID) {
  throw new Error('VITE_DESCOPE_PROJECT_ID environment variable is required')
}

const convex = new ConvexReactClient(CONVEX_URL)

// Enhanced Descope to Convex auth bridge
function useDescopeAuth() {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession()
  
  console.log('Auth Bridge State:', {
    isAuthenticated: isAuthenticated ?? false,
    isSessionLoading,
    hasToken: !!sessionToken,
    tokenLength: sessionToken?.length
  })
  
  return {
    isAuthenticated: isAuthenticated ?? false,
    isLoading: isSessionLoading,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      console.log('fetchAccessToken called:', { forceRefreshToken, hasToken: !!sessionToken })
      
      if (!sessionToken) {
        console.log('No session token available')
        return null
      }
      
      // Validate token format (should be a JWT)
      const tokenParts = sessionToken.split('.')
      if (tokenParts.length !== 3) {
        console.error('Invalid token format, expected JWT')
        return null
      }
      
      try {
        // Decode token header to verify it's a valid JWT
        const header = JSON.parse(atob(tokenParts[0]))
        console.log('Token header:', header)
        
        // Return the Descope session token for Convex to validate
        return sessionToken
      } catch (error) {
        console.error('Error validating token:', error)
        return null
      }
    }
  }
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              The app encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Development debug component
function DevDebugInfo() {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded shadow-lg z-50 max-w-xs">
      <div className="font-mono">
        <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isSessionLoading ? '⏳' : '✅'}</div>
        <div>Token: {sessionToken ? '✅' : '❌'}</div>
        <div>Convex: {CONVEX_URL ? '✅' : '❌'}</div>
        <div>Descope: {DESCOPE_PROJECT_ID ? '✅' : '❌'}</div>
      </div>
    </div>
  )
}

function RootApp() {
  return (
    <ErrorBoundary>
      <AuthProvider 
        projectId={DESCOPE_PROJECT_ID}
        config={{
          // Optional: Configure Descope behavior
          debug: process.env.NODE_ENV === 'development',
          autoRefresh: true,
          // Ensure proper session management
          redirectUrl: window.location.origin + '/app',
          // Handle session timeout gracefully
          sessionTokenViaCookie: false,
        }}
      >
        <ConvexProviderWithAuth 
          client={convex} 
          useAuth={useDescopeAuth}
        >
          <App />
          <DevDebugInfo />
        </ConvexProviderWithAuth>
      </AuthProvider>
    </ErrorBoundary>
  )
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)