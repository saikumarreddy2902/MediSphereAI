'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line
} from 'recharts'
import {
  TestTube2, Clock, CheckCircle2, AlertCircle,
  Microscope, Activity, Timer, Search, FlaskConical
} from 'lucide-react'

const mockLabOrders = [
  { id: 'L-5501', patient: 'P-0041', name: 'Rajesh Kumar',  test: 'Troponin-I (STAT)',           panel: 'Cardiac',     ordered: '15:20', status: 'Resulted',     tat: 18, priority: 'STAT',    result: '2.4 ng/mL ↑',  abnormal: true  },
  { id: 'L-5502', patient: 'P-0042', name: 'Priya Devi',    test: 'D-Dimer (STAT)',               panel: 'Coagulation', ordered: '15:18', status: 'Processing',   tat: 22, priority: 'STAT',    result: null,           abnormal: false },
  { id: 'L-5503', patient: 'P-0043', name: 'Arjun Singh',   test: 'CBC with Differential',        panel: 'Haematology', ordered: '15:10', status: 'Resulted',     tat: 28, priority: 'Routine', result: 'WBC 12.4 ↑',   abnormal: true  },
  { id: 'L-5504', patient: 'P-0045', name: 'Vikram P.',     test: 'HbA1c',                        panel: 'Endocrine',   ordered: '14:55', status: 'Processing',   tat: 35, priority: 'Routine', result: null,           abnormal: false },
  { id: 'L-5505', patient: 'P-0046', name: 'Sunita Rao',    test: 'Lipid Profile',                panel: 'Biochemistry',ordered: '14:48', status: 'Resulted',     tat: 42, priority: 'Routine', result: 'LDL 182 ↑',    abnormal: true  },
  { id: 'L-5506', patient: 'P-0047', name: 'Mohammed A.',   test: 'PT/INR (STAT)',                panel: 'Coagulation', ordered: '14:42', status: 'Collection',   tat: null, priority: 'STAT', result: null,           abnormal: false },
  { id: 'L-5507', patient: 'P-0048', name: 'Deepa Gupta',   test: 'ABG (STAT)',                   panel: 'Respiratory', ordered: '14:35', status: 'Resulted',     tat: 12, priority: 'STAT',    result: 'pH 7.31 ↓',    abnormal: true  },
  { id: 'L-5508', patient: 'P-0049', name: 'Suresh Iyer',   test: 'LFT Panel',                   panel: 'Biochemistry',ordered: '14:20', status: 'Resulted',     tat: 55, priority: 'Routine', result: 'ALT 88 ↑',     abnormal: true  },
  { id: 'L-5509', patient: 'P-0050', name: 'Ananya Menon',  test: 'Group & Screen',               panel: 'Transfusion', ordered: '14:15', status: 'Processing',   tat: 30, priority: 'STAT',    result: null,           abnormal: false },
  { id: 'L-5510', patient: 'P-0043', name: 'Arjun Singh',   test: 'Procalcitonin',                panel: 'Infection',   ordered: '14:00', status: 'Resulted',     tat: 68, priority: 'Routine', result: '0.8 ng/mL',    abnormal: false },
]

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Resulted:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  Processing: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  Collection: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  Pending:    { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

const panelDist = Array.from(
  mockLabOrders.reduce((acc, o) => {
    acc.set(o.panel, (acc.get(o.panel) || 0) + 1); return acc
  }, new Map<string, number>())
).map(([panel, count]) => ({ panel, count }))

const hourlyTAT = Array.from({ length: 8 }, (_, i) => ({
  hour: `${(i + 8).toString().padStart(2, '0')}:00`,
  stat_tat: Math.floor(15 + Math.random() * 12),
  routine_tat: Math.floor(35 + Math.random() * 25),
  volume: Math.floor(8 + Math.random() * 12),
}))

const PANEL_COLORS: Record<string, string> = {
  Cardiac: '#ef4444', Coagulation: '#f97316', Haematology: '#6366f1',
  Biochemistry: '#3b82f6', Endocrine: '#8b5cf6', Respiratory: '#10b981',
  Transfusion: '#ec4899', Infection: '#f59e0b',
}

export default function LaboratoryPage() {
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'STAT' | 'Routine'>('all')
  const [tab, setTab] = useState<'orders' | 'tat' | 'panels'>('orders')

  const statOrders    = mockLabOrders.filter(o => o.priority === 'STAT').length
  const resulted      = mockLabOrders.filter(o => o.status === 'Resulted').length
  const abnormalCount = mockLabOrders.filter(o => o.abnormal).length
  const avgTAT        = Math.round(mockLabOrders.filter(o => o.tat !== null).reduce((s, o) => s + (o.tat || 0), 0) / mockLabOrders.filter(o => o.tat !== null).length)

  const filtered = mockLabOrders.filter(o => {
    const matchSearch = search === '' || o.test.toLowerCase().includes(search.toLowerCase()) || o.name.toLowerCase().includes(search.toLowerCase()) || o.panel.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter
    return matchSearch && matchPriority
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Laboratory Diagnostics</h2>
          <p className="text-xs text-slate-400 mt-0.5">STAT specimen processing, turnaround time telemetry, and abnormal result flagging</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
             style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
          <TestTube2 size={13} /> {statOrders} STAT orders active
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Lab Orders',  value: mockLabOrders.length, icon: <FlaskConical size={18} />, color: '#6366f1' },
          { label: 'STAT Orders',       value: statOrders,           icon: <Timer size={18} />,        color: '#ef4444' },
          { label: 'Resulted',          value: resulted,             icon: <CheckCircle2 size={18} />, color: '#10b981' },
          { label: 'Abnormal Results',  value: abnormalCount,        icon: <AlertCircle size={18} />,  color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Avg TAT Banner */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
          <Clock size={20} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-200">Average Turnaround Time Today</div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${Math.min(100, (avgTAT / 60) * 100)}%`, background: avgTAT < 30 ? '#10b981' : avgTAT < 60 ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold" style={{ color: avgTAT < 30 ? '#10b981' : avgTAT < 60 ? '#f59e0b' : '#ef4444' }}>{avgTAT} min</div>
          <div className="text-xs text-slate-500">Target: &lt;30 min (STAT)</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['orders', 'tat', 'panels'] as const).map(t => (
          <button key={t} id={`lab-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'orders' ? '🔬 Active Orders' : t === 'tat' ? '⏱ TAT Analysis' : '🧬 Panel Distribution'}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-3 animate-scale-in">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="lab-search" type="text" placeholder="Search test, patient, or panel…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'STAT', 'Routine'] as const).map(p => (
                <button key={p} id={`lab-priority-${p}`} onClick={() => setPriorityFilter(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: priorityFilter === p ? (p === 'STAT' ? 'rgba(239,68,68,0.15)' : p === 'Routine' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.04)',
                    color: priorityFilter === p ? (p === 'STAT' ? '#ef4444' : p === 'Routine' ? '#818cf8' : '#94a3b8') : '#64748b',
                    border: `1px solid ${priorityFilter === p ? (p === 'STAT' ? 'rgba(239,68,68,0.3)' : p === 'Routine' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr><th>Order ID</th><th>Patient</th><th>Test</th><th>Panel</th><th>Ordered</th><th>Priority</th><th>Status</th><th>TAT</th><th>Result</th></tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const ss = STATUS_STYLE[o.status]
                  return (
                    <tr key={o.id} style={{ background: o.abnormal && o.status === 'Resulted' ? 'rgba(239,68,68,0.03)' : undefined }}>
                      <td className="font-mono text-xs text-indigo-400">{o.id}</td>
                      <td>
                        <div className="text-xs">
                          <div className="font-medium text-slate-100">{o.name}</div>
                          <div className="text-slate-500 font-mono">{o.patient}</div>
                        </div>
                      </td>
                      <td className="font-medium text-slate-200 text-xs max-w-[160px]">{o.test}</td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ background: `${PANEL_COLORS[o.panel] || '#6366f1'}15`, color: PANEL_COLORS[o.panel] || '#818cf8' }}>
                          {o.panel}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Clock size={10}/>{o.ordered}</div>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-bold"
                              style={{ background: o.priority === 'STAT' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.1)', color: o.priority === 'STAT' ? '#ef4444' : '#818cf8' }}>
                          {o.priority}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ background: ss.bg, color: ss.color }}>{o.status}</span>
                      </td>
                      <td>
                        {o.tat !== null
                          ? <span className="font-mono text-xs" style={{ color: o.tat > 30 ? '#f59e0b' : '#10b981' }}>{o.tat}m</span>
                          : <span className="text-xs text-slate-600">—</span>}
                      </td>
                      <td>
                        {o.result
                          ? <span className={`text-xs font-semibold ${o.abnormal ? 'text-red-400' : 'text-emerald-400'}`}>
                              {o.abnormal ? '⚠ ' : '✓ '}{o.result}
                            </span>
                          : <span className="text-xs text-slate-600">Pending…</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAT Analysis */}
      {tab === 'tat' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Turnaround Time by Hour (STAT vs Routine)</h3>
            <div className="flex gap-4 text-xs">
              {[['#ef4444','STAT TAT'],['#6366f1','Routine TAT']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={hourlyTAT} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} unit=" min" />
              <Tooltip
                formatter={(v: any, n: string) => [`${v} min`, n]}
                contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Line type="monotone" dataKey="stat_tat"     name="STAT TAT"    stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
              <Line type="monotone" dataKey="routine_tat"  name="Routine TAT" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Panel Distribution */}
      {tab === 'panels' && (
        <div className="glass-card p-5 animate-scale-in">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Order Volume by Panel Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={panelDist} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="panel" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="count" name="Orders" radius={[4,4,0,0]}>
                {panelDist.map((entry, i) => (
                  <Bar key={i} dataKey="count" fill={PANEL_COLORS[entry.panel] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
