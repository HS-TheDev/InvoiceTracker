import { useState, useEffect } from 'react'
import api from '../Services/Api'
import { exportToCsv } from '../Utils/csvExport'
import { useUnsavedChanges } from '../Hooks/useUnsavedChanges'

const TAKE = 10
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other']

function PaymentsPage() {
    const [payments, setPayments] = useState([])
    const [allInvoices, setAllInvoices] = useState([])
    const [total, setTotal] = useState(0)
    const [skip, setSkip] = useState(0)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [amountPaid, setAmountPaid] = useState('')
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [invoiceId, setInvoiceId] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formError, setFormError] = useState('')
    const [dirty, setDirty] = useState(false)

    useUnsavedChanges(dirty)

    useEffect(() => { fetchAllInvoices() }, [])
    useEffect(() => { fetchPayments() }, [skip])

    const fetchPayments = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/payments', { params: { skip, take: TAKE } })
            setPayments(data.items)
            setTotal(data.total)
        } catch {
            setError('Failed to load payments.')
        } finally {
            setLoading(false)
        }
    }

    const fetchAllInvoices = async () => {
        try {
            const { data } = await api.get('/invoices', { params: { take: 0 } })
            setAllInvoices(data.items)
        } catch { /* non-critical */ }
    }

    const markDirty = (setter) => (val) => { setter(val); setDirty(true) }

    const handleSubmit = async () => {
        if (!amountPaid || !paymentDate || !paymentMethod || !invoiceId) {
            setFormError('Please fill all required fields.'); return
        }
        setFormError('')
        try {
            if (editingId) {
                await api.put(`/payments/${editingId}`, { id: editingId, amountPaid: Number(amountPaid), paymentDate, paymentMethod, invoiceId })
            } else {
                await api.post('/payments', { amountPaid: Number(amountPaid), paymentDate, paymentMethod, invoiceId })
            }
            setDirty(false)
            await fetchPayments()
            resetForm()
        } catch (err) {
            setFormError(err.response?.data?.title || err.response?.data || 'Failed to save payment.')
        }
    }

    const handleEdit = (payment) => {
        setAmountPaid(payment.amountPaid)
        setPaymentDate(payment.paymentDate?.split('T')[0] || '')
        setPaymentMethod(payment.paymentMethod)
        setInvoiceId(payment.invoiceId)
        setEditingId(payment.id)
        setFormError('')
        setShowForm(true)
        setDirty(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return
        try {
            await api.delete(`/payments/${id}`)
            await fetchPayments()
        } catch (err) {
            setError(err.response?.status === 403 ? 'Only admins can delete.' : 'Failed to delete payment.')
        }
    }

    const resetForm = () => {
        setAmountPaid(''); setPaymentDate(''); setPaymentMethod(''); setInvoiceId(0)
        setEditingId(null); setFormError(''); setShowForm(false); setDirty(false)
    }

    const handleExport = async () => {
        try {
            const { data } = await api.get('/payments', { params: { take: 0 } })
            exportToCsv('payments.csv', data.items, [
                { label: 'Invoice #', value: 'invoiceNumber' },
                { label: 'Date', value: (r) => r.paymentDate?.split('T')[0] },
                { label: 'Method', value: 'paymentMethod' },
                { label: 'Amount', value: 'amountPaid' },
            ])
        } catch {
            setError('Failed to export payments.')
        }
    }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const formatCurrency = (a) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(a)

    const filteredPayments = search
        ? payments.filter(p =>
            p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
            p.paymentMethod?.toLowerCase().includes(search.toLowerCase()))
        : payments

    const totalPages = Math.ceil(total / TAKE)
    const currentPage = Math.floor(skip / TAKE) + 1
    const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0)

    const inputCls = "w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Payments</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} total payments</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Export CSV</button>
                        <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{showForm ? 'Cancel' : '+ New Payment'}</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

                {showForm && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{editingId ? 'Edit Payment' : 'New Payment'}</h2>
                        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">{formError}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice *</label>
                                <select value={invoiceId} onChange={(e) => markDirty(setInvoiceId)(Number(e.target.value))} className={inputCls}>
                                    <option value={0}>Select an invoice</option>
                                    {allInvoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method *</label>
                                <select value={paymentMethod} onChange={(e) => markDirty(setPaymentMethod)(e.target.value)} className={inputCls}>
                                    <option value="">Select a method</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                                <input type="date" value={paymentDate} onChange={(e) => markDirty(setPaymentDate)(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (PKR) *</label>
                                <input type="number" value={amountPaid} onChange={(e) => markDirty(setAmountPaid)(e.target.value)} placeholder="0" className={inputCls} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">{editingId ? 'Update' : 'Record Payment'}</button>
                            <button onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-lg text-sm font-medium">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collected (Page)</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cash</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{payments.filter(p => p.paymentMethod === 'Cash').length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bank Transfer</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{payments.filter(p => p.paymentMethod === 'Bank Transfer').length}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice # or method..."
                        className="w-full md:w-80 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm bg-white" />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : filteredPayments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">{search ? 'No payments match your search.' : 'No payments yet. Record your first payment to get started.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                                            <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                            <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{payment.invoiceNumber}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(payment.paymentDate)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{payment.paymentMethod}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100 text-right whitespace-nowrap">{formatCurrency(payment.amountPaid)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                                    <button onClick={() => handleEdit(payment)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                                                    <button onClick={() => handleDelete(payment.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Showing {skip + 1}–{Math.min(skip + TAKE, total)} of {total}</span>
                                <div className="flex gap-2">
                                    <button disabled={skip === 0} onClick={() => setSkip(s => s - TAKE)} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Previous</button>
                                    <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">{currentPage} / {totalPages}</span>
                                    <button disabled={skip + TAKE >= total} onClick={() => setSkip(s => s + TAKE)} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default PaymentsPage
