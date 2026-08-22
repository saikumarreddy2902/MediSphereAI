'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts'
import {
  Pill, AlertTriangle, CheckCircle2, PackageX,
  RefreshCw, TrendingDown, Clock, Search, ShoppingCart
} from 'lucide-react'
import { mockPharmacyInventory, getStatusColor, formatCurrency } from '@/lib/mock-data'

// ─── Consumption Forecast (7-day rolling) ─────────────────────────
const mockConsumptionTrend = Array.from({ length: 7 }, (_, i) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return {
    day: days[i],
    dispensed: Math.floor(280 + Math.random() * 120),
    prescribed: Math.floor(300 + Math.random() * 130),
  }
})

const mockDispenseLogs = [
  { id: 'D-1001', time: '15:42', medicine: 'Paracetamol 500mg',        qty: 20,  ward: 'General',  nurse: 'Anjali Rao',  patient: 'P-0043' },
  { id: 'D-1002', time: '15:38', medicine: 'Ceftriaxone 1g Injection', qty: 2,   ward: 'ICU',      nurse: 'Kavitha N',   patient: 'P-0041' },
  { id: 'D-1003', time: '15:30', medicine: 'Morphine 10mg Injection',  qty: 1,   ward: 'Surgery',  nurse: 'Deepa S',     patient: 'P-0049' },
  { id: 'D-1004', time: '15:22', medicine: 'Insulin Regular 100IU',    qty: 4,   ward: 'General',  nurse: 'Preethi K',   patient: 'P-0045' },
  { id: 'D-1005', time: '15:10', medicine: 'Omeprazole 20mg',          qty: 10,  ward: 'Cardiology',nurse: 'Rahul G',    patient: 'P-0046' },
  { id: 'D-1006', time: '14:58', medicine: 'Amoxicillin 250mg',        qty: 15,  ward: 'Pediatric',nurse: 'Anjali Rao',  patient: 'P-0050' },
]

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ok:       { label: 'OK',       icon: <CheckCircle2 size={12} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  low:      { label: 'Low',      icon: <TrendingDown size={12} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  critical: { label: 'Critical', icon: <AlertTriangle size={12}/>, color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}
const EXPIRY_LABEL: Record<string, { color: string; bg: string }> = {
  ok:       { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
}

export default function PharmacyPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'critical'>('all')
  const [tab, setTab] = useState<'inventory' | 'dispense' | 'trends'>('inventory')

  const totalItems    = mockPharmacyInventory.length
  const criticalItems = mockPharmacyInventory.filter(m => m.status === 'critical').length
  const lowItems      = mockPharmacyInventory.filter(m => m.status === 'low').length
  const expiryAlerts  = mockPharmacyInventory.filter(m => m.expiry_status !== 'ok').length

  const filtered = mockPharmacyInventory.filter(m => {
    const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || m.status === statusFilter
    return matchSearch && matchStatus
  })

  const stockBarData = ['Analgesic', 'Antibiotic', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Steroid', 'Antacid', 'Anticoagulant'].map(cat => ({
    category: cat.replace('cardiovascular', 'Cardiac'),
    items: mockPharmacyInventory.filter(m => m.category.toLowerCase() === cat.toLowerCase()).length,
    stock: mockPharmacyInventory.filter(m => m.category.toLowerCase() === cat.toLowerCase()).reduce((s, m) => s + m.current_stock, 0),
  })).filter(d => d.items > 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Pharmacy Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time medicine inventory, expiry surveillance, and dispense tracking</p>
        </div>
        {(criticalItems > 0 || lowItems > 0) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold animate-pulse"
               style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={13} /> {criticalItems} critical · {lowItems} low stock alerts
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total SKUs Tracked', value: totalItems,    icon: <Pill size={18} />,         color: '#6366f1' },
          { label: 'Critical Stock',     value: criticalItems, icon: <PackageX size={18} />,      color: '#ef4444' },
          { label: 'Low Stock',          value: lowItems,      icon: <TrendingDown size={18} />,  color: '#f59e0b' },
          { label: 'Expiry Alerts',      value: expiryAlerts,  icon: <Clock size={18} />,         color: '#f97316' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Critical Alert Banner */}
      {criticalItems > 0 && (
        <div className="glass-card p-4 border-l-4 border-red-500 animate-scale-in"
             style={{ background: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Critical Stock Alert — Immediate Action Required</p>
              <p className="text-xs text-slate-400 mt-1">
                {mockPharmacyInventory.filter(m => m.status === 'critical').map(m => m.name).join(' · ')}
              </p>
            </div>
            <button id="pharmacy-reorder-btn" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              <ShoppingCart size={12} /> Initiate Reorder
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['inventory', 'dispense', 'trends'] as const).map(t => (
          <button key={t} id={`pharmacy-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(139,92,246,0.2)' : 'transparent', color: tab === t ? '#a78bfa' : '#64748b', border: tab === t ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent' }}>
            {t === 'inventory' ? '📦 Inventory' : t === 'dispense' ? '🧾 Dispense Log' : '📈 Consumption Trends'}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-3 animate-scale-in">
          {/* Search + filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="pharmacy-search" type="text" placeholder="Search medicine or category…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'ok', 'low', 'critical'] as const).map(s => {
                const st = STATUS_LABEL[s] || { label: 'All', color: '#818cf8', bg: 'rgba(99,102,241,0.15)' }
                return (
                  <button key={s} id={`pharmacy-filter-${s}`} onClick={() => setStatusFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={{
                      background: statusFilter === s ? (s === 'all' ? 'rgba(99,102,241,0.15)' : st.bg) : 'rgba(255,255,255,0.04)',
                      color: statusFilter === s ? (s === 'all' ? '#818cf8' : st.color) : '#64748b',
                      border: `1px solid ${statusFilter === s ? (s === 'all' ? 'rgba(99,102,241,0.3)' : st.color + '40') : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    {s === 'all' ? 'All' : st.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Medicine</th><th>Category</th>
                    <th>Stock</th><th>Minimum</th><th>Stock Status</th>
                    <th>Expiry (Days)</th><th>Expiry Status</th>
                    <th>Unit Cost</th><th>Monthly Use</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const ss = STATUS_LABEL[m.status]
                    const es = EXPIRY_LABEL[m.expiry_status]
                    const stockPct = Math.min(100, Math.round((m.current_stock / Math.max(m.min * 2, 1)) * 100))
                    return (
                      <tr key={m.code}>
                        <td className="font-mono text-xs text-indigo-400">{m.code}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                 style={{ background: `${ss.color}15` }}>
                              <Pill size={12} style={{ color: ss.color }} />
                            </div>
                            <span className="font-medium text-slate-100 text-xs">{m.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded font-medium text-slate-400"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>{m.category}</span>
                        </td>
                        <td>
                          <div>
                            <span className={`font-bold text-sm ${m.status === 'critical' ? 'text-red-400' : m.status === 'low' ? 'text-amber-400' : 'text-slate-200'}`}>
                              {m.current_stock.toLocaleString()}
                            </span>
                            <div className="progress-bar mt-1 w-20">
                              <div className="progress-fill" style={{ width: `${stockPct}%`, background: ss.color }} />
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-400 text-xs">{m.min.toLocaleString()}</td>
                        <td>
                          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                                style={{ background: ss.bg, color: ss.color }}>
                            {ss.icon} {ss.label}
                          </span>
                        </td>
                        <td className={`font-mono text-sm ${m.expiry_status === 'critical' ? 'text-red-400 font-bold' : m.expiry_status === 'warning' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {m.expiry_days}d
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded font-medium capitalize"
                                style={{ background: es.bg, color: es.color }}>
                            {m.expiry_status === 'ok' ? 'Valid' : m.expiry_status === 'warning' ? '⚠ Soon' : '🔴 Critical'}
                          </span>
                        </td>
                        <td className="text-slate-300 text-xs font-mono">₹{m.unit_cost}</td>
                        <td className="text-slate-400 text-xs">{m.monthly_consumption}/mo</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Log */}
      {tab === 'dispense' && (
        <div className="glass-card overflow-hidden animate-scale-in">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Today's Dispense Log</h3>
            <span className="text-xs text-slate-500">{mockDispenseLogs.length} entries today</span>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Ref</th><th>Time</th><th>Medicine</th><th>Qty</th><th>Ward</th><th>Dispensed By</th><th>Patient</th></tr>
            </thead>
            <tbody>
              {mockDispenseLogs.map(d => (
                <tr key={d.id}>
                  <td className="font-mono text-xs text-purple-400">{d.id}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-slate-400"><Clock size={10}/> {d.time}</div>
                  </td>
                  <td className="font-medium text-slate-100 text-xs">{d.medicine}</td>
                  <td className="text-indigo-400 font-bold">{d.qty}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{d.ward}</span>
                  </td>
                  <td className="text-slate-400 text-xs">{d.nurse}</td>
                  <td className="font-mono text-xs text-slate-500">{d.patient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trends */}
      {tab === 'trends' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-scale-in">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">7-Day Dispense vs Prescription Volume</h3>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={mockConsumptionTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  {[['dis','#8b5cf6'],['pre','#10b981']].map(([id,c]) => (
                    <linearGradient key={id} id={`ph-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="dispensed"  name="Dispensed"   stroke="#8b5cf6" fill="url(#ph-dis)" strokeWidth={2} />
                <Area type="monotone" dataKey="prescribed" name="Prescribed"  stroke="#10b981" fill="url(#ph-pre)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Stock by Category</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stockBarData} margin={{ top: 5, right: 10, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="stock" name="Total Stock" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
