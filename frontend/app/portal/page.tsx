'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar, Clock, Stethoscope, Pill, Printer, FileText,
  CreditCard, MessageSquare, ShieldCheck, CheckCircle2,
  AlertTriangle, Video, Download, ArrowUpRight, Activity,
  Phone, Sparkles, Send, RefreshCw, UserCheck
} from 'lucide-react'
import { printPrescriptionDocument, printInvoiceDocument } from '@/lib/print-document'

export default function PortalHomePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'records' | 'bills' | 'chat'>('overview')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: 'Namaste Rajesh Kumar ji! I am your MediSphere AI Health Concierge. How can I assist you today? I can help you review your medications, verify doctor appointment slots, or check bed availability.',
      time: '12:00 PM',
    },
  ])
  const [payingBillId, setPayingBillId] = useState<string | null>(null)
  const [paidBills, setPaidBills] = useState<Record<string, boolean>>({})

  const patient = {
    name: 'Rajesh Kumar',
    uhid: 'MS-2026-0041',
    abha_id: '91-4829-1029-4412',
    age: 48,
    gender: 'Male',
    blood_group: 'B+',
    allergies: ['Penicillin (Severe Rash)', 'Sulfa Drugs'],
    physician: 'Dr. Priya Sharma (Cardiology)',
    phone: '+91 98450 12345',
  }

  const appointments = [
    {
      id: 'APT-9865',
      doctor: 'Dr. Priya Sharma',
      department: 'Cardiology',
      date: 'Today, 24 Oct 2026',
      time: '02:30 PM',
      type: 'IN_PERSON',
      room: 'OPD Suite 204',
      status: 'CONFIRMED',
    },
    {
      id: 'APT-1002',
      doctor: 'Dr. Rajesh Iyer',
      department: 'Neurology',
      date: 'Wed, 28 Oct 2026',
      time: '10:00 AM',
      type: 'VIDEO',
      room: 'Tele-Consult Room 3',
      status: 'SCHEDULED',
    },
  ]

  const prescriptions = [
    {
      id: 'RX-2281',
      date: '24 Oct 2026',
      doctor: 'Dr. Priya Sharma',
      medications: [
        { name: 'Amlodipine 5mg', dosage: '1 tablet once daily (morning)', duration: '30 days', purpose: 'Blood Pressure Control' },
        { name: 'Atorvastatin 20mg', dosage: '1 tablet at bedtime', duration: '30 days', purpose: 'Cholesterol Regulation' },
      ],
      refills_left: 2,
    },
    {
      id: 'RX-2104',
      date: '10 Sep 2026',
      doctor: 'Dr. Ananya Reddy',
      medications: [
        { name: 'Metformin 500mg', dosage: '1 tablet twice daily after meals', duration: '60 days', purpose: 'Glycemic Control' },
      ],
      refills_left: 1,
    },
  ]

  const records = [
    { id: 'REC-771', title: 'Comprehensive Lipid Profile', date: '22 Oct 2026', department: 'Biochemistry Lab', doctor: 'Dr. Priya Sharma', result: 'NORMAL (Total Chol 182 mg/dL)' },
    { id: 'REC-742', title: '12-Lead Resting ECG', date: '18 Oct 2026', department: 'Cardiology Diagnostics', doctor: 'Dr. Priya Sharma', result: 'Normal Sinus Rhythm' },
    { id: 'REC-689', title: 'HbA1c & Fasting Blood Glucose', date: '10 Sep 2026', department: 'Endocrine Panel', doctor: 'Dr. Ananya Reddy', result: 'HbA1c 6.4% (Pre-diabetic)' },
  ]

  const bills = [
    { id: 'INV-4019', service: 'Cardiology Outpatient Consultation & ECG', date: '24 Oct 2026', amount: 1500, insurance_covered: 1200, patient_due: 300, status: 'PENDING' },
    { id: 'INV-3982', service: 'Biochemistry Panel & Glycemic Evaluation', date: '22 Oct 2026', amount: 2400, insurance_covered: 2400, patient_due: 0, status: 'PAID' },
  ]

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    const userText = chatInput.trim()
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const newMsg = { role: 'user' as const, text: userText, time: now }

    setChatMessages((prev) => [...prev, newMsg])
    setChatInput('')

    setTimeout(() => {
      let reply = `Thank you for your inquiry, Rajesh Kumar ji. Regarding "${userText}": Dr. Priya Sharma has reviewed your recent telemetry and confirmed your blood pressure is well within the target range (128/82 mmHg). If you need an instant prescription refill or room modification, I can schedule that immediately.`
      if (userText.toLowerCase().includes('bed')) {
        reply = 'There are currently 6 general ward beds and 2 cardiac observation beds available. Would you like our AI orchestrator to pre-reserve a bed under your UHID MS-2026-0041?'
      } else if (userText.toLowerCase().includes('appointment')) {
        reply = 'You have a confirmed appointment with Dr. Priya Sharma today at 02:30 PM in OPD Suite 204. Please arrive 10 minutes early for vitals check-in.'
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
      ])
    }, 600)
  }

  const handlePrintRx = (rx: any) => {
    printPrescriptionDocument({
      id: rx.id,
      patient_name: patient.name,
      patient_id: patient.uhid,
      doctor_name: rx.doctor,
      department: 'Cardiology',
      issued_at: new Date().toISOString(),
      medications: rx.medications.map((m: any) => ({
        medicine_name: m.name,
        dosage: m.dosage,
        frequency: 'Daily as prescribed',
        duration_days: 30,
        special_instructions: m.purpose,
      })),
      diagnosis: 'Essential Hypertension · Preventive Lipid Management',
      notes: 'Low sodium diet, brisk walking 30 mins daily. Contact emergency if systolic BP > 160 mmHg.',
    })
  }

  const handlePayBill = (billId: string) => {
    setPayingBillId(billId)
    setTimeout(() => {
      setPaidBills((prev) => ({ ...prev, [billId]: true }))
      setPayingBillId(null)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* ── Patient Profile Hero Card ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d1e34] via-[#0f283c] to-[#0d1e34] border border-teal-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                ACTIVE PATIENT PROFILE
              </span>
              <span className="text-xs text-slate-400">UHID: {patient.uhid}</span>
              <span className="text-xs text-slate-400">· ABHA: {patient.abha_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{patient.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
              <span>{patient.gender}, {patient.age} Yrs</span>
              <span>·</span>
              <span className="font-semibold text-rose-400">Blood Group: {patient.blood_group}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-teal-300">
                <Stethoscope className="w-3.5 h-3.5" /> {patient.physician}
              </span>
            </div>
            {/* Allergies tag */}
            <div className="flex items-center gap-2 mt-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-amber-300/90">
                <span className="font-bold">Documented Allergies:</span> {patient.allergies.join(', ')}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('appointments')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
            >
              <Calendar className="w-4 h-4" /> Book Appointment
            </button>
            <button
              onClick={() => handlePrintRx(prescriptions[0])}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-semibold text-xs transition-all"
            >
              <Printer className="w-4 h-4 text-teal-400" /> Print Active Rx
            </button>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/[0.08] pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Care Overview', icon: Activity },
          { id: 'appointments', label: 'My Appointments (2)', icon: Calendar },
          { id: 'prescriptions', label: 'Active Prescriptions (2)', icon: Pill },
          { id: 'records', label: 'Diagnostic Records (3)', icon: FileText },
          { id: 'bills', label: 'Invoices & Claims (2)', icon: CreditCard },
          { id: 'chat', label: 'AI Health Concierge', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Care Overview Section ── */}
      {(activeTab === 'overview' || activeTab === 'appointments') && (
        <section id="appointments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" /> Upcoming Consultations
            </h2>
            <Link
              href="/dashboard/appointments/book"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Book with AI Allocation Agent</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-xl bg-[#0c1322] border border-white/[0.08] p-5 hover:border-teal-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {apt.type === 'VIDEO' ? 'TELE-CONSULTATION' : 'IN-PERSON CLINIC'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2">{apt.doctor}</h3>
                      <p className="text-xs text-teal-400">{apt.department}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {apt.status}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Date & Time</span>
                      <span className="font-semibold">{apt.date} · {apt.time}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Room / Link</span>
                      <span className="font-semibold text-slate-200">{apt.room}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {apt.type === 'VIDEO' ? (
                    <button className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                      <Video className="w-3.5 h-3.5" /> Join Tele-Call
                    </button>
                  ) : (
                    <button className="flex-1 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all">
                      Check-In at Kiosk
                    </button>
                  )}
                  <button className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Active Prescriptions Section ── */}
      {(activeTab === 'overview' || activeTab === 'prescriptions') && (
        <section id="prescriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-400" /> Active Medications & Prescriptions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-xl bg-[#0c1322] border border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-400">{rx.id}</span>
                    <p className="text-xs text-slate-400">Prescribed by {rx.doctor} · {rx.date}</p>
                  </div>
                  <button
                    onClick={() => handlePrintRx(rx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.08]"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" /> Download PDF
                  </button>
                </div>

                <div className="space-y-2">
                  {rx.medications.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{m.name}</span>
                        <span className="text-[10px] font-semibold text-teal-300 px-2 py-0.5 rounded bg-teal-500/10">
                          {m.duration}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{m.dosage}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Indication: {m.purpose}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span>Refills Available: <strong className="text-white">{rx.refills_left}</strong></span>
                  <button className="text-teal-400 hover:text-teal-300 font-semibold text-xs">
                    Request Online Refill →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Diagnostic Records Section ── */}
      {(activeTab === 'overview' || activeTab === 'records') && (
        <section id="records" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" /> Clinical & Diagnostic Reports
            </h2>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-white/[0.08] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3">Investigation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Key Finding / Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-white">{r.title}</td>
                    <td className="px-4 py-3 text-slate-400">{r.date}</td>
                    <td className="px-4 py-3 text-slate-300">{r.department}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                        {r.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Billing & Invoices Section ── */}
      {(activeTab === 'overview' || activeTab === 'bills') && (
        <section id="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" /> Invoices & Settlement
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((b) => {
              const isPaid = paidBills[b.id] || b.status === 'PAID'
              return (
                <div key={b.id} className="rounded-xl bg-[#0c1322] border border-white/[0.08] p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-teal-400">{b.id}</span>
                      <h4 className="text-sm font-bold text-white mt-1">{b.service}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{b.date}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isPaid ? 'SETTLED' : 'DUE'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Billed Amount:</span>
                      <span className="font-semibold text-white">₹{b.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Insurance Pre-Authorization:</span>
                      <span className="font-semibold text-emerald-400">-₹{b.insurance_covered.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-white/[0.06]">
                      <span>Patient Due:</span>
                      <span className="text-amber-400">
                        ₹{isPaid ? 0 : b.patient_due.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isPaid ? (
                      <button
                        onClick={() => handlePayBill(b.id)}
                        disabled={payingBillId === b.id}
                        className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        {payingBillId === b.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing UPI/Card...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" /> Pay ₹{b.patient_due} Online
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Receipt Generated
                      </div>
                    )}
                    <button
                      onClick={() =>
                        printInvoiceDocument({
                          invoice_number: b.id,
                          patient_name: patient.name,
                          patient_id: patient.uhid,
                          date: b.date,
                          status: isPaid ? 'PAID' : 'PENDING',
                          payment_method: isPaid ? 'UPI Instant Pay' : 'Pending',
                          total: b.amount,
                          paid: isPaid ? b.amount : 0,
                          items: [{ description: b.service, quantity: 1, unit_price: b.amount, total: b.amount }],
                        })
                      }
                      className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs"
                    >
                      Print Receipt
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── AI Health Concierge Assistant ── */}
      <section id="assistant" className="rounded-2xl bg-[#0c1424] border border-teal-500/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">MediSphere AI Health Concierge</h3>
              <p className="text-xs text-slate-400">Instant answers regarding medications, appointments & bed availability</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
          </span>
        </div>

        {/* Message Stream */}
        <div className="h-64 overflow-y-auto space-y-3 p-4 rounded-xl bg-[#070b14] border border-white/[0.04]">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-[#131d31] text-slate-200 border border-white/[0.08] rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your prescribed medicines, doctors, or bed availability..."
            className="flex-1 bg-[#070b14] border border-white/[0.1] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </section>
    </div>
  )
}
