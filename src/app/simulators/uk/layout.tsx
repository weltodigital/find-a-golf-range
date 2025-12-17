import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Indoor Golf Simulators UK | 260+ Best Golf Sim Venues ${new Date().getFullYear()} | TrackMan & More`,
  description: 'Find the best indoor golf simulators across the UK. Compare 260+ venues with TrackMan technology, pricing from £25/hour across 180+ cities. London, Birmingham, Glasgow & more locations.',
  keywords: 'indoor golf simulators UK, golf simulators UK, TrackMan golf UK, indoor golf UK, golf practice UK, virtual golf UK, UK golf venues, golf simulator hire UK, indoor golf centres UK',
  openGraph: {
    title: 'Indoor Golf Simulators UK | 260+ Best Venues with TrackMan Technology',
    description: 'Discover the UK\'s complete directory of indoor golf simulators. 260+ venues across 180+ cities with TrackMan technology. Compare pricing, locations & book online.',
    type: 'website',
    locale: 'en_GB',
    url: 'https://findagolfrange.com/simulators/uk',
    siteName: 'Find A Golf Range',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indoor Golf Simulators UK | 260+ Best Venues',
    description: 'Find the best indoor golf simulators in the UK. TrackMan technology, pricing from £25/hour across 180+ cities.',
  },
  alternates: {
    canonical: 'https://findagolfrange.com/simulators/uk',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SimulatorsUKLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}