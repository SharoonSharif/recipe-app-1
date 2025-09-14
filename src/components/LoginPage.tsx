// src/components/LoginPage.tsx - Fixed with better error handling and debugging
import { useEffect, useState } from 'react'
import { Descope, useSession } from '@descope/react-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

export function LoginPage() {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession()
  const [componentKey, setComponentKey] = useState(0)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isDescopeReady, setIsDescopeReady] = useState(false)
  
  console.log('LoginPage render:', {
    isAuthenticated,
    isSessionLoading,
    hasToken: !!sessionToken,
    componentKey,
    projectId: import.meta.env.VITE_DESCOPE_PROJECT_ID
  })
  
  // Force component remount when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isSessionLoading) {
      console.log('User logged out, resetting Descope component')
      setComponentKey(prev => prev + 1)
      setLoginError(null)
    }
  }, [isAuthenticated, isSessionLoading])
  
  // Clear any stale session data on mount
  useEffect(() => {
    if (!isAuthenticated && !isSessionLoading) {
      // Clean up any stale Descope session data
      const descopeKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('DS') || key.startsWith('descope')
      )
      descopeKeys.forEach(key => {
        console.log('Clearing stale session key:', key)
        localStorage.removeItem(key)
      })
    }
  }, [])
  
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">🍳</div>
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-gray-500">Checking your session</div>
        </div>
      </div>
    )
  }

  const handleLoginSuccess = (e: any) => {
    console.log('Login successful:', e)
    setLoginError(null)
    
    // Verify we have the session token
    if (e.detail?.sessionToken) {
      console.log('Session token received, authentication should proceed')
    } else {
      console.warn('Login success but no session token found')
    }
  }

  const handleLoginError = (error: any) => {
    console.error('Login error:', error)
    const errorMessage = error.detail?.message || error.message || 'Login failed'
    setLoginError(errorMessage)
  }

  const handleDescopeReady = () => {
    console.log('Descope component ready')
    setIsDescopeReady(true)
    setLoginError(null)
  }

  const retryLogin = () => {
    setComponentKey(prev => prev + 1)
    setLoginError(null)
    setIsDescopeReady(false)
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
          <CardContent className="space-y-4">
            {import.meta.env.VITE_DESCOPE_PROJECT_ID ? (
              <div className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-700">{loginError}</p>
                      <Button
                        onClick={retryLogin}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="min-h-[400px] flex items-center justify-center relative">
                  {!isDescopeReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-2xl animate-spin mb-2">⏳</div>
                        <div className="text-sm text-gray-600">Loading login form...</div>
                      </div>
                    </div>
                  )}
                  
                  <Descope
                    key={componentKey}
                    flowId="sign-up-or-in"
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    onReady={handleDescopeReady}
                    theme="light"
                    debug={import.meta.env.DEV}
                    config={{
                      // Additional configuration for better UX
                      redirectUrl: window.location.origin + '/app',
                      autoRefresh: true,
                    }}
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
        
        {/* Info Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 mb-2">
            Secure authentication powered by Descope
          </p>
          
          {/* Debug info only in development */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600 text-left">
              <p><strong>Debug Info (dev only):</strong></p>
              <p>• Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
              <p>• Loading: {isSessionLoading ? '✅' : '❌'}</p>
              <p>• Component Key: {componentKey}</p>
              <p>• Descope Ready: {isDescopeReady ? '✅' : '❌'}</p>
              <p>• Has Session Token: {!!sessionToken ? '✅' : '❌'}</p>
              <p>• Convex URL: {import.meta.env.VITE_CONVEX_URL ? '✅' : '❌'}</p>
              <p>• Descope ID: {import.meta.env.VITE_DESCOPE_PROJECT_ID ? '✅' : '❌'}</p>
              {loginError && (
                <p>• Last Error: {loginError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}