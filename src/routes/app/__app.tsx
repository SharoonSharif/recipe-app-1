import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

// Light guard: look for Descope session (stored by their SDK)
export const Route = createFileRoute('/app/__app')({
  beforeLoad: () => {
    const authed = !!localStorage.getItem('DS') // Descope stores session here
    if (!authed) throw redirect({ to: '/', search: { next: '/app' } })
  },
  component: () => <Outlet />,
})

