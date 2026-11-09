'use client'
import { useState } from 'react'
import { BarChart3, Download, FileText, TrendingUp, Users, Bed, CreditCard, Stethoscope, RefreshCw, Filter, Calendar } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const REPORT_TEMPLATES = [
  { id: 'patient_census', label: 'Patient Census Report', description: 'Daily/monthly patient admissions, discharges & occupancy', icon: <Users size={20} />, color: '#6366f1' },
  { id: 'revenue_summary', label: 'Revenue Summary', description: 'Income, billing, insurance claims & outstanding dues', icon: <CreditCard size={20} />, color: '#10b981' },
  { id: 'bed_occupancy', label: 'Bed Occupancy Trends', description: 'Ward-wise bed usage, turnaround & availability over time', icon: <Bed size={20} />, color: '#8b5cf6' },
  { id: 'dept_performance', label: 'Department Performance', description: 'Efficiency scores, wait times & throughput by department', icon: <TrendingUp size={20} />, color: '#f59e0b' },
  { id: 'prescription_analytics', label: 'Prescription Analytics', description: 'Most prescribed drugs, dosage trends & allergy alerts', icon: <Stethoscope size={20} />, color: '#ec4899' },
  { id: 'lab_turnaround', label: 'Lab Turnaround Report', description: 'Test order to result time, pending tests & critical flags', icon: <FileText size={20} />, color: '#0ea5e9' },
]

const PATIENT_CENSUS_DATA = [
  { month: 'May', admissions: 420, discharges: 398, occupancy: 82 },
  { month: 'Jun', admissions: 465, discharges: 442, occupancy: 85 },
  { month: 'Jul', admissions: 398, discharges: 381, occupancy: 79 },
  { month: 'Aug', admissions: 512, discharges: 488, occupancy: 91 },
  { month: 'Sep', admissions: 478, discharges: 461, occupancy: 87 },
  { month: 'Oct', admissions: 534, discharges: 495, occupancy: 93 },
]

const REVENUE_DATA = [
  { month: 'May', revenue: 4200000, cost: 2900000, profit: 1300000 },
  { month: 'Jun', revenue: 4650000, cost: 3100000, profit: 1550000 },
  { month: 'Jul', revenue: 3980000, cost: 2750000, profit: 1230000 },
  { month: 'Aug', revenue: 5120000, cost: 3400000, profit: 1720000 },
  { month: 'Sep', revenue: 4780000, cost: 3150000, profit: 1630000 },
  { month: 'Oct', revenue: 5340000, cost: 3500000, profit: 1840000 },
]

const DEPT_PERF = [
  { dept: 'Cardiology',   efficiency: 94, wait: 12, patients: 128 },
  { dept: 'Orthopedics',  efficiency: 87, wait: 18, patients: 95 },
  { dept: 'Neurology',    efficiency: 91, wait: 15, patients: 72 },
  { dept: 'Pediatrics',   efficiency: 96, wait: 8,  patients: 143 },
  { dept: 'General Med',  efficiency: 82, wait: 24, patients: 218 },
  { dept: 'Surgery',      efficiency: 88, wait: 30, patients: 64 },
]

const BED_WARD = [
  { name: 'ICU', value: 18, fill: '#8b5cf6' },
  { name: 'Emergency', value: 32, fill: '#ef4444' },
  { name: 'General', value: 98, fill: '#3b82f6' },
  { name: 'Private', value: 38, fill: '#f59e0b' },
  { name: 'Pediatric', value: 18, fill: '#10b981' },
  { name: 'Available', value: 57, fill: '#1e293b' },
]

const fmt = (n: number) => 'Rs.' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n.toLocaleString('en-IN'))

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 10000 ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ReportBuilderPage() {
  const [activeReport, setActiveReport] = useState('patient_census')
  const [period, setPeriod] = useState('6m')
  const [generating, setGenerating] = useState(false)

  const handleExportPDF = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1200))
    setGenerating(false)
    alert('PDF export triggered! In production this generates a printable PDF via the backend /api/v1/analytics/export endpoint.')
  }

  const handleExportCSV = () => {
    const data = activeReport === 'patient_census' ? PATIENT_CENSUS_DATA :
                 activeReport === 'revenue_summary' ? REVENUE_DATA :
                 DEPT_PERF
    const keys = Object.keys(data[0])
    const csv = [keys.join(','), ...data.map((r: any) => keys.map(k => r[k]).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = activeReport + '.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const active = REPORT_TEMPLATES.find(r => r.id === activeReport)!

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#10b981' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={18} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Analytics</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Report Builder</h1>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Generate, preview and export hospital performance reports</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="1m" style={{ background: '#13131e' }}>Last Month</option>
              <option value="3m" style={{ background: '#13131e' }}>Last 3 Months</option>
              <option value="6m" style={{ background: '#13131e' }}>Last 6 Months</option>
              <option value="1y" style={{ background: '#13131e' }}>Last Year</option>
            </select>
            <button onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>
              {generating ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
              {generating ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Template Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {REPORT_TEMPLATES.map(tmpl => (
          <button key={tmpl.id} onClick={() => setActiveReport(tmpl.id)}
            className="glass-card p-4 text-left transition-all hover:scale-[1.02]"
            style={{
              borderColor: activeReport === tmpl.id ? tmpl.color : 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderStyle: 'solid',
              boxShadow: activeReport === tmpl.id ? `0 0 0 2px ${tmpl.color}30` : undefined,
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                 style={{ background: tmpl.color + '18', color: tmpl.color }}>
              {tmpl.icon}
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: activeReport === tmpl.id ? tmpl.color : '#e2e8f0' }}>
              {tmpl.label}
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>{tmpl.description}</div>
          </button>
        ))}
      </div>

      {/* Chart Preview */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5" style={{ color: active.color }}>
              {active.icon}
              <h2 className="text-base font-bold" style={{ color: '#e2e8f0' }}>{active.label}</h2>
            </div>
            <p className="text-xs" style={{ color: '#64748b' }}>{active.description} - Period: {period}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
               style={{ background: active.color + '15', color: active.color }}>
            <Calendar size={13} /> {period === '6m' ? '6-Month' : period === '1m' ? '1-Month' : period === '3m' ? '3-Month' : 'Annual'} View
          </div>
        </div>

        {activeReport === 'patient_census' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PATIENT_CENSUS_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="admissions" fill="#6366f1" radius={[4,4,0,0]} name="Admissions" />
              <Bar dataKey="discharges" fill="#10b981" radius={[4,4,0,0]} name="Discharges" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeReport === 'revenue_summary' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={REVENUE_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue" />
              <Bar dataKey="cost"    fill="#ef4444" radius={[4,4,0,0]} name="Cost" opacity={0.8} />
              <Bar dataKey="profit"  fill="#6366f1" radius={[4,4,0,0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeReport === 'bed_occupancy' && (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={BED_WARD} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={3} nameKey="name">
                  {BED_WARD.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: any) => v + ' beds'} contentStyle={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeReport === 'dept_performance' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DEPT_PERF} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} domain={[0, 100]} />
              <YAxis type="category" dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="efficiency" fill="#10b981" radius={[0,4,4,0]} name="Efficiency %" />
              <Bar dataKey="wait"       fill="#f59e0b" radius={[0,4,4,0]} name="Avg Wait (min)" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {(activeReport === 'prescription_analytics' || activeReport === 'lab_turnaround') && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={PATIENT_CENSUS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="admissions" stroke={active.color} strokeWidth={2} dot={{ r: 4, fill: active.color }} name="Volume" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Tabular Summary */}
        {activeReport === 'dept_performance' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Department', 'Efficiency', 'Avg Wait', 'Patients/Month'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPT_PERF.map((d, i) => (
                  <tr key={d.dept} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#e2e8f0' }}>{d.dept}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: d.efficiency >= 90 ? '#10b981' : d.efficiency >= 80 ? '#f59e0b' : '#ef4444' }}>{d.efficiency}%</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#94a3b8' }}>{d.wait} min</td>
                    <td className="px-4 py-3" style={{ color: '#94a3b8' }}>{d.patients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
