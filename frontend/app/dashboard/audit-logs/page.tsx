'use client'
import { useState, useEffect } from 'react'
import { ShieldCheck, Search, Filter, Download, RefreshCw, User, Eye, Edit, Trash2, Lock, LogIn, LogOut, Plus } from 'lucide-react'

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  resource: string
  resource_id: string
  ip_address: string
  status: 'SUCCESS' | 'FAILED' | 'WARNING'
  details: string
}

const ACTION_ICONS: Record<string, any> = {
  LOGIN: <LogIn size={13} />, LOGOUT: <LogOut size={13} />, VIEW: <Eye size={13} />,
  CREATE: <Plus size={13} />, UPDATE: <Edit size={13} />, DELETE: <Trash2 size={13} />,
  ACCESS_DENIED: <Lock size={13} />,
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2026-10-24 12:18:04', user: 'admin', role: 'admin', action: 'VIEW', resource: 'Patient Records', resource_id: 'P-0041', ip_address: '192.168.1.10', status: 'SUCCESS', details: 'Viewed patient record for Rajesh Kumar' },
  { id: 'AUD-002', timestamp: '2026-10-24 12:15:33', user: 'doctor', role: 'doctor', action: 'CREATE', resource: 'Prescription', resource_id: 'RX-2281', ip_address: '192.168.1.22', status: 'SUCCESS', details: 'Issued prescription — Amlodipine 5mg for APT-9865' },
  { id: 'AUD-003', timestamp: '2026-10-24 12:12:01', user: 'nurse', role: 'nurse', action: 'UPDATE', resource: 'Bed Assignment', resource_id: 'BED-G12', ip_address: '192.168.1.31', status: 'SUCCESS', details: 'Updated bed G-12 assignment to patient P-007' },
  { id: 'AUD-004', timestamp: '2026-10-24 12:09:55', user: 'patient', role: 'patient', action: 'ACCESS_DENIED', resource: 'Staff Management', resource_id: 'STAFF', ip_address: '192.168.1.55', status: 'FAILED', details: 'Patient attempted unauthorized access to staff module — blocked by RBAC middleware' },
  { id: 'AUD-005', timestamp: '2026-10-24 12:07:12', user: 'admin', role: 'admin', action: 'DELETE', resource: 'Appointment', resource_id: 'APT-0012', ip_address: '192.168.1.10', status: 'SUCCESS', details: 'Cancelled appointment APT-0012 — patient request' },
  { id: 'AUD-006', timestamp: '2026-10-24 11:58:44', user: 'doctor', role: 'doctor', action: 'LOGIN', resource: 'Auth', resource_id: 'SESSION', ip_address: '192.168.1.22', status: 'SUCCESS', details: 'Doctor login — Dr. Priya Sharma authenticated via JWT' },
  { id: 'AUD-007', timestamp: '2026-10-24 11:45:29', user: 'admin', role: 'admin', action: 'CREATE', resource: 'User Account', resource_id: 'USR-089', ip_address: '192.168.1.10', status: 'SUCCESS', details: 'Registered new nurse account: Sarah Jenkins' },
  { id: 'AUD-008', timestamp: '2026-10-24 11:30:00', user: 'nurse', role: 'nurse', action: 'VIEW', resource: 'Medication Dispensing', resource_id: 'RX-2277', ip_address: '192.168.1.31', status: 'SUCCESS', details: 'Dispensed Metformin 500mg to patient P-003' },
  { id: 'AUD-009', timestamp: '2026-10-24 11:15:11', user: 'unknown', role: '-', action: 'LOGIN', resource: 'Auth', resource_id: 'SESSION', ip_address: '203.0.113.42', status: 'FAILED', details: 'Failed login attempt — invalid credentials from external IP' },
  { id: 'AUD-010', timestamp: '2026-10-24 11:00:03', user: 'admin', role: 'admin', action: 'UPDATE', resource: 'Insurance Claim', resource_id: 'INS-445', ip_address: '192.168.1.10', status: 'SUCCESS', details: 'Updated insurance claim status to APPROVED for patient P-002' },
]

const STATUS_COLORS = { SUCCESS: '#10b981', FAILED: '#ef4444', WARNING: '#f59e0b' }
const STATUS_BG = { SUCCESS: 'rgba(16,185,129,0.1)', FAILED: 'rgba(239,68,68,0.1)', WARNING: 'rgba(245,158,11,0.1)' }
const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#6366f1', LOGOUT: '#64748b', VIEW: '#3b82f6', CREATE: '#10b981',
  UPDATE: '#f59e0b', DELETE: '#ef4444', ACCESS_DENIED: '#dc2626',
}

export default function AuditLogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>(MOCK_AUDIT)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterAction, setFilterAction] = useState('ALL')
  const [loading, setLoading] = useState(false)

  const filtered = entries.filter(e => {
    const matchSearch = search === '' ||
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.resource.toLowerCase().includes(search.toLowerCase()) ||
      e.details.toLowerCase().includes(search.toLowerCase()) ||
      e.ip_address.includes(search)
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus
    const matchAction = filterAction === 'ALL' || e.action === filterAction
    return matchSearch && matchStatus && matchAction
  })

  const handleExport = () => {
    const csv = [
      ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'IP', 'Status', 'Details'],
      ...filtered.map(e => [e.id, e.timestamp, e.user, e.role, e.action, e.resource, e.resource_id, e.ip_address, e.status, e.details]),
    ].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setEntries([...MOCK_AUDIT].sort(() => Math.random() - 0.5))
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#6366f1' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} className="text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Admin Only</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Audit Logs</h1>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Full activity trail — {entries.length} events · Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: entries.length, color: '#6366f1' },
          { label: 'Successful', value: entries.filter(e => e.status === 'SUCCESS').length, color: '#10b981' },
          { label: 'Failed', value: entries.filter(e => e.status === 'FAILED').length, color: '#ef4444' },
          { label: 'Unique Users', value: new Set(entries.map(e => e.user)).size, color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4 text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-xs" style={{ color: '#64748b' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input type="text" placeholder="Search user, resource, IP address..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-200 placeholder-slate-500 w-full" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Filter size={13} className="text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-300">
              <option value="ALL" style={{ background: '#13131e' }}>All Status</option>
              <option value="SUCCESS" style={{ background: '#13131e' }}>Success</option>
              <option value="FAILED" style={{ background: '#13131e' }}>Failed</option>
              <option value="WARNING" style={{ background: '#13131e' }}>Warning</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-300">
              <option value="ALL" style={{ background: '#13131e' }}>All Actions</option>
              {['LOGIN', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'ACCESS_DENIED'].map(a => (
                <option key={a} value={a} style={{ background: '#13131e' }}>{a}</option>
              ))}
            </select>
          </div>
          <span className="text-xs ml-auto" style={{ color: '#475569' }}>
            Showing {filtered.length} of {entries.length} events
          </span>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Timestamp', 'User / Role', 'Action', 'Resource', 'IP Address', 'Status', 'Details'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr key={entry.id}
                  className="border-b transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: 'rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="px-4 py-3 font-mono" style={{ color: '#64748b' }}>{entry.timestamp}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                           style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {entry.user[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#e2e8f0' }}>{entry.user}</div>
                        <div style={{ color: '#475569' }}>{entry.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded font-semibold w-fit"
                          style={{ background: `${ACTION_COLORS[entry.action] || '#6366f1'}18`, color: ACTION_COLORS[entry.action] || '#6366f1' }}>
                      {ACTION_ICONS[entry.action]} {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ color: '#94a3b8' }}>{entry.resource}</div>
                    <div className="font-mono text-[10px]" style={{ color: '#334155' }}>{entry.resource_id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#64748b' }}>{entry.ip_address}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded font-semibold"
                          style={{ background: STATUS_BG[entry.status], color: STATUS_COLORS[entry.status] }}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" style={{ color: '#94a3b8' }} title={entry.details}>{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">No audit entries match your filters.</div>
        )}
      </div>
    </div>
  )
}
