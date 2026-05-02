import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ClientsPage from './pages/ClientsPage'
import InvoicesPage from './pages/InvoicesPage'
import PaymentsPage from './pages/PaymentsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
    return (
        <BrowserRouter>
            <nav className="bg-slate-800 text-white px-6 py-3 flex gap-6">
                <Link to="/" className="hover:text-blue-400">Dashboard</Link>
                <Link to="/clients" className="hover:text-blue-400">Clients</Link>
                <Link to="/invoices" className="hover:text-blue-400">Invoices</Link>
                <Link to="/payments" className="hover:text-blue-400">Payments</Link>
            </nav>
            <Routes>
                <Route path="/"        element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/invoices"  element={<InvoicesPage />} />
                <Route path="/payments"  element={<PaymentsPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App