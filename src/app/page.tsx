'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchForm from '@/components/SearchForm'
import RangeCard from '@/components/RangeCard'
import { supabase } from '@/lib/supabase'
import { GolfRange } from '@/types'

export default function Home() {
  const [ranges, setRanges] = useState<GolfRange[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')

  useEffect(() => {
    fetchRanges()
  }, [])

  const fetchRanges = async (query = '', location = '') => {
    setLoading(true)
    try {
      let supabaseQuery = supabase.from('golf_ranges').select('*')

      if (query) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      }

      if (location) {
        supabaseQuery = supabaseQuery.or(`city.ilike.%${location}%,county.ilike.%${location}%,postcode.ilike.%${location}%`)
      }

      const { data, error } = await supabaseQuery.limit(12)

      if (error) {
        console.error('Error fetching ranges:', error)
        return
      }

      setRanges(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string, location: string) => {
    setSearchQuery(query)
    setSearchLocation(location)
    fetchRanges(query, location)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Find A Golf Range Near You
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover the best golf driving ranges across the UK.
                Practice your swing at top-quality facilities near you.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <SearchForm onSearch={handleSearch} />
            </div>
          </div>
        </section>

        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Browse Ranges by Country
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link
                href="/uk"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center border-l-4 border-primary group"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🇬🇧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary">
                  UK Golf Ranges
                </h3>
                <p className="text-gray-600">
                  Discover driving ranges across England, Scotland, Wales, and Northern Ireland
                </p>
              </Link>
              <Link
                href="/australia"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center border-l-4 border-primary group"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🇦🇺</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary">
                  Australia Golf Ranges
                </h3>
                <p className="text-gray-600">
                  Find premium driving ranges in Sydney, Newcastle, and beyond
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {searchQuery || searchLocation ? 'Search Results' : 'Featured Golf Ranges'}
              </h2>
              {(searchQuery || searchLocation) && (
                <p className="text-gray-600">
                  Results for &quot;{searchQuery}&quot; {searchLocation && `in ${searchLocation}`}
                </p>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">Loading ranges...</p>
              </div>
            ) : ranges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ranges.map((range) => (
                  <RangeCard key={range.id} range={range} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {searchQuery || searchLocation
                    ? 'No ranges found matching your search criteria. Try adjusting your search terms.'
                    : 'No ranges available at the moment.'
                  }
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Find A Golf Range?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📍</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Directory</h3>
                <p className="text-gray-600">
                  The most complete listing of golf driving ranges across the UK
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Search</h3>
                <p className="text-gray-600">
                  Find ranges by location, facilities, or specific features you need
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">ℹ️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Detailed Information</h3>
                <p className="text-gray-600">
                  Get comprehensive details about facilities, prices, and contact information
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}