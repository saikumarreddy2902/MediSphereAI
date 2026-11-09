'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import {
  Users, Activity, Bed, TrendingUp, TrendingDown, Clock,
  UserPlus, UserMinus, AlertCircle, Search, Filter, XCircle,
  CheckCircle, Shield, Sparkles, RefreshCw
} from 'lucide-react'
import { mockKPIs, mockHourlyFlow, mockDepartmentPerformance } from '@/lib/mock-data'
import { api } from '@/lib/api'

const mockPatients = [
  { id: 'P-0041', name: 'Rajesh Kumar',  age: 62, gender: 'Male',   diagnosis: 'Acute MI',              ward: 'ICU',          admDate: '18 Aug', los: 3, status: 'Critical',  doctor: 'Dr. Sharma', allergies: ['Penicillin'] },
  { id: 'P-0042', name: 'Priya Devi',    age: 45, gender: 'Female', diagnosis: 'Cerebrovascular Accident',ward: 'ICU',         admDate: '19 Aug', los: 2, status: 'Critical',  doctor: 'Dr. Mehta',  allergies: ['Sulfa'] },
  { id: 'P-0043', name: 'Arjun Singh',   age: 34, gender: 'Male',   diagnosis: 'Pneumonia',             ward: 'General',      admDate: '17 Aug', los: 4, status: 'Stable',    doctor: 'Dr. Rao',    allergies: [] },
  { id: 'P-0044', name: 'Lakshmi N.',    age: 28, gender: 'Female', diagnosis: 'Appendectomy (Post-op)',  ward: 'Surgery',     admDate: '20 Aug', los: 1, status: 'Recovering',doctor: 'Dr. Nair',   allergies: ['Latex'] },
  { id: 'P-0045', name: 'Vikram P.',     age: 55, gender: 'Male',   diagnosis: 'Diabetic Ketoacidosis', ward: 'General',      admDate: '16 Aug', los: 5, status: 'Improving', doctor: 'Dr. Patel',  allergies: [] },
  { id: 'P-0046', name: 'Sunita Rao',    age: 41, gender: 'Female', diagnosis: 'Hypertensive Crisis',   ward: 'Cardiology',   admDate: '19 Aug', los: 2, status: 'Stable',    doctor: 'Dr. Sharma', allergies: ['Aspirin'] },
  { id: 'P-0047', name: 'Mohammed A.',   age: 72, gender: 'Male',   diagnosis: 'Hip Fracture',          ward: 'Orthopedic',   admDate: '15 Aug', los: 6, status: 'Stable',    doctor: 'Dr. Iyer',   allergies: [] },
  { id: 'P-0048', name: 'Deepa Gupta',   age: 23, gender: 'Female', diagnosis: 'Asthma Exacerbation',   ward: 'General',      admDate: '20 Aug', los: 1, status: 'Improving', doctor: 'Dr. Rao',    allergies: ['Peanuts'] },
  { id: 'P-0049', name: 'Suresh Iyer',   age: 48, gender: 'Male',   diagnosis: 'Cholecystitis',         ward: 'Surgery',      admDate: '18 Aug', los: 3, status: 'Pre-op',    doctor: 'Dr. Nair',   allergies: [] },
  { id: 'P-0050', name: 'Ananya Menon',  age: 31, gender: 'Female', diagnosis: 'Antenatal care',        ward: 'Maternity',    admDate: '20 Aug', los: 1, status: 'Stable',    doctor: 'Dr. Rao',    allergies: [] },
]

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Critical:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  Stable:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  Recovering: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  Improving:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'Pre-op':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}

const WARD_COLORS: Record<string, string> = {
  ICU: '#ef4444', General: '#3b82f6', Surgery: '#f97316',
  Cardiology: '#f43f5e', Orthopedic: '#8b5cf6', Maternity: '#ec4899',
}

const ALLERGY_OPTIONS = ['Penicillin', 'Sulfa', 'Aspirin', 'Latex', 'Peanuts', 'Iodine', 'Codeine']

// ─── Register Patient Modal Component ──────────────────────────────────────────
function RegisterPatientModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('1990-01-01')
  const [gender, setGender] = useState('Male')
  const [contactNumber, setContactNumber] = useState('')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [address, setAddress] = useState('')
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [medicalHistory, setMedicalHistory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [aiWarnings, setAiWarnings] = useState<string[]>([])

  // AI Live validation logic
  useEffect(() => {
    const warnings: string[] = []
    if (selectedAllergies.length === 0) {
      warnings.push('⚠️ Allergy information is currently empty. Please confirm if patient has no known drug allergies.')
    }
    if (contactNumber && contactNumber.length < 10) {
      warnings.push('⚠️ Contact phone number appears incomplete (less than 10 digits).')
    }
    const lowerHist = medicalHistory.toLowerCase()
    if (lowerHist.includes('asthma') || lowerHist.includes('cardiac') || lowerHist.includes('diabetes')) {
      warnings.push(`💡 High-Risk Medical Condition detected: "${medicalHistory}". Clinical monitoring advised.`)
    }
    setAiWarnings(warnings)
  }, [selectedAllergies, contactNumber, medicalHistory])

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !contactNumber.trim()) {
      alert('Please fill in required fields: First Name, Last Name, Contact Number.')
      return
    }
    setSubmitting(true)
    try {
      const historyList = medicalHistory.split(',').map(s => s.trim()).filter(Boolean)
      const res = await api.post('/patients/', {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        gender,
        contact_number: contactNumber,
        blood_group: bloodGroup,
        address: address || 'Not specified',
        allergies: selectedAllergies,
        medical_history: historyList,
      })
      
      const newPat = res.data
      const newId = newPat?.id || newPat?._id || `P-${Date.now().toString().slice(-4)}`
      
      // Store new patient in localStorage so Patient Portal & Appointment Booking knows this patient immediately
      try {
        localStorage.setItem('latest_registered_patient', JSON.stringify({
          id: newId,
          name: `${firstName} ${lastName}`.trim(),
          gender,
          bloodGroup,
          contactNumber,
          dob,
          allergies: selectedAllergies,
        }))
      } catch (e) {}

      onRegistered()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to register patient')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
           style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UserPlus size={20} className="text-indigo-400"/> Register New Patient
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Enter patient demographics & AI validated EHR intake details</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <XCircle size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Demographics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">First Name *</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Rajesh"
                     className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Last Name *</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kumar"
                     className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                     className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contact Number *</label>
              <input type="text" required value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. +91 9876543210"
                     className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Blood Group</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address details..."
                     className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
            </div>
          </div>

          {/* Known Allergies */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Documented Allergies</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map(allergy => {
                const isSelected = selectedAllergies.includes(allergy)
                return (
                  <button type="button" key={allergy} onClick={() => toggleAllergy(allergy)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: isSelected ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                            color: isSelected ? '#f87171' : '#94a3b8',
                            border: `1px solid ${isSelected ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`
                          }}>
                    {isSelected ? '✓ ' : '+ '}{allergy}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Medical History (comma separated)</label>
            <input type="text" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} placeholder="e.g. Hypertension, Diabetes, Asthma"
                   className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
          </div>

          {/* AI Pre-Validation Box */}
          <div className="p-3.5 rounded-xl space-y-1" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={14}/> AI Intake Validation Assistance
            </div>
            {aiWarnings.map((w, idx) => (
              <p key={idx} className="text-xs text-amber-300 font-medium">{w}</p>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {submitting ? <RefreshCw size={13} className="animate-spin"/> : <UserPlus size={13}/>}
              {submitting ? 'Saving…' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [tab, setTab] = useState<'list' | 'flow' | 'analytics'>('list')
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [patientsList, setPatientsList] = useState<any[]>(mockPatients)
  const [loading, setLoading] = useState(false)

  const loadPatients = async () => {
    setLoading(true)
    try {
      const res = await api.get('/patients/')
      if (res.data && res.data.length > 0) {
        // Map backend patient models to UI structure
        const mapped = res.data.map((p: any) => ({
          id: p.id || p._id || 'P-NEW',
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed',
          age: p.date_of_birth ? Math.max(1, new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()) : 35,
          gender: p.gender || 'Other',
          diagnosis: p.medical_history?.join(', ') || 'Outpatient Assessment',
          ward: 'General',
          admDate: 'Today',
          los: 1,
          status: 'Stable',
          doctor: 'Dr. Reddy',
          allergies: p.allergies || []
        }))
        // Place newest entries at the top
        setPatientsList(mapped.reverse())
      }
    } catch {
      // Use default mockPatients fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPatients() }, [])

  const filtered = patientsList.filter(p => {
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const wardDist = Object.entries(
    patientsList.reduce<Record<string, number>>((acc, p) => { acc[p.ward] = (acc[p.ward] || 0) + 1; return acc }, {})
  ).map(([ward, count]) => ({ ward, count, color: WARD_COLORS[ward] || '#6366f1' }))

  const admissionTrend = mockHourlyFlow.slice(6, 18).map(h => ({
    time: h.time,
    admissions: h.registrations,
    discharges: h.discharges,
  }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      {showRegisterModal && (
        <RegisterPatientModal onClose={() => setShowRegisterModal(false)} onRegistered={loadPatients}/>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Patient Flow &amp; Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time inpatient census, AI-validated admission pipeline, and discharge optimization</p>
        </div>
        <div className="flex gap-2">
          <button id="register-patient-btn" onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            <UserPlus size={14}/> Register New Patient
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
               style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Users size={13} /> {patientsList.length} patients active
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Patients Active',  value: patientsList.length,       icon: <Users size={18} />,     color: '#6366f1' },
          { label: 'Admissions Today', value: mockKPIs.admissions_today, icon: <UserPlus size={18} />,  color: '#10b981' },
          { label: 'Discharges Today', value: mockKPIs.discharges_today, icon: <UserMinus size={18} />, color: '#3b82f6' },
          { label: 'Avg Wait Time',    value: `${mockKPIs.average_waiting_time}m`, icon: <Clock size={18} />, color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['list', 'flow', 'analytics'] as const).map(t => (
          <button key={t} id={`patients-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'list' ? '🏥 Inpatient Census' : t === 'flow' ? '📊 Patient Flow' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {/* Patient List */}
      {tab === 'list' && (
        <div className="space-y-3 animate-scale-in">
          {/* Search + Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="patient-search" type="text" placeholder="Search patient or diagnosis…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5">
              {['ALL', 'Critical', 'Stable', 'Improving', 'Recovering', 'Pre-op'].map(s => (
                <button key={s} id={`patient-status-${s}`} onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: statusFilter === s ? (STATUS_STYLE[s]?.bg || 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                    color: statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') : '#64748b',
                    border: `1px solid ${statusFilter === s ? (STATUS_STYLE[s]?.color || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Diagnosis &amp; Allergies</th><th>Ward</th><th>Admitted</th><th>LOS</th><th>Status</th><th>Doctor</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const ss = STATUS_STYLE[p.status] || { color: '#94a3b8', bg: 'rgba(255,255,255,0.05)' }
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-indigo-400 text-xs">{p.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                               style={{ background: p.gender === 'Male' ? '#3b82f6' : '#ec4899' }}>
                            {p.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </div>
                          <span className="font-medium text-slate-100 text-xs">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-400">{p.age}</td>
                      <td className="text-slate-300 text-xs max-w-[200px]">
                        <div>{p.diagnosis}</div>
                        {p.allergies?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {p.allergies.map((a: string, aIdx: number) => (
                              <span key={`${p.id || 'pt'}-allergy-${aIdx}-${a}`} className="text-[10px] px-1 py-0.2 rounded font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                                ⚠️ {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ background: `${WARD_COLORS[p.ward] || '#6366f1'}15`, color: WARD_COLORS[p.ward] || '#818cf8' }}>
                          {p.ward}
                        </span>
                      </td>
                      <td className="text-slate-400 text-xs">{p.admDate}</td>
                      <td>
                        <span className={p.los > 4 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>{p.los}d</span>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-semibold"
                              style={{ background: ss.bg, color: ss.color }}>{p.status}</span>
                      </td>
                      <td className="text-slate-400 text-xs">{p.doctor}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flow Tab */}
      {tab === 'flow' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-scale-in">
          <div className="xl:col-span-2 glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Hourly Admission vs Discharge Flow (Today)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={admissionTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  {[['adm','#6366f1'],['dis','#10b981']].map(([id,c])=>(
                    <linearGradient key={id} id={`pg-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#6366f1" fill="url(#pg-adm)" strokeWidth={2} />
                <Area type="monotone" dataKey="discharges"  name="Discharges"  stroke="#10b981" fill="url(#pg-dis)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Ward distribution */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Patients by Ward</h3>
            <div className="flex justify-center mb-3">
              <PieChart width={160} height={160}>
                <Pie data={wardDist} cx={80} cy={80} innerRadius={40} outerRadius={72} dataKey="count" paddingAngle={3}>
                  {wardDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              </PieChart>
            </div>
            <div className="space-y-2">
              {wardDist.map(d => (
                <div key={d.ward} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="flex-1 text-slate-400">{d.ward}</span>
                  <span className="font-bold text-slate-200">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="glass-card p-5 animate-scale-in">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Department Performance — Patient Satisfaction &amp; Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockDepartmentPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="department" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="efficiency_score"     name="Efficiency Score"     fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="patient_satisfaction" name="Patient Satisfaction" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
