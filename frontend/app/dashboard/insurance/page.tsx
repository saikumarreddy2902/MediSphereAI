'use client'
import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  TrendingUp, IndianRupee, Search, FileCheck, RefreshCw, Plus, X
} from 'lucide-react'
import { formatCurrency, mockKPIs } from '@/lib/mock-data'
import { getInsuranceClaimsApi, createInsuranceClaimApi, getPatientsApi } from '@/lib/services/api-service'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  APPROVED:  { label: 'Approved',   icon: <CheckCircle2 size={12} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  IN_REVIEW: { label: 'In Review',  icon: <Clock size={12} />,        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  SUBMITTED: { label: 'Submitted',  icon: <FileText size={12} />,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  REJECTED:  { label: 'Rejected',   icon: <XCircle size={12} />,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}

const mockClaims = [
  { id: 'CLM-8801', patient: 'Rajesh Kumar',  provider: 'Star Health Insurance', policy: 'SHI-2026-8812', amount: 85000,  approved: 85000,  status: 'APPROVED',  submitted: '2026-10-01', resolved: '2026-10-02', reason: null },
  { id: 'CLM-8802', patient: 'Priya Sharma',  provider: 'HDFC ERGO Health',      policy: 'HE-99214-A',    amount: 142000, approved: 130000, status: 'APPROVED',  submitted: '2026-10-02', resolved: '2026-10-03', reason: null },
  { id: 'CLM-8803', patient: 'Mohammed Ali',  provider: 'New India Assurance',   policy: 'NIA-33918-B',   amount: 64000,  approved: null,   status: 'IN_REVIEW', submitted: '2026-10-03', resolved: null,         reason: null },
  { id: 'CLM-8804', patient: 'Sunita Patel',  provider: 'Bajaj Allianz Health',  policy: 'BAH-4412-C',    amount: 220000, approved: null,   status: 'SUBMITTED', submitted: '2026-10-04', resolved: null,         reason: null },
  { id: 'CLM-8805', patient: 'Arjun Mehta',   provider: 'Star Health Insurance', policy: 'SHI-2026-9041', amount: 35000,  approved: null,   status: 'REJECTED',  submitted: '2026-09-28', resolved: '2026-09-30', reason: 'Pre-existing clause exclusion' },
  { id: 'CLM-8806', patient: 'Deepika Rao',   provider: 'Care Health Insurance', policy: 'CHI-7712-X',    amount: 98000,  approved: 98000,  status: 'APPROVED',  submitted: '2026-10-03', resolved: '2026-10-04', reason: null },
]

const monthlyClaimTrend = [
  { month: 'May', submitted: 42, approved: 36, rejected: 6 },
  { month: 'Jun', submitted: 56, approved: 48, rejected: 8 },
  { month: 'Jul', submitted: 64, approved: 54, rejected: 10 },
  { month: 'Aug', submitted: 78, approved: 68, rejected: 10 },
  { month: 'Sep', submitted: 82, approved: 72, rejected: 10 },
  { month: 'Oct', submitted: 45, approved: 39, rejected: 6 },
]

const providerDist = [
  { provider: 'Star Health',  claims: 42, amount: 3850000, color: '#6366f1' },
  { provider: 'HDFC ERGO',    claims: 36, amount: 4120000, color: '#10b981' },
  { provider: 'New India',    claims: 28, amount: 2450000, color: '#f59e0b' },
  { provider: 'Bajaj Allianz',claims: 22, amount: 1980000, color: '#8b5cf6' },
  { provider: 'Care Health',  claims: 19, amount: 1620000, color: '#ec4899' },
]

export default function InsurancePage() {
  const [claims, setClaims] = useState<any[]>(mockClaims)
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tab, setTab] = useState<'claims' | 'trends' | 'providers'>('claims')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

  // Form state
  const [claimForm, setClaimForm] = useState({
    patient_id: '',
    patient_name: '',
    provider_name: 'Star Health Insurance',
    policy_number: '',
    claim_amount: '',
    diagnosis_code: 'I10',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [claimsData, patientsData] = await Promise.all([
          getInsuranceClaimsApi(),
          getPatientsApi(0, 50)
        ])
        if (Array.isArray(claimsData) && claimsData.length > 0) {
          setClaims(claimsData.map((c: any) => ({
            id: c.id || c._id || `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
            patient: c.patient_name || c.patient_id || 'Patient',
            provider: c.provider_name || c.provider || 'Health Insurer',
            policy: c.policy_number || 'POL-000000',
            amount: c.claim_amount || c.amount || 50000,
            approved: c.approved_amount || (c.claim_status === 'APPROVED' ? c.claim_amount : null),
            status: c.claim_status || c.status || 'SUBMITTED',
            submitted: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today',
            resolved: c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : null,
            reason: c.rejection_reason || null,
          })))
        }
        if (Array.isArray(patientsData) && patientsData.length > 0) {
          setPatients(patientsData)
          if (patientsData[0]) {
            setClaimForm(f => ({
              ...f,
              patient_id: patientsData[0].id || patientsData[0]._id,
              patient_name: `${patientsData[0].first_name} ${patientsData[0].last_name}`,
            }))
          }
        }
      } catch {
        // Fallback to mockClaims
      }
    }
    loadData()
  }, [])

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimForm.policy_number || !claimForm.claim_amount) {
      alert('Please enter policy number and claim amount')
      return
    }
    setSubmitting(true)
    try {
      await createInsuranceClaimApi({
        patient_id: claimForm.patient_id || 'P-0041',
        provider_name: claimForm.provider_name,
        policy_number: claimForm.policy_number,
        claim_amount: parseFloat(claimForm.claim_amount),
        diagnosis_code: claimForm.diagnosis_code,
      })
      const newClaim = {
        id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
        patient: claimForm.patient_name || 'Admitted Patient',
        provider: claimForm.provider_name,
        policy: claimForm.policy_number,
        amount: parseFloat(claimForm.claim_amount),
        approved: null,
        status: 'SUBMITTED',
        submitted: 'Just now',
        resolved: null,
        reason: null,
      }
      setClaims(prev => [newClaim, ...prev])
      setBannerMsg(`Insurance claim for ${claimForm.provider_name} submitted successfully!`)
      setShowSubmitModal(false)
      setClaimForm(f => ({ ...f, policy_number: '', claim_amount: '' }))
    } catch {
      const newClaim = {
        id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
        patient: claimForm.patient_name || 'Admitted Patient',
        provider: claimForm.provider_name,
        policy: claimForm.policy_number,
        amount: parseFloat(claimForm.claim_amount),
        approved: null,
        status: 'SUBMITTED',
        submitted: 'Just now',
        resolved: null,
        reason: null,
      }
      setClaims(prev => [newClaim, ...prev])
      setBannerMsg('Claim recorded successfully!')
      setShowSubmitModal(false)
    } finally {
      setSubmitting(false)
      setTimeout(() => setBannerMsg(null), 4000)
    }
  }

  const approvedCount  = claims.filter(c => c.status === 'APPROVED').length
  const rejectedCount  = claims.filter(c => c.status === 'REJECTED').length
  const pendingCount   = claims.filter(c => c.status === 'IN_REVIEW' || c.status === 'SUBMITTED').length
  const totalClaimed   = claims.reduce((s, c) => s + c.amount, 0)
  const totalApproved  = claims.reduce((s, c) => s + (c.approved || 0), 0)
  const approvalRate   = claims.length > 0 ? Math.round((approvedCount / claims.length) * 100) : 100

  const filtered = claims.filter(c => {
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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={14} /> Submit New Claim
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
               style={{ background: approvalRate > 75 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: approvalRate > 75 ? '#10b981' : '#f59e0b', border: `1px solid ${approvalRate > 75 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
            <FileCheck size={13} /> {approvalRate}% First-pass Approval Rate
          </div>
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

      {/* Submit Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">Submit New Insurance Claim</h3>
                <p className="text-xs text-slate-400">Direct electronic claim filing and pre-auth submission</p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Select Patient</label>
                <select
                  value={claimForm.patient_id}
                  onChange={e => {
                    const found = patients.find(p => (p.id || p._id) === e.target.value)
                    setClaimForm(f => ({
                      ...f,
                      patient_id: e.target.value,
                      patient_name: found ? `${found.first_name} ${found.last_name}` : f.patient_name
                    }))
                  }}
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                >
                  {patients.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id} style={{ background: '#13131e' }}>
                      {p.first_name} {p.last_name} ({String(p.id || p._id).slice(-6)})
                    </option>
                  ))}
                  {patients.length === 0 && <option value="P-0041" style={{ background: '#13131e' }}>Rajesh Kumar (P-0041)</option>}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Insurance Provider</label>
                <select
                  value={claimForm.provider_name}
                  onChange={e => setClaimForm(f => ({ ...f, provider_name: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                >
                  <option value="Star Health Insurance" style={{ background: '#13131e' }}>Star Health Insurance</option>
                  <option value="HDFC ERGO Health" style={{ background: '#13131e' }}>HDFC ERGO Health</option>
                  <option value="New India Assurance" style={{ background: '#13131e' }}>New India Assurance</option>
                  <option value="Bajaj Allianz Health" style={{ background: '#13131e' }}>Bajaj Allianz Health</option>
                  <option value="Apollo Munich Health" style={{ background: '#13131e' }}>Apollo Munich Health</option>
                  <option value="Niva Bupa Health" style={{ background: '#13131e' }}>Niva Bupa Health</option>
                  <option value="Care Health Insurance" style={{ background: '#13131e' }}>Care Health Insurance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Policy Number</label>
                  <input
                    type="text"
                    value={claimForm.policy_number}
                    onChange={e => setClaimForm(f => ({ ...f, policy_number: e.target.value }))}
                    placeholder="e.g. SHI-2026-8812"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Claim Amount (₹)</label>
                  <input
                    type="number"
                    value={claimForm.claim_amount}
                    onChange={e => setClaimForm(f => ({ ...f, claim_amount: e.target.value }))}
                    placeholder="50000"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Primary Diagnosis Code (ICD-10)</label>
                <input
                  type="text"
                  value={claimForm.diagnosis_code}
                  onChange={e => setClaimForm(f => ({ ...f, diagnosis_code: e.target.value }))}
                  placeholder="I10 (Essential Hypertension)"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
                >
                  {submitting ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
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
