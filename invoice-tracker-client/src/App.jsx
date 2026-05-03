import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ClientsPage from './pages/ClientsPage'
import InvoicesPage from './pages/InvoicesPage'
import PaymentsPage from './pages/PaymentsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
    return (
        <BrowserRouter>
           <nav className="bg-blue-800 text-white px-6 py-5 flex justify-center items-center gap-8">
                <Link to="/" className="transition-transform duration-200 hover:scale-125 px-3">
                    Dashboard
                </Link>
                <Link to="/clients" className="transition-transform duration-200 hover:scale-125 px-3">
                    Clients
                </Link>
                <Link to="/invoices" className="transition-transform duration-200 hover:scale-125  px-3">
                    Invoices
                </Link>
                <Link to="/payments" className="transition-transform duration-200 hover:scale-125 px-3">
                    Payments
                </Link>
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