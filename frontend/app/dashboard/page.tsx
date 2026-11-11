'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Clock, Users, Bed, Activity, ShieldAlert,
  IndianRupee, Heart, Target, Sparkles, AlertCircle,
  Microscope, Pill, CreditCard, FileText, CheckCircle2, Bot,
  Stethoscope, CalendarCheck, ClipboardList, UserCheck, Plus, Search,
  HeartPulse, AlertTriangle, FileCheck, Check, ArrowRight
} from 'lucide-react'
import {
  mockKPIs, mockHourlyFlow, mockDailyRevenue,
  mockDepartmentPerformance, mockRecommendations, mockAgents,
  formatCurrency, formatNumber
} from '@/lib/mock-data'
import { getDashboardOverviewApi, acknowledgeRecommendationApi } from '@/lib/services/api-service'
import { useWebSocket } from '@/lib/hooks/useWebSocket'
import { api } from '@/lib/api'

// ─── KPI Card ────────────────────────────────────────────────
function KPICard({ label, value, unit, change, color, icon, id }: any) {
  const isPositive = change > 0
  return (
    <div id={id} className="kpi-card hover:shadow-card-hover group" style={{ '--accent-color': color } as any}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl transition-colors duration-300" style={{ background: `${color}15`, color: color }}>
          {icon}
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
             style={{ background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {isPositive ? '▲' : '▼'} {Math.abs(change)}%
        </div>
      </div>
      <div className="text-3xl font-display font-semibold tracking-tight mb-1" style={{ color: '#e2e8f0' }}>
        {value}<span className="text-sm font-medium ml-1.5" style={{ color: '#64748b' }}>{unit}</span>
      </div>
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</div>
      <div className="progress-bar mt-3">
        <div className="progress-fill" style={{ width: `${Math.min(100, parseFloat(value))}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Agent Status Mini ────────────────────────────────────────
function AgentMini({ agent }: any) {
  const colors: Record<string, string> = { running: '#10b981', idle: '#6b7280', error: '#ef4444' }
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg transition-all"
         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[agent.status] }} />
      <span className="text-xs truncate" style={{ color: '#94a3b8' }}>{agent.name.replace(' Agent', '')}</span>
      <span className="ml-auto text-xs" style={{ color: colors[agent.status] }}>{agent.status}</span>
    </div>
  )
}

// ─── Recommendation Card ──────────────────────────────────────
function RecommendationCard({ rec }: any) {
  const [acknowledged, setAcknowledged] = useState(rec.is_acknowledged)
  const priorityBg: Record<string, string> = {
    critical: 'rgba(239,68,68,0.1)',  high: 'rgba(249,115,22,0.1)',
    medium:   'rgba(245,158,11,0.1)', low:  'rgba(34,197,94,0.1)',
  }
  const priorityColor: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
  }

  const handleAcknowledge = async () => {
    const nextState = !acknowledged
    setAcknowledged(nextState)
    if (rec.id) {
      try {
        await acknowledgeRecommendationApi(rec.id)
      } catch (err) {
        console.warn('Recommendation acknowledge API call failed:', err)
      }
    }
  }

  return (
    <div className="p-4 rounded-xl transition-all border"
         style={{ background: priorityBg[rec.priority], borderColor: `${priorityColor[rec.priority]}30` }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: `${priorityColor[rec.priority]}20`, color: priorityColor[rec.priority] }}>
              {rec.priority}
            </span>
            <span className="text-xs" style={{ color: '#64748b' }}>{rec.agent}</span>
          </div>
          <p className="text-sm font-semibold mb-1 leading-tight" style={{ color: '#e2e8f0' }}>{rec.title}</p>
          <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>{rec.description}</p>
          {rec.impact && (
            <div className="mt-2 text-xs font-medium" style={{ color: priorityColor[rec.priority] }}>
              Impact: {rec.impact}
            </div>
          )}
        </div>
        <button
          onClick={handleAcknowledge}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          style={{ background: acknowledged ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', color: acknowledged ? '#10b981' : '#64748b' }}
          title={acknowledged ? 'Acknowledged' : 'Mark as acknowledged'}
        >
          <CheckCircle2 size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' && p.value > 10000 ? formatCurrency(p.value) : p.value}</strong></p>
      ))}
    </div>
  )
}

// ─── 1. EXECUTIVE / ADMIN DASHBOARD ───────────────────────────
function ExecutiveDashboard() {
  const [kpis, setKpis] = useState(mockKPIs)
  const [hourlyFlow, setHourlyFlow] = useState(mockHourlyFlow)
  const [deptPerf, setDeptPerf] = useState(mockDepartmentPerformance)
  const [recommendations, setRecommendations] = useState(mockRecommendations)
  const [isLive, setIsLive] = useState(false)
  const { isConnected: isWsConnected, lastMessage } = useWebSocket()

  useEffect(() => {
    async function loadLiveData() {
      try {
        const overview = await getDashboardOverviewApi()
        if (overview?.kpis) {
          setKpis(overview.kpis)
          setIsLive(true)
        }
        if (overview?.patient_flow) setHourlyFlow(overview.patient_flow)
        if (overview?.department_performance) setDeptPerf(overview.department_performance)
        if (overview?.top_recommendations) setRecommendations(overview.top_recommendations)
      } catch (err) {
        console.warn('Dashboard overview API unavailable, using fallback state:', err)
        setIsLive(false)
      }
    }
    loadLiveData()
  }, [])

  // Listen to live WebSocket telemetry broadcasts
  useEffect(() => {
    if (lastMessage?.data) {
      if (lastMessage.type === 'kpi_update') {
        setKpis(prev => ({ ...prev, ...lastMessage.data }))
      }
    }
  }, [lastMessage])

  const KPI_CARDS = [
    { id: 'kpi-waiting',       label: 'Avg Wait Time',        value: kpis.average_waiting_time, unit: 'min', change: -8.2,  color: '#6366f1', icon: <Clock size={22} /> },
    { id: 'kpi-throughput',    label: 'Patient Throughput',   value: kpis.patients_today,        unit: '/day',change: +12.4, color: '#10b981', icon: <Users size={22} /> },
    { id: 'kpi-bed',           label: 'Bed Occupancy',        value: kpis.bed_occupancy_rate,    unit: '%',   change: +3.1,  color: '#8b5cf6', icon: <Bed size={22} /> },
    { id: 'kpi-icu',           label: 'ICU Utilization',      value: kpis.icu_utilization,       unit: '%',   change: +5.8,  color: '#f43f5e', icon: <Activity size={22} /> },
    { id: 'kpi-emergency',     label: 'Emergency Response',   value: kpis.emergency_response_time,unit:'min', change: -14.2, color: '#ef4444', icon: <ShieldAlert size={22} /> },
    { id: 'kpi-revenue',       label: 'Daily Revenue',        value: '₹7.4L',                    unit: '',    change: +6.8,  color: '#f59e0b', icon: <IndianRupee size={22} /> },
    { id: 'kpi-satisfaction',  label: 'Patient Satisfaction', value: kpis.patient_satisfaction,  unit: '%',   change: +2.1,  color: '#22c55e', icon: <Heart size={22} /> },
    { id: 'kpi-score',         label: 'Performance Score',    value: kpis.hospital_performance_score, unit: '%', change: +1.4, color: '#0ea5e9', icon: <Target size={22} /> },
  ]

  const pieData = [
    { name: 'ICU',       value: 18, fill: '#8b5cf6' },
    { name: 'Emergency', value: 32, fill: '#ef4444' },
    { name: 'General',   value: 98, fill: '#3b82f6' },
    { name: 'Private',   value: 38, fill: '#f59e0b' },
    { name: 'Pediatric', value: 18, fill: '#10b981' },
    { name: 'Available', value: 57, fill: '#1e293b' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Alert Banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl shadow-[0_4px_24px_rgba(239,68,68,0.15)]"
           style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(12px)' }}>
        <AlertCircle className="text-red-500 animate-pulse-slow" size={20} />
        <p className="text-sm font-medium tracking-wide" style={{ color: '#fca5a5' }}>
          <span className="font-bold text-white mr-2">Critical Alert:</span> 
          ICU at 91.2% capacity · Emergency queue has {kpis.active_emergencies} active cases · 4 medicines critically low
        </p>
        <button className="ml-auto text-xs underline flex-shrink-0" style={{ color: '#f87171' }}>View all</button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {KPI_CARDS.map(card => <KPICard key={card.id} {...card} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Patient Flow — Today</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Hourly registrations, consultations & discharges</p>
            </div>
            <div className="flex gap-3 text-xs" style={{ color: '#475569' }}>
              {[{ color: '#6366f1', label: 'Registrations' }, { color: '#10b981', label: 'Consultations' }, { color: '#f59e0b', label: 'Discharges' }].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockHourlyFlow}>
              <defs>
                <linearGradient id="reg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="con" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} interval={3}/>
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="registrations" stroke="#6366f1" fill="url(#reg)" strokeWidth={2} name="Registrations"/>
              <Area type="monotone" dataKey="consultations" stroke="#10b981" fill="url(#con)" strokeWidth={2} name="Consultations"/>
              <Line type="monotone" dataKey="discharges"    stroke="#f59e0b" strokeWidth={2} dot={false} name="Discharges"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Bed Occupancy</h3>
          <p className="text-xs mb-4" style={{ color: '#475569' }}>218 / 275 beds occupied (84.7%)</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} beds`]} contentStyle={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 5).map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                <span style={{ color: '#64748b' }}>{d.name}</span>
                <span className="ml-auto font-medium" style={{ color: '#94a3b8' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue + Dept Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Revenue vs Cost — 30 Days</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Daily financial performance</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: '#10b981' }}>
                {formatCurrency(mockDailyRevenue.slice(-7).reduce((s, d) => s + d.profit, 0))}
              </div>
              <div className="text-xs" style={{ color: '#475569' }}>7-day profit</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockDailyRevenue.slice(-14)} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} interval={2}/>
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`}/>
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} name="Revenue" opacity={0.9}/>
              <Bar dataKey="cost"    fill="#ef4444" radius={[4,4,0,0]} name="Cost"    opacity={0.7}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Department Performance</h3>
          <div className="space-y-3">
            {mockDepartmentPerformance.map(dept => (
              <div key={dept.department}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{dept.department}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: dept.color }}>{dept.efficiency_score}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${dept.efficiency_score}%`, background: dept.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations + Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <Sparkles size={16} className="text-indigo-400" />
              AI Recommendations
            </h3>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              {mockRecommendations.filter(r => !r.is_acknowledged).length} pending
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {mockRecommendations.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <Bot size={16} className="text-indigo-400" />
              AI Agent Status
            </h3>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                {mockAgents.filter(a => a.status === 'running').length} running
              </span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {mockAgents.map(agent => <AgentMini key={agent.key} agent={agent} />)}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── 2. DOCTOR DASHBOARD ───────────────────────────────────────
function DoctorDashboard() {
  const [appointments, setAppointments] = useState([
    { id: 'APT-101', patient: 'Arjun Mehta', age: 42, type: 'In-Person', time: '10:00 AM', status: 'In Progress', reason: 'Chest Pain & Hypertension', allergies: ['Penicillin'], history: ['Hypertension', 'Elevated LDL'], pastMeds: ['Amlodipine 5mg'] },
    { id: 'APT-102', patient: 'Priya Sharma', age: 34, type: 'Teleconsult', time: '10:30 AM', status: 'Waiting', reason: 'Follow-up ECG Review', allergies: ['Sulfa'], history: ['Mild Asthma'], pastMeds: ['Salbutamol inhaler'] },
    { id: 'APT-103', patient: 'Rahul Verma', age: 58, type: 'In-Person', time: '11:15 AM', status: 'Scheduled', reason: 'Diabetic Foot Checkup', allergies: [], history: ['Type 2 Diabetes', 'Neuropathy'], pastMeds: ['Metformin 500mg'] },
    { id: 'APT-104', patient: 'Sneha Patel', age: 29, type: 'In-Person', time: '11:45 AM', status: 'Scheduled', reason: 'Thyroid Medication Review', allergies: ['Latex'], history: ['Hypothyroidism'], pastMeds: ['Thyronorm 50mcg'] },
  ])

  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)

  const pendingLabs = [
    { id: 'LAB-901', patient: 'Arjun Mehta', test: 'Troponin-T & Lipid Panel', status: 'CRITICAL', time: '10 min ago' },
    { id: 'LAB-904', patient: 'Rahul Verma', test: 'HbA1c & Fasting Glucose', status: 'READY', time: '35 min ago' },
    { id: 'LAB-908', patient: 'Meera Iyer', test: 'Serum Creatinine', status: 'READY', time: '1 hour ago' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Patient Clinical Assessment Drawer */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg h-full overflow-y-auto p-6 space-y-5 animate-slide-in-right"
               style={{ background: '#0f0f18', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Clinical Assessment EMR</span>
                <h3 className="text-xl font-bold text-slate-100">{selectedPatient.patient}</h3>
                <p className="text-xs text-slate-400">Age: {selectedPatient.age} · {selectedPatient.reason}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-2 rounded-lg text-slate-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Check size={18}/>
              </button>
            </div>

            {/* AI Highlighted Risk Factors */}
            <div className="p-4 rounded-xl space-y-2 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
              <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Sparkles size={14}/> AI Risk Summary &amp; Allergies
              </div>
              {selectedPatient.allergies?.length > 0 ? (
                <div className="text-xs text-slate-200">
                  <span className="text-red-400 font-semibold">Documented Allergies:</span> {selectedPatient.allergies.join(', ')} (Contraindicated)
                </div>
              ) : (
                <div className="text-xs text-slate-400">No known drug allergies reported.</div>
              )}
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Medical History:</span> {selectedPatient.history?.join(', ')}
              </div>
            </div>

            {/* AI Suggested Treatment Plan */}
            <div className="p-4 rounded-xl space-y-2 border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)' }}>
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Bot size={14}/> AI Suggested Treatment Plan
              </div>
              <p className="text-xs text-slate-300">
                Recommended ARB/CCB anti-hypertensive regimen. Avoid NSAIDs or beta-blocker interactions.
              </p>
              <div className="flex gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold text-indigo-300" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  Amlodipine 5mg OD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold text-indigo-300" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  Telmisartan 40mg OD
                </span>
              </div>
            </div>

            {/* Past Prescriptions */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Past Prescription History</h4>
              <div className="space-y-2">
                {selectedPatient.pastMeds?.map((med: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl flex items-center justify-between text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="font-medium text-slate-200">{med}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)' }}>Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Link href="/dashboard/prescriptions" className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>
                <Pill size={14}/> Issue Prescription for {selectedPatient.patient.split(' ')[0]}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Header Banner */}
      <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: '#10b981' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                🩺 Doctor Workstation
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>Cardiology Department</span>
            </div>
            <h2 className="text-2xl font-bold mt-1" style={{ color: '#e2e8f0' }}>Welcome, Dr. Kavya Reddy</h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>You have 12 consultations scheduled today · 3 critical lab results awaiting review</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/prescriptions" className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
              <Pill size={15}/> New Prescription
            </Link>
            <Link href="/dashboard/appointments" className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CalendarCheck size={15}/> Appointments Queue
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards for Doctor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Patients", value: '12', unit: 'scheduled', color: '#10b981', icon: <Users size={20}/> },
          { label: 'Completed', value: '5', unit: 'consulted', color: '#6366f1', icon: <CheckCircle2 size={20}/> },
          { label: 'Pending Lab Reviews', value: '3', unit: 'urgent', color: '#f59e0b', icon: <Microscope size={20}/> },
          { label: 'Active Inpatients', value: '8', unit: 'under care', color: '#8b5cf6', icon: <Bed size={20}/> },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ '--accent-color': kpi.color } as any}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${kpi.color}18`, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{kpi.value} <span className="text-xs font-normal" style={{ color: '#64748b' }}>{kpi.unit}</span></div>
            <div className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Appointments Queue & Pending Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Consultations List */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
                <Stethoscope size={16} className="text-emerald-400"/> Today's Consultation Schedule
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Click on a patient to view EMR chart, AI risk highlights &amp; clinical suggestions</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
              4 Remaining
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map(apt => (
              <div key={apt.id} onClick={() => setSelectedPatient(apt)}
                   className="p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:bg-white/5 cursor-pointer"
                   style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                       style={{ background: apt.status === 'In Progress' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(99,102,241,0.2)' }}>
                    {apt.patient[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{apt.patient}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Age {apt.age}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{apt.type}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>{apt.reason}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono font-medium" style={{ color: '#34d399' }}>{apt.time}</div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block mt-1"
                        style={{
                          background: apt.status === 'In Progress' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)',
                          color: apt.status === 'In Progress' ? '#34d399' : '#fbbf24'
                        }}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Lab Reports */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#e2e8f0' }}>
            <Microscope size={16} className="text-amber-400"/> Pending Lab Reviews
          </h3>
          <div className="space-y-3">
            {pendingLabs.map(lab => (
              <div key={lab.id} className="p-3.5 rounded-xl border space-y-1.5"
                   style={{
                     background: lab.status === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                     borderColor: lab.status === 'CRITICAL' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'
                   }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{lab.patient}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          background: lab.status === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                          color: lab.status === 'CRITICAL' ? '#f87171' : '#34d399'
                        }}>
                    {lab.status}
                  </span>
                </div>
                <div className="text-xs font-medium" style={{ color: '#818cf8' }}>{lab.test}</div>
                <div className="text-[11px] flex justify-between" style={{ color: '#64748b' }}>
                  <span>{lab.id}</span>
                  <span>{lab.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Link href="/dashboard/laboratory" className="text-xs text-indigo-400 hover:underline flex items-center justify-between">
              <span>View all lab orders</span> <ArrowRight size={13}/>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── 3. NURSE DASHBOARD ────────────────────────────────────────
function NurseDashboard() {
  const wards = [
    { name: 'ICU Ward A', bedsTotal: 20, bedsOccupied: 18, color: '#f43f5e', alert: '2 beds available' },
    { name: 'Emergency Triage', bedsTotal: 15, bedsOccupied: 12, color: '#ef4444', alert: '3 cases in queue' },
    { name: 'General Male Ward', bedsTotal: 40, bedsOccupied: 32, color: '#3b82f6', alert: 'Normal flow' },
    { name: 'General Female Ward', bedsTotal: 40, bedsOccupied: 35, color: '#10b981', alert: '5 beds available' },
  ]

  const medSchedule = [
    { time: '11:00 AM', patient: 'Vikram Singh', room: 'Bed B-104', med: 'IV Ceftriaxone 1g', status: 'DUE NOW' },
    { time: '11:30 AM', patient: 'Ananya Rao', room: 'Bed A-202', med: 'Insulin Glargine 12U', status: 'UPCOMING' },
    { time: '12:00 PM', patient: 'Suresh Menon', room: 'ICU Bed 03', med: 'Norepinephrine Infusion', status: 'MONITOR' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                🏥 Nurse Station
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>Shift: Day (07:00 - 15:00)</span>
            </div>
            <h2 className="text-2xl font-bold mt-1" style={{ color: '#e2e8f0' }}>Nurse Duty Station</h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Managing 97 occupied ward beds · 3 critical medication doses due next</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/beds" className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
              <Bed size={15}/> Ward Bed Map
            </Link>
            <Link href="/dashboard/emergency" className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ShieldAlert size={15}/> Triage Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Ward Occupancy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wards.map(ward => {
          const pct = Math.round((ward.bedsOccupied / ward.bedsTotal) * 100)
          return (
            <div key={ward.name} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{ward.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${ward.color}20`, color: ward.color }}>
                  {pct}%
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
                {ward.bedsOccupied} <span className="text-xs font-normal" style={{ color: '#64748b' }}>/ {ward.bedsTotal} beds</span>
              </div>
              <div className="progress-bar mt-2">
                <div className="progress-fill" style={{ width: `${pct}%`, background: ward.color }} />
              </div>
              <div className="text-[11px] mt-2" style={{ color: '#94a3b8' }}>{ward.alert}</div>
            </div>
          )
        })}
      </div>

      {/* Medication Schedule & Patient Care */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#e2e8f0' }}>
            <Pill size={16} className="text-amber-400"/> Medication Administration Schedule (MAR)
          </h3>
          <div className="space-y-3">
            {medSchedule.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border flex items-center justify-between gap-4"
                   style={{
                     background: item.status === 'DUE NOW' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                     borderColor: item.status === 'DUE NOW' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'
                   }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                       style={{ background: item.status === 'DUE NOW' ? '#ef4444' : '#6366f1' }}>
                    {item.time.split(' ')[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{item.patient} <span className="text-xs font-normal" style={{ color: '#818cf8' }}>({item.room})</span></div>
                    <div className="text-xs font-mono text-amber-300 mt-0.5">{item.med}</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: item.status === 'DUE NOW' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                          color: item.status === 'DUE NOW' ? '#fff' : '#94a3b8'
                        }}>
                  {item.status === 'DUE NOW' ? '✓ Mark Administered' : item.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#e2e8f0' }}>
            <HeartPulse size={16} className="text-red-400"/> Vitals Alert Monitor
          </h3>
          <div className="space-y-3">
            {[
              { patient: 'Suresh Menon', room: 'ICU-03', stat: 'BP 158/98 mmHg', level: 'HIGH' },
              { patient: 'Kiran Bala', room: 'Ward 12', stat: 'SpO2 92%', level: 'WARNING' },
              { patient: 'Lata Patil', room: 'Ward 04', stat: 'Temp 101.4°F', level: 'FEVER' },
            ].map((v, idx) => (
              <div key={idx} className="p-3 rounded-xl border flex items-center justify-between"
                   style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{v.patient} ({v.room})</div>
                  <div className="text-xs mt-0.5" style={{ color: '#f87171' }}>{v.stat}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {v.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── 4. PATIENT DASHBOARD ──────────────────────────────────────
function PatientDashboard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([
    { id: 'PRX-001', name: 'Amlodipine 5mg', dosage: '1 tablet daily after breakfast', doctor: 'Dr. Kavya Reddy', remaining: '14 days', instructions: 'Take with full glass of water. Avoid grapefruit juice.' },
    { id: 'PRX-002', name: 'Metformin 500mg', dosage: '1 tablet twice daily with meals', doctor: 'Dr. Suresh Nair', remaining: '22 days', instructions: 'Take with food to minimize gastrointestinal side effects.' },
  ])
  const [refillToast, setRefillToast] = useState<string | null>(null)
  const [expandedPrx, setExpandedPrx] = useState<string | null>(null)

  const appointments = [
    { doctor: 'Dr. Kavya Reddy', spec: 'Cardiology', date: 'Tomorrow, 10:30 AM', location: 'OPD Block B, Room 204' },
  ]

  useEffect(() => {
    api.get('/prescriptions/')
      .then((res: any) => {
        if (res.data && res.data.length > 0) {
          const liveList = res.data.flatMap((p: any) =>
            p.medications.map((m: any) => ({
              id: p.id,
              name: `${m.medicine_name} ${m.dosage}`,
              dosage: `${m.frequency} for ${m.duration_days} days (${m.route})`,
              doctor: 'Dr. Kavya Reddy',
              remaining: `${m.duration_days} days`,
              instructions: m.special_instructions || 'Take as prescribed by doctor.',
            }))
          )
          if (liveList.length > 0) setPrescriptions(liveList)
        }
      })
      .catch(() => {})
  }, [])

  const handleRequestRefill = (medName: string) => {
    setRefillToast(`Refill request for ${medName} submitted to pharmacy & prescribing doctor.`)
    setTimeout(() => setRefillToast(null), 4000)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {refillToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl text-xs font-semibold shadow-2xl animate-fade-in-up"
             style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', backdropFilter: 'blur(10px)' }}>
          ✅ {refillToast}
        </div>
      )}

      {/* Patient Header Banner */}
      <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: '#ec4899' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                👤 Patient Portal
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>UHID: MEDI-884920</span>
            </div>
            <h2 className="text-2xl font-bold mt-1" style={{ color: '#e2e8f0' }}>Welcome, Arjun Mehta</h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Your next appointment is scheduled for tomorrow at 10:30 AM</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/appointments" className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#fff' }}>
              <CalendarCheck size={15}/> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Visits', value: '1', unit: 'scheduled', color: '#ec4899', icon: <CalendarCheck size={20}/> },
          { label: 'Active Prescriptions', value: prescriptions.length.toString(), unit: 'medications', color: '#10b981', icon: <Pill size={20}/> },
          { label: 'Lab Reports Ready', value: '1', unit: 'new report', color: '#6366f1', icon: <Microscope size={20}/> },
          { label: 'Pending Invoice', value: '₹1,200', unit: 'copay', color: '#f59e0b', icon: <CreditCard size={20}/> },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ '--accent-color': kpi.color } as any}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${kpi.color}18`, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{kpi.value} <span className="text-xs font-normal" style={{ color: '#64748b' }}>{kpi.unit}</span></div>
            <div className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Main Patient Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Appointments */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <CalendarCheck size={16} className="text-pink-400"/> Upcoming Appointments
            </h3>
            <Link href="/dashboard/appointments" className="text-xs text-pink-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {appointments.map((apt, idx) => (
              <div key={idx} className="p-4 rounded-xl border space-y-2" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{apt.doctor}</div>
                    <div className="text-xs" style={{ color: '#ec4899' }}>{apt.spec}</div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                    Confirmed
                  </span>
                </div>
                <div className="text-xs pt-1 border-t flex justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                  <span>🗓 {apt.date}</span>
                  <span>📍 {apt.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Prescriptions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <Pill size={16} className="text-emerald-400"/> Active Prescriptions &amp; Dosage Instructions
            </h3>
            <Link href="/dashboard/prescriptions" className="text-xs text-emerald-400 hover:underline">Prescription portal →</Link>
          </div>
          <div className="space-y-3">
            {prescriptions.map((rx, idx) => {
              const isExp = expandedPrx === rx.name
              return (
                <div key={idx} className="p-3.5 rounded-xl border space-y-2"
                     style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedPrx(isExp ? null : rx.name)}>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        {rx.name}
                        <span className="text-[10px] text-slate-500 font-normal">▾</span>
                      </div>
                      <div className="text-xs mt-0.5 text-slate-400">{rx.dosage}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                        {rx.remaining}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); handleRequestRefill(rx.name) }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
                              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                        Request Refill
                      </button>
                    </div>
                  </div>
                  {isExp && (
                    <div className="p-2.5 rounded-lg text-xs space-y-1 mt-2 border-t pt-2"
                         style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)', color: '#cbd5e1' }}>
                      <p className="font-semibold text-indigo-300">📋 Dosage Instructions:</p>
                      <p>{rx.instructions}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Prescribed by {rx.doctor}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── DYNAMIC DASHBOARD ROUTER ──────────────────────────────────
export default function DashboardPage() {
  const [role, setRole] = useState<string>('admin')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const syncRole = () => {
      const stored = localStorage.getItem('medisphere_user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          setRole(u.role || u.username || 'admin')
        } catch (e) {
          setRole('admin')
        }
      }
    }
    syncRole()
    window.addEventListener('medisphere_user_changed', syncRole)
    return () => window.removeEventListener('medisphere_user_changed', syncRole)
  }, [])

  if (!mounted) return null

  switch (role.toLowerCase()) {
    case 'doctor':
      return <DoctorDashboard />
    case 'nurse':
      return <NurseDashboard />
    case 'patient':
      return <PatientDashboard />
    case 'admin':
    default:
      return <ExecutiveDashboard />
  }
}
