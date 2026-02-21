import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for Edge runtime
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith('/api')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'anonymous'

    // Stricter limits for sensitive endpoints
    const isAuthEndpoint = pathname.startsWith('/api/admin')
    const limit = isAuthEndpoint ? 20 : 100  // 20/min for admin, 100/min for general
    const windowMs = 60 * 1000

    if (!checkRateLimit(`${ip}:${isAuthEndpoint ? 'admin' : 'api'}`, limit, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // Check for auth session cookie (next-auth v5 uses authjs.session-token)
  const authSessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token')
  const isAuthenticated = !!authSessionToken?.value

  // Check for demo session cookie
  const demoSession = req.cookies.get('demo-session')
  const isDemoAuthenticated = !!demoSession?.value

  const isAnyAuthenticated = isAuthenticated || isDemoAuthenticated

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/api/demo']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes
  if (isPublicRoute) {
    // Redirect to home if already authenticated and trying to access login
    if (isAnyAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isAnyAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (manifest.json, icons, logo, sw.js, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|logo-).*)',
  ],
}
