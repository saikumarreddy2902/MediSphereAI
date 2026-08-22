'use client'
import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  CreditCard, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle2, Clock, IndianRupee, FileCheck, FileX
} from 'lucide-react'
import { mockKPIs, mockDailyRevenue, formatCurrency } from '@/lib/mock-data'

const mockBills = [
  { inv: 'INV-7801', patient: 'Rajesh Kumar',  dept: 'Cardiology',  amount: 48200, paid: 48200, status: 'PAID',      date: '20 Aug', method: 'Insurance' },
  { inv: 'INV-7802', patient: 'Priya Sharma',  dept: 'ICU',         amount: 92500, paid: 45000, status: 'PARTIAL',   date: '20 Aug', method: 'Cash+Ins'  },
  { inv: 'INV-7803', patient: 'Arjun Mehta',   dept: 'Surgery',     amount: 125000,paid: 0,     status: 'PENDING',   date: '19 Aug', method: 'Insurance' },
  { inv: 'INV-7804', patient: 'Sunita Patel',  dept: 'General',     amount: 15400, paid: 15400, status: 'PAID',      date: '19 Aug', method: 'Card'      },
  { inv: 'INV-7805', patient: 'Vikram Singh',  dept: 'Emergency',   amount: 32800, paid: 0,     status: 'PENDING',   date: '18 Aug', method: 'Pending'   },
  { inv: 'INV-7806', patient: 'Lakshmi Nair',  dept: 'Pediatric',   amount: 22100, paid: 22100, status: 'PAID',      date: '18 Aug', method: 'UPI'       },
  { inv: 'INV-7807', patient: 'Mohammed Ali',  dept: 'Cardiology',  amount: 78600, paid: 30000, status: 'PARTIAL',   date: '17 Aug', method: 'Insurance' },
  { inv: 'INV-7808', patient: 'Deepika Rao',   dept: 'Maternity',   amount: 41500, paid: 41500, status: 'PAID',      date: '17 Aug', method: 'Card'      },
]

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  PARTIAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PENDING: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const deptRevenue = [
  { dept: 'ICU',          revenue: 18400000, pct: 24.2, color: '#8b5cf6' },
  { dept: 'Surgery',      revenue: 21700000, pct: 28.6, color: '#f59e0b' },
  { dept: 'Cardiology',   revenue: 16300000, pct: 21.4, color: '#f43f5e' },
  { dept: 'Emergency',    revenue: 14100000, pct: 18.5, color: '#ef4444' },
  { dept: 'General Med',  revenue: 11300000, pct: 14.8, color: '#3b82f6' },
  { dept: 'Pediatrics',   revenue:  7000000, pct: 9.2,  color: '#10b981' },
].map(d => ({ ...d, label: formatCurrency(d.revenue) }))

const last30Revenue = mockDailyRevenue.slice(-14)

export default function BillingPage() {
  const [tab, setTab] = useState<'overview' | 'invoices' | 'trends'>('overview')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const totalBilled    = mockBills.reduce((s, b) => s + b.amount, 0)
  const totalCollected = mockBills.reduce((s, b) => s + b.paid, 0)
  const pending        = mockBills.reduce((s, b) => s + (b.amount - b.paid), 0)
  const collectionRate = Math.round((totalCollected / totalBilled) * 100)
  const pendingCount   = mockBills.filter(b => b.status !== 'PAID').length

  const filtered = statusFilter === 'ALL' ? mockBills : mockBills.filter(b => b.status === statusFilter)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Billing &amp; Revenue Cycle</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time charge capture, claims pipeline, and revenue cycle management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
             style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          <TrendingUp size={13} /> {collectionRate}% collection rate
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Daily Revenue',      value: formatCurrency(mockKPIs.daily_revenue),  icon: <IndianRupee size={18} />,   color: '#10b981' },
          { label: 'Total Billed',       value: formatCurrency(totalBilled),              icon: <CreditCard size={18} />,    color: '#6366f1' },
          { label: 'Pending Collection', value: formatCurrency(pending),                  icon: <AlertCircle size={18} />,   color: '#ef4444' },
          { label: 'Pending Bills',      value: pendingCount,                             icon: <Clock size={18} />,         color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['overview', 'invoices', 'trends'] as const).map(t => (
          <button key={t} id={`billing-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
            style={{ background: tab === t ? 'rgba(16,185,129,0.15)' : 'transparent', color: tab === t ? '#10b981' : '#64748b', border: tab === t ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent' }}>
            {t === 'overview' ? '💰 Revenue Overview' : t === 'invoices' ? '🧾 Invoice Ledger' : '📈 Revenue Trends'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-scale-in">
          {/* Collection gauge */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Collection Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'Billed',    value: totalBilled,    color: '#6366f1', pct: 100 },
                { label: 'Collected', value: totalCollected,  color: '#10b981', pct: collectionRate },
                { label: 'Pending',   value: pending,         color: '#ef4444', pct: Math.round((pending/totalBilled)*100) },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{m.label}</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(m.value)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 text-center">
              <div className="text-4xl font-bold" style={{ color: collectionRate > 70 ? '#10b981' : '#f59e0b' }}>
                {collectionRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Overall Collection Rate</div>
            </div>
          </div>

          {/* Dept revenue breakdown */}
          <div className="xl:col-span-2 glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue by Department (This Month)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptRevenue} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis type="category" dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={80} />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>
                  {deptRevenue.map((d, i) => <rect key={i} fill={d.color} />)}
                  {deptRevenue.map((entry, i) => (
                    <Bar key={i} dataKey="revenue" fill={entry.color} radius={[0,4,4,0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Invoice Ledger */}
      {tab === 'invoices' && (
        <div className="space-y-3 animate-scale-in">
          {/* Status filter chips */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PAID', 'PARTIAL', 'PENDING'].map(s => (
              <button key={s} id={`bill-filter-${s}`} onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: statusFilter === s ? (STATUS_STYLE[s]?.bg || 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                  color: statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') : '#64748b',
                  border: `1px solid ${statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                }}>
                {s}
              </button>
            ))}
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr><th>Invoice</th><th>Patient</th><th>Department</th><th>Total Billed</th><th>Paid</th><th>Balance</th><th>Status</th><th>Date</th><th>Method</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const ss = STATUS_STYLE[b.status]
                  const balance = b.amount - b.paid
                  return (
                    <tr key={b.inv}>
                      <td className="font-mono text-indigo-400 text-xs">{b.inv}</td>
                      <td className="font-medium text-slate-100">{b.patient}</td>
                      <td className="text-slate-400 text-xs">{b.dept}</td>
                      <td className="font-semibold text-slate-200">{formatCurrency(b.amount)}</td>
                      <td className="text-emerald-400 font-semibold">{formatCurrency(b.paid)}</td>
                      <td className={balance > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'}>{balance > 0 ? formatCurrency(balance) : '—'}</td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-bold"
                              style={{ background: ss.bg, color: ss.color }}>{b.status}</span>
                      </td>
                      <td className="text-slate-400 text-xs">{b.date}</td>
                      <td className="text-slate-400 text-xs">{b.method}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Trends */}
      {tab === 'trends' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">14-Day Revenue vs Cost vs Profit</h3>
            <div className="flex gap-4 text-xs">
              {[['#10b981','Revenue'],['#ef4444','Cost'],['#6366f1','Profit']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={last30Revenue} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <defs>
                {[['rev','#10b981'],['cost','#ef4444'],['profit','#6366f1']].map(([id,color])=>(
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip
                formatter={(v: any, n: string) => [formatCurrency(v), n]}
                contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#grad-rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="cost"    name="Cost"    stroke="#ef4444" fill="url(#grad-cost)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#6366f1" fill="url(#grad-profit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
