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

export default function EdinburghPage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(5)

  useEffect(() => {
    const loadEdinburghRanges = async () => {
      try {
        const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Edinburgh city center coordinates
        const EDINBURGH_CENTER = { lat: 55.9533, lng: -3.1883 }

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

        // Fetch ranges from Supabase for Edinburgh
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('city', 'Edinburgh')
          .order('name')

        if (error) {
          console.error('Error loading Edinburgh ranges:', error)
          setLoading(false)
          return
        }

        // Filter for ranges within reasonable distance of Edinburgh and transform
        const transformedRanges: GolfRange[] = rangeData
          .map((range: any) => {
            let distance = 0

            if (range.latitude && range.longitude) {
              distance = Math.round(calculateDistance(
                EDINBURGH_CENTER.lat,
                EDINBURGH_CENTER.lng,
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
        console.error('Unexpected error loading Edinburgh ranges:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEdinburghRanges()
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
                <li className="text-gray-700">Edinburgh</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Golf Driving Ranges in Edinburgh
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Edinburgh and Lothian's premier golf driving ranges. Find the perfect practice facility in this capital city.
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
                      All Edinburgh Driving Ranges
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
                      Distance from Edinburgh center:
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
                      center={[55.9533, -3.1883]}
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
                  We don't have any driving ranges listed for Edinburgh yet.
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Edinburgh</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Edinburgh, Scotland's historic capital city, offers an exceptional selection of golf driving ranges set against the backdrop of ancient castles and volcanic hills. Home to the Royal Mile and Edinburgh Castle, this UNESCO World Heritage city provides golfers with unique practice opportunities in the birthplace of golf. With {ranges.length} premium driving ranges in our directory, Edinburgh combines Scottish golf tradition with modern facilities.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Edinburgh for Golf Practice?</h3>

                  <p>
                    Edinburgh's position as Scotland's capital makes it the perfect gateway to Scottish golf heritage. The city offers year-round golf facilities with many ranges featuring covered bays to protect against Scotland's changeable weather. From the historic Old Town to the elegant New Town, Edinburgh's golf ranges provide easy access for both residents and visitors exploring this magnificent city.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Edinburgh's Golf Heritage</h3>

                  <p>
                    As part of Scotland, the home of golf, Edinburgh offers an authentic golf experience with ranges that often feature links-style settings and traditional Scottish hospitality. The city's golf facilities cater to all skill levels, from beginners learning the fundamentals to experienced golfers fine-tuning their technique. Many ranges offer professional instruction with PGA-qualified coaches who understand the nuances of Scottish golf.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                  <p>
                    Edinburgh's compact city center and excellent transport links make golf ranges easily accessible. Whether you're staying in the historic Royal Mile area, the modern business district, or the charming neighborhoods of Stockbridge and Bruntsfield, you're never far from quality practice facilities. The city's golf ranges serve both the 500,000 residents and millions of annual visitors.
                  </p>

                  {ranges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Top Driving Ranges in Edinburgh</h4>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edinburgh Golf Range FAQ</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How many driving ranges are in Edinburgh?</h3>
                    <p className="text-gray-600">
                      Edinburgh currently has {ranges.length} driving ranges and golf practice facilities in our directory. These range from large outdoor facilities with extensive target greens to compact indoor ranges perfect for year-round practice. Popular venues include {ranges.length > 0 && ranges[0] ? ranges[0].name : 'several well-established facilities'} and other quality practice locations throughout the city and surrounding Lothian area.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What makes Edinburgh special for golf?</h3>
                    <p className="text-gray-600">
                      Edinburgh offers a unique golf experience as Scotland's capital city and part of golf's birthplace. The city combines historic golf traditions with modern facilities, often featuring stunning views of Arthur's Seat, Edinburgh Castle, or the Pentland Hills. Many ranges offer traditional Scottish golf hospitality and coaching methods passed down through generations of golf instruction.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What's the best time to visit Edinburgh golf ranges?</h3>
                    <p className="text-gray-600">
                      Edinburgh's golf ranges operate year-round, with many offering covered bays and heated facilities for winter practice. Summer months (June-August) provide long daylight hours typical of Scottish summers. The Edinburgh Festival in August makes the city particularly vibrant, though advance booking is recommended during peak tourist season.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How do I get around Edinburgh to visit golf ranges?</h3>
                    <p className="text-gray-600">
                      Edinburgh's excellent public transport system includes buses and trams connecting most golf ranges. The city center is very walkable, and many ranges offer parking facilities. Edinburgh Waverley Station provides direct rail links to golf destinations throughout Scotland. The city's compact size means most ranges are within a short journey from the historic center.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Can I get golf lessons in Edinburgh?</h3>
                    <p className="text-gray-600">
                      Yes! Most Edinburgh driving ranges offer professional golf instruction from PGA-qualified coaches. Many instructors specialize in traditional Scottish golf techniques and can help with all aspects of the game from basic fundamentals to advanced course strategy. Group lessons, individual coaching, and specialist clinics are widely available.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are Edinburgh golf ranges suitable for beginners?</h3>
                    <p className="text-gray-600">
                      Absolutely! Edinburgh's golf ranges welcome golfers of all skill levels. Many offer beginner-friendly facilities including shorter tees, target-rich practice areas, and comprehensive starter packages including club hire and basic instruction. The Scottish golf community is known for being welcoming to newcomers to the game.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Scotland Page Button */}
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
