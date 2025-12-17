'use client'

import { useEffect, useRef } from 'react'
import { GolfRange } from '@/types'

interface Marker {
  id: string
  name: string
  latitude: number
  longitude: number
  description: string
  link: string
  address?: string
  distance?: number | null
}

interface OpenStreetMapProps {
  ranges?: GolfRange[]
  markers?: Marker[]
  center: [number, number] | { latitude: number, longitude: number }
  zoom: number
}

export default function OpenStreetMap({ ranges, markers, center, zoom }: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Geocoding function using Nominatim (OpenStreetMap's geocoding service)
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      const data = await response.json()
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    return null
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(async (L) => {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Fix default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Normalize center coordinates
      const mapCenter = Array.isArray(center) ? center : [center.latitude, center.longitude] as [number, number]

      // Create map
      const map = L.map(mapRef.current!).setView(mapCenter, zoom)
      mapInstanceRef.current = map

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add markers - either from ranges or markers prop
      const itemsToMap = ranges || markers || []

      // Process items and geocode those without coordinates
      for (const item of itemsToMap) {
        let lat = item.latitude
        let lng = item.longitude

        // If no coordinates but has address, try geocoding
        if ((!lat || !lng) && item.address) {
          console.log('Geocoding address:', item.address)
          const coords = await geocodeAddress(item.address)
          if (coords) {
            lat = coords.lat
            lng = coords.lng
            console.log('Got coordinates:', lat, lng)
          }
        }

        // Skip if still no coordinates
        if (!lat || !lng) continue

        const marker = L.marker([lat, lng]).addTo(map)

        let popupContent = ''

        if (ranges && 'num_bays' in item) {
          // Golf range popup
          const range = item as GolfRange
          popupContent = `
            <div class="p-3 min-w-[250px]">
              <h3 class="font-bold text-gray-900 mb-2">${range.name}</h3>
              <p class="text-sm text-gray-600 mb-2">${range.address}</p>

              <div class="flex gap-2 mb-3">
                ${range.num_bays ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">${range.num_bays} bays</span>` : ''}
                ${range.distance ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${range.distance} mi</span>` : ''}
              </div>

              ${range.pricing ? `<p class="text-green-600 font-medium text-sm mb-3">From ${range.pricing}</p>` : ''}

              <div class="flex flex-col gap-2">
                <a href="https://maps.google.com?q=${encodeURIComponent(range.address)}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors text-center">Get Directions</a>
                <a href="/uk/${range.slug}" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors text-center">View Details</a>
              </div>
            </div>
          `
        } else {
          // Simulator popup
          const sim = item as Marker
          popupContent = `
            <div class="p-3 min-w-[250px]">
              <h3 class="font-bold text-gray-900 mb-2">${sim.name}</h3>
              ${sim.address ? `<p class="text-sm text-gray-600 mb-2">${sim.address}</p>` : ''}

              ${sim.distance ? `
                <div class="flex gap-2 mb-3">
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">${sim.distance} mi away</span>
                </div>
              ` : ''}

              ${sim.description ? `<p class="text-sm text-gray-700 mb-3">${sim.description}</p>` : ''}

              <div class="flex flex-col gap-2">
                <a href="https://maps.google.com?q=${encodeURIComponent(sim.address || sim.name)}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors text-center">Get Directions</a>
                <a href="${sim.link}" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors text-center">View Details</a>
              </div>
            </div>
          `
        }

        marker.bindPopup(popupContent)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ranges, markers, center, zoom])

  // CSS is imported via CDN link in the main layout

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}