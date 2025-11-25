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


export default function ColchesterPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(25)

  useEffect(() => {
    const loadColchesterRanges = async () => {
      try {
        // Colchester city center coordinates
        const COLCHESTER_CENTER = { lat: 51.8860, lng: 0.9035 }

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

        // Fetch ranges from Supabase where city is Colchester
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .gt('latitude', 0)  // UK only (positive latitude)
          .eq('city', 'Colchester')
          .order('name')

        if (error) {
          console.error('Error loading Colchester ranges:', error)
          setLoading(false)
          return
        }

        // Transform the database data to match our GolfRange type
        const transformedRanges: GolfRange[] = rangeData.map((range: any) => {
          let distance = 0

          if (range.latitude && range.longitude) {
            distance = Math.round(calculateDistance(
              COLCHESTER_CENTER.lat,
              COLCHESTER_CENTER.lng,
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
        console.error('Error loading Colchester ranges:', error)
        setLoading(false)
      }
    }

    loadColchesterRanges()
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
            <p className="mt-2 text-gray-600">Loading Colchester ranges...</p>
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
                <li className="text-gray-700">Colchester</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Golf Driving Ranges in Colchester
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover Colchester and Essex's premier driving ranges for your golf practice. Compare prices, facilities, and locations across quality golf driving ranges in the historic Colchester area.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 Practice Facilities</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">💡 Modern Amenities</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ Professional Coaching</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🍽️ Food & Facilities</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {hasRanges ? (
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
        ) : (
          <section className="py-8 bg-white border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">1</div>
                  <div className="text-sm text-gray-600">Driving Range</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">Historic</div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">Essex</div>
                  <div className="text-sm text-gray-600">County</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">Quality</div>
                  <div className="text-sm text-gray-600">Practice</div>
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
                      All Colchester Driving Ranges
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
                      Distance from Colchester center:
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Driving Range Locations in Colchester</h2>
                  <div className="bg-white rounded-lg border p-6">
                    <div className="mb-4">
                      <p className="text-gray-600">
                        View all {sortedRanges.length} driving ranges on the map below. Click on markers to see range details and get directions.
                      </p>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden">
                      <OpenStreetMap
                        ranges={sortedRanges}
                        center={[51.8860, 0.9035]}
                        zoom={11}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-8 space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Colchester Golf Driving Ranges</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-900">Colchester Driving Range Coming Soon</h3>
                      <div className="mt-2 text-blue-800">
                        <p>We're currently adding an excellent driving range in the Colchester area:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li><strong>Lexden Wood Golf Club</strong> - Quality golf club with excellent practice facilities in historic Colchester</li>
                        </ul>
                        <p className="mt-3">Check back soon for complete facility details, pricing, and booking information.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Content Section */}
            <div className="mt-12 space-y-8">

              {/* Main Content */}
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Colchester</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Colchester and Essex offer excellent golf driving ranges in a historic setting that combines quality practice facilities with beautiful countryside locations. Our comprehensive directory features carefully selected driving ranges across the Colchester area, including established golf clubs with comprehensive amenities and modern practice facilities.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Makes Colchester's Driving Ranges Special?</h3>

                  <p>
                    Colchester's driving ranges are distinguished by their excellent practice facilities and historic Essex locations. The area features established golf clubs and practice centers, many offering comprehensive amenities including professional coaching, quality practice areas, and clubhouse facilities in beautiful countryside settings.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Premier Driving Ranges in Colchester</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-3">Established Golf Clubs</h4>
                      <p className="text-gray-600">
                        Colchester's driving ranges feature established golf clubs like Lexden Wood Golf Club, offering quality practice facilities in historic Essex locations.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-3">Historic Setting</h4>
                      <p className="text-gray-600">
                        Practice golf in Colchester's beautiful historic environment, with driving ranges set in scenic Essex countryside offering peaceful practice sessions.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Driving Range Prices in Colchester</h3>

                  <p>
                    Colchester driving ranges offer competitive pricing with excellent value for practice sessions. The established golf clubs provide affordable options for regular practice while maintaining high-quality facilities and customer service throughout Essex.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Facilities and Amenities</h3>

                  <p>
                    Colchester's driving ranges excel in providing comprehensive facilities. Many feature quality practice areas, equipment rental, professional coaching, and clubhouse amenities. Several ranges offer short game practice areas, putting greens, and full golf course access in beautiful Essex settings.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                  <p>
                    Strategically located throughout Essex, from Colchester town center to surrounding countryside locations. Most facilities offer convenient parking and are easily accessible, making them perfect for regular practice and golf improvement in the historic Colchester area.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                    <h4 className="font-bold text-green-900 mb-3">Planning Your Colchester Golf Practice</h4>
                    <ul className="text-green-800 space-y-2">
                      <li>• Quality practice facilities for all skill levels</li>
                      <li>• Established golf clubs with comprehensive amenities</li>
                      <li>• Professional coaching and instruction available</li>
                      <li>• Historic Essex locations with beautiful countryside settings</li>
                      <li>• Convenient locations throughout Colchester area</li>
                      <li>• Equipment rental and clubhouse facilities</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About Colchester Driving Ranges</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What is the best driving range in Colchester?</h3>
                    <p className="text-gray-600">
                      The best range depends on your specific needs. Colchester offers excellent options including Lexden Wood Golf Club, which provides quality facilities in a beautiful Essex location with established amenities.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How much does it cost to use a driving range in Colchester?</h3>
                    <p className="text-gray-600">
                      Prices vary by facility and location. Most Colchester ranges offer competitive pricing for practice sessions, with options for different bucket sizes and practice durations throughout Essex.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Do Colchester driving ranges offer golf lessons?</h3>
                    <p className="text-gray-600">
                      Many Colchester driving ranges employ qualified golf professionals offering individual and group lessons. Check with specific facilities for their coaching programs and availability.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are Colchester driving ranges suitable for beginners?</h3>
                    <p className="text-gray-600">
                      Absolutely! Colchester's ranges welcome golfers of all skill levels. Many offer beginner-friendly environments with patient instruction and quality practice facilities.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What facilities do Colchester driving ranges typically offer?</h3>
                    <p className="text-gray-600">
                      Colchester ranges typically feature quality practice areas, established amenities, equipment rental, and many include coaching services and comprehensive golf club facilities in historic Essex settings.
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