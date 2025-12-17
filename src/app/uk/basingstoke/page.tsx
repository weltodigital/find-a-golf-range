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

const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function BasingstokePage() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'bays' | 'distance'>('distance')
  const [maxDistance, setMaxDistance] = useState<number>(20)

  useEffect(() => {
    const loadBasingstokeRanges = async () => {
      try {
        // Basingstoke city center coordinates (Festival Place area)
        const BASINGSTOKE_CENTER = { lat: 51.2654, lng: -1.0873 }

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

        // Fetch ranges from Supabase - UK only (positive latitude)
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .gt('latitude', 0)
          .order('name')

        if (error) {
          console.error('Error loading Basingstoke ranges:', error)
          setLoading(false)
          return
        }

        // Filter for ranges within reasonable distance of Basingstoke and transform
        const transformedRanges: GolfRange[] = rangeData
          .map((range: any) => {
            let distance = 0

            if (range.latitude && range.longitude) {
              distance = Math.round(calculateDistance(
                BASINGSTOKE_CENTER.lat,
                BASINGSTOKE_CENTER.lng,
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
          .filter(range =>
            range.city?.toLowerCase() === 'basingstoke' ||
            range.address?.toLowerCase().includes('basingstoke')
          )

        setRanges(transformedRanges)
        setLoading(false)
      } catch (error) {
        console.error('Error loading Basingstoke ranges:', error)
        setLoading(false)
      }
    }

    loadBasingstokeRanges()
  }, [])

  // Filter ranges within max distance
  const nearbyRanges = ranges.filter(range =>
    range.distance !== undefined && range.distance !== null && range.distance <= maxDistance
  )

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
            <p className="mt-2 text-gray-600">Loading Basingstoke ranges...</p>
          </div>
        </main>
        <Footer />
      </div>
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
                <li><Link href="/uk" className="text-primary hover:text-green-600">UK</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">Basingstoke</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Golf Driving Ranges in Basingstoke
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Basingstoke and North Hampshire's premier golf driving ranges. Find the perfect practice facility in this thriving commercial hub.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ Modern Facilities</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">💡 Floodlit Ranges</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 Professional Coaching</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🚗 M3 Access</span>
              </div>
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
                <div className="text-2xl font-bold text-primary">{ranges.length > 0 && ranges.filter(r => r.distance).length > 0 ? (ranges.filter(r => r.distance).reduce((sum, range) => sum + (range.distance || 0), 0) / ranges.filter(r => r.distance).length).toFixed(1) : '0'}</div>
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

        {/* Ranges or Empty State */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {ranges.length > 0 ? (
              <>
                {/* Filters and Sort Controls */}
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                      All Basingstoke Driving Ranges
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
                      Distance from Basingstoke center:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="20"
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
                      Showing {nearbyRanges.length} of {ranges.length} ranges
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Driving Range Locations in Basingstoke</h2>
                  <div className="bg-white rounded-lg border p-6">
                    <div className="mb-4">
                      <p className="text-gray-600">
                        View all {sortedRanges.length} driving ranges on the map below. Click on markers to see range details and get directions.
                      </p>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden">
                      <OpenStreetMap
                        ranges={sortedRanges}
                        center={[51.2654, -1.0873]}
                        zoom={10}
                      />
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
                  We don't have any driving ranges listed for Basingstoke yet.
                </p>
                <p className="text-sm text-gray-500">
                  Check back soon as we're always adding new locations!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Main Content */}
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Golf Driving Ranges in Basingstoke</h2>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                  <p>
                    Basingstoke, the thriving commercial hub of Hampshire, offers excellent golf practice facilities for players seeking to improve their game. Our comprehensive directory features {ranges.length} carefully selected driving ranges across Basingstoke and the surrounding Hampshire countryside, each providing unique facilities and competitive pricing for local golfers and business travelers alike.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Makes Basingstoke's Driving Ranges Special?</h3>

                  <p>
                    Basingstoke's driving ranges benefit from excellent transport links and modern facilities that cater to the area's business community and growing residential population. Many facilities feature state-of-the-art practice areas, professional coaching services, and convenient opening hours that accommodate busy schedules. The region's rolling Hampshire countryside provides scenic backdrops for practice sessions.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Popular Driving Ranges in Basingstoke</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-3">Business-Friendly Locations</h4>
                      <p className="text-gray-600">
                        Many Basingstoke ranges cater to the business community with convenient locations near major employment areas and flexible practice times.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-3">Modern Facilities</h4>
                      <p className="text-gray-600">
                        Contemporary practice facilities featuring the latest golf technology, climate-controlled bays, and professional-standard equipment.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Driving Range Prices in Basingstoke</h3>

                  <p>
                    Basingstoke driving ranges offer competitive pricing with options to suit different budgets. Expect to pay from £3.00 for a basket of balls at local venues to premium rates for high-end facilities with advanced technology. Many ranges also offer corporate packages and membership options for regular players.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Facilities and Amenities</h3>

                  <p>
                    Basingstoke's golf facilities typically offer comprehensive amenities beyond just driving practice. Common features include pro shops, refreshment areas, equipment rental, putting greens, and professional coaching services. Many ranges are part of established golf clubs with full courses, making them perfect for a complete golfing experience.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                  <p>
                    Basingstoke's driving ranges are strategically located throughout the town and surrounding areas, with excellent access via the M3 motorway and A-roads. Whether you're based in the town center, working in one of the business parks, or visiting from London or the South Coast, you'll find quality practice facilities within easy reach. Most offer ample parking and welcome both corporate groups and individual players.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                    <h4 className="font-bold text-green-900 mb-3">Planning Your Visit</h4>
                    <ul className="text-green-800 space-y-2">
                      <li>• Most ranges offer extended hours for busy professionals</li>
                      <li>• Floodlit facilities available for evening practice sessions</li>
                      <li>• Equipment hire available for business travelers and beginners</li>
                      <li>• Excellent M3 access for visitors from London and the South</li>
                      <li>• Professional coaching available by appointment</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About Basingstoke Driving Ranges</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What is the best driving range in Basingstoke?</h3>
                    <p className="text-gray-600">
                      The best driving range depends on your needs. For business travelers, look for ranges with convenient access and extended hours. For serious golfers, consider facilities with professional coaching and advanced practice technology.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How much does it cost to use a driving range in Basingstoke?</h3>
                    <p className="text-gray-600">
                      Prices typically range from £3.00 for a bucket of balls at local facilities to £12.00+ for premium ranges with advanced features. Many offer corporate rates and membership options for regular players.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Do Basingstoke driving ranges offer golf lessons?</h3>
                    <p className="text-gray-600">
                      Yes, most driving ranges in Basingstoke offer professional golf instruction with qualified PGA professionals, including individual lessons, corporate group sessions, and beginner programs.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are Basingstoke driving ranges suitable for business groups?</h3>
                    <p className="text-gray-600">
                      Absolutely! Many Basingstoke ranges cater specifically to the business community with corporate packages, team building events, and convenient locations near major employment areas.
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