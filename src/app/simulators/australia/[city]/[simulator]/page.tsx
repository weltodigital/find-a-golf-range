import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AustralianSimulatorPage from '@/components/AustralianSimulatorPage'

interface PageProps {
  params: {
    city: string
    simulator: string
  }
}

// City center coordinates for major Australian cities
const getCityCoordinates = (city: string): [number, number] => {
  const cityCoords: { [key: string]: { latitude: number, longitude: number } } = {
    // Major Australian Cities
    sydney: { latitude: -33.8688, longitude: 151.2093 },
    melbourne: { latitude: -37.8136, longitude: 144.9631 },
    brisbane: { latitude: -27.4698, longitude: 153.0251 },
    perth: { latitude: -31.9505, longitude: 115.8605 },
    adelaide: { latitude: -34.9285, longitude: 138.6007 },
    'gold-coast': { latitude: -28.0167, longitude: 153.4000 },
    'goldcoast': { latitude: -28.0167, longitude: 153.4000 },
    newcastle: { latitude: -32.9283, longitude: 151.7817 },
    'newcastlemaitland': { latitude: -32.9283, longitude: 151.7817 },
    'newcastle–maitland': { latitude: -32.9283, longitude: 151.7817 },
    canberra: { latitude: -35.2809, longitude: 149.1300 },
    'sunshine-coast': { latitude: -26.6500, longitude: 153.0667 },
    'central-coast': { latitude: -33.4296, longitude: 151.3426 },
    wollongong: { latitude: -34.4278, longitude: 150.8931 },
    cairns: { latitude: -16.9186, longitude: 145.7781 },
    townsville: { latitude: -19.2590, longitude: 146.8169 },
    darwin: { latitude: -12.4634, longitude: 130.8456 },
    hobart: { latitude: -42.8821, longitude: 147.3272 },
    ballarat: { latitude: -37.5622, longitude: 143.8503 },
    geelong: { latitude: -38.1499, longitude: 144.3617 },
    'port-douglas': { latitude: -16.4839, longitude: 145.4652 },
    mackay: { latitude: -21.1550, longitude: 149.1861 },
    rockhampton: { latitude: -23.3781, longitude: 150.5136 },
    toowoomba: { latitude: -27.5598, longitude: 151.9507 },
    launceston: { latitude: -41.4332, longitude: 147.1441 },
    bendigo: { latitude: -36.7570, longitude: 144.2794 },
    'albury-wodonga': { latitude: -36.0737, longitude: 146.9135 },
    'alburywodonga': { latitude: -36.0737, longitude: 146.9135 },
    'albury–wodonga': { latitude: -36.0737, longitude: 146.9135 },
    shepparton: { latitude: -36.3800, longitude: 145.4013 },
    wagga: { latitude: -35.1082, longitude: 147.3598 },
    'wagga-wagga': { latitude: -35.1082, longitude: 147.3598 },
    bathurst: { latitude: -33.4194, longitude: 149.5806 },
    orange: { latitude: -33.2839, longitude: 149.0988 },
    tamworth: { latitude: -31.0927, longitude: 150.9279 },
    dubbo: { latitude: -32.2567, longitude: 148.6011 },
    'port-macquarie': { latitude: -31.4311, longitude: 152.9089 },
    lismore: { latitude: -28.8142, longitude: 153.2781 },
    'coffs-harbour': { latitude: -30.2963, longitude: 153.1215 },
    armidale: { latitude: -30.5120, longitude: 151.6669 },
    'byron-bay': { latitude: -28.6474, longitude: 153.6020 },
    ballina: { latitude: -28.8667, longitude: 153.5667 },
    nowra: { latitude: -34.8847, longitude: 150.5992 },
    penrith: { latitude: -33.7506, longitude: 150.6942 },
    'southern-highlands': { latitude: -34.4667, longitude: 150.4167 },
    'mornington-peninsula': { latitude: -38.3667, longitude: 145.0833 },
    bunbury: { latitude: -33.3267, longitude: 115.6372 },
    mandurah: { latitude: -32.5269, longitude: 115.7217 },
    geraldton: { latitude: -28.7774, longitude: 114.6140 },
    kalgoorlie: { latitude: -30.7467, longitude: 121.4648 },
    albany: { latitude: -35.0275, longitude: 117.8840 },
    karratha: { latitude: -20.7364, longitude: 116.8460 },
    'port-hedland': { latitude: -20.3100, longitude: 118.6070 },
    broome: { latitude: -17.9644, longitude: 122.2304 },
    newman: { latitude: -23.3578, longitude: 119.7372 },
    esperance: { latitude: -33.8615, longitude: 121.8914 },
    denmark: { latitude: -34.9581, longitude: 117.3519 },
    dawesville: { latitude: -32.6167, longitude: 115.6333 },
    warrnambool: { latitude: -38.3833, longitude: 142.4833 },
    horsham: { latitude: -36.7167, longitude: 142.1833 },
    mildura: { latitude: -34.1872, longitude: 142.1540 },
    'fraser-coast': { latitude: -25.2986, longitude: 152.8555 },
    gympie: { latitude: -26.1907, longitude: 152.6656 },
    'mount-isa': { latitude: -20.7256, longitude: 139.4927 },
    gladstone: { latitude: -23.8499, longitude: 151.2500 },
    bundaberg: { latitude: -24.8661, longitude: 152.3489 },
    hervey: { latitude: -25.2986, longitude: 152.8555 }, // Hervey Bay
    'hervey-bay': { latitude: -25.2986, longitude: 152.8555 },
    emerald: { latitude: -23.5253, longitude: 148.1614 },
    whitsundays: { latitude: -20.2781, longitude: 148.9706 },
    'forster-tuncurry': { latitude: -32.1833, longitude: 152.5167 },
    'forstertuncurry': { latitude: -32.1833, longitude: 152.5167 },
    katherine: { latitude: -14.4669, longitude: 132.2647 },
    'alice-springs': { latitude: -23.6980, longitude: 133.8807 },
    devonport: { latitude: -41.1789, longitude: 146.3540 },
    burnie: { latitude: -41.0545, longitude: 145.9160 },
    'barossa-valley': { latitude: -34.5597, longitude: 138.9344 },
    'mount-gambier': { latitude: -37.8283, longitude: 140.7831 },
    'victor-harbor': { latitude: -35.5522, longitude: 138.6189 },
    'murray-bridge': { latitude: -35.1194, longitude: 139.2739 },
    whyalla: { latitude: -33.0333, longitude: 137.5833 },
    'port-augusta': { latitude: -32.4956, longitude: 137.7647 },
    'port-lincoln': { latitude: -34.7236, longitude: 135.8581 },
    'port-pirie': { latitude: -33.1856, longitude: 138.0161 },
    ceduna: { latitude: -32.1306, longitude: 133.6764 },
    'broken-hill': { latitude: -31.9333, longitude: 141.4667 },
    traralgon: { latitude: -38.1958, longitude: 146.5406 },
    sale: { latitude: -38.1050, longitude: 147.0689 },
    bairnsdale: { latitude: -37.8275, longitude: 147.6169 },
    'lakes-entrance': { latitude: -37.8833, longitude: 147.9833 },
    warragul: { latitude: -38.1597, longitude: 145.9297 },
    wodonga: { latitude: -36.1217, longitude: 146.8850 },
    wangaratta: { latitude: -36.3581, longitude: 146.3178 },
    echuca: { latitude: -36.1406, longitude: 144.7500 },
    'swan-hill': { latitude: -35.3378, longitude: 143.5544 },
    moe: { latitude: -38.1750, longitude: 146.2583 },
    'latrobe-valley': { latitude: -38.1833, longitude: 146.4167 },
    morwell: { latitude: -38.2167, longitude: 146.4000 },
    torquay: { latitude: -38.3306, longitude: 144.3269 },
    colac: { latitude: -38.3381, longitude: 143.5850 },
    'apollo-bay': { latitude: -38.7581, longitude: 143.6672 },
    hamilton: { latitude: -37.7431, longitude: 142.0133 },
    castlemaine: { latitude: -37.0700, longitude: 144.2150 },
    daylesford: { latitude: -37.3467, longitude: 144.1397 },
    stawell: { latitude: -37.0533, longitude: 142.7833 },
    ararat: { latitude: -37.2833, longitude: 142.9333 },
    bordertown: { latitude: -36.3119, longitude: 140.7636 },
    millicent: { latitude: -37.5978, longitude: 140.3481 },
    naracoorte: { latitude: -36.9581, longitude: 140.7378 },
    bordertown: { latitude: -36.3119, longitude: 140.7636 },
    kingscote: { latitude: -35.6544, longitude: 137.6394 },
    bridport: { latitude: -41.0064, longitude: 147.3878 },
    scottsdale: { latitude: -41.1606, longitude: 147.5181 },
    st: { latitude: -41.2050, longitude: 147.2589 }, // St Helens
    'st-helens': { latitude: -41.2050, longitude: 147.2589 },
    ulverstone: { latitude: -41.1556, longitude: 146.1689 },
    penguin: { latitude: -41.1083, longitude: 146.0722 },
    queenstown: { latitude: -42.0858, longitude: 145.5486 },
    strahan: { latitude: -42.1550, longitude: 145.3286 },
    oatlands: { latitude: -42.2989, longitude: 147.3739 },
    'new-norfolk': { latitude: -42.7814, longitude: 147.0600 },
    richmond: { latitude: -42.7347, longitude: 147.4375 },
    sorell: { latitude: -42.7833, longitude: 147.5667 }
  }

  const normalizedCity = city.toLowerCase().replace(/\s+/g, '-')
  const coords = cityCoords[normalizedCity] || cityCoords[city.toLowerCase()] || { latitude: -33.8688, longitude: 151.2093 } // Default to Sydney
  return [coords.latitude, coords.longitude]
}

// Helper function to transform city names for database queries
const getCityNameFromSlug = (slug: string): string => {
  const decoded = decodeURIComponent(slug)

  // Handle special cases
  switch (decoded.toLowerCase()) {
    case 'newcastlemaitland':
      return 'Newcastle–Maitland'
    case 'alburywodonga':
      return 'Albury–Wodonga'
    case 'forster-tuncurry':
    case 'forstertuncurry':
      return 'Forster-Tuncurry'
    case 'goldcoast':
      return 'Gold Coast'
    case 'sunshinecoast':
      return 'Sunshine Coast'
    case 'centralcoast':
      return 'Central Coast'
    default:
      return decoded
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityName = getCityNameFromSlug(params.city)
  const simulatorSlug = decodeURIComponent(params.simulator)

  // Fetch simulator data for metadata
  const { data: simulatorData } = await supabase
    .from('golf_ranges')
    .select('name, description, city, county')
    .eq('city', cityName)
    .eq('slug', simulatorSlug)
    .contains('special_features', ['australia'])
    .single()

  if (!simulatorData) {
    return {
      title: 'Golf Simulator Not Found',
      description: 'The requested golf simulator could not be found.',
    }
  }

  const title = `${simulatorData.name} | Golf Simulator in ${cityName}, ${simulatorData.county}`
  const description = simulatorData.description ||
    `Experience premium golf simulation at ${simulatorData.name} in ${cityName}. Indoor golf simulators and practice facilities in ${simulatorData.county}, Australia.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_AU',
      siteName: 'Find A Golf Range'
    }
  }
}

export default async function AustralianSimulatorDetailPage({ params }: PageProps) {
  const cityName = getCityNameFromSlug(params.city)
  const simulatorSlug = decodeURIComponent(params.simulator)
  const cityCenterCoords = getCityCoordinates(params.city)

  // Quick check if simulator exists
  const { data: simulatorExists } = await supabase
    .from('golf_ranges')
    .select('id')
    .eq('city', cityName)
    .eq('slug', simulatorSlug)
    .contains('special_features', ['australia'])
    .single()

  if (!simulatorExists) {
    notFound()
  }

  return (
    <AustralianSimulatorPage
      slug={simulatorSlug}
      cityName={cityName}
      cityPath={`/simulators/australia/${params.city}`}
      cityCenterCoords={cityCenterCoords}
    />
  )
}