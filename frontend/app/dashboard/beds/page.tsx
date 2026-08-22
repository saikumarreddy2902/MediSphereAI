'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Bed, Activity, AlertTriangle, CheckCircle2, RotateCcw, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { mockBedSummary, mockDepartmentPerformance } from '@/lib/mock-data'

const WARD_CONFIG = [
  { key: 'icu',       label: 'ICU',          color: '#ef4444', icon: '🏥' },
  { key: 'emergency', label: 'Emergency',     color: '#f97316', icon: '🚨' },
  { key: 'general',   label: 'General Ward',  color: '#3b82f6', icon: '🛏️'  },
  { key: 'private',   label: 'Private Rooms', color: '#8b5cf6', icon: '🏨' },
  { key: 'pediatric', label: 'Pediatric',     color: '#10b981', icon: '👶' },
  { key: 'maternity', label: 'Maternity',     color: '#ec4899', icon: '🤱' },
]

const mockTransferQueue = [
  { id: 'T-001', patient: 'Rajesh Kumar',  from: 'Emergency', to: 'ICU',          reason: 'Cardiac arrest stabilised', wait: '12 min', priority: 'critical' },
  { id: 'T-002', patient: 'Priya Sharma',  from: 'ICU',       to: 'General Ward', reason: 'Vitals stable, step-down', wait: '8 min',  priority: 'high' },
  { id: 'T-003', patient: 'Arjun Mehta',   from: 'Emergency', to: 'General Ward', reason: 'Observation complete',     wait: '5 min',  priority: 'medium' },
  { id: 'T-004', patient: 'Sunita Patel',  from: 'General',   to: 'Private Room', reason: 'Patient request upgrade',  wait: '22 min', priority: 'low' },
]

const mockTurnoverHistory = Array.from({ length: 7 }, (_, i) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return {
    day: days[i],
    admissions: Math.floor(40 + Math.random() * 20),
    discharges: Math.floor(35 + Math.random() * 20),
    transfers: Math.floor(8 + Math.random() * 10),
  }
})

const priorityStyle: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', label: 'CRITICAL' },
  high:     { bg: 'rgba(249,115,22,0.15)', text: '#f97316', label: 'HIGH' },
  medium:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: 'MEDIUM' },
  low:      { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e', label: 'LOW' },
}

function OccupancyRing({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const data = [{ value: pct }, { value: 100 - pct }]
  return (
    <RadialBarChart width={size} height={size} innerRadius={size * 0.35} outerRadius={size * 0.48}
      startAngle={90} endAngle={-270} data={[{ value: pct, fill: color }]}>
      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.05)' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill="#e2e8f0" fontSize={size * 0.2} fontWeight="700">{pct}%</text>
    </RadialBarChart>
  )
}

export default function BedsPage() {
  const [selectedWard, setSelectedWard] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'transfers' | 'turnover'>('overview')

  const total = mockBedSummary.total
  const overallOccupancy = Math.round((total.occupied / total.total) * 100)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Bed Intelligence &amp; Capacity</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time ward occupancy mapping, transfer queue, and predictive turnover analysis</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
             style={{ background: overallOccupancy > 85 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: overallOccupancy > 85 ? '#ef4444' : '#10b981', border: `1px solid ${overallOccupancy > 85 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
          <Bed size={15} />
          {total.occupied}/{total.total} beds occupied ({overallOccupancy}%)
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Beds',      value: total.total,    icon: <Bed size={18} />,           color: '#6366f1' },
          { label: 'Occupied',        value: total.occupied, icon: <Activity size={18} />,       color: '#ef4444' },
          { label: 'Available',       value: total.available,icon: <CheckCircle2 size={18} />,  color: '#10b981' },
          { label: 'Pending Turnover',value: 14,             icon: <RotateCcw size={18} />,     color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            </div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['overview', 'transfers', 'turnover'] as const).map(t => (
          <button key={t} id={`beds-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'overview' ? '🗺 Ward Map' : t === 'transfers' ? '🔄 Transfer Queue' : '📈 Turnover History'}
          </button>
        ))}
      </div>

      {/* Ward Map */}
      {tab === 'overview' && (
        <div className="space-y-4 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {WARD_CONFIG.map(ward => {
              const data = mockBedSummary[ward.key as keyof typeof mockBedSummary] as any
              if (!data) return null
              const pct = Math.round(data.occupancy_rate)
              const isSelected = selectedWard === ward.key
              return (
                <div key={ward.key} id={`ward-card-${ward.key}`}
                  className="glass-card p-5 cursor-pointer transition-all duration-300"
                  style={{ border: isSelected ? `1px solid ${ward.color}40` : undefined, boxShadow: isSelected ? `0 0 24px ${ward.color}20` : undefined }}
                  onClick={() => setSelectedWard(isSelected ? null : ward.key)}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ward.icon}</span>
                        <span className="font-bold text-slate-100">{ward.label}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{data.total} total beds</div>
                    </div>
                    <OccupancyRing pct={pct} color={pct > 85 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981'} size={72} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-white/5">
                    <div>
                      <div className="font-bold text-slate-200 text-base">{data.occupied}</div>
                      <div className="text-slate-500">Occupied</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-400 text-base">{data.available}</div>
                      <div className="text-slate-500">Available</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-400 text-base">{pct > 90 ? '⚠' : '✓'}</div>
                      <div className="text-slate-500">{pct > 90 ? 'Critical' : 'Normal'}</div>
                    </div>
                  </div>
                  {/* Occupancy bar */}
                  <div className="progress-bar mt-3">
                    <div className="progress-fill transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct > 85 ? 'linear-gradient(90deg,#ef4444,#f97316)' : pct > 70 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bar Chart: Per-ward comparison */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Ward Occupancy Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WARD_CONFIG.map(w => {
                const d = mockBedSummary[w.key as keyof typeof mockBedSummary] as any
                return d ? { ward: w.label, occupied: d.occupied, available: d.available, pct: Math.round(d.occupancy_rate) } : null
              }).filter(Boolean)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="ward" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="occupied" name="Occupied" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="available" name="Available" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transfer Queue */}
      {tab === 'transfers' && (
        <div className="space-y-4 animate-scale-in">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Pending Patient Transfers</h3>
              <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                {mockTransferQueue.length} pending
              </span>
            </div>
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Patient</th><th>From</th><th>To</th><th>Reason</th><th>Wait</th><th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {mockTransferQueue.map(t => {
                  const ps = priorityStyle[t.priority]
                  return (
                    <tr key={t.id}>
                      <td className="font-mono text-indigo-400 text-xs">{t.id}</td>
                      <td className="font-medium text-slate-100">{t.patient}</td>
                      <td className="text-slate-400">{t.from}</td>
                      <td>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ArrowRight size={12} /> {t.to}
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs">{t.reason}</td>
                      <td>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          <Clock size={11} /> {t.wait}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-bold"
                          style={{ background: ps.bg, color: ps.text }}>{ps.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Turnover History */}
      {tab === 'turnover' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">7-Day Bed Turnover History</h3>
            <div className="flex items-center gap-4 text-xs">
              {[['#6366f1','Admissions'],['#10b981','Discharges'],['#f59e0b','Transfers']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockTurnoverHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="admissions" name="Admissions" fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="discharges"  name="Discharges"  fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="transfers"   name="Transfers"   fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
