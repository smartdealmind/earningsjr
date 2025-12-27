import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import HomePublic from './pages/HomePublic'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './Onboarding'
import Approvals from './Approvals'
import KidDashboard from './KidDashboard'
import Goals from './Goals'
import Admin from './Admin'
import Achievements from './Achievements'
import Pricing from './pages/Pricing'
import Home from './pages/Home'
import Kids from './pages/Kids'
import Settings from './pages/Settings'
import Shell from './components/Shell'
import { Toaster } from '@/components/ui/sonner'
import { RequireAuth } from './guards'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'
import './lib/analytics' // Initialize PostHog

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}

// Wrap routes with ErrorBoundary for better error handling
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
)

const router = createBrowserRouter([
  { path: '/', element: <RouteWrapper><Shell><HomePublic /></Shell></RouteWrapper> },
  { path: '/register', element: <RouteWrapper><Shell><Register /></Shell></RouteWrapper> },
  { path: '/login', element: <RouteWrapper><Shell><Login /></Shell></RouteWrapper> },
  { path: '/forgot-password', element: <RouteWrapper><Shell><ForgotPassword /></Shell></RouteWrapper> },
  { path: '/reset-password', element: <RouteWrapper><Shell><ResetPassword /></Shell></RouteWrapper> },
  { path: '/dev', element: <RouteWrapper><Shell><App /></Shell></RouteWrapper> },
  { path: '/onboarding', element: <RouteWrapper><RequireAuth role="parent"><Shell><Onboarding /></Shell></RequireAuth></RouteWrapper> },
  // New main navigation routes
  { path: '/home', element: <RouteWrapper><RequireAuth><Shell><Home /></Shell></RequireAuth></RouteWrapper> },
  { path: '/approvals', element: <RouteWrapper><RequireAuth role="parent"><Shell><Approvals /></Shell></RequireAuth></RouteWrapper> },
  { path: '/kids', element: <RouteWrapper><RequireAuth role="parent"><Shell><Kids /></Shell></RequireAuth></RouteWrapper> },
  { path: '/settings', element: <RouteWrapper><RequireAuth role="parent"><Shell><Settings /></Shell></RequireAuth></RouteWrapper> },
  // Kid routes
  { path: '/kid', element: <RouteWrapper><RequireAuth role="kid"><Shell><KidDashboard /></Shell></RequireAuth></RouteWrapper> },
  { path: '/goals', element: <RouteWrapper><RequireAuth role="kid"><Shell><Goals /></Shell></RequireAuth></RouteWrapper> },
  { path: '/achievements', element: <RouteWrapper><RequireAuth role="kid"><Shell><Achievements /></Shell></RequireAuth></RouteWrapper> },
  // Legacy routes (redirect to new structure)
  { path: '/balances', element: <RouteWrapper><RequireAuth role="parent"><Shell><Kids /></Shell></RequireAuth></RouteWrapper> },
  { path: '/rules', element: <RouteWrapper><RequireAuth role="parent"><Shell><Settings /></Shell></RequireAuth></RouteWrapper> },
  { path: '/requests', element: <RouteWrapper><RequireAuth role="parent"><Shell><Settings /></Shell></RequireAuth></RouteWrapper> },
  { path: '/reminders', element: <RouteWrapper><RequireAuth role="parent"><Shell><Settings /></Shell></RequireAuth></RouteWrapper> },
  // Admin
  { path: '/admin', element: <RouteWrapper><RequireAuth><Shell><Admin /></Shell></RequireAuth></RouteWrapper> },
  { path: '/pricing', element: <RouteWrapper><Shell><Pricing /></Shell></RouteWrapper> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
)
