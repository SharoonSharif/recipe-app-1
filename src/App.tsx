import { RouterProvider, createRouter } from '@tanstack/react-router'
import { AppAuthProvider } from './components/AuthProvider'
import { routeTree } from './routeTree.gen'

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent'
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return (
    <AppAuthProvider>
      <RouterProvider router={router} />
    </AppAuthProvider>
  )
}

export default App
