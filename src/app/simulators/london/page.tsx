'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SimulatorCard from '@/components/SimulatorCard'
import { IndoorSimulator } from '@/types'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function LondonSimulatorsPage() {
  const [simulators, setSimulators] = useState<IndoorSimulator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Calculate distance from London center (51.5074, -0.1278)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const londonCenter = { lat: 51.5074, lng: -0.1278 };

    const londonSimulators: IndoorSimulator[] = [
      {
        id: '1',
        name: 'Urban Golf',
        slug: 'urban-golf',
        address: '12 Smithfield Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'EC1A 9LA',
        phone: '020 7248 8600',
        email: 'bookings@urbangolf.co.uk',
        website: 'https://urbangolf.co.uk/',
        latitude: 51.5190,
        longitude: -0.1019,
        simulator_brand: 'TrackMan',
        num_simulators: 11,
        description: "London's original indoor golf venue with 11 TrackMan simulators",
        pricing: 'From £40/hour'
      },
      {
        id: '2',
        name: 'Project Golf',
        slug: 'project-golf',
        address: '48-54 Moorgate',
        city: 'London',
        county: 'Greater London',
        postcode: 'EC2R 6EJ',
        phone: '020 3778 4653',
        email: 'info@project.golf',
        website: 'https://project.golf/',
        latitude: 51.5186,
        longitude: -0.0886,
        simulator_brand: 'TrackMan 4',
        num_simulators: 6,
        description: 'Premium TrackMan 4 simulators in the heart of the City',
        pricing: 'From £55/hour'
      },
      {
        id: '3',
        name: 'The Golf Groove',
        slug: 'the-golf-groove',
        address: '321 Harrow Road',
        city: 'London',
        county: 'Greater London',
        postcode: 'W9 3RB',
        phone: '020 7266 3300',
        email: 'info@thegolfgroove.com',
        website: 'https://www.thegolfgroove.com',
        latitude: 51.5249,
        longitude: -0.2089,
        simulator_brand: 'SkyTrak',
        num_simulators: 4,
        description: 'Modern golf simulators with bar and restaurant',
        pricing: 'From £35/hour'
      },
      {
        id: '4',
        name: 'Grip Golf',
        slug: 'grip-golf',
        address: '52 Bermondsey Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'SE1 3UD',
        phone: '020 3696 8430',
        email: 'hello@gripgolf.co.uk',
        website: 'https://gripgolf.co.uk/',
        latitude: 51.4987,
        longitude: -0.0806,
        simulator_brand: 'TrackMan',
        num_simulators: 3,
        description: 'Boutique golf simulator experience in Bermondsey',
        pricing: 'From £45/hour'
      },
      {
        id: '5',
        name: 'Pitch Golf',
        slug: 'pitch-golf',
        address: '40 Bartholomew Close',
        city: 'London',
        county: 'Greater London',
        postcode: 'EC1A 7JN',
        phone: '020 7796 4040',
        email: 'info@pitchgolf.com',
        website: 'https://london.pitchgolf.com/',
        latitude: 51.5186,
        longitude: -0.0986,
        simulator_brand: 'GC Hawk',
        num_simulators: 2,
        description: 'Central London golf simulators near Barbican',
        pricing: 'From £50/hour'
      },
      {
        id: '6',
        name: 'Tee Box Golf',
        slug: 'tee-box-golf',
        address: '156 Great Portland Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'W1W 5QA',
        phone: '020 7580 3456',
        email: 'bookings@tee-box.co.uk',
        website: 'https://www.tee-box.co.uk/',
        latitude: 51.5226,
        longitude: -0.1436,
        simulator_brand: 'AboutGolf',
        num_simulators: 5,
        description: 'Professional golf simulators near Oxford Street',
        pricing: 'From £38/hour'
      },
      {
        id: '7',
        name: 'The Dilly Golf Club',
        slug: 'the-dilly-golf-club',
        address: '21 Piccadilly',
        city: 'London',
        county: 'Greater London',
        postcode: 'W1J 0BH',
        phone: '020 7734 8000',
        email: 'golf@thedillylondon.com',
        website: 'https://www.thedillylondon.com/',
        latitude: 51.5074,
        longitude: -0.1395,
        simulator_brand: 'TrackMan',
        num_simulators: 2,
        description: 'Luxury golf simulators in Piccadilly hotel',
        pricing: 'From £80/hour'
      },
      {
        id: '8',
        name: 'A1 Golf Range',
        slug: 'a1-golf-range',
        address: '237 High Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'EN5 5QZ',
        phone: '020 8449 0011',
        email: 'info@a1golfrange.co.uk',
        website: 'https://www.a1golfrange.co.uk/',
        latitude: 51.6482,
        longitude: -0.2037,
        simulator_brand: 'FlightScope',
        num_simulators: 3,
        description: 'North London golf simulators with outdoor range',
        pricing: 'From £25/hour'
      },
      {
        id: '9',
        name: 'Screen Golfers',
        slug: 'screen-golfers',
        address: '89 Leadenhall Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'EC3A 3DH',
        phone: '020 7283 4567',
        email: 'bookings@screengolfers.com',
        website: 'https://screengolfers.com/',
        latitude: 51.5131,
        longitude: -0.0829,
        simulator_brand: 'GCQuad',
        num_simulators: 4,
        description: 'City golf simulators with Foresight technology',
        pricing: 'From £42/hour'
      },
      {
        id: '10',
        name: 'Arch Golf',
        slug: 'arch-golf',
        address: 'Railway Arch 99, Bethnal Green Road',
        city: 'London',
        county: 'Greater London',
        postcode: 'E2 7AG',
        phone: '020 7739 1234',
        email: 'hello@archgolf.co.uk',
        website: 'https://www.archgolf.co.uk/',
        latitude: 51.5267,
        longitude: -0.0692,
        simulator_brand: 'SkyTrak',
        num_simulators: 6,
        description: 'East London golf simulators in converted railway arch',
        pricing: 'From £30/hour'
      }
    ].map(sim => ({
      ...sim,
      distance: sim.latitude && sim.longitude
        ? Math.round(calculateDistance(londonCenter.lat, londonCenter.lng, sim.latitude, sim.longitude) * 10) / 10
        : undefined
    }))

    setSimulators(londonSimulators)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading London golf simulators...</p>
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
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Indoor Golf Simulators in London
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover London's finest indoor golf simulators for your year-round golf practice. Compare prices, technology, and locations from London city center across {simulators.length} premium golf simulator venues throughout London and the surrounding area.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 TrackMan Technology</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ Year-Round Practice</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">📊 Detailed Analytics</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🌍 World Famous Courses</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {simulators.length}
                </div>
                <div className="text-sm text-gray-600">Indoor Simulators</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  £25.00
                </div>
                <div className="text-sm text-gray-600">From (cheapest)</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {Math.max(...simulators.map(s => s.num_simulators || 0))}
                </div>
                <div className="text-sm text-gray-600">Max Simulators</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {Math.min(...simulators.filter(s => s.distance && s.distance > 0).map(s => s.distance!)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Closest (miles)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Distance from London center:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Up to 25 miles</span>
                </div>
                <span className="text-sm text-gray-500">Showing {simulators.length} of {simulators.length} simulators</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
                <select
                  id="sort"
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
                  defaultValue="distance"
                >
                  <option value="distance">Distance (Closest)</option>
                  <option value="price">Price (Lowest)</option>
                  <option value="simulators">Simulators (Most)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Simulators List */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All Simulators</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {simulators.map((simulator, index) => (
                <SimulatorCard key={simulator.id} simulator={simulator} distanceFrom="London" />
              ))}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Simulator Locations
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Map showing simulator venues across London.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-full h-96">
                <OpenStreetMap
                  markers={simulators
                    .filter(sim => sim.latitude && sim.longitude)
                    .map(sim => ({
                      id: sim.id.toString(),
                      name: sim.name,
                      latitude: sim.latitude!,
                      longitude: sim.longitude!,
                      description: sim.description || '',
                      link: `/simulators/uk/london/${sim.slug}`
                    }))}
                  center={{ latitude: 51.5074, longitude: -0.1278 }}
                  zoom={12}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Complete Guide to London Indoor Golf Simulators
                </h2>

                <p className="text-gray-600 mb-6">
                  London offers some of the world's finest indoor golf simulator facilities, featuring cutting-edge technology
                  from TrackMan, GCQuad, and other leading brands. Whether you're a beginner looking to learn the game or
                  a scratch golfer maintaining your skills year-round, London's simulator venues provide the perfect environment
                  for practice, entertainment, and improvement.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  Why Choose Indoor Golf Simulators?
                </h3>

                <p className="text-gray-600 mb-4">
                  Indoor golf simulators offer several advantages over traditional driving ranges and golf courses:
                </p>

                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li><strong>Year-round play:</strong> Practice regardless of weather conditions</li>
                  <li><strong>Accurate data:</strong> Get precise ball flight and swing analysis</li>
                  <li><strong>Course variety:</strong> Play famous courses from around the world</li>
                  <li><strong>Time efficiency:</strong> No waiting, book specific time slots</li>
                  <li><strong>Social experience:</strong> Perfect for groups and corporate events</li>
                </ul>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  Top Simulator Technologies in London
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">TrackMan</h4>
                    <p className="text-gray-600 text-sm">
                      The gold standard in golf simulation technology. TrackMan uses dual radar technology
                      to provide the most accurate ball flight data available, tracking over 20 data points
                      including ball speed, launch angle, and spin rate.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">GCQuad & GC Hawk</h4>
                    <p className="text-gray-600 text-sm">
                      Foresight Sports' camera-based systems offer exceptional accuracy and reliability.
                      These systems capture high-speed images of ball impact and club data, providing
                      detailed analytics for game improvement.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">SkyTrak</h4>
                    <p className="text-gray-600 text-sm">
                      A popular choice for indoor facilities, SkyTrak provides accurate ball flight data
                      and access to world-famous golf courses through its software platform.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">AboutGolf</h4>
                    <p className="text-gray-600 text-sm">
                      Known for their PGA Tour simulators, AboutGolf systems feature high-definition
                      graphics and realistic course play, offering an immersive golf experience.
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  London Areas for Indoor Golf
                </h3>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Central London</h4>
                  <p className="text-gray-600 mb-4">
                    The heart of London offers premium simulator experiences with venues like Urban Golf in Smithfield,
                    Project Golf near Moorgate, and the luxury experience at The Dilly in Piccadilly. These venues
                    typically feature the latest technology and premium amenities but come at a higher price point.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">East London</h4>
                  <p className="text-gray-600 mb-4">
                    Areas like Bermondsey and Bethnal Green offer innovative spaces such as Grip Golf and Arch Golf,
                    often in converted industrial spaces that provide a unique atmosphere for your golf experience.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">North London</h4>
                  <p className="text-gray-600 mb-4">
                    North London venues like A1 Golf Range often combine indoor simulators with traditional outdoor
                    practice facilities, offering excellent value and comprehensive golf training options.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  Pricing and Booking Information
                </h3>

                <p className="text-gray-600 mb-4">
                  London golf simulator pricing varies significantly based on location, technology, and time of day:
                </p>

                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li><strong>Budget-friendly options:</strong> £25-35/hour (typically off-peak times)</li>
                  <li><strong>Mid-range facilities:</strong> £35-50/hour (standard TrackMan venues)</li>
                  <li><strong>Premium experiences:</strong> £50-80/hour (luxury locations, latest technology)</li>
                  <li><strong>Peak times:</strong> Evenings and weekends typically cost 20-30% more</li>
                </ul>

                <div className="bg-blue-50 p-6 rounded-lg mb-8">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">💡 Booking Tips</h4>
                  <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                    <li>Book during off-peak hours (weekday afternoons) for better rates</li>
                    <li>Many venues offer group packages and corporate rates</li>
                    <li>Some facilities include club rental in their hourly rate</li>
                    <li>Advanced booking is recommended, especially for weekend slots</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  What to Expect at London Golf Simulators
                </h3>

                <p className="text-gray-600 mb-4">
                  Modern golf simulators in London typically offer:
                </p>

                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li><strong>High-definition projectors:</strong> Immersive course visuals</li>
                  <li><strong>Launch monitor technology:</strong> Detailed swing and ball flight data</li>
                  <li><strong>Course selection:</strong> Play famous courses from around the world</li>
                  <li><strong>Practice modes:</strong> Driving range, closest to pin, skills challenges</li>
                  <li><strong>Social features:</strong> Multiplayer games and competitions</li>
                  <li><strong>Data tracking:</strong> Session history and improvement analytics</li>
                </ul>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                  Transport and Accessibility
                </h3>

                <p className="text-gray-600 mb-6">
                  Most London simulator venues are easily accessible by public transport. Central London locations
                  are typically within walking distance of Underground stations, while outer London venues often
                  provide parking facilities. Many venues are wheelchair accessible and offer facilities for
                  golfers of all abilities.
                </p>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">🏌️ Ready to Play?</h4>
                  <p className="text-green-800 text-sm mb-3">
                    Use our directory above to find the perfect indoor golf simulator for your needs.
                    Each listing includes contact details, pricing information, and location data to help you choose.
                  </p>
                  <p className="text-green-800 text-sm">
                    For the most up-to-date availability and special offers, we recommend calling venues directly
                    or checking their websites before visiting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}