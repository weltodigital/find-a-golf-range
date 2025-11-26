'use client'

import { useEffect, useRef } from 'react'
import { GolfRange } from '@/types'

interface SingleRangeMapProps {
  range: GolfRange
  cityCenter: [number, number]
  zoom?: number
}

export default function SingleRangeMap({ range, cityCenter, zoom = 12 }: SingleRangeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !range.latitude || !range.longitude) return

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
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

      // Create map centered on the driving range
      const map = L.map(mapRef.current!).setView([range.latitude!, range.longitude!], zoom)
      mapInstanceRef.current = map

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add range marker (main marker)
      const rangeMarker = L.marker([range.latitude!, range.longitude!]).addTo(map)

      const rangePopupContent = `
        <div class="p-3 min-w-[250px]">
          <h3 class="font-bold text-gray-900 mb-2">${range.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${range.address}</p>

          <div class="flex gap-2 mb-3">
            ${range.num_bays ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">${range.num_bays} bays</span>` : ''}
            ${range.distance ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${range.distance} mi from ${range.city}</span>` : ''}
          </div>

          ${range.pricing ? `<p class="text-green-600 font-medium text-sm mb-3">Range Ball Pricing From ${range.pricing}</p>` : ''}

          <div class="flex flex-col gap-2">
            <a href="https://maps.google.com?q=${encodeURIComponent(range.address)}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors text-center">Get Directions</a>
            ${range.phone ? `<a href="tel:${range.phone}" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors text-center">Call Now</a>` : ''}
          </div>
        </div>
      `

      rangeMarker.bindPopup(rangePopupContent)

    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [range, cityCenter, zoom])

  // CSS is imported via CDN link in the main layout

  if (!range.latitude || !range.longitude) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Map location not available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}