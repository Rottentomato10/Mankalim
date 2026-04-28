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
        {/* Theme Toggle */}
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          left: '108px',
          zIndex: 1000
        }}>
          <ThemeToggle />
        </div>
        <main style={{ paddingBottom: '70px' }}>
          {children}
        </main>
        <BottomNav />
        <HelpButton />
      </div>
    </AuthProvider>
  )
}
