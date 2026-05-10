import { useState, useEffect } from 'react'
import api from '../Services/Api'
import { exportToCsv } from '../Utils/csvExport'
import { useUnsavedChanges } from '../Hooks/useUnsavedChanges'
import { getClientRisk } from '../Services/AiApi'

const TAKE = 10

function RiskBadge({ level }) {
    const styles = {
        Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] || styles.Medium}`}>{level} Risk</span>
}

function ClientsPage() {
    const [clients, setClients] = useState([])
    const [total, setTotal] = useState(0)
    const [skip, setSkip] = useState(0)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formError, setFormError] = useState('')
    const [dirty, setDirty] = useState(false)

    const [riskModal, setRiskModal] = useState(null)
    const [riskLoading, setRiskLoading] = useState(false)

    useUnsavedChanges(dirty)

    useEffect(() => { fetchClients() }, [search, skip])

    const fetchClients = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/clients', { params: { search: search || undefined, skip, take: TAKE } })
            setClients(data.items)
            setTotal(data.total)
        } catch {
            setError('Failed to load clients. Make sure the API is running.')
        } finally {
            setLoading(false)
        }
    }

    const markDirty = (setter) => (val) => { setter(val); setDirty(true) }
    const handleSearchChange = (val) => { setSearch(val); setSkip(0) }

    const handleSubmit = async () => {
        if (!name || !email || !phone) { setFormError('Name, email, and phone are required.'); return }
        setFormError('')
        try {
            if (editingId) {
                await api.put(`/clients/${editingId}`, { id: editingId, name, email, phone, address })
            } else {
                await api.post('/clients', { name, email, phone, address })
            }
            setDirty(false)
            await fetchClients()
            resetForm()
        } catch (err) {
            setFormError(err.response?.data?.title || err.response?.data || 'Failed to save client.')
        }
    }

    const handleEdit = (client) => {
        setName(client.name); setEmail(client.email); setPhone(client.phone); setAddress(client.address)
        setEditingId(client.id); setFormError(''); setShowForm(true); setDirty(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return
        try {
            await api.delete(`/clients/${id}`)
            await fetchClients()
        } catch (err) {
            setError(err.response?.status === 403 ? 'Only admins can delete.' : 'Failed to delete client.')
        }
    }

    const handleRiskScore = async (client) => {
        setRiskLoading(true)
        setRiskModal({ client, data: null })
        try {
            const { data } = await getClientRisk(client.id)
            setRiskModal({ client, data })
        } catch (err) {
            setRiskModal({ client, error: err.response?.data?.error || 'Failed to get risk score. Check your Gemini API key.' })
        } finally {
            setRiskLoading(false)
        }
    }

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setAddress('')
        setEditingId(null); setFormError(''); setShowForm(false); setDirty(false)
    }

    const handleExport = async () => {
        try {
            const { data } = await api.get('/clients', { params: { take: 0 } })
            exportToCsv('clients.csv', data.items, [
                { label: 'Name', value: 'name' },
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone' },
                { label: 'Address', value: 'address' },
            ])
        } catch { setError('Failed to export clients.') }
    }

    const totalPages = Math.ceil(total / TAKE)
    const currentPage = Math.floor(skip / TAKE) + 1
    const inputCls = "w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clients</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} total clients</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Export CSV
                        </button>
                        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            {showForm ? 'Cancel' : '+ Add Client'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
                )}

                {showForm && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{editingId ? 'Edit Client' : 'New Client'}</h2>
                        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">{formError}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                                <input value={name} onChange={(e) => markDirty(setName)(e.target.value)} placeholder="Enter client name" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                <input type="email" value={email} onChange={(e) => markDirty(setEmail)(e.target.value)} placeholder="Enter email address" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                <input value={phone} onChange={(e) => markDirty(setPhone)(e.target.value)} placeholder="Enter phone number" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                <input value={address} onChange={(e) => markDirty(setAddress)(e.target.value)} placeholder="Enter address" className={inputCls} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">{editingId ? 'Update Client' : 'Add Client'}</button>
                            <button onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-lg text-sm font-medium">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by name or email..."
                        className="w-full md:w-80 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : clients.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">{search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                                            <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                                            <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((client) => (
                                            <tr key={client.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{client.name}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{client.email}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{client.phone}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{client.address || '—'}</td>
                                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                                    <button onClick={() => handleRiskScore(client)} className="text-purple-600 hover:text-purple-800 text-sm font-medium mr-3">Risk Score</button>
                                                    <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                                                    <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
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
                                    <button disabled={skip === 0} onClick={() => setSkip(s => s - TAKE)}
                                        className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700">Previous</button>
                                    <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">{currentPage} / {totalPages}</span>
                                    <button disabled={skip + TAKE >= total} onClick={() => setSkip(s => s + TAKE)}
                                        className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Risk Score Modal */}
            {riskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI Risk Score</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{riskModal.client.name}</p>
                            </div>
                            <button onClick={() => setRiskModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">×</button>
                        </div>
                        <div className="px-6 py-5">
                            {riskLoading && !riskModal.data && !riskModal.error && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                                    <span className="ml-3 text-sm text-slate-500">Analyzing payment history...</span>
                                </div>
                            )}
                            {riskModal.error && <p className="text-red-600 dark:text-red-400 text-sm">{riskModal.error}</p>}
                            {riskModal.data && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Risk Level</span>
                                        <RiskBadge level={riskModal.data.level} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Trust Score</span>
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{riskModal.data.score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all ${riskModal.data.score >= 70 ? 'bg-emerald-500' : riskModal.data.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${riskModal.data.score}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{riskModal.data.summary}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-4 flex justify-end">
                            <button onClick={() => setRiskModal(null)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClientsPage
