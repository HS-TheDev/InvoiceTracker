import { useState, useEffect } from 'react'
import api from '../Services/Api'

function DashboardPage() {
    const [clients, setClients] = useState([])
    const [invoices, setInvoices] = useState([])
    const [payments, setPayments] = useState([])

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        const [clientsRes, invoicesRes, paymentsRes] = await Promise.all([
            api.get('/clients'),
            api.get('/invoices'),
            api.get('/payments')
        ])
        setClients(clientsRes.data)
        setInvoices(invoicesRes.data)
        setPayments(paymentsRes.data)
    }

    const formatDate = (dateString) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleDateString('en-PK', {
            year: 'numeric', month: 'short', day: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency', currency: 'PKR', minimumFractionDigits: 0
        }).format(amount)
    }

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId)
        return client ? client.name : '—'
    }

    const getStatusLabel = (status) => {
        const labels = { 1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue' }
        return labels[status] || 'Unknown'
    }

    const getStatusStyle = (status) => {
        const styles = {
            1: 'bg-slate-100 text-slate-700',
            2: 'bg-amber-100 text-amber-700',
            3: 'bg-emerald-100 text-emerald-700',
            4: 'bg-red-100 text-red-700'
        }
        return styles[status] || 'bg-slate-100 text-slate-700'
    }

    const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0)
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
        .slice(0, 5)
    const overdueInvoices = invoices.filter(i => i.status === 4)

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Overview of your business</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Clients</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{clients.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoices</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{invoices.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Collected</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
                    </div>
                </div>

                {/* Recent Invoices */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-base font-semibold text-slate-800">Recent Invoices</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Last 5 invoices by issue date</p>
                    </div>
                    {recentInvoices.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 text-sm">No invoices yet.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map((invoice, index) => (
                                    <tr key={invoice.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === recentInvoices.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{getClientName(invoice.clientId)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(invoice.issueDate)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800 text-right">{formatCurrency(invoice.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Overdue Invoices */}
                <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                        <h2 className="text-base font-semibold text-red-700">Overdue Invoices</h2>
                        <p className="text-xs text-red-500 mt-0.5">
                            {overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''} require attention
                        </p>
                    </div>
                    {overdueInvoices.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 text-sm">No overdue invoices. You're all caught up!</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-red-50 border-b border-red-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Invoice #</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Client</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Due Date</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueInvoices.map((invoice, index) => (
                                    <tr key={invoice.id} className={`border-b border-red-100 bg-red-50/30 hover:bg-red-50 transition-colors ${index === overdueInvoices.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4 text-sm font-medium text-red-800">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-sm text-red-700">{getClientName(invoice.clientId)}</td>
                                        <td className="px-6 py-4 text-sm text-red-700">{formatDate(invoice.dueDate)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-800 text-right">{formatCurrency(invoice.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    )
}

export default DashboardPage