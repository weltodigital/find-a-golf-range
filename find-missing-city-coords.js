const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Copy the city coordinates from the frontend code
const cityCoords = {
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
  milton: { latitude: 52.0406, longitude: -0.7594 },
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
  ashford: { latitude: 51.1464, longitude: 0.8750 },
  canterbury: { latitude: 51.2802, longitude: 1.0789 },
  dartford: { latitude: 51.4470, longitude: 0.2188 },
  maidstone: { latitude: 51.2704, longitude: 0.5227 },
  tunbridge: { latitude: 51.1313, longitude: 0.2632 },
  st: { latitude: 50.4619, longitude: -4.9749 },
  harlow: { latitude: 51.7729, longitude: 0.1117 },
  chelmsford: { latitude: 51.7356, longitude: 0.4685 },
  brentwood: { latitude: 51.6208, longitude: 0.3063 },
  grays: { latitude: 51.4761, longitude: 0.3292 },
  cheshunt: { latitude: 51.7020, longitude: -0.0369 },
  hertford: { latitude: 51.7963, longitude: -0.0781 },
  welwyn: { latitude: 51.8279, longitude: -0.2019 },
  stevenage: { latitude: 51.9020, longitude: -0.2023 },
  hitchin: { latitude: 51.9490, longitude: -0.2806 },
  letchworth: { latitude: 51.9781, longitude: -0.2280 },
  bishops: { latitude: 51.8648, longitude: 0.2184 },
  high: { latitude: 51.7552, longitude: -0.0449 },
  maidenhead: { latitude: 51.5218, longitude: -0.7181 },
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
  east: { latitude: 50.7687, longitude: 0.2773 },
  worthing: { latitude: 50.8154, longitude: -0.3728 },
  hastings: { latitude: 50.8550, longitude: 0.5736 },
  folkestone: { latitude: 51.0814, longitude: 1.1696 },
  dover: { latitude: 51.1279, longitude: 1.3134 },
  margate: { latitude: 51.3813, longitude: 1.3862 },
  ramsgate: { latitude: 51.3356, longitude: 1.4172 }
};

async function findMissingCityCoords() {
  console.log('🔍 FINDING CITIES MISSING FROM COORDINATES LIST');
  console.log('='.repeat(60));

  try {
    // Get all unique cities with simulators
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('city')
      .contains('special_features', ['Indoor Simulator']);

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    const uniqueCities = [...new Set(venues.map(v => v.city))].sort();
    console.log(`📊 Found ${uniqueCities.length} unique cities with simulators:\n`);

    let missingCities = [];
    let foundCities = [];

    uniqueCities.forEach(cityName => {
      const normalized = cityName.toLowerCase();

      // Check if city exists in coordinates object
      let hasCoordinates = false;

      if (cityCoords[normalized]) {
        hasCoordinates = true;
      } else if (normalized.includes('milton keynes') && cityCoords['milton']) {
        hasCoordinates = true;
      } else if (normalized.includes('waltham forest') && cityCoords['waltham']) {
        hasCoordinates = true;
      } else if (normalized.includes('bishops stortford') && cityCoords['bishops']) {
        hasCoordinates = true;
      } else if (normalized.includes('high wycombe') && cityCoords['high']) {
        hasCoordinates = true;
      } else if (normalized.includes('east grinstead') && cityCoords['east']) {
        hasCoordinates = true;
      } else if (normalized.includes('st austell') && cityCoords['st']) {
        hasCoordinates = true;
      } else if (normalized.includes('tunbridge wells') && cityCoords['tunbridge']) {
        hasCoordinates = true;
      }

      if (hasCoordinates) {
        foundCities.push(cityName);
        console.log(`✅ ${cityName}`);
      } else {
        missingCities.push(cityName);
        console.log(`❌ ${cityName} - MISSING COORDINATES`);
      }
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`Cities with coordinates: ${foundCities.length}`);
    console.log(`Cities missing coordinates: ${missingCities.length}`);

    if (missingCities.length > 0) {
      console.log(`\n🚨 MISSING CITIES (will default to London):`);
      missingCities.forEach(city => {
        console.log(`   • ${city}`);
      });

      console.log(`\n🔧 REQUIRED FIXES:`);
      console.log(`Add these cities to the cityCoords object in:`);
      console.log(`src/app/simulators/uk/[city]/page.tsx`);

      console.log(`\nSuggested additions:`);
      for (const city of missingCities) {
        const normalized = city.toLowerCase().replace(/\s+/g, '');
        console.log(`${normalized}: { latitude: XX.XXXX, longitude: -X.XXXX },`);
      }
    } else {
      console.log(`\n✅ All cities have coordinates! No fixes needed.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findMissingCityCoords();