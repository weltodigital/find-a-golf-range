import Link from 'next/link'
import { GolfRange } from '@/types'

interface RangeCardProps {
  range: GolfRange
}

export default function RangeCard({ range }: RangeCardProps) {
  const displayFacilities = range.facilities || (range.features ? range.features.split(', ') : [])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{range.name}</h3>
          <div className="flex gap-2 mb-2">
            {(range.bays || range.num_bays) && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                {range.bays || range.num_bays} bays
              </span>
            )}
            {range.distance && range.distance > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {range.distance} mi from {range.city}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-2">
          {range.address}, {range.city}
        </p>
        <p className="text-gray-600 mb-2">{range.county} {range.postcode}</p>

        {range.pricing && (
          <p className="text-green-600 font-medium mb-2">{range.pricing}</p>
        )}

        {range.description && (
          <p className="text-gray-700 mb-4 line-clamp-3">{range.description}</p>
        )}

        {displayFacilities && displayFacilities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
            <div className="flex flex-wrap gap-2">
              {displayFacilities.slice(0, 4).map((facility, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {facility}
                </span>
              ))}
              {displayFacilities.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  +{displayFacilities.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {range.opening_hours && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Opening Hours:</h4>
            <div className="text-xs text-gray-600">
              {(() => {
                try {
                  const hours = typeof range.opening_hours === 'string'
                    ? JSON.parse(range.opening_hours)
                    : range.opening_hours;
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                  const todayHours = hours[today];
                  if (todayHours) {
                    return `Today: ${todayHours}`;
                  }
                  return Object.entries(hours).slice(0, 2).map(([day, time]) => `${day}: ${time}`).join(', ');
                } catch {
                  return 'See details for hours';
                }
              })()}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {range.phone && (
              <a
                href={`tel:${range.phone}`}
                className="text-primary hover:text-green-600 text-sm font-medium"
              >
                📞
              </a>
            )}
            {range.email && (
              <a
                href={`mailto:${range.email}`}
                className="text-primary hover:text-green-600 text-sm font-medium"
              >
                ✉️
              </a>
            )}
            {range.website && (
              <a
                href={range.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-green-600 text-sm font-medium"
              >
                🌐
              </a>
            )}
          </div>
          <Link
            href={`/uk/${range.city.toLowerCase()}/${range.slug}`}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}