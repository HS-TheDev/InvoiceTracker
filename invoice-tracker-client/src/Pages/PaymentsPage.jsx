//https://github.com/nexu-io/open-design


import { useState, useEffect } from 'react'
import api from '../Services/Api'

function PaymentsPage() {
    const [payments, setPayments] = useState([])
    const [invoices, setInvoices] = useState([])
    const [amountPaid, setAmountPaid] = useState(0)
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [invoiceId, setInvoiceId] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchPayments()
        fetchInvoices()
    }, [])

    const fetchPayments = async () => {
        const result = await api.get('/payments')
        setPayments(result.data)
    }

    const fetchInvoices = async () => {
        const result = await api.get('/invoices')
        setInvoices(result.data)
    }

    const handleSubmit = async () => {
    if (!amountPaid || !paymentDate || !paymentMethod || !invoiceId)
        return alert('Please fill all required fields')

    try {
        if (editingId) {
            await api.put(`/payments/${editingId}`, {
                id: editingId, amountPaid: Number(amountPaid),
                paymentDate, paymentMethod, invoiceId
            })
        } else {
            await api.post('/payments', {
                amountPaid: Number(amountPaid),
                paymentDate, paymentMethod, invoiceId
            })
        }
        await fetchPayments()
        resetForm()
    } catch (error) {
        alert(error.response?.data || 'Something went wrong')
    }
}

    const handleEdit = (payment) => {
        setAmountPaid(payment.amountPaid)
        setPaymentDate(payment.paymentDate?.split('T')[0] || '')
        setPaymentMethod(payment.paymentMethod)
        setInvoiceId(payment.invoiceId)
        setEditingId(payment.id)
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return
        await api.delete(`/payments/${id}`)
        await fetchPayments()
    }

    const resetForm = () => {
        setAmountPaid(0)
        setPaymentDate('')
        setPaymentMethod('')
        setInvoiceId(0)
        setEditingId(null)
        setShowForm(false)
    }

    const getInvoiceNumber = (invoiceId) => {
        const invoice = invoices.find(i => i.id === invoiceId)
        return invoice ? invoice.invoiceNumber : '—'
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

    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0)

    const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other']

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
                        <p className="text-sm text-slate-500 mt-1">{payments.length} total payments</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm) }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ New Payment'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            {editingId ? 'Edit Payment' : 'New Payment'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice *</label>
                                <select
                                    value={invoiceId}
                                    onChange={(e) => setInvoiceId(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value={0}>Select an invoice</option>
                                    {invoices.map(i => (
                                        <option key={i.id} value={i.id}>{i.invoiceNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select a method</option>
                                    {PAYMENT_METHODS.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (PKR) *</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
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
                                {editingId ? 'Update Payment' : 'Record Payment'}
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
                        <p className="text-xl font-bold text-slate-800 mt-1">{payments.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Collected</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cash</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{payments.filter(p => p.paymentMethod === 'Cash').length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bank Transfer</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{payments.filter(p => p.paymentMethod === 'Bank Transfer').length}</p>
                    </div>
                </div>

                {/* Table */}
                {payments.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <p className="text-slate-500">No payments yet. Record your first payment to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={payment.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === payments.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{getInvoiceNumber(payment.invoiceId)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(payment.paymentDate)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentMethod}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800 text-right">{formatCurrency(payment.amountPaid)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(payment)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(payment.id)}
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

export default PaymentsPage