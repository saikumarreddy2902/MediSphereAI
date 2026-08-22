'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  LayoutDashboard, Users, Bed, ShieldAlert, Users2, Pill, TestTube2, Cog,
  CreditCard, FileText, TrendingUp, Bot, LogOut, ChevronLeft, ChevronRight,
  Bell, Sun, Moon
} from 'lucide-react'
import AIChatbot from '../components/AIChatbot'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Executive Overview',    icon: <LayoutDashboard size={20} />, badge: null },
  { href: '/dashboard/patients',   label: 'Patient Flow',          icon: <Users size={20} />, badge: null },
  { href: '/dashboard/beds',       label: 'Bed Intelligence',      icon: <Bed size={20} />, badge: '91%' },
  { href: '/dashboard/emergency',  label: 'Emergency Response',    icon: <ShieldAlert size={20} />, badge: '11' },
  { href: '/dashboard/staff',      label: 'Staff Allocation',      icon: <Users2 size={20} />, badge: null },
  { href: '/dashboard/pharmacy',   label: 'Pharmacy',              icon: <Pill size={20} />, badge: '4⚠' },
  { href: '/dashboard/laboratory', label: 'Laboratory',            icon: <TestTube2 size={20} />, badge: null },
  { href: '/dashboard/equipment',  label: 'Equipment',             icon: <Cog size={20} />, badge: null },
  { href: '/dashboard/billing',    label: 'Billing & Revenue',     icon: <CreditCard size={20} />, badge: null },
  { href: '/dashboard/insurance',  label: 'Insurance Claims',      icon: <FileText size={20} />, badge: null },
  { href: '/dashboard/analytics',  label: 'Analytics & Forecast',  icon: <TrendingUp size={20} />, badge: null },
  { href: '/dashboard/agents',     label: 'AI Agent Monitor',      icon: <Bot size={20} />, badge: '15' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [time, setTime] = useState(new Date())
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const u = localStorage.getItem('medisphere_user')
    if (!u) router.push('/login')
    else setUser(JSON.parse(u))

    const savedTheme = (localStorage.getItem('medisphere_theme') as 'dark' | 'light') || 'dark'
    setTheme(savedTheme)
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light')
      document.body.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.body.classList.remove('light')
    }

    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('medisphere_theme', nextTheme)
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
      document.body.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.body.classList.remove('light')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('medisphere_user')
    router.push('/login')
  }

  const isDark = theme === 'dark'

  return (
    <div className={`flex h-screen overflow-hidden dashboard-layout ${theme}`} style={{ background: isDark ? '#0f0f18' : '#f8fafc' }}>

      {/* ─── Mobile Overlay ───────────────────────────────────────────────── */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'overlay-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ─── Mobile Hamburger Button ──────────────────────────────────────── */}
      <button
        id="sidebar-hamburger"
        className="sidebar-hamburger"
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 60 }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`sidebar flex flex-col transition-all duration-300 relative z-20 ${mobileOpen ? 'sidebar-open' : ''}`}
        style={{
          width: collapsed ? '72px' : '260px',
          background: isDark ? 'rgba(13, 13, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-base font-bold gradient-text whitespace-nowrap tracking-tight">MediSphere AI</div>
            </div>
          )}
          <button
            id="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg transition-colors flex-shrink-0 hover:bg-white/5"
            style={{ color: isDark ? '#475569' : '#64748b' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Live Stats */}
        {!collapsed && (
          <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Patients', value: '342', color: '#6366f1' },
                { label: 'Beds',     value: '84%', color: '#10b981' },
                { label: 'Alerts',   value: '11',  color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                id={`nav-${item.href.split('/').pop()}`}
                href={item.href}
                className={`sidebar-item group ${isActive ? 'active shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.15)]' : ''}`}
                title={collapsed ? item.label : undefined}
                style={{ color: isActive ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#94a3b8' : '#334155') }}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="border-t px-2 py-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
          {!collapsed && (
            <div className="px-3 py-2.5 rounded-xl mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                     style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                    {user?.username === 'admin' ? 'Hospital Admin' : user?.username}
                  </div>
                  <div className="text-xs capitalize" style={{ color: isDark ? '#475569' : '#64748b' }}>{user?.role || 'admin'}</div>
                </div>
              </div>
            </div>
          )}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="sidebar-item w-full group"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            {!collapsed && <span className="group-hover:text-red-400 transition-colors">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(13,13,22,0.8)' : 'rgba(255,255,255,0.8)',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(12px)'
                }}>
          <div>
            <h1 className="text-base font-semibold" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
              {NAV_ITEMS.find(n => n.href === pathname)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>
              Last updated: {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark / Light Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#fbbf24' : '#6366f1',
                boxShadow: isDark ? '0 0 12px rgba(251,191,36,0.15)' : '0 0 12px rgba(99,102,241,0.15)'
              }}
            >
              {isDark ? <Sun size={18} className="text-amber-400 animate-spin-slow" /> : <Moon size={18} className="text-indigo-600" />}
              <span className="text-xs font-semibold hidden sm:inline" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full status-running" />
              <span className="text-xs font-medium" style={{ color: '#10b981' }}>Live</span>
            </div>

            {/* Alerts */}
            <button id="header-alerts" className="relative p-2 rounded-xl transition-all hover:bg-white/10"
                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Bell size={18} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{ background: '#ef4444' }} />
            </button>

            {/* Date */}
            <div className="text-xs px-3 py-1.5 rounded-lg hidden md:block"
                 style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#64748b' : '#475569' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Multi-Agent AI Chatbot Floating Widget */}
        <AIChatbot />
      </div>
    </div>
  )
}
