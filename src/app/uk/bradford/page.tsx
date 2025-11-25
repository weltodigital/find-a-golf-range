'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RangeCard from '@/components/RangeCard'
import { GolfRange } from '@/types'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function BradfordPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(25)

  useEffect(() => {
    const loadBradfordRanges = async () => {
      try {
        const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Bradford city center coordinates
        const BRADFORD_CENTER = { lat: 53.796, lng: -1.7594 }

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

        // Fetch ranges from Supabase where city contains 'bradford'
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .gt('latitude', 0)
          .eq('city', 'Bradford')
          .order('name')

        if (error) {
          console.error('Error loading Bradford ranges:', error)
          setLoading(false)
          return
        }

        // Filter for ranges within reasonable distance of Bradford and transform
        const transformedRanges: GolfRange[] = rangeData
          .map((range: any) => {
            let distance = 0

            if (range.latitude && range.longitude) {
              distance = Math.round(calculateDistance(
                BRADFORD_CENTER.lat,
                BRADFORD_CENTER.lng,
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

        setRanges(transformedRanges)

      } catch (err) {
        console.error('Unexpected error loading Bradford ranges:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBradfordRanges()
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
                <li className="text-gray-700">Bradford</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Golf Driving Ranges in Bradford
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Bradford and West Yorkshire's premier golf driving ranges. Find the perfect practice facility in this metropolitan city.
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
                      All Bradford Driving Ranges
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
                      Distance from Bradford center:
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
              </>
            ) : null}
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
                  We don't have any driving ranges listed for Bradford yet.
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
                      center={[53.796, -1.7594]}
                      zoom={11}
                      ranges={ranges.map(range => ({
                        id: range.id,
                        name: range.name,
                        address: range.address,
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Bradford</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Bradford, the dynamic multicultural city in West Yorkshire, offers an impressive selection of golf driving ranges set against the backdrop of the Yorkshire Dales and Pennine hills. Home to the UNESCO City of Film designation, Bradford Cathedral, and a rich industrial heritage, this vibrant city provides golfers with excellent practice facilities that reflect its diverse community spirit. With {ranges.length} premier driving ranges in our directory, Bradford combines Yorkshire golf traditions with modern multicultural energy.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Bradford for Golf Practice?</h3>

                  <p>
                    Bradford's position in the heart of West Yorkshire makes it an ideal hub for golf enthusiasts exploring the region's diverse landscapes. The city offers year-round golf facilities with many ranges featuring covered bays to handle Yorkshire's variable weather. From the city center with its Victorian architecture to the surrounding Yorkshire countryside, Bradford's golf ranges provide convenient access for both the diverse local community and visitors to this cultural melting pot.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">West Yorkshire's Golf Heritage</h3>

                  <p>
                    Bradford represents the multicultural heart of West Yorkshire golf, offering an inclusive golf experience with ranges that welcome players from all backgrounds and communities. The city's golf facilities cater to all skill levels, from beginners discovering the game to experienced golfers fine-tuning their technique. Many ranges offer professional instruction with PGA-qualified coaches who appreciate the diverse community aspects and traditional Yorkshire golf approaches.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                  <p>
                    Bradford's excellent transport links and central West Yorkshire location make golf ranges highly accessible. Whether you're based in the city center near Bradford Interchange, exploring the historic Saltaire village, or visiting from surrounding towns like Keighley or Shipley, you're never far from quality practice facilities. The city's golf ranges serve both the 500,000+ residents and visitors exploring this UNESCO World Heritage region.
                  </p>

                  {ranges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Top Driving Ranges in Bradford</h4>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Bradford Golf Range FAQ</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How many driving ranges are in Bradford?</h3>
                    <p className="text-gray-600">
                      Bradford currently has {ranges.length} driving ranges and golf practice facilities in our directory. These range from large parkland facilities with extensive target greens to compact indoor ranges perfect for year-round practice. Popular venues include {ranges.length > 0 && ranges[0] ? ranges[0].name : 'several well-established facilities'} and other quality practice locations throughout Bradford and the surrounding West Yorkshire area.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What makes Bradford special for golf?</h3>
                    <p className="text-gray-600">
                      Bradford offers a unique golf experience as a multicultural city with strong Yorkshire golf traditions. The city combines diverse community spirit with traditional Yorkshire hospitality, often featuring stunning backdrops of the Yorkshire Dales and Pennine hills. Many ranges offer inclusive environments welcoming golfers from all backgrounds and communities.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What's the best time to visit Bradford golf ranges?</h3>
                    <p className="text-gray-600">
                      Bradford's golf ranges operate year-round, with many offering covered bays and heated facilities for winter practice. Spring and summer months provide the most favorable weather for outdoor practice. The city's numerous cultural festivals and events throughout the year create a vibrant atmosphere, though golf ranges maintain consistent availability regardless of events.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How do I get around Bradford to visit golf ranges?</h3>
                    <p className="text-gray-600">
                      Bradford's comprehensive public transport system includes buses connecting most golf ranges throughout the city and surrounding areas. Most ranges offer parking facilities, and Bradford's excellent road links provide easy access throughout West Yorkshire. Bradford Interchange offers rail connections throughout northern England.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Can I get golf lessons in Bradford?</h3>
                    <p className="text-gray-600">
                      Yes! Most Bradford driving ranges offer professional golf instruction from PGA-qualified coaches. Many instructors appreciate the city's diverse community and can provide coaching in multiple languages where needed. Yorkshire golf traditions are combined with modern coaching approaches suitable for all backgrounds and skill levels.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are Bradford golf ranges suitable for beginners?</h3>
                    <p className="text-gray-600">
                      Absolutely! Bradford's golf ranges warmly welcome golfers of all skill levels and backgrounds. Many offer beginner-friendly facilities including shorter tees, target-rich practice areas, and comprehensive starter packages including club hire and basic instruction. The city's inclusive golf community is particularly welcoming to newcomers from all communities.
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