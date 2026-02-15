import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Australia City Simulators',
  description: 'Find indoor golf simulators in Australian cities',
}

export default function AustraliaCityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}