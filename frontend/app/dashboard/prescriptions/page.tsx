'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Pill, Plus, Search, CheckCircle, XCircle, Clock, Package,
  AlertTriangle, Shield, Activity, BarChart3, ClipboardList,
  ChevronDown, ChevronUp, AlertCircle, User, Stethoscope,
  RefreshCw, Bell, FileText, TrendingUp, Zap, Printer
} from 'lucide-react'
import { api } from '@/lib/api'
import { printPrescriptionDocument } from '@/lib/print-document'


// ─── Types ──────────────────────────────────────────────────────────────────

interface Medication {
  medicine_name: string
  dosage: string
  frequency: string
  duration_days: number
  route: string
  is_dispensed: boolean
  special_instructions?: string
}

interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  diagnosis?: string
  notes?: string
  medications: Medication[]
  status: 'ACTIVE' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED'
  is_renewable: boolean
  issued_at: string
  expires_at?: string
}

interface DrugWarning {
  severity: string
  drug_a?: string
  drug_b?: string
  allergy?: string
  drug?: string
  description: string
  type?: string
}

interface AuditEntry {
  id: string
  action: string
  username: string
  outcome: string
  detail?: string
  timestamp: string
}

interface Patient {
  id: string
  _id?: string
  first_name: string
  last_name: string
  blood_group?: string
  allergies?: string[]
  date_of_birth?: string
  gender?: string
}

interface NewMed {
  medicine_name: string
  dosage: string
  frequency: string
  duration_days: number
  route: string
  special_instructions: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  ACTIVE:    { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.3)',  icon: <Clock size={11} />,         label: 'Active' },
  DISPENSED: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.3)',  icon: <CheckCircle size={11} />,   label: 'Dispensed' },
  RENEWED:   { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.3)',  icon: <RefreshCw size={11} />,     label: 'Renewed' },
  PENDING:   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  icon: <Clock size={11} />,         label: 'Pending' },
  DRAFT:     { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)', icon: <FileText size={11} />,      label: 'Draft' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)',   icon: <XCircle size={11} />,       label: 'Cancelled' },
  EXPIRED:   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  icon: <AlertTriangle size={11} />, label: 'Expired' },
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  low:      '#10b981',
}

const ROUTES = ['oral', 'IV', 'topical', 'inhaled', 'sublingual', 'rectal', 'transdermal']
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Weekly', 'As needed']

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function toastClass(type: 'success' | 'error' | 'warning') {
  return {
    success: 'rgba(16,185,129,0.15)',
    error: 'rgba(239,68,68,0.15)',
    warning: 'rgba(245,158,11,0.15)',
  }[type]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'|'warning'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const color = type === 'success' ? '#34d399' : type === 'error' ? '#f87171' : '#fbbf24'
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-fade-in-up"
         style={{ background: toastClass(type), border: `1px solid ${color}40`, color, backdropFilter: 'blur(12px)', minWidth: 280 }}>
      {type === 'success' ? <CheckCircle size={16}/> : type === 'error' ? <AlertCircle size={16}/> : <AlertTriangle size={16}/>}
      {msg}
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100"><XCircle size={14}/></button>
    </div>
  )
}

function DrugWarningBanner({ warnings }: { warnings: DrugWarning[] }) {
  if (!warnings.length) return null
  const hasCritical = warnings.some(w => w.severity === 'critical')
  return (
    <div className="rounded-xl p-4 space-y-2 border"
         style={{ background: hasCritical ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderColor: hasCritical ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: hasCritical ? '#f87171' : '#fbbf24' }}>
        <Shield size={15}/> {hasCritical ? 'Critical Drug Safety Warning' : 'Drug Interaction Warning'}
      </div>
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2 text-xs" style={{ color: SEVERITY_COLORS[w.severity] || '#94a3b8' }}>
          <span className="font-bold uppercase px-1.5 py-0.5 rounded text-[10px] flex-shrink-0" style={{ background: `${SEVERITY_COLORS[w.severity]}20` }}>
            {w.severity}
          </span>
          <span>{w.description}</span>
        </div>
      ))}
    </div>
  )
}

// ─── New Prescription Modal ────────────────────────────────────────────────────

function NewPrescriptionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [patientQuery, setPatientQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [meds, setMeds] = useState<NewMed[]>([{ medicine_name: '', dosage: '', frequency: 'Once daily', duration_days: 30, route: 'oral', special_instructions: '' }])
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [isRenewable, setIsRenewable] = useState(false)
  const [warnings, setWarnings] = useState<DrugWarning[]>([])
  const [validationLoading, setValidationLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasCriticalWarning, setHasCriticalWarning] = useState(false)
  const [forceSubmit, setForceSubmit] = useState(false)

  // Search patients
  useEffect(() => {
    if (patientQuery.length < 2) { setPatients([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/patients/search?query=${encodeURIComponent(patientQuery)}`)
        setPatients(res.data || [])
      } catch {
        setPatients([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [patientQuery])

  const addMed = () => setMeds(p => [...p, { medicine_name: '', dosage: '', frequency: 'Once daily', duration_days: 30, route: 'oral', special_instructions: '' }])
  const removeMed = (i: number) => setMeds(p => p.filter((_, idx) => idx !== i))
  const updateMed = (i: number, field: keyof NewMed, val: string | number) =>
    setMeds(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const runValidation = async () => {
    const validMeds = meds.filter(m => m.medicine_name.trim())
    if (!validMeds.length) return
    setValidationLoading(true)
    try {
      const res = await api.post('/prescriptions/validate', {
        medications: validMeds,
        patient_allergies: selectedPatient?.allergies || [],
      })
      const allWarnings = [
        ...(res.data.interaction_warnings || []),
        ...(res.data.allergy_alerts || []),
      ]
      setWarnings(allWarnings)
      setHasCriticalWarning(allWarnings.some((w: DrugWarning) => w.severity === 'critical'))
    } catch {
      setWarnings([])
    } finally {
      setValidationLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPatient) return
    if (hasCriticalWarning && !forceSubmit) {
      setForceSubmit(true)
      return
    }
    setSubmitting(true)
    try {
      const patientId = selectedPatient.id || selectedPatient._id || ''
      await api.post('/prescriptions/', {
        patient_id: patientId,
        medications: meds.filter(m => m.medicine_name.trim()),
        diagnosis,
        notes,
        valid_days: validDays,
        is_renewable: isRenewable,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create prescription')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
           style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Pill size={20} className="text-indigo-400"/> New Prescription</h2>
            <p className="text-xs text-slate-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <XCircle size={18}/>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {['Select Patient', 'Add Medications', 'Review & Submit'].map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-1 rounded-full" style={{ background: step > i + 1 ? '#6366f1' : step === i + 1 ? '#818cf8' : 'rgba(255,255,255,0.08)' }}/>
              <span className="text-[10px] font-medium" style={{ color: step === i + 1 ? '#818cf8' : '#475569' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Patient Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search patient by name..."
                  value={patientQuery}
                  onChange={e => setPatientQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                />
              </div>
              {patients.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {patients.map((p) => {
                    const pid = p.id || (p as any)._id || ''
                    const isSelected = selectedPatient && (selectedPatient.id === pid || (selectedPatient as any)._id === pid)
                    return (
                      <button key={pid} onClick={() => { setSelectedPatient({ ...p, id: pid }); setPatientQuery(`${p.first_name} ${p.last_name}`) }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                              style={{ background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                             style={{ background: p.gender === 'FEMALE' ? '#ec4899' : '#3b82f6' }}>
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{p.first_name} {p.last_name}</div>
                          <div className="text-xs text-slate-500">{p.blood_group || '—'} · {p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : '?'}</div>
                        </div>
                        {p.allergies?.length ? (
                          <div className="ml-auto flex gap-1 flex-wrap justify-end">
                            {p.allergies.map((a, aIdx) => (
                              <span key={`${p.id || 'pt'}-al-${aIdx}-${a}`} className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{a}</span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedPatient && (
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0"/>
                  <span className="text-sm text-slate-200">Selected: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Medications */}
          {step === 2 && (
            <div className="space-y-4">
              {meds.map((med, i) => (
                <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Medication {i + 1}</span>
                    {meds.length > 1 && (
                      <button onClick={() => removeMed(i)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <XCircle size={12}/> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Medicine Name *</label>
                      <input type="text" value={med.medicine_name}
                             onChange={e => updateMed(i, 'medicine_name', e.target.value)}
                             placeholder="e.g. Amlodipine"
                             className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Dosage *</label>
                      <input type="text" value={med.dosage}
                             onChange={e => updateMed(i, 'dosage', e.target.value)}
                             placeholder="e.g. 5mg"
                             className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Duration (days)</label>
                      <input type="number" value={med.duration_days}
                             onChange={e => updateMed(i, 'duration_days', parseInt(e.target.value))}
                             min={1} max={365}
                             className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
                      <select value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Route</label>
                      <select value={med.route} onChange={e => updateMed(i, 'route', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Special Instructions</label>
                      <input type="text" value={med.special_instructions}
                             onChange={e => updateMed(i, 'special_instructions', e.target.value)}
                             placeholder="e.g. Take after food"
                             className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addMed} className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.4)', color: '#818cf8' }}>
                <Plus size={14}/> Add Another Medication
              </button>

              {/* AI Validation */}
              <button onClick={runValidation} disabled={validationLoading}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }}>
                {validationLoading ? <RefreshCw size={14} className="animate-spin"/> : <Shield size={14}/>}
                {validationLoading ? 'Checking interactions…' : '🧬 Run AI Drug Interaction Check'}
              </button>

              {warnings.length > 0 && <DrugWarningBanner warnings={warnings} />}
              {warnings.length === 0 && !validationLoading && meds.some(m => m.medicine_name) && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={12}/> No drug interactions detected for these medications.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Diagnosis / Indication</label>
                  <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                         placeholder="e.g. Hypertension, Type 2 Diabetes"
                         className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                         style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Valid for (days)</label>
                  <input type="number" value={validDays} min={1} max={365} onChange={e => setValidDays(parseInt(e.target.value))}
                         className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                         style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <input id="renewable" type="checkbox" checked={isRenewable} onChange={e => setIsRenewable(e.target.checked)} className="accent-indigo-500"/>
                  <label htmlFor="renewable" className="text-sm text-slate-300 cursor-pointer">Allow Refills</label>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            rows={2} placeholder="Optional pharmacist / doctor notes..."
                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}/>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Prescription Summary</div>
                <div className="text-sm text-slate-200"><span className="text-slate-500">Patient:</span> {selectedPatient?.first_name} {selectedPatient?.last_name}</div>
                <div className="text-sm text-slate-200"><span className="text-slate-500">Medications:</span> {meds.filter(m => m.medicine_name).length} item(s)</div>
                <div className="text-sm text-slate-200"><span className="text-slate-500">Valid for:</span> {validDays} days</div>
                {warnings.length > 0 && <DrugWarningBanner warnings={warnings}/>}
              </div>

              {hasCriticalWarning && forceSubmit && (
                <div className="p-3 rounded-xl text-sm font-semibold text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  ⚠️ Critical drug interaction detected. Click Submit again to override and prescribe anyway.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between p-6 border-t gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && !selectedPatient}
                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
                    style={{ background: submitting ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {submitting ? <RefreshCw size={14} className="animate-spin"/> : <Pill size={14}/>}
              {submitting ? 'Issuing…' : (hasCriticalWarning && forceSubmit) ? '⚠️ Override & Submit' : 'Issue Prescription'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Audit Trail Panel ─────────────────────────────────────────────────────────

function AuditTrail({ prescriptionId }: { prescriptionId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/prescriptions/${prescriptionId}/audit`)
      .then(r => setLogs(r.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [prescriptionId])

  const ACTION_COLORS: Record<string, string> = {
    CREATE_PRESCRIPTION: '#10b981',
    DISPENSE_PRESCRIPTION: '#818cf8',
    CANCEL_PRESCRIPTION: '#f87171',
  }

  if (loading) return <div className="text-xs text-slate-500 py-2 animate-pulse">Loading audit trail…</div>
  if (!logs.length) return <div className="text-xs text-slate-500 py-2">No audit entries recorded yet.</div>

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACTION_COLORS[log.action] || '#64748b' }}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold" style={{ color: ACTION_COLORS[log.action] || '#94a3b8' }}>{log.action.replace(/_/g, ' ')}</span>
              <span className="text-[10px] text-slate-500">by {log.username}</span>
              <span className="text-[10px] text-slate-600 ml-auto">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
            </div>
            {log.detail && <p className="text-xs text-slate-400 mt-0.5">{log.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Alert Banner ──────────────────────────────────────────────────────────────

function PrescriptionAlertBanner({ alerts }: { alerts: { expiring_soon: any[]; just_expired: any[]; total_alerts: number } }) {
  const [dismissed, setDismissed] = useState(false)
  if (!alerts.total_alerts || dismissed) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <Bell size={15} className="text-red-400 flex-shrink-0 animate-pulse"/>
      <p className="text-sm flex-1" style={{ color: '#fca5a5' }}>
        <span className="font-bold text-white mr-2">Prescription Alerts:</span>
        {alerts.expiring_soon.length > 0 && <span>{alerts.expiring_soon.length} prescription(s) expiring within 3 days · </span>}
        {alerts.just_expired.length > 0 && <span>{alerts.just_expired.length} prescription(s) auto-expired · </span>}
      </p>
      <button onClick={() => setDismissed(true)} className="text-xs text-red-400 hover:text-red-300 flex-shrink-0"><XCircle size={14}/></button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list')
  const [showNewModal, setShowNewModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [alerts, setAlerts] = useState<{ expiring_soon: any[]; just_expired: any[]; total_alerts: number } | null>(null)
  const [auditOpen, setAuditOpen] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => setToast({ msg, type })

  const loadPrescriptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/prescriptions/')
      setPrescriptions(res.data || [])
    } catch {
      // Fallback to demo mock data for offline display
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAlerts = useCallback(async () => {
    try {
      const res = await api.get('/prescriptions/alerts')
      setAlerts(res.data)
    } catch {
      setAlerts(null)
    }
  }, [])

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await api.get('/analytics/prescriptions')
      setAnalytics(res.data)
    } catch {
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => { loadPrescriptions(); loadAlerts() }, [loadPrescriptions, loadAlerts])
  useEffect(() => { if (activeTab === 'analytics') loadAnalytics() }, [activeTab])

  const handleDispense = async (id: string) => {
    try {
      await api.post(`/prescriptions/${id}/dispense`)
      showToast('Prescription dispensed successfully', 'success')
      loadPrescriptions()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to dispense', 'error')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this prescription?')) return
    try {
      await api.post(`/prescriptions/${id}/cancel?reason=Cancelled by doctor`)
      showToast('Prescription cancelled', 'warning')
      loadPrescriptions()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to cancel', 'error')
    }
  }

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.patient_id.toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q) || (p.diagnosis || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    active:    prescriptions.filter(p => p.status === 'ACTIVE').length,
    dispensed: prescriptions.filter(p => p.status === 'DISPENSED').length,
    expired:   prescriptions.filter(p => p.status === 'EXPIRED').length,
    cancelled: prescriptions.filter(p => p.status === 'CANCELLED').length,
    total:     prescriptions.length,
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      {showNewModal && <NewPrescriptionModal onClose={() => setShowNewModal(false)} onCreated={() => { loadPrescriptions(); showToast('Prescription issued & patient notified!', 'success') }}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Prescription Lifecycle Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Issue, validate, track, dispense, and audit all patient prescriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadPrescriptions} className="p-2 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
            <RefreshCw size={15}/>
          </button>
          <button id="new-prescription-btn" onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            <Plus size={16}/> New Prescription
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts && <PrescriptionAlertBanner alerts={alerts}/>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {[
          { label: 'Total',     value: stats.total,     color: '#6366f1', icon: <Pill size={20}/> },
          { label: 'Active',    value: stats.active,    color: '#10b981', icon: <Clock size={20}/> },
          { label: 'Dispensed', value: stats.dispensed, color: '#818cf8', icon: <Package size={20}/> },
          { label: 'Expired',   value: stats.expired,   color: '#f59e0b', icon: <AlertTriangle size={20}/> },
          { label: 'Cancelled', value: stats.cancelled, color: '#f87171', icon: <XCircle size={20}/> },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as React.CSSProperties}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}20`, color: k.color }}>
              {k.icon}
            </div>
            <div className="text-3xl font-bold" style={{ color: k.color }}>{loading ? '—' : k.value}</div>
            <div className="text-xs mt-1 font-medium text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'list', label: '💊 Prescriptions', icon: <Pill size={13}/> },
          { id: 'analytics', label: '📊 Analytics & Reports', icon: <BarChart3 size={13}/> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === tab.id ? '#818cf8' : '#64748b', border: activeTab === tab.id ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prescriptions List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input id="prescription-search" type="text" placeholder="Search by patient ID, RX ID, diagnosis…"
                     value={search} onChange={e => setSearch(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}/>
            </div>
            {['ALL', 'ACTIVE', 'DISPENSED', 'CANCELLED', 'EXPIRED'].map(s => (
              <button key={s} id={`prx-filter-${s.toLowerCase()}`} onClick={() => setStatusFilter(s)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                        color: statusFilter === s ? '#818cf8' : '#64748b',
                        border: `1px solid ${statusFilter === s ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}/>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="text-center py-16 glass-card" style={{ color: '#475569' }}>
                  <Pill size={40} className="mx-auto mb-3 opacity-20"/>
                  <p className="text-sm">No prescriptions match your filters</p>
                  <button onClick={() => setShowNewModal(true)} className="mt-3 text-xs text-indigo-400 hover:underline">Issue first prescription →</button>
                </div>
              )}
              {filtered.map(prx => {
                const normStatus = (prx.status || 'ACTIVE').toUpperCase()
                const style = STATUS_STYLES[normStatus] || {
                  bg: 'rgba(99,102,241,0.12)',
                  text: '#818cf8',
                  border: 'rgba(99,102,241,0.3)',
                  icon: <Clock size={11} />,
                  label: prx.status || 'Active'
                }
                const isExpanded = expanded === prx.id
                const daysLeft = daysUntil(prx.expires_at)
                const isExpiringSoon = normStatus === 'ACTIVE' && daysLeft !== null && daysLeft <= 3
                return (
                  <div key={prx.id} className="glass-card overflow-hidden transition-all duration-300">
                    <button id={`prx-row-${prx.id}`}
                            onClick={() => setExpanded(isExpanded ? null : (prx.id || ''))}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            <Pill size={18} className="text-white"/>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-indigo-400">{(prx.id || '').slice(-10).toUpperCase()}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold"
                                  style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                              {style.icon} {style.label}
                            </span>
                            {isExpiringSoon && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                                <AlertCircle size={9}/> EXPIRES IN {daysLeft}d
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-1 text-slate-500 truncate">
                            Patient: {prx.patient_id.slice(-8)} · {prx.diagnosis || 'No diagnosis'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <div className="text-right hidden md:block">
                          <div className="text-[10px] text-slate-600">Expires</div>
                          <div className="text-xs font-medium text-slate-400">
                            {prx.expires_at ? new Date(prx.expires_at).toLocaleDateString('en-IN') : '—'}
                          </div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                          {prx.medications.length} med{prx.medications.length > 1 ? 's' : ''}
                        </div>
                        <span className="text-slate-500 text-lg transition-transform duration-200"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </div>
                    </button>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {/* Sub-tabs */}
                        <div className="flex gap-2 mb-4">
                          {[
                            { id: 'meds', label: '💊 Medications' },
                            { id: 'audit', label: '🔐 Audit Trail' },
                          ].map(t => (
                            <button key={t.id}
                                    onClick={() => setAuditOpen(auditOpen === `${prx.id}-${t.id}` ? null : `${prx.id}-${t.id}`)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: auditOpen === `${prx.id}-${t.id}` ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: auditOpen === `${prx.id}-${t.id}` ? '#818cf8' : '#64748b' }}>
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Medications sub-panel */}
                        {(!auditOpen || auditOpen === `${prx.id}-meds`) && (
                          <div className="space-y-2">
                            {prx.medications.map((med, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                   style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                    <Pill size={14} style={{ color: '#818cf8' }}/>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-100">{med.medicine_name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      {med.dosage} · {med.frequency} · {med.duration_days} days · {med.route}
                                    </div>
                                    {med.special_instructions && (
                                      <div className="text-xs text-amber-400 mt-0.5">📋 {med.special_instructions}</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  {med.is_dispensed ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                          style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                                      <CheckCircle size={10}/> Dispensed
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                          style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}

                            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/5">
                              <button
                                onClick={() => printPrescriptionDocument(prx)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white"
                              >
                                <Printer size={12}/> Print / Export Rx PDF
                              </button>
                              {prx.status === 'ACTIVE' && (
                                <>
                                  <button id={`dispense-${prx.id}`} onClick={() => handleDispense(prx.id || '')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1"
                                          style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    <Package size={12}/> Mark Dispensed
                                  </button>
                                  <button id={`cancel-prx-${prx.id}`} onClick={() => handleCancel(prx.id || '')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1"
                                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                                    <XCircle size={12}/> Cancel
                                  </button>
                                  {prx.is_renewable && (
                                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1"
                                            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                                      <RefreshCw size={12}/> Renew
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                        )}

                        {/* Audit sub-panel */}
                        {auditOpen === `${prx.id}-audit` && (
                          <AuditTrail prescriptionId={prx.id || ''}/>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {analyticsLoading ? (
            <div className="glass-card h-64 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}/>
          ) : analytics ? (
            <>
              {/* Analytics KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Prescriptions', value: analytics.total_prescriptions, color: '#6366f1', icon: <Pill size={20}/> },
                  { label: 'Avg Dispense Time', value: `${analytics.avg_dispensing_hours}h`, color: '#10b981', icon: <Zap size={20}/> },
                  { label: 'Expiry Rate', value: `${analytics.expiry_rate_percent}%`, color: '#f59e0b', icon: <TrendingUp size={20}/> },
                  { label: 'Dispensed', value: analytics.status_breakdown?.find((s: any) => s.status === 'DISPENSED')?.count || 0, color: '#818cf8', icon: <Package size={20}/> },
                ].map(k => (
                  <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as React.CSSProperties}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}20`, color: k.color }}>{k.icon}</div>
                    <div className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-xs mt-1 font-medium text-slate-500">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Status Breakdown */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><Activity size={15} className="text-indigo-400"/> Status Breakdown</h3>
                  <div className="space-y-3">
                    {analytics.status_breakdown?.map((s: any) => {
                      const style = STATUS_STYLES[s.status] || { text: '#94a3b8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', icon: null, label: s.status }
                      const pct = analytics.total_prescriptions ? Math.round(s.count / analytics.total_prescriptions * 100) : 0
                      return (
                        <div key={s.status}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: style.bg, color: style.text }}>{s.status}</span>
                            <span className="text-xs font-bold text-slate-300">{s.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: style.text }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Medications */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-purple-400"/> Top Prescribed Medications</h3>
                  {analytics.top_medications?.length ? (
                    <div className="space-y-2">
                      {analytics.top_medications.map((med: any, i: number) => {
                        const maxCount = analytics.top_medications[0]?.count || 1
                        const pct = Math.round(med.count / maxCount * 100)
                        const color = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#a78bfa'][i % 10]
                        return (
                          <div key={med.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-300 truncate">{med.name}</span>
                              <span className="text-xs font-bold text-slate-400 ml-2">{med.count}×</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No prescription data yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 glass-card" style={{ color: '#475569' }}>
              <BarChart3 size={40} className="mx-auto mb-3 opacity-20"/>
              <p className="text-sm">Analytics unavailable</p>
              <button onClick={loadAnalytics} className="mt-3 text-xs text-indigo-400 hover:underline">Retry →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
