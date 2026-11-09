'use client'
import Link from 'next/link'
import { Home, ArrowLeft, Stethoscope } from 'lucide-react'

/**
 * MediSphere AI — 404 Not Found Page
 * Rendered by Next.js whenever a route doesn't match any page.
 */
export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0f0f18' }}
    >
      <div className="text-center max-w-md px-6 animate-fade-in-up">
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 60px rgba(99,102,241,0.3)',
          }}
        >
          <Stethoscope size={36} className="text-white" />
        </div>

        {/* 404 Text */}
        <div
          className="text-8xl font-black mb-4 tracking-tighter"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The resource you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
            }}
          >
            <Home size={16} /> Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>

        {/* MediSphere branding */}
        <p className="text-xs text-slate-600 mt-10">
          MediSphere AI Hospital Intelligence System
        </p>
      </div>
    </div>
  )
}
