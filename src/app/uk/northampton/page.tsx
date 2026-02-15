'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RangeCard from '@/components/RangeCard'
import { GolfRange } from '@/types'
import { filterOutIndoorSimulators } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function NorthamptonPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(25)

  useEffect(() => {
    const loadNorthamptonRanges = async () => {
      try {
        // Northampton city center coordinates
        const NORTHAMPTON_CENTER = { lat: 52.2405, lng: -0.9027 }

        // Function to calculate distance between two points using Haversine formula
        const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
          const R = 3959 // Earth's radius in miles
          const dLat = (lat2 - lat1) * Math.PI / 180
          const dLng = (lng2 - lng1) * Math.PI / 180
          const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          return R * c
        }

        // Fetch ranges from Supabase where city is Northampton
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .gt('latitude', 0)
          .eq('city', 'Northampton')
          .order('name')

        if (error) {
          console.error('Error loading Northampton ranges:', error)
          setLoading(false)
          return
        }

        // Filter out indoor simulators (they should only appear on simulator pages)
        const filteredRangeData = filterOutIndoorSimulators(rangeData)

        // Transform the database data to match our GolfRange type
        const transformedRanges: GolfRange[] = filteredRangeData.map((range: any) => {
          let distance = 0

          if (range.latitude && range.longitude) {
            distance = Math.round(calculateDistance(
              NORTHAMPTON_CENTER.lat,
              NORTHAMPTON_CENTER.lng,
              range.latitude,
              range.longitude
            ) * 10) / 10
          }

          return {
            id: range.id,
            name: range.name,
            slug: range.slug,
            description: range.description,
            detailed_description: range.detailed_description,
            address: range.address,
            city: range.city,
            county: range.county,
            postcode: range.postcode,
            phone: range.phone || '',
            email: range.email || '',
            website: range.website || '',
            latitude: range.latitude,
            longitude: range.longitude,
            num_bays: range.num_bays,
            bays: range.num_bays, // For compatibility
            features: range.special_features?.join(', ') || '',
            special_features: range.special_features || [],
            facilities: range.facilities || [],
            pricing: range.prices ? Object.values(range.prices)[0] as string : '',
            prices: range.prices,
            opening_hours: range.opening_hours,
            images: range.images || [],
            meta_title: range.meta_title,
            meta_description: range.meta_description,
            created_at: range.created_at,
            updated_at: range.updated_at,
            distance: distance > 0 ? distance : undefined
          }
        })

        setRanges(transformedRanges)
        setLoading(false)
      } catch (error) {
        console.error('Error loading Northampton ranges:', error)
        setLoading(false)
      }
    }

    loadNorthamptonRanges()
  }, [])

  // Filter ranges by distance
  const filteredRanges = ranges.filter(range =>
    !range.distance || range.distance <= maxDistance
  )

  const sortedRanges = [...filteredRanges].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price':
        // Extract price numbers for comparison
        const priceA = a.pricing ? parseFloat(a.pricing.replace(/[^0-9.]/g, '')) : 0
        const priceB = b.pricing ? parseFloat(b.pricing.replace(/[^0-9.]/g, '')) : 0
        return priceA - priceB
      case 'bays':
        return (b.num_bays || 0) - (a.num_bays || 0)
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
            <p className="mt-2 text-gray-600">Loading Northampton ranges...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const hasRanges = ranges.length > 0
  const minPrice = hasRanges ? Math.min(...ranges.map(r => r.pricing ? parseFloat(r.pricing.replace(/[^0-9.]/g, '')) : 0)) : 0
  const maxBays = hasRanges ? Math.max(...ranges.map(r => r.num_bays || 0)) : 0

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
                <li><Link href="/uk" className="text-primary hover:text-green-600">UK</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">Northampton</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Golf Driving Ranges in Northampton
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover Northampton's finest driving ranges for your golf practice. From historic market town charm to modern motorsports-inspired facilities, compare prices, facilities, and distances from Northampton center across {ranges.length} premium golf driving ranges throughout Northamptonshire.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 TopTracer Technology</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">💡 Floodlit Ranges</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏠 Undercover Bays</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🍽️ Food & Facilities</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {hasRanges && (
          <section className="py-8 bg-white border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{sortedRanges.length}</div>
                  <div className="text-sm text-gray-600">Driving Ranges</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">
                    £{minPrice > 0 ? minPrice.toFixed(2) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">From (cheapest)</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">
                    {maxBays}
                  </div>
                  <div className="text-sm text-gray-600">Max Bays</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">
                    {ranges.filter(r => r.distance).length > 0 ?
                      Math.min(...ranges.filter(r => r.distance).map(r => r.distance!)).toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Closest (miles)</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Ranges or Empty State */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {hasRanges ? (
              <>
                {/* Filters and Sort Controls */}
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                      All Northampton Driving Ranges
                    </h2>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'bays' | 'distance')}
                      className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    >
                      <option value="distance">Sort by Distance (Closest)</option>
                      <option value="name">Sort by Name</option>
                      <option value="price">Sort by Price (Lowest)</option>
                      <option value="bays">Sort by Bays (Most)</option>
                    </select>
                  </div>

                  {/* Distance Filter */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-700">
                      Distance from Northampton center:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="1"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-32 accent-primary"
                      />
                      <span className="text-sm font-medium text-gray-900 min-w-[80px]">
                        Up to {maxDistance} miles
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Showing {sortedRanges.length} of {ranges.length} ranges
                    </div>
                  </div>
                </div>

                {/* Range Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {sortedRanges.map((range) => (
                    <RangeCard key={range.id} range={range} />
                  ))}
                </div>

                {/* Map Section */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Driving Range Locations in Northampton</h2>
                  <div className="bg-white rounded-lg border p-6">
                    <div className="mb-4">
                      <p className="text-gray-600">
                        View all {sortedRanges.length} driving ranges on the map below. Click on markers to see range details and get directions.
                      </p>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden">
                      <OpenStreetMap
                        ranges={sortedRanges}
                        center={[52.2405, -0.9027]}
                        zoom={9}
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Content Section */}
                <div className="mt-12 space-y-8">

                  {/* Main Content */}
                  <div className="bg-white rounded-lg p-8 shadow-sm border">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Northampton</h2>

                    <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                      <p>
                        Northampton offers some of the most diverse and well-equipped golf driving ranges in central England. From traditional market town facilities to modern ranges inspired by the area's rich motorsports heritage, our directory features {ranges.length} carefully selected driving ranges across Northampton and Northamptonshire, each offering unique facilities and character that reflect the region's blend of history and innovation.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Makes Northampton's Driving Ranges Unique?</h3>

                      <p>
                        Northampton's driving ranges benefit from the town's central England location and rich heritage. Many facilities combine traditional English market town charm with modern practice technology, while some draw inspiration from the area's world-renowned motorsports connections. The ranges offer excellent accessibility and often feature unique character elements that reflect Northamptonshire's shoe-making heritage and motorsports excellence.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Premier Driving Ranges in Northampton</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="font-bold text-gray-900 mb-3">Heritage & Innovation</h4>
                          <p className="text-gray-600">
                            Northampton's ranges blend historic market town character with modern golf technology, offering practice environments that honor local traditions while embracing technological advancement.
                          </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="font-bold text-gray-900 mb-3">Central England Location</h4>
                          <p className="text-gray-600">
                            Perfectly positioned in central England, Northampton's ranges offer excellent accessibility and serve as convenient practice destinations for golfers throughout the region.
                          </p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Driving Range Prices in Northampton</h3>

                      <p>
                        Northampton driving ranges offer excellent value with competitive pricing that reflects the area's welcoming market town atmosphere. Practice sessions typically range from £3-7 for quality facilities, with many offering premium technology and coaching services that provide exceptional value for central England golfers.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Facilities and Technology</h3>

                      <p>
                        Northampton's driving ranges excel in providing comprehensive practice facilities that cater to all skill levels. Many feature advanced ball tracking technology, professional coaching services, and well-maintained practice areas. The ranges typically offer various practice environments, from traditional grass tees to covered bays, ensuring year-round practice opportunities in Northamptonshire's variable climate.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                      <p>
                        Located throughout Northampton and the surrounding Northamptonshire countryside, these ranges benefit from excellent transport connections typical of central England. Most facilities offer convenient parking and are easily accessible by car, with several ranges positioned to serve both Northampton residents and visitors exploring the region's historic attractions and motorsports heritage.
                      </p>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                        <h4 className="font-bold text-green-900 mb-3">Planning Your Northampton Golf Practice</h4>
                        <ul className="text-green-800 space-y-2">
                          <li>• Modern practice technology in historic settings</li>
                          <li>• Professional coaching with local expertise</li>
                          <li>• Central England location with excellent accessibility</li>
                          <li>• Ranges suitable for all skill levels and preferences</li>
                          <li>• Competitive pricing for quality central England facilities</li>
                          <li>• Year-round practice opportunities with weather protection</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Section */}
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About Northampton Driving Ranges</h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">What is the best driving range in Northampton?</h3>
                        <p className="text-gray-600">
                          Northampton offers several excellent ranges with different characters and strengths. The best choice depends on your preferences for atmosphere, technology, and location. Many ranges combine traditional market town charm with modern practice facilities.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">How much does it cost to use a driving range in Northampton?</h3>
                        <p className="text-gray-600">
                          Prices typically range from £3-7 for practice sessions at Northampton's facilities. The ranges offer good value for money, reflecting the area's welcoming atmosphere and commitment to accessibility.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Do Northampton driving ranges offer professional coaching?</h3>
                        <p className="text-gray-600">
                          Yes, many Northampton ranges offer professional coaching services with qualified instructors. The coaching often combines traditional teaching methods with modern technology, reflecting the area's balance of heritage and innovation.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Are Northampton driving ranges suitable for beginners?</h3>
                        <p className="text-gray-600">
                          Absolutely! Northampton's ranges are known for their welcoming atmosphere and beginner-friendly environments. Many offer structured learning programs and coaching specifically designed for newcomers to the game.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Can I practice year-round at Northampton ranges?</h3>
                        <p className="text-gray-600">
                          Yes, many Northampton ranges feature covered practice areas and floodlit facilities, ensuring comfortable practice sessions throughout the year regardless of central England's changeable weather conditions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No driving ranges found</h3>
                <p className="text-gray-600 mb-4">
                  We don't have any driving ranges listed for Northampton yet.
                </p>
                <p className="text-sm text-gray-500">
                  Check back soon as we're always adding new locations!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Back to UK Page Button */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/uk"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All UK Locations
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}