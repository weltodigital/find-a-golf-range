'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDbPage() {
  const [ranges, setRanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')

        // Simple test query
        const { data, error } = await supabase
          .from('golf_ranges')
          .select('name, city')
          .limit(5)

        if (error) {
          console.error('Supabase error:', error)
          setError(error.message)
        } else {
          console.log('Success! Got data:', data)
          setRanges(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      {loading && <p>Loading...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <p className="text-green-600 font-semibold">✅ Connection successful!</p>
          <p className="mt-2">Found {ranges.length} ranges:</p>
          <ul className="mt-2 list-disc pl-6">
            {ranges.map((range, index) => (
              <li key={index}>
                <strong>{range.name}</strong> - {range.city}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}