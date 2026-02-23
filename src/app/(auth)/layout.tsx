import { AuthProvider } from '@/components/providers/AuthProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { HelpButton } from '@/components/HelpButton'
import { ActivityTracker } from '@/components/ActivityTracker'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ActivityTracker />
      <div style={{ minHeight: '100vh' }}>
        {/* Theme Toggle - Fixed Position */}
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000
        }}>
          <ThemeToggle />
        </div>
        <main style={{ paddingBottom: '80px' }}>
          {children}
        </main>
        <BottomNav />
        <HelpButton />
      </div>
    </AuthProvider>
  )
}
