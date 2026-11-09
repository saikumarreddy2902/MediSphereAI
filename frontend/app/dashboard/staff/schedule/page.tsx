'use client'
import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SHIFTS = [
  { id: 'M',   label: 'Morning',   time: '06:00 - 14:00', color: '#f59e0b' },
  { id: 'A',   label: 'Afternoon', time: '14:00 - 22:00', color: '#6366f1' },
  { id: 'N',   label: 'Night',     time: '22:00 - 06:00', color: '#8b5cf6' },
  { id: 'OFF', label: 'Day Off',   time: 'Rest',           color: '#334155' },
]
const SHIFT_TEXT: Record<string,string> = { M: '#fbbf24', A: '#818cf8', N: '#a78bfa', OFF: '#64748b' }
const SHIFT_CLR: Record<string,string>  = { M: '#f59e0b', A: '#6366f1', N: '#8b5cf6', OFF: '#334155' }

interface StaffMember {
  id: string; name: string; role: string; department: string; avatar: string;
  schedule: Record<string, string>
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'S-001', name: 'Nurse Sarah Jenkins', role: 'Senior Nurse', department: 'ICU', avatar: 'SJ',
    schedule: { Mon: 'M', Tue: 'M', Wed: 'A', Thu: 'A', Fri: 'N', Sat: 'OFF', Sun: 'OFF' } },
  { id: 'S-002', name: 'Nurse Priya Anand',   role: 'Staff Nurse', department: 'Cardiac', avatar: 'PA',
    schedule: { Mon: 'A', Tue: 'A', Wed: 'N', Thu: 'N', Fri: 'OFF', Sat: 'M', Sun: 'M' } },
  { id: 'S-003', name: 'Nurse Vikram Singh',  role: 'Staff Nurse', department: 'General', avatar: 'VS',
    schedule: { Mon: 'N', Tue: 'OFF', Wed: 'M', Thu: 'M', Fri: 'A', Sat: 'A', Sun: 'N' } },
  { id: 'S-004', name: 'Dr. Priya Sharma',   role: 'Consultant', department: 'Cardiology', avatar: 'PS',
    schedule: { Mon: 'M', Tue: 'M', Wed: 'M', Thu: 'M', Fri: 'M', Sat: 'OFF', Sun: 'OFF' } },
  { id: 'S-005', name: 'Dr. Arjun Mehta',    role: 'Consultant', department: 'Orthopedics', avatar: 'AM',
    schedule: { Mon: 'M', Tue: 'OFF', Wed: 'M', Thu: 'M', Fri: 'A', Sat: 'OFF', Sun: 'OFF' } },
  { id: 'S-006', name: 'Nurse Meera Iyer',   role: 'Head Nurse', department: 'Pediatrics', avatar: 'MI',
    schedule: { Mon: 'M', Tue: 'M', Wed: 'OFF', Thu: 'A', Fri: 'A', Sat: 'N', Sun: 'OFF' } },
]

function ShiftBadge({ shiftId, onClick }: { shiftId: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
      style={{
        background: `${SHIFT_CLR[shiftId] || '#334155'}18`,
        color: SHIFT_TEXT[shiftId] || '#64748b',
        border: `1px solid ${SHIFT_CLR[shiftId] || '#334155'}30`
      }}
    >
      {shiftId === 'OFF' ? 'OFF' : shiftId}
    </button>
  )
}

export default function ShiftSchedulePage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editModal, setEditModal] = useState<{ staffId: string; day: string } | null>(null)
  const [editShift, setEditShift] = useState('M')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveShift = () => {
    if (!editModal) return
    setStaff(prev => prev.map(s =>
      s.id === editModal.staffId
        ? { ...s, schedule: { ...s.schedule, [editModal.day]: editShift } }
        : s
    ))
    const shiftLabel = SHIFTS.find(s => s.id === editShift)?.label || editShift
    showToast('Shift updated to ' + shiftLabel)
    setEditModal(null)
  }

  const getWeekLabel = () => {
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return fmt(start) + ' to ' + end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const shiftCount = (shiftId: string) =>
    staff.reduce((c, s) => c + Object.values(s.schedule).filter(v => v === shiftId).length, 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
             style={{ background: '#10b981', color: '#fff', zIndex: 9999 }}>
          <Check size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={18} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Shift Management</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Weekly Shift Roster</h1>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              {staff.length} staff members scheduled this week. Click any shift cell to edit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
              {getWeekLabel()}
            </div>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-xl hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button onClick={() => setWeekOffset(0)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#6366f1' }}>
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Shift Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SHIFTS.map(shift => (
          <div key={shift.id} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                 style={{ background: shift.color + '18', color: SHIFT_TEXT[shift.id] }}>
              {shift.id}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{shift.label}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{shift.time}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: SHIFT_TEXT[shift.id] }}>
                {shiftCount(shift.id)} slots this week
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roster Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Staff</th>
                {DAYS.map(day => (
                  <th key={day} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                      style={{ color: '#475569', minWidth: '80px' }}>{day}</th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center"
                    style={{ color: '#475569' }}>Hrs/Wk</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const workDays = Object.values(member.schedule).filter(s => s !== 'OFF').length
                const hours = workDays * 8
                return (
                  <tr key={member.id} className="border-b transition-colors hover:bg-white/[0.02]"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{member.name}</div>
                          <div className="text-xs" style={{ color: '#475569' }}>{member.role} - {member.department}</div>
                        </div>
                      </div>
                    </td>
                    {DAYS.map(day => (
                      <td key={day} className="px-2 py-4 text-center">
                        <ShiftBadge
                          shiftId={member.schedule[day] || 'OFF'}
                          onClick={() => {
                            setEditModal({ staffId: member.id, day })
                            setEditShift(member.schedule[day] || 'OFF')
                          }}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-sm font-bold"
                              style={{ color: hours >= 40 ? '#10b981' : '#f59e0b' }}>{hours}h</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="p-6 rounded-2xl w-full max-w-sm space-y-4"
               style={{ background: '#13131e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-base font-bold" style={{ color: '#e2e8f0' }}>
              Edit Shift - {editModal.day}
            </h3>
            <p className="text-xs" style={{ color: '#64748b' }}>
              {staff.find(s => s.id === editModal.staffId)?.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SHIFTS.map(shift => (
                <button key={shift.id} onClick={() => setEditShift(shift.id)}
                  className="p-3 rounded-xl flex flex-col gap-1 text-left transition-all"
                  style={{
                    background: editShift === shift.id ? shift.color + '20' : 'rgba(255,255,255,0.04)',
                    border: '2px solid ' + (editShift === shift.id ? shift.color : 'rgba(255,255,255,0.06)'),
                  }}>
                  <span className="text-xs font-bold" style={{ color: SHIFT_TEXT[shift.id] }}>{shift.label}</span>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>{shift.time}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                Cancel
              </button>
              <button onClick={handleSaveShift}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                Save Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
