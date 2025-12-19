const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCityPages() {
  console.log('Testing city pages for simulator venues...\n');

  // Get a sample of cities to test
  const testCities = [
    'London', 'Birmingham', 'Manchester', 'Bristol', 'Leeds',
    'Sheffield', 'Liverpool', 'Glasgow', 'Edinburgh', 'Cardiff',
    'Belfast', 'Newcastle', 'Nottingham', 'Leicester', 'Bradford'
  ];

  const results = [];

  for (const city of testCities) {
    try {
      // Test database query directly
      const { data: simulators, error } = await supabase
        .from('golf_ranges')
        .select('id, name, city')
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator']);

      if (error) {
        console.error(`❌ Database error for ${city}:`, error.message);
        continue;
      }

      const count = simulators ? simulators.length : 0;

      if (count > 0) {
        console.log(`✅ ${city}: ${count} simulator(s) - Page should work`);
        results.push({ city, count, status: 'good' });
      } else {
        console.log(`⚠️  ${city}: 0 simulators - No page available`);
        results.push({ city, count, status: 'no_simulators' });
      }
    } catch (error) {
      console.log(`❌ ${city}: Error - ${error.message}`);
      results.push({ city, count: 0, status: 'error' });
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total cities tested: ${results.length}`);
  console.log(`Cities with simulators: ${results.filter(r => r.status === 'good').length}`);
  console.log(`Cities without simulators: ${results.filter(r => r.status === 'no_simulators').length}`);
  console.log(`Cities with errors: ${results.filter(r => r.status === 'error').length}`);

  const goodCities = results.filter(r => r.status === 'good');
  if (goodCities.length > 0) {
    console.log('\nCities that should have working simulator pages:');
    goodCities.forEach(({ city, count }) => {
      console.log(`- ${city} (${count} simulators)`);
    });
  }

  const noCities = results.filter(r => r.status === 'no_simulators');
  if (noCities.length > 0) {
    console.log('\nCities that will show 404 (no simulators):');
    noCities.forEach(({ city }) => {
      console.log(`- ${city}`);
    });
  }
}

testCityPages().then(() => process.exit(0)).catch(console.error);