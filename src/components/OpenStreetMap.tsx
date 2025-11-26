'use client'

import { useEffect, useRef } from 'react'
import { GolfRange } from '@/types'

interface OpenStreetMapProps {
  ranges: GolfRange[]
  center: [number, number]
  zoom: number
}

export default function OpenStreetMap({ ranges, center, zoom }: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

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

      // Create map
      const map = L.map(mapRef.current!).setView(center, zoom)
      mapInstanceRef.current = map

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)


      // Add range markers
      ranges.forEach((range) => {
        if (!range.latitude || !range.longitude) return

        const marker = L.marker([range.latitude, range.longitude]).addTo(map)

        const popupContent = `
          <div class="p-3 min-w-[250px]">
            <h3 class="font-bold text-gray-900 mb-2">${range.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${range.address}</p>

            <div class="flex gap-2 mb-3">
              ${range.num_bays ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">${range.num_bays} bays</span>` : ''}
              ${range.distance ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${range.distance} mi from Nottingham</span>` : ''}
            </div>

            ${range.pricing ? `<p class="text-green-600 font-medium text-sm mb-3">Range Ball Pricing From ${range.pricing}</p>` : ''}

            <div class="flex flex-col gap-2">
              <a href="https://maps.google.com?q=${encodeURIComponent(range.address)}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors text-center">Get Directions</a>
              <a href="/uk/nottingham/${range.slug}" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors text-center">View Details</a>
            </div>
          </div>
        `

        marker.bindPopup(popupContent)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ranges, center, zoom])

  // CSS is imported via CDN link in the main layout

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}