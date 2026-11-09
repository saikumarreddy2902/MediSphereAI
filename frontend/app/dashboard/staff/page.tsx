'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import {
  Users2, UserCheck, Shield, Clock, TrendingUp, AlertCircle,
  Sun, Moon, Sunset, Sunrise, Star
} from 'lucide-react'
import { mockKPIs } from '@/lib/mock-data'

const mockRoster = [
  { id: 'S-001', name: 'Dr. Priya Sharma',    role: 'PHYSICIAN',    dept: 'Cardiology', shift: 'DAY',     status: 'AVAILABLE',   patients: 8,  hrs: 6.5 },
  { id: 'S-002', name: 'Nurse Anjali Rao',    role: 'NURSE',        dept: 'ICU',        shift: 'DAY',     status: 'AVAILABLE',   patients: 4,  hrs: 7.2 },
  { id: 'S-003', name: 'Dr. Arjun Mehta',     role: 'SURGEON',      dept: 'Surgery',    shift: 'DAY',     status: 'IN_SURGERY',  patients: 2,  hrs: 5.8 },
  { id: 'S-004', name: 'Nurse Kavitha Nair',  role: 'NURSE',        dept: 'Pediatric',  shift: 'DAY',     status: 'AVAILABLE',   patients: 3,  hrs: 6.1 },
  { id: 'S-005', name: 'Dr. Ravi Kumar',      role: 'PHYSICIAN',    dept: 'Emergency',  shift: 'DAY',     status: 'AVAILABLE',   patients: 6,  hrs: 4.2 },
  { id: 'S-006', name: 'Nurse Deepa Singh',   role: 'NURSE',        dept: 'General',    shift: 'EVENING', status: 'AVAILABLE',   patients: 5,  hrs: 3.8 },
  { id: 'S-007', name: 'Dr. Sneha Patel',     role: 'RADIOLOGIST',  dept: 'Radiology',  shift: 'DAY',     status: 'AVAILABLE',   patients: 0,  hrs: 5.5 },
  { id: 'S-008', name: 'Nurse Rahul Gupta',   role: 'NURSE',        dept: 'ICU',        shift: 'NIGHT',   status: 'OFF_DUTY',    patients: 0,  hrs: 0   },
  { id: 'S-009', name: 'Dr. Vikram Nair',     role: 'PHYSICIAN',    dept: 'Medicine',   shift: 'EVENING', status: 'ON_LEAVE',    patients: 0,  hrs: 0   },
  { id: 'S-010', name: 'Nurse Preethi Kumar', role: 'NURSE',        dept: 'Maternity',  shift: 'DAY',     status: 'AVAILABLE',   patients: 2,  hrs: 7.0 },
  { id: 'S-011', name: 'Pharmacist Mohan R',  role: 'PHARMACIST',   dept: 'Pharmacy',   shift: 'DAY',     status: 'AVAILABLE',   patients: 0,  hrs: 6.2 },
  { id: 'S-012', name: 'Tech Sanjay Iyer',    role: 'TECHNICIAN',   dept: 'Laboratory', shift: 'DAY',     status: 'AVAILABLE',   patients: 0,  hrs: 5.9 },
]

const ROLE_COLORS: Record<string, string> = {
  PHYSICIAN: '#6366f1', NURSE: '#10b981', SURGEON: '#f97316', RADIOLOGIST: '#3b82f6',
  PHARMACIST: '#8b5cf6', TECHNICIAN: '#f59e0b', ADMIN: '#64748b',
}
const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  AVAILABLE:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Available'   },
  IN_SURGERY: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'In Surgery'  },
  ON_LEAVE:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'On Leave'    },
  OFF_DUTY:   { color: '#475569', bg: 'rgba(71,85,105,0.12)',  label: 'Off Duty'    },
}
const SHIFT_ICON: Record<string, React.ReactNode> = {
  DAY:      <Sun size={12} />,
  EVENING:  <Sunset size={12} />,
  NIGHT:    <Moon size={12} />,
  ROTATING: <Star size={12} />,
}

const roleDistribution = Object.entries(
  mockRoster.reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1; return acc
  }, {})
).map(([role, count]) => ({ role, count, color: ROLE_COLORS[role] || '#6b7280' }))

const weeklyStaffing = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
  day: d,
  day_shift: Math.floor(70 + Math.random() * 30),
  evening_shift: Math.floor(40 + Math.random() * 20),
  night_shift: Math.floor(25 + Math.random() * 15),
}))

const departmentRatio = [
  { dept: 'ICU',       nurses: 8,  patients: 16, ratio: '1:2', safe: true  },
  { dept: 'Emergency', nurses: 5,  patients: 12, ratio: '1:2.4', safe: true },
  { dept: 'General',   nurses: 12, patients: 48, ratio: '1:4', safe: true  },
  { dept: 'Pediatric', nurses: 4,  patients: 18, ratio: '1:4.5', safe: false },
  { dept: 'Surgery',   nurses: 6,  patients: 14, ratio: '1:2.3', safe: true },
  { dept: 'Maternity', nurses: 3,  patients: 14, ratio: '1:4.7', safe: false },
]

import { useEffect } from 'react'
import { getStaffApi } from '@/lib/services/api-service'
import { Plus, X, UserPlus } from 'lucide-react'

export default function StaffPage() {
  const [roster, setRoster] = useState(mockRoster)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [tab, setTab] = useState<'roster' | 'ratios' | 'schedule'>('roster')
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

  // Allocation form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'PHYSICIAN',
    dept: 'Cardiology',
    shift: 'DAY',
    status: 'AVAILABLE',
    patients: 4,
  })

  useEffect(() => {
    async function loadStaff() {
      try {
        const liveStaff = await getStaffApi()
        if (Array.isArray(liveStaff) && liveStaff.length > 0) {
          const mapped = liveStaff.map((s: any, idx: number) => ({
            id: s.id || `S-${idx + 1}`,
            name: s.name || s.full_name || 'Staff Member',
            role: (s.role || s.specialization || 'NURSE').toUpperCase(),
            dept: s.dept || s.department || 'General',
            shift: s.shift || 'DAY',
            status: s.status || 'AVAILABLE',
            patients: s.patients || 0,
            hrs: s.hrs || 8,
          }))
          setRoster(mapped)
        }
      } catch (err) {
        console.warn('Staff API call failed, using mock roster fallback:', err)
      }
    }
    loadStaff()
  }, [])

  const handleAllocateStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffForm.name) {
      alert('Please enter staff name')
      return
    }
    const newEntry = {
      id: `S-0${roster.length + 1}`,
      name: staffForm.name,
      role: staffForm.role,
      dept: staffForm.dept,
      shift: staffForm.shift,
      status: staffForm.status,
      patients: Number(staffForm.patients) || 0,
      hrs: staffForm.status === 'AVAILABLE' ? 8.0 : 0,
    }
    setRoster(prev => [newEntry, ...prev])
    setBannerMsg(`Successfully allocated ${staffForm.role} ${staffForm.name} to ${staffForm.dept} (${staffForm.shift} shift).`)
    setShowAllocateModal(false)
    setStaffForm({
      name: '',
      role: 'PHYSICIAN',
      dept: 'Cardiology',
      shift: 'DAY',
      status: 'AVAILABLE',
      patients: 4,
    })
    setTimeout(() => setBannerMsg(null), 4500)
  }

  const onDuty    = roster.filter(s => s.status === 'AVAILABLE' || s.status === 'IN_SURGERY').length
  const onLeave   = roster.filter(s => s.status === 'ON_LEAVE').length
  const nurses    = roster.filter(s => s.role === 'NURSE').length
  const physicians= roster.filter(s => s.role === 'PHYSICIAN' || s.role === 'SURGEON').length

  const filtered  = roleFilter === 'ALL' ? roster : roster.filter(s => s.role === roleFilter)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Staff &amp; Doctor Allocation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Nurse-to-patient ratio optimization, doctor ward assignments, and shift scheduling</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <UserPlus size={14} /> Allocate Doctor / Staff
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
               style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-2 h-2 rounded-full status-running" />
            {onDuty} staff on duty now
          </div>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <UserCheck size={15} /> {bannerMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Staff',      value: mockRoster.length, icon: <Users2 size={18} />,    color: '#6366f1' },
          { label: 'On Duty',          value: onDuty,            icon: <UserCheck size={18} />, color: '#10b981' },
          { label: 'On Leave',         value: onLeave,           icon: <AlertCircle size={18}/>, color: '#f59e0b' },
          { label: 'Physicians / Nurses', value: `${physicians}/${nurses}`, icon: <Shield size={18} />, color: '#8b5cf6' },
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
        {(['roster', 'ratios', 'schedule'] as const).map(t => (
          <button key={t} id={`staff-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'roster' ? '👥 Staff Roster' : t === 'ratios' ? '⚖️ Nurse Ratios' : '📅 Weekly Schedule'}
          </button>
        ))}
      </div>

      {/* Roster Tab */}
      {tab === 'roster' && (
        <div className="space-y-4 animate-scale-in">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Role distribution pie */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Staff by Role</h3>
              <div className="flex items-center justify-center mb-3">
                <PieChart width={160} height={160}>
                  <Pie data={roleDistribution} cx={80} cy={80} innerRadius={45} outerRadius={75}
                    dataKey="count" paddingAngle={3}>
                    {roleDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                </PieChart>
              </div>
              <div className="space-y-2">
                {roleDistribution.map(r => (
                  <button key={r.role} id={`role-filter-${r.role}`}
                    onClick={() => setRoleFilter(roleFilter === r.role ? 'ALL' : r.role)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-xs"
                    style={{ background: roleFilter === r.role ? `${r.color}15` : 'transparent', border: roleFilter === r.role ? `1px solid ${r.color}30` : '1px solid transparent' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <span className="flex-1 text-left text-slate-300">{r.role}</span>
                    <span className="font-bold" style={{ color: r.color }}>{r.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Table */}
            <div className="xl:col-span-2 glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Active Roster</span>
                {roleFilter !== 'ALL' && (
                  <button onClick={() => setRoleFilter('ALL')} className="text-xs px-2 py-1 rounded-lg text-indigo-400"
                          style={{ background: 'rgba(99,102,241,0.1)' }}>Clear filter</button>
                )}
              </div>
              <div className="overflow-auto max-h-[460px]">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>Department</th><th>Shift</th><th>Status</th><th>Patients</th><th>Hours</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const ss = STATUS_STYLE[s.status]
                      return (
                        <tr key={s.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                   style={{ background: ROLE_COLORS[s.role] || '#6366f1' }}>
                                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="font-medium text-slate-100 text-xs">{s.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-xs px-2 py-0.5 rounded font-semibold"
                                  style={{ background: `${ROLE_COLORS[s.role]}15`, color: ROLE_COLORS[s.role] || '#6366f1' }}>
                              {s.role}
                            </span>
                          </td>
                          <td className="text-slate-400 text-xs">{s.dept}</td>
                          <td>
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              {SHIFT_ICON[s.shift]} {s.shift}
                            </div>
                          </td>
                          <td>
                            <span className="text-xs px-2 py-0.5 rounded"
                                  style={{ background: ss?.bg, color: ss?.color }}>{ss?.label}</span>
                          </td>
                          <td className="text-slate-300 text-center">{s.patients || '—'}</td>
                          <td className="text-slate-400 text-xs">{s.hrs > 0 ? `${s.hrs}h` : '—'}</td>
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

      {/* Ratios Tab */}
      {tab === 'ratios' && (
        <div className="glass-card overflow-hidden animate-scale-in">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-slate-200">Nurse-to-Patient Ratios by Department</h3>
            <p className="text-xs text-slate-500 mt-1">Safe threshold: 1:4 for general, 1:2 for ICU, 1:3 for emergency</p>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Department</th><th>Nurses on Duty</th><th>Current Patients</th><th>Ratio</th><th>Status</th></tr>
            </thead>
            <tbody>
              {departmentRatio.map(d => (
                <tr key={d.dept}>
                  <td className="font-medium text-slate-100">{d.dept}</td>
                  <td className="text-slate-300">{d.nurses}</td>
                  <td className="text-slate-300">{d.patients}</td>
                  <td className="font-mono font-bold" style={{ color: d.safe ? '#10b981' : '#ef4444' }}>{d.ratio}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={{ background: d.safe ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: d.safe ? '#10b981' : '#ef4444' }}>
                      {d.safe ? '✓ Safe' : '⚠ Under-staffed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">7-Day Staffing Schedule</h3>
            <div className="flex gap-4 text-xs">
              {[['#6366f1','Day'],['#f59e0b','Evening'],['#8b5cf6','Night']].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-slate-400">{l}</span></span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyStaffing} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Allocate Staff Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">Allocate Doctor / Staff Member</h3>
                <p className="text-xs text-slate-400">Assign role, department, shift, and patient load</p>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleAllocateStaff} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dr. Siddharth Rao / Nurse Meena S"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Staff Role</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="PHYSICIAN" style={{ background: '#13131e' }}>Physician / Doctor</option>
                    <option value="SURGEON" style={{ background: '#13131e' }}>Surgeon</option>
                    <option value="NURSE" style={{ background: '#13131e' }}>Nurse</option>
                    <option value="RADIOLOGIST" style={{ background: '#13131e' }}>Radiologist</option>
                    <option value="PHARMACIST" style={{ background: '#13131e' }}>Pharmacist</option>
                    <option value="TECHNICIAN" style={{ background: '#13131e' }}>Technician</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Department</label>
                  <select
                    value={staffForm.dept}
                    onChange={e => setStaffForm(f => ({ ...f, dept: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="Cardiology" style={{ background: '#13131e' }}>Cardiology</option>
                    <option value="ICU" style={{ background: '#13131e' }}>ICU</option>
                    <option value="Emergency" style={{ background: '#13131e' }}>Emergency</option>
                    <option value="Surgery" style={{ background: '#13131e' }}>Surgery</option>
                    <option value="Pediatric" style={{ background: '#13131e' }}>Pediatric</option>
                    <option value="Maternity" style={{ background: '#13131e' }}>Maternity</option>
                    <option value="General" style={{ background: '#13131e' }}>General Medicine</option>
                    <option value="Radiology" style={{ background: '#13131e' }}>Radiology</option>
                    <option value="Pharmacy" style={{ background: '#13131e' }}>Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shift</label>
                  <select
                    value={staffForm.shift}
                    onChange={e => setStaffForm(f => ({ ...f, shift: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="DAY" style={{ background: '#13131e' }}>☀️ Day Shift</option>
                    <option value="EVENING" style={{ background: '#13131e' }}>🌇 Evening Shift</option>
                    <option value="NIGHT" style={{ background: '#13131e' }}>🌙 Night Shift</option>
                    <option value="ROTATING" style={{ background: '#13131e' }}>⭐ Rotating</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Assigned Patients</label>
                  <input
                    type="number"
                    value={staffForm.patients}
                    onChange={e => setStaffForm(f => ({ ...f, patients: parseInt(e.target.value) || 0 }))}
                    min={0}
                    max={30}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Status</label>
                <select
                  value={staffForm.status}
                  onChange={e => setStaffForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-200 outline-none"
                >
                  <option value="AVAILABLE" style={{ background: '#13131e' }}>🟢 Available on Duty</option>
                  <option value="IN_SURGERY" style={{ background: '#13131e' }}>🟣 In Surgery / Procedure</option>
                  <option value="ON_LEAVE" style={{ background: '#13131e' }}>🟡 On Leave</option>
                  <option value="OFF_DUTY" style={{ background: '#13131e' }}>⚪ Off Duty</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
                >
                  Confirm Allocation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
