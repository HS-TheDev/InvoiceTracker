import { useState, useEffect } from 'react'
import api from '../Services/Api'

const STATUS = {
  1: { label: 'Draft',   color: 'text-ink-muted',  pillColor: 'text-ink-muted'  },
  2: { label: 'Sent',    color: 'text-gold',       pillColor: 'text-gold'       },
  3: { label: 'Paid',    color: 'text-moss',       pillColor: 'text-moss'       },
  4: { label: 'Overdue', color: 'text-vermillion', pillColor: 'text-vermillion' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(n || 0)
}

function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState(1)
  const [clientId, setClientId] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchInvoices(); fetchClients() }, [])

  const fetchInvoices = async () => setInvoices((await api.get('/invoices')).data)
  const fetchClients  = async () => setClients ((await api.get('/clients' )).data)

  const handleSubmit = async () => {
    if (!issueDate || !dueDate || !totalAmount || !clientId)
      return alert('Client, dates, and amount are all required.')
    const body = { issueDate, dueDate, totalAmount: Number(totalAmount), status, clientId }
    if (editingId) {
      await api.put(`/invoices/${editingId}`, { id: editingId, ...body })
    } else {
      await api.post('/invoices', body)
    }
    await fetchInvoices()
    resetForm()
  }

  const handleEdit = (inv) => {
    setIssueDate(inv.issueDate?.split('T')[0] || '')
    setDueDate(inv.dueDate?.split('T')[0] || '')
    setTotalAmount(inv.totalAmount)
    setStatus(inv.status)
    setClientId(inv.clientId)
    setEditingId(inv.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Void this invoice?')) return
    await api.delete(`/invoices/${id}`)
    await fetchInvoices()
  }

  const resetForm = () => {
    setIssueDate(''); setDueDate(''); setTotalAmount(''); setStatus(1); setClientId(0)
    setEditingId(null); setShowForm(false)
  }

  const clientById = (id) => clients.find((c) => c.id === id)?.name || '—'

  const counts = {
    total:   invoices.length,
    paid:    invoices.filter((i) => i.status === 3).length,
    pending: invoices.filter((i) => i.status === 1 || i.status === 2).length,
    overdue: invoices.filter((i) => i.status === 4).length,
  }

  return (
    <div>
      {/* Section header */}
      <div className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-end justify-between gap-4">
          <div>
            <div className="smallcaps text-ink-muted">Section C  ·  Statements of account</div>
            <h2 className="display-italic text-4xl md:text-5xl mt-1">
              Invoices<span className="text-vermillion">.</span>
            </h2>
            <p className="smallcaps text-ink-muted mt-2">{counts.total} statements on file</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className={showForm ? 'btn btn-ghost' : 'btn'}
          >
            {showForm ? '✕ Dismiss' : '＋ Draw an invoice'}
          </button>
        </div>
      </div>

      {/* Counters strip */}
      <section className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-rule-soft">
          <Counter label="Total"   value={counts.total} />
          <Counter label="Paid"    value={counts.paid}    accent="text-moss" />
          <Counter label="Pending" value={counts.pending} accent="text-gold" />
          <Counter label="Overdue" value={counts.overdue} accent="text-vermillion" />
        </div>
      </section>

      {/* Form drawer */}
      {showForm && (
        <section className="border-b border-ink bg-paper-deep/40 drop">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-12 gap-6 lg:gap-10">
            <div className="col-span-12 lg:col-span-3">
              <div className="smallcaps text-ink-muted">Form 1 / C</div>
              <h3 className="display-italic text-3xl mt-1">
                {editingId ? 'Amend statement.' : 'Draw a statement.'}
              </h3>
              <p className="smallcaps text-ink-muted mt-3 leading-relaxed">
                Number is auto-assigned. Status governs colour in the register.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
              <Field label="Client" required>
                <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
                  <option value={0}>— Choose —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(Number(e.target.value))}>
                  <option value={1}>Draft</option>
                  <option value={2}>Sent</option>
                  <option value={3}>Paid</option>
                  <option value={4}>Overdue</option>
                </select>
              </Field>
              <Field label="Amount, PKR" required>
                <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Issued on" required>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </Field>
              <Field label="Due on" required>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
              <div className="hidden md:block" />

              <div className="md:col-span-3 flex flex-wrap gap-3 pt-4">
                <button onClick={handleSubmit} className="btn">
                  {editingId ? '✓ Save amendment' : '✓ Draw invoice'}
                </button>
                <button onClick={resetForm} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Register */}
      <section>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          {invoices.length === 0 ? (
            <Empty text="No statements drawn yet — the ledger awaits its first entry." />
          ) : (
            <div className="border-t-2 border-ink">
              <div className="hidden md:grid grid-cols-12 gap-3 py-2 border-b border-ink smallcaps text-ink-muted">
                <div className="col-span-2">Number</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Issued</div>
                <div className="col-span-2">Due</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-right">—</div>
              </div>

              {invoices.map((inv, i) => {
                const s = STATUS[inv.status] || STATUS[1]
                return (
                  <article
                    key={inv.id}
                    className="grid grid-cols-12 gap-3 py-4 border-b border-rule-soft hover:bg-paper-deep/60 transition-colors rise"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="col-span-12 md:col-span-2 self-center">
                      <div className="font-display text-xl tab">{inv.invoiceNumber}</div>
                    </div>
                    <div className="col-span-12 md:col-span-3 self-center">
                      <div className="text-ink">{clientById(inv.clientId)}</div>
                    </div>
                    <div className="col-span-6 md:col-span-2 self-center smallcaps">
                      <span className="md:hidden text-ink-muted">Issued · </span>
                      <span className="tab">{fmtDate(inv.issueDate)}</span>
                    </div>
                    <div className="col-span-6 md:col-span-2 self-center smallcaps">
                      <span className="md:hidden text-ink-muted">Due · </span>
                      <span className="tab">{fmtDate(inv.dueDate)}</span>
                    </div>
                    <div className="col-span-6 md:col-span-1 self-center">
                      <span className={`pill ${s.pillColor}`}>{s.label}</span>
                    </div>
                    <div className="col-span-6 md:col-span-1 self-center text-right">
                      <div className="font-display text-xl tab">{fmtMoney(inv.totalAmount)}</div>
                    </div>
                    <div className="col-span-12 md:col-span-1 self-center md:text-right space-x-3">
                      <button onClick={() => handleEdit(inv)}     className="action-link text-ink">Edit</button>
                      <button onClick={() => handleDelete(inv.id)} className="action-link text-vermillion">Void</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Counter({ label, value, accent = 'text-ink' }) {
  return (
    <div className="px-6 py-5">
      <div className="smallcaps text-ink-muted">{label}</div>
      <div className={`font-display text-4xl tab mt-1 ${accent}`}>{String(value).padStart(2, '0')}</div>
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

export default InvoicesPage
