'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'new_password' | 'done'>('email')
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Mock OTP for demo
  const DEMO_OTP = '123456'

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setStep('otp')
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 800))
    if (otp !== DEMO_OTP) { setError('Invalid OTP. Demo OTP is 123456.'); setLoading(false); return }
    setLoading(false)
    setStep('new_password')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setStep('done')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #0f0f18 0%, #13131e 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>MediSphere AI — Secure Account Recovery</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Email', 'Verify OTP', 'New Password'].map((s, i) => {
            const stepMap = { email: 0, otp: 1, new_password: 2, done: 3 }
            const current = stepMap[step]
            const done = current > i; const active = current === i
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all"
                       style={{ background: done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.08)', color: done || active ? '#fff' : '#475569' }}>
                    {done ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:inline" style={{ color: active ? '#e2e8f0' : done ? '#10b981' : '#475569' }}>{s}</span>
                </div>
                {i < 2 && <div className="w-8 h-px" style={{ background: current > i ? '#10b981' : 'rgba(255,255,255,0.1)' }} />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl space-y-5"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

          {/* Step 1 — Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Registered Email Address</label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Mail size={16} className="text-slate-400 flex-shrink-0" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@medisphere.com" required
                    className="bg-transparent text-sm outline-none text-slate-200 placeholder-slate-500 w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-sm" style={{ color: '#94a3b8' }}>OTP sent to</p>
                <p className="text-sm font-semibold" style={{ color: '#818cf8' }}>{email}</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Demo OTP: <strong className="text-indigo-400">123456</strong></p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Enter 6-Digit OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))}
                  placeholder="123456" maxLength={6} required
                  className="w-full px-4 py-3 rounded-xl text-center text-xl font-mono tracking-[0.5em] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* Step 3 — New Password */}
          {step === 'new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>New Password</label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Lock size={16} className="text-slate-400 flex-shrink-0" />
                  <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters" required
                    className="bg-transparent text-sm outline-none text-slate-200 placeholder-slate-500 w-full" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="text-slate-400 hover:text-slate-200 flex-shrink-0">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Confirm New Password</label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Lock size={16} className="text-slate-400 flex-shrink-0" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password" required
                    className="bg-transparent text-sm outline-none text-slate-200 placeholder-slate-500 w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 4 — Done */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Password Reset!</h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Your password has been updated successfully.</p>
              <button onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Back link */}
        {step !== 'done' && (
          <button onClick={() => step === 'email' ? router.push('/login') : setStep(s => s === 'otp' ? 'email' : 'otp')}
            className="flex items-center gap-2 mx-auto mt-4 text-xs transition-colors hover:text-slate-300"
            style={{ color: '#475569' }}>
            <ArrowLeft size={14} /> {step === 'email' ? 'Back to Login' : 'Previous Step'}
          </button>
        )}
      </div>
    </div>
  )
}
