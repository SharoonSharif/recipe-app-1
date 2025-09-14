import { Descope } from '@descope/react-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-2">🍳</div>
            <CardTitle className="text-2xl font-bold">
              Welcome to Your Recipe Collection
            </CardTitle>
            <p className="text-muted-foreground">
              Sign in to access your personal recipes and start cooking!
            </p>
          </CardHeader>
          <CardContent>
            <Descope
              flowId="sign-up-or-in"
              onSuccess={() => console.log('Logged in!')}
              onError={() => console.log('Could not log in!')}
            />
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Secure authentication powered by Descope
          </p>
        </div>
      </div>
    </div>
  )
}