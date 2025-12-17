import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EnhancedSimulatorPage from '@/components/EnhancedSimulatorPage'

interface PageProps {
  params: {
    city: string
    simulator: string
  }
}

// City center coordinates
const getCityCoordinates = (city: string): [number, number] => {
  const cityCoords: { [key: string]: { latitude: number, longitude: number } } = {
    // Major UK Cities
    london: { latitude: 51.5074, longitude: -0.1278 },
    birmingham: { latitude: 52.4797, longitude: -1.9027 },
    manchester: { latitude: 53.4795, longitude: -2.2451 },
    glasgow: { latitude: 55.8642, longitude: -4.2518 },
    leeds: { latitude: 53.7974, longitude: -1.5438 },
    sheffield: { latitude: 53.3811, longitude: -1.4701 },
    edinburgh: { latitude: 55.9533, longitude: -3.1883 },
    liverpool: { latitude: 53.4072, longitude: -2.9917 },
    bristol: { latitude: 51.4538, longitude: -2.5973 },
    cardiff: { latitude: 51.4816, longitude: -3.1791 },
    newcastle: { latitude: 54.9738, longitude: -1.6132 },
    leicester: { latitude: 52.6369, longitude: -1.1398 },
    nottingham: { latitude: 52.9548, longitude: -1.1581 },
    coventry: { latitude: 52.4068, longitude: -1.5197 },
    belfast: { latitude: 54.5973, longitude: -5.9301 },
    bradford: { latitude: 53.7960, longitude: -1.7594 },
    stoke: { latitude: 53.0027, longitude: -2.1794 },
    wolverhampton: { latitude: 52.5862, longitude: -2.1282 },
    plymouth: { latitude: 50.3755, longitude: -4.1427 },
    derby: { latitude: 52.9225, longitude: -1.4746 },
    swansea: { latitude: 51.6214, longitude: -3.9436 },
    southampton: { latitude: 50.9097, longitude: -1.4044 },
    salford: { latitude: 53.4875, longitude: -2.2901 },
    aberdeen: { latitude: 57.1497, longitude: -2.0943 },
    westminster: { latitude: 51.4994, longitude: -0.1319 },
    portsmouth: { latitude: 50.8198, longitude: -1.0880 },
    york: { latitude: 53.9600, longitude: -1.0873 },
    peterborough: { latitude: 52.5695, longitude: -0.2405 },
    dundee: { latitude: 56.4620, longitude: -2.9707 },
    lancaster: { latitude: 54.0466, longitude: -2.8007 },
    oxford: { latitude: 51.7520, longitude: -1.2577 },
    cambridge: { latitude: 52.2053, longitude: 0.1218 },
    brighton: { latitude: 50.8225, longitude: -0.1372 },
    bournemouth: { latitude: 50.7192, longitude: -1.8808 },
    swindon: { latitude: 51.5557, longitude: -1.7797 },
    milton: { latitude: 52.0406, longitude: -0.7594 }, // Milton Keynes
    norwich: { latitude: 52.6309, longitude: 1.2974 },
    blackpool: { latitude: 53.8175, longitude: -3.0357 },
    reading: { latitude: 51.4543, longitude: -0.9781 },
    watford: { latitude: 51.6560, longitude: -0.3967 },
    basildon: { latitude: 51.5760, longitude: 0.4887 },
    enfield: { latitude: 51.6521, longitude: -0.0810 },
    stockport: { latitude: 53.4106, longitude: -2.1575 },
    gillingham: { latitude: 51.3887, longitude: 0.5458 },
    rotherham: { latitude: 53.4302, longitude: -1.3297 },
    dudley: { latitude: 52.5120, longitude: -2.0819 },
    // Add more cities as needed
    'milton-keynes': { latitude: 52.0406, longitude: -0.7594 },
    'southend-on-sea': { latitude: 51.5459, longitude: 0.7077 },
    'newcastle-upon-tyne': { latitude: 54.9783, longitude: -1.6178 },
    'stoke-on-trent': { latitude: 53.0027, longitude: -2.1794 }
  }

  const normalizedCity = city.toLowerCase().replace(/\s+/g, '-')
  const coords = cityCoords[normalizedCity] || cityCoords[city.toLowerCase()] || { latitude: 51.5074, longitude: -0.1278 } // Default to London
  return [coords.latitude, coords.longitude]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityName = decodeURIComponent(params.city)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  const simulatorSlug = decodeURIComponent(params.simulator)

  // Fetch simulator data for metadata
  const { data: simulatorData } = await supabase
    .from('golf_ranges')
    .select('name, description, city, county')
    .eq('city', cityName)
    .eq('slug', simulatorSlug)
    .contains('special_features', ['Indoor Simulator'])
    .single()

  if (!simulatorData) {
    return {
      title: 'Indoor Golf Simulator Not Found',
      description: 'The requested indoor golf simulator could not be found.',
    }
  }

  const title = `${simulatorData.name} | Indoor Golf Simulator in ${cityName}, ${simulatorData.county}`
  const description = simulatorData.description ||
    `Experience premium indoor golf simulation at ${simulatorData.name} in ${cityName}. Advanced TrackMan technology, virtual courses, and year-round practice in ${simulatorData.county}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_GB',
      siteName: 'Find A Golf Range'
    }
  }
}

export default async function SimulatorDetailPage({ params }: PageProps) {
  const cityName = decodeURIComponent(params.city)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  const simulatorSlug = decodeURIComponent(params.simulator)
  const cityCenterCoords = getCityCoordinates(params.city)

  // Quick check if simulator exists
  const { data: simulatorExists } = await supabase
    .from('golf_ranges')
    .select('id')
    .eq('slug', simulatorSlug)
    .contains('special_features', ['Indoor Simulator'])
    .single()

  if (!simulatorExists) {
    notFound()
  }

  return (
    <EnhancedSimulatorPage
      slug={simulatorSlug}
      cityName={cityName}
      cityPath={`/simulators/uk/${params.city}`}
      cityCenterCoords={cityCenterCoords}
    />
  )
}