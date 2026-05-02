import { useState, useEffect } from 'react'
import api from '../Services/Api'

function InvoicesPage() {
    const [invoices, setInvoices] = useState([])
    const [clients, setClients] = useState([])
    const [invoiceNumber, setInvoiceNumber] = useState('INV-0001')
    const [issueDate, setIssueDate] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [totalAmount, setTotalAmount] = useState(0)
    const [status, setStatus] = useState(1)
    const [clientId, setClientId] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchInvoices()
        fetchClients()
    }, [])

    const fetchInvoices = async () => {
        const result = await api.get('/invoices')
        setInvoices(result.data)
    }

    const fetchClients = async () => {
        const result = await api.get('/clients')
        setClients(result.data)
    }

    const handleSubmit = async () => {
        if (!invoiceNumber || !issueDate || !dueDate || !totalAmount || !clientId)
            return alert('Please fill all required fields')

        if (editingId) {
            await api.put(`/invoices/${editingId}`, {
                id: editingId, invoiceNumber, issueDate, dueDate,
                totalAmount: Number(totalAmount), status, clientId
            })
        } else {
            await api.post('/invoices', {
                invoiceNumber, issueDate, dueDate,
                totalAmount: Number(totalAmount), status, clientId
            })
        }

        await fetchInvoices()
        resetForm()
    }

    const handleEdit = (invoice) => {
        setInvoiceNumber(invoice.invoiceNumber)
        setIssueDate(invoice.issueDate?.split('T')[0] || '')
        setDueDate(invoice.dueDate?.split('T')[0] || '')
        setTotalAmount(invoice.totalAmount)
        setStatus(invoice.status)
        setClientId(invoice.clientId)
        setEditingId(invoice.id)
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return
        await api.delete(`/invoices/${id}`)
        await fetchInvoices()
    }

    const resetForm = () => {
        setInvoiceNumber('INV-0001')
        setIssueDate('')
        setDueDate('')
        setTotalAmount(0)
        setStatus(1)
        setClientId(0)
        setEditingId(null)
        setShowForm(false)
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

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId)
        return client ? client.name : '—'
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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                        <p className="text-sm text-slate-500 mt-1">{invoices.length} Total invoices</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm) }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ New Invoice'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            {editingId ? 'Edit Invoice' : 'New Invoice'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number *</label>
                                <input
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-0001"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                                <select
                                    value={clientId}
                                    onChange={(e) => setClientId(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value={0}>Select a client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value={1}>Draft</option>
                                    <option value={2}>Sent</option>
                                    <option value={3}>Paid</option>
                                    <option value={4}>Overdue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date *</label>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (PKR) *</label>
                                <input
                                    type="number"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {editingId ? 'Update Invoice' : 'Create Invoice'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{invoices.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paid</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{invoices.filter(i => i.status === 3).length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</p>
                        <p className="text-xl font-bold text-amber-600 mt-1">{invoices.filter(i => i.status === 1 || i.status === 2).length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue</p>
                        <p className="text-xl font-bold text-red-600 mt-1">{invoices.filter(i => i.status === 4).length}</p>
                    </div>
                </div>

                {/* Table */}
                {invoices.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <p className="text-slate-500">No invoices yet. Create your first invoice to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => (
                                    <tr key={invoice.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === invoices.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{getClientName(invoice.clientId)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(invoice.issueDate)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(invoice.dueDate)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800 text-right">{formatCurrency(invoice.totalAmount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(invoice)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(invoice.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InvoicesPage