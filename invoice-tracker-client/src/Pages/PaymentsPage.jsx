import { useState, useEffect } from 'react'
import api from '../Services/Api'

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(n || 0)
}

function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [invoiceId, setInvoiceId] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchPayments(); fetchInvoices() }, [])

  const fetchPayments = async () => setPayments((await api.get('/payments')).data)
  const fetchInvoices = async () => setInvoices((await api.get('/invoices')).data)

  const handleSubmit = async () => {
    if (!amountPaid || !paymentDate || !paymentMethod || !invoiceId)
      return alert('Invoice, method, date and amount are all required.')
    try {
      const body = { amountPaid: Number(amountPaid), paymentDate, paymentMethod, invoiceId }
      if (editingId) {
        await api.put(`/payments/${editingId}`, { id: editingId, ...body })
      } else {
        await api.post('/payments', body)
      }
      await fetchPayments()
      resetForm()
    } catch (err) {
      alert(err.response?.data || 'Something went wrong.')
    }
  }

  const handleEdit = (p) => {
    setAmountPaid(p.amountPaid)
    setPaymentDate(p.paymentDate?.split('T')[0] || '')
    setPaymentMethod(p.paymentMethod)
    setInvoiceId(p.invoiceId)
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Strike this payment from the receipts?')) return
    await api.delete(`/payments/${id}`)
    await fetchPayments()
  }

  const resetForm = () => {
    setAmountPaid(''); setPaymentDate(''); setPaymentMethod(''); setInvoiceId(0)
    setEditingId(null); setShowForm(false)
  }

  const invoiceNum = (id) => invoices.find((i) => i.id === id)?.invoiceNumber || '—'
  const totalCollected = payments.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const methodCount = (m) => payments.filter((p) => p.paymentMethod === m).length

  return (
    <div>
      {/* Section header */}
      <div className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-end justify-between gap-4">
          <div>
            <div className="smallcaps text-ink-muted">Section D  ·  Receipts &amp; remittances</div>
            <h2 className="display-italic text-4xl md:text-5xl mt-1">
              Payments<span className="text-vermillion">.</span>
            </h2>
            <p className="smallcaps text-ink-muted mt-2">{payments.length} receipts logged</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className={showForm ? 'btn btn-ghost' : 'btn'}
          >
            {showForm ? '✕ Dismiss' : '＋ Record a receipt'}
          </button>
        </div>
      </div>

      {/* Hero collected */}
      <section className="border-b border-ink bg-paper-deep/40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 grid grid-cols-12 gap-6 lg:gap-10 items-end">
          <div className="col-span-12 lg:col-span-7 rise">
            <div className="smallcaps text-ink-muted mb-2">Sum total of monies received  ·  PKR</div>
            <div className="display font-black text-[14vw] lg:text-[8rem] tab text-moss break-all">
              {fmtMoney(totalCollected)}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-px bg-ink rise" style={{ animationDelay: '0.15s' }}>
            {PAYMENT_METHODS.slice(0, 3).map((m) => (
              <div key={m} className="bg-paper p-4">
                <div className="smallcaps text-ink-muted">{m}</div>
                <div className="font-display text-3xl tab mt-1">
                  {String(methodCount(m)).padStart(2, '0')}
                </div>
              </div>
            ))}
            <div className="col-span-3 bg-paper p-4 border-t border-ink">
              <div className="flex justify-between smallcaps text-ink-muted">
                <span>Other methods</span>
                <span className="text-ink">
                  {methodCount('Online') + methodCount('Other')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form drawer */}
      {showForm && (
        <section className="border-b border-ink bg-paper-deep/40 drop">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-12 gap-6 lg:gap-10">
            <div className="col-span-12 lg:col-span-3">
              <div className="smallcaps text-ink-muted">Form 1 / D</div>
              <h3 className="display-italic text-3xl mt-1">
                {editingId ? 'Amend receipt.' : 'Log receipt.'}
              </h3>
              <p className="smallcaps text-ink-muted mt-3 leading-relaxed">
                Tied to a specific invoice. Method records the channel of remittance.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <Field label="Against invoice" required>
                <select value={invoiceId} onChange={(e) => setInvoiceId(Number(e.target.value))}>
                  <option value={0}>— Choose —</option>
                  {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber}</option>)}
                </select>
              </Field>
              <Field label="Method" required>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="">— Choose —</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Received on" required>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </Field>
              <Field label="Amount, PKR" required>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
              </Field>

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-4">
                <button onClick={handleSubmit} className="btn">
                  {editingId ? '✓ Save amendment' : '✓ Log receipt'}
                </button>
                <button onClick={resetForm} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Receipt log */}
      <section>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          {payments.length === 0 ? (
            <Empty text="No receipts on the desk yet — log the first one above." />
          ) : (
            <div className="border-t-2 border-ink">
              <div className="hidden md:grid grid-cols-12 gap-3 py-2 border-b border-ink smallcaps text-ink-muted">
                <div className="col-span-1">№</div>
                <div className="col-span-3">Against</div>
                <div className="col-span-3">Received</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-right">—</div>
              </div>

              {payments.map((p, i) => (
                <article
                  key={p.id}
                  className="grid grid-cols-12 gap-3 py-4 border-b border-rule-soft hover:bg-paper-deep/60 transition-colors rise"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="col-span-2 md:col-span-1 smallcaps text-ink-muted self-center">
                    {String(i + 1).padStart(3, '0')}
                  </div>
                  <div className="col-span-10 md:col-span-3 self-center">
                    <div className="font-display text-xl tab">{invoiceNum(p.invoiceId)}</div>
                  </div>
                  <div className="col-span-6 md:col-span-3 self-center tab text-sm">{fmtDate(p.paymentDate)}</div>
                  <div className="col-span-6 md:col-span-2 self-center smallcaps text-ink-2">{p.paymentMethod}</div>
                  <div className="col-span-6 md:col-span-2 self-center text-right">
                    <span className="font-display text-xl tab text-moss">{fmtMoney(p.amountPaid)}</span>
                    <span className="smallcaps text-ink-muted ml-1">PKR</span>
                  </div>
                  <div className="col-span-6 md:col-span-1 self-center md:text-right space-x-3">
                    <button onClick={() => handleEdit(p)}     className="action-link text-ink">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="action-link text-vermillion">Strike</button>
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

export default PaymentsPage
