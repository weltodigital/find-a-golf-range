import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Indoor Golf Simulators Directory - Find Premium Golf Simulation Venues Worldwide',
  description: 'Discover the world\'s best indoor golf simulators with TrackMan technology, virtual courses, and advanced swing analysis. Compare prices, locations, and features across premium golf simulation venues globally.',
  openGraph: {
    title: 'Global Indoor Golf Simulators Directory',
    description: 'Find premium indoor golf simulation facilities worldwide. TrackMan technology, virtual courses, and year-round practice at the best venues.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Find A Golf Range'
  }
}

interface CountryStats {
  country: string
  cities: number
  simulators: number
  slug: string
}

export default async function GlobalSimulatorsPage() {
  // Fetch all simulators to calculate stats
  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city, county, special_features')
    .or('special_features.cs.{"indoor simulators"},special_features.cs.{"Indoor Simulator"}')

  let countries: CountryStats[] = []
  let totalSimulators = 0
  let totalCities = 0

  if (data && !error) {
    // Group by country and count cities/simulators
    const countryGroups: { [key: string]: { cities: Set<string>, count: number } } = {}

    data.forEach(item => {
      let country = 'United Kingdom' // Default to UK

      // Check if this is an Australian venue
      if (item.special_features?.includes('australia')) {
        country = 'Australia'
      }

      if (!countryGroups[country]) {
        countryGroups[country] = { cities: new Set(), count: 0 }
      }
      countryGroups[country].cities.add(item.city)
      countryGroups[country].count++
    })

    // Convert to array format
    countries = Object.entries(countryGroups).map(([country, stats]) => ({
      country,
      cities: stats.cities.size,
      simulators: stats.count,
      slug: country.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    })).sort((a, b) => b.simulators - a.simulators)

    totalSimulators = data.length
    totalCities = new Set(data.map(item => item.city)).size
  }


  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Find An Indoor Golf Simulator Near You
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover {totalSimulators} premium indoor golf simulator facilities across {totalCities} cities worldwide. Find cutting-edge TrackMan technology, virtual golf courses, advanced swing analysis, and year-round practice venues near you. Compare prices, features, and locations to find your perfect indoor golf experience.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ {totalSimulators} Simulators</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🌍 {totalCities} Cities</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 TrackMan Technology</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">📊 Advanced Analytics</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {totalSimulators}
                </div>
                <div className="text-sm text-gray-600">Total Simulators</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {totalCities}
                </div>
                <div className="text-sm text-gray-600">Cities Worldwide</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {countries.length}
                </div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Indoor Golf Simulators by Country
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {countries.map((country) => (
                <Link
                  key={country.country}
                  href={
                    country.country === 'United Kingdom' ? '/simulators/uk' :
                    country.country === 'Australia' ? '/simulators/australia' :
                    `/simulators/${country.slug}`
                  }
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 group"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary">
                      {country.country}
                    </h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {country.simulators}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {country.simulators === 1 ? 'Simulator' : 'Simulators'}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      {country.cities} {country.cities === 1 ? 'City' : 'Cities'}
                    </div>
                    <div className="bg-primary text-white px-4 py-2 rounded-md group-hover:bg-green-600 transition-colors text-sm font-medium">
                      View Simulators
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-green-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Indoor Golf Simulators?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏌️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Year-Round Practice</h3>
                <p className="text-gray-600">
                  Practice your golf swing any time with climate-controlled indoor facilities. No more weather delays or seasonal restrictions - perfect your game 365 days a year.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics & TrackMan Technology</h3>
                <p className="text-gray-600">
                  Get instant feedback on swing speed, ball flight, spin rate, and shot accuracy with professional-grade launch monitor technology including TrackMan and GCQuad systems.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Play World-Famous Golf Courses</h3>
                <p className="text-gray-600">
                  Experience virtual rounds on legendary courses like Pebble Beach, St. Andrews, Augusta National, and over 200 world-renowned golf destinations from your local facility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional SEO Content Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Premium Indoor Golf Simulation Technology
              </h2>
              <div className="prose prose-lg text-gray-700 mx-auto mb-12">
                <p>
                  Indoor golf simulators have revolutionized golf practice and entertainment, offering golfers unprecedented access to professional-level training technology. Our curated directory features venues equipped with industry-leading simulation systems including TrackMan, GCQuad, SkyTrak, and Full Swing Golf simulators.
                </p>
                <p>
                  Each facility provides high-definition projection systems, accurate ball tracking, comprehensive swing analysis, and immersive virtual golf experiences. Whether you&apos;re a beginner learning the fundamentals or a scratch golfer fine-tuning your technique, indoor golf simulators offer the perfect environment for improvement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">TrackMan Technology</h3>
                  <p className="text-gray-600 text-sm">Dual radar technology for precise ball and club data</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Virtual Courses</h3>
                  <p className="text-gray-600 text-sm">Play 200+ world-famous golf courses in stunning detail</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Swing Analysis</h3>
                  <p className="text-gray-600 text-sm">Comprehensive data on every aspect of your golf swing</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Social Gaming</h3>
                  <p className="text-gray-600 text-sm">Multiplayer games, competitions, and virtual tournaments</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}