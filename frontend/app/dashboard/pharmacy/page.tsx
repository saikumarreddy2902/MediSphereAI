'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts'
import {
  Pill, AlertTriangle, CheckCircle2, PackageX,
  RefreshCw, TrendingDown, Clock, Search, ShoppingCart,
  CheckCircle, FileText, Zap, Shield
} from 'lucide-react'
import { mockPharmacyInventory, getStatusColor, formatCurrency } from '@/lib/mock-data'
import { api } from '@/lib/api'
import { useWebSocket } from '@/lib/hooks/useWebSocket'

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

import { Plus, X, PackagePlus } from 'lucide-react'

export default function PharmacyPage() {
  const [inventory, setInventory] = useState(mockPharmacyInventory)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'critical'>('all')
  const [tab, setTab] = useState<'inventory' | 'pending' | 'dispense' | 'trends'>('pending')
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [dispensingId, setDispensingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

  // Add Medicine Form state
  const [medForm, setMedForm] = useState({
    name: '',
    category: 'Analgesic',
    current_stock: 500,
    min: 200,
    unit_cost: 15.0,
    expiry_days: 365,
  })

  const { lastMessage } = useWebSocket()

  const fetchPendingPrescriptions = useCallback(async () => {
    setPendingLoading(true)
    try {
      const res = await api.get('/prescriptions/?status=ACTIVE')
      setPendingPrescriptions(res.data || [])
    } catch {
      setPendingPrescriptions([])
    } finally {
      setPendingLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingPrescriptions()
  }, [fetchPendingPrescriptions])

  // Real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'prescription' || lastMessage?.type === 'prescription_dispensed') {
      fetchPendingPrescriptions()
    }
  }, [lastMessage, fetchPendingPrescriptions])

  const handleVerifyAndDispense = async (id: string) => {
    setDispensingId(id)
    try {
      await api.post(`/prescriptions/${id}/dispense`)
      fetchPendingPrescriptions()
      setBannerMsg('Prescription verified and dispensed successfully!')
      setTimeout(() => setBannerMsg(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to dispense prescription')
    } finally {
      setDispensingId(null)
    }
  }

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medForm.name) {
      alert('Please enter medicine name')
      return
    }
    const current_stock = Number(medForm.current_stock) || 0
    const min = Number(medForm.min) || 100
    const expiry_days = Number(medForm.expiry_days) || 365
    const status = current_stock <= min * 0.4 ? 'critical' : current_stock <= min ? 'low' : 'ok'
    const expiry_status = expiry_days < 30 ? 'critical' : expiry_days < 90 ? 'warning' : 'ok'

    const newMed = {
      code: `MED-${String(inventory.length + 1).padStart(3, '0')}`,
      name: medForm.name,
      category: medForm.category,
      current_stock,
      min,
      status: status as any,
      expiry_days,
      expiry_status: expiry_status as any,
      unit_cost: Number(medForm.unit_cost) || 10.0,
      monthly_consumption: Math.round(current_stock * 0.4),
    }

    setInventory(prev => [newMed, ...prev])
    setBannerMsg(`New medicine "${medForm.name}" added to pharmacy inventory successfully!`)
    setShowAddModal(false)
    setMedForm({
      name: '',
      category: 'Analgesic',
      current_stock: 500,
      min: 200,
      unit_cost: 15.0,
      expiry_days: 365,
    })
    setTimeout(() => setBannerMsg(null), 4000)
  }

  const totalItems    = inventory.length
  const criticalItems = inventory.filter(m => m.status === 'critical').length
  const lowItems      = inventory.filter(m => m.status === 'low').length
  const expiryAlerts  = inventory.filter(m => m.expiry_status !== 'ok').length

  const filtered = inventory.filter(m => {
    const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || m.status === statusFilter
    return matchSearch && matchStatus
  })

  const stockBarData = ['Analgesic', 'Antibiotic', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Steroid', 'Antacid', 'Anticoagulant'].map(cat => ({
    category: cat.replace('cardiovascular', 'Cardiac'),
    items: inventory.filter(m => m.category.toLowerCase() === cat.toLowerCase()).length,
    stock: inventory.filter(m => m.category.toLowerCase() === cat.toLowerCase()).reduce((s, m) => s + m.current_stock, 0),
  })).filter(d => d.items > 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Pharmacy Intelligence &amp; Stock Availability</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time prescription dispensing pipeline, inventory verification &amp; stock availability</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <PackagePlus size={14} /> Add Medicine / Stock
          </button>
          {pendingPrescriptions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold animate-pulse"
                 style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Pill size={14}/> {pendingPrescriptions.length} Pending
            </div>
          )}
          {(criticalItems > 0 || lowItems > 0) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold animate-pulse"
                 style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={13} /> {criticalItems} critical · {lowItems} low stock
            </div>
          )}
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} /> {bannerMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Pending Dispense',   value: pendingPrescriptions.length, icon: <Clock size={18}/>,         color: '#818cf8' },
          { label: 'Total SKUs Tracked', value: totalItems,                  icon: <Pill size={18} />,         color: '#6366f1' },
          { label: 'Critical Stock',     value: criticalItems,               icon: <PackageX size={18} />,      color: '#ef4444' },
          { label: 'Low Stock',          value: lowItems,                    icon: <TrendingDown size={18} />,  color: '#f59e0b' },
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
        {(['pending', 'inventory', 'dispense', 'trends'] as const).map(t => (
          <button key={t} id={`pharmacy-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(139,92,246,0.2)' : 'transparent', color: tab === t ? '#a78bfa' : '#64748b', border: tab === t ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent' }}>
            {t === 'pending' ? `💊 Pending Queue (${pendingPrescriptions.length})` : t === 'inventory' ? '📦 Inventory' : t === 'dispense' ? '🧾 Dispense Log' : '📈 Consumption Trends'}
          </button>
        ))}
      </div>

      {/* Pending Prescriptions Tab */}
      {tab === 'pending' && (
        <div className="space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Zap size={16} className="text-indigo-400"/> Pharmacist Dispensing Queue
            </h3>
            <button onClick={fetchPendingPrescriptions} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <RefreshCw size={13} className={pendingLoading ? 'animate-spin' : ''}/> Refresh
            </button>
          </div>

          {pendingLoading ? (
            <div className="glass-card p-8 text-center text-slate-500 text-xs animate-pulse">
              Loading active prescriptions...
            </div>
          ) : pendingPrescriptions.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-2">
              <CheckCircle size={36} className="mx-auto text-emerald-400 opacity-60"/>
              <p className="text-sm font-semibold text-slate-200">No Pending Prescriptions</p>
              <p className="text-xs text-slate-500">All active doctor prescriptions have been verified and dispensed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPrescriptions.map(prx => (
                <div key={prx.id} className="glass-card p-4 space-y-3 border" style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">RX-{prx.id?.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Patient ID: <strong className="text-slate-200">{prx.patient_id}</strong> · Diagnosis: {prx.diagnosis || 'General Treatment'}
                      </div>
                    </div>
                    <button onClick={() => handleVerifyAndDispense(prx.id)} disabled={dispensingId === prx.id}
                            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                      {dispensingId === prx.id ? <RefreshCw size={13} className="animate-spin"/> : <CheckCircle size={14}/>}
                      {dispensingId === prx.id ? 'Dispensing…' : 'Verify & Dispense'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prescribed Medications ({prx.medications?.length})</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {prx.medications?.map((m: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Pill size={14}/>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{m.medicine_name}</div>
                            <div className="text-[11px] text-slate-400">{m.dosage} · {m.frequency} · {m.duration_days} days ({m.route})</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">Add Medicine / Stock Entry</h3>
                <p className="text-xs text-slate-400">Register new pharmaceutical formulation or restock SKU</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Medicine Name &amp; Strength</label>
                <input
                  type="text"
                  value={medForm.name}
                  onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Azithromycin 500mg / Pantoprazole 40mg"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select
                    value={medForm.category}
                    onChange={e => setMedForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="Analgesic" style={{ background: '#13131e' }}>Analgesic</option>
                    <option value="Antibiotic" style={{ background: '#13131e' }}>Antibiotic</option>
                    <option value="Cardiovascular" style={{ background: '#13131e' }}>Cardiovascular</option>
                    <option value="Antidiabetic" style={{ background: '#13131e' }}>Antidiabetic</option>
                    <option value="Respiratory" style={{ background: '#13131e' }}>Respiratory</option>
                    <option value="Steroid" style={{ background: '#13131e' }}>Steroid</option>
                    <option value="Antacid" style={{ background: '#13131e' }}>Antacid</option>
                    <option value="Anticoagulant" style={{ background: '#13131e' }}>Anticoagulant</option>
                    <option value="Diuretic" style={{ background: '#13131e' }}>Diuretic</option>
                    <option value="Antiemetic" style={{ background: '#13131e' }}>Antiemetic</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={medForm.unit_cost}
                    onChange={e => setMedForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                  <input
                    type="number"
                    value={medForm.current_stock}
                    onChange={e => setMedForm(f => ({ ...f, current_stock: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Min Stock</label>
                  <input
                    type="number"
                    value={medForm.min}
                    onChange={e => setMedForm(f => ({ ...f, min: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Expiry (Days)</label>
                  <input
                    type="number"
                    value={medForm.expiry_days}
                    onChange={e => setMedForm(f => ({ ...f, expiry_days: parseInt(e.target.value) || 365 }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
