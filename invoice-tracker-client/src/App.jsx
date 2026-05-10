import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ClientsPage from './Pages/ClientsPage'
import InvoicesPage from './Pages/InvoicesPage'
import PaymentsPage from './Pages/PaymentsPage'
import DashboardPage from './Pages/DashboardPage'

const SECTIONS = [
  { path: '/',         label: 'Front Desk', short: 'A1' },
  { path: '/clients',  label: 'Clients',    short: 'B1' },
  { path: '/invoices', label: 'Invoices',   short: 'C1' },
  { path: '/payments', label: 'Payments',   short: 'D1' },
]

function Masthead() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase()

  return (
    <header className="relative z-10 border-b border-ink bg-paper">
      {/* Top metadata strip */}
      <div className="border-b border-rule-soft">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-2 flex items-center justify-between smallcaps text-ink-muted gap-4">
          <span className="hidden sm:inline">Vol. I  ·  №. 0001  ·  Est. 2026</span>
          <span className="text-center flex-1 sm:flex-none">{today}</span>
          <span className="hidden sm:inline">Karachi  ·  Daily</span>
        </div>
      </div>

      {/* Wordmark */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-7 pb-5 grid grid-cols-12 items-end gap-4">
        <div className="hidden lg:block col-span-2 smallcaps text-ink-muted leading-[1.6]">
          <div>The daily</div>
          <div>chronicle of</div>
          <div>receivables —</div>
          <div className="text-vermillion">in good faith.</div>
        </div>

        <h1 className="col-span-12 lg:col-span-8 text-center display-italic font-black text-[20vw] lg:text-[180px] leading-[0.82]">
          Ledger<span className="text-vermillion not-italic">.</span>
        </h1>

        <div className="hidden lg:block col-span-2 smallcaps text-ink-muted leading-[1.6] text-right">
          <div>An editorial</div>
          <div>system for</div>
          <div>invoicing &amp;</div>
          <div className="text-vermillion">collecting dues.</div>
        </div>
      </div>

      {/* Section nav — newspaper rail */}
      <nav className="border-t border-ink">
        <div className="max-w-[1400px] mx-auto flex items-stretch">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.path}
              to={s.path}
              end={s.path === '/'}
              className={({ isActive }) =>
                `relative flex-1 text-center py-3 px-2 smallcaps-lg transition-colors duration-200 border-r last:border-r-0 border-rule-soft ` +
                (isActive
                  ? 'bg-ink text-paper'
                  : 'text-ink hover:text-vermillion hover:bg-paper-deep')
              }
            >
              {({ isActive }) => (
                <span className="inline-flex items-baseline gap-2">
                  <span className="opacity-60 text-[9px]">§{s.short}</span>
                  <span>{s.label}</span>
                  {isActive && <span className="text-vermillion">●</span>}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-ink mt-16 bg-paper">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <div className="display-italic text-4xl">
            Ledger<span className="text-vermillion not-italic">.</span>
          </div>
          <p className="smallcaps text-ink-muted mt-3 max-w-md leading-relaxed">
            Set in Fraunces, Plus Jakarta Sans &amp; JetBrains Mono.
            Printed daily on warm cream stock. Copy fit for purpose.
          </p>
        </div>
        <div className="col-span-6 md:col-span-3 smallcaps text-ink-muted leading-[2]">
          <div className="text-ink mb-2">Sections</div>
          <div>A — Front Desk</div>
          <div>B — Clients</div>
          <div>C — Invoices</div>
          <div>D — Payments</div>
        </div>
        <div className="col-span-6 md:col-span-3 smallcaps text-ink-muted leading-[2] text-right md:text-left">
          <div className="text-ink mb-2">Colophon</div>
          <div>Vol. I, №. 0001</div>
          <div>{new Date().getFullYear()} edition</div>
          <div className="text-vermillion">All rights observed.</div>
        </div>
      </div>
      <div className="border-t border-rule-soft">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-3 smallcaps text-ink-muted text-center">
          — End of Page —
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Masthead />
        <main className="relative z-10 flex-1">
          <Routes>
            <Route path="/"         element={<DashboardPage />} />
            <Route path="/clients"  element={<ClientsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
