'use client'
import { useRouter } from 'next/navigation'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f18' }}>
      <div className="text-center max-w-md px-6 animate-fade-in-up">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <ShieldX size={36} className="text-red-400" />
        </div>

        {/* Error Code */}
        <div className="text-7xl font-black mb-2" style={{
          background: 'linear-gradient(135deg,#ef4444,#f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>403</div>

        <h1 className="text-2xl font-bold mb-3" style={{ color: '#e2e8f0' }}>Access Restricted</h1>
        <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>
          You do not have the required role to view this page.
        </p>
        <p className="text-xs mb-8" style={{ color: '#475569' }}>
          Contact your Hospital Administrator if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
          >
            <Home size={16} /> Dashboard Home
          </button>
        </div>

        {/* Role indicator */}
        <div className="mt-8 text-xs" style={{ color: '#334155' }}>
          MediSphere AI · Role-Based Access Control
        </div>
      </div>
    </div>
  )
}
