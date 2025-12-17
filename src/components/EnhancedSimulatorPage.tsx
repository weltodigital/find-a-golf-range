'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { IndoorSimulator } from '@/types'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

const supabaseUrl = 'https://jiwttpxqvllvkvepjyix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EnhancedSimulatorPageProps {
  slug: string
  cityName: string
  cityPath: string
  cityCenterCoords: [number, number]
}

export default function EnhancedSimulatorPage({ slug, cityName, cityPath, cityCenterCoords }: EnhancedSimulatorPageProps) {
  const [simulator, setSimulator] = useState<IndoorSimulator | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadSimulator = async () => {
      try {
        // Fetch the specific simulator by slug
        const { data: simulatorData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('slug', slug)
          .contains('special_features', ['Indoor Simulator'])
          .single()

        if (error) {
          console.error('Error loading simulator:', error)
          setNotFound(true)
          setLoading(false)
          return
        }

        if (!simulatorData) {
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
        if (simulatorData.latitude && simulatorData.longitude) {
          distance = Math.round(calculateDistance(
            cityCenterCoords[0],
            cityCenterCoords[1],
            simulatorData.latitude,
            simulatorData.longitude
          ) * 10) / 10
        }

        // Transform the database data to match our IndoorSimulator type
        const transformedSimulator: IndoorSimulator = {
          id: simulatorData.id,
          name: simulatorData.name,
          slug: simulatorData.slug,
          description: simulatorData.description,
          detailed_description: simulatorData.detailed_description,
          address: simulatorData.address,
          city: simulatorData.city,
          county: simulatorData.county,
          postcode: simulatorData.postcode,
          phone: simulatorData.phone || '',
          email: simulatorData.email || '',
          website: simulatorData.website || '',
          latitude: simulatorData.latitude || cityCenterCoords[0],
          longitude: simulatorData.longitude || cityCenterCoords[1],
          num_simulators: simulatorData.num_bays || 1,
          simulator_brand: simulatorData.simulator_brand || '',
          facilities: simulatorData.facilities || [],
          pricing: simulatorData.prices ? Object.values(simulatorData.prices)[0] as string : '',
          opening_hours: simulatorData.opening_hours,
          images: simulatorData.images || [],
          distance: distance
        }

        setSimulator(transformedSimulator)
        setLoading(false)
      } catch (error) {
        console.error('Error loading simulator:', error)
        setNotFound(true)
        setLoading(false)
      }
    }

    loadSimulator()
  }, [slug, cityCenterCoords])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading simulator details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound || !simulator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Simulator Not Found</h1>
            <p className="text-gray-600 mb-4">The golf simulator you're looking for could not be found.</p>
            <Link
              href={cityPath}
              className="text-primary hover:text-primary-dark underline"
            >
              Back to {cityName} simulators
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getFeatureIcon = (feat: string) => {
    const lower = feat.toLowerCase()
    if (lower.includes('trackman')) return '📊'
    if (lower.includes('simulator') || lower.includes('indoor')) return '🏌️'
    if (lower.includes('practice')) return '⛳'
    if (lower.includes('coaching')) return '👨‍🏫'
    if (lower.includes('food') || lower.includes('cafe')) return '🍽️'
    if (lower.includes('bar') || lower.includes('drinks')) return '🍺'
    if (lower.includes('shop') || lower.includes('pro shop')) return '🛍️'
    if (lower.includes('parking')) return '🅿️'
    return '✅'
  }

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
                <li><Link href="/simulators" className="text-primary hover:text-green-600">Simulators</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href="/simulators/uk" className="text-primary hover:text-green-600">UK</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href={cityPath} className="text-primary hover:text-green-600">{cityName}</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">{simulator.name}</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {simulator.name}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {simulator.description || `Premium indoor golf simulator experience in ${cityName}`}
              </p>

              {/* Venue Image */}
              {simulator.images && simulator.images.length > 1 && (
                <div className="mb-8">
                  <div className="relative overflow-hidden rounded-lg shadow-md">
                    <img
                      src={simulator.images[1]}
                      alt={`${simulator.name} - Golf Simulator`}
                      className="w-full max-w-md h-48 object-cover"
                      onError={(e) => {
                        // Hide image container if image fails to load
                        const target = e.target as HTMLImageElement;
                        const container = target.closest('.mb-8') as HTMLElement;
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
              )}


              {/* Technology Highlight */}
              {simulator.simulator_brand && (simulator.simulator_brand.toLowerCase().includes('trackman') || simulator.simulator_brand.toLowerCase().includes('toptracer') || simulator.simulator_brand.toLowerCase().includes('golfzon')) && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Golf Simulation Technology</h3>
                      <p className="text-gray-700 mb-3">
                        Experience cutting-edge golf simulation with {simulator.simulator_brand} technology, providing precise ball tracking,
                        detailed shot analysis, and access to world-famous golf courses.
                      </p>
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {simulator.simulator_brand}
                      </span>
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
              {simulator.images && simulator.images.length > 0 && (
                <section className="mb-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simulator.images.slice(0, 6).map((image, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <img
                          src={image}
                          alt={`${simulator.name}`}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            // Hide image container if image fails to load
                            const target = e.target as HTMLImageElement;
                            const container = target.closest('.relative') as HTMLElement;
                            if (container) {
                              container.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Detailed Description */}
              {simulator.detailed_description && simulator.detailed_description !== simulator.description && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Simulator</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {simulator.detailed_description?.replace(/Indoor golf course in \w+/gi, 'Premium indoor golf simulator facility')}
                    </p>
                  </div>
                </section>
              )}

              {/* Default Description if no detailed description */}
              {(!simulator.detailed_description || simulator.detailed_description === simulator.description) && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Simulator</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {simulator.name} offers a premium indoor golf simulator experience in {cityName}.
                      {simulator.simulator_brand && ` Featuring ${simulator.simulator_brand} technology,`}
                      Our facility provides year-round golf entertainment with precise shot tracking,
                      virtual courses, and detailed performance analytics.
                    </p>
                    <p className="text-gray-700 leading-relaxed text-lg mt-4">
                      Whether you're looking to improve your game, enjoy a round with friends, or escape the weather,
                      our {simulator.num_simulators || 1} simulator{(simulator.num_simulators || 1) > 1 ? 's' : ''}
                      {(simulator.num_simulators || 1) > 1 ? ' offer' : ' offers'} the perfect indoor golf solution in {simulator.county}.
                    </p>
                  </div>
                </section>
              )}

              {/* Facilities */}
              {simulator.facilities && simulator.facilities.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Facilities & Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simulator.facilities.map((facility, index) => {
                      const isTracking = facility.toLowerCase().includes('trackman') || facility.toLowerCase().includes('toptracer') || facility.toLowerCase().includes('golfzon')
                      const isCoaching = facility.toLowerCase().includes('coaching') || facility.toLowerCase().includes('lesson') || facility.toLowerCase().includes('instruction')
                      const isFood = facility.toLowerCase().includes('food') || facility.toLowerCase().includes('bar') || facility.toLowerCase().includes('cafe')

                      return (
                        <div key={index} className={`flex items-center rounded-lg p-4 ${
                          isTracking ? 'bg-blue-50 border border-blue-200' :
                          isCoaching ? 'bg-purple-50 border border-purple-200' :
                          isFood ? 'bg-orange-50 border border-orange-200' :
                          'bg-green-50 border border-green-200'
                        }`}>
                          <div className="mr-3 text-2xl">
                            {getFeatureIcon(facility)}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{facility}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Technology & Equipment */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Technology & Equipment</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Simulator System</h4>
                      <p className="text-gray-700 mb-3">
                        {simulator.simulator_brand || 'Premium Golf Simulation Technology'}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          High-speed cameras
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Ball flight analysis
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Club data tracking
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Virtual Courses</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          World-famous courses
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Practice ranges
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Skills challenges
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Multiplayer games
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div>
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">📍 Address</h4>
                    <p className="text-gray-700">
                      {simulator.address}<br />
                      {simulator.city}, {simulator.county}<br />
                      {simulator.postcode}
                    </p>
                  </div>

                  {simulator.phone && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">📞 Phone</h4>
                      <a href={`tel:${simulator.phone}`} className="text-primary hover:text-green-600">
                        {simulator.phone}
                      </a>
                    </div>
                  )}

                  {simulator.email && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">✉️ Email</h4>
                      <a href={`mailto:${simulator.email}`} className="text-primary hover:text-green-600">
                        {simulator.email}
                      </a>
                    </div>
                  )}

                  {simulator.website && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">🌐 Website</h4>
                      <a
                        href={simulator.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-green-600"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>


              {/* Opening Hours */}
              {simulator.opening_hours && (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🕒 Opening Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(simulator.opening_hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium text-gray-700 capitalize">{day}:</span>
                        <span className="text-gray-600">{hours as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Section */}
        {simulator.latitude && simulator.longitude && (
          <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">📍 Location</h2>
                <p className="text-gray-600">
                  Find {simulator.name} in {cityName}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-full h-96">
                  <OpenStreetMap
                    markers={[{
                      id: simulator.id.toString(),
                      name: simulator.name,
                      latitude: simulator.latitude,
                      longitude: simulator.longitude,
                      description: simulator.description || '',
                      link: '',
                      address: `${simulator.address}, ${simulator.city}`
                    }]}
                    center={{ latitude: simulator.latitude, longitude: simulator.longitude }}
                    zoom={15}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}