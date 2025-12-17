import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Indoor Golf Simulators London | 15 Best Golf Sim Venues 2024 | TrackMan & More',
  description: 'Find the best indoor golf simulators in London. Compare 15 venues with TrackMan technology, pricing from £30/hour. Central & Greater London locations with reviews.',
  keywords: 'indoor golf simulators London, golf simulators London, TrackMan golf London, indoor golf London, golf practice London, virtual golf London, London golf venues, golf simulator hire London, indoor golf centres London',
  openGraph: {
    title: 'Indoor Golf Simulators London | 15 Best Venues with TrackMan Technology',
    description: 'Discover London\'s complete directory of indoor golf simulators. 15 venues, 80+ bays, TrackMan technology. Compare pricing, locations & book online.',
    type: 'website',
    locale: 'en_GB',
    url: 'https://findagolfrange.com/simulators/london',
    siteName: 'Find A Golf Range',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indoor Golf Simulators London | 15 Best Venues',
    description: 'Find the best indoor golf simulators in London. TrackMan technology, pricing from £30/hour.',
  },
  alternates: {
    canonical: 'https://findagolfrange.com/simulators/london',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LondonSimulatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}