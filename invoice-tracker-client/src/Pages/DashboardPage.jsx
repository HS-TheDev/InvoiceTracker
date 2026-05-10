import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../Services/Api'
import { dashboardQuery } from '../Services/AiApi'

function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [aiQuery, setAiQuery] = useState('')
    const [aiAnswer, setAiAnswer] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState('')

    useEffect(() => { fetchDashboard() }, [])

    const fetchDashboard = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/dashboard')
            setStats(data)
        } catch {
            setError('Failed to load dashboard data. Make sure the API is running.')
        } finally {
            setLoading(false)
        }
    }

    const handleAiQuery = async () => {
        if (!aiQuery.trim()) return
        setAiLoading(true)
        setAiError('')
        setAiAnswer('')
        try {
            const { data } = await dashboardQuery(aiQuery)
            setAiAnswer(data.answer)
        } catch (err) {
            setAiError(err.response?.data?.error || 'Failed to get answer. Check your Gemini API key.')
        } finally {
            setAiLoading(false)
        }
    }

    const formatCurrency = (a) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(a)
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const getStatusLabel = (s) => ({ 1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue' }[s] || 'Unknown')
    const getStatusStyle = (s) => ({
        1: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        4: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }[s] || '')

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of your business</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {loading ? (
                    <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : stats && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <Stat label="Total Clients" value={stats.totalClients} color="text-slate-800 dark:text-slate-100" />
                            <Stat label="Total Invoices" value={stats.totalInvoices} color="text-slate-800 dark:text-slate-100" />
                            <Stat label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="text-blue-600" />
                            <Stat label="Total Collected" value={formatCurrency(stats.totalCollected)} color="text-emerald-600" />
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <Stat label="Paid" value={stats.paidInvoices} color="text-emerald-600" center />
                            <Stat label="Pending" value={stats.pendingInvoices} color="text-amber-600" center />
                            <Stat label="Overdue" value={stats.overdueInvoices} color="text-red-600" center />
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Invoices</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 5 invoices by issue date</p>
                            </div>
                            {stats.recentInvoices.length === 0 ? (
                                <div className="p-8 text-center"><p className="text-slate-500 dark:text-slate-400 text-sm">No invoices yet.</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                                <Th>Invoice #</Th><Th>Client</Th><Th>Issue Date</Th><Th>Status</Th><Th right>Amount</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentInvoices.map((invoice) => (
                                                <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                                                        <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">{invoice.invoiceNumber}</Link>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{invoice.clientName}</td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(invoice.issueDate)}</td>
                                                    <td className="px-4 sm:px-6 py-4">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>{getStatusLabel(invoice.status)}</span>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100 text-right">{formatCurrency(invoice.totalAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
                                <h2 className="text-base font-semibold text-red-700 dark:text-red-300">Overdue Invoices</h2>
                                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                    {stats.overdueInvoicesList.length} invoice{stats.overdueInvoicesList.length !== 1 ? 's' : ''} require attention
                                </p>
                            </div>
                            {stats.overdueInvoicesList.length === 0 ? (
                                <div className="p-8 text-center"><p className="text-slate-500 dark:text-slate-400 text-sm">No overdue invoices. You're all caught up!</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead>
                                            <tr className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50">
                                                <Th red>Invoice #</Th><Th red>Client</Th><Th red>Due Date</Th><Th red right>Amount</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.overdueInvoicesList.map((invoice) => (
                                                <tr key={invoice.id} className="border-b border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                                                        <Link to={`/invoices/${invoice.id}`} className="text-red-700 dark:text-red-300 hover:underline">{invoice.invoiceNumber}</Link>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm text-red-700 dark:text-red-300">{invoice.clientName}</td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm text-red-700 dark:text-red-300">{formatDate(invoice.dueDate)}</td>
                                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-red-800 dark:text-red-300 text-right">{formatCurrency(invoice.totalAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* AI Business Assistant */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                                <h2 className="text-base font-semibold text-purple-800 dark:text-purple-200">Business Assistant</h2>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Ask Gemini AI questions about your business data</p>
                            </div>
                            <div className="p-4 sm:p-6">
                                <div className="flex gap-3">
                                    <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                                        placeholder="Which clients owe the most? How much is outstanding? What's my collection rate?..."
                                        className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <button onClick={handleAiQuery} disabled={!aiQuery.trim() || aiLoading}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                                        {aiLoading ? 'Thinking...' : 'Ask AI'}
                                    </button>
                                </div>
                                {aiError && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{aiError}</p>}
                                {aiAnswer && (
                                    <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{aiAnswer}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function Stat({ label, value, color, center }) {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${center ? 'text-center' : ''}`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
    )
}

function Th({ children, right, red }) {
    const align = right ? 'text-right' : 'text-left'
    const color = red ? 'text-red-400' : 'text-slate-500 dark:text-slate-400'
    return <th className={`${align} px-4 sm:px-6 py-3 text-xs font-semibold ${color} uppercase tracking-wider`}>{children}</th>
}

export default DashboardPage
