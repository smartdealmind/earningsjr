import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Onboarding from './Onboarding'
import Approvals from './Approvals'
import KidDashboard from './KidDashboard'
import Balances from './Balances'
import Rules from './Rules'
import Goals from './Goals'
import Requests from './Requests'
import Admin from './Admin'
import Shell from './components/Shell'
import { Toaster } from '@/components/ui/sonner'
import { RequireAuth } from './guards'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'

const Home = () => <Shell><App /></Shell>;

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/onboarding', element: <RequireAuth role="parent"><Shell><Onboarding /></Shell></RequireAuth> },
  { path: '/approvals', element: <RequireAuth role="parent"><Shell><Approvals /></Shell></RequireAuth> },
  { path: '/kid', element: <RequireAuth role="kid"><Shell><KidDashboard /></Shell></RequireAuth> },
  { path: '/balances', element: <RequireAuth role="parent"><Shell><Balances /></Shell></RequireAuth> },
  { path: '/rules', element: <RequireAuth role="parent"><Shell><Rules /></Shell></RequireAuth> },
  { path: '/goals', element: <RequireAuth role="kid"><Shell><Goals /></Shell></RequireAuth> },
  { path: '/requests', element: <RequireAuth role="parent"><Shell><Requests /></Shell></RequireAuth> },
  { path: '/admin', element: <RequireAuth><Shell><Admin /></Shell></RequireAuth> }
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
