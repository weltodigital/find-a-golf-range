import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Australia Golf Driving Ranges - Find Practice Facilities Across Australia',
  description: 'Discover the best golf driving ranges across Australia. Browse practice facilities in Sydney, Newcastle, and major cities with detailed information and locations.',
  openGraph: {
    title: 'Australia Golf Driving Ranges Directory',
    description: 'Find the perfect golf practice facility anywhere in Australia. Comprehensive directory of driving ranges across the country.',
    type: 'website',
    locale: 'en_AU',
    siteName: 'Find A Golf Range'
  }
}

async function getAustralianStatistics() {
  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city, county, num_bays')
    .lt('latitude', 0)  // Only Australian ranges (negative latitude)

  if (error || !data) {
    return { totalRanges: 0, totalCities: 0, totalBays: 0, citiesData: [] }
  }

  const totalRanges = data.length
  const citySet = new Set(data.map(range => range.city))
  const cities = Array.from(citySet)
  const totalCities = cities.length
  const totalBays = data.reduce((sum, range) => sum + (range.num_bays || 0), 0)

  // Get city counts for popular locations
  const cityCounts = cities.map(city => ({
    city,
    county: data.find(range => range.city === city)?.county || '',
    count: data.filter(range => range.city === city).length
  })).sort((a, b) => b.count - a.count)

  return { totalRanges, totalCities, totalBays, citiesData: cityCounts }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export default async function AustraliaPage() {
  const { totalRanges, totalCities, totalBays, citiesData } = await getAustralianStatistics()

  // Valid cities that have both data AND location pages
  const validCities = [
    'Sydney',
    'Newcastle'
  ]

  // Filter citiesData to only include valid cities (those with both data and pages)
  const validCitiesData = citiesData.filter(c => validCities.includes(c.city))

  // Add cities that have pages but no data
  const citiesWithPagesButNoData = ['Sydney', 'Newcastle']
  citiesWithPagesButNoData.forEach(cityName => {
    if (!validCitiesData.find(c => c.city === cityName)) {
      validCitiesData.push({
        city: cityName,
        county: 'New South Wales',
        count: 0
      })
    }
  })

  // Group cities by state for better organization
  const stateGroups = {
    'New South Wales': validCitiesData.filter(c =>
      ['Sydney', 'Newcastle'].includes(c.city)
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumbs */}
        <section className="bg-gray-50 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="text-primary hover:text-green-600">Home</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">Australia</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                🇦🇺 Australia Golf Driving Ranges
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover {totalRanges} premium golf practice facilities across {totalCities} cities
                in Australia. From Sydney's metropolitan ranges to Newcastle's quality facilities, find the perfect driving range near you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalRanges}</div>
                  <div className="text-gray-600">Golf Driving Ranges</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalCities}</div>
                  <div className="text-gray-600">Cities Covered</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalBays}+</div>
                  <div className="text-gray-600">Practice Bays</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* State Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Golf Driving Ranges by State
              </h2>

              {Object.entries(stateGroups).map(([state, cities]) => {
                if (cities.length === 0) return null

                return (
                  <div key={state} className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">{state}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cities.map(({ city, county, count }) => (
                        <Link
                          key={city}
                          href={`/australia/${slugify(city)}`}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
                        >
                          <h4 className="text-xl font-semibold text-gray-900 group-hover:text-primary mb-2">
                            {city}
                          </h4>
                          <p className="text-gray-600 mb-3">{county}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-medium">
                              {count} driving range{count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-primary group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}

            </div>
          </div>
        </section>

        {/* About Australian Golf Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Golf Practice Across Australia
              </h2>
              <div className="prose prose-lg text-gray-700 mx-auto">
                <p className="mb-6">
                  Australia offers an exceptional landscape for golf practice, with driving ranges
                  spanning from Sydney's bustling metropolitan areas to Newcastle's quality facilities. Our
                  comprehensive directory features {totalRanges} carefully selected driving ranges across
                  Australia, ensuring that golfers everywhere have access to quality practice facilities.
                </p>
                <p className="mb-6">
                  From Sydney's modern multi-bay facilities with state-of-the-art technology to Newcastle's
                  traditional ranges, each location offers unique benefits for golf improvement. Whether you're looking
                  for cutting-edge technology like Toptracer systems or prefer classic practice
                  environments, Australia's diverse range of facilities caters to every preference and skill level.
                </p>
                <p>
                  Our directory covers {totalCities} cities across Australia,
                  making it easy to find quality golf practice facilities wherever your travels or daily
                  routine may take you. Each listing includes detailed information about facilities, pricing,
                  opening hours, and special features to help you make the best choice for your golf improvement journey.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}