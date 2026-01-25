import { SessionProvider } from '@/components/providers/SessionProvider'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
