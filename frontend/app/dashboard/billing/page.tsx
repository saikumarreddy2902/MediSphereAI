'use client'
import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  CreditCard, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle2, Clock, IndianRupee, FileCheck, FileX,
  Pill, Shield, Eye, FileText, UserCheck, Stethoscope, ChevronRight, X, Printer
} from 'lucide-react'
import { mockKPIs, mockDailyRevenue, formatCurrency } from '@/lib/mock-data'
import { useAuthStore } from '@/store/useAuthStore'
import { printInvoiceDocument } from '@/lib/print-document'


interface BilledMedicine {
  name: string
  dosage: string
  qty: number
  unit_price: number
  total: number
}

interface BillRecord {
  inv: string
  patient: string
  patient_id: string
  dept: string
  amount: number
  paid: number
  status: 'PAID' | 'PARTIAL' | 'PENDING'
  date: string
  method: string
  consultation_fee: number
  bed_charges: number
  lab_charges: number
  medicines_billed: BilledMedicine[]
}

const mockBillsWithMedicines: BillRecord[] = [
  {
    inv: 'INV-7801',
    patient: 'Rajesh Kumar',
    patient_id: 'P-0041',
    dept: 'Cardiology',
    amount: 48200,
    paid: 48200,
    status: 'PAID',
    date: '20 Aug 2026',
    method: 'Insurance (Star Health)',
    consultation_fee: 1500,
    bed_charges: 32000,
    lab_charges: 8500,
    medicines_billed: [
      { name: 'Atenolol', dosage: '50mg', qty: 30, unit_price: 12.00, total: 360 },
      { name: 'Amlodipine', dosage: '5mg', qty: 30, unit_price: 15.00, total: 450 },
      { name: 'Warfarin', dosage: '5mg', qty: 60, unit_price: 18.00, total: 1080 },
      { name: 'Furosemide', dosage: '40mg', qty: 30, unit_price: 8.00, total: 240 },
      { name: 'Morphine 10mg Inj', dosage: '10mg', qty: 4, unit_price: 35.00, total: 140 },
    ]
  },
  {
    inv: 'INV-7802',
    patient: 'Priya Sharma',
    patient_id: 'P-0042',
    dept: 'ICU',
    amount: 92500,
    paid: 45000,
    status: 'PARTIAL',
    date: '20 Aug 2026',
    method: 'Cash + Ins (HDFC ERGO)',
    consultation_fee: 2500,
    bed_charges: 70000,
    lab_charges: 14200,
    medicines_billed: [
      { name: 'Ceftriaxone 1g Injection', dosage: '1g IV', qty: 14, unit_price: 45.00, total: 630 },
      { name: 'Vancomycin 500mg', dosage: '500mg IV', qty: 10, unit_price: 180.00, total: 1800 },
      { name: 'Dexamethasone', dosage: '4mg IV', qty: 8, unit_price: 22.00, total: 176 },
      { name: 'Pantoprazole', dosage: '40mg', qty: 14, unit_price: 14.00, total: 196 },
    ]
  },
  {
    inv: 'INV-7803',
    patient: 'Arjun Mehta',
    patient_id: 'P-0043',
    dept: 'Surgery',
    amount: 125000,
    paid: 0,
    status: 'PENDING',
    date: '19 Aug 2026',
    method: 'Pending Insurance Auth',
    consultation_fee: 3000,
    bed_charges: 95000,
    lab_charges: 18500,
    medicines_billed: [
      { name: 'Amoxicillin + Clavulanic Acid', dosage: '625mg', qty: 20, unit_price: 28.00, total: 560 },
      { name: 'Ondansetron 4mg', dosage: '4mg IV', qty: 6, unit_price: 12.00, total: 72 },
      { name: 'Paracetamol 500mg IV', dosage: '100ml IV', qty: 6, unit_price: 45.00, total: 270 },
      { name: 'Tramadol 50mg Inj', dosage: '50mg', qty: 4, unit_price: 32.00, total: 128 },
    ]
  },
  {
    inv: 'INV-7804',
    patient: 'Sunita Patel',
    patient_id: 'P-0044',
    dept: 'General',
    amount: 15400,
    paid: 15400,
    status: 'PAID',
    date: '19 Aug 2026',
    method: 'Credit Card',
    consultation_fee: 800,
    bed_charges: 9000,
    lab_charges: 3200,
    medicines_billed: [
      { name: 'Paracetamol 500mg', dosage: '500mg', qty: 20, unit_price: 2.50, total: 50 },
      { name: 'Metformin 500mg', dosage: '500mg', qty: 60, unit_price: 5.50, total: 330 },
      { name: 'Omeprazole 20mg', dosage: '20mg', qty: 30, unit_price: 7.00, total: 210 },
    ]
  },
  {
    inv: 'INV-7805',
    patient: 'Vikram Singh',
    patient_id: 'P-0045',
    dept: 'Emergency',
    amount: 32800,
    paid: 0,
    status: 'PENDING',
    date: '18 Aug 2026',
    method: 'Direct Billing / Pending',
    consultation_fee: 1200,
    bed_charges: 24000,
    lab_charges: 5500,
    medicines_billed: [
      { name: 'Insulin Regular 100IU', dosage: '100IU/ml', qty: 2, unit_price: 120.00, total: 240 },
      { name: 'Salbutamol Inhaler', dosage: '100mcg', qty: 1, unit_price: 25.00, total: 25 },
      { name: 'Normal Saline 500ml', dosage: '500ml IV', qty: 6, unit_price: 45.00, total: 270 },
    ]
  },
  {
    inv: 'INV-7806',
    patient: 'Lakshmi Nair',
    patient_id: 'P-0046',
    dept: 'Pediatric',
    amount: 22100,
    paid: 22100,
    status: 'PAID',
    date: '18 Aug 2026',
    method: 'UPI / Google Pay',
    consultation_fee: 900,
    bed_charges: 16000,
    lab_charges: 3800,
    medicines_billed: [
      { name: 'Amoxicillin 250mg Syrup', dosage: '250mg/5ml', qty: 2, unit_price: 65.00, total: 130 },
      { name: 'Paracetamol Drops', dosage: '100mg/ml', qty: 1, unit_price: 35.00, total: 35 },
      { name: 'Cetirizine Syrup', dosage: '5mg/5ml', qty: 1, unit_price: 45.00, total: 45 },
    ]
  },
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
  const { user } = useAuthStore()
  
  // Real check: user is admin if their role includes 'admin' or 'hospital_admin'
  const isUserAdmin = user?.roles?.some(r => r.toLowerCase().includes('admin')) ?? true
  // Role view toggle (to test Administrator vs Patient View)
  const [activeRoleView, setActiveRoleView] = useState<'admin' | 'patient'>(isUserAdmin ? 'admin' : 'patient')

  const [tab, setTab] = useState<'overview' | 'invoices' | 'trends'>('invoices')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedInvoice, setSelectedInvoice] = useState<BillRecord | null>(null)
  const [search, setSearch] = useState('')

  const isAdmin = activeRoleView === 'admin'

  // Admin macro totals
  const totalBilled    = mockBillsWithMedicines.reduce((s, b) => s + b.amount, 0)
  const totalCollected = mockBillsWithMedicines.reduce((s, b) => s + b.paid, 0)
  const pending        = mockBillsWithMedicines.reduce((s, b) => s + (b.amount - b.paid), 0)
  const collectionRate = Math.round((totalCollected / totalBilled) * 100)
  const pendingCount   = mockBillsWithMedicines.filter(b => b.status !== 'PAID').length

  const filtered = mockBillsWithMedicines.filter(b => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter
    const matchSearch = search === '' || b.patient.toLowerCase().includes(search.toLowerCase()) || b.inv.toLowerCase().includes(search.toLowerCase()) || b.dept.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Role Indicator & View Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-100">
              {isAdmin ? 'Hospital Financial & Billing Management' : 'Patient Billing History & Pharmacy Charges'}
            </h2>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: isAdmin ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                color: isAdmin ? '#818cf8' : '#34d399',
                border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`
              }}
            >
              <Shield size={11} /> {isAdmin ? 'Administrator Mode' : 'Patient View'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin
              ? 'Complete institutional financial totals, daily revenue cycle, and patient medicine charges'
              : 'Detailed breakdown of your medical invoices, prescribed medicine charges, and payment status'}
          </p>
        </div>

        {/* Role View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setActiveRoleView('admin')}
              className="px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: activeRoleView === 'admin' ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: activeRoleView === 'admin' ? '#a5b4fc' : '#94a3b8',
              }}
            >
              👑 Admin View (Hospital Totals)
            </button>
            <button
              onClick={() => {
                setActiveRoleView('patient')
                setTab('invoices')
              }}
              className="px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: activeRoleView === 'patient' ? 'rgba(16,185,129,0.25)' : 'transparent',
                color: activeRoleView === 'patient' ? '#6ee7b7' : '#94a3b8',
              }}
            >
              👤 Patient View (Medicine Charges Only)
            </button>
          </div>
        </div>
      </div>

      {/* ─── ADMINISTRATOR-ONLY TOTALS STRIP ────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {[
              { label: 'Hospital Daily Revenue',  value: formatCurrency(mockKPIs.daily_revenue),  icon: <IndianRupee size={18} />,   color: '#10b981' },
              { label: 'Total Hospital Billed',   value: formatCurrency(totalBilled),              icon: <CreditCard size={18} />,    color: '#6366f1' },
              { label: 'Pending Collection',      value: formatCurrency(pending),                  icon: <AlertCircle size={18} />,   color: '#ef4444' },
              { label: 'Collection Rate',         value: `${collectionRate}%`,                     icon: <TrendingUp size={18} />,    color: '#f59e0b' },
            ].map(k => (
              <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
                <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
                <div className="text-3xl font-bold text-slate-100">{k.value}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['invoices', 'overview', 'trends'] as const).map(t => (
              <button key={t} id={`billing-tab-${t}`} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
                {t === 'invoices' ? '🧾 Invoices & Medicine Breakdown' : t === 'overview' ? '💰 Revenue Overview' : '📈 14-Day Financial Trends'}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ─── PATIENT BILLING SUMMARY (Zero Macro Totals, Only Patient Context) ─── */
        <div className="glass-card p-5 border" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(99,102,241,0.05))' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" /> Patient Billing History &amp; Medicine Details
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Displaying itemized pharmacy medications, laboratory diagnostics, and clinical fees billed to your account.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Itemized Pharmacy Charges Verified
            </div>
          </div>
        </div>
      )}

      {/* ─── INVOICES & MEDICINE BILLING REGISTER ─────────────────────────────────────── */}
      {tab === 'invoices' && (
        <div className="space-y-4 animate-scale-in">
          {/* Filter & Search Bar */}
          <div className="flex gap-3 flex-wrap items-center justify-between">
            <input
              type="text"
              placeholder="Search invoice number, patient, or department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-slate-200 outline-none placeholder-slate-500"
            />
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PAID', 'PARTIAL', 'PENDING'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    background: statusFilter === s ? (STATUS_STYLE[s]?.bg || 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                    color: statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') : '#64748b',
                    border: `1px solid ${statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient Name</th>
                    <th>Department</th>
                    <th>Medicines Billed</th>
                    <th>Billed Amount</th>
                    <th>Paid Amount</th>
                    <th>Due Balance</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Itemized Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const ss = STATUS_STYLE[b.status]
                    const balance = b.amount - b.paid
                    const medicineTotal = b.medicines_billed.reduce((acc, m) => acc + m.total, 0)
                    return (
                      <tr key={b.inv} className="hover:bg-white/[0.02] transition-colors">
                        <td className="font-mono text-indigo-400 text-xs font-bold">{b.inv}</td>
                        <td>
                          <div className="font-medium text-slate-100 text-xs">{b.patient}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{b.patient_id}</div>
                        </td>
                        <td className="text-slate-400 text-xs">{b.dept}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                              <Pill size={11} />
                            </span>
                            <span className="font-medium text-slate-200 text-xs">
                              {b.medicines_billed.length} meds (₹{medicineTotal.toLocaleString()})
                            </span>
                          </div>
                        </td>
                        <td className="font-semibold text-slate-200 text-xs">₹{b.amount.toLocaleString()}</td>
                        <td className="text-emerald-400 font-semibold text-xs">₹{b.paid.toLocaleString()}</td>
                        <td className={balance > 0 ? 'text-red-400 font-semibold text-xs' : 'text-slate-500 text-xs'}>
                          {balance > 0 ? `₹${balance.toLocaleString()}` : '—'}
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded font-bold"
                                style={{ background: ss.bg, color: ss.color }}>{b.status}</span>
                        </td>
                        <td className="text-slate-400 text-xs">{b.date}</td>
                        <td>
                          <button
                            onClick={() => setSelectedInvoice(b)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                          >
                            <Eye size={12} /> View Medicines
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADMIN: REVENUE OVERVIEW ─────────────────────────────────────────────────── */}
      {isAdmin && tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-scale-in">
          {/* Collection gauge */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Collection Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Billed',    value: totalBilled,    color: '#6366f1', pct: 100 },
                { label: 'Collected',       value: totalCollected,  color: '#10b981', pct: collectionRate },
                { label: 'Pending',         value: pending,         color: '#ef4444', pct: Math.round((pending/totalBilled)*100) },
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
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue by Department (Institutional)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptRevenue} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis type="category" dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={80} />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>
                  {deptRevenue.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── ADMIN: REVENUE TRENDS ───────────────────────────────────────────────────── */}
      {isAdmin && tab === 'trends' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">14-Day Hospital Revenue vs Operating Cost vs Profit</h3>
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

      {/* ─── ITEMIZED MEDICINES & INVOICE RECEIPT MODAL ─────────────────────────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-in" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-400">{selectedInvoice.inv}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold"
                        style={{ background: STATUS_STYLE[selectedInvoice.status]?.bg, color: STATUS_STYLE[selectedInvoice.status]?.color }}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Patient: <strong className="text-slate-200">{selectedInvoice.patient}</strong> ({selectedInvoice.patient_id}) · Dept: {selectedInvoice.dept}
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white text-xl">
                <X size={20} />
              </button>
            </div>

            {/* Medicine Charges Breakdown Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Pill size={14} /> Itemized Prescribed Medicines &amp; Pharmacy Bill
              </div>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                      <th className="text-left p-2.5">Medicine</th>
                      <th className="text-left p-2.5">Dosage</th>
                      <th className="text-center p-2.5">Qty</th>
                      <th className="text-right p-2.5">Unit Price</th>
                      <th className="text-right p-2.5">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.medicines_billed.map((m, idx) => (
                      <tr key={idx} className="border-b border-white/[0.04] text-slate-300">
                        <td className="p-2.5 font-medium text-slate-100">{m.name}</td>
                        <td className="p-2.5 text-slate-400">{m.dosage}</td>
                        <td className="p-2.5 text-center font-mono text-slate-200">{m.qty}</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">₹{m.unit_price.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-300">₹{m.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-500/10 font-bold text-slate-200">
                      <td colSpan={4} className="p-2.5 text-right">Total Medicine Charges:</td>
                      <td className="p-2.5 text-right text-indigo-300">
                        ₹{selectedInvoice.medicines_billed.reduce((a, b) => a + b.total, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Other itemized charges */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="text-slate-400 text-[10px]">Consultation Fee</div>
                <div className="font-bold text-slate-200 mt-0.5">₹{selectedInvoice.consultation_fee.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="text-slate-400 text-[10px]">Bed / Room Charges</div>
                <div className="font-bold text-slate-200 mt-0.5">₹{selectedInvoice.bed_charges.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="text-slate-400 text-[10px]">Laboratory &amp; Diagnostics</div>
                <div className="font-bold text-slate-200 mt-0.5">₹{selectedInvoice.lab_charges.toLocaleString()}</div>
              </div>
            </div>

            {/* Final Bill Settlement Strip */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-400">Payment Method: <span className="text-slate-200 font-medium">{selectedInvoice.method}</span></div>
                <div className="text-[11px] text-slate-500 mt-0.5">Billing Date: {selectedInvoice.date}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-emerald-400">
                  Total Bill: ₹{selectedInvoice.amount.toLocaleString()}
                </div>
                {selectedInvoice.amount - selectedInvoice.paid > 0 && (
                  <div className="text-[11px] text-red-400 font-semibold">
                    Due Balance: ₹{(selectedInvoice.amount - selectedInvoice.paid).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => printInvoiceDocument(selectedInvoice)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Printer size={13} /> Print / Export PDF Invoice
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:text-white"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
