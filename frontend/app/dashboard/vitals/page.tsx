'use client'
import { useState, useEffect, useCallback } from 'react'
import { Activity, Heart, Wind, Thermometer, Droplets, AlertTriangle, RefreshCw, WifiOff, Wifi, Bell, BellOff, Search } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface VitalsReading {
  timestamp: string
  heart_rate: number
  systolic: number
  diastolic: number
  spo2: number
  temperature: number
  respiratory_rate: number
}

interface PatientVitals {
  patient_id: string
  patient_name: string
  ward: string
  bed: string
  age: number
  condition: 'STABLE' | 'MONITORED' | 'CRITICAL'
  current: VitalsReading
  history: VitalsReading[]
  alerts: string[]
}

// ─── Alert Thresholds ─────────────────────────────────────────────────────────
const THRESHOLDS = {
  heart_rate:        { low: 50, high: 120 },
  systolic:          { low: 90, high: 160 },
  diastolic:         { low: 60, high: 100 },
  spo2:              { low: 94, high: 100 },
  temperature:       { low: 36.0, high: 38.5 },
  respiratory_rate:  { low: 12, high: 24 },
}

function isAlert(key: keyof typeof THRESHOLDS, value: number): 'critical' | 'warning' | 'ok' {
  const t = THRESHOLDS[key]
  if (value < t.low || value > t.high) {
    const diff = key === 'spo2' ? t.low - value : Math.max(value - t.high, t.low - value)
    return diff > 10 ? 'critical' : 'warning'
  }
  return 'ok'
}

// ─── Generate simulated vitals ────────────────────────────────────────────────
function generateVitals(base: Partial<VitalsReading>, condition: string): VitalsReading {
  const noise = (n: number) => n + (Math.random() - 0.5) * (condition === 'CRITICAL' ? 8 : 3)
  return {
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heart_rate:       Math.round(noise(base.heart_rate ?? 75)),
    systolic:         Math.round(noise(base.systolic ?? 120)),
    diastolic:        Math.round(noise(base.diastolic ?? 80)),
    spo2:             Math.round(Math.min(100, noise(base.spo2 ?? 98))),
    temperature:      Math.round(noise(base.temperature ?? 37.0) * 10) / 10,
    respiratory_rate: Math.round(noise(base.respiratory_rate ?? 16)),
  }
}

// ─── Initial patients data ────────────────────────────────────────────────────
const INIT_BASES: Omit<PatientVitals, 'current' | 'history' | 'alerts'>[] = [
  { patient_id: 'P-001', patient_name: 'Arjun Mehta', ward: 'ICU', bed: 'ICU-3A', age: 52, condition: 'CRITICAL' },
  { patient_id: 'P-002', patient_name: 'Priya Sharma', ward: 'Cardiac', bed: 'C-7', age: 34, condition: 'MONITORED' },
  { patient_id: 'P-003', patient_name: 'Rahul Verma', ward: 'General', bed: 'G-12', age: 68, condition: 'STABLE' },
  { patient_id: 'P-004', patient_name: 'Sneha Patel', ward: 'Post-Op', bed: 'PO-2', age: 45, condition: 'MONITORED' },
  { patient_id: 'P-005', patient_name: 'Vikram Nair', ward: 'ICU', bed: 'ICU-1B', age: 61, condition: 'CRITICAL' },
  { patient_id: 'P-006', patient_name: 'Meera Iyer', ward: 'General', bed: 'G-5', age: 29, condition: 'STABLE' },
]

const CRITICAL_BASES: Record<string, Partial<VitalsReading>> = {
  'P-001': { heart_rate: 135, systolic: 165, diastolic: 105, spo2: 91, temperature: 39.2, respiratory_rate: 26 },
  'P-005': { heart_rate: 48, systolic: 85, diastolic: 55, spo2: 89, temperature: 38.8, respiratory_rate: 28 },
}
const MONITORED_BASES: Record<string, Partial<VitalsReading>> = {
  'P-002': { heart_rate: 92, systolic: 145, diastolic: 95, spo2: 95, temperature: 37.8, respiratory_rate: 20 },
  'P-004': { heart_rate: 88, systolic: 130, diastolic: 88, spo2: 96, temperature: 37.5, respiratory_rate: 18 },
}

function initPatient(p: typeof INIT_BASES[0]): PatientVitals {
  const base = CRITICAL_BASES[p.patient_id] || MONITORED_BASES[p.patient_id] || {}
  const history = Array.from({ length: 15 }, (_, i) => ({
    ...generateVitals(base, p.condition),
    timestamp: new Date(Date.now() - (15 - i) * 30000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }))
  const current = generateVitals(base, p.condition)
  const alerts: string[] = []
  if (isAlert('heart_rate', current.heart_rate) !== 'ok') alerts.push(`HR ${current.heart_rate} bpm`)
  if (isAlert('spo2', current.spo2) !== 'ok') alerts.push(`SpO₂ ${current.spo2}%`)
  if (isAlert('systolic', current.systolic) !== 'ok') alerts.push(`BP ${current.systolic}/${current.diastolic}`)
  return { ...p, current, history, alerts }
}

// ─── Vital Card ───────────────────────────────────────────────────────────────
function VitalBadge({ label, value, unit, status }: { label: string; value: number | string; unit: string; status: 'critical' | 'warning' | 'ok' }) {
  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'
  const bg    = status === 'critical' ? 'rgba(239,68,68,0.12)' : status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.08)'
  return (
    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: bg, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="text-xl font-bold" style={{ color }}>
        {value}<span className="text-xs ml-0.5" style={{ color: color + 'aa' }}>{unit}</span>
      </div>
      <div className="text-[10px] mt-1 uppercase tracking-wider font-semibold" style={{ color: '#64748b' }}>{label}</div>
      {status !== 'ok' && (
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color, animation: status === 'critical' ? 'pulse 1s infinite' : 'none' }}>
          {status}
        </div>
      )}
    </div>
  )
}

// ─── Patient Vitals Card ──────────────────────────────────────────────────────
function PatientVitalsCard({ patient, selected, onSelect }: { patient: PatientVitals; selected: boolean; onSelect: () => void }) {
  const condColor = patient.condition === 'CRITICAL' ? '#ef4444' : patient.condition === 'MONITORED' ? '#f59e0b' : '#10b981'
  const condBg    = patient.condition === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : patient.condition === 'MONITORED' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)'
  const { current: c } = patient

  return (
    <div
      onClick={onSelect}
      className="glass-card p-5 cursor-pointer transition-all hover:scale-[1.01]"
      style={{
        borderColor: selected ? condColor : 'rgba(255,255,255,0.06)',
        boxShadow: selected ? `0 0 0 2px ${condColor}50` : undefined,
        borderWidth: 1, borderStyle: 'solid',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{patient.patient_name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: condBg, color: condColor }}>{patient.condition}</span>
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>
            {patient.ward} · Bed {patient.bed} · Age {patient.age}
          </div>
        </div>
        {patient.alerts.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertTriangle size={12} className="text-red-400 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400">{patient.alerts.length}</span>
          </div>
        )}
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <VitalBadge label="Heart Rate" value={c.heart_rate} unit=" bpm" status={isAlert('heart_rate', c.heart_rate)} />
        <VitalBadge label="SpO₂" value={c.spo2} unit="%" status={isAlert('spo2', c.spo2)} />
        <VitalBadge label="Temp" value={c.temperature} unit="°C" status={isAlert('temperature', c.temperature)} />
        <VitalBadge label="Systolic" value={c.systolic} unit=" mmHg" status={isAlert('systolic', c.systolic)} />
        <VitalBadge label="Diastolic" value={c.diastolic} unit=" mmHg" status={isAlert('diastolic', c.diastolic)} />
        <VitalBadge label="Resp Rate" value={c.respiratory_rate} unit=" /min" status={isAlert('respiratory_rate', c.respiratory_rate)} />
      </div>

      {/* Mini HR trend */}
      <div style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={patient.history.slice(-10)}>
            <Line type="monotone" dataKey="heart_rate" stroke={condColor} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      {patient.alerts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {patient.alerts.map((a, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              ⚠ {a}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Charts Panel ──────────────────────────────────────────────────────
function VitalsDetailPanel({ patient }: { patient: PatientVitals }) {
  const vitalsCharts = [
    { key: 'heart_rate', label: 'Heart Rate (bpm)', color: '#ef4444', unit: 'bpm' },
    { key: 'spo2',       label: 'SpO₂ (%)',          color: '#6366f1', unit: '%' },
    { key: 'systolic',   label: 'Systolic BP',        color: '#f59e0b', unit: 'mmHg' },
    { key: 'temperature',label: 'Temperature (°C)',   color: '#10b981', unit: '°C' },
    { key: 'respiratory_rate', label: 'Resp. Rate (/min)', color: '#8b5cf6', unit: '/min' },
  ]

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{patient.patient_name}</h2>
          <p className="text-xs" style={{ color: '#64748b' }}>{patient.ward} · Bed {patient.bed} · Live Vitals Trend (30 min)</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl animate-pulse"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Live
        </span>
      </div>
      {vitalsCharts.map(vc => (
        <div key={vc.key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{vc.label}</span>
            <span className="text-sm font-bold" style={{ color: vc.color }}>
              {patient.current[vc.key as keyof VitalsReading]} {vc.unit}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={patient.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="timestamp" tick={{ fill: '#334155', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#334155', fontSize: 9 }} width={28} />
              <Tooltip
                contentStyle={{ background: '#0f0f18', border: `1px solid ${vc.color}50`, borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: vc.color }}
              />
              <Line type="monotone" dataKey={vc.key} stroke={vc.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VitalsMonitorPage() {
  const [patients, setPatients] = useState<PatientVitals[]>(() => INIT_BASES.map(initPatient))
  const [selectedId, setSelectedId] = useState<string>('P-001')
  const [isLive, setIsLive] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const selectedPatient = patients.find(p => p.patient_id === selectedId)

  const tickVitals = useCallback(() => {
    if (!isLive) return
    setPatients(prev => prev.map(p => {
      const base = CRITICAL_BASES[p.patient_id] || MONITORED_BASES[p.patient_id] || {}
      const newReading = generateVitals(base, p.condition)
      const newHistory = [...p.history.slice(-29), newReading]
      const alerts: string[] = []
      if (isAlert('heart_rate', newReading.heart_rate) !== 'ok') alerts.push(`HR ${newReading.heart_rate} bpm`)
      if (isAlert('spo2', newReading.spo2) !== 'ok') alerts.push(`SpO₂ ${newReading.spo2}%`)
      if (isAlert('systolic', newReading.systolic) !== 'ok') alerts.push(`BP ${newReading.systolic}/${newReading.diastolic}`)
      if (isAlert('temperature', newReading.temperature) !== 'ok') alerts.push(`Temp ${newReading.temperature}°C`)
      return { ...p, current: newReading, history: newHistory, alerts }
    }))
    setLastRefresh(new Date())
  }, [isLive])

  useEffect(() => {
    const interval = setInterval(tickVitals, 5000)
    return () => clearInterval(interval)
  }, [tickVitals])

  const filtered = patients.filter(p =>
    p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    p.ward.toLowerCase().includes(search.toLowerCase()) ||
    p.bed.toLowerCase().includes(search.toLowerCase())
  )

  const criticalCount = patients.filter(p => p.condition === 'CRITICAL').length
  const alertCount = patients.reduce((s, p) => s + p.alerts.length, 0)

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={18} className="text-red-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Real-Time Vitals Monitor</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Patient Vitals Dashboard</h1>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Live telemetry for {patients.length} monitored patients · Refreshes every 5 seconds
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search patient / ward..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-xs outline-none text-slate-200 placeholder-slate-500 w-36"
              />
            </div>
            {/* Alerts toggle */}
            <button
              onClick={() => setAlertsEnabled(a => !a)}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ background: alertsEnabled ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              title={alertsEnabled ? 'Mute alerts' : 'Enable alerts'}
            >
              {alertsEnabled ? <Bell size={16} className="text-red-400" /> : <BellOff size={16} className="text-slate-400" />}
            </button>
            {/* Live toggle */}
            <button
              onClick={() => setIsLive(l => !l)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: isLive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: isLive ? '#10b981' : '#94a3b8',
              }}
            >
              {isLive ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isLive ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={tickVitals}
              className="p-2 rounded-xl transition-all hover:scale-105 hover:rotate-180"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Refresh now"
            >
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Summary KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monitored Patients', value: patients.length, color: '#6366f1', icon: <Activity size={20} /> },
          { label: 'Critical Status', value: criticalCount, color: '#ef4444', icon: <Heart size={20} /> },
          { label: 'Active Alerts', value: alertCount, color: '#f59e0b', icon: <AlertTriangle size={20} /> },
          { label: 'Last Refresh', value: lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), color: '#10b981', icon: <RefreshCw size={20} /> },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ '--accent-color': kpi.color } as any}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${kpi.color}18`, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{kpi.value}</div>
            <div className="text-xs mt-1" style={{ color: '#64748b' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Critical Alert Banner ────────────────────────────────────── */}
      {alertsEnabled && alertCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl animate-pulse"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div className="text-sm" style={{ color: '#fca5a5' }}>
            <span className="font-bold text-white">{alertCount} active vital alert{alertCount > 1 ? 's' : ''}:</span>{' '}
            {patients.filter(p => p.alerts.length > 0).map(p => `${p.patient_name} (${p.alerts.join(', ')})`).join(' · ')}
          </div>
        </div>
      )}

      {/* ─── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Patient cards list */}
        <div className="xl:col-span-2 space-y-4">
          {filtered.length === 0 && (
            <div className="glass-card p-8 text-center text-slate-500 text-sm">No patients match your search.</div>
          )}
          {filtered.map(p => (
            <PatientVitalsCard
              key={p.patient_id}
              patient={p}
              selected={selectedId === p.patient_id}
              onSelect={() => setSelectedId(p.patient_id)}
            />
          ))}
        </div>

        {/* Detail trend panel */}
        {selectedPatient && (
          <div className="xl:col-span-1">
            <VitalsDetailPanel patient={selectedPatient} />
          </div>
        )}
      </div>
    </div>
  )
}
