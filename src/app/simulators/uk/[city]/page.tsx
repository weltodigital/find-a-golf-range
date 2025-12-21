'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SimulatorCard from '@/components/SimulatorCard'
import { IndoorSimulator } from '@/types'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/OpenStreetMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

interface PageProps {
  params: {
    city: string
  }
}

export default function SimulatorCityPage({ params }: PageProps) {
  const [simulators, setSimulators] = useState<IndoorSimulator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance')

  // Decode and format city name
  const cityName = decodeURIComponent(params.city)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Function to geocode an address with fallback strategies
  const geocodeAddress = async (address: string, city: string): Promise<{ lat: number, lng: number } | null> => {
    const headers = { 'User-Agent': 'FindAGolfRange/1.0' }

    // Strategy 1: Try full address
    try {
      const query = encodeURIComponent(`${address}, ${city}, UK`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=gb`, {
        headers
      })

      if (response.ok) {
        const results = await response.json()
        if (results && results.length > 0) {
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (full address):', error)
    }

    // Strategy 2: Extract street/road name and try again
    try {
      // Look for road/street names in the address
      const roadMatch = address.match(/([^,]*(?:Road|Rd|Street|St|Lane|Avenue|Ave|Drive|Dr|Close|Way|Hill))/i)
      if (roadMatch) {
        const streetName = roadMatch[1].trim()
        const query = encodeURIComponent(`${streetName}, ${city}, UK`)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=gb`, {
          headers
        })

        if (response.ok) {
          const results = await response.json()
          if (results && results.length > 0) {
            console.log(`Found coordinates using street name "${streetName}":`, results[0].lat, results[0].lon)
            return {
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            }
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (street name):', error)
    }

    // Strategy 3: Try just the city as fallback
    try {
      const query = encodeURIComponent(`${city}, UK`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=gb`, {
        headers
      })

      if (response.ok) {
        const results = await response.json()
        if (results && results.length > 0) {
          console.log(`Falling back to city center for "${address}"`)
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error (city fallback):', error)
    }

    return null
  }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // City center coordinates (this would ideally come from a database)
  const getCityCoordinates = (city: string) => {
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
      walsall: { latitude: 52.5859, longitude: -1.9829 },
      chatham: { latitude: 51.3788, longitude: 0.5264 },
      southend: { latitude: 51.5459, longitude: 0.7077 },
      sunderland: { latitude: 54.9069, longitude: -1.3838 },
      oldham: { latitude: 53.5409, longitude: -2.1183 },
      ipswich: { latitude: 52.0567, longitude: 1.1482 },
      middlesbrough: { latitude: 54.5742, longitude: -1.2351 },
      huddersfield: { latitude: 53.6458, longitude: -1.7850 },
      blackburn: { latitude: 53.7500, longitude: -2.4833 },
      preston: { latitude: 53.7632, longitude: -2.7031 },
      luton: { latitude: 51.8787, longitude: -0.4200 },
      exeter: { latitude: 50.7184, longitude: -3.5339 },
      wigan: { latitude: 53.5450, longitude: -2.6318 },
      gloucester: { latitude: 51.8642, longitude: -2.2381 },
      colchester: { latitude: 51.8959, longitude: 0.8919 },
      chester: { latitude: 53.1906, longitude: -2.8906 },
      tamworth: { latitude: 52.6336, longitude: -1.6910 },
      // Additional cities from verification
      andover: { latitude: 51.2081, longitude: -1.4957 },
      arbroath: { latitude: 56.5599, longitude: -2.5912 },
      ashtonunderlyne: { latitude: 53.4839, longitude: -2.0997 },
      atherstone: { latitude: 52.5896, longitude: -1.5448 },
      aylesbury: { latitude: 51.8153, longitude: -0.8084 },
      ayr: { latitude: 55.4583, longitude: -4.6293 },
      ballymoney: { latitude: 55.0746, longitude: -6.5147 },
      barnsley: { latitude: 53.5534, longitude: -1.4821 },
      basingstoke: { latitude: 51.2663, longitude: -1.0844 },
      bath: { latitude: 51.3751, longitude: -2.3697 },
      berkhamsted: { latitude: 51.7606, longitude: -0.5664 },
      bideford: { latitude: 51.0175, longitude: -4.2026 },
      billingham: { latitude: 54.6058, longitude: -1.2740 },
      birkenhead: { latitude: 53.3930, longitude: -3.0175 },
      blackwood: { latitude: 51.6695, longitude: -3.1906 },
      boston: { latitude: 52.9763, longitude: -0.0264 },
      bourneend: { latitude: 51.5732, longitude: -0.7071 },
      bridgend: { latitude: 51.5042, longitude: -3.5769 },
      bridgnorth: { latitude: 52.5365, longitude: -2.4175 },
      brighouse: { latitude: 53.7025, longitude: -1.7787 },
      bromsgrove: { latitude: 52.3357, longitude: -2.0619 },
      bude: { latitude: 50.8270, longitude: -4.5443 },
      buntingford: { latitude: 51.9449, longitude: -0.0132 },
      burgesshill: { latitude: 50.9576, longitude: -0.1282 },
      burnley: { latitude: 53.7896, longitude: -2.2448 },
      bury: { latitude: 53.5933, longitude: -2.2958 },
      burysaintedmunds: { latitude: 52.2467, longitude: 0.7056 },
      cannock: { latitude: 52.6906, longitude: -2.0301 },
      castleford: { latitude: 53.7255, longitude: -1.3540 },
      chichester: { latitude: 50.8365, longitude: -0.7792 },
      coatbridge: { latitude: 55.8619, longitude: -4.0176 },
      colne: { latitude: 53.8565, longitude: -2.1659 },
      conwy: { latitude: 53.2804, longitude: -3.8284 },
      craigavon: { latitude: 54.4472, longitude: -6.3820 },
      crymych: { latitude: 51.9780, longitude: -4.6416 },
      cwmbran: { latitude: 51.6544, longitude: -3.0208 },
      dalkeith: { latitude: 55.8925, longitude: -3.0671 },
      dartmouth: { latitude: 50.3515, longitude: -3.5798 },
      dewsbury: { latitude: 53.6906, longitude: -1.6338 },
      diss: { latitude: 52.3775, longitude: 1.1151 },
      dumfries: { latitude: 55.0711, longitude: -3.6051 },
      dungannon: { latitude: 54.5024, longitude: -6.7673 },
      durham: { latitude: 54.7761, longitude: -1.5733 },
      eastgrinstead: { latitude: 51.1268, longitude: -0.0089 },
      eastbourne: { latitude: 50.7684, longitude: 0.2903 },
      exmouth: { latitude: 50.6197, longitude: -3.4148 },
      falkirk: { latitude: 56.0018, longitude: -3.7839 },
      fleetwood: { latitude: 53.9248, longitude: -3.0138 },
      glastonbury: { latitude: 51.1459, longitude: -2.7142 },
      godstone: { latitude: 51.2514, longitude: -0.0447 },
      grimsby: { latitude: 53.5736, longitude: -0.0757 },
      hailsham: { latitude: 50.8647, longitude: 0.2559 },
      halifax: { latitude: 53.7218, longitude: -1.8618 },
      harpenden: { latitude: 51.8153, longitude: -0.3533 },
      hartlepool: { latitude: 54.6893, longitude: -1.2114 },
      heanor: { latitude: 53.0140, longitude: -1.3544 },
      hereford: { latitude: 52.0564, longitude: -2.7161 },
      highbridge: { latitude: 51.2154, longitude: -2.9804 },
      hinckley: { latitude: 52.5404, longitude: -1.3731 },
      holywood: { latitude: 54.6312, longitude: -5.8308 },
      inverkeithing: { latitude: 56.0293, longitude: -3.3928 },
      kingslynn: { latitude: 52.7548, longitude: 0.4040 },
      kingslangley: { latitude: 51.7137, longitude: -0.4408 },
      kingsbridge: { latitude: 50.2840, longitude: -3.7766 },
      largs: { latitude: 55.7922, longitude: -4.8694 },
      leeonthesolent: { latitude: 50.8097, longitude: -1.2038 },
      leightonbuzzard: { latitude: 51.9170, longitude: -0.6616 },
      leominster: { latitude: 52.2251, longitude: -2.7304 },
      letchworth: { latitude: 51.9781, longitude: -0.2280 },
      leyland: { latitude: 53.6917, longitude: -2.6953 },
      lincoln: { latitude: 53.2307, longitude: -0.5407 },
      livingston: { latitude: 55.8864, longitude: -3.5230 },
      loanhead: { latitude: 55.8736, longitude: -3.1611 },
      londonderry: { latitude: 54.9966, longitude: -7.3086 },
      maidenhead: { latitude: 51.5218, longitude: -0.7181 },
      maryport: { latitude: 54.7138, longitude: -3.4954 },
      miltonkeynes: { latitude: 52.0406, longitude: -0.7594 },
      nelson: { latitude: 53.8349, longitude: -2.2167 },
      newmalden: { latitude: 51.4025, longitude: -0.2558 },
      newark: { latitude: 53.0679, longitude: -0.8050 },
      newbury: { latitude: 51.4014, longitude: -1.3231 },
      newcastle: { latitude: 54.1810, longitude: -5.8906 },
      newcastleupontyne: { latitude: 54.9738, longitude: -1.6132 },
      newry: { latitude: 54.1751, longitude: -6.3402 },
      newtonabbot: { latitude: 50.5301, longitude: -3.6067 },
      newtonaycliffe: { latitude: 54.6154, longitude: -1.5757 },
      newtownards: { latitude: 54.5913, longitude: -5.6933 },
      northampton: { latitude: 52.2405, longitude: -0.9027 },
      oban: { latitude: 56.4129, longitude: -5.4711 },
      omagh: { latitude: 54.6011, longitude: -7.3078 },
      penarth: { latitude: 51.4368, longitude: -3.1693 },
      peterhead: { latitude: 57.5087, longitude: -1.7844 },
      poole: { latitude: 50.7150, longitude: -1.9872 },
      poultonlefylde: { latitude: 53.8470, longitude: -2.9930 },
      radlett: { latitude: 51.6850, longitude: -0.2736 },
      ramsgate: { latitude: 51.3356, longitude: 1.4172 },
      redditch: { latitude: 52.3063, longitude: -1.9367 },
      rhyl: { latitude: 53.3200, longitude: -3.4896 },
      ringwood: { latitude: 50.8415, longitude: -1.7792 },
      rochester: { latitude: 51.3882, longitude: 0.5040 },
      royston: { latitude: 52.0480, longitude: -0.0257 },
      rushden: { latitude: 52.2894, longitude: -0.6063 },
      sainthelens: { latitude: 53.4500, longitude: -2.7374 },
      southendonSea: { latitude: 51.5459, longitude: 0.7077 },
      stevenage: { latitude: 51.9020, longitude: -0.2023 },
      stirling: { latitude: 56.1165, longitude: -3.9369 },
      // London Boroughs
      barnet: { latitude: 51.6252, longitude: -0.1517 },
      croydon: { latitude: 51.3762, longitude: -0.0982 },
      bromley: { latitude: 51.4039, longitude: 0.0144 },
      redbridge: { latitude: 51.5590, longitude: 0.0741 },
      ealing: { latitude: 51.5130, longitude: -0.3089 },
      brent: { latitude: 51.5673, longitude: -0.2711 },
      wandsworth: { latitude: 51.4571, longitude: -0.1910 },
      lambeth: { latitude: 51.4570, longitude: -0.1086 },
      southwark: { latitude: 51.5035, longitude: -0.0804 },
      lewisham: { latitude: 51.4419, longitude: -0.0225 },
      greenwich: { latitude: 51.4934, longitude: 0.0098 },
      bexley: { latitude: 51.4415, longitude: 0.1426 },
      havering: { latitude: 51.5779, longitude: 0.1821 },
      hillingdon: { latitude: 51.5441, longitude: -0.4760 },
      harrow: { latitude: 51.5898, longitude: -0.3346 },
      newham: { latitude: 51.5077, longitude: 0.0469 },
      waltham: { latitude: 51.5908, longitude: -0.0134 },
      hounslow: { latitude: 51.4746, longitude: -0.3580 },
      richmond: { latitude: 51.4613, longitude: -0.3037 },
      merton: { latitude: 51.4098, longitude: -0.2108 },
      sutton: { latitude: 51.3618, longitude: -0.1945 },
      kingston: { latitude: 51.4120, longitude: -0.2987 },
      // Additional cities from your CSV
      ashford: { latitude: 51.1464, longitude: 0.8750 },
      canterbury: { latitude: 51.2802, longitude: 1.0789 },
      dartford: { latitude: 51.4470, longitude: 0.2188 },
      maidstone: { latitude: 51.2704, longitude: 0.5227 },
      tunbridge: { latitude: 51.1313, longitude: 0.2632 },
      st: { latitude: 50.4619, longitude: -4.9749 }, // St Austell
      harlow: { latitude: 51.7729, longitude: 0.1117 },
      chelmsford: { latitude: 51.7356, longitude: 0.4685 },
      brentwood: { latitude: 51.6208, longitude: 0.3063 },
      grays: { latitude: 51.4761, longitude: 0.3292 },
      cheshunt: { latitude: 51.7020, longitude: -0.0369 },
      hertford: { latitude: 51.7963, longitude: -0.0781 },
      welwyn: { latitude: 51.8279, longitude: -0.2019 },
      hitchin: { latitude: 51.9490, longitude: -0.2806 },
      bishops: { latitude: 51.8648, longitude: 0.2184 }, // Bishops Stortford
      high: { latitude: 51.7552, longitude: -0.0449 }, // High Wycombe
      slough: { latitude: 51.5105, longitude: -0.5950 },
      windsor: { latitude: 51.4816, longitude: -0.6044 },
      bracknell: { latitude: 51.4164, longitude: -0.7536 },
      woking: { latitude: 51.3168, longitude: -0.5591 },
      guildford: { latitude: 51.2362, longitude: -0.5704 },
      epsom: { latitude: 51.3360, longitude: -0.2697 },
      dorking: { latitude: 51.2342, longitude: -0.3331 },
      reigate: { latitude: 51.2395, longitude: -0.2036 },
      crawley: { latitude: 51.1080, longitude: -0.1869 },
      horsham: { latitude: 51.0628, longitude: -0.3258 },
      east: { latitude: 50.7687, longitude: 0.2773 }, // East Grinstead
      worthing: { latitude: 50.8154, longitude: -0.3728 },
      hastings: { latitude: 50.8550, longitude: 0.5736 },
      folkestone: { latitude: 51.0814, longitude: 1.1696 },
      dover: { latitude: 51.1279, longitude: 1.3134 },
      margate: { latitude: 51.3813, longitude: 1.3862 },
      // Additional missing cities
      abingdon: { latitude: 51.6721, longitude: -1.2833 },
      bridgeworks: { latitude: 51.8261, longitude: 0.1889 },
      walthamcross: { latitude: 51.6869, longitude: -0.0333 },
      sandown: { latitude: 50.6519, longitude: -1.1581 },
      tring: { latitude: 51.7936, longitude: -0.6610 },
      westerham: { latitude: 51.2656, longitude: 0.0752 },
      totnes: { latitude: 50.4306, longitude: -3.6858 },
      westbury: { latitude: 51.2607, longitude: -2.1889 },
      weymouth: { latitude: 50.6133, longitude: -2.4558 },
      shrewsbury: { latitude: 52.7069, longitude: -2.7535 },
      stafford: { latitude: 52.8067, longitude: -2.1158 },
      stone: { latitude: 52.9026, longitude: -2.1569 },
      stratforduponavon: { latitude: 52.1919, longitude: -1.7080 },
      telford: { latitude: 52.6769, longitude: -2.4447 },
      warminster: { latitude: 51.2043, longitude: -2.1787 },
      stowmarket: { latitude: 52.1889, longitude: 0.9953 },
      wymondham: { latitude: 52.5696, longitude: 1.1176 },
      altrincham: { latitude: 53.3874, longitude: -2.3523 },
      settle: { latitude: 54.0689, longitude: -2.2844 },
      skelmersdale: { latitude: 53.5510, longitude: -2.7707 },
      skipton: { latitude: 53.9635, longitude: -2.0177 },
      warrington: { latitude: 53.3900, longitude: -2.5970 },
      wirral: { latitude: 53.3727, longitude: -3.0738 },
      scarborough: { latitude: 54.2797, longitude: -0.3986 },
      washington: { latitude: 54.8998, longitude: -1.5197 },
      // More cities can be added as needed
    }

    const normalized = city.toLowerCase()

    // Handle special cases first
    if (normalized.includes('milton keynes')) return cityCoords['miltonkeynes']
    if (normalized.includes('waltham forest')) return cityCoords['waltham']
    if (normalized.includes('bishops stortford')) return cityCoords['bishops']
    if (normalized.includes('high wycombe')) return cityCoords['high']
    if (normalized.includes('east grinstead')) return cityCoords['eastgrinstead']
    if (normalized.includes('st austell')) return cityCoords['st']
    if (normalized.includes('tunbridge wells')) return cityCoords['tunbridge']
    if (normalized.includes('southend on sea')) return cityCoords['southendonSea']
    if (normalized.includes('lee on the solent')) return cityCoords['leeonthesolent']
    if (normalized.includes('ashton under lyne')) return cityCoords['ashtonunderlyne']
    if (normalized.includes('bourne end')) return cityCoords['bourneend']
    if (normalized.includes('burgess hill')) return cityCoords['burgesshill']
    if (normalized.includes('bury saint edmunds')) return cityCoords['burysaintedmunds']
    if (normalized.includes('newcastle upon tyne')) return cityCoords['newcastleupontyne']
    if (normalized.includes('poulton le fylde')) return cityCoords['poultonlefylde']
    if (normalized.includes('saint helens')) return cityCoords['sainthelens']
    if (normalized.includes('kings lynn')) return cityCoords['kingslynn']
    if (normalized.includes('kings langley')) return cityCoords['kingslangley']
    if (normalized.includes('new malden')) return cityCoords['newmalden']
    if (normalized.includes('newton abbot')) return cityCoords['newtonabbot']
    if (normalized.includes('newton aycliffe')) return cityCoords['newtonaycliffe']
    if (normalized.includes('leighton buzzard')) return cityCoords['leightonbuzzard']
    if (normalized.includes('waltham cross')) return cityCoords['walthamcross']
    if (normalized.includes('stoke on trent')) return cityCoords['stoke']
    if (normalized.includes('stratford upon avon')) return cityCoords['stratforduponavon']
    if (normalized.includes('letchworth garden city')) return cityCoords['letchworth']

    // Remove spaces and special characters for direct lookup
    const simpleNormalized = normalized.replace(/[\s\-']/g, '').toLowerCase()

    return cityCoords[simpleNormalized] || cityCoords[normalized] || { latitude: 51.5074, longitude: -0.1278 } // Default to London if not found
  }

  useEffect(() => {
    const loadSimulators = async () => {
      try {
        setLoading(true)

        // Get city center coordinates
        const cityCenter = getCityCoordinates(cityName)

        // Query golf_ranges table for simulators in this city
        let simulatorData, error;

        // Try the exact city name first
        const result1 = await supabase
          .from('golf_ranges')
          .select('*')
          .eq('city', cityName)
          .contains('special_features', ['Indoor Simulator'])
          .order('name')

        simulatorData = result1.data;
        error = result1.error;

        // If no results and the city name could have apostrophes, try with apostrophes
        if ((!simulatorData || simulatorData.length === 0) && !error) {
          // Handle common apostrophe cases
          let apostropheVariation = null;
          if (cityName === 'Kings Lynn') {
            apostropheVariation = "King's Lynn";
          } else if (cityName === 'Letchworth Garden City') {
            apostropheVariation = 'Letchworth';
          }
          // Add more apostrophe cases here if needed in the future

          if (apostropheVariation) {
            console.log(`Trying apostrophe variation: "${apostropheVariation}"`);
            const result2 = await supabase
              .from('golf_ranges')
              .select('*')
              .eq('city', apostropheVariation)
              .contains('special_features', ['Indoor Simulator'])
              .order('name')

            if (result2.data && result2.data.length > 0) {
              simulatorData = result2.data;
              error = result2.error;
            }
          }
        }

        if (error) {
          console.error('Error fetching simulators:', error)
          setError(error.message)
          return
        }

        if (!simulatorData || simulatorData.length === 0) {
          notFound()
          return
        }

        // Transform the database data and geocode missing coordinates
        const transformedSimulators: IndoorSimulator[] = await Promise.all(
          simulatorData.map(async (simulator, index) => {
            let lat = simulator.latitude
            let lng = simulator.longitude
            let distance: number | null = null

            // If coordinates are missing, geocode the address
            if (!lat || !lng) {
              console.log(`Geocoding address for ${simulator.name}: ${simulator.address}`)
              const coords = await geocodeAddress(simulator.address, simulator.city)
              if (coords) {
                lat = coords.lat
                lng = coords.lng
                // Optionally update the database with the new coordinates
                try {
                  await supabase
                    .from('golf_ranges')
                    .update({ latitude: lat, longitude: lng })
                    .eq('id', simulator.id)
                } catch (updateError) {
                  console.warn(`Failed to update coordinates for ${simulator.name}:`, updateError)
                }
              }
            }

            // Calculate distance if we have coordinates
            if (lat && lng) {
              distance = Math.round(calculateDistance(
                cityCenter.latitude,
                cityCenter.longitude,
                lat,
                lng
              ) * 10) / 10
            }

            return {
              id: simulator.id,
              name: simulator.name,
              slug: simulator.slug,
              description: simulator.description,
              detailed_description: simulator.detailed_description,
              address: simulator.address,
              city: simulator.city,
              county: simulator.county,
              postcode: simulator.postcode,
              phone: simulator.phone || '',
              email: simulator.email || '',
              website: simulator.website || '',
              latitude: lat,
              longitude: lng,
              num_simulators: simulator.num_bays || 1,
              simulator_brand: simulator.simulator_brand || '',
              facilities: simulator.facilities || [],
              pricing: simulator.prices ? Object.values(simulator.prices)[0] as string : '',
              opening_hours: simulator.opening_hours,
              images: simulator.images || [],
              distance: distance
            }
          })
        )

        setSimulators(transformedSimulators)
        setLoading(false)
      } catch (error) {
        console.error('Error loading simulators:', error)
        setError('Failed to load simulators')
        setLoading(false)
      }
    }

    loadSimulators()
  }, [cityName])

  const sortedSimulators = [...simulators].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'distance':
        return (a.distance || 0) - (b.distance || 0)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading {cityName} simulators...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const hasSimulators = simulators.length > 0
  const validDistances = simulators.filter(s => s.distance !== null).map(s => s.distance as number)
  const maxSimulatorDistance = validDistances.length > 0 ? Math.max(...validDistances) : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumbs */}
        <section className="bg-gray-50 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="text-primary hover:text-green-600">Home</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href="/simulators" className="text-primary hover:text-green-600">Simulators</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href="/simulators/uk" className="text-primary hover:text-green-600">UK</Link></li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-700">{cityName}</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Best Indoor Golf Simulators in {cityName}
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Discover {cityName}'s finest indoor golf simulators for your year-round golf practice. Compare prices, technology, and locations from {cityName} city center across {simulators.length} premium golf simulator venues throughout {cityName} and the surrounding area.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🎯 TrackMan Technology</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🏌️ Year-Round Practice</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">📊 Detailed Analytics</span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm">🌍 World Famous Courses</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {simulators.length}
                </div>
                <div className="text-sm text-gray-600">Indoor Simulators</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {simulators.length}
                </div>
                <div className="text-sm text-gray-600">Venues Available</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {Math.ceil(maxSimulatorDistance)}
                </div>
                <div className="text-sm text-gray-600">Mile Radius</div>
              </div>
            </div>
          </div>
        </section>


        {/* Simulators List */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All {cityName} Simulators</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedSimulators.map((simulator, index) => (
                <SimulatorCard key={simulator.id} simulator={simulator} distanceFrom={cityName} />
              ))}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Simulator Locations in {cityName}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Map showing all indoor golf simulator venues across {cityName}.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-full h-96">
                <OpenStreetMap
                  markers={sortedSimulators
                    .filter(sim => sim.latitude && sim.longitude)
                    .map(sim => ({
                      id: sim.id.toString(),
                      name: sim.name,
                      latitude: sim.latitude || 0,
                      longitude: sim.longitude || 0,
                      description: sim.description || '',
                      address: `${sim.address}, ${sim.city}`,
                      distance: sim.distance,
                      link: `/simulators/uk/${params.city}/${sim.slug}`
                    }))}
                  center={getCityCoordinates(cityName)}
                  zoom={12}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        {hasSimulators && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-8">

                {/* Main Content */}
                <div className="bg-white rounded-lg p-8 shadow-sm border">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Indoor Golf Simulators in {cityName}</h2>

                  <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                      Experience year-round golf practice with {cityName}'s premier indoor golf simulators. Our comprehensive directory features {simulators.length} carefully selected simulator venues across {cityName}, each offering cutting-edge technology and professional-grade facilities for golfers of all skill levels.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Indoor Golf Simulators in {cityName}?</h3>

                    <p>
                      {cityName}'s indoor golf simulators combine state-of-the-art technology with comfortable, climate-controlled environments. From TrackMan and GCQuad launch monitors to SkyTrak and Full Swing systems, these facilities offer real-time ball flight data, swing analysis, and access to world-famous courses. Whether you're practicing your drive or playing virtual rounds at St. Andrews, {cityName}'s simulators provide unmatched accuracy and entertainment.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Popular Simulator Venues in {cityName}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Professional Technology</h4>
                        <p className="text-gray-600">
                          {cityName}'s simulator venues feature premium technology including TrackMan Range, GC Quad systems, and high-speed cameras for detailed swing analysis and accurate ball tracking.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Year-Round Practice</h4>
                        <p className="text-gray-600">
                          Climate-controlled environments ensure comfortable practice sessions regardless of weather, making these simulators perfect for consistent improvement throughout the year.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Famous Course Play</h4>
                        <p className="text-gray-600">
                          Play virtual rounds on world-renowned courses including Pebble Beach, Torrey Pines, and Royal St. George's from the comfort of {cityName}.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3">Professional Coaching</h4>
                        <p className="text-gray-600">
                          Many {cityName} simulator venues offer PGA-qualified instruction with instant video feedback and detailed performance analytics to accelerate your improvement.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Golf Simulator Technology in {cityName}</h3>

                    <p>
                      {cityName}'s indoor golf simulators utilize the latest technology to provide accurate ball flight simulation and comprehensive swing analysis. Most venues feature high-speed cameras, advanced sensors, and premium projector systems that create immersive experiences. Popular technologies include TrackMan 4, GCQuad, SkyTrak, and Foresight Sports systems, each offering unique features for practice and play.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Facilities and Amenities</h3>

                    <p>
                      Beyond simulator technology, most venues in {cityName} offer comprehensive facilities including climate control, comfortable seating areas, food and beverage service, and equipment rental. Many simulators are part of larger golf complexes with additional amenities like putting greens, pro shops, and group event spaces perfect for corporate outings or social golf experiences.
                    </p>

                    <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Location and Accessibility</h3>

                    <p>
                      {cityName}'s indoor golf simulators are conveniently located throughout the area, making professional-grade golf practice accessible year-round. Most facilities offer excellent parking and are easily accessible by public transport, ensuring you can maintain your golf schedule regardless of season or weather conditions.
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                      <h4 className="font-bold text-green-900 mb-3">Booking Your Simulator Session</h4>
                      <ul className="text-green-800 space-y-2">
                        <li>• Most venues offer online booking for convenient scheduling</li>
                        <li>• Hourly rates available with packages for regular players</li>
                        <li>• Group bookings and corporate events welcomed</li>
                        <li>• Equipment provided or bring your own clubs</li>
                        <li>• Professional lessons available with certified instructors</li>
                        <li>• Practice modes and course play options available</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-gray-50 rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About {cityName} Golf Simulators</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">What is the best golf simulator in {cityName}?</h3>
                      <p className="text-gray-600">
                        The best simulator depends on your needs. For accuracy, look for TrackMan or GCQuad systems. For entertainment, choose venues with course play options. For instruction, select facilities with PGA-qualified professionals and video analysis capabilities.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">How much does it cost to use a golf simulator in {cityName}?</h3>
                      <p className="text-gray-600">
                        Simulator prices vary by venue and technology. Most facilities offer competitive hourly rates with packages available for regular users. Contact individual venues for current pricing and membership options.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Do {cityName} golf simulators offer lessons?</h3>
                      <p className="text-gray-600">
                        Yes, many simulator venues in {cityName} offer professional golf instruction using advanced technology for swing analysis and immediate feedback. Lessons range from beginner introductions to advanced technique refinement.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Can I play famous golf courses on simulators in {cityName}?</h3>
                      <p className="text-gray-600">
                        Absolutely! Most advanced simulators feature libraries of world-famous courses including Pebble Beach, St. Andrews, Torrey Pines, and many others. You can experience championship courses from the comfort of indoor facilities in {cityName}.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Are golf simulators suitable for beginners?</h3>
                      <p className="text-gray-600">
                        Yes! Golf simulators are excellent for beginners as they provide immediate feedback, allow practice in comfortable conditions, and many venues offer beginner-friendly instruction programs with patient, qualified professionals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Back to Simulators Page Button */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/simulators/uk"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All UK Simulators
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}