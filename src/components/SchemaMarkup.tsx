import { GolfRange } from '@/types'

interface SchemaMarkupProps {
  range: GolfRange
}

export default function SchemaMarkup({ range }: SchemaMarkupProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": range.name,
    "description": range.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": range.address,
      "addressLocality": range.city,
      "addressRegion": range.county,
      "postalCode": range.postcode,
      "addressCountry": "GB"
    },
    "telephone": range.phone,
    "url": range.website,
    "geo": range.latitude && range.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": range.latitude,
      "longitude": range.longitude
    } : undefined,
    "openingHours": range.opening_hours ? Object.entries(range.opening_hours).map(([day, hours]) =>
      `${day.substring(0, 2)} ${hours}`
    ) : undefined,
    "amenityFeature": range.facilities?.map(facility => ({
      "@type": "LocationFeatureSpecification",
      "name": facility
    })),
    "sport": "Golf",
    "additionalType": "https://schema.org/GolfCourse",
    "priceRange": range.prices ? Object.values(range.prices).join(', ') : undefined
  }

  // Remove undefined values
  const cleanedSchema = JSON.parse(JSON.stringify(schemaData))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanedSchema)
      }}
    />
  )
}