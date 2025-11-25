'use client'

import { GolfRange } from '@/types'

interface MapWithMarkersProps {
  ranges: GolfRange[]
  center: [number, number]
  zoom: number
}

export default function MapWithMarkers({ ranges, center }: MapWithMarkersProps) {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg border">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Driving Range Locations</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click on any location to view on Google Maps with directions
          </p>
        </div>

        {/* Interactive Location Grid */}
        <div className="space-y-3">
          {ranges.map((range) => (
            <div key={range.id} className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{range.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{range.address}</p>
                  <div className="flex gap-2 text-xs">
                    {range.num_bays && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {range.num_bays} bays
                      </span>
                    )}
                    {range.distance && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {range.distance} mi from center
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <a
                    href={`https://maps.google.com?q=${encodeURIComponent(range.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors text-center"
                  >
                    View on Map
                  </a>
                  <a
                    href={`/uk/nottingham/${range.slug}`}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors text-center"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center Location Reference */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Nottingham City Center</h4>
                <p className="text-sm text-blue-700">Market Square area (reference point for distances)</p>
              </div>
              <a
                href={`https://maps.google.com?q=${center[0]},${center[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
              >
                View on Map
              </a>
            </div>
          </div>
        </div>

        {/* Map View Options */}
        <div className="mt-4 text-center">
          <a
            href={`https://maps.google.com/maps?q=golf+driving+ranges+near+Nottingham+UK`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View All Locations on Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}