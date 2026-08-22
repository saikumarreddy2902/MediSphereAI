'use client'
import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import {
  TrendingUp, Brain, Target, Activity, Users, Bed,
  Clock, AlertTriangle, Sparkles, ChevronRight, Calendar
} from 'lucide-react'
import { mockKPIs, mockBedSummary, mockDepartmentPerformance, formatCurrency } from '@/lib/mock-data'

// ─── Forecast Data ────────────────────────────────────────────────────────────
const occupancyForecast = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(); date.setDate(date.getDate() + i - 3)
  const label = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  const isPast = i < 3
  const base = 78 + Math.sin(i * 0.6) * 10 + Math.random() * 5
  const predicted = !isPast ? base + Math.random() * 8 : null
  const lower     = predicted !== null ? predicted - 4 : null
  const upper     = predicted !== null ? predicted + 6 : null
  return { label, actual: isPast ? Math.round(base) : null, predicted: predicted ? Math.round(predicted) : null, lower: lower ? Math.round(lower) : null, upper: upper ? Math.round(upper) : null }
})

const patientFlowForecast = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
  day: d,
  forecast: Math.floor(300 + Math.random() * 100),
  admissions: Math.floor(40 + Math.random() * 20),
  discharges: Math.floor(35 + Math.random() * 20),
}))

const performanceRadar = [
  { metric: 'Bed Utilization',  value: mockKPIs.bed_occupancy_rate,     target: 85 },
  { metric: 'Patient Flow',     value: mockKPIs.doctor_utilization,      target: 80 },
  { metric: 'Staff Efficiency', value: mockKPIs.nurse_utilization,       target: 85 },
  { metric: 'Satisfaction',     value: mockKPIs.patient_satisfaction,    target: 90 },
  { metric: 'Revenue',          value: mockKPIs.insurance_approval_rate, target: 85 },
  { metric: 'Equipment',        value: mockKPIs.equipment_utilization,   target: 80 },
]

const bottleneckInsights = [
  { area: 'Emergency Department', risk: 'High',    description: 'Arrival rate will peak at ~18 patients/hr by 14:00 tomorrow. Current capacity: 12/hr.',        action: 'Add 2 physicians on emergency rotation', impact: 'Reduce wait 22 min', color: '#ef4444' },
  { area: 'ICU Bed Availability', risk: 'High',    description: 'ICU occupancy forecast to reach 96% by 22:00 tonight. 3 planned admissions pending.',          action: 'Initiate 3 step-down transfers now',     impact: 'Free 3 ICU beds',    color: '#f97316' },
  { area: 'Lab Turnaround Time',  risk: 'Medium',  description: 'STAT TAT trending 34% above threshold for Cardiac panel. Reagent calibration overdue.',        action: 'Schedule analyzer calibration at 18:00', impact: 'Reduce TAT 8 min',    color: '#f59e0b' },
  { area: 'Pharmacy Stock',       risk: 'Medium',  description: 'Ceftriaxone 1g and Morphine projected to stock-out within 5 days at current consumption rate.', action: 'Initiate emergency purchase order',      impact: 'Prevent stockout',   color: '#f59e0b' },
  { area: 'Staff Coverage',       risk: 'Low',     description: 'Night shift (22:00-06:00) has 94% coverage. Minor gap in Pediatric nursing.',                   action: 'Reassign 1 nurse from General Ward',     impact: 'Maintain 1:2 ratio',  color: '#22c55e' },
]

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
}

const kpiHistory = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(); date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    beds: Math.round(78 + Math.random() * 14),
    patients: Math.floor(290 + Math.random() * 80),
    satisfaction: Math.round(82 + Math.random() * 10),
  }
})

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'forecast' | 'bottlenecks' | 'history' | 'radar'>('forecast')

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Predictive Analytics &amp; Forecasting</h2>
          <p className="text-xs text-slate-400 mt-0.5">AI-driven capacity forecasting, bottleneck detection, and hospital performance intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
             style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
          <Brain size={13} /> AI Forecast Updated 2 min ago
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Performance Score',   value: `${mockKPIs.hospital_performance_score}%`, icon: <Target size={18} />,   color: '#6366f1' },
          { label: 'Predicted Peak Occ.', value: '92%',                                     icon: <Bed size={18} />,      color: '#ef4444' },
          { label: 'Bottlenecks Detected',value: bottleneckInsights.length,                  icon: <AlertTriangle size={18}/>, color: '#f59e0b' },
          { label: 'Avg Patient Sat.',    value: `${mockKPIs.patient_satisfaction}%`,        icon: <Sparkles size={18} />, color: '#10b981' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Peak Forecast Alert */}
      <div className="glass-card p-4 border-l-4 border-amber-500" style={{ background: 'rgba(245,158,11,0.05)' }}>
        <div className="flex items-start gap-3">
          <Brain size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">AI Forecast: Occupancy will peak at 92% tomorrow at 14:00</p>
            <p className="text-xs text-slate-400 mt-1">Based on 30-day rolling averages, seasonal patterns, and real-time admission pipeline. 5 actionable interventions available.</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-400 flex-shrink-0 cursor-pointer hover:gap-2 transition-all">
            View Actions <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['forecast', 'bottlenecks', 'history', 'radar'] as const).map(t => (
          <button key={t} id={`analytics-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'forecast' ? '🔮 Occupancy Forecast' : t === 'bottlenecks' ? '⚠ Bottlenecks' : t === 'history' ? '📈 KPI History' : '🕸 Performance Radar'}
          </button>
        ))}
      </div>

      {/* Occupancy Forecast */}
      {tab === 'forecast' && (
        <div className="space-y-4 animate-scale-in">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">14-Day Bed Occupancy Forecast</h3>
              <div className="flex gap-4 text-xs">
                {[['#6366f1','Actual'],['#f59e0b','Predicted'],['rgba(245,158,11,0.25)','Confidence Band']].map(([c,l])=>(
                  <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={occupancyForecast} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} unit="%" />
                <Tooltip
                  formatter={(v: any, n: string) => [v !== null ? `${v}%` : 'N/A', n]}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="actual"    name="Actual"    stroke="#6366f1" fill="url(#actGrad)"  strokeWidth={2.5} connectNulls={false} />
                <Area type="monotone" dataKey="upper"     name="Upper CI"  stroke="none"   fill="rgba(245,158,11,0.12)" strokeWidth={0} />
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" fill="url(#predGrad)" strokeWidth={2} strokeDasharray="6 3" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Weekly Patient Volume Forecast</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patientFlowForecast} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="admissions" name="Admissions" fill="#6366f1" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="discharges" name="Discharges" fill="#10b981" radius={[3,3,0,0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {tab === 'bottlenecks' && (
        <div className="space-y-3 animate-scale-in">
          {bottleneckInsights.map((b, i) => {
            const rs = RISK_STYLE[b.risk]
            return (
              <div key={i} className="glass-card p-5 flex gap-4 items-start hover:translate-y-0 transition-all"
                   style={{ borderLeft: `3px solid ${b.color}` }}>
                <div className="flex-shrink-0 pt-0.5">
                  <span className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: rs.bg, color: rs.color }}>{b.risk}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 text-sm mb-1">{b.area}</div>
                  <p className="text-xs text-slate-400 mb-2">{b.description}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#818cf8' }}>
                      <ChevronRight size={12} />
                      <span className="font-medium">{b.action}</span>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded"
                         style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      Impact: {b.impact}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* KPI History */}
      {tab === 'history' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">30-Day KPI Trend History</h3>
            <div className="flex gap-4 text-xs">
              {[['#6366f1','Bed Occ %'],['#10b981','Satisfaction %']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={kpiHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} interval={4} />
              <YAxis domain={[70, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} unit="%" />
              <Tooltip
                formatter={(v: any, n: string) => [`${v}%`, n]}
                contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Line type="monotone" dataKey="beds"         name="Bed Occupancy"  stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="satisfaction" name="Satisfaction"   stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Radar */}
      {tab === 'radar' && (
        <div className="glass-card p-5 animate-scale-in">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Hospital Performance Radar vs Targets</h3>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={performanceRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
              <Radar name="Current"  dataKey="value"  stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              <Radar name="Target"   dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
              <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-xs mt-2">
            {[['#6366f1','Current Performance'],['#10b981','Target Benchmark']].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
