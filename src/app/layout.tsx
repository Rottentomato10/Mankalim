import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { PWAInstaller } from '@/components/PWAInstaller'

export const metadata: Metadata = {
  title: 'מנכ״לים | פורשים כנף - חינוך פיננסי',
  description: 'ניהול פיננסי אישי - תזרים ונכסים',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'מנכ״לים',
    startupImage: '/logo-6.png',
  },
  icons: {
    icon: '/logo-6.png',
    apple: '/logo-6.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0f1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen antialiased">
        <PWAInstaller />
        {children}

        {/* Vee Accessibility Widget */}
        <Script
          id="vee-accessibility-config"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.args = {
                sitekey: '181d06572796d6f989fba2a284691636',
                position: 'Right',
                language: 'HE',
                container: '',
                icon: '',
                access: 'https://vee-crm.com',
              };
            `,
          }}
        />
        <Script
          src="https://vee-crm.com/js/"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
