'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  FileText, User, Heart, Stethoscope, Pill, FlaskConical,
  AlertTriangle, Search, Plus, ChevronRight, Calendar,
  Activity, Clipboard, Filter, Clock, CheckCircle2, Eye
} from 'lucide-react'
import {
  getPatientMedicalRecordsApi,
  getPatientsApi,
  createMedicalRecordApi
} from '@/lib/services/api-service'

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface MedicalRecord {
  id: string
  patient_id: string
  doctor_id?: string
  record_type: string
  title: string
  description: string
  icd_code?: string
  severity?: string
  date_of_record: string
  is_active: boolean
  created_at?: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RECORD_TYPE_META: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  DIAGNOSIS:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <Stethoscope size={14}/> },
  MEDICATION: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: <Pill size={14}/> },
  PROCEDURE:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Activity size={14}/> },
  ALLERGY:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: <AlertTriangle size={14}/> },
  VITALS:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <Heart size={14}/> },
  NOTE:       { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <FileText size={14}/> },
  LAB_RESULT: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: <FlaskConical size={14}/> },
  IMAGING:    { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)',  icon: <Eye size={14}/> },
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string }> = {
  mild:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  severe:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
}

const MOCK_RECORDS: MedicalRecord[] = [
  { id: 'MR-001', patient_id: 'P-0041', record_type: 'DIAGNOSIS', title: 'Hypertensive Heart Disease', description: 'Stage 2 hypertension with left ventricular hypertrophy. Patient presents with sustained BP readings above 160/100 mmHg.', icd_code: 'I11.9', severity: 'moderate', date_of_record: '2026-10-01', is_active: true, doctor_id: 'DR-001' },
  { id: 'MR-002', patient_id: 'P-0041', record_type: 'MEDICATION', title: 'Amlodipine 10mg OD', description: 'Calcium channel blocker prescribed for blood pressure management. Monitor for peripheral oedema.', date_of_record: '2026-10-01', is_active: true, doctor_id: 'DR-001' },
  { id: 'MR-003', patient_id: 'P-0042', record_type: 'ALLERGY', title: 'Penicillin Allergy', description: 'Documented anaphylactic reaction to Amoxicillin in 2024. Avoid all penicillin-class antibiotics.', severity: 'critical', date_of_record: '2024-03-15', is_active: true, doctor_id: 'DR-002' },
  { id: 'MR-004', patient_id: 'P-0042', record_type: 'LAB_RESULT', title: 'CBC — WBC Elevated', description: 'WBC 14.2 x10³/µL (elevated). Neutrophilia noted. Suggests acute bacterial infection. Follow-up culture ordered.', severity: 'moderate', date_of_record: '2026-09-28', is_active: true, doctor_id: 'DR-003' },
  { id: 'MR-005', patient_id: 'P-0043', record_type: 'PROCEDURE', title: 'Coronary Angiography', description: 'Elective diagnostic coronary angiography performed via right radial access. No significant stenosis detected (LAD 30%, RCA 25%).', date_of_record: '2026-09-20', is_active: true, doctor_id: 'DR-001' },
  { id: 'MR-006', patient_id: 'P-0043', record_type: 'VITALS', title: 'Vitals — Post-Op Monitoring', description: 'BP: 128/78, HR: 76 bpm, SpO2: 98%, Temp: 36.8°C, RR: 16/min. Patient stable post-procedure.', date_of_record: '2026-09-20', is_active: true, doctor_id: 'DR-004' },
  { id: 'MR-007', patient_id: 'P-0044', record_type: 'NOTE', title: 'Discharge Summary — Pneumonia', description: 'Patient discharged after 5-day inpatient course of IV Ceftriaxone for community-acquired pneumonia. O2 saturation normalised. Follow up in 2 weeks.', date_of_record: '2026-09-15', is_active: true, doctor_id: 'DR-005' },
  { id: 'MR-008', patient_id: 'P-0045', record_type: 'IMAGING', title: 'Chest X-Ray — Bilateral Infiltrates', description: 'CXR shows bilateral perihilar infiltrates consistent with pulmonary oedema. Cardiomegaly noted. Correlate clinically.', severity: 'severe', date_of_record: '2026-10-03', is_active: true, doctor_id: 'DR-001' },
]

const MOCK_PATIENTS = [
  { id: 'P-0041', first_name: 'Rajesh', last_name: 'Kumar' },
  { id: 'P-0042', first_name: 'Priya', last_name: 'Devi' },
  { id: 'P-0043', first_name: 'Arjun', last_name: 'Singh' },
  { id: 'P-0044', first_name: 'Sunita', last_name: 'Rao' },
  { id: 'P-0045', first_name: 'Vikram', last_name: 'Patel' },
]

// ─── Record Type Distribution ─────────────────────────────────────────────────
const typeDistribution = Object.entries(
  MOCK_RECORDS.reduce((acc: Record<string, number>, r) => {
    acc[r.record_type] = (acc[r.record_type] || 0) + 1
    return acc
  }, {})
).map(([type, count]) => ({
  type: type.charAt(0) + type.slice(1).toLowerCase(),
  count,
  fill: RECORD_TYPE_META[type]?.color || '#6366f1',
}))

// ─── Create Record Modal ───────────────────────────────────────────────────────
function CreateRecordModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: MedicalRecord) => void }) {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS)
  const [form, setForm] = useState({
    patient_id: 'P-0041',
    record_type: 'DIAGNOSIS',
    title: '',
    description: '',
    icd_code: '',
    severity: '',
    date_of_record: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPatientsList() {
      try {
        const data = await getPatientsApi(0, 100)
        if (data && Array.isArray(data) && data.length > 0) {
          const formatted = data.map((p: any) => ({
            id: p.id || p._id || 'P-000',
            first_name: p.first_name || 'Patient',
            last_name: p.last_name || '',
            date_of_birth: p.date_of_birth,
          }))
          setPatients(formatted)
          if (formatted[0]) {
            setForm(f => ({ ...f, patient_id: formatted[0].id }))
          }
        }
      } catch {
        // Fallback to MOCK_PATIENTS
      }
    }
    loadPatientsList()
  }, [])

  const handleSubmit = async () => {
    if (!form.title || !form.description) { setError('Title and clinical description are required'); return }
    setLoading(true)
    try {
      const created = await createMedicalRecordApi(form.patient_id, {
        record_type: form.record_type,
        title: form.title,
        description: form.description,
        icd_code: form.icd_code || undefined,
        severity: form.severity || undefined,
        date_of_record: form.date_of_record,
      })
      onCreated(created)
      onClose()
    } catch {
      // Fallback: create mock record locally
      const mockRecord: MedicalRecord = {
        id: `MR-${Math.floor(Math.random() * 9000 + 1000)}`,
        ...form,
        is_active: true,
      }
      onCreated(mockRecord)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100">Manual Clinical Report / Record Entry</h3>
            <p className="text-xs text-slate-400">Doctor / Nurse clinical assessment, findings, and notes</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">×</button>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Select Patient</label>
            <select value={form.patient_id} onChange={e => setForm(p => ({ ...p, patient_id: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
              {patients.map(p => <option key={p.id} value={p.id} style={{ background: '#13131e' }}>{p.first_name} {p.last_name} ({p.id.slice(-6)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Report / Record Type</label>
            <select value={form.record_type} onChange={e => setForm(p => ({ ...p, record_type: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
              {Object.keys(RECORD_TYPE_META).map(t => <option key={t} value={t} style={{ background: '#13131e' }}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Report Title / Chief Finding</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Post-operative Examination / Vitals Assessment"
            className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Clinical details..."
            className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">ICD Code</label>
            <input value={form.icd_code} onChange={e => setForm(p => ({ ...p, icd_code: e.target.value }))} placeholder="E11.9"
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Severity</label>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
              <option value="">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input type="date" value={form.date_of_record} onChange={e => setForm(p => ({ ...p, date_of_record: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
            {loading ? 'Creating…' : 'Create Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Record Card ──────────────────────────────────────────────────────────────
function RecordCard({ record, patientName }: { record: MedicalRecord; patientName: string }) {
  const meta = RECORD_TYPE_META[record.record_type] || RECORD_TYPE_META.NOTE
  const sev  = record.severity ? SEVERITY_STYLE[record.severity] : null

  return (
    <div className="glass-card p-4 space-y-3 hover:translate-y-[-1px] transition-all" style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: meta.bg, color: meta.color }}>
                {record.record_type}
              </span>
              {sev && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: sev.bg, color: sev.color }}>
                  {record.severity}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-slate-100 text-sm mt-1 leading-tight">{record.title}</h4>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar size={11}/> {record.date_of_record}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
            <User size={11}/> {patientName}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{record.description}</p>

      {record.icd_code && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
            ICD: {record.icd_code}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(MOCK_RECORDS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [patientFilter, setPatientFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Attempt to load live data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPatientMedicalRecordsApi('P-0041', { active_only: false })
        if (Array.isArray(data) && data.length > 0) {
          setRecords(data)
          setIsLive(true)
        }
      } catch {
        // Fall through to mock data
      }
    }
    loadData()
  }, [])

  const patientMap = MOCK_PATIENTS.reduce((acc: Record<string, string>, p) => {
    acc[p.id] = `${p.first_name} ${p.last_name}`
    return acc
  }, {})

  const filtered = records.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || r.record_type === typeFilter
    const matchPat    = patientFilter === 'all' || r.patient_id === patientFilter
    return matchSearch && matchType && matchPat
  })

  // Summary stats
  const totalActive  = records.filter(r => r.is_active).length
  const criticalCount = records.filter(r => r.severity === 'critical' || r.severity === 'severe').length
  const diagCount    = records.filter(r => r.record_type === 'DIAGNOSIS').length
  const allergyCount = records.filter(r => r.record_type === 'ALLERGY').length

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Medical Records</h2>
          <p className="text-xs text-slate-400 mt-0.5">Structured clinical history, diagnoses, procedures, and patient notes</p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          )}
          <button id="btn-create-record" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
            <Plus size={15} /> New Record
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Active Records',     value: totalActive,   icon: <Clipboard size={18}/>,      color: '#6366f1' },
          { label: 'Diagnoses',          value: diagCount,     icon: <Stethoscope size={18}/>,    color: '#10b981' },
          { label: 'Allergy Alerts',     value: allergyCount,  icon: <AlertTriangle size={18}/>,  color: '#f97316' },
          { label: 'Severe / Critical',  value: criticalCount, icon: <Activity size={18}/>,       color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
          <option value="all">All Types</option>
          {Object.keys(RECORD_TYPE_META).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={patientFilter} onChange={e => setPatientFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
          <option value="all">All Patients</option>
          {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} records</span>
      </div>

      {/* Two-column layout: records list + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Records List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No records match your filters</p>
            </div>
          ) : (
            filtered.map(r => (
              <RecordCard key={r.id} record={r} patientName={patientMap[r.patient_id] || r.patient_id} />
            ))
          )}
        </div>

        {/* Right panel: Type Distribution Chart */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Records by Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeDistribution} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {typeDistribution.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Type Legend</h3>
            {Object.entries(RECORD_TYPE_META).map(([type, meta]) => {
              const count = records.filter(r => r.record_type === type).length
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                    <span className="text-xs text-slate-400">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateRecordModal
          onClose={() => setShowCreate(false)}
          onCreated={r => setRecords(prev => [r, ...prev])}
        />
      )}
    </div>
  )
}
