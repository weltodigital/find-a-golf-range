import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Australia Golf Facilities - Driving Ranges & Indoor Simulators Across Australia',
  description: 'Discover the best golf facilities across Australia - driving ranges and indoor simulators in Sydney, Melbourne, Brisbane, Perth and more. Find practice facilities near you.',
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
    .select('city, county, num_bays, special_features')
    .contains('special_features', ['australia'])

  if (error || !data) {
    return { totalRanges: 0, totalSimulators: 0, totalCities: 0, totalBays: 0, citiesData: [] }
  }

  const totalRanges = data.filter(venue =>
    venue.special_features?.includes('driving range')
  ).length

  const totalSimulators = data.filter(venue =>
    venue.special_features?.includes('indoor simulators')
  ).length

  const citySet = new Set(data.map(range => range.city))
  const cities = Array.from(citySet)
  const totalCities = cities.length
  const totalBays = data.reduce((sum, range) => sum + (range.num_bays || 0), 0)

  // Get city counts for popular locations
  const cityCounts = cities.map(city => ({
    city,
    county: data.find(range => range.city === city)?.county || '',
    count: data.filter(range => range.city === city).length,
    rangeCount: data.filter(range =>
      range.city === city && range.special_features?.includes('driving range')
    ).length,
    simulatorCount: data.filter(range =>
      range.city === city && range.special_features?.includes('indoor simulators')
    ).length
  })).sort((a, b) => b.count - a.count)

  return { totalRanges, totalSimulators, totalCities, totalBays, citiesData: cityCounts }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export default async function AustraliaPage() {
  const { totalRanges, totalSimulators, totalCities, totalBays, citiesData } = await getAustralianStatistics()

  // Filter citiesData to only include cities with actual data
  const validCitiesData = citiesData.filter(c => c.count > 0)

  // Group cities by state/region for better organization
  const stateGroups = {
    'New South Wales': validCitiesData.filter(c =>
      c.city === 'Sydney' || c.city === 'Newcastle–Maitland' || c.city === 'Wollongong' ||
      c.city.startsWith('Regional NSW') ||
      ['Bathurst', 'Orange', 'Dubbo', 'Tamworth', 'Armidale', 'Abercrombie', 'Central Coast', 'Penrith', 'Nowra', 'Forster-Tuncurry', 'Port Macquarie', 'Ballina', 'Lismore', 'Cootamundra', 'Hunter Valley', 'Blue Mountains', 'Illawarra', 'Southern Highlands', 'Wagga Wagga', 'Byron Bay', 'Coffs Harbour'].includes(c.city)
    ),
    'Australian Capital Territory': validCitiesData.filter(c =>
      c.city === 'Canberra' || c.city.startsWith('Regional ACT')
    ),
    'Victoria': validCitiesData.filter(c =>
      c.city === 'Melbourne' || c.city === 'Geelong' || c.city === 'Ballarat' || c.city === 'Bendigo' ||
      c.city.startsWith('Regional VIC') || c.city.startsWith('Regional Victoria') ||
      ['Warrnambool', 'Traralgon', 'Shepparton', 'Morwell', 'Moe', 'Warragul', 'Mornington Peninsula', 'Mildura'].includes(c.city)
    ),
    'Queensland': validCitiesData.filter(c =>
      c.city === 'Brisbane' || c.city === 'Gold Coast' || c.city === 'Sunshine Coast' ||
      c.city === 'Cairns' || c.city === 'Townsville' || c.city === 'Toowoomba' || c.city === 'Rockhampton' || c.city === 'Mackay' ||
      c.city.startsWith('Regional QLD') || c.city.startsWith('Regional Queensland') ||
      ['Hervey Bay', 'Fraser Coast'].includes(c.city)
    ),
    'Western Australia': validCitiesData.filter(c =>
      c.city === 'Perth' || c.city === 'Bunbury' ||
      c.city.startsWith('Regional WA') ||
      ['Denmark', 'Karratha'].includes(c.city)
    ),
    'South Australia': validCitiesData.filter(c =>
      c.city === 'Adelaide' ||
      c.city.startsWith('Regional SA')
    ),
    'Tasmania': validCitiesData.filter(c =>
      c.city === 'Hobart' || c.city === 'Launceston' ||
      c.city.startsWith('Regional TAS')
    ),
    'Northern Territory': validCitiesData.filter(c =>
      c.city === 'Darwin' ||
      c.city.startsWith('Regional NT')
    ),
    'Cross-Border': validCitiesData.filter(c =>
      c.city === 'Albury–Wodonga'
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
                🇦🇺 Australia Golf Facilities
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover {totalRanges + totalSimulators} premium golf facilities across {totalCities} cities
                in Australia. From driving ranges to indoor simulators in Sydney, Melbourne, Brisbane, Perth and beyond.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalRanges}</div>
                  <div className="text-gray-600">Driving Ranges</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalSimulators}</div>
                  <div className="text-gray-600">Indoor Simulators</div>
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
                      {cities.map(({ city, county, count, rangeCount, simulatorCount }) => (
                        <Link
                          key={city}
                          href={`/australia/${slugify(city)}`}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
                        >
                          <h4 className="text-xl font-semibold text-gray-900 group-hover:text-primary mb-2">
                            {city}
                          </h4>
                          <p className="text-gray-600 mb-3">{county}</p>
                          <div className="space-y-2 mb-4">
                            {rangeCount > 0 && (
                              <div className="text-sm text-gray-700">
                                {rangeCount} driving range{rangeCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {simulatorCount > 0 && (
                              <div className="text-sm text-gray-700">
                                {simulatorCount} indoor simulator{simulatorCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {count === 0 && (
                              <div className="text-sm text-gray-500">
                                Coming soon
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-medium">
                              {count > 0 ? `${count} total facilities` : 'View details'}
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