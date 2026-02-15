'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SimulatorCard from '@/components/SimulatorCard'
import { IndoorSimulator } from '@/types'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PageProps {
  params: {
    city: string
  }
}

export default function SimulatorCityPage({ params }: PageProps) {
  const [simulators, setSimulators] = useState<IndoorSimulator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance')

  // Decode and format city name with special handling for combined cities
  const getCityNameFromSlug = (slug: string): string => {
    const decoded = decodeURIComponent(slug)

    // Handle special cases for combined city names
    switch (decoded.toLowerCase()) {
      case 'newcastlemaitland':
        return 'Newcastle–Maitland'
      case 'alburywodonga':
        return 'Albury–Wodonga'
      case 'forster-tuncurry':
      case 'forstertuncurry':
        return 'Forster-Tuncurry'
      default:
        // Standard transformation: split on hyphens and capitalize
        return decoded
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
    }
  }

  const cityName = getCityNameFromSlug(params.city)

  // Function to geocode an address with fallback strategies
  const geocodeAddress = async (address: string, city: string): Promise<{ lat: number, lng: number } | null> => {
    const headers = { 'User-Agent': 'FindAGolfRange/1.0' }

    // Strategy 1: Try full address
    try {
      const query = encodeURIComponent(`${address}, ${city}, Australia`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=au`, {
        headers
      })

      if (response.ok) {
        const results = await response.json()
        if (results && results.length > 0) {
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (full address):', error)
    }

    // Strategy 2: Extract street/road name and try again
    try {
      const roadMatch = address.match(/([^,]*(?:Road|Rd|Street|St|Lane|Avenue|Ave|Drive|Dr|Close|Way|Hill|Circuit|Cir|Place|Pl))/i)
      if (roadMatch) {
        const streetName = roadMatch[1].trim()
        const query = encodeURIComponent(`${streetName}, ${city}, Australia`)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=au`, {
          headers
        })

        if (response.ok) {
          const results = await response.json()
          if (results && results.length > 0) {
            console.log(`Found coordinates using street name "${streetName}":`, results[0].lat, results[0].lon)
            return {
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            }
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (street name):', error)
    }

    // Strategy 3: Try just the city as fallback
    try {
      const query = encodeURIComponent(`${city}, Australia`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=au`, {
        headers
      })

      if (response.ok) {
        const results = await response.json()
        if (results && results.length > 0) {
          console.log(`Falling back to city center for "${address}"`)
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (city fallback):', error)
    }

    return null
  }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Australian city center coordinates
  const getCityCoordinates = (city: string) => {
    const cityCoords: { [key: string]: { latitude: number, longitude: number } } = {
      // Major Australian Cities
      sydney: { latitude: -33.8688, longitude: 151.2093 },
      melbourne: { latitude: -37.8136, longitude: 144.9631 },
      brisbane: { latitude: -27.4705, longitude: 153.0260 },
      perth: { latitude: -31.9505, longitude: 115.8605 },
      adelaide: { latitude: -34.9285, longitude: 138.5999 },
      canberra: { latitude: -35.2809, longitude: 149.1300 },
      hobart: { latitude: -42.8821, longitude: 147.3272 },
      darwin: { latitude: -12.4634, longitude: 130.8456 },
      newcastle: { latitude: -32.9283, longitude: 151.7817 },
      'newcastle–maitland': { latitude: -32.9283, longitude: 151.7817 },
      geelong: { latitude: -38.1499, longitude: 144.3617 },
      goldcoast: { latitude: -28.0167, longitude: 153.4000 },
      'gold coast': { latitude: -28.0167, longitude: 153.4000 },
      'sunshine coast': { latitude: -26.6500, longitude: 153.0667 },
      townsville: { latitude: -19.2590, longitude: 146.8169 },
      cairns: { latitude: -16.9186, longitude: 145.7781 },
      wollongong: { latitude: -34.4278, longitude: 150.8931 },
      toowoomba: { latitude: -27.5598, longitude: 151.9507 },
      ballarat: { latitude: -37.5622, longitude: 143.8503 },
      bendigo: { latitude: -36.7570, longitude: 144.2794 },
      albury: { latitude: -36.0737, longitude: 146.9135 },
      'albury–wodonga': { latitude: -36.0737, longitude: 146.9135 },
      launceston: { latitude: -41.4332, longitude: 147.1441 },
      rockhampton: { latitude: -23.3781, longitude: 150.5106 },
      bundaberg: { latitude: -24.8661, longitude: 152.3489 },
      bunbury: { latitude: -33.3269, longitude: 115.6370 },
      hervey: { latitude: -25.2947, longitude: 152.8492 }, // Hervey Bay
      wagga: { latitude: -35.1082, longitude: 147.3598 }, // Wagga Wagga
      mildura: { latitude: -34.1872, longitude: 142.1542 },
      shepparton: { latitude: -36.3800, longitude: 145.3968 },
      orange: { latitude: -33.2839, longitude: 149.0988 },
      dubbo: { latitude: -32.2567, longitude: 148.6014 },
      tamworth: { latitude: -31.0927, longitude: 150.9279 },
      armidale: { latitude: -30.5133, longitude: 151.6669 },
      mackay: { latitude: -21.1550, longitude: 149.1860 },
      traralgon: { latitude: -38.1946, longitude: 146.5407 },
      warrnambool: { latitude: -38.3827, longitude: 142.4853 },
      bathurst: { latitude: -33.4194, longitude: 149.5806 },
      abercrombie: { latitude: -33.8500, longitude: 149.4500 },
      morwell: { latitude: -38.2347, longitude: 146.3958 },
      moe: { latitude: -38.1735, longitude: 146.2599 },
      katherine: { latitude: -14.4669, longitude: 132.2647 },
      broome: { latitude: -17.9614, longitude: 122.2359 },
      kalgoorlie: { latitude: -30.7533, longitude: 121.4656 },
      geraldton: { latitude: -28.7774, longitude: 114.6147 },
      albany: { latitude: -35.0275, longitude: 117.8840 },
      mandurah: { latitude: -32.5269, longitude: 115.7217 },
      fremantle: { latitude: -32.0569, longitude: 115.7440 },
      joondalup: { latitude: -31.7448, longitude: 115.7661 },
      rockingham: { latitude: -32.2769, longitude: 115.7217 },
      wanneroo: { latitude: -31.7456, longitude: 115.8036 },
      stirling: { latitude: -31.8943, longitude: 115.8067 },
      cockburn: { latitude: -32.1269, longitude: 115.8469 },
      gosnells: { latitude: -32.0769, longitude: 115.9969 },

      // Regional Cities and Areas
      'regional nsw': { latitude: -33.0, longitude: 151.0 },
      'regional vic': { latitude: -37.5, longitude: 144.0 },
      'regional qld': { latitude: -27.0, longitude: 153.0 },
      'regional wa': { latitude: -32.0, longitude: 116.0 },
      'regional sa': { latitude: -34.5, longitude: 138.5 },
      'regional tas': { latitude: -42.0, longitude: 147.0 },
      'regional nt': { latitude: -14.0, longitude: 132.0 },
      'regional act': { latitude: -35.3, longitude: 149.1 },
      'regional victoria': { latitude: -37.5, longitude: 144.0 },
      'regional queensland': { latitude: -27.0, longitude: 153.0 },

      // NSW Regional Cities
      'central coast': { latitude: -33.4269, longitude: 151.3441 },
      'penrith': { latitude: -33.7506, longitude: 150.6944 },
      'nowra': { latitude: -34.8842, longitude: 150.6003 },
      'forster-tuncurry': { latitude: -32.1817, longitude: 152.5156 },
      'port macquarie': { latitude: -31.4309, longitude: 152.9089 },
      'ballina': { latitude: -28.8661, longitude: 153.5630 },
      'lismore': { latitude: -28.8143, longitude: 153.2789 },
      'cootamundra': { latitude: -34.6410, longitude: 148.0302 },
      'hunter valley': { latitude: -32.7167, longitude: 151.3000 },
      'blue mountains': { latitude: -33.7000, longitude: 150.3000 },
      'illawarra': { latitude: -34.4000, longitude: 150.9000 },
      'southern highlands': { latitude: -34.4500, longitude: 150.4000 },
      'wagga wagga': { latitude: -35.1082, longitude: 147.3598 },
      'byron bay': { latitude: -28.6474, longitude: 153.6020 },
      'coffs harbour': { latitude: -30.2963, longitude: 153.1185 },

      // VIC Regional Cities
      'warragul': { latitude: -38.1596, longitude: 145.9311 },
      'mornington peninsula': { latitude: -38.2500, longitude: 145.0000 },

      // QLD Regional Cities
      'hervey bay': { latitude: -25.2947, longitude: 152.8492 },
      'fraser coast': { latitude: -25.2947, longitude: 152.8492 },

      // WA Regional Cities
      'denmark': { latitude: -34.9617, longitude: 117.3539 },
      'karratha': { latitude: -20.7364, longitude: 116.8460 },

      // Additional Regional Cities from cleanup
      'torquay': { latitude: -38.3314, longitude: 144.3167 },
      'gympie': { latitude: -26.1907, longitude: 152.6660 },
      'mount isa': { latitude: -20.7256, longitude: 139.4927 },
      'barossa valley': { latitude: -34.5597, longitude: 138.9594 },
      'bridport': { latitude: -40.7056, longitude: 147.3811 },
      'oatlands': { latitude: -42.3012, longitude: 147.3720 },
      'whitsundays': { latitude: -20.2781, longitude: 148.7008 },
      'agnes water': { latitude: -24.2167, longitude: 151.9000 },
      'geraldton': { latitude: -28.7774, longitude: 114.6147 },
      'dawesville': { latitude: -32.6422, longitude: 115.6394 },
      'newman': { latitude: -23.3595, longitude: 119.7354 },
      'port douglas': { latitude: -16.4839, longitude: 145.4639 },
      'bellarine peninsula': { latitude: -38.2500, longitude: 144.5500 },
      'latrobe valley': { latitude: -38.2000, longitude: 146.4000 },
      'wangaratta': { latitude: -36.3581, longitude: 146.3183 },

      'regional vic (geelong)': { latitude: -38.1499, longitude: 144.3617 },
      'regional vic (warragul)': { latitude: -38.1596, longitude: 145.9311 },
      'regional vic (latrobe valley)': { latitude: -38.2000, longitude: 146.4000 },
      'regional vic (warrnambool)': { latitude: -38.3827, longitude: 142.4853 },

      'regional qld (mullalyup)': { latitude: -27.0, longitude: 153.0 },

      'regional wa (bunbury)': { latitude: -33.3269, longitude: 115.6370 },

      'regional tas (bridport)': { latitude: -40.7056, longitude: 147.3811 },

      'regional nt (katherine)': { latitude: -14.4669, longitude: 132.2647 }
    }

    const normalized = city.toLowerCase().replace(/[\s\-']/g, '')
    const withSpaces = city.toLowerCase()

    // Handle special cases first
    if (withSpaces.includes('newcastle') && withSpaces.includes('maitland')) return cityCoords['newcastle–maitland']
    if (withSpaces.includes('albury') && withSpaces.includes('wodonga')) return cityCoords['albury–wodonga']
    if (withSpaces.includes('gold coast')) return cityCoords['gold coast']
    if (withSpaces.includes('sunshine coast')) return cityCoords['sunshine coast']
    if (normalized.includes('goldcoast')) return cityCoords['goldcoast']
    if (normalized.includes('hervey')) return cityCoords['hervey']
    if (normalized.includes('wagga')) return cityCoords['wagga']
    if (normalized.includes('alice')) return cityCoords['alice']

    // Try direct lookup first
    if (cityCoords[withSpaces]) return cityCoords[withSpaces]

    return cityCoords[normalized] || { latitude: -33.8688, longitude: 151.2093 } // Default to Sydney if not found
  }

  useEffect(() => {
    const loadSimulators = async () => {
      try {
        setLoading(true)

        // Get city center coordinates
        const cityCenter = getCityCoordinates(cityName)

        // Query golf_ranges table for simulators in this city
        let simulatorData, error;

        // Try the exact city name first - Australian venues need 'australia' feature
        const result1 = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('city', cityName)
          .contains('special_features', ['australia'])
          .order('name')

        simulatorData = result1.data;
        error = result1.error;

        if (error) {
          console.error('Error fetching simulators:', error)
          setError(error.message)
          return
        }

        if (!simulatorData || simulatorData.length === 0) {
          notFound()
          return
        }

        // Transform the database data - simplified without geocoding
        const transformedSimulators: IndoorSimulator[] = simulatorData.map((simulator, index) => {
          let lat = simulator.latitude || cityCenter.latitude
          let lng = simulator.longitude || cityCenter.longitude
          let distance: number | null = null

          // Calculate distance if we have coordinates
          if (lat && lng) {
            distance = Math.round(calculateDistance(
              cityCenter.latitude,
              cityCenter.longitude,
              lat,
              lng
            ) * 10) / 10
          }

          return {
            id: simulator.id,
            name: simulator.name,
            slug: simulator.slug,
            description: simulator.description,
            detailed_description: simulator.detailed_description,
            address: simulator.address,
            city: simulator.city,
            county: simulator.county,
            postcode: simulator.postcode,
            phone: simulator.phone || '',
            email: simulator.email || '',
            website: simulator.website || '',
            latitude: lat,
            longitude: lng,
            num_simulators: simulator.num_bays || 1,
            simulator_brand: simulator.simulator_brand || '',
            facilities: simulator.facilities || [],
            pricing: simulator.prices ? Object.values(simulator.prices)[0] as string : '',
            opening_hours: simulator.opening_hours,
            images: simulator.images || [],
            distance: distance
          }
        })

        setSimulators(transformedSimulators)
        setLoading(false)
      } catch (error) {
        console.error('Error loading simulators:', error)
        setError('Failed to load simulators')
        setLoading(false)
      }
    }

    loadSimulators()
  }, [cityName])

  const sortedSimulators = [...simulators].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'distance':
        return (a.distance || 0) - (b.distance || 0)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading {cityName} simulators...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const hasSimulators = simulators.length > 0
  const validDistances = simulators.filter(s => s.distance !== null).map(s => s.distance as number)
  const maxSimulatorDistance = validDistances.length > 0 ? Math.max(...validDistances) : 0

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
                <li><Link href="/simulators/australia" className="text-primary hover:text-green-600">Australia</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">{cityName}</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Indoor Golf Simulators in {cityName}
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover {cityName}'s finest indoor golf simulators for your year-round golf practice. Compare prices, technology, and locations from {cityName} city center across {simulators.length} premium golf simulator venues throughout {cityName} and the surrounding area.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 X-Golf Technology</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ Year-Round Practice</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">📊 Detailed Analytics</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🌍 World Famous Courses</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {simulators.length}
                </div>
                <div className="text-sm text-gray-600">Indoor Simulators</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {simulators.length}
                </div>
                <div className="text-sm text-gray-600">Venues Available</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {Math.ceil(maxSimulatorDistance)}
                </div>
                <div className="text-sm text-gray-600">Km Radius</div>
              </div>
            </div>
          </div>
        </section>

        {/* Simulators List */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All {cityName} Simulators</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedSimulators.map((simulator, index) => (
                <SimulatorCard key={simulator.id} simulator={simulator} distanceFrom={cityName} isAustralia={true} />
              ))}
            </div>
          </div>
        </section>


        {/* SEO Content Section */}
        {hasSimulators && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-8">

                {/* Main Content */}
                <div className="bg-white rounded-lg p-8 shadow-sm border">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Indoor Golf Simulators in {cityName}</h2>

                  <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                      Experience year-round golf practice with {cityName}'s premier indoor golf simulators. Our comprehensive directory features {simulators.length} carefully selected simulator venues across {cityName}, each offering cutting-edge technology and professional-grade facilities for golfers of all skill levels.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Indoor Golf Simulators in {cityName}?</h3>

                    <p>
                      {cityName}'s indoor golf simulators combine state-of-the-art technology with comfortable, climate-controlled environments. From X-Golf projection systems to advanced launch monitors, these facilities offer real-time ball flight data, swing analysis, and access to world-famous courses. Whether you're practicing your drive or playing virtual rounds at Augusta National, {cityName}'s simulators provide unmatched accuracy and entertainment perfect for Australia's diverse climate.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Popular Simulator Venues in {cityName}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Advanced Technology</h4>
                        <p className="text-gray-600">
                          {cityName}'s simulator venues feature premium technology including X-Golf systems, TrackMan devices, and high-definition projection systems for immersive golf experiences.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Climate-Controlled Comfort</h4>
                        <p className="text-gray-600">
                          Perfect for Australia's varied weather conditions, these air-conditioned environments ensure comfortable practice sessions year-round.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">World-Class Courses</h4>
                        <p className="text-gray-600">
                          Play virtual rounds on prestigious courses including Pebble Beach, Royal Melbourne, and The Australian Golf Club from {cityName}.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Professional Instruction</h4>
                        <p className="text-gray-600">
                          Many {cityName} venues offer PGA-qualified instruction with instant video feedback and detailed performance analytics.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Golf Simulator Technology in {cityName}</h3>

                    <p>
                      {cityName}'s indoor golf simulators utilize cutting-edge technology for accurate ball flight simulation. Popular systems include X-Golf immersive projection, TrackMan radar technology, and advanced swing analysis tools. These systems provide comprehensive data on ball speed, launch angle, spin rates, and club path for detailed performance analysis.
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Booking Your Simulator Session</h4>
                      <ul className="text-green-800 space-y-2">
                        <li>• Most venues offer online booking systems</li>
                        <li>• Competitive hourly rates with member discounts</li>
                        <li>• Group bookings available for corporate events</li>
                        <li>• Equipment provided or bring your own clubs</li>
                        <li>• Professional coaching services available</li>
                        <li>• Practice and course play options included</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Back to Simulators Page Button */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/simulators/australia"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Australia Simulators
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}