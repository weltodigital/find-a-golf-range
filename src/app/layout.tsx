import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Find A Golf Range - UK Golf Driving Range Directory',
  description: 'Find the perfect golf driving range near you in the UK. Search and discover golf practice facilities with detailed information and locations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}