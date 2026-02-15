import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Australia Indoor Golf Simulators - Find Premium Golf Simulation Venues Across Australia',
  description: 'Discover the best indoor golf simulators across Australia. Browse cutting-edge golf simulation facilities in Sydney, Melbourne, Brisbane, Perth and more with virtual courses and advanced swing analysis.',
  openGraph: {
    title: 'Australia Indoor Golf Simulators Directory',
    description: 'Find premium indoor golf simulation facilities anywhere in Australia. X-Golf technology, virtual courses, and year-round practice.',
    type: 'website',
    locale: 'en_AU',
    siteName: 'Find A Golf Range'
  }
}

interface CityStats {
  city: string
  count: number
  slug: string
  county: string
}

async function getAustraliaSimulatorStatistics() {
  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city, county, num_bays')
    .contains('special_features', ['australia'])

  if (error || !data) {
    return { totalSimulators: 0, totalCities: 0, totalBays: 0, citiesData: [] }
  }

  const totalSimulators = data.length
  const cities = [...new Set(data.map(range => range.city))]
  const totalCities = cities.length
  const totalBays = data.reduce((sum, range) => sum + (range.num_bays || 0), 0)

  // Get city counts for popular locations
  const cityCounts = cities.map(city => ({
    city,
    county: data.find(range => range.city === city)?.county || '',
    count: data.filter(range => range.city === city).length
  })).sort((a, b) => b.count - a.count)

  return { totalSimulators, totalCities, totalBays, citiesData: cityCounts }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export default async function SimulatorsAustraliaPage() {
  const { totalSimulators, totalCities, totalBays, citiesData } = await getAustraliaSimulatorStatistics()

  // Filter to only include cities with simulator data
  const validCitiesData = citiesData.filter(c => c.count > 0)

  // Create state-based regional mapping for Australia
  const getRegion = (city: string, county: string): string => {
    // New South Wales
    if (['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Albury', 'Wagga Wagga',
         'Canberra', 'Tamworth', 'Orange', 'Dubbo', 'Bathurst', 'Lismore'].includes(city) ||
        county.match(/(New South Wales|NSW|Australian Capital Territory|ACT)/i)) {
      return 'New South Wales & ACT'
    }

    // Victoria
    if (['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Warrnambool',
         'Mildura', 'Wodonga'].includes(city) ||
        county.match(/(Victoria|VIC)/i)) {
      return 'Victoria'
    }

    // Queensland
    if (['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns', 'Townsville',
         'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg'].includes(city) ||
        county.match(/(Queensland|QLD)/i)) {
      return 'Queensland'
    }

    // Western Australia
    if (['Perth', 'Fremantle', 'Bunbury', 'Geraldton', 'Kalgoorlie', 'Mandurah',
         'Albany', 'Port Hedland'].includes(city) ||
        county.match(/(Western Australia|WA)/i)) {
      return 'Western Australia'
    }

    // South Australia
    if (['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge'].includes(city) ||
        county.match(/(South Australia|SA)/i)) {
      return 'South Australia'
    }

    // Tasmania
    if (['Hobart', 'Launceston', 'Burnie', 'Devonport'].includes(city) ||
        county.match(/(Tasmania|TAS)/i)) {
      return 'Tasmania'
    }

    // Northern Territory
    if (['Darwin', 'Alice Springs', 'Katherine', 'Tennant Creek'].includes(city) ||
        county.match(/(Northern Territory|NT)/i)) {
      return 'Northern Territory'
    }

    // Default fallback
    return 'Other'
  }

  // Group cities by state/territory
  const regionalGroups: { [key: string]: typeof validCitiesData } = {}

  validCitiesData.forEach(city => {
    const region = getRegion(city.city, city.county)
    if (!regionalGroups[region]) {
      regionalGroups[region] = []
    }
    regionalGroups[region].push(city)
  })

  // Sort cities within each region alphabetically and define region order
  const regionOrder = [
    'New South Wales & ACT',
    'Victoria',
    'Queensland',
    'Western Australia',
    'South Australia',
    'Tasmania',
    'Northern Territory',
    'Other'
  ]

  const sortedRegionalGroups = regionOrder.reduce((acc, region) => {
    if (regionalGroups[region]) {
      acc[region] = regionalGroups[region].sort((a, b) => a.city.localeCompare(b.city))
    }
    return acc
  }, {} as { [key: string]: typeof validCitiesData })

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
                <li><Link href="/simulators" className="text-primary hover:text-green-600">Simulators</Link></li>
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
                🇦🇺 Australia Indoor Golf Simulators
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover {totalSimulators} premium indoor golf simulator facilities across {totalCities} cities
                in Australia. From Sydney to Perth, find cutting-edge golf simulation technology and virtual courses near you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalSimulators}</div>
                  <div className="text-gray-600">Indoor Golf Simulators</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalCities}</div>
                  <div className="text-gray-600">Cities Covered</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-primary mb-2">{totalBays}+</div>
                  <div className="text-gray-600">Simulator Bays</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Regional Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Indoor Golf Simulators by State
              </h2>

              {Object.entries(sortedRegionalGroups).map(([region, cities]) => (
                <div key={region} className="mb-12">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">{region}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cities.map(({ city, county, count }) => (
                      <Link
                        key={city}
                        href={`/simulators/australia/${slugify(city)}`}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
                      >
                        <h4 className="text-xl font-semibold text-gray-900 group-hover:text-primary mb-2">
                          {city}
                        </h4>
                        <p className="text-gray-600 mb-3">{county}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-medium">
                            {count} simulator{count !== 1 ? 's' : ''}
                          </span>
                          <span className="text-primary group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* Technology Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Advanced Golf Simulation Technology
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">X-Golf Technology</h3>
                  <p className="text-gray-600">
                    Advanced projection systems providing immersive golf simulation experiences
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🌍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Courses</h3>
                  <p className="text-gray-600">
                    Play world-famous golf courses including Australian championships venues
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">⛳</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Swing Analysis</h3>
                  <p className="text-gray-600">
                    Comprehensive swing metrics including ball flight data and club analysis
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Year-Round Practice</h3>
                  <p className="text-gray-600">
                    Climate-controlled environments perfect for Australia's diverse weather
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Australia Golf Simulators Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Indoor Golf Simulation Across Australia
              </h2>
              <div className="prose prose-lg text-gray-700 mx-auto">
                <p className="mb-6">
                  Australia's indoor golf simulation scene is rapidly expanding, with premium
                  simulator facilities spanning from Sydney's modern venues to Perth's innovative golf centers. Our
                  comprehensive directory features {totalSimulators} carefully selected indoor golf simulator venues across
                  {totalCities} Australian cities, ensuring golfers everywhere have access to world-class practice technology.
                </p>
                <p className="mb-6">
                  From X-Golf systems offering immersive projection technology to TrackMan launch monitors providing
                  precision ball tracking, Australian simulator facilities feature the latest in golf technology. Experience
                  virtual rounds on famous courses including Australian Open venues like Royal Melbourne and The Australian,
                  all while receiving detailed swing analysis and ball flight data.
                </p>
                <p>
                  Our directory covers major cities across all Australian states and territories,
                  making it easy to find premium indoor golf simulator facilities near you. Each listing includes
                  detailed information about simulator technology brands, virtual course libraries, pricing, and special
                  features to help you choose the perfect practice environment for year-round golf improvement.
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