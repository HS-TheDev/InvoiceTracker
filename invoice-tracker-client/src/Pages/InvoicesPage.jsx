import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../Services/Api'
import { exportToCsv } from '../Utils/csvExport'
import { useUnsavedChanges } from '../Hooks/useUnsavedChanges'

const TAKE = 10

function InvoicesPage() {
    const [invoices, setInvoices] = useState([])
    const [allClients, setAllClients] = useState([])
    const [total, setTotal] = useState(0)
    const [skip, setSkip] = useState(0)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [issueDate, setIssueDate] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [status, setStatus] = useState(1)
    const [clientId, setClientId] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formError, setFormError] = useState('')
    const [dirty, setDirty] = useState(false)

    useUnsavedChanges(dirty)

    useEffect(() => { fetchAllClients() }, [])
    useEffect(() => { fetchInvoices() }, [search, statusFilter, skip])

    const fetchInvoices = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/invoices', {
                params: { search: search || undefined, status: statusFilter || undefined, skip, take: TAKE }
            })
            setInvoices(data.items)
            setTotal(data.total)
        } catch {
            setError('Failed to load invoices.')
        } finally {
            setLoading(false)
        }
    }

    const fetchAllClients = async () => {
        try {
            const { data } = await api.get('/clients', { params: { take: 0 } })
            setAllClients(data.items)
        } catch { /* non-critical */ }
    }

    const markDirty = (setter) => (val) => { setter(val); setDirty(true) }
    const handleSearchChange = (val) => { setSearch(val); setSkip(0) }
    const handleStatusFilterChange = (val) => { setStatusFilter(val); setSkip(0) }

    const handleSubmit = async () => {
        if (!issueDate || !dueDate || !totalAmount || !clientId) {
            setFormError('Please fill all required fields.'); return
        }
        setFormError('')
        try {
            if (editingId) {
                await api.put(`/invoices/${editingId}`, { id: editingId, issueDate, dueDate, totalAmount: Number(totalAmount), status, clientId })
            } else {
                await api.post('/invoices', { issueDate, dueDate, totalAmount: Number(totalAmount), status, clientId })
            }
            setDirty(false)
            await fetchInvoices()
            resetForm()
        } catch (err) {
            setFormError(err.response?.data?.title || err.response?.data || 'Failed to save invoice.')
        }
    }

    const handleEdit = (invoice) => {
        setIssueDate(invoice.issueDate?.split('T')[0] || '')
        setDueDate(invoice.dueDate?.split('T')[0] || '')
        setTotalAmount(invoice.totalAmount)
        setStatus(invoice.status)
        setClientId(invoice.clientId)
        setEditingId(invoice.id)
        setFormError('')
        setShowForm(true)
        setDirty(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return
        try {
            await api.delete(`/invoices/${id}`)
            await fetchInvoices()
        } catch (err) {
            setError(err.response?.status === 403 ? 'Only admins can delete.' : 'Failed to delete invoice.')
        }
    }

    const resetForm = () => {
        setIssueDate(''); setDueDate(''); setTotalAmount(''); setStatus(1); setClientId(0)
        setEditingId(null); setFormError(''); setShowForm(false); setDirty(false)
    }

    const handleExport = async () => {
        try {
            const { data } = await api.get('/invoices', { params: { take: 0 } })
            exportToCsv('invoices.csv', data.items, [
                { label: 'Invoice #', value: 'invoiceNumber' },
                { label: 'Client', value: 'clientName' },
                { label: 'Issue Date', value: (r) => r.issueDate?.split('T')[0] },
                { label: 'Due Date', value: (r) => r.dueDate?.split('T')[0] },
                { label: 'Status', value: (r) => getStatusLabel(r.status) },
                { label: 'Total Amount', value: 'totalAmount' },
            ])
        } catch {
            setError('Failed to export invoices.')
        }
    }

    const getStatusLabel = (s) => ({ 1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue' }[s] || 'Unknown')
    const getStatusStyle = (s) => ({
        1: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        4: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }[s] || '')

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const formatCurrency = (a) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(a)

    const totalPages = Math.ceil(total / TAKE)
    const currentPage = Math.floor(skip / TAKE) + 1

    const inputCls = "w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invoices</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} total invoices</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Export CSV</button>
                        <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{showForm ? 'Cancel' : '+ New Invoice'}</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

                {showForm && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{editingId ? 'Edit Invoice' : 'New Invoice'}</h2>
                        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">{formError}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
                                <select value={clientId} onChange={(e) => markDirty(setClientId)(Number(e.target.value))} className={inputCls}>
                                    <option value={0}>Select a client</option>
                                    {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select value={status} onChange={(e) => markDirty(setStatus)(Number(e.target.value))} className={inputCls}>
                                    <option value={1}>Draft</option><option value={2}>Sent</option><option value={3}>Paid</option><option value={4}>Overdue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date *</label>
                                <input type="date" value={issueDate} onChange={(e) => markDirty(setIssueDate)(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
                                <input type="date" value={dueDate} onChange={(e) => markDirty(setDueDate)(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Amount (PKR) *</label>
                                <input type="number" value={totalAmount} onChange={(e) => markDirty(setTotalAmount)(e.target.value)} placeholder="0" className={inputCls} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">{editingId ? 'Update Invoice' : 'Create Invoice'}</button>
                            <button onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-lg text-sm font-medium">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {[
                        { label: 'Total', value: total, color: 'text-slate-800 dark:text-slate-100' },
                        { label: 'Paid', value: invoices.filter(i => i.status === 3).length, color: 'text-emerald-600' },
                        { label: 'Pending', value: invoices.filter(i => i.status === 1 || i.status === 2).length, color: 'text-amber-600' },
                        { label: 'Overdue', value: invoices.filter(i => i.status === 4).length, color: 'text-red-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                    <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by invoice # or client..."
                        className="flex-1 min-w-[200px] md:max-w-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm bg-white" />
                    <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="">All Statuses</option>
                        <option value="1">Draft</option><option value="2">Sent</option><option value="3">Paid</option><option value="4">Overdue</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">{search || statusFilter ? 'No invoices match your filters.' : 'No invoices yet. Create your first invoice to get started.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                            <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                                                    <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">{invoice.invoiceNumber}</Link>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{invoice.clientName}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(invoice.issueDate)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(invoice.dueDate)}</td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>{getStatusLabel(invoice.status)}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100 text-right whitespace-nowrap">{formatCurrency(invoice.totalAmount)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                                    <Link to={`/invoices/${invoice.id}`} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 text-sm font-medium mr-3">View</Link>
                                                    <button onClick={() => handleEdit(invoice)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                                                    <button onClick={() => handleDelete(invoice.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
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

export default InvoicesPage
