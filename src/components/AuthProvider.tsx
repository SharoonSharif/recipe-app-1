import { AuthProvider } from '@descope/react-sdk'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

interface AppAuthProviderProps {
  children: ReactNode
}

export function AppAuthProvider({ children }: AppAuthProviderProps) {
  return (
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}>
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    </AuthProvider>
  )
}