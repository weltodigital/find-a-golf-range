import Link from 'next/link'
import Image from 'next/image'
import { IndoorSimulator } from '@/types'

interface SimulatorCardProps {
  simulator: IndoorSimulator
  distanceFrom?: string
}

export default function SimulatorCard({ simulator, distanceFrom = 'London' }: SimulatorCardProps) {
  const displayFacilities = simulator.facilities || (simulator.simulator_features ? simulator.simulator_features.split(', ') : [])
  const imageUrl = simulator.images && simulator.images.length > 0 ? simulator.images[0] : null

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Venue Image */}
      {imageUrl && (
        <div className="w-full h-48 relative overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={`${simulator.name} - Golf Simulator`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // Hide image container if image fails to load
              const target = e.target as HTMLImageElement;
              const container = target.closest('.w-full.h-48') as HTMLElement;
              if (container) {
                container.style.display = 'none';
              }
            }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{simulator.name}</h3>
          <div className="flex gap-2 mb-2">
            {simulator.distance && simulator.distance > 0 ? (
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                {simulator.distance} mi from {distanceFrom}
              </span>
            ) : (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Located in {distanceFrom}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-2">
          {simulator.address}, {simulator.city}
        </p>
        <p className="text-gray-600 mb-2">{simulator.county} {simulator.postcode}</p>

        {simulator.pricing && (
          <p className="text-green-600 font-medium mb-2">{simulator.pricing}</p>
        )}

        {simulator.description && (
          <p className="text-gray-700 mb-4 line-clamp-3">{simulator.description}</p>
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

        {simulator.opening_hours && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Opening Hours:</h4>
            <div className="text-xs text-gray-600">
              {(() => {
                try {
                  const hours = typeof simulator.opening_hours === 'string'
                    ? JSON.parse(simulator.opening_hours)
                    : simulator.opening_hours;
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
            {simulator.phone && (
              <a
                href={`tel:${simulator.phone}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📞
              </a>
            )}
            {simulator.email && (
              <a
                href={`mailto:${simulator.email}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ✉️
              </a>
            )}
            {simulator.website && (
              <a
                href={simulator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                🌐
              </a>
            )}
          </div>
          <Link
            href={`/simulators/uk/${simulator.city.toLowerCase().replace(/\s+/g, '-')}/${simulator.slug}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}