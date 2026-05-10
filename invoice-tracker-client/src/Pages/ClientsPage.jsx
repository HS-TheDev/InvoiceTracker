import { useState, useEffect } from 'react'
import api from '../Services/Api'

function ClientsPage() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    const r = await api.get('/clients')
    setClients(r.data)
  }

  const handleSubmit = async () => {
    if (!name || !email || !phone) return alert('Name, email and phone are required.')
    if (editingId) {
      await api.put(`/clients/${editingId}`, { id: editingId, name, email, phone, address })
    } else {
      await api.post('/clients', { name, email, phone, address })
    }
    await fetchClients()
    resetForm()
  }

  const handleEdit = (c) => {
    setName(c.name); setEmail(c.email); setPhone(c.phone); setAddress(c.address || '')
    setEditingId(c.id); setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Strike this client from the register?')) return
    await api.delete(`/clients/${id}`)
    await fetchClients()
  }

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setAddress('')
    setEditingId(null); setShowForm(false)
  }

  return (
    <div>
      {/* Section header */}
      <div className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-end justify-between gap-4">
          <div>
            <div className="smallcaps text-ink-muted">Section B  ·  The Register</div>
            <h2 className="display-italic text-4xl md:text-5xl mt-1">
              Clients<span className="text-vermillion">.</span>
            </h2>
            <p className="smallcaps text-ink-muted mt-2">
              {clients.length} {clients.length === 1 ? 'name' : 'names'} on the books
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className={showForm ? 'btn btn-ghost' : 'btn'}
          >
            {showForm ? '✕ Dismiss' : '＋ Enter a client'}
          </button>
        </div>
      </div>

      {/* Form drawer */}
      {showForm && (
        <section className="border-b border-ink bg-paper-deep/40 drop">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-12 gap-6 lg:gap-10">
            <div className="col-span-12 lg:col-span-3">
              <div className="smallcaps text-ink-muted">Form 1 / B</div>
              <h3 className="display-italic text-3xl mt-1">
                {editingId ? 'Amend record.' : 'New entry.'}
              </h3>
              <p className="smallcaps text-ink-muted mt-3 leading-relaxed">
                Particulars to be entered in full. Telephone in international format where possible.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <Field label="Full name" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha Khan" />
              </Field>
              <Field label="Electronic mail" required>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firm.pk" />
              </Field>
              <Field label="Telephone" required>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 ___ _______" />
              </Field>
              <Field label="Postal address">
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
              </Field>

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-4">
                <button onClick={handleSubmit} className="btn">
                  {editingId ? '✓ Save amendment' : '✓ File client'}
                </button>
                <button onClick={resetForm} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Table — editorial */}
      <section>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          {clients.length === 0 ? (
            <Empty text="The register stands empty. File the first client above." />
          ) : (
            <div className="border-t-2 border-ink">
              <div className="hidden md:grid grid-cols-12 gap-3 py-2 border-b border-ink smallcaps text-ink-muted">
                <div className="col-span-1">№</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Mail</div>
                <div className="col-span-2">Telephone</div>
                <div className="col-span-2">Address</div>
                <div className="col-span-1 text-right">—</div>
              </div>

              {clients.map((c, i) => (
                <article
                  key={c.id}
                  className="grid grid-cols-12 gap-3 py-4 border-b border-rule-soft hover:bg-paper-deep/60 transition-colors rise"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="col-span-2 md:col-span-1 smallcaps text-ink-muted self-center">
                    {String(i + 1).padStart(3, '0')}
                  </div>
                  <div className="col-span-10 md:col-span-3 self-center">
                    <div className="font-display text-xl">{c.name}</div>
                  </div>
                  <div className="col-span-12 md:col-span-3 self-center tab text-sm text-ink-2">{c.email}</div>
                  <div className="col-span-6 md:col-span-2 self-center tab text-sm text-ink-2">{c.phone}</div>
                  <div className="col-span-6 md:col-span-2 self-center text-sm text-ink-muted italic">
                    {c.address || '—'}
                  </div>
                  <div className="col-span-12 md:col-span-1 self-center md:text-right space-x-3">
                    <button onClick={() => handleEdit(c)}    className="action-link text-ink">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="action-link text-vermillion">Strike</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="field block">
      <div className="smallcaps text-ink-muted mb-1">
        {label} {required && <span className="text-vermillion">*</span>}
      </div>
      {children}
    </label>
  )
}

function Empty({ text }) {
  return (
    <div className="border border-rule-soft border-dashed py-20 text-center smallcaps text-ink-muted">
      ◇  {text}
    </div>
  )
}

export default ClientsPage
