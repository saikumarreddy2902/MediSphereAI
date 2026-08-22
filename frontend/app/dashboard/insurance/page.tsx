'use client'
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  TrendingUp, IndianRupee, Search, FileCheck, RefreshCw
} from 'lucide-react'
import { formatCurrency, mockKPIs } from '@/lib/mock-data'

const mockClaims = [
  { id: 'CLM-3001', inv: 'INV-7801', patient: 'Rajesh Kumar',  provider: 'Star Health Insurance',  policy: 'SHI-2026-00123', amount: 48200,  approved: 45000,  status: 'APPROVED',   submitted: '18 Aug', resolved: '20 Aug', reason: null         },
  { id: 'CLM-3002', inv: 'INV-7802', patient: 'Priya Sharma',  provider: 'HDFC ERGO Health',       policy: 'HDFC-1892344',  amount: 92500,  approved: null,   status: 'IN_REVIEW',  submitted: '19 Aug', resolved: null,     reason: null         },
  { id: 'CLM-3003', inv: 'INV-7803', patient: 'Arjun Mehta',   provider: 'New India Assurance',    policy: 'NIA-7741002',   amount: 125000, approved: null,   status: 'SUBMITTED',  submitted: '20 Aug', resolved: null,     reason: null         },
  { id: 'CLM-3004', inv: 'INV-7805', patient: 'Vikram Singh',  provider: 'Apollo Munich Health',   policy: 'APL-5592841',   amount: 32800,  approved: 28000,  status: 'APPROVED',   submitted: '16 Aug', resolved: '19 Aug', reason: null         },
  { id: 'CLM-3005', inv: 'INV-7807', patient: 'Mohammed Ali',  provider: 'Bajaj Allianz Health',   policy: 'BAJ-8812903',   amount: 78600,  approved: null,   status: 'REJECTED',   submitted: '15 Aug', resolved: '18 Aug', reason: 'Policy exclusion: Pre-existing condition' },
  { id: 'CLM-3006', inv: 'INV-7804', patient: 'Sunita Patel',  provider: 'Max Bupa Health',        policy: 'MAX-0039178',   amount: 15400,  approved: 14800,  status: 'APPROVED',   submitted: '17 Aug', resolved: '19 Aug', reason: null         },
  { id: 'CLM-3007', inv: 'INV-7806', patient: 'Lakshmi Nair',  provider: 'Niva Bupa Health',       policy: 'NIV-2234512',   amount: 22100,  approved: null,   status: 'IN_REVIEW',  submitted: '18 Aug', resolved: null,     reason: null         },
  { id: 'CLM-3008', inv: 'INV-7808', patient: 'Deepika Rao',   provider: 'Care Health Insurance',  policy: 'CARE-8872931',  amount: 41500,  approved: null,   status: 'SUBMITTED',  submitted: '20 Aug', resolved: null,     reason: null         },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  APPROVED:   { label: 'Approved',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={12}/> },
  IN_REVIEW:  { label: 'In Review',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: <RefreshCw size={12}/>    },
  SUBMITTED:  { label: 'Submitted',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <Clock size={12}/>        },
  REJECTED:   { label: 'Rejected',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={12}/>      },
}

const monthlyClaimTrend = Array.from({ length: 6 }, (_, i) => {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  return {
    month: months[i],
    submitted: Math.floor(55 + Math.random() * 25),
    approved:  Math.floor(45 + Math.random() * 20),
    rejected:  Math.floor(3  + Math.random() * 7),
    value:     Math.floor(3000000 + Math.random() * 2000000),
  }
})

const providerDist = [
  { provider: 'Star Health',   claims: 18, amount: 840000, color: '#6366f1' },
  { provider: 'HDFC ERGO',     claims: 14, amount: 620000, color: '#ef4444' },
  { provider: 'Bajaj Allianz', claims: 11, amount: 510000, color: '#f59e0b' },
  { provider: 'Apollo Munich', claims: 9,  amount: 425000, color: '#10b981' },
  { provider: 'Max Bupa',      claims: 7,  amount: 318000, color: '#8b5cf6' },
  { provider: 'Others',        claims: 4,  amount: 189000, color: '#64748b' },
]

export default function InsurancePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tab, setTab] = useState<'claims' | 'trends' | 'providers'>('claims')

  const approvedCount  = mockClaims.filter(c => c.status === 'APPROVED').length
  const rejectedCount  = mockClaims.filter(c => c.status === 'REJECTED').length
  const pendingCount   = mockClaims.filter(c => c.status === 'IN_REVIEW' || c.status === 'SUBMITTED').length
  const totalClaimed   = mockClaims.reduce((s, c) => s + c.amount, 0)
  const totalApproved  = mockClaims.reduce((s, c) => s + (c.approved || 0), 0)
  const approvalRate   = Math.round((approvedCount / mockClaims.length) * 100)

  const filtered = mockClaims.filter(c => {
    const matchSearch = search === '' || c.patient.toLowerCase().includes(search.toLowerCase()) || c.provider.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Insurance Claims &amp; Verification</h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated claim lifecycle management, denial prevention, and prior authorization tracking</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
             style={{ background: approvalRate > 75 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: approvalRate > 75 ? '#10b981' : '#f59e0b', border: `1px solid ${approvalRate > 75 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
          <FileCheck size={13} /> {approvalRate}% First-pass Approval Rate
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Claims',      value: mockClaims.length,       icon: <FileText size={18} />,    color: '#6366f1' },
          { label: 'Approved',          value: approvedCount,           icon: <CheckCircle2 size={18}/>, color: '#10b981' },
          { label: 'Pending Review',    value: pendingCount,            icon: <Clock size={18} />,       color: '#3b82f6' },
          { label: 'Rejected',          value: rejectedCount,           icon: <XCircle size={18} />,     color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Value Summary Bar */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Claimed Value',   value: formatCurrency(totalClaimed),  color: '#6366f1' },
          { label: 'Total Approved Value',  value: formatCurrency(totalApproved), color: '#10b981' },
          { label: 'Pending Settlement',    value: formatCurrency(totalClaimed - totalApproved), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['claims', 'trends', 'providers'] as const).map(t => (
          <button key={t} id={`insurance-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'claims' ? '📋 Claims Register' : t === 'trends' ? '📈 Monthly Trends' : '🏢 Provider Breakdown'}
          </button>
        ))}
      </div>

      {/* Claims Register */}
      {tab === 'claims' && (
        <div className="space-y-3 animate-scale-in">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="insurance-search" type="text" placeholder="Search patient, provider, or claim ID…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['ALL', 'APPROVED', 'IN_REVIEW', 'SUBMITTED', 'REJECTED'].map(s => {
                const sc = STATUS_CONFIG[s]
                return (
                  <button key={s} id={`ins-filter-${s}`} onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: statusFilter === s ? (sc?.bg || 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                      color: statusFilter === s ? (sc?.color || '#818cf8') : '#64748b',
                      border: `1px solid ${statusFilter === s ? (sc?.color || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    {s === 'ALL' ? 'All' : sc?.label || s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr><th>Claim ID</th><th>Patient</th><th>Provider</th><th>Policy</th><th>Claimed</th><th>Approved</th><th>Status</th><th>Submitted</th><th>Resolved</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const sc = STATUS_CONFIG[c.status]
                  return (
                    <tr key={c.id} style={{ background: c.status === 'REJECTED' ? 'rgba(239,68,68,0.03)' : undefined }}>
                      <td className="font-mono text-xs text-indigo-400">{c.id}</td>
                      <td className="font-medium text-slate-100 text-xs">{c.patient}</td>
                      <td className="text-slate-400 text-xs max-w-[140px] truncate">{c.provider}</td>
                      <td className="font-mono text-xs text-slate-500">{c.policy}</td>
                      <td className="font-semibold text-slate-200">{formatCurrency(c.amount)}</td>
                      <td>
                        {c.approved
                          ? <span className="text-emerald-400 font-semibold text-xs">{formatCurrency(c.approved)}</span>
                          : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                              style={{ background: sc?.bg, color: sc?.color }}>
                          {sc?.icon} {sc?.label}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs">{c.submitted}</td>
                      <td className="text-slate-500 text-xs">{c.resolved || '—'}</td>
                      <td className="text-xs max-w-[140px]">
                        {c.reason
                          ? <span className="text-red-400">{c.reason}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {tab === 'trends' && (
        <div className="space-y-4 animate-scale-in">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">6-Month Claims Volume (Submitted vs Approved vs Rejected)</h3>
              <div className="flex gap-4 text-xs">
                {[['#6366f1','Submitted'],['#10b981','Approved'],['#ef4444','Rejected']].map(([c,l])=>(
                  <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyClaimTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="submitted" name="Submitted" fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="approved"  name="Approved"  fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="rejected"  name="Rejected"  fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Provider Breakdown */}
      {tab === 'providers' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-scale-in">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Claims by Provider</h3>
            <div className="flex justify-center mb-4">
              <PieChart width={180} height={180}>
                <Pie data={providerDist} cx={90} cy={90} innerRadius={45} outerRadius={82} dataKey="claims" paddingAngle={3}>
                  {providerDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: any, n: string, props: any) => [v, props.payload.provider]}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              </PieChart>
            </div>
            <div className="space-y-2">
              {providerDist.map(p => (
                <div key={p.provider} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 text-slate-400">{p.provider}</span>
                  <span className="font-bold text-slate-200">{p.claims} claims</span>
                  <span className="text-slate-500">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Claim Value by Provider</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={providerDist} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="provider" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={90} />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(v), 'Claim Value']}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="amount" name="Value" radius={[0,4,4,0]}>
                  {providerDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
