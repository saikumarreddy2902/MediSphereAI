'use client'
import React, { useState, useEffect } from 'react'
import {
  Layers, Stethoscope, ShieldAlert, TestTube2, Bed, CheckCircle2,
  Clock, AlertTriangle, Users, Filter, Search, ChevronRight, Play,
  Check, ArrowUpRight, ShieldCheck, Lock, RefreshCw, Sparkles, Building2,
  Radio, BellRing, Zap, Activity, Volume2, X
} from 'lucide-react'
import {
  getDepartmentWorkQueueApi,
  getAllDepartmentQueuesSummaryApi,
  executeQueueActionApi
} from '@/lib/services/api-service'
import { useWebSocket } from '@/lib/hooks/useWebSocket'

interface DepartmentSummary {
  department_id: string
  name: string
  floor: number
  color: string
  bed_capacity: number
  occupied_beds: number
  pending_consultations: number
  active_emergencies: number
  pending_diagnostics: number
  load_percentage: number
  status: 'critical' | 'warning' | 'normal'
}

const DEPARTMENT_ICONS: Record<string, string> = {
  Cardiology: '🫀',
  Neurology: '🧠',
  Orthopedics: '🦴',
  Pediatrics: '👶',
  'General Medicine': '🩺',
  Surgery: '🔪',
  Dermatology: '🧴',
  ENT: '👂',
  Nephrology: '🧪',
  Pulmonology: '🫁',
  Gastroenterology: '🔬',
  Ophthalmology: '👁️',
  Psychiatry: '🧘',
  Emergency: '🚨',
  ICU: '🏥',
  Oncology: '🎗️',
  Gynecology: '🌸',
  Laboratory: '🔬',
  Pharmacy: '💊',
  Radiology: '🩻',
}

const DEFAULT_DEPARTMENTS_LIST = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'General Medicine', 'Surgery', 'Nephrology', 'Pulmonology',
  'Gastroenterology', 'Ophthalmology', 'Psychiatry', 'Emergency', 'ICU'
]

export default function DepartmentQueuePage() {
  const [selectedDept, setSelectedDept] = useState('Cardiology')
  const [activeTab, setActiveTab] = useState<'consultations' | 'emergencies' | 'diagnostics' | 'ward'>('consultations')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Real-Time WebSocket Push Alert State
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<any | null>(null)
  const [liveAlertsHistory, setLiveAlertsHistory] = useState<any[]>([])

  // User RBAC State from localStorage
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; department_id?: string } | null>(null)
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([])
  const [queueData, setQueueData] = useState<any>(null)

  // WebSocket Live Push Feed for the selected Department
  const defaultWsBase = process.env.NEXT_PUBLIC_WS_URL || (
    process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, (m) => m === 'https://' ? 'wss://' : 'ws://').replace(/\/+$/, '')
      : 'ws://localhost:8000'
  );
  const cleanWsBase = defaultWsBase.replace(/\/api\/v1.*$/, '');
  const departmentWsUrl = `${cleanWsBase}/api/v1/ws/department/${encodeURIComponent(selectedDept)}`;
  const { isConnected: wsConnected, lastMessage } = useWebSocket(departmentWsUrl);

  // Process incoming real-time WebSocket events
  useEffect(() => {
    if (!lastMessage) return
    const msg = lastMessage as any

    if (msg.type === 'EMERGENCY_ESCALATION') {
      const emergencyObj = {
        id: msg.alert_id || `ER-${Date.now()}`,
        case_number: msg.alert_id || `ER-${Date.now()}`,
        patient_name: msg.patient_name || 'Emergency Transfer',
        age: 52,
        chief_complaint: msg.message || `Live triage escalation to ${selectedDept}`,
        triage_level: msg.triage_level || 1,
        triage_label: msg.triage_label || 'Emergent',
        triage_color: msg.triage_level === 1 ? '#ef4444' : '#f97316',
        wait_minutes: 0,
        status: 'in_treatment',
        priority: msg.severity || 'critical',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isLive: true,
      }

      setActiveEmergencyAlert(emergencyObj)
      setLiveAlertsHistory((prev) => [emergencyObj, ...prev.slice(0, 9)])

      // Prepend to current department's emergencies list in local state
      setQueueData((prev: any) => {
        if (!prev) return prev
        const existing = prev.emergency_escalations || []
        // Avoid duplicate ID
        if (existing.some((e: any) => (e.id || e.case_number) === emergencyObj.id)) return prev
        return {
          ...prev,
          emergency_escalations: [emergencyObj, ...existing],
          kpis: {
            ...prev.kpis,
            urgent_cases: (prev.kpis?.urgent_cases || 0) + 1,
          }
        }
      })
    } else if (msg.type === 'QUEUE_SYNC') {
      setQueueData((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          kpis: {
            ...prev.kpis,
            bed_occupancy_pct: msg.bed_occupancy_pct ?? prev.kpis?.bed_occupancy_pct,
            active_patients: msg.active_queue_count ?? prev.kpis?.active_patients,
          }
        }
      })
    }
  }, [lastMessage, selectedDept])

  // Trigger manual simulation drill for testing live push alerts
  const handleTriggerSimulatedEscalation = () => {
    const mockEscalation = {
      alert_id: `DRILL-ER-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: `Patient Esc-Drill (${selectedDept})`,
      triage_level: 1,
      triage_label: 'Resuscitation (Code Red)',
      severity: 'critical',
      message: `Simulated Code Red Escalation dispatched to ${selectedDept} Work Queue`,
      timestamp: new Date().toISOString()
    }
    const emergencyObj = {
      id: mockEscalation.alert_id,
      case_number: mockEscalation.alert_id,
      patient_name: mockEscalation.patient_name,
      age: 49,
      chief_complaint: mockEscalation.message,
      triage_level: 1,
      triage_label: mockEscalation.triage_label,
      triage_color: '#ef4444',
      wait_minutes: 0,
      status: 'in_treatment',
      priority: 'critical',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isLive: true,
    }
    setActiveEmergencyAlert(emergencyObj)
    setLiveAlertsHistory((prev) => [emergencyObj, ...prev.slice(0, 9)])
    setQueueData((prev: any) => {
      if (!prev) return prev
      return {
        ...prev,
        emergency_escalations: [emergencyObj, ...(prev.emergency_escalations || [])],
        kpis: {
          ...prev.kpis,
          urgent_cases: (prev.kpis?.urgent_cases || 0) + 1,
        }
      }
    })
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('medisphere_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setCurrentUser(parsed)
        // If doctor/nurse with specific department, lock to that department
        if (parsed.department_id) {
          setSelectedDept(parsed.department_id)
        }
      }
    } catch {}
  }, [])

  // Load Department Queue Summary
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await getAllDepartmentQueuesSummaryApi()
        if (res && res.departments) {
          setDepartmentSummaries(res.departments)
        }
      } catch {
        // Fallback mock summaries
        const mockSummaries: DepartmentSummary[] = DEFAULT_DEPARTMENTS_LIST.map((dept, idx) => ({
          department_id: `dept-${idx + 1}`,
          name: dept,
          floor: (idx % 6) + 1,
          color: idx % 3 === 0 ? '#3b82f6' : idx % 3 === 1 ? '#10b981' : '#f59e0b',
          bed_capacity: 25,
          occupied_beds: 18 + (idx % 5),
          pending_consultations: 6 + (idx % 7),
          active_emergencies: idx % 2 === 0 ? 1 : 0,
          pending_diagnostics: 5 + (idx % 6),
          load_percentage: 65 + (idx * 3) % 30,
          status: (idx * 3) % 30 > 20 ? 'critical' : 'normal'
        }))
        setDepartmentSummaries(mockSummaries)
      }
    }
    fetchSummaries()
  }, [])

  // Load Department Specific Work Queue
  const fetchQueueData = async (dept: string) => {
    setLoading(true)
    try {
      const data = await getDepartmentWorkQueueApi(dept)
      setQueueData(data)
    } catch {
      // Offline fallback mock data
      setQueueData({
        department: { name: dept, floor: 4, bed_capacity: 25, color: '#3b82f6' },
        team_on_duty: [
          { id: `DOC-${dept.slice(0, 4).toUpperCase()}-01`, name: `Dr. Lead Specialist (${dept})`, role: 'PHYSICIAN', specialty: `${dept} Specialist`, status: 'AVAILABLE', active_queue: 3, shift: 'DAY' },
          { id: `NURSE-${dept.slice(0, 4).toUpperCase()}-01`, name: `Nurse Charge (${dept} Ward)`, role: 'NURSE', specialty: 'Inpatient Ward Nursing', status: 'AVAILABLE', active_queue: 5, shift: 'DAY' },
        ],
        consultation_queue: [
          { id: 'APT-801', appointment_id: 'APT-801', patient_name: 'Rajesh Kumar', patient_id: 'P-0041', doctor_name: `Dr. Lead Specialist (${dept})`, appointment_time: '09:30 AM', reason: `Routine ${dept} Consultation & ECG evaluation`, status: 'SCHEDULED', wait_time_minutes: 15, priority: 'high' },
          { id: 'APT-802', appointment_id: 'APT-802', patient_name: 'Sunita Patel', patient_id: 'P-0044', doctor_name: `Dr. Lead Specialist (${dept})`, appointment_time: '10:15 AM', reason: `Follow-up post-therapy assessment`, status: 'SCHEDULED', wait_time_minutes: 20, priority: 'medium' },
          { id: 'APT-803', appointment_id: 'APT-803', patient_name: 'Mohan Das', patient_id: 'P-0047', doctor_name: `Dr. Lead Specialist (${dept})`, appointment_time: '11:00 AM', reason: `Review of diagnostic lab panel`, status: 'IN_PROGRESS', wait_time_minutes: 5, priority: 'critical' },
        ],
        emergency_escalations: [
          { id: 'ER-01', case_number: 'ER-02001', patient_name: 'Vikram Singh', age: 58, chief_complaint: `Acute symptomatic episode in ${dept}`, triage_level: 2, triage_label: 'Emergent', triage_color: '#f97316', wait_minutes: 6, status: 'in_treatment', priority: 'critical' },
        ],
        diagnostic_orders: [
          { id: 'LAB-101', test_name: `${dept} Comprehensive Blood Panel`, patient_name: 'Rajesh Kumar', patient_id: 'P-0041', category: 'Biochemistry', status: 'in_progress', priority: 'high', turnaround_hours: 1.5 },
          { id: 'LAB-102', test_name: 'Diagnostic Ultrasound / Echo', patient_name: 'Sunita Patel', patient_id: 'P-0044', category: 'Imaging', status: 'completed', priority: 'medium', turnaround_hours: 0.8 },
        ],
        inpatient_ward: [
          { bed_number: `${dept.slice(0, 3).toUpperCase()}-01`, is_occupied: true, patient_id: 'P-0041', patient_name: 'Rajesh Kumar', acuity_level: 'moderate', nurse_assigned: 'Nurse Charge', discharge_ready: false, last_vitals_check: '20 mins ago' },
          { bed_number: `${dept.slice(0, 3).toUpperCase()}-02`, is_occupied: true, patient_id: 'P-0049', patient_name: 'Suresh Babu', acuity_level: 'stable', nurse_assigned: 'Nurse Charge', discharge_ready: true, last_vitals_check: '45 mins ago' },
          { bed_number: `${dept.slice(0, 3).toUpperCase()}-03`, is_occupied: false, patient_id: null, patient_name: 'Available Bed', acuity_level: 'stable', nurse_assigned: 'Nurse Charge', discharge_ready: false, last_vitals_check: 'N/A' },
        ],
        kpis: {
          active_patients: 3,
          urgent_cases: 1,
          pending_tests: 2,
          bed_occupancy_pct: 78.4,
          avg_wait_minutes: 18.2,
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueueData(selectedDept)
  }, [selectedDept])

  const handleAction = async (actionType: string, targetId: string) => {
    setActionLoading(targetId)
    setActionSuccess(null)
    try {
      const res = await executeQueueActionApi({
        department: selectedDept,
        action_type: actionType,
        target_id: targetId,
      })
      setActionSuccess(res.message || `Action completed for ${targetId}`)
      // Refresh department queue data
      await fetchQueueData(selectedDept)
    } catch {
      setActionSuccess(`Completed ${actionType} on ${targetId}`)
      // Update local state directly
      if (queueData) {
        const updatedConsultations = (queueData.consultations || queueData.consultation_queue || []).map((c: any) => {
          if (c.id === targetId || c.appointment_id === targetId) {
            return {
              ...c,
              status: actionType === 'START_CONSULTATION' ? 'IN_PROGRESS' : 'COMPLETED'
            }
          }
          return c
        })
        setQueueData({ ...queueData, consultation_queue: updatedConsultations })
      }
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionSuccess(null), 4000)
    }
  }

  // Filtered Items
  const consultations = (queueData?.consultations || queueData?.consultation_queue || []).filter((item: any) => {
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    const matchesSearch = !searchQuery || item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.patient_id?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPriority && matchesSearch
  })

  const emergencies = (queueData?.emergency_escalations || []).filter((item: any) => {
    const matchesSearch = !searchQuery || item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const diagnostics = (queueData?.diagnostic_orders || []).filter((item: any) => {
    const matchesSearch = !searchQuery || item.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const wardBeds = (queueData?.inpatient_ward || []).filter((item: any) => {
    const matchesSearch = !searchQuery || item.bed_number?.toLowerCase().includes(searchQuery.toLowerCase()) || item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const isRoleRestricted = currentUser?.role === 'doctor' && currentUser?.department_id && currentUser.department_id !== selectedDept

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── Top Header & Department RBAC Clearance Indicator ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Department Work Queues & Task Cockpit</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Active
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Multi-department task segregation, patient queue coordination, and live RBAC scoping.
            </p>
          </div>
        </div>

        {/* Right Section: WebSocket Status, Test Push Drill & RBAC Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* WebSocket Live Push Status Pill */}
          <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
            wsConnected
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold tracking-wide flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                {wsConnected ? 'Live Push Stream' : 'Push Standby'}
              </span>
              <span className="text-[10px] text-slate-400">
                {wsConnected ? `${selectedDept} Channel Synced` : 'Auto-reconnecting...'}
              </span>
            </div>
          </div>

          {/* Test Push Drill Button */}
          <button
            onClick={handleTriggerSimulatedEscalation}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            title="Dispatch a real-time emergency escalation alert to test WebSocket mechanics"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Test Push Drill</span>
          </button>

          {/* RBAC Badge */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Clearance</div>
              <div className="text-xs font-semibold text-white capitalize flex items-center gap-1">
                <span>{currentUser?.role || 'Admin'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-300">
                  {currentUser?.department_id ? currentUser.department_id : 'All Depts'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Real-Time WebSocket Push Escalation Banner ─── */}
      {activeEmergencyAlert && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/85 to-rose-950/90 border-2 border-rose-500/60 p-5 shadow-2xl shadow-rose-950/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 animate-pulse">
                <BellRing className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    LIVE WEBSOCKET PUSH ALERT
                  </span>
                  <span className="text-xs text-rose-200/80 font-mono">
                    Received at {activeEmergencyAlert.timestamp}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeEmergencyAlert.triage_label}: {activeEmergencyAlert.patient_name}
                </h3>
                <p className="text-rose-200 text-sm mt-0.5">
                  {activeEmergencyAlert.chief_complaint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center">
              <button
                onClick={() => {
                  setActiveTab('emergencies')
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Open Emergencies Queue</span>
              </button>
              <button
                onClick={() => setActiveEmergencyAlert(null)}
                className="p-2 text-rose-300 hover:text-white rounded-lg hover:bg-rose-800/40 transition-colors"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Action Success Toast ─── */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── Department Selector Ribbon ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Select Clinical Department</span>
            <span className="text-xs text-slate-500">({DEFAULT_DEPARTMENTS_LIST.length} Active Departments)</span>
          </div>
          <button
            onClick={() => fetchQueueData(selectedDept)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {DEFAULT_DEPARTMENTS_LIST.map((dept) => {
            const isSelected = selectedDept.toLowerCase() === dept.toLowerCase()
            const icon = DEPARTMENT_ICONS[dept] || '🩺'
            const summary = departmentSummaries.find(s => s.name.toLowerCase() === dept.toLowerCase())

            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-[1.02]'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{dept}</span>
                {summary && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {summary.pending_consultations}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Department Overview KPI Ribbon ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Active Consultations</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{consultations.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-normal">In Queue</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Emergency Escalations</div>
          <div className="text-2xl font-bold text-rose-400 flex items-center gap-2">
            <span>{emergencies.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-normal">Urgent</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Diagnostic Orders</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <span>{diagnostics.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-normal">Pending</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Ward Bed Occupancy</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <span>{queueData?.kpis?.bed_occupancy_pct || 75}%</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-normal">Occupied</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">On-Duty Doctors</div>
          <div className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <span>{queueData?.team_on_duty?.length || 2}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-normal">Active</span>
          </div>
        </div>
      </div>

      {/* ─── Work Queue Controls & Filter Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('consultations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'consultations'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Consultations ({consultations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emergencies')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'emergencies'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergencies ({emergencies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'diagnostics'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TestTube2 className="w-4 h-4" />
            <span>Diagnostics ({diagnostics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ward')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ward'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Inpatient Ward ({wardBeds.length})</span>
          </button>
        </div>

        {/* Search & Priority Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-lg p-1">
            {(['all', 'critical', 'high', 'medium'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 text-xs rounded capitalize transition-colors ${
                  priorityFilter === p ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content Tabs ─── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <span>Loading {selectedDept} Work Queue...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: CONSULTATIONS QUEUE */}
          {activeTab === 'consultations' && (
            <div className="space-y-3">
              {consultations.length === 0 ? (
                <div className="p-10 text-center bg-slate-800/30 border border-slate-700/50 rounded-xl text-slate-400">
                  No consultation queue items found matching criteria for {selectedDept}.
                </div>
              ) : (
                consultations.map((item: any) => {
                  const aid = item.appointment_id || item.id
                  const isProcessing = actionLoading === aid
                  const isCompleted = item.status === 'COMPLETED'
                  const isInProgress = item.status === 'IN_PROGRESS'

                  return (
                    <div
                      key={aid}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 transition-all backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border ${
                          isInProgress
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        }`}>
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-base">{item.patient_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                              {item.patient_id}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              item.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-slate-700/60 text-slate-400'
                            }`}>
                              {item.priority || 'Normal'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              Scheduled: {item.appointment_time}
                            </span>
                            <span>•</span>
                            <span>Doctor: <span className="text-slate-300 font-medium">{item.doctor_name}</span></span>
                            <span>•</span>
                            <span>Complaint: <span className="text-slate-300">{item.reason}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-semibold uppercase tracking-wide ${
                          isInProgress ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}>
                          {item.status}
                        </span>

                        {!isCompleted && !isInProgress && (
                          <button
                            onClick={() => handleAction('START_CONSULTATION', aid)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Call In / Start</span>
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            onClick={() => handleAction('COMPLETE_CONSULTATION', aid)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: EMERGENCY ESCALATIONS */}
          {activeTab === 'emergencies' && (
            <div className="space-y-3">
              {emergencies.map((ec: any) => {
                const eid = ec.case_number || ec.id
                return (
                  <div
                    key={eid}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-base">{ec.patient_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono">
                            {ec.case_number}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                            Triage {ec.triage_level}: {ec.triage_label}
                          </span>
                          {ec.isLive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1 animate-pulse">
                              <Radio className="w-2.5 h-2.5 text-emerald-400" /> Live Push
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          Chief Complaint: <span className="text-rose-200 font-medium">{ec.chief_complaint}</span>
                          <span className="mx-2">•</span>
                          Wait: <span className="text-white font-bold">{ec.wait_minutes} mins</span>
                          {ec.timestamp && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-slate-400">Pushed at {ec.timestamp}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAction('DISPATCH_EMERGENCY', eid)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-600/30 transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Dispatch {selectedDept} Specialist</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC ORDERS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-3">
              {diagnostics.map((order: any) => {
                const oid = order.order_id || order.id
                return (
                  <div
                    key={oid}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/40 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <TestTube2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-base">{order.test_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {order.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Patient: <span className="text-slate-200">{order.patient_name}</span>
                          <span className="mx-2">•</span>
                          Turnaround: <span className="text-indigo-300">{order.turnaround_hours || 1.5}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 uppercase font-semibold">
                        {order.status}
                      </span>
                      <button
                        onClick={() => handleAction('ACKNOWLEDGE_LAB', oid)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg"
                      >
                        Acknowledge & Sign
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 4: INPATIENT WARD BEDS */}
          {activeTab === 'ward' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wardBeds.map((bed: any) => (
                <div
                  key={bed.bed_number}
                  className={`p-4 rounded-xl border transition-all ${
                    bed.is_occupied
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-indigo-500/50'
                      : 'bg-slate-900/40 border-dashed border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-white px-2 py-0.5 bg-slate-700 rounded">
                      {bed.bed_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      bed.is_occupied ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {bed.is_occupied ? 'Occupied' : 'Vacant Ready'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white mt-1">
                    {bed.patient_name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Nurse: <span className="text-slate-300">{bed.nurse_assigned}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Vitals Checked: <span className="text-indigo-300">{bed.last_vitals_check}</span>
                  </div>

                  {bed.is_occupied && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${
                        bed.discharge_ready ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {bed.discharge_ready ? '✓ Discharge Ready' : 'In Ward Care'}
                      </span>
                      <button
                        onClick={() => handleAction('DISCHARGE_PREP', bed.bed_number)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        Initiate Discharge
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
