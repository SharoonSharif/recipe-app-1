import { Descope } from '@descope/react-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function LoginPage() {
  // Add some debug logging
  console.log('LoginPage rendering...')
  console.log('Descope Project ID:', import.meta.env.VITE_DESCOPE_PROJECT_ID)
  
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
            {/* Add fallback UI in case Descope doesn't load */}
            {import.meta.env.VITE_DESCOPE_PROJECT_ID ? (
              <Descope
                flowId="sign-up-or-in"
                onSuccess={() => {
                  console.log('Logged in successfully!')
                }}
                onError={(error) => {
                  console.error('Login error:', error)
                }}
                theme="light"
              />
            ) : (
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">
                  Missing Descope configuration. Please check your environment variables.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Expected: VITE_DESCOPE_PROJECT_ID
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Secure authentication powered by Descope
          </p>
          {/* Debug info - remove after fixing */}
          <div className="mt-2 text-xs text-gray-400">
            <p>Convex URL: {import.meta.env.VITE_CONVEX_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Descope ID: {import.meta.env.VITE_DESCOPE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}