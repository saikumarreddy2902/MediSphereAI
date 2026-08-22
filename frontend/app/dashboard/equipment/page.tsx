'use client'
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  Cog, AlertTriangle, CheckCircle2, WrenchIcon,
  TrendingUp, Activity, Calendar, Zap, Search
} from 'lucide-react'
import { mockEquipment, getStatusColor } from '@/lib/mock-data'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  operational: { label: 'Operational', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={12}/> },
  in_use:      { label: 'In Use',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <Activity size={12}/>    },
  maintenance: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <WrenchIcon size={12}/>  },
  faulty:      { label: 'Faulty',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <AlertTriangle size={12}/>},
}

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
}

const maintenanceSchedule = [
  { date: 'Aug 22', equipment: 'Dialysis Machine',    dept: 'ICU',       type: 'Preventive',  duration: '4 hrs',   tech: 'Sanjay Iyer',   status: 'Scheduled' },
  { date: 'Aug 23', equipment: 'MRI Scanner',         dept: 'Radiology', type: 'Calibration', duration: '2 hrs',   tech: 'External Vendor',status: 'Confirmed'  },
  { date: 'Aug 24', equipment: 'Endoscopy System',    dept: 'Surgery',   type: 'Corrective',  duration: '6 hrs',   tech: 'External Vendor',status: 'Urgent'     },
  { date: 'Aug 25', equipment: 'CT Scanner',          dept: 'Radiology', type: 'Preventive',  duration: '3 hrs',   tech: 'Mohan R',        status: 'Scheduled' },
  { date: 'Aug 28', equipment: 'Ventilator Unit A',   dept: 'ICU',       type: 'Inspection',  duration: '1 hr',    tech: 'Sanjay Iyer',   status: 'Scheduled' },
]

const SCHED_STYLE: Record<string, { color: string; bg: string }> = {
  Urgent:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  Confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  Scheduled: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
}

const utilizationTrend = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
  day: d,
  mri: Math.floor(80 + Math.random() * 15),
  ct: Math.floor(85 + Math.random() * 10),
  ventilator: Math.floor(65 + Math.random() * 20),
  dialysis: Math.floor(60 + Math.random() * 20),
}))

const statusDist = Object.entries(
  mockEquipment.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1; return acc
  }, {})
).map(([status, count]) => ({ status, count, color: STATUS_CONFIG[status]?.color || '#6b7280' }))

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tab, setTab] = useState<'assets' | 'maintenance' | 'utilization'>('assets')

  const operationalCount  = mockEquipment.filter(e => e.status === 'operational' || e.status === 'in_use').length
  const maintenanceCount  = mockEquipment.filter(e => e.status === 'maintenance').length
  const faultyCount       = mockEquipment.filter(e => e.status === 'faulty').length
  const highRiskCount     = mockEquipment.filter(e => e.failure_risk_level === 'high' || e.failure_risk_level === 'critical').length

  const filtered = mockEquipment.filter(e => {
    const matchSearch = search === '' || e.name.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Medical Asset Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">Predictive maintenance, utilization telemetry, and equipment lifecycle management</p>
        </div>
        {faultyCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
               style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={13} /> {faultyCount} faulty · {highRiskCount} high-risk assets
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Assets',       value: mockEquipment.length, icon: <Cog size={18} />,          color: '#6366f1' },
          { label: 'Operational',        value: operationalCount,     icon: <CheckCircle2 size={18} />,  color: '#10b981' },
          { label: 'Under Maintenance',  value: maintenanceCount,     icon: <WrenchIcon size={18} />,    color: '#f59e0b' },
          { label: 'High Failure Risk',  value: highRiskCount,        icon: <AlertTriangle size={18} />, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Faulty Alert Banner */}
      {faultyCount > 0 && (
        <div className="glass-card p-4 border-l-4 border-red-500" style={{ background: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Equipment Failure Alert</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {mockEquipment.filter(e => e.status === 'faulty').map(e => e.name).join(' · ')} — Immediate maintenance required
              </p>
            </div>
            <button id="equipment-maintenance-btn" className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              Schedule Repair
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['assets', 'maintenance', 'utilization'] as const).map(t => (
          <button key={t} id={`equipment-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'assets' ? '⚙️ Asset Register' : t === 'maintenance' ? '🔧 Maintenance Schedule' : '📈 Utilization Trends'}
          </button>
        ))}
      </div>

      {/* Asset Register */}
      {tab === 'assets' && (
        <div className="space-y-3 animate-scale-in">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="equipment-search" type="text" placeholder="Search asset, department, category…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'operational', 'in_use', 'maintenance', 'faulty'].map(s => {
                const sc = STATUS_CONFIG[s]
                return (
                  <button key={s} id={`eq-filter-${s}`} onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={{
                      background: statusFilter === s ? (sc?.bg || 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                      color: statusFilter === s ? (sc?.color || '#818cf8') : '#64748b',
                      border: `1px solid ${statusFilter === s ? (sc?.color || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    {s === 'all' ? 'All' : sc?.label || s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Status pie */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Asset Status Distribution</h3>
              <div className="flex justify-center mb-3">
                <PieChart width={150} height={150}>
                  <Pie data={statusDist} cx={75} cy={75} innerRadius={38} outerRadius={68} dataKey="count" paddingAngle={3}>
                    {statusDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                </PieChart>
              </div>
              <div className="space-y-2">
                {statusDist.map(d => {
                  const sc = STATUS_CONFIG[d.status]
                  return (
                    <div key={d.status} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="flex-1 text-slate-400">{sc?.label || d.status}</span>
                      <span className="font-bold text-slate-200">{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Asset table */}
            <div className="xl:col-span-2 glass-card overflow-hidden">
              <div className="overflow-auto max-h-[460px]">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>ID</th><th>Equipment</th><th>Category</th><th>Department</th><th>Utilization</th><th>Status</th><th>Failure Risk</th><th>Critical</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => {
                      const sc = STATUS_CONFIG[e.status]
                      const rc = RISK_CONFIG[e.failure_risk_level]
                      return (
                        <tr key={e.id}>
                          <td className="font-mono text-xs text-indigo-400">{e.id}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                   style={{ background: `${sc?.color || '#6366f1'}12` }}>
                                <Cog size={12} style={{ color: sc?.color || '#818cf8' }} />
                              </div>
                              <span className="font-medium text-slate-100 text-xs">{e.name}</span>
                              {e.is_critical && <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Critical</span>}
                            </div>
                          </td>
                          <td className="text-slate-400 text-xs">{e.category}</td>
                          <td className="text-slate-400 text-xs">{e.dept}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="progress-bar w-16 flex-shrink-0">
                                <div className="progress-fill" style={{ width: `${e.utilization}%`, background: e.utilization > 85 ? '#ef4444' : '#6366f1' }} />
                              </div>
                              <span className="text-xs font-mono text-slate-300">{e.utilization}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                                  style={{ background: sc?.bg, color: sc?.color }}>
                              {sc?.icon} {sc?.label}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs px-2 py-0.5 rounded font-semibold capitalize"
                                  style={{ background: rc?.bg, color: rc?.color }}>
                              {Math.round(e.failure_risk * 100)}% {e.failure_risk_level}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: e.is_critical ? '#ef4444' : '#475569' }} className="text-xs">
                              {e.is_critical ? '🔴 Yes' : '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Schedule */}
      {tab === 'maintenance' && (
        <div className="glass-card overflow-hidden animate-scale-in">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Upcoming Maintenance Schedule</h3>
            <span className="text-xs text-slate-500">{maintenanceSchedule.length} upcoming jobs</span>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Date</th><th>Equipment</th><th>Department</th><th>Type</th><th>Duration</th><th>Technician</th><th>Status</th></tr>
            </thead>
            <tbody>
              {maintenanceSchedule.map((m, i) => {
                const ss = SCHED_STYLE[m.status]
                return (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-1 text-xs"><Calendar size={10} className="text-slate-500" /> {m.date}</div>
                    </td>
                    <td className="font-medium text-slate-100 text-xs">{m.equipment}</td>
                    <td className="text-slate-400 text-xs">{m.dept}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{m.type}</span>
                    </td>
                    <td className="text-slate-400 text-xs">{m.duration}</td>
                    <td className="text-slate-400 text-xs">{m.tech}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold"
                            style={{ background: ss?.bg, color: ss?.color }}>{m.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Utilization Trends */}
      {tab === 'utilization' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">7-Day Equipment Utilization Trends</h3>
            <div className="flex gap-3 text-xs flex-wrap">
              {[['#6366f1','MRI'],['#ef4444','CT'],['#10b981','Ventilator'],['#f59e0b','Dialysis']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={utilizationTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                {[['mri','#6366f1'],['ct','#ef4444'],['vent','#10b981'],['dial','#f59e0b']].map(([id,c])=>(
                  <linearGradient key={id} id={`eq-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} unit="%" />
              <Tooltip
                formatter={(v: any, n: string) => [`${v}%`, n]}
                contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="mri"       name="MRI"        stroke="#6366f1" fill="url(#eq-mri)"  strokeWidth={2} />
              <Area type="monotone" dataKey="ct"        name="CT Scanner" stroke="#ef4444" fill="url(#eq-ct)"  strokeWidth={2} />
              <Area type="monotone" dataKey="ventilator" name="Ventilator" stroke="#10b981" fill="url(#eq-vent)" strokeWidth={2} />
              <Area type="monotone" dataKey="dialysis"  name="Dialysis"   stroke="#f59e0b" fill="url(#eq-dial)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
