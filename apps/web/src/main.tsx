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
import Shell from './components/Shell'
import { Toaster } from '@/components/ui/sonner'
import './index.css'

const Home = () => <Shell><App /></Shell>;

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/onboarding', element: <Shell><Onboarding /></Shell> },
  { path: '/approvals', element: <Shell><Approvals /></Shell> },
  { path: '/kid', element: <Shell><KidDashboard /></Shell> },
  { path: '/balances', element: <Shell><Balances /></Shell> },
  { path: '/rules', element: <Shell><Rules /></Shell> },
  { path: '/goals', element: <Shell><Goals /></Shell> },
  { path: '/requests', element: <Shell><Requests /></Shell> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>,
)
