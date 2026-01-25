import { AuthProvider } from '@/components/providers/AuthProvider'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh' }}>
        <main style={{ paddingBottom: '80px' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthProvider>
  )
}
