interface LocationSchemaMarkupProps {
  city: string
  county: string
  region: string
  rangeCount: number
  totalBays: number
  ranges: Array<{
    name: string
    slug: string
    address: string
    phone?: string
    website?: string
  }>
}

export default function LocationSchemaMarkup({
  city,
  county,
  region,
  rangeCount,
  totalBays,
  ranges
}: LocationSchemaMarkupProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://findagolfrange.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "UK",
        "item": "https://findagolfrange.com/uk/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city,
        "item": `https://findagolfrange.com/uk/${city.toLowerCase().replace(/\s+/g, '-')}/`
      }
    ]
  }

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${city} Golf Driving Ranges`,
    "description": `Find the best golf driving ranges in ${city}, ${county}. Browse ${rangeCount} top-rated practice facilities.`,
    "url": `https://findagolfrange.com/uk/${city.toLowerCase().replace(/\s+/g, '-')}/`,
    "about": {
      "@type": "Place",
      "name": city,
      "addressRegion": county,
      "addressCountry": "GB"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": rangeCount,
      "itemListElement": ranges.slice(0, 10).map((range, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SportsActivityLocation",
          "name": range.name,
          "url": `https://findagolfrange.com/uk/${city.toLowerCase().replace(/\s+/g, '-')}/${range.slug}/`,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": city,
            "addressRegion": county,
            "addressCountry": "GB"
          },
          "sport": "Golf",
          "telephone": range.phone,
          "url": range.website
        }
      }))
    }
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://findagolfrange.com/uk/${city.toLowerCase().replace(/\s+/g, '-')}/`,
    "name": `${city} Golf Driving Ranges Directory`,
    "description": `Comprehensive directory of ${rangeCount} golf driving ranges in ${city}, ${county}`,
    "url": `https://findagolfrange.com/uk/${city.toLowerCase().replace(/\s+/g, '-')}/`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": county,
      "addressCountry": "GB"
    },
    "areaServed": {
      "@type": "Place",
      "name": city,
      "addressRegion": county,
      "addressCountry": "GB"
    },
    "knowsAbout": ranges.map(range => ({
      "@type": "SportsActivityLocation",
      "name": range.name,
      "sport": "Golf"
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema)
        }}
      />
    </>
  )
}