import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import ClientsPage from './Pages/ClientsPage'
import InvoicesPage from './Pages/InvoicesPage'
import PaymentsPage from './Pages/PaymentsPage'
import DashboardPage from './Pages/DashboardPage'
import InvoiceDetailPage from './Pages/InvoiceDetailPage'
import LoginPage from './Pages/LoginPage'
import RegisterPage from './Pages/RegisterPage'
import ProtectedRoute from './Components/ProtectedRoute'
import ThemeToggle from './Components/ThemeToggle'
import { useAuth } from './Context/AuthContext'

function NavBar() {
    const { user, isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (!isAuthenticated) return null

    const links = [
        { to: '/', label: 'Dashboard', end: true },
        { to: '/clients', label: 'Clients' },
        { to: '/invoices', label: 'Invoices' },
        { to: '/payments', label: 'Payments' },
    ]

    const linkClass = ({ isActive }) =>
        `px-3 py-1.5 rounded transition-all duration-200 font-medium ${
            isActive ? 'bg-white/20 border-b-2 border-white' : 'hover:bg-white/10'
        }`

    return (
        <nav className="bg-blue-800 dark:bg-blue-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="font-bold text-lg">InvoiceTracker</span>
                    <div className="hidden md:flex items-center gap-2 ml-4">
                        {links.map(l => (
                            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <span className="hidden sm:inline text-sm text-blue-100">
                        {user?.username} <span className="text-xs opacity-70">({user?.role})</span>
                    </span>
                    <button onClick={handleLogout} className="px-3 py-1.5 rounded text-sm hover:bg-white/10 transition-colors">
                        Logout
                    </button>
                    <button onClick={() => setOpen(!open)} aria-label="Menu" className="md:hidden px-2 py-1 rounded hover:bg-white/10">
                        ☰
                    </button>
                </div>
            </div>
            {open && (
                <div className="md:hidden bg-blue-900 dark:bg-blue-950 border-t border-blue-700">
                    <div className="px-4 py-2 flex flex-col gap-1">
                        {links.map(l => (
                            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                                className={({ isActive }) => `px-3 py-2 rounded font-medium ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                                {l.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}

function App() {
    const location = useLocation()
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {!isAuthPage && <NavBar />}
            <Outlet />
        </div>
    )
}

export default App
