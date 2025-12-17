import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all unique cities
    const { data: cities, error: citiesError } = await supabase
      .from('golf_ranges')
      .select('city, county')
      .not('city', 'is', null)

    // Get all individual ranges
    const { data: ranges, error: rangesError } = await supabase
      .from('golf_ranges')
      .select('name, city')
      .not('name', 'is', null)

    // Get all simulators with cities and individual venues
    const { data: simulators, error: simulatorsError } = await supabase
      .from('golf_ranges')
      .select('name, city, slug')
      .contains('special_features', ['Indoor Simulator'])
      .not('name', 'is', null)
      .not('city', 'is', null)

    if (citiesError || rangesError || simulatorsError) {
      console.error('Error fetching data:', citiesError || rangesError || simulatorsError)
      throw new Error('Failed to fetch data for sitemap')
    }

    // Get unique cities
    const uniqueCities = Array.from(
      new Set(cities?.map(item => item.city?.toLowerCase()) || [])
    ).filter(Boolean)

    // Get unique simulator cities
    const uniqueSimulatorCities = Array.from(
      new Set(simulators?.map(item => item.city?.toLowerCase().replace(/\s+/g, '-')) || [])
    ).filter(Boolean)

    const baseUrl = 'https://findagolfrange.com'
    const currentDate = new Date().toISOString().split('T')[0]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/uk</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/simulators</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/simulators/uk</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/australia</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`

    // Add city pages
    uniqueCities.forEach(city => {
      xml += `
  <url>
    <loc>${baseUrl}/uk/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    // Add simulator city pages
    uniqueSimulatorCities.forEach(city => {
      xml += `
  <url>
    <loc>${baseUrl}/simulators/uk/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    // Add individual range pages
    ranges?.forEach(range => {
      if (range.name && range.city) {
        const rangeName = range.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        const cityName = range.city.toLowerCase()

        xml += `
  <url>
    <loc>${baseUrl}/uk/${cityName}/${rangeName}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    })

    // Add individual simulator venue pages
    simulators?.forEach(simulator => {
      if (simulator.name && simulator.city && simulator.slug) {
        const citySlug = simulator.city.toLowerCase().replace(/\s+/g, '-')

        xml += `
  <url>
    <loc>${baseUrl}/simulators/uk/${citySlug}/${simulator.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    })

    xml += `
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}