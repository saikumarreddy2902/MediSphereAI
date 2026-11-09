'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HeartPulse, Calendar, Pill, FileText, CreditCard,
  MessageSquare, User, LogOut, ShieldCheck, Bell, ChevronDown
} from 'lucide-react'

const PORTAL_NAV = [
  { href: '/portal', label: 'My Care Home', icon: HeartPulse },
  { href: '/portal#appointments', label: 'Appointments', icon: Calendar },
  { href: '/portal#prescriptions', label: 'Prescriptions', icon: Pill },
  { href: '/portal#records', label: 'Medical Records', icon: FileText },
  { href: '/portal#billing', label: 'Bills & Payments', icon: CreditCard },
  { href: '/portal#assistant', label: 'AI Health Concierge', icon: MessageSquare },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [patientUser, setPatientUser] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('medisphere_user')
      if (stored) {
        setPatientUser(JSON.parse(stored))
      } else {
        setPatientUser({ name: 'Rajesh Kumar', email: 'patient@medisphere.com', role: 'patient' })
      }
    } catch {
      setPatientUser({ name: 'Rajesh Kumar', email: 'patient@medisphere.com', role: 'patient' })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('medisphere_token')
    localStorage.removeItem('medisphere_user')
    document.cookie = 'medisphere_user=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* ── Top Patient Header ── */}
      <header className="sticky top-0 z-40 bg-[#0d1424]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/portal" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
                  MediSphere
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  PATIENT PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">National Health Mission · NABH Accredited</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-300 text-xs">
                  {patientUser?.name ? patientUser.name[0] : 'P'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-slate-200 leading-tight">
                    {patientUser?.name || 'Rajesh Kumar'}
                  </div>
                  <div className="text-[10px] text-teal-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> UHID: MS-0041
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f172a] border border-white/[0.1] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <div className="font-semibold text-white">{patientUser?.name || 'Rajesh Kumar'}</div>
                    <div className="text-[11px] text-slate-400">{patientUser?.email || 'patient@medisphere.com'}</div>
                  </div>
                  <Link
                    href="/dashboard/patient-portal"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.04] text-slate-300 hover:text-white"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Full Patient Dossier
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-t border-white/[0.04] scrollbar-none">
          {PORTAL_NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap bg-white/[0.03] text-slate-300 hover:text-white"
              >
                <Icon className="w-3.5 h-3.5 text-teal-400" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </header>

      {/* ── Content Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* ── Portal Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#070b14] py-6 text-center text-xs text-slate-500">
        <p>MediSphere AI Hospital Network · Secured with 256-Bit TLS · HIPAA & NABH Compliance Verified</p>
        <p className="mt-1 text-[11px]">Emergency Ambulance Helpline: 108 · Hospital Triage Dispatch: +91 1800-419-7000</p>
      </footer>
    </div>
  )
}
