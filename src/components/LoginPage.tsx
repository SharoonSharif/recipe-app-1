import { useEffect, useState } from 'react'
import { Descope, useSession } from '@descope/react-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function LoginPage() {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession()
  const [componentKey, setComponentKey] = useState(0)
  
  // Add some debug logging
  console.log('LoginPage rendering...')
  console.log('isAuthenticated:', isAuthenticated)
  console.log('isSessionLoading:', isSessionLoading)
  console.log('sessionToken:', !!sessionToken)
  console.log('Descope Project ID:', import.meta.env.VITE_DESCOPE_PROJECT_ID)
  
  // Force component remount when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isSessionLoading) {
      console.log('User logged out, forcing Descope component reset')
      // Force remount by changing the key
      setComponentKey(prev => prev + 1)
    }
  }, [isAuthenticated, isSessionLoading])
  
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🍳</div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-2">🍳</div>
            <CardTitle className="text-2xl font-bold">
              Welcome to Your Recipe Collection
            </CardTitle>
            <p className="text-gray-600">
              Sign in to access your personal recipes and start cooking!
            </p>
          </CardHeader>
          <CardContent>
            {import.meta.env.VITE_DESCOPE_PROJECT_ID ? (
              <div className="space-y-4">
                <div className="min-h-[400px] flex items-center justify-center">
                  <Descope
                    key={componentKey} // Force remount when key changes
                    flowId="sign-up-or-in"
                    onSuccess={(e) => {
                      console.log('Login successful:', e)
                      // The useEffect in index.tsx should handle navigation
                    }}
                    onError={(error) => {
                      console.error('Login error:', error)
                    }}
                    onReady={() => {
                      console.log('Descope component ready')
                    }}
                    theme="light"
                    debug={false} // Disable debug in production
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 font-medium">
                  ❌ Missing Descope Configuration
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Please check your environment variables.
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Required: VITE_DESCOPE_PROJECT_ID
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Debug info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 mb-2">
            Secure authentication powered by Descope
          </p>
          
          {/* Show debug info only in development */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600 text-left">
              <p><strong>Debug Info (dev only):</strong></p>
              <p>• Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
              <p>• Loading: {isSessionLoading ? '✅' : '❌'}</p>
              <p>• Component Key: {componentKey}</p>
              <p>• Convex URL: {import.meta.env.VITE_CONVEX_URL ? '✅' : '❌'}</p>
              <p>• Descope ID: {import.meta.env.VITE_DESCOPE_PROJECT_ID ? '✅' : '❌'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}