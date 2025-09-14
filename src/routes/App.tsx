// src/routes/app/__app.tsx  (a parent/layout route that guards children)
import { createFileRoute, redirect } from '@tanstack/react-router'

// Light guard: look for Descope session (stored by their SDK)
export const Route = createFileRoute('/app')({
  beforeLoad: () => {
    const authed = !!localStorage.getItem('DS') // Descope stores session here
    if (!authed) throw redirect({ to: '/login', search: { next: '/app' } })
  },
  component: () => <Outlet />,
})
