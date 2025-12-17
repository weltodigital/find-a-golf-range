import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'UK Indoor Golf Simulators - Find Premium Golf Simulation Venues Across Britain',
  description: 'Discover the best indoor golf simulators across the UK. Browse cutting-edge TrackMan facilities in England, Scotland, Wales, and Northern Ireland with virtual courses and advanced swing analysis.',
  openGraph: {
    title: 'UK Indoor Golf Simulators Directory',
    description: 'Find premium indoor golf simulation facilities anywhere in the UK. TrackMan technology, virtual courses, and year-round practice.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Find A Golf Range'
  }
}

interface CityStats {
  city: string
  count: number
  slug: string
  county: string
}

async function getUKSimulatorStatistics() {
  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city, county, num_bays')
    .contains('special_features', ['Indoor Simulator'])

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

export default async function SimulatorsUKPage() {
  const { totalSimulators, totalCities, totalBays, citiesData } = await getUKSimulatorStatistics()

  // Filter to only include cities with simulator data
  const validCitiesData = citiesData.filter(c => c.count > 0)

  // Create comprehensive regional mapping
  const getRegion = (city: string, county: string): string => {
    // London and Greater London
    if (city === 'London' || county.includes('London') ||
        ['Barnet', 'Enfield', 'Harlow', 'New Malden', 'Richmond', 'Waltham Cross'].includes(city)) {
      return 'London & Greater London'
    }

    // South East England
    if (['Brighton', 'Canterbury', 'Portsmouth', 'Milton Keynes', 'Reading', 'Winchester',
         'Maidenhead', 'Maidstone', 'Newbury', 'Chichester', 'Eastbourne', 'Tunbridge Wells',
         'Berkhamsted', 'East Grinstead', 'Harpenden', 'Kings Langley', 'Leighton Buzzard',
         'Radlett', 'St Albans', 'Stevenage', 'Tring', 'Watford', 'Westerham', 'Slough',
         'Aylesbury', 'Brentwood', 'Chelmsford', 'Colchester', 'Southend-on-Sea', 'Burgess Hill',
         'Hailsham', 'Lee-on-the-Solent', 'Ringwood', 'Ramsgate', 'Sandown', 'Southsea'].includes(city) ||
        county.match(/(Kent|Surrey|Sussex|Hampshire|Berkshire|Buckinghamshire|Hertfordshire|Essex|Oxfordshire|Isle of Wight)/i)) {
      return 'South East England'
    }

    // South West England
    if (['Bath', 'Bournemouth', 'Bristol', 'Gloucester', 'Exeter', 'Plymouth', 'Poole',
         'Bideford', 'Bude', 'Dartmouth', 'Exmouth', 'Glastonbury', 'Highbridge', 'Kingsbridge',
         'Newton Abbot', 'Saint Austell', 'Totnes', 'Westbury', 'Weymouth'].includes(city) ||
        county.match(/(Somerset|Dorset|Devon|Cornwall|Gloucestershire|Wiltshire|Bristol)/i)) {
      return 'South West England'
    }

    // West Midlands
    if (['Birmingham', 'Coventry', 'Dudley', 'Wolverhampton', 'Worcester', 'Bromsgrove',
         'Cannock', 'Hereford', 'Leominster', 'Redditch', 'Stafford', 'Stone', 'Stoke-on-Trent',
         'Tamworth', 'Telford', 'Warminster', 'Stratford-upon-Avon'].includes(city) ||
        county.match(/(West Midlands|Staffordshire|Worcestershire|Warwickshire|Herefordshire|Shropshire)/i)) {
      return 'West Midlands'
    }

    // East Midlands
    if (['Derby', 'Nottingham', 'Northampton', 'Leicester', 'Lincoln', 'Boston', 'Bourne End',
         'Heanor', 'Hinckley', 'Newark', 'Rushden', 'Stamford', 'Atherstone'].includes(city) ||
        county.match(/(Derbyshire|Nottinghamshire|Lincolnshire|Leicestershire|Northamptonshire|Rutland)/i)) {
      return 'East Midlands'
    }

    // East of England
    if (['Cambridge', 'Chelmsford', 'Colchester', 'Ipswich', 'Norwich', 'Peterborough',
         'Bury Saint Edmunds', 'Diss', 'King\'s Lynn', 'Letchworth Garden City', 'Royston',
         'Stowmarket', 'Wymondham', 'Buntingford'].includes(city) ||
        county.match(/(Norfolk|Suffolk|Cambridgeshire|Essex|Hertfordshire|Bedfordshire)/i)) {
      return 'East of England'
    }

    // North West England
    if (['Blackburn', 'Bolton', 'Chester', 'Liverpool', 'Manchester', 'Preston', 'Blackpool',
         'Burnley', 'Bury', 'Colne', 'Fleetwood', 'Leyland', 'Maryport', 'Nelson', 'Poulton-le-Fylde',
         'Saint Helens', 'Salford', 'Skelmersdale', 'Stockport', 'Warrington', 'Wigan',
         'Altrincham', 'Skipton', 'Settle'].includes(city) ||
        county.match(/(Lancashire|Greater Manchester|Merseyside|Cheshire|Cumbria)/i)) {
      return 'North West England'
    }

    // North East England
    if (['Newcastle', 'Sunderland', 'Newcastle upon Tyne', 'Billingham', 'Durham', 'Hartlepool',
         'Newton Aycliffe', 'Scarborough', 'Washington'].includes(city) ||
        county.match(/(Northumberland|Tyne and Wear|County Durham|North Yorkshire)/i)) {
      return 'North East England'
    }

    // Yorkshire & Humber
    if (['Bradford', 'Leeds', 'Sheffield', 'York', 'Barnsley', 'Brighouse', 'Castleford',
         'Dewsbury', 'Grimsby', 'Halifax', 'Rotherham', 'Wakefield'].includes(city) ||
        county.match(/(Yorkshire|South Yorkshire|West Yorkshire|North Yorkshire|East Riding|Hull)/i)) {
      return 'Yorkshire & Humber'
    }

    // Scotland
    if (['Aberdeen', 'Edinburgh', 'Glasgow', 'Stirling', 'Arbroath', 'Ayr', 'Coatbridge',
         'Dalkeith', 'Dumfries', 'Falkirk', 'Inverkeithing', 'Largs', 'Livingston',
         'Loanhead', 'Oban', 'Peterhead', 'St Andrews', 'Stevenston'].includes(city) ||
        county.match(/(Scotland|Scottish|Aberdeenshire|Angus|Argyll|Ayrshire|Borders|Clackmannanshire|Dumfries|Dundee|East Lothian|Edinburgh|Falkirk|Fife|Glasgow|Highland|Inverclyde|Midlothian|Moray|North Ayrshire|North Lanarkshire|Orkney|Perth|Renfrewshire|Shetland|South Ayrshire|South Lanarkshire|Stirling|West Dunbartonshire|West Lothian|Western Isles)/i)) {
      return 'Scotland'
    }

    // Wales
    if (['Cardiff', 'Newport', 'Swansea', 'Bridgend', 'Blackwood', 'Caerphilly', 'Conwy',
         'Crymych', 'Cwmbran', 'Penarth', 'Rhyl'].includes(city) ||
        county.match(/(Wales|Welsh|Anglesey|Blaenau Gwent|Bridgend|Caerphilly|Cardiff|Carmarthenshire|Ceredigion|Conwy|Denbighshire|Flintshire|Gwynedd|Merthyr Tydfil|Monmouthshire|Neath Port Talbot|Newport|Pembrokeshire|Powys|Rhondda Cynon Taf|Swansea|Torfaen|Vale of Glamorgan|Wrexham)/i)) {
      return 'Wales'
    }

    // Northern Ireland
    if (['Belfast', 'Ballymoney', 'Craigavon', 'Dungannon', 'Holywood', 'Londonderry',
         'Newry', 'Newtownards', 'Omagh'].includes(city) ||
        county.match(/(Northern Ireland|Antrim|Armagh|Down|Fermanagh|Londonderry|Tyrone)/i)) {
      return 'Northern Ireland'
    }

    // Default to England if no specific region found
    return 'England - Other'
  }

  // Group cities by region, then sort alphabetically within each region
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
    'London & Greater London',
    'South East England',
    'South West England',
    'West Midlands',
    'East Midlands',
    'East of England',
    'North West England',
    'North East England',
    'Yorkshire & Humber',
    'Scotland',
    'Wales',
    'Northern Ireland',
    'England - Other'
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
                UK Indoor Golf Simulators
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover {totalSimulators} premium indoor golf simulator facilities across {totalCities} cities
                in the United Kingdom. From London to Edinburgh, find cutting-edge TrackMan technology and virtual courses near you.
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
                Indoor Golf Simulators by Region
              </h2>

              {Object.entries(sortedRegionalGroups).map(([region, cities]) => (
                <div key={region} className="mb-12">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">{region}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cities.map(({ city, county, count }) => (
                      <Link
                        key={city}
                        href={`/simulators/uk/${slugify(city)}`}
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">TrackMan Technology</h3>
                  <p className="text-gray-600">
                    Dual radar systems providing precise ball flight and club data analysis
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🌍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Courses</h3>
                  <p className="text-gray-600">
                    Play over 200 world-famous golf courses in stunning high-definition
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">⛳</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Swing Analysis</h3>
                  <p className="text-gray-600">
                    Comprehensive swing metrics including club path, face angle, and impact
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Year-Round Practice</h3>
                  <p className="text-gray-600">
                    Climate-controlled environments for consistent practice in any weather
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About UK Golf Simulators Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Indoor Golf Simulation Across the United Kingdom
              </h2>
              <div className="prose prose-lg text-gray-700 mx-auto">
                <p className="mb-6">
                  The United Kingdom leads the way in indoor golf simulation technology, with premium
                  simulator facilities spanning from London&apos;s cutting-edge venues to Scotland&apos;s innovative golf centers. Our
                  comprehensive directory features {totalSimulators} carefully selected indoor golf simulator venues across
                  {totalCities} UK cities, ensuring golfers everywhere have access to world-class practice technology.
                </p>
                <p className="mb-6">
                  From TrackMan 4 systems offering dual radar technology to GCQuad launch monitors providing
                  precision ball tracking, UK simulator facilities feature the latest in golf technology. Experience
                  virtual rounds on famous courses like St. Andrews, Pebble Beach, and Augusta National, all while
                  receiving detailed swing analysis and ball flight data.
                </p>
                <p>
                  Our directory covers major cities across England, Scotland, Wales, and Northern Ireland,
                  making it easy to find premium indoor golf simulator facilities near you. Each listing includes
                  detailed information about simulator technology brands (TrackMan, GCQuad, SkyTrak), virtual course
                  libraries, pricing, and special features to help you choose the perfect practice environment.
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