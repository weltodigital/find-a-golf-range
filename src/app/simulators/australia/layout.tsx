import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Australia Indoor Golf Simulators',
  description: 'Find premium indoor golf simulators across Australia',
}

export default function AustraliaSimulatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}