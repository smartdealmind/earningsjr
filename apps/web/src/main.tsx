import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import App from './App'
import Onboarding from './Onboarding'
import Approvals from './Approvals'
import KidDashboard from './KidDashboard'
import Balances from './Balances'
import './index.css'

const Layout = ({ children }: any) => (
  <div>
    <nav style={{ display:'flex', gap:12, padding:12, borderBottom: '1px solid #eee' }}>
      <Link to="/">Home</Link>
      <Link to="/onboarding">Onboarding</Link>
      <Link to="/approvals">Approvals</Link>
      <Link to="/kid">Kid Dashboard</Link>
      <Link to="/balances">Balances</Link>
    </nav>
    {children}
  </div>
);

const Home = () => <div style={{ padding: 16 }}><App /></div>;

const router = createBrowserRouter([
  { path: '/', element: <Layout><Home /></Layout> },
  { path: '/onboarding', element: <Layout><Onboarding /></Layout> },
  { path: '/approvals', element: <Layout><Approvals /></Layout> },
  { path: '/kid', element: <Layout><KidDashboard /></Layout> },
  { path: '/balances', element: <Layout><Balances /></Layout> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
