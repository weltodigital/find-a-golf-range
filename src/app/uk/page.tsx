import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'UK Golf Driving Ranges - Find Practice Facilities Across Britain',
  description: 'Discover the best golf driving ranges across the UK. Browse practice facilities in England, Scotland, Wales, and Northern Ireland with detailed information and locations.',
  openGraph: {
    title: 'UK Golf Driving Ranges Directory',
    description: 'Find the perfect golf practice facility anywhere in the UK. Comprehensive directory of driving ranges across Britain.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Find A Golf Range'
  }
}

async function getUKStatistics() {
  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city, county, num_bays')
    .gt('latitude', 0)  // Only UK ranges (positive latitude)

  if (error || !data) {
    return { totalRanges: 0, totalCities: 0, totalBays: 0, citiesData: [] }
  }

  const totalRanges = data.length
  const cities = [...new Set(data.map(range => range.city))]
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

export default async function UKPage() {
  const { totalRanges, totalCities, totalBays, citiesData } = await getUKStatistics()

  // Valid cities that have both data AND location pages (as specified by user)
  const validCities = [
    // England - London
    'London',
    // England - South East
    'Alton', 'Basingstoke', 'Brighton', 'Canterbury', 'Chichester', 'Portsmouth', 'Milton Keynes', 'Newbury', 'Oxford', 'Reading', 'Winchester',
    // England - South West
    'Bath', 'Bournemouth', 'Bristol', 'Gloucester', 'Exeter', 'Plymouth', 'Salisbury',
    // England - West Midlands
    'Birmingham', 'Coventry', 'Dudley', 'Hereford', 'Lichfield', 'Stoke-on-Trent', 'Solihull', 'Wolverhampton', 'Worcester',
    // England - East Midlands
    'Derby', 'Nottingham', 'Northampton', 'Leicester', 'Lincoln',
    // England - East
    'Bedford', 'Cambridge', 'Chelmsford', 'Colchester', 'Ipswich', 'Luton', 'Norwich', 'Peterborough', 'Southend-on-sea', 'St Albans',
    // England - North West
    'Altrincham', 'Blackburn', 'Blackpool', 'Bolton', 'Burnley', 'Carlisle', 'Chester', 'Liverpool', 'Manchester', 'Preston', 'Rochdale', 'Warrington',
    // England - North East
    'Durham', 'Newcastle upon Tyne', 'Sunderland',
    // England - Yorkshire & Humber
    'Bradford', 'Barnsley', 'Doncaster', 'Huddersfield', 'Hull', 'Leeds', 'Rotherham', 'Sheffield', 'Wakefield', 'York',
    // Scotland
    'Aberdeen', 'Dundee', 'Dunfermline', 'Edinburgh', 'Glasgow', 'Inverness', 'Perth', 'Stirling',
    // Wales
    'Bridgend', 'Cardiff', 'Carmarthen', 'Newport', 'Swansea', 'Wrexham',
    // Northern Ireland
    'Belfast', 'Derry'
  ]

  // Filter citiesData to only include valid cities (those with both data and pages)
  const validCitiesData = citiesData.filter(c => validCities.includes(c.city))

  // Add cities that have pages but no data (like Nottingham)
  const citiesWithPagesButNoData = ['Nottingham', 'Bedford', 'Perth', 'Alton', 'Basingstoke']
  citiesWithPagesButNoData.forEach(cityName => {
    if (!validCitiesData.find(c => c.city === cityName)) {
      validCitiesData.push({
        city: cityName,
        county: '',
        count: 0
      })
    }
  })

  // Group cities by region for better organization (exactly as specified by user)
  const regionGroups = {
    'London': validCitiesData.filter(c =>
      ['London'].includes(c.city)
    ),
    'South East': validCitiesData.filter(c =>
      ['Alton', 'Basingstoke', 'Brighton', 'Canterbury', 'Chichester', 'Portsmouth', 'Milton Keynes', 'Newbury', 'Oxford', 'Reading', 'Winchester'].includes(c.city)
    ),
    'South West': validCitiesData.filter(c =>
      ['Bath', 'Bournemouth', 'Bristol', 'Gloucester', 'Exeter', 'Plymouth', 'Salisbury'].includes(c.city)
    ),
    'West Midlands': validCitiesData.filter(c =>
      ['Birmingham', 'Coventry', 'Dudley', 'Hereford', 'Lichfield', 'Stoke-on-Trent', 'Solihull', 'Wolverhampton', 'Worcester'].includes(c.city)
    ),
    'East Midlands': validCitiesData.filter(c =>
      ['Derby', 'Nottingham', 'Northampton', 'Leicester', 'Lincoln'].includes(c.city)
    ),
    'East': validCitiesData.filter(c =>
      ['Bedford', 'Cambridge', 'Chelmsford', 'Colchester', 'Ipswich', 'Luton', 'Norwich', 'Peterborough', 'Southend-on-sea', 'St Albans'].includes(c.city)
    ),
    'North West': validCitiesData.filter(c =>
      ['Altrincham', 'Blackburn', 'Blackpool', 'Bolton', 'Burnley', 'Carlisle', 'Chester', 'Liverpool', 'Manchester', 'Preston', 'Rochdale', 'Warrington'].includes(c.city)
    ),
    'North East': validCitiesData.filter(c =>
      ['Durham', 'Newcastle upon Tyne', 'Sunderland'].includes(c.city)
    ).map(city => ({
      ...city,
      // Map Newcastle upon Tyne to use 'newcastle' slug
      city: city.city === 'Newcastle upon Tyne' ? 'Newcastle' : city.city
    })),
    'Yorkshire & Humber': validCitiesData.filter(c =>
      ['Bradford', 'Barnsley', 'Doncaster', 'Huddersfield', 'Hull', 'Leeds', 'Rotherham', 'Sheffield', 'Wakefield', 'York'].includes(c.city)
    ),
    'Scotland': validCitiesData.filter(c =>
      ['Aberdeen', 'Dundee', 'Dunfermline', 'Edinburgh', 'Glasgow', 'Inverness', 'Perth', 'Stirling'].includes(c.city)
    ),
    'Wales': validCitiesData.filter(c =>
      ['Bridgend', 'Cardiff', 'Carmarthen', 'Newport', 'Swansea', 'Wrexham'].includes(c.city)
    ),
    'Northern Ireland': validCitiesData.filter(c =>
      ['Belfast', 'Derry'].includes(c.city)
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
                <li className="text-gray-700">UK</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                UK Golf Driving Ranges
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover {totalRanges} premium golf practice facilities across {totalCities} cities
                in the United Kingdom. From London to Edinburgh, find the perfect driving range near you.
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

        {/* Regional Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                Golf Driving Ranges by Region
              </h2>

              {Object.entries(regionGroups).map(([region, cities]) => {
                if (cities.length === 0) return null

                return (
                  <div key={region} className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">{region}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cities.map(({ city, county, count }) => (
                        <Link
                          key={city}
                          href={`/uk/${slugify(city)}`}
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

        {/* About UK Golf Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Golf Practice Across the United Kingdom
              </h2>
              <div className="prose prose-lg text-gray-700 mx-auto">
                <p className="mb-6">
                  The United Kingdom offers an exceptional landscape for golf practice, with driving ranges
                  spanning from the bustling cities of England to the historic courses of Scotland. Our
                  comprehensive directory features {totalRanges} carefully selected driving ranges across
                  the UK, ensuring that golfers everywhere have access to quality practice facilities.
                </p>
                <p className="mb-6">
                  From London&apos;s modern multi-bay facilities to Scotland&apos;s traditional ranges,
                  each location offers unique benefits for golf improvement. Whether you&apos;re looking
                  for state-of-the-art technology like Toptracer systems or prefer classic practice
                  environments, the UK&apos;s diverse range of facilities caters to every preference and skill level.
                </p>
                <p>
                  Our directory covers {totalCities} cities across England, Scotland, Wales, and Northern Ireland,
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