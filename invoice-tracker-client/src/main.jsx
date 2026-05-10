import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './Context/AuthContext'
import { ThemeProvider } from './Context/ThemeContext'
import LoginPage from './Pages/LoginPage'
import RegisterPage from './Pages/RegisterPage'
import DashboardPage from './Pages/DashboardPage'
import ClientsPage from './Pages/ClientsPage'
import InvoicesPage from './Pages/InvoicesPage'
import InvoiceDetailPage from './Pages/InvoiceDetailPage'
import PaymentsPage from './Pages/PaymentsPage'
import ProtectedRoute from './Components/ProtectedRoute'

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
            { path: 'clients', element: <ProtectedRoute><ClientsPage /></ProtectedRoute> },
            { path: 'invoices', element: <ProtectedRoute><InvoicesPage /></ProtectedRoute> },
            { path: 'invoices/:id', element: <ProtectedRoute><InvoiceDetailPage /></ProtectedRoute> },
            { path: 'payments', element: <ProtectedRoute><PaymentsPage /></ProtectedRoute> },
        ]
    }
])

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
)