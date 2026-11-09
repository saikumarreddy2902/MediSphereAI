import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediSphere AI — Hospital Operations Intelligence Platform',
  description: 'Autonomous Multi-Agent AI platform for real-time hospital operations management, bed intelligence, emergency response, and predictive analytics.',
  keywords: 'hospital management, AI, healthcare, bed management, emergency response, analytics',
  authors: [{ name: 'MediSphere AI Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0f18',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
