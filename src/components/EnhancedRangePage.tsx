'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { GolfRange } from '@/types'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import SingleRangeMap to avoid SSR issues
const SingleRangeMap = dynamic(() => import('@/components/SingleRangeMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EnhancedRangePageProps {
  slug: string
  cityName: string
  cityPath: string
  cityCenterCoords: [number, number]
}

export default function EnhancedRangePage({ slug, cityName, cityPath, cityCenterCoords }: EnhancedRangePageProps) {
  const [range, setRange] = useState<GolfRange | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadRange = async () => {
      try {
        // Fetch the specific range by slug
        const { data: rangeData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error) {
          console.error('Error loading range:', error)
          setNotFound(true)
          setLoading(false)
          return
        }

        if (!rangeData) {
          setNotFound(true)
          setLoading(false)
          return
        }

        // Calculate distance from city center
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

        let distance = 0
        if (rangeData.latitude && rangeData.longitude) {
          distance = Math.round(calculateDistance(
            cityCenterCoords[0],
            cityCenterCoords[1],
            rangeData.latitude,
            rangeData.longitude
          ) * 10) / 10
        }

        // Transform the database data to match our GolfRange type
        const transformedRange: GolfRange = {
          id: rangeData.id,
          name: rangeData.name,
          slug: rangeData.slug,
          description: rangeData.description,
          detailed_description: rangeData.detailed_description,
          address: rangeData.address,
          city: rangeData.city,
          county: rangeData.county,
          postcode: rangeData.postcode,
          phone: rangeData.phone || '',
          email: rangeData.email || '',
          website: rangeData.website || '',
          latitude: rangeData.latitude || cityCenterCoords[0],
          longitude: rangeData.longitude || cityCenterCoords[1],
          num_bays: rangeData.num_bays,
          bays: rangeData.num_bays, // For compatibility
          features: rangeData.special_features?.join(', ') || '',
          special_features: rangeData.special_features || [],
          facilities: rangeData.facilities || [],
          pricing: rangeData.prices ? Object.values(rangeData.prices)[0] as string : '',
          prices: rangeData.prices,
          opening_hours: rangeData.opening_hours,
          images: rangeData.images || [],
          meta_title: rangeData.meta_title,
          meta_description: rangeData.meta_description,
          created_at: rangeData.created_at,
          updated_at: rangeData.updated_at,
          distance: distance
        }

        setRange(transformedRange)
        setLoading(false)
      } catch (error) {
        console.error('Error loading range:', error)
        setNotFound(true)
        setLoading(false)
      }
    }

    loadRange()
  }, [slug, cityCenterCoords])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading range details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound || !range) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Range Not Found</h1>
            <p className="text-gray-600 mb-4">The driving range you're looking for could not be found.</p>
            <Link
              href={cityPath}
              className="text-primary hover:text-primary-dark underline"
            >
              Back to {cityName} ranges
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getFeatureIcon = (feat: string) => {
    const lower = feat.toLowerCase();
    if (lower.includes('ball tracer') || lower.includes('toptracer') || lower.includes('trackman')) return '🎯';
    if (lower.includes('floodlit')) return '💡';
    if (lower.includes('food')) return '🍽️';
    if (lower.includes('shop')) return '🛍️';
    if (lower.includes('golf course')) return '⛳';
    if (lower.includes('tier')) return '🏢';
    if (lower.includes('covered')) return '🏠';
    return '✅';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <section className="bg-gray-50 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="text-primary hover:text-green-600">Home</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href="/uk" className="text-primary hover:text-green-600">UK</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href={cityPath} className="text-primary hover:text-green-600">{cityName}</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">{range.name}</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {range.name}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {range.description}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-primary">{range.num_bays || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Driving Bays</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-primary">
                    {range.pricing?.replace('From ', '') || (range.prices ? Object.values(range.prices)[0]?.replace('From ', '') : 'Call')}
                  </div>
                  <div className="text-sm text-gray-600">From Price</div>
                </div>
                <div className={`bg-white rounded-lg p-4 shadow-sm border ${
                  range.special_features?.includes('floodlit') ||
                  range.facilities?.some(f => f.toLowerCase().includes('floodlit'))
                    ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'
                }`}>
                  <div className="text-2xl font-bold text-primary">
                    {range.special_features?.includes('floodlit') ||
                     range.facilities?.some(f => f.toLowerCase().includes('floodlit')) ? '💡' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Floodlit</div>
                </div>
                <div className={`bg-white rounded-lg p-4 shadow-sm border ${
                  range.special_features?.includes('ball tracer') ||
                  range.facilities?.some(f => f.toLowerCase().includes('trackman') || f.toLowerCase().includes('toptracer') || f.toLowerCase().includes('inrange'))
                    ? 'border-blue-200 bg-blue-50' : 'border-gray-100'
                }`}>
                  <div className="text-2xl font-bold text-primary">
                    {range.special_features?.includes('ball tracer') ||
                     range.facilities?.some(f => f.toLowerCase().includes('trackman') || f.toLowerCase().includes('toptracer') || f.toLowerCase().includes('inrange')) ? '🎯' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Ball Tracking</div>
                </div>
                <div className={`bg-white rounded-lg p-4 shadow-sm border ${
                  range.special_features?.includes('golf course') ||
                  range.facilities?.some(f => f.toLowerCase().includes('golf course'))
                    ? 'border-green-200 bg-green-50' : 'border-gray-100'
                }`}>
                  <div className="text-2xl font-bold text-primary">
                    {range.special_features?.includes('golf course') ||
                     range.facilities?.some(f => f.toLowerCase().includes('golf course')) ? '⛳' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Golf Course</div>
                </div>
              </div>

              {/* Technology Highlight */}
              {range.facilities?.some(f => f.toLowerCase().includes('trackman') || f.toLowerCase().includes('toptracer') || f.toLowerCase().includes('inrange')) && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Ball Tracking Technology</h3>
                      <p className="text-gray-700 mb-3">
                        This range features cutting-edge ball tracking technology that provides real-time shot data, distances, and feedback to improve your game.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {range.facilities?.filter(f =>
                          f.toLowerCase().includes('trackman') ||
                          f.toLowerCase().includes('toptracer') ||
                          f.toLowerCase().includes('inrange')
                        ).map((tech, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Main Content */}
            <div className="lg:col-span-2">

              {/* Images Gallery */}
              {range.images && range.images.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Range Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {range.images.slice(0, 6).map((image, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <img
                          src={image}
                          alt={`${range.name} - Image ${index + 1}`}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                  {range.images.length > 6 && (
                    <p className="text-center mt-4 text-gray-600">
                      Showing 6 of {range.images.length} images
                    </p>
                  )}
                </section>
              )}

              {/* Detailed Description */}
              {range.detailed_description && range.detailed_description !== range.description && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Range</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">{range.detailed_description}</p>
                  </div>
                </section>
              )}

              {/* Facilities */}
              {range.facilities && range.facilities.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Facilities & Equipment</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {range.facilities.map((facility, index) => {
                      const isTracking = facility.toLowerCase().includes('trackman') || facility.toLowerCase().includes('toptracer') || facility.toLowerCase().includes('inrange');
                      const isFood = facility.toLowerCase().includes('food');
                      const isShop = facility.toLowerCase().includes('shop') || facility.toLowerCase().includes('pro shop');
                      const isFloodlit = facility.toLowerCase().includes('floodlit');

                      return (
                        <div key={index} className={`flex items-center rounded-lg p-4 ${
                          isTracking ? 'bg-blue-50 border border-blue-200' :
                          isFloodlit ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-green-50 border border-green-200'
                        }`}>
                          <div className={`w-4 h-4 rounded-full mr-3 ${
                            isTracking ? 'bg-blue-500' :
                            isFloodlit ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="text-gray-900 font-medium">{facility}</span>
                          {isTracking && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">TECH</span>}
                          {isFood && <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">FOOD</span>}
                          {isShop && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-semibold">SHOP</span>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Special Features */}
              {range.special_features && range.special_features.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Special Features</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {range.special_features.map((feature, index) => (
                      <div key={index} className="flex items-center bg-green-50 rounded-lg p-3 border border-green-200 hover:bg-green-100 transition-colors">
                        <span className="mr-2 text-lg">{getFeatureIcon(feature)}</span>
                        <span className="text-gray-900 font-medium capitalize text-sm">{feature.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Opening Hours */}
              {range.opening_hours && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Opening Hours</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                        const hours = typeof range.opening_hours === 'object' ? range.opening_hours?.[day] : range.opening_hours
                        if (!hours) return null
                        return (
                          <div key={day} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                            <span className="font-medium text-gray-900 capitalize">{day}:</span>
                            <span className="text-gray-700">{hours}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Pricing */}
              {range.prices && Object.keys(range.prices).length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Range Ball Pricing</h2>
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(range.prices).map(([key, price]) => {
                        const formatKey = (k: string) => {
                          const formatted = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          if (formatted.includes('Balls')) {
                            return formatted.replace('Balls', 'Golf Balls');
                          }
                          if (formatted.includes('Minutes')) {
                            return formatted + ' Session';
                          }
                          if (formatted.includes('Unlimited')) {
                            return formatted + ' Practice';
                          }
                          return formatted;
                        };

                        return (
                          <div key={key} className="bg-white rounded-lg p-4 border border-primary/10 shadow-sm">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{formatKey(key)}</h3>
                                <p className="text-sm text-gray-600">Practice session</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{price}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        💡 <strong>Tip:</strong> Prices may vary during peak hours and special events. Contact the range for current rates and promotions.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">

                {/* Contact Info */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Address</h4>
                      <p className="text-gray-700">{range.address}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {range.city && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            📍 {range.city}
                          </span>
                        )}
                        {range.county && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            🗺️ {range.county}
                          </span>
                        )}
                      </div>
                      {range.postcode && (
                        <p className="text-gray-700 font-mono text-sm bg-gray-50 inline-block px-2 py-1 rounded mt-1">{range.postcode}</p>
                      )}
                    </div>

                    {range.phone && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                        <a
                          href={`tel:${range.phone}`}
                          className="text-primary hover:text-primary-dark"
                        >
                          {range.phone}
                        </a>
                      </div>
                    )}

                    {range.email && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                        <a
                          href={`mailto:${range.email}`}
                          className="text-primary hover:text-primary-dark"
                        >
                          {range.email}
                        </a>
                      </div>
                    )}

                    {range.website && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Website</h4>
                        <a
                          href={range.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {/* Quick Actions */}
                <section className="bg-primary/5 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {range.phone && (
                      <a
                        href={`tel:${range.phone}`}
                        className="block w-full bg-primary text-white text-center py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Call Now
                      </a>
                    )}
                    {range.email && (
                      <a
                        href={`mailto:${range.email}`}
                        className="block w-full bg-white border border-primary text-primary text-center py-3 px-4 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        Send Email
                      </a>
                    )}
                    <a
                      href={`https://maps.google.com?q=${encodeURIComponent(range.address + ', ' + range.postcode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-white border border-gray-300 text-gray-900 text-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View on Map
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Location & Directions</h2>
              <p className="text-gray-600">
                Find {range.name} on the map below and get directions to start your golf practice session.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <SingleRangeMap
                  range={range}
                  cityCenter={cityCenterCoords}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Back to Location Button */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href={cityPath}
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {cityName} Ranges
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}