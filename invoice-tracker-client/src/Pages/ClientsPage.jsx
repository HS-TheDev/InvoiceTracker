import { useState, useEffect } from 'react'
import api from '../services/api'

function ClientsPage() {
    const [clients, setClients] = useState([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        const result = await api.get('/clients')
        setClients(result.data)
    }

    const handleSubmit = async () => {
        if (!name || !email || !phone) return

        if (editingId) {
            await api.put(`/clients/${editingId}`, { id: editingId, name, email, phone, address })
        } else {
            await api.post('/clients', { name, email, phone, address })
        }

        await fetchClients()
        resetForm()
    }

    const handleEdit = (client) => {
        setName(client.name)
        setEmail(client.email)
        setPhone(client.phone)
        setAddress(client.address)
        setEditingId(client.id)
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return
        await api.delete(`/clients/${id}`)
        await fetchClients()
    }

    const resetForm = () => {
        setName('')
        setEmail('')
        setPhone('')
        setAddress('')
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
                        <p className="text-sm text-slate-500 mt-1">{clients.length} total clients</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm) }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ Add Client'}
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-6">
                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            {editingId ? 'Edit Client' : 'New Client'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter client name"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter address"
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
                                {editingId ? 'Update Client' : 'Add Client'}
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

                {/* Clients Table */}
                {clients.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <p className="text-slate-500">No clients yet. Add your first client to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client, index) => (
                                    <tr key={client.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === clients.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{client.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{client.phone}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{client.address || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
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

export default ClientsPage