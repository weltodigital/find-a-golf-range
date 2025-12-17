import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

interface Props {
  params: {
    city: string
  }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityName = decodeURIComponent(params.city)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-')

  // Get simulator count for this city
  let simulatorCount = 0
  try {
    const { data } = await supabase
      .from('golf_ranges')
      .select('id', { count: 'exact' })
      .eq('city', cityName)
      .contains('special_features', ['Indoor Simulator'])

    simulatorCount = data?.length || 0
  } catch (error) {
    console.error('Error fetching simulator count:', error)
  }

  const title = `Indoor Golf Simulators ${cityName} | ${simulatorCount} Best Golf Sim Venues 2024 | TrackMan & More`
  const description = `Find the best indoor golf simulators in ${cityName}. Compare ${simulatorCount} venues with TrackMan technology, pricing from £25/hour. ${cityName} golf simulator locations with reviews.`

  return {
    title,
    description,
    keywords: `indoor golf simulators ${cityName}, golf simulators ${cityName}, TrackMan golf ${cityName}, indoor golf ${cityName}, golf practice ${cityName}, virtual golf ${cityName}, ${cityName} golf venues, golf simulator hire ${cityName}, indoor golf centres ${cityName}`,
    openGraph: {
      title: `Indoor Golf Simulators ${cityName} | ${simulatorCount} Best Venues with TrackMan Technology`,
      description: `Discover ${cityName}'s complete directory of indoor golf simulators. ${simulatorCount} venues with TrackMan technology. Compare pricing, locations & book online.`,
      type: 'website',
      locale: 'en_GB',
      url: `https://findagolfrange.com/simulators/uk/${params.city}`,
      siteName: 'Find A Golf Range',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Indoor Golf Simulators ${cityName} | ${simulatorCount} Best Venues`,
      description: `Find the best indoor golf simulators in ${cityName}. TrackMan technology, pricing from £25/hour.`,
    },
    alternates: {
      canonical: `https://findagolfrange.com/simulators/uk/${params.city}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function SimulatorCityLayout({ children }: Props) {
  return <>{children}</>
}