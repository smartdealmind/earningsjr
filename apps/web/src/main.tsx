import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import App from './App'
import Onboarding from './Onboarding'
import Approvals from './Approvals'
import './index.css'

const Layout = ({ children }: any) => (
  <div>
    <nav style={{ display:'flex', gap:12, padding:12, borderBottom: '1px solid #eee' }}>
      <Link to="/">Home</Link>
      <Link to="/onboarding">Onboarding</Link>
      <Link to="/approvals">Approvals</Link>
    </nav>
    {children}
  </div>
);

const Home = () => <div style={{ padding: 16 }}><App /></div>;

const router = createBrowserRouter([
  { path: '/', element: <Layout><Home /></Layout> },
  { path: '/onboarding', element: <Layout><Onboarding /></Layout> },
  { path: '/approvals', element: <Layout><Approvals /></Layout> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
