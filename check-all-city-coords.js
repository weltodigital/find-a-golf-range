const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// This is the current cityCoords object from the frontend
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
  miltonkeynes: { latitude: 52.0406, longitude: -0.7594 },
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
  southendonSea: { latitude: 51.5459, longitude: 0.7077 },
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
  // All the additional cities we've added
  abingdon: { latitude: 51.6721, longitude: -1.2589 },
  altrincham: { latitude: 53.3874, longitude: -2.3523 },
  andover: { latitude: 51.2116, longitude: -1.4949 },
  arbroath: { latitude: 56.5561, longitude: -2.5944 },
  ashtonunderlyne: { latitude: 53.4839, longitude: -2.0997 },
  atherstone: { latitude: 52.5827, longitude: -1.5536 },
  aylesbury: { latitude: 51.8164, longitude: -0.8098 },
  ayr: { latitude: 55.4584, longitude: -4.6293 },
  ballymoney: { latitude: 55.0678, longitude: -6.5158 },
  barnsley: { latitude: 53.5526, longitude: -1.4797 },
  basingstoke: { latitude: 51.2663, longitude: -1.0872 },
  bath: { latitude: 51.3751, longitude: -2.3674 },
  berkhamsted: { latitude: 51.7622, longitude: -0.5634 },
  bideford: { latitude: 50.9809, longitude: -4.3847 },
  billingham: { latitude: 54.5854, longitude: -1.2881 },
  birkenhead: { latitude: 53.3931, longitude: -3.0202 },
  blackwood: { latitude: 51.6698, longitude: -3.1920 },
  boston: { latitude: 52.9758, longitude: -0.0266 },
  bourneend: { latitude: 51.5732, longitude: -0.7071 },
  bridgend: { latitude: 51.5043, longitude: -3.5769 },
  bridgeworks: { latitude: 51.8261, longitude: 0.1889 },
  bridgnorth: { latitude: 52.5398, longitude: -2.4184 },
  brighouse: { latitude: 53.7007, longitude: -1.7842 },
  bromsgrove: { latitude: 52.3325, longitude: -2.0621 },
  bude: { latitude: 50.8267, longitude: -4.5434 },
  buntingford: { latitude: 51.9414, longitude: -0.0187 },
  burgesshill: { latitude: 50.9568, longitude: -0.1458 },
  burnley: { latitude: 53.7896, longitude: -2.2410 },
  bury: { latitude: 53.5933, longitude: -2.2958 },
  burysaintedmunds: { latitude: 52.2472, longitude: 0.7240 },
  cannock: { latitude: 52.6908, longitude: -2.0318 },
  castleford: { latitude: 53.7255, longitude: -1.3553 },
  chelmsford: { latitude: 51.7356, longitude: 0.4685 },
  chichester: { latitude: 50.8365, longitude: -0.7792 },
  coatbridge: { latitude: 55.8618, longitude: -4.0175 },
  colne: { latitude: 53.8562, longitude: -2.1660 },
  conwy: { latitude: 53.2789, longitude: -3.8241 },
  craigavon: { latitude: 54.4571, longitude: -6.3560 },
  crymych: { latitude: 51.9780, longitude: -4.6416 },
  cwmbran: { latitude: 51.6544, longitude: -3.0196 },
  dalkeith: { latitude: 55.8925, longitude: -3.0711 },
  dartmouth: { latitude: 50.3520, longitude: -3.5794 },
  dewsbury: { latitude: 53.6900, longitude: -1.6301 },
  diss: { latitude: 52.3776, longitude: 1.1172 },
  dumfries: { latitude: 55.0711, longitude: -3.6112 },
  dungannon: { latitude: 54.5041, longitude: -6.7699 },
  durham: { latitude: 54.7761, longitude: -1.5733 },
  eastgrinstead: { latitude: 50.7687, longitude: 0.2773 },
  eastbourne: { latitude: 50.7687, longitude: 0.2773 },
  exmouth: { latitude: 50.6191, longitude: -3.4147 },
  falkirk: { latitude: 56.0014, longitude: -3.7930 },
  fleetwood: { latitude: 53.9246, longitude: -3.0138 },
  glastonbury: { latitude: 51.1489, longitude: -2.7133 },
  godstone: { latitude: 51.2514, longitude: -0.0447 },
  grimsby: { latitude: 53.5668, longitude: -0.0762 },
  hailsham: { latitude: 50.8647, longitude: 0.2594 },
  halifax: { latitude: 53.7218, longitude: -1.8637 },
  harlow: { latitude: 51.7729, longitude: 0.1117 },
  harpenden: { latitude: 51.8154, longitude: -0.3553 },
  hartlepool: { latitude: 54.6896, longitude: -1.2344 },
  heanor: { latitude: 53.0140, longitude: -1.3544 },
  hereford: { latitude: 52.0567, longitude: -2.7157 },
  highbridge: { latitude: 51.2179, longitude: -2.9770 },
  hinckley: { latitude: 52.5402, longitude: -1.3734 },
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
  nelson: { latitude: 53.8349, longitude: -2.2167 },
  newmalden: { latitude: 51.4025, longitude: -0.2558 },
  newark: { latitude: 53.0679, longitude: -0.8050 },
  newbury: { latitude: 51.4014, longitude: -1.3231 },
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
  ashford: { latitude: 51.1464, longitude: 0.8750 },
  canterbury: { latitude: 51.2802, longitude: 1.0789 },
  dartford: { latitude: 51.4470, longitude: 0.2188 },
  maidstone: { latitude: 51.2704, longitude: 0.5227 },
  tunbridge: { latitude: 51.1313, longitude: 0.2632 },
  st: { latitude: 50.4619, longitude: -4.9749 },
  cheshunt: { latitude: 51.7020, longitude: -0.0369 },
  hertford: { latitude: 51.7963, longitude: -0.0781 },
  welwyn: { latitude: 51.8279, longitude: -0.2019 },
  hitchin: { latitude: 51.9490, longitude: -0.2806 },
  letchworthgardencity: { latitude: 51.9781, longitude: -0.2280 },
  bishops: { latitude: 51.8648, longitude: 0.2184 },
  high: { latitude: 51.7552, longitude: -0.0449 },
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
  margate: { latitude: 51.3813, longitude: 1.3862 }
};

function normalizeForComparison(cityName) {
  return cityName.toLowerCase()
    .replace(/[\s\-']/g, '')
    .replace(/upon/g, '')
    .replace(/under/g, '')
    .replace(/on/g, '')
    .replace(/the/g, '')
    .replace(/le/g, '')
    .replace(/saint/g, '')
    .replace(/garden/g, '')
    .replace(/city/g, '');
}

async function checkAllCityCoords() {
  console.log('🔍 CHECKING ALL SIMULATOR CITIES FOR MISSING COORDINATES');
  console.log('='.repeat(70));

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
    console.log(`📊 Checking ${uniqueCities.length} unique cities with simulators:\n`);

    let foundCities = [];
    let missingCities = [];

    for (const cityName of uniqueCities) {
      const normalized = normalizeForComparison(cityName);

      console.log(`🔍 Checking: ${cityName}`);
      console.log(`   Normalized: ${normalized}`);

      let found = false;
      let matchedKey = null;

      // Check all keys in cityCoords
      for (const key of Object.keys(cityCoords)) {
        const keyNormalized = normalizeForComparison(key);
        if (keyNormalized === normalized) {
          found = true;
          matchedKey = key;
          break;
        }
      }

      if (found) {
        foundCities.push(cityName);
        console.log(`   ✅ Found match: ${matchedKey}`);
      } else {
        missingCities.push(cityName);
        console.log(`   ❌ NO MATCH FOUND - will default to London!`);
      }
      console.log('');
    }

    console.log(`\n📊 RESULTS SUMMARY:`);
    console.log(`Total cities: ${uniqueCities.length}`);
    console.log(`✅ Cities with coordinates: ${foundCities.length}`);
    console.log(`❌ Cities missing coordinates: ${missingCities.length}`);

    if (missingCities.length > 0) {
      console.log(`\n🚨 CITIES THAT WILL DEFAULT TO LONDON:`);
      missingCities.forEach((city, index) => {
        console.log(`   ${index + 1}. ${city}`);
      });

      console.log(`\n🔧 FIXES NEEDED:`);
      console.log(`These cities need to be added to the cityCoords object in:`);
      console.log(`src/app/simulators/uk/[city]/page.tsx`);
    } else {
      console.log(`\n🎉 ALL CITIES HAVE COORDINATES! No fixes needed.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllCityCoords();