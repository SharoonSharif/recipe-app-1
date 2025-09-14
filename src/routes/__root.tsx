// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export const Route = createRootRoute({
  component: () => (
    <ConvexProvider client={convex}>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </ConvexProvider>
  ),
})
