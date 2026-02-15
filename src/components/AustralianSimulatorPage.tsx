'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { IndoorSimulator } from '@/types'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { calculateDistanceKm } from '@/lib/utils'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})



interface AustralianSimulatorPageProps {
  slug: string
  cityName: string
  cityPath: string
  cityCenterCoords: [number, number]
}

export default function AustralianSimulatorPage({ slug, cityName, cityPath, cityCenterCoords }: AustralianSimulatorPageProps) {
  const [simulator, setSimulator] = useState<IndoorSimulator | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadSimulator = async () => {
      try {
        console.log('Loading simulator with:', { slug, cityName });

        // Fetch the specific simulator by slug - look for Australian venues
        const { data: simulatorData, error } = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('city', cityName)
          .eq('slug', slug)
          .contains('special_features', ['australia'])
          .single()

        console.log('Query result:', { simulatorData, error });

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
        const distance = simulatorData.latitude && simulatorData.longitude
          ? calculateDistanceKm(
              cityCenterCoords[0],
              cityCenterCoords[1],
              simulatorData.latitude,
              simulatorData.longitude
            )
          : 0

        // Transform the data to match IndoorSimulator interface
        const transformedSimulator: IndoorSimulator = {
          id: simulatorData.id,
          slug: simulatorData.slug,
          name: simulatorData.name,
          address: simulatorData.address,
          city: simulatorData.city,
          postcode: simulatorData.postcode || '',
          county: simulatorData.county || '',
          phone: simulatorData.phone,
          email: simulatorData.email,
          website: simulatorData.website,
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
  }, [slug, cityName])

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
    if (lower.includes('trackman')) return '🏌️'
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {simulator.name}
            </h1>
            <p className="text-xl text-gray-600">
              Indoor golf simulator in {simulator.city}
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

            {/* Left Column - Image */}
            <div className="lg:col-span-1">
              {simulator.images && simulator.images.length > 0 && (
                <div className="w-full">
                  <img
                    src={simulator.images[0]}
                    alt={`${simulator.name} - Golf Simulator`}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Middle Column - About */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Simulator</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {simulator.detailed_description ||
                   `Experience year-round golf practice at ${simulator.name} in ${simulator.city}. Premium indoor golf simulator facility`}
                </p>
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                    📍 Address
                  </h4>
                  <p className="text-gray-700">
                    {simulator.address}<br />
                    {simulator.city}, {simulator.county} {simulator.postcode}
                  </p>
                </div>

                {simulator.phone && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                      📞 Phone
                    </h4>
                    <a href={`tel:${simulator.phone}`} className="text-green-600 hover:text-green-700">
                      {simulator.phone}
                    </a>
                  </div>
                )}

                {simulator.website && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                      🌐 Website
                    </h4>
                    <a
                      href={simulator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {/* Opening Hours */}
                {simulator.opening_hours && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      🕒 Opening Hours
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(simulator.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
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

          {/* Facilities & Amenities */}
          {simulator.facilities && simulator.facilities.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Facilities & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulator.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl mr-3">{getFeatureIcon(facility)}</span>
                    <span className="text-gray-700">{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technology & Equipment */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology & Equipment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Simulator System */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulator System</h3>
                <p className="text-gray-700 mb-4">Premium Golf Simulation Technology</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">High-speed cameras</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Ball flight analysis</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Club data tracking</span>
                  </li>
                  {simulator.simulator_brand && (
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{simulator.simulator_brand} technology</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Virtual Courses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Courses</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">World-famous courses</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Practice ranges</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Skills challenges</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Multiplayer games</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              📍 Location
            </h2>
            <p className="text-gray-700 mb-4">
              Find {simulator.name} in {simulator.city}
            </p>
            <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <OpenStreetMap
                simulators={[simulator]}
                centerCoords={[simulator.latitude, simulator.longitude]}
                zoom={15}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}