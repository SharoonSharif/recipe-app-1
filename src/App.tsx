import { AppAuthProvider } from './components/AuthProvider'
import { LoginPage } from './components/LoginPage'

function App() {
  return (
    <AppAuthProvider>
      <LoginPage />
    </AppAuthProvider>
  )
}

export default App
