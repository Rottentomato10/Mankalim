import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
     * - public files (manifest.json, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)',
  ],
}
