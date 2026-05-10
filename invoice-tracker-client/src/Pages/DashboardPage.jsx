import { useState, useEffect } from 'react'
import api from '../Services/Api'

const STATUS = {
  1: { label: 'Draft',   color: 'text-ink-muted'  },
  2: { label: 'Sent',    color: 'text-gold'       },
  3: { label: 'Paid',    color: 'text-moss'       },
  4: { label: 'Overdue', color: 'text-vermillion' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(n || 0)
}

function DashboardPage() {
  const [clients, setClients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    Promise.all([api.get('/clients'), api.get('/invoices'), api.get('/payments')])
      .then(([c, i, p]) => {
        setClients(c.data); setInvoices(i.data); setPayments(p.data)
      })
  }, [])

  const totalRevenue   = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0)
  const totalCollected = payments.reduce((s, p) => s + (p.amountPaid   || 0), 0)
  const outstanding    = Math.max(totalRevenue - totalCollected, 0)
  const collectRate    = totalRevenue ? Math.round((totalCollected / totalRevenue) * 100) : 0

  const recent   = [...invoices].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)).slice(0, 6)
  const overdue  = invoices.filter((i) => i.status === 4)

  const clientById = (id) => clients.find((c) => c.id === id)?.name || 'Unattributed'

  return (
    <div>
      {/* Section header */}
      <div className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-end justify-between gap-4">
          <div>
            <div className="smallcaps text-ink-muted">Section A  ·  Front Desk</div>
            <h2 className="display-italic text-4xl md:text-5xl mt-1">The state of the books.</h2>
          </div>
          <div className="smallcaps text-ink-muted text-right hidden md:block">
            Pulled from ledger<br/>
            at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} hrs.
          </div>
        </div>
      </div>

      {/* Hero — total revenue */}
      <section className="border-b border-ink bg-paper-deep/40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 grid grid-cols-12 gap-6 lg:gap-10">
          <div className="col-span-12 lg:col-span-8 rise" style={{ animationDelay: '0.05s' }}>
            <div className="smallcaps text-ink-muted mb-3">
              Lead story  ·  Gross revenue booked  ·  PKR
            </div>
            <div className="display font-black text-[18vw] lg:text-[12rem] tab break-all">
              {fmtMoney(totalRevenue)}
            </div>
            <div className="h-px bg-ink mt-2 sweep" style={{ animationDelay: '0.4s' }} />
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3 smallcaps text-ink-muted">
              <span>Across <span className="text-ink">{invoices.length}</span> invoices</span>
              <span>From <span className="text-ink">{clients.length}</span> clients</span>
              <span>Collected: <span className="text-moss">PKR {fmtMoney(totalCollected)}</span></span>
              <span>Rate: <span className="text-ink">{collectRate}%</span></span>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 flex flex-col">
            <Stat label="Outstanding"  value={`PKR ${fmtMoney(outstanding)}`} accent="text-vermillion" delay="0.15s" />
            <Stat label="Active Clients" value={clients.length}                 delay="0.25s" />
            <Stat label="Overdue Notices" value={overdue.length}                accent={overdue.length ? 'text-oxblood' : 'text-moss'} delay="0.35s" last />
          </aside>
        </div>
      </section>

      {/* Ticker */}
      <section className="border-b border-ink overflow-hidden bg-ink text-paper">
        <div className="py-3 marquee fade">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center gap-12 smallcaps">
              <span className="text-vermillion">●  Late edition</span>
              <span>Total receivables  PKR {fmtMoney(totalRevenue)}</span>
              <span>—</span>
              <span>Collected  PKR {fmtMoney(totalCollected)}</span>
              <span>—</span>
              <span>Outstanding  PKR {fmtMoney(outstanding)}</span>
              <span>—</span>
              <span>{clients.length} clients on file</span>
              <span>—</span>
              <span>{overdue.length} overdue</span>
              <span>—</span>
              <span>Collection rate {collectRate}%</span>
              <span className="text-vermillion">●</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent invoices — editorial spread */}
      <section className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 grid grid-cols-12 gap-6 lg:gap-10">
          <header className="col-span-12 lg:col-span-3">
            <div className="smallcaps text-ink-muted">Page 2</div>
            <h3 className="display-italic text-4xl mt-1">
              Recent<br/>filings<span className="text-vermillion">.</span>
            </h3>
            <p className="smallcaps text-ink-muted mt-4 leading-relaxed">
              The six most recent invoices to land on the desk, by date of issue.
            </p>
          </header>

          <div className="col-span-12 lg:col-span-9">
            {recent.length === 0 ? (
              <Empty text="No invoices have been filed yet." />
            ) : (
              <div className="border-t border-ink">
                {recent.map((inv, i) => {
                  const s = STATUS[inv.status] || STATUS[1]
                  return (
                    <article
                      key={inv.id}
                      className="grid grid-cols-12 gap-3 py-4 border-b border-rule-soft hover:bg-paper-deep/60 transition-colors rise"
                      style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                    >
                      <div className="col-span-2 smallcaps text-ink-muted self-center">
                        №{String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="col-span-10 md:col-span-4 self-center">
                        <div className="font-display text-xl tab">{inv.invoiceNumber}</div>
                        <div className="smallcaps text-ink-muted mt-1">{clientById(inv.clientId)}</div>
                      </div>
                      <div className="col-span-6 md:col-span-2 self-center smallcaps">
                        <div className="text-ink-muted">Issued</div>
                        <div className="text-ink mt-1">{fmtDate(inv.issueDate)}</div>
                      </div>
                      <div className="col-span-6 md:col-span-2 self-center">
                        <span className={`pill ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="col-span-12 md:col-span-2 self-center text-right">
                        <div className="font-display text-2xl tab">{fmtMoney(inv.totalAmount)}</div>
                        <div className="smallcaps text-ink-muted">PKR</div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overdue alarm — printed in oxblood */}
      <section className="bg-oxblood text-paper">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-end justify-between border-b border-paper/30 pb-4">
            <div>
              <div className="smallcaps text-paper/60">Page 3  ·  Notice of arrears</div>
              <h3 className="display-italic text-4xl md:text-5xl mt-1">
                Overdue, &amp; not forgotten.
              </h3>
            </div>
            <div className="font-display text-7xl md:text-8xl tab leading-none">
              {String(overdue.length).padStart(2, '0')}
            </div>
          </div>

          {overdue.length === 0 ? (
            <p className="smallcaps text-paper/80 mt-8">
              The slate is clean — no overdue invoices to report.  ●  An auspicious day.
            </p>
          ) : (
            <div className="mt-2">
              {overdue.map((inv) => (
                <article
                  key={inv.id}
                  className="grid grid-cols-12 gap-3 py-4 border-b border-paper/20 hover:bg-paper/5 transition-colors"
                >
                  <div className="col-span-12 md:col-span-4 self-center">
                    <div className="font-display text-xl tab">{inv.invoiceNumber}</div>
                    <div className="smallcaps text-paper/60 mt-1">{clientById(inv.clientId)}</div>
                  </div>
                  <div className="col-span-6 md:col-span-3 self-center smallcaps">
                    <div className="text-paper/60">Due</div>
                    <div className="text-paper mt-1">{fmtDate(inv.dueDate)}</div>
                  </div>
                  <div className="col-span-6 md:col-span-3 self-center smallcaps">
                    <div className="text-paper/60">Days late</div>
                    <div className="text-paper mt-1">
                      {Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate)) / 86400000))} days
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2 self-center text-right">
                    <div className="font-display text-2xl tab">{fmtMoney(inv.totalAmount)}</div>
                    <div className="smallcaps text-paper/60">PKR</div>
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

function Stat({ label, value, accent = 'text-ink', delay = '0s', last = false }) {
  return (
    <div
      className={`flex-1 py-5 border-t border-ink ${last ? 'border-b' : ''} rise`}
      style={{ animationDelay: delay }}
    >
      <div className="smallcaps text-ink-muted">{label}</div>
      <div className={`font-display text-4xl md:text-5xl tab mt-1 ${accent}`}>{value}</div>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="border border-rule-soft border-dashed py-16 text-center smallcaps text-ink-muted">
      ◇  {text}
    </div>
  )
}

export default DashboardPage
