import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider, useSession } from '@descope/react-sdk'
import { ConvexReactClient, ConvexProviderWithAuth } from 'convex/react'
import App from './App'
import './styles.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!)

// Bridge Descope to Convex auth
function useDescopeAuth() {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession()
  
  return {
    isAuthenticated: isAuthenticated ?? false,
    isLoading: isSessionLoading,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      // Return the Descope session token for Convex to validate
      return sessionToken || null
    }
  }
}

function RootApp() {
  return (
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID!}>
      <ConvexProviderWithAuth client={convex} useAuth={useDescopeAuth}>
        <App />
      </ConvexProviderWithAuth>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)