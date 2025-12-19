const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCityPages() {
  console.log('Testing city pages for simulator counts...\n');

  // Get all cities with simulators
  const { data: cities, error } = await supabase
    .from('golf_ranges')
    .select('city')
    .contains('special_features', ['Indoor Simulator']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueCities = [...new Set(cities.map(item => item.city))].sort();
  console.log(`Found ${uniqueCities.length} cities with simulators in database\n`);

  // Test a sample of city pages to check for issues
  const testCities = ['London', 'Birmingham', 'Manchester', 'Bristol', 'Leeds', 'Cambridge', 'York', 'Bath'];

  for (const city of testCities) {
    if (uniqueCities.includes(city)) {
      // Get simulator count for this city
      const { data: simulators, error: simError } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator']);

      if (simError) {
        console.error(`Error getting simulators for ${city}:`, simError);
        continue;
      }

      console.log(`${city}: ${simulators.length} simulator(s)`);

      if (simulators.length === 0) {
        console.log(`⚠️  ${city} has no simulators despite being in the cities list!`);
      }
    } else {
      console.log(`${city}: Not in database`);
    }
  }

  // Check for any cities with 0 simulators
  console.log('\nChecking for cities with 0 simulators...');
  const problemCities = [];

  for (const city of uniqueCities.slice(0, 20)) { // Check first 20 cities
    const { data: simulators } = await supabase
      .from('golf_ranges')
      .select('id, name')
      .eq('city', city)
      .contains('special_features', ['Indoor Simulator']);

    if (!simulators || simulators.length === 0) {
      problemCities.push(city);
    }
  }

  if (problemCities.length > 0) {
    console.log('Cities with potential issues:');
    problemCities.forEach(city => console.log(`- ${city}`));
  } else {
    console.log('✅ All tested cities have simulators');
  }
}

testCityPages().then(() => process.exit(0)).catch(console.error);