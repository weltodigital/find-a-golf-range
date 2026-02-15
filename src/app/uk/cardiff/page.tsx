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

export default function CardiffPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(25)

  useEffect(() => {
    const loadCardiffRanges = async () => {
      try {
        const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Cardiff city center coordinates
        const CARDIFF_CENTER = { lat: 51.4816, lng: -3.1791 }

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

        // Fetch ranges from Supabase for Cardiff
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('city', 'Cardiff')
          .order('name')

        if (error) {
          console.error('Error loading Cardiff ranges:', error)
          setLoading(false)
          return
        }

        // Filter for ranges within reasonable distance of Cardiff and transform
        const transformedRanges: GolfRange[] = rangeData
          .map((range: any) => {
            let distance = 0

            if (range.latitude && range.longitude) {
              distance = Math.round(calculateDistance(
                CARDIFF_CENTER.lat,
                CARDIFF_CENTER.lng,
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
              bays: range.num_bays,
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
              distance: distance
            }
          })
          .filter(range => range.distance !== undefined)

        setRanges(transformedRanges)

      } catch (err) {
        console.error('Unexpected error loading Cardiff ranges:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCardiffRanges()
  }, [])

  // Filter ranges within max distance
  const nearbyRanges = ranges.filter(range =>
    range.distance !== undefined && range.distance !== null && range.distance <= maxDistance
  )

  // Sort ranges based on selected criteria
  const sortedRanges = [...nearbyRanges].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price':
        const priceA = parseFloat(a.pricing?.replace(/[^\d.]/g, '') || '0')
        const priceB = parseFloat(b.pricing?.replace(/[^\d.]/g, '') || '0')
        return priceA - priceB
      case 'bays':
        return (b.bays || b.num_bays || 0) - (a.bays || a.num_bays || 0)
      case 'distance':
      default:
        return (a.distance || 0) - (b.distance || 0)
    }
  })

  const avgDistance = ranges.length > 0 && ranges.filter(r => r.distance).length > 0 ?
    (ranges.filter(r => r.distance).reduce((sum, range) => sum + (range.distance || 0), 0) / ranges.filter(r => r.distance).length).toFixed(1) : '0'

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
                <li className="text-gray-700">Cardiff</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Golf Driving Ranges in Cardiff
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Cardiff and Cardiff's premier golf driving ranges. Find the perfect practice facility in this capital city.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{ranges.length}</div>
                <div className="text-sm text-gray-600">Driving Ranges</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{avgDistance}</div>
                <div className="text-sm text-gray-600">Avg Distance (mi)</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{ranges.reduce((total, range) => total + (range.num_bays || 0), 0)}</div>
                <div className="text-sm text-gray-600">Total Bays</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">£{ranges.length > 0 ? '8-15' : '0'}</div>
                <div className="text-sm text-gray-600">Price Range</div>
              </div>
            </div>
          </div>
        </section>

        {/* Ranges and Filters */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {ranges.length > 0 ? (
              <>
                {/* Filters and Sort Controls */}
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                      All Cardiff Driving Ranges
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
                      Distance from Cardiff center:
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
                  </div>
                </div>

                {/* Range Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {sortedRanges.map((range) => (
                    <RangeCard key={range.id} range={range} />
                  ))}
                </div>

                {/* Map Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Driving Ranges Map</h2>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <OpenStreetMap
                      center={[51.4816, -3.1791]}
                      zoom={11}
                      ranges={ranges.map(range => ({
                        id: range.id,
                        name: range.name,
                        address: range.address,
                        city: range.city,
                        county: range.county,
                        postcode: range.postcode,
                        latitude: range.latitude,
                        longitude: range.longitude
                      }))}
                    />
                  </div>
                </div>
              </>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading driving ranges...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No driving ranges found</h3>
                <p className="text-gray-600 mb-4">
                  We don't have any driving ranges listed for Cardiff yet.
                </p>
                <p className="text-sm text-gray-500">
                  Check back soon as we're always adding new locations!
                </p>
              </div>
            )}

            {/* SEO Content Section */}
            <div className="mt-12 space-y-8">
              {/* Main Content */}
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Cardiff</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Cardiff, the vibrant capital city of Wales, offers an outstanding selection of golf driving ranges nestled between the Welsh valleys and the Bristol Channel. Home to Cardiff Castle, the Millennium Stadium, and Cardiff Bay, this dynamic city provides golfers with exceptional practice facilities combining Welsh hospitality with modern amenities. With {ranges.length} premier driving ranges in our directory, Cardiff delivers world-class golf practice opportunities in the heart of Wales.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Cardiff for Golf Practice?</h3>

                  <p>
                    Cardiff's position as Wales' capital makes it the perfect hub for Welsh golf culture. The city offers year-round golf facilities with many ranges featuring covered bays to handle Wales' variable weather. From the historic city center with its Victorian arcades to the modern Cardiff Bay development, the city's golf ranges provide convenient access for both residents and visitors exploring this Celtic capital.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Cardiff's Welsh Golf Heritage</h3>

                  <p>
                    Cardiff represents the heart of Welsh golf, offering an authentic Celtic golf experience with ranges that often feature parkland settings and traditional Welsh warmth. The city's golf facilities cater to all skill levels, from beginners discovering the game to experienced golfers perfecting their technique. Many ranges offer professional instruction with PGA-qualified coaches who appreciate the unique aspects of Welsh golf traditions.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                  <p>
                    Cardiff's excellent transport infrastructure and compact city layout make golf ranges highly accessible. Whether you're staying in the city center near Cardiff Central Station, exploring the regenerated Cardiff Bay area, or visiting from the surrounding Valleys, you're never far from quality practice facilities. The city's golf ranges serve both the 350,000+ residents and numerous visitors to this growing European capital.
                  </p>

                  {ranges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Top Driving Ranges in Cardiff</h4>
                      <ul className="text-green-800 space-y-1">
                        {ranges.slice(0, 3).map(range => (
                          <li key={range.id}>• <strong>{range.name}</strong> {range.address && `- ${range.address}`}</li>
                        ))}
                        {ranges.length > 3 && <li>• Plus {ranges.length - 3} more excellent facilities</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cardiff Golf Range FAQ</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How many driving ranges are in Cardiff?</h3>
                    <p className="text-gray-600">
                      Cardiff currently has {ranges.length} driving ranges and golf practice facilities in our directory. These range from large parkland facilities with extensive target greens to compact indoor ranges perfect for year-round practice. Popular venues include {ranges.length > 0 && ranges[0] ? ranges[0].name : 'several well-established facilities'} and other quality practice locations throughout Cardiff and the surrounding areas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What makes Cardiff special for golf?</h3>
                    <p className="text-gray-600">
                      Cardiff offers a unique golf experience as Wales' capital city, combining Celtic golf traditions with modern facilities. The city often features stunning backdrops of Welsh valleys and Cardiff's historic landmarks. Many ranges offer traditional Welsh hospitality and coaching approaches that reflect the country's proud sporting heritage.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What's the best time to visit Cardiff golf ranges?</h3>
                    <p className="text-gray-600">
                      Cardiff's golf ranges operate year-round, with many offering covered bays and heated facilities for winter practice. Spring and summer months provide the most favorable weather conditions. Cardiff's numerous festivals and events, including Six Nations rugby matches, create a particularly exciting atmosphere, though advance booking is recommended during major events.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How do I get around Cardiff to visit golf ranges?</h3>
                    <p className="text-gray-600">
                      Cardiff's comprehensive public transport system includes buses and trains connecting most golf ranges. The city center is very walkable, and most ranges offer ample parking. Cardiff Central Station provides excellent rail links throughout Wales and the UK. The city's relatively compact size means most ranges are within a short journey from the center.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Can I get golf lessons in Cardiff?</h3>
                    <p className="text-gray-600">
                      Yes! Most Cardiff driving ranges offer professional golf instruction from PGA-qualified coaches. Many instructors appreciate Welsh golf culture and can help with all aspects of the game from basic fundamentals to advanced course management. Group lessons, individual coaching, and specialized clinics are widely available.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are Cardiff golf ranges suitable for beginners?</h3>
                    <p className="text-gray-600">
                      Absolutely! Cardiff's golf ranges warmly welcome golfers of all skill levels. Many offer beginner-friendly facilities including shorter tees, target-rich practice areas, and comprehensive starter packages including club hire and basic instruction. The Welsh golf community is renowned for its friendliness and support for newcomers to the game.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
