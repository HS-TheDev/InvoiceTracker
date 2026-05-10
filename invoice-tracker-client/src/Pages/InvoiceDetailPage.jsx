import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../Services/Api'
import { generateInvoiceItems, getOverdueReminder } from '../Services/AiApi'

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other']

function InvoiceDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState(null)
    const [items, setItems] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [showItemForm, setShowItemForm] = useState(false)
    const [editingItemId, setEditingItemId] = useState(null)
    const [description, setDescription] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState('')
    const [itemError, setItemError] = useState('')

    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [amountPaid, setAmountPaid] = useState('')
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [paymentError, setPaymentError] = useState('')

    const [emailSending, setEmailSending] = useState(false)
    const [emailMsg, setEmailMsg] = useState('')

    const [showAiPanel, setShowAiPanel] = useState(false)
    const [aiDesc, setAiDesc] = useState('')
    const [aiSuggestions, setAiSuggestions] = useState([])
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState('')
    const [addingIdx, setAddingIdx] = useState(null)

    const [reminderLoading, setReminderLoading] = useState(false)
    const [reminder, setReminder] = useState(null)
    const [showReminderModal, setShowReminderModal] = useState(false)

    useEffect(() => { fetchAll() }, [id])

    const fetchAll = async () => {
        setLoading(true)
        setError('')
        try {
            const [invRes, itemsRes, paysRes] = await Promise.all([
                api.get(`/invoices/${id}`),
                api.get(`/invoiceitems/invoice/${id}`),
                api.get(`/payments/invoice/${id}`)
            ])
            setInvoice(invRes.data)
            setItems(itemsRes.data)
            setPayments(paysRes.data)
        } catch {
            setError('Failed to load invoice details.')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveItem = async () => {
        if (!description || !quantity || !unitPrice) { setItemError('All fields are required.'); return }
        setItemError('')
        try {
            const payload = { description, quantity: Number(quantity), unitPrice: Number(unitPrice), invoiceId: Number(id) }
            if (editingItemId) {
                await api.put(`/invoiceitems/${editingItemId}`, { ...payload, id: editingItemId })
            } else {
                await api.post('/invoiceitems', payload)
            }
            await fetchAll()
            resetItemForm()
        } catch (err) {
            setItemError(err.response?.data?.title || err.response?.data || 'Failed to save item.')
        }
    }

    const handleEditItem = (item) => {
        setDescription(item.description); setQuantity(item.quantity); setUnitPrice(item.unitPrice)
        setEditingItemId(item.id); setItemError(''); setShowItemForm(true)
    }

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Delete this line item?')) return
        try { await api.delete(`/invoiceitems/${itemId}`); await fetchAll() }
        catch { setError('Failed to delete item.') }
    }

    const resetItemForm = () => {
        setDescription(''); setQuantity(1); setUnitPrice('')
        setEditingItemId(null); setItemError(''); setShowItemForm(false)
    }

    const handleSavePayment = async () => {
        if (!amountPaid || !paymentDate || !paymentMethod) { setPaymentError('All fields are required.'); return }
        setPaymentError('')
        try {
            await api.post('/payments', { amountPaid: Number(amountPaid), paymentDate, paymentMethod, invoiceId: Number(id) })
            await fetchAll()
            resetPaymentForm()
        } catch (err) {
            setPaymentError(err.response?.data?.title || err.response?.data || 'Failed to record payment.')
        }
    }

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm('Delete this payment?')) return
        try { await api.delete(`/payments/${paymentId}`); await fetchAll() }
        catch { setError('Failed to delete payment.') }
    }

    const resetPaymentForm = () => {
        setAmountPaid(''); setPaymentDate(''); setPaymentMethod('')
        setPaymentError(''); setShowPaymentForm(false)
    }

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
            const url = URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.download = `${invoice.invoiceNumber}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch { setError('Failed to download PDF.') }
    }

    const handleSendEmail = async () => {
        if (!window.confirm(`Send invoice ${invoice.invoiceNumber} to ${invoice.clientName}?`)) return
        setEmailSending(true)
        setEmailMsg('')
        try {
            await api.post(`/invoices/${id}/send-email`)
            setEmailMsg('Email sent successfully!')
        } catch (err) {
            setEmailMsg(err.response?.data?.error || err.response?.data?.message || 'Failed to send email.')
        } finally {
            setEmailSending(false)
        }
    }

    const handleGenerateItems = async () => {
        if (!aiDesc.trim()) return
        setAiLoading(true)
        setAiError('')
        setAiSuggestions([])
        try {
            const { data } = await generateInvoiceItems(aiDesc)
            setAiSuggestions(data)
        } catch (err) {
            setAiError(err.response?.data?.error || 'Failed to generate suggestions. Check your Gemini API key.')
        } finally {
            setAiLoading(false)
        }
    }

    const handleAddSuggestion = async (suggestion, idx) => {
        setAddingIdx(idx)
        try {
            await api.post('/invoiceitems', {
                description: suggestion.description,
                quantity: suggestion.quantity,
                unitPrice: suggestion.unitPrice,
                invoiceId: Number(id)
            })
            await fetchAll()
            setAiSuggestions(prev => prev.filter((_, i) => i !== idx))
        } catch {
            setAiError('Failed to add item.')
        } finally {
            setAddingIdx(null)
        }
    }

    const handleDraftReminder = async () => {
        setReminderLoading(true)
        try {
            const { data } = await getOverdueReminder(id)
            setReminder(data)
            setShowReminderModal(true)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate reminder. Check your Gemini API key.')
        } finally {
            setReminderLoading(false)
        }
    }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const formatCurrency = (a) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(a || 0)
    const getStatusLabel = (s) => ({ 1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue' }[s] || 'Unknown')
    const getStatusStyle = (s) => ({
        1: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        4: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }[s] || 'bg-slate-100 text-slate-700')

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0)
    const balance = (invoice?.totalAmount || 0) - totalPaid
    const isOverdue = invoice?.status === 4

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
                <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error || 'Invoice not found.'}</div>
                <button onClick={() => navigate('/invoices')} className="mt-4 text-blue-600 hover:underline">← Back to invoices</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
                    <Link to="/invoices" className="text-sm text-blue-600 hover:underline">← Back to invoices</Link>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{invoice.invoiceNumber}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{invoice.clientName}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {isOverdue && (
                                <button onClick={handleDraftReminder} disabled={reminderLoading}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    {reminderLoading ? 'Drafting...' : 'Draft Reminder'}
                                </button>
                            )}
                            <button onClick={handleSendEmail} disabled={emailSending}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                {emailSending ? 'Sending...' : 'Send Email'}
                            </button>
                            <button onClick={handleDownloadPdf}
                                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Download PDF
                            </button>
                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                                {getStatusLabel(invoice.status)}
                            </span>
                        </div>
                    </div>
                    {emailMsg && (
                        <div className={`mt-3 px-3 py-2 rounded text-sm ${emailMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {emailMsg}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Issue Date', value: formatDate(invoice.issueDate) },
                        { label: 'Due Date', value: formatDate(invoice.dueDate) },
                        { label: 'Total', value: formatCurrency(invoice.totalAmount), bold: true, color: 'text-blue-600' },
                        { label: 'Balance', value: formatCurrency(balance), bold: true, color: balance > 0 ? 'text-amber-600' : 'text-emerald-600' },
                    ].map(({ label, value, bold, color }) => (
                        <div key={label} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                            <p className={`text-sm mt-1 ${bold ? 'font-bold' : 'font-semibold text-slate-800 dark:text-slate-100'} ${color || ''}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Line Items */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Line Items</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total auto-calculates from items</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowAiPanel(!showAiPanel); setShowItemForm(false); setAiSuggestions([]) }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                {showAiPanel ? 'Close AI' : 'Generate with AI'}
                            </button>
                            <button onClick={() => { resetItemForm(); setShowItemForm(!showItemForm); setShowAiPanel(false) }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                {showItemForm ? 'Cancel' : '+ Add Item'}
                            </button>
                        </div>
                    </div>

                    {/* AI Generate Panel */}
                    {showAiPanel && (
                        <div className="px-4 sm:px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Describe the project and Gemini will suggest line items</p>
                            {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{aiError}</div>}
                            <div className="flex gap-2">
                                <input value={aiDesc} onChange={(e) => setAiDesc(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateItems()}
                                    placeholder="e.g. 3-day React frontend development project..."
                                    className="flex-1 border border-purple-300 dark:border-purple-700 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                <button onClick={handleGenerateItems} disabled={!aiDesc.trim() || aiLoading}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                                    {aiLoading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                            {aiSuggestions.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {aiSuggestions.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700 px-3 py-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.description}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{s.quantity} × {formatCurrency(s.unitPrice)} = {formatCurrency(s.quantity * s.unitPrice)}</p>
                                            </div>
                                            <button onClick={() => handleAddSuggestion(s, i)} disabled={addingIdx === i}
                                                className="ml-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap">
                                                {addingIdx === i ? 'Adding...' : 'Add'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Item Form */}
                    {showItemForm && (
                        <div className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            {itemError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{itemError}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <input value={description} onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Qty</label>
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Price</label>
                                    <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleSaveItem} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                                    {editingItemId ? 'Update' : 'Add'}
                                </button>
                                <button onClick={resetItemForm} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No line items yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit Price</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 sm:px-6 py-3 text-sm text-slate-800 dark:text-slate-200">{item.description}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">{item.quantity}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 text-right">{formatCurrency(item.lineTotal)}</td>
                                            <td className="px-4 sm:px-6 py-3 text-right">
                                                <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Payments */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Payments</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Paid: {formatCurrency(totalPaid)} of {formatCurrency(invoice.totalAmount)}</p>
                        </div>
                        <button onClick={() => { resetPaymentForm(); setShowPaymentForm(!showPaymentForm) }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            disabled={balance <= 0}>
                            {showPaymentForm ? 'Cancel' : '+ Record Payment'}
                        </button>
                    </div>

                    {showPaymentForm && (
                        <div className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            {paymentError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{paymentError}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (max {formatCurrency(balance)})</label>
                                    <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Method</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                                        <option value="">Select...</option>
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleSavePayment} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Record</button>
                                <button onClick={resetPaymentForm} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium">Cancel</button>
                            </div>
                        </div>
                    )}

                    {payments.length === 0 ? (
                        <div className="p-8 text-center"><p className="text-slate-500 dark:text-slate-400 text-sm">No payments yet.</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                            <td className="px-4 sm:px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(p.paymentDate)}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{p.paymentMethod}</td>
                                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 text-right">{formatCurrency(p.amountPaid)}</td>
                                            <td className="px-4 sm:px-6 py-3 text-right">
                                                <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Overdue Reminder Modal */}
            {showReminderModal && reminder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI-Drafted Reminder</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Copy and send via your email client</p>
                            </div>
                            <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 rounded px-3 py-2">{reminder.subject}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Body</label>
                                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 rounded px-3 py-2 font-sans">{reminder.body}</pre>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button onClick={() => { navigator.clipboard.writeText(`Subject: ${reminder.subject}\n\n${reminder.body}`) }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                Copy to Clipboard
                            </button>
                            <button onClick={handleSendEmail} disabled={emailSending}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                {emailSending ? 'Sending...' : 'Send via Email'}
                            </button>
                            <button onClick={() => setShowReminderModal(false)}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium ml-auto">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InvoiceDetailPage
