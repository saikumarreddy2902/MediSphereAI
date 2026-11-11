'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  LayoutDashboard, Users, Bed, ShieldAlert, Users2, Pill, TestTube2, Cog,
  CreditCard, FileText, TrendingUp, Bot, LogOut, ChevronLeft, ChevronRight,
  Bell, Sun, Moon, CalendarCheck, ClipboardList, Stethoscope, Check, Layers,
  HeartPulse, Activity, ShieldCheck, CalendarDays, BarChart3
} from 'lucide-react'
import AIChatbot from '../components/AIChatbot'
import { getNotificationsApi, markAllNotificationsReadApi } from '@/lib/services/api-service'

const NAV_ITEMS = [
  { href: '/dashboard',                  label: 'Executive Overview',    icon: <LayoutDashboard size={20} />, badge: null,   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/patient-portal',   label: 'Patient Portal',        icon: <HeartPulse size={20} />,     badge: 'Self-Care', roles: ['patient'] },
  { href: '/dashboard/department-queue', label: 'Department Queues',     icon: <Layers size={20} />,         badge: 'Active', roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/patients',         label: 'Patient Flow',          icon: <Users size={20} />,          badge: null,   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/appointments',     label: 'Appointments',          icon: <CalendarCheck size={20} />,  badge: null,   roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { href: '/dashboard/vitals',           label: 'Vitals Monitor',        icon: <Activity size={20} />,       badge: 'Live', roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/beds',             label: 'Bed Intelligence',      icon: <Bed size={20} />,            badge: '91%',  roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/emergency',        label: 'Emergency Response',    icon: <ShieldAlert size={20} />,    badge: '11',   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/staff',            label: 'Staff Allocation',      icon: <Users2 size={20} />,         badge: null,   roles: ['admin', 'nurse'] },
  { href: '/dashboard/staff/schedule',   label: 'Shift Roster',          icon: <CalendarDays size={20} />,   badge: null,   roles: ['admin', 'nurse'] },
  { href: '/dashboard/pharmacy',         label: 'Pharmacy',              icon: <Pill size={20} />,           badge: '4⚠',   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/prescriptions',    label: 'Prescriptions',         icon: <ClipboardList size={20} />,  badge: null,   roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { href: '/dashboard/laboratory',       label: 'Laboratory',            icon: <TestTube2 size={20} />,      badge: null,   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/medical-records',  label: 'Medical Records',       icon: <Stethoscope size={20} />,    badge: null,   roles: ['admin', 'doctor', 'nurse'] },
  { href: '/dashboard/equipment',        label: 'Equipment',             icon: <Cog size={20} />,            badge: null,   roles: ['admin', 'nurse'] },
  { href: '/dashboard/billing',          label: 'Billing & Revenue',     icon: <CreditCard size={20} />,     badge: null,   roles: ['admin', 'patient'] },
  { href: '/dashboard/insurance',        label: 'Insurance Claims',      icon: <FileText size={20} />,       badge: null,   roles: ['admin', 'patient'] },
  { href: '/dashboard/analytics',        label: 'Analytics & Forecast',  icon: <TrendingUp size={20} />,     badge: null,   roles: ['admin', 'doctor'] },
  { href: '/dashboard/reports',          label: 'Report Builder',        icon: <BarChart3 size={20} />,      badge: null,   roles: ['admin', 'doctor'] },
  { href: '/dashboard/agents',           label: 'AI Agent Monitor',      icon: <Bot size={20} />,            badge: '15',   roles: ['admin', 'doctor'] },
  { href: '/dashboard/audit-logs',       label: 'Audit Logs',            icon: <ShieldCheck size={20} />,    badge: null,   roles: ['admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // ─── Notification state ───────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const u = localStorage.getItem('medisphere_user')
    if (!u) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(u)
    setUser(parsedUser)

    // ─── Strict Universal RBAC Route Guard ───
    const userRole = parsedUser.role || 'admin'
    const activeRoute = NAV_ITEMS.find(item => item.href === pathname)

    if (activeRoute) {
      if (!activeRoute.roles.includes(userRole)) {
        console.warn(`[RBAC] Access Restricted: Role '${userRole}' is not authorized to access '${pathname}'. Enforcing role platform isolation.`)
        if (userRole === 'patient') {
          router.push('/dashboard/patient-portal')
        } else {
          router.push('/dashboard')
        }
        return
      }
    } else if (userRole === 'patient' && pathname.startsWith('/dashboard') && pathname !== '/dashboard/patient-portal') {
      // Catch any unlisted dashboard sub-routes for patient
      router.push('/dashboard/patient-portal')
      return
    }

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
  }, [pathname])

  const handleSwitchRole = (newRole: string) => {
    const roleUserMap: Record<string, { username: string; role: string }> = {
      admin: { username: 'admin', role: 'admin' },
      doctor: { username: 'doctor', role: 'doctor' },
      nurse: { username: 'nurse', role: 'nurse' },
      patient: { username: 'patient', role: 'patient' },
    }
    const target = roleUserMap[newRole] || { username: newRole, role: newRole }
    localStorage.setItem('medisphere_user', JSON.stringify(target))
    setUser(target)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('medisphere_user_changed'))
    }
    if (newRole === 'patient') {
      router.push('/dashboard/patient-portal')
    } else {
      router.push('/dashboard')
    }
  }

  // Fetch notifications on mount and every 60 s
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await getNotificationsApi({ limit: 15 })
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread || 0)
      } catch {
        // Backend not running — show 3 mock notifications
        setNotifications([
          { id: '1', title: 'ICU Capacity Alert', message: 'ICU at 91% occupancy. Consider initiating step-down transfers.', notification_type: 'alert', is_read: false, created_at: new Date().toISOString() },
          { id: '2', title: 'Lab Result Ready', message: 'Troponin-T result for patient Rajesh Kumar is now available.', notification_type: 'info', is_read: false, created_at: new Date().toISOString() },
          { id: '3', title: 'Prescription Expiring', message: '3 active prescriptions expire within 24 hours.', notification_type: 'warning', is_read: true, created_at: new Date().toISOString() },
        ])
        setUnreadCount(2)
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsReadApi() } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

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
    // Clear the auth cookie so Edge Middleware redirects properly
    document.cookie = 'medisphere_user=; path=/; max-age=0; SameSite=Lax'
    router.push('/login')
  }

  const isDark = theme === 'dark'

  return (
    <div className={`flex h-screen overflow-hidden dashboard-layout ${theme}`} style={{ background: isDark ? '#0a0f1d' : '#f8fafc' }}>

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
          background: isDark ? 'rgba(12, 19, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderRight: isDark ? '1px solid rgba(56, 189, 248, 0.12)' : '1px solid rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
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
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Live Stats */}
        {!collapsed && (
          <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Patients', value: '342', color: '#0ea5e9' },
                { label: 'Beds',     value: '84%', color: '#10b981' },
                { label: 'Alerts',   value: '11',  color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg"
                     style={{
                       background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(0,0,0,0.03)',
                       border: isDark ? '1px solid rgba(56, 189, 248, 0.1)' : '1px solid rgba(0,0,0,0.05)'
                     }}>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.filter(item => {
            const role = user?.role || 'admin'
            return item.roles.includes(role)
          }).map(item => {
            const isActive = pathname === item.href
            const role = user?.role || 'admin'
            let displayLabel = item.label
            if (item.href === '/dashboard') {
              if (role === 'doctor') displayLabel = 'Doctor Station'
              else if (role === 'nurse') displayLabel = 'Nurse Station'
              else if (role === 'patient') displayLabel = 'Health Portal'
              else displayLabel = 'Executive Overview'
            }
            return (
              <Link
                key={item.href}
                id={`nav-${item.href.split('/').pop()}`}
                href={item.href}
                className={`sidebar-item group ${isActive ? 'active shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(99,102,241,0.15)]' : ''}`}
                title={collapsed ? displayLabel : undefined}
                style={{ color: isActive ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#94a3b8' : '#334155') }}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{displayLabel}</span>
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
                    {user?.username === 'admin' ? 'Hospital Admin' :
                     user?.username === 'patient' ? 'Rajesh Kumar' :
                     user?.username === 'doctor' ? 'Dr. Priya Sharma' :
                     user?.username === 'nurse' ? 'Nurse Sarah Jenkins' : user?.username}
                  </div>
                  <div className="text-xs font-semibold capitalize" style={{
                    color: user?.role === 'patient' ? '#ec4899' :
                           user?.role === 'doctor' ? '#10b981' :
                           user?.role === 'nurse' ? '#f59e0b' :
                           (isDark ? '#818cf8' : '#4f46e5')
                  }}>
                    {user?.role === 'patient' ? 'Patient (Self-Care)' : user?.role || 'admin'}
                  </div>
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
                  background: isDark ? 'rgba(12, 19, 34, 0.88)' : 'rgba(255, 255, 255, 0.88)',
                  borderBottom: isDark ? '1px solid rgba(56, 189, 248, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(16px)'
                }}>
          <div>
            <h1 className="text-base font-semibold" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
              {pathname === '/dashboard' ? (
                user?.role === 'doctor' ? 'Doctor Workstation' :
                user?.role === 'nurse' ? 'Nurse Operations Station' :
                user?.role === 'patient' ? 'Patient Health Portal' : 'Executive Overview'
              ) : (NAV_ITEMS.find(n => n.href === pathname)?.label || 'Dashboard')}
            </h1>
            <p suppressHydrationWarning className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Last updated: {mounted ? time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick RBAC Role Switcher */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                 style={{
                   background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0, 0, 0, 0.05)',
                   border: isDark ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
                 }}>
              <span className="text-[11px] font-medium hidden sm:inline" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Role:
              </span>
              <select
                id="role-switcher-select"
                value={user?.role || 'admin'}
                onChange={(e) => handleSwitchRole(e.target.value)}
                className="bg-transparent font-semibold text-xs outline-none cursor-pointer"
                style={{
                  color: user?.role === 'patient' ? '#ec4899' :
                         user?.role === 'doctor' ? '#10b981' :
                         user?.role === 'nurse' ? '#f59e0b' :
                         (isDark ? '#38bdf8' : '#0284c7')
                }}
              >
                <option value="admin" style={{ background: '#0f172a', color: '#f8fafc' }}>👑 Hospital Admin</option>
                <option value="doctor" style={{ background: '#0f172a', color: '#f8fafc' }}>🩺 Doctor (Dr. Priya)</option>
                <option value="nurse" style={{ background: '#0f172a', color: '#f8fafc' }}>🏥 Nurse (Operations)</option>
                <option value="patient" style={{ background: '#0f172a', color: '#ec4899' }}>👤 Patient (Rajesh Kumar)</option>
              </select>
            </div>
            {/* Dark / Light Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Clinical Light' : 'Switch to Clinical Dark'}
              title={isDark ? 'Switch to Clinical Light' : 'Switch to Clinical Dark'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(0, 0, 0, 0.06)',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(14, 165, 233, 0.2)',
                color: isDark ? '#38bdf8' : '#0284c7',
                boxShadow: isDark ? '0 0 12px rgba(14, 165, 233, 0.15)' : '0 0 12px rgba(14, 165, 233, 0.12)'
              }}
            >
              {isDark ? <Sun size={18} className="text-amber-400 animate-spin-slow" /> : <Moon size={18} className="text-sky-600" />}
              <span className="text-xs font-semibold hidden sm:inline" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                {isDark ? 'Clinical Light' : 'Clinical Dark'}
              </span>
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full status-running" />
              <span className="text-xs font-medium" style={{ color: '#10b981' }}>Live</span>
            </div>

            {/* Alerts / Notifications */}
            <div ref={notifRef} className="relative">
              <button
                id="header-alerts"
                onClick={() => setShowNotifications(p => !p)}
                className="relative p-2 rounded-xl transition-all hover:bg-white/10"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                aria-label="Notifications"
              >
                <Bell size={18} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                {unreadCount > 0 && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    style={{ background: '#ef4444', color: 'white' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
                  style={{ background: isDark ? '#0f0f18' : '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs flex items-center gap-1"
                        style={{ color: '#6366f1' }}>
                        <Check size={11}/> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">No notifications</div>
                    ) : notifications.map(n => {
                      const typeColor: Record<string,string> = { alert: '#ef4444', warning: '#f59e0b', info: '#6366f1', critical: '#dc2626' }
                      const color = typeColor[n.notification_type] || '#6366f1'
                      return (
                        <div key={n.id}
                          className="px-4 py-3 border-b transition-colors hover:bg-white/5"
                          style={{ borderColor: 'rgba(255,255,255,0.04)', opacity: n.is_read ? 0.6 : 1 }}>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.is_read ? '#475569' : color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 leading-tight">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date */}
            <div suppressHydrationWarning className="text-xs px-3 py-1.5 rounded-lg hidden md:block"
                 style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#64748b' : '#475569' }}>
              {mounted ? time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '...'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Multi-Agent AI Chatbot Floating Widget — strictly restricted to patient role */}
        {mounted && user?.role === 'patient' && <AIChatbot />}
      </div>
    </div>
  )
}
