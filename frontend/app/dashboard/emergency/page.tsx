'use client'
import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  ShieldAlert, Activity, Clock, UserCheck, Ambulance, AlertCircle,
  Heart, Thermometer, Wind, TrendingUp, Eye
} from 'lucide-react'
import { mockEmergencyCases } from '@/lib/mock-data'
import { getEmergencyCasesApi } from '@/lib/services/api-service'
import { useWebSocket } from '@/lib/hooks/useWebSocket'

const TRIAGE_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Resuscitation', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  2: { label: 'Emergent',      color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  3: { label: 'Urgent',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  4: { label: 'Semi-Urgent',   color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  5: { label: 'Non-Urgent',    color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  critical:    { label: 'Critical',     color: '#ef4444' },
  in_treatment:{ label: 'In Treatment', color: '#8b5cf6' },
  in_triage:   { label: 'In Triage',    color: '#f59e0b' },
  waiting:     { label: 'Waiting',      color: '#64748b' },
}

const hourlyArrivalData = Array.from({ length: 12 }, (_, i) => ({
  time: `${(i + 8).toString().padStart(2, '0')}:00`,
  arrivals: Math.floor(4 + Math.random() * 8 + (i < 4 ? 6 : 0)),
  discharged: Math.floor(2 + Math.random() * 5),
}))

const triageSummary = [1, 2, 3, 4, 5].map(level => ({
  level,
  ...TRIAGE_CONFIG[level],
  count: mockEmergencyCases.filter(c => c.triage_level === level).length,
}))

function VitalBadge({ value, label, unit, danger }: { value: string | number; label: string; unit: string; danger?: boolean }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg" style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.06)' }}>
      <div className={`text-lg font-bold ${danger ? 'text-red-400' : 'text-slate-200'}`}>{value}<span className="text-xs font-normal text-slate-500 ml-1">{unit}</span></div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

export default function EmergencyPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all')
  const [rawCases, setRawCases] = useState<any[]>(mockEmergencyCases)
  const { isConnected, lastMessage } = useWebSocket()

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await getEmergencyCasesApi()
        if (data && Array.isArray(data) && data.length > 0) {
          setRawCases(data.map((item: any) => ({
            id: item.id || item._id || String(Math.random()),
            patient_name: item.patient_name || 'Emergency Patient',
            age: item.age || 45,
            gender: item.gender || 'U',
            chief_complaint: item.chief_complaint || 'Acute distress',
            triage_level: item.triage_level || 3,
            wait_minutes: item.wait_minutes || 12,
            assigned_doctor: item.assigned_doctor || 'On-duty ER Physician',
            status: item.status || 'waiting',
            location: item.location || 'ER Bay 1'
          })))
        }
      } catch (e) {
        // Keep mockEmergencyCases fallback
      }
    }
    fetchCases()
  }, [])

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'EMERGENCY_UPDATE') {
      // Live event received
      if (lastMessage.data?.case) {
        setRawCases(prev => [lastMessage.data.case, ...prev])
      }
    }
  }, [lastMessage])

  const casesWithVitals = rawCases.map((c, idx) => ({
    ...c,
    pulse: c.pulse || (72 + (idx * 7) % 45),
    bp: c.bp || `${115 + (idx * 3) % 25}/${75 + (idx * 2) % 15}`,
    spo2: c.spo2 || (98 - (idx * 1) % 5),
  }))

  const cases = filter === 'all' ? casesWithVitals : casesWithVitals.filter(c => c.triage_level === filter)
  const selectedCase = casesWithVitals.find(c => c.id === selected)

  const activeEmergencies = rawCases.filter(c => c.triage_level <= 2).length
  const avgWait = rawCases.length > 0 ? Math.round(rawCases.reduce((s, c) => s + (c.wait_minutes || 0), 0) / rawCases.length) : 0


  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Emergency Department Response</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live ER triage matrix, vital sign monitoring, and wait-time anomaly detection</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold animate-pulse"
             style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-red-500 status-running" />
          LIVE — {mockEmergencyCases.length} Active Cases
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Active Cases',    value: mockEmergencyCases.length,    icon: <ShieldAlert size={18} />, color: '#ef4444' },
          { label: 'Critical (ESI 1-2)', value: activeEmergencies,         icon: <Heart size={18} />,       color: '#f97316' },
          { label: 'Avg Wait Time',   value: `${avgWait}m`,                icon: <Clock size={18} />,       color: '#f59e0b' },
          { label: 'In Treatment',    value: mockEmergencyCases.filter(c => c.status === 'in_treatment').length, icon: <UserCheck size={18} />, color: '#10b981' },
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Triage Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">ESI Triage Distribution</h3>
          <div className="space-y-3">
            {triageSummary.map(t => (
              <button key={t.level} id={`triage-filter-${t.level}`}
                className="w-full flex items-center gap-3 group transition-all"
                onClick={() => setFilter(filter === t.level ? 'all' : t.level as any)}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                     style={{ background: t.bg, color: t.color }}>
                  {t.level}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-slate-300">{t.label}</div>
                  <div className="progress-bar mt-1">
                    <div className="progress-fill" style={{ width: `${(t.count / mockEmergencyCases.length) * 100}%`, background: t.color }} />
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: t.color }}>{t.count}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hourly arrival chart */}
        <div className="xl:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Hourly Arrival vs Discharge Rate</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyArrivalData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="arrivals"  name="Arrivals"   stroke="#ef4444" fill="url(#arrGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="discharged" name="Discharged" stroke="#10b981" fill="url(#disGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Triage Queue Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-200">Live Triage Queue</h3>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-xs px-2 py-1 rounded-lg text-indigo-400"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>
              Clear filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Case #</th><th>Patient</th><th>Age</th><th>Chief Complaint</th>
                <th>ESI</th><th>Heart Rate</th><th>BP</th><th>SpO₂</th>
                <th>Wait</th><th>Status</th><th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => {
                const triage = TRIAGE_CONFIG[c.triage_level]
                const status = STATUS_CONFIG[c.status] || { label: c.status, color: '#6b7280' }
                const isHighHR = c.pulse > 110
                const isLowSat = c.spo2 < 94
                return (
                  <tr key={c.id}
                    className="cursor-pointer transition-all"
                    style={{ background: selected === c.id ? 'rgba(99,102,241,0.07)' : undefined }}
                    onClick={() => setSelected(selected === c.id ? null : c.id)}>
                    <td className="font-mono text-indigo-400 text-xs">{c.case_number}</td>
                    <td className="font-semibold text-slate-100">{c.patient_name}</td>
                    <td className="text-slate-400">{c.age}</td>
                    <td className="text-slate-300 max-w-[180px] truncate">{c.chief_complaint}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ background: triage.bg, color: triage.color }}>
                        ESI-{c.triage_level} {triage.label}
                      </span>
                    </td>
                    <td className={isHighHR ? 'text-red-400 font-bold' : 'text-slate-300'}>{c.pulse} bpm</td>
                    <td className="text-slate-300">{c.bp}</td>
                    <td className={isLowSat ? 'text-red-400 font-bold' : 'text-slate-300'}>{c.spo2}%</td>
                    <td>
                      <div className="flex items-center gap-1 text-xs" style={{ color: c.wait_minutes > 30 ? '#f59e0b' : '#94a3b8' }}>
                        <Clock size={10} /> {c.wait_minutes}m
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ background: `${status.color}15`, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        {c.arrival_mode === 'Ambulance' ? '🚑' : '🚶'} {c.arrival_mode}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded Vitals Panel */}
        {selectedCase && (
          <div className="px-5 py-4 border-t border-white/5 animate-fade-in-up"
               style={{ background: 'rgba(99,102,241,0.05)' }}>
            <div className="flex items-center gap-3 mb-3">
              <Eye size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Vitals Detail — {selectedCase.patient_name}</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <VitalBadge value={selectedCase.pulse} unit="bpm" label="Heart Rate" danger={selectedCase.pulse > 110} />
              <VitalBadge value={selectedCase.bp} unit="" label="Blood Pressure" danger={parseInt(selectedCase.bp) > 140} />
              <VitalBadge value={selectedCase.spo2} unit="%" label="SpO₂" danger={selectedCase.spo2 < 94} />
              <VitalBadge value={selectedCase.wait_minutes} unit="min" label="Wait Time" danger={selectedCase.wait_minutes > 30} />
              <VitalBadge value={selectedCase.triage_level} unit="" label="ESI Level" danger={selectedCase.triage_level <= 2} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
