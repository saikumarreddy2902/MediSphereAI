'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginApi, registerApi } from '@/lib/services/api-service'
import { useAuthStore } from '@/store/useAuthStore'
import { User, Lock, Mail, UserCheck, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  
  // Login State
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  
  // Register State
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('doctor')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      // 1. Attempt live backend login
      const data = await loginApi(username, password)
      
      const userObj = {
        id: data.user_id,
        email: `${username}@medisphere.com`,
        first_name: username,
        last_name: 'User',
        roles: data.roles || [username],
      }
      
      const userRole = data.roles?.[0] || username
      setAuth(data.access_token, userObj)
      const userPayload = JSON.stringify({ username, role: userRole })
      localStorage.setItem('medisphere_user', userPayload)
      // Set cookies for Next.js Edge Middleware route guards
      document.cookie = `medisphere_user=${encodeURIComponent(userPayload)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      document.cookie = `medisphere_token=${encodeURIComponent(data.access_token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      window.dispatchEvent(new Event('medisphere_user_changed'))

      if (userRole === 'patient') {
        router.push('/dashboard/patient-portal')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.warn('Backend login unavailable or invalid, checking fallback demo users...', err)

      // Fallback for offline demo testing
      const validUsers: Record<string, string> = {
        admin: 'admin123', doctor: 'doctor123', nurse: 'nurse123', patient: 'patient123'
      }

      if (validUsers[username] === password) {
        const mockToken = `demo-jwt-token-${username}`
        const mockUser = {
          id: `demo-${username}`,
          email: `${username}@medisphere.com`,
          first_name: username,
          last_name: 'User',
          roles: [username],
        }
        setAuth(mockToken, mockUser)
        const mockPayload = JSON.stringify({ username, role: username })
        localStorage.setItem('medisphere_user', mockPayload)
        // Also set cookie for Next.js Edge Middleware route guards
        document.cookie = `medisphere_user=${encodeURIComponent(mockPayload)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        document.cookie = `medisphere_token=${encodeURIComponent(mockToken)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        window.dispatchEvent(new Event('medisphere_user_changed'))

        if (username === 'patient') {
          router.push('/dashboard/patient-portal')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(err?.response?.data?.detail || 'Invalid credentials. Try demo buttons or create a new profile.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    if (!regFullName || !regEmail || !regUsername || !regPassword) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const data = await registerApi({
        full_name: regFullName,
        email: regEmail,
        username: regUsername,
        password: regPassword,
        role: regRole,
      })

      setSuccessMsg('Account and profile created successfully! Redirecting...')
      
      const userObj = {
        id: data.user_id,
        email: data.user?.email || regEmail,
        first_name: regFullName.split(' ')[0] || regUsername,
        last_name: regFullName.split(' ').slice(1).join(' ') || 'User',
        roles: data.roles || [regRole],
      }

      setAuth(data.access_token, userObj)
      const regPayload = JSON.stringify({ username: regUsername, role: regRole })
      localStorage.setItem('medisphere_user', regPayload)
      // Also set cookie for Next.js Edge Middleware route guards
      document.cookie = `medisphere_user=${encodeURIComponent(regPayload)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err: any) {
      // Offline fallback profile creation
      const mockToken = `registered-jwt-${regUsername}`
      const mockUser = {
        id: `user-${Date.now()}`,
        email: regEmail,
        first_name: regFullName.split(' ')[0] || regUsername,
        last_name: regFullName.split(' ').slice(1).join(' ') || 'User',
        roles: [regRole],
      }
      setAuth(mockToken, mockUser)
      localStorage.setItem('medisphere_user', JSON.stringify({ username: regUsername, role: regRole }))
      setSuccessMsg('Profile registered locally. Launching dashboard...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { label: 'Administrator', username: 'admin',   password: 'admin123',   color: '#0ea5e9' },
    { label: 'Doctor',        username: 'doctor',  password: 'doctor123',  color: '#10b981' },
    { label: 'Nurse',         username: 'nurse',   password: 'nurse123',   color: '#f59e0b' },
    { label: 'Patient',       username: 'patient', password: 'patient123', color: '#ec4899' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12"
         style={{ background: 'linear-gradient(135deg, #0f0f18 0%, #13131e 50%, #0f0f18 100%)' }}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-lg px-4 animate-fade-in-up relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg shadow-indigo-500/20"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">MediSphere AI</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Autonomous Hospital Operations & Clinical Intelligence
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-6 md:p-8">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.12)' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={13} className="text-amber-300" />
              Create Profile (Register)
            </button>
          </div>

          {mode === 'login' ? (
            /* ─── Sign In Form ─── */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Username
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                    }}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                    }}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-sky-500/25"
                style={{
                  background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
              <div className="text-center pt-1">
                <a href="/reset-password" className="text-xs transition-colors hover:text-indigo-400" style={{ color: '#475569' }}>
                  Forgot your password?
                </a>
              </div>
            </form>
          ) : (
            /* ─── Create Account / Register Form ─── */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                  Full Name
                </label>
                <div className="relative">
                  <UserCheck size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    id="reg-fullname"
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                    }}
                    placeholder="e.g. Dr. Alex Mercer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                    Username
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      id="reg-username"
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                      }}
                      placeholder="alex_mercer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                      }}
                      placeholder="alex@hospital.org"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                      }}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                    Hospital Role
                  </label>
                  <select
                    id="reg-role"
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#e2e8f0',
                    }}
                  >
                    <option value="doctor">Medical Doctor</option>
                    <option value="nurse">Clinical Nurse</option>
                    <option value="patient">Patient</option>
                    <option value="staff">Administrative Staff</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {successMsg}
                </div>
              )}

              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/20"
                style={{
                  background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating Profile...' : 'Create Profile & Sign In'}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts Quick-Fill */}
        {mode === 'login' && (
          <div className="mt-4 glass-card p-4">
            <p className="text-xs font-medium mb-3 text-center" style={{ color: '#64748b' }}>
              🔑 Quick Demo Accounts
            </p>
            <div className="grid grid-cols-4 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.username}
                  id={`demo-${acc.username}`}
                  onClick={() => { setUsername(acc.username); setPassword(acc.password) }}
                  className="p-2 rounded-xl text-center transition-all text-xs"
                  style={{ background: `${acc.color}15`, border: `1px solid ${acc.color}30`, color: acc.color }}
                >
                  <div className="font-semibold text-[11px] truncate">{acc.label}</div>
                  <div className="opacity-60 text-[10px] mt-0.5">{acc.username}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-4" style={{ color: '#475569' }}>
          MediSphere AI Hospital Intelligence System · Self-Registration Enabled
        </p>
      </div>
    </div>
  )
}
