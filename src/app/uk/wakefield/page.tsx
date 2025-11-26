'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RangeCard from '@/components/RangeCard'
import { GolfRange } from '@/types'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function WakefieldPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(25)

  useEffect(() => {
    const loadWakefieldRanges = async () => {
      try {

        // Wakefield city center coordinates
        const WAKEFIELD_CENTER = { lat: 53.6833, lng: -1.4977 }

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

        // Fetch ranges from Supabase where city contains 'wakefield'
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .gt('latitude', 0)
          .ilike('city', '%wakefield%')
          .order('name')

        if (error) {
          console.error('Error loading Wakefield ranges:', error)
          setLoading(false)
          return
        }

        // Transform the database data to match our GolfRange type
        const transformedRanges: GolfRange[] = rangeData.map((range: any) => {
          let distance = 0

          if (range.latitude && range.longitude) {
            distance = Math.round(calculateDistance(
              WAKEFIELD_CENTER.lat,
              WAKEFIELD_CENTER.lng,
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

      } catch (err) {
        console.error('Unexpected error loading Wakefield ranges:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWakefieldRanges()
  }, [])

  // Filter ranges within max distance
  const nearbyRanges = ranges.filter(range =>
    !range.distance || range.distance <= maxDistance
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
                <li className="text-gray-700">Wakefield</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Golf Driving Ranges in Wakefield
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Wakefield and West Yorkshire's premier golf driving ranges. Find the perfect practice facility in this metropolitan city.
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
                <div className="text-2xl font-bold text-primary">West Yorkshire</div>
                <div className="text-sm text-gray-600">Region</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">Metropolitan City</div>
                <div className="text-sm text-gray-600">Type</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        {ranges.length > 0 && (
          <section className="py-6 bg-gray-50 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                      Sort by:
                    </label>
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'bays' | 'distance')}
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="distance">Distance</option>
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                      <option value="bays">Number of Bays</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Distance:
                    </label>
                    <select
                      id="maxDistance"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value={5}>Within 5 miles</option>
                      <option value={10}>Within 10 miles</option>
                      <option value={25}>Within 25 miles</option>
                      <option value={50}>Within 50 miles</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {sortedRanges.length} of {ranges.length} ranges
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading driving ranges...</p>
              </div>
            ) : ranges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No driving ranges found</h3>
                <p className="text-gray-600 mb-4">
                  We don't have any driving ranges listed for Wakefield yet.
                </p>
                <p className="text-sm text-gray-500">
                  Check back soon as we're always adding new locations!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Range Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedRanges.map((range) => (
                    <RangeCard key={range.id} range={range} />
                  ))}
                </div>

                {/* Map Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Driving Ranges Map</h2>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <OpenStreetMap
                      center={[53.6833, -1.4977]}
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
              </div>
            )}

            {/* SEO Content Section */}
            <div className="mt-12 space-y-8">
              {/* Main Content */}
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Wakefield</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Wakefield and West Yorkshire offer excellent golf practice opportunities in this vibrant metropolitan city. The area's golf facilities and accessibility make it ideal for players from across the region. With {ranges.length} driving ranges now available in our directory, this area provides excellent golf facilities for players of all levels.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Wakefield for Golf Practice?</h3>

                  <p>
                    Wakefield's location and facilities provide ideal opportunities for golf practice. The area's accessibility and quality ranges make it perfect for golfers looking to improve their game in professional surroundings.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">West Yorkshire Golf Scene</h3>

                  <p>
                    West Yorkshire offers diverse settings for golf practice, from modern facilities to traditional golf clubs. Wakefield's golf ranges cater to players of all skill levels, offering everything from covered bays to extensive outdoor ranges.
                  </p>

                  {ranges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Featured Ranges in Wakefield</h4>
                      <ul className="text-green-800 space-y-1">
                        {ranges.slice(0, 3).map(range => (
                          <li key={range.id}>• {range.name}</li>
                        ))}
                        {ranges.length > 3 && <li>• And {ranges.length - 3} more...</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About Golf in Wakefield</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are there driving ranges in Wakefield?</h3>
                    <p className="text-gray-600">
                      Yes! Wakefield has {ranges.length} driving ranges and golf practice facilities. Our directory includes established venues like {ranges.length > 0 ? ranges[0]?.name : 'various local facilities'} and other popular practice locations throughout the area.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What makes Wakefield good for golf?</h3>
                    <p className="text-gray-600">
                      Wakefield offers excellent golf facilities with quality ranges and good accessibility. The area's golf community and facilities make it an attractive destination for golf practice and improvement.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How do I get to golf ranges in Wakefield?</h3>
                    <p className="text-gray-600">
                      Wakefield is well-connected with good transport links and road access. Most driving ranges offer parking facilities, and the area's accessibility makes it easy to reach golf facilities from surrounding areas.
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