import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  admin: ['/dashboard', '/portal'],
  doctor: [
    '/dashboard',
    '/dashboard/appointments', '/dashboard/patients', '/dashboard/prescriptions',
    '/dashboard/laboratory', '/dashboard/medical-records', '/dashboard/pharmacy',
    '/dashboard/beds', '/dashboard/emergency', '/dashboard/analytics',
    '/dashboard/agents', '/dashboard/department-queue', '/dashboard/billing',
    '/dashboard/insurance', '/dashboard/profile', '/dashboard/vitals', '/dashboard/reports',
  ],
  nurse: [
    '/dashboard',
    '/dashboard/appointments', '/dashboard/patients', '/dashboard/beds',
    '/dashboard/emergency', '/dashboard/pharmacy', '/dashboard/prescriptions',
    '/dashboard/laboratory', '/dashboard/medical-records', '/dashboard/equipment',
    '/dashboard/staff', '/dashboard/department-queue', '/dashboard/vitals', '/dashboard/profile',
  ],
  patient: [
    '/dashboard/patient-portal', '/dashboard/appointments', '/dashboard/prescriptions',
    '/dashboard/billing', '/dashboard/insurance', '/dashboard/profile', '/portal',
  ],
}

const ADMIN_ONLY_PATHS = [
  '/dashboard/staff',
  '/dashboard/audit-logs',
]

/**
 * Extract and verify the user session from the request.
 * Checks JWT token if available, and gracefully falls back to session cookie for instantaneous routing.
 */
async function verifyToken(request: NextRequest): Promise<{ role: string; sub: string } | null> {
  try {
    // 1. Check user session cookie first for instant routing
    const userCookie = request.cookies.get('medisphere_user')?.value
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie))
        if (parsed.role) {
          return { role: parsed.role, sub: parsed.username || parsed.role }
        }
      } catch {
        // Fall through to JWT check
      }
    }

    // 2. Cryptographically verify JWT if present
    const tokenFromCookie = request.cookies.get('medisphere_token')?.value
    const authHeader = request.headers.get('Authorization')
    const token = tokenFromCookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

    if (!token) return null

    const secret = process.env.JWT_SECRET_KEY || 'medisphere-super-secret-key-change-in-production-use-128-char-random-hex'
    const secretBytes = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretBytes, {
      algorithms: ['HS256'],
    })

    const role = (payload.role as string) || ''
    const sub = (payload.sub as string) || ''
    if (!role || !sub) return null
    return { role, sub }
  } catch {
    return null
  }
}

function isAllowedPath(role: string, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_PREFIXES[role] || []
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/portal')) {
    return NextResponse.next()
  }

  // Cryptographically verify the JWT — unsigned cookies cannot spoof this
  const user = await verifyToken(request)
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = user.role.toLowerCase()

  if (role !== 'admin' && ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (!isAllowedPath(role, pathname)) {
    if (role === 'patient') {
      return NextResponse.redirect(new URL('/dashboard/patient-portal', request.url))
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
}
