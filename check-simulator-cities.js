const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getCities() {
  console.log('Checking simulator cities in database...');

  const { data, error } = await supabase
    .from('golf_ranges')
    .select('city')
    .contains('special_features', ['Indoor Simulator']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const cities = [...new Set(data.map(item => item.city))].filter(Boolean).sort();
  console.log('\nCities with simulators in database:');
  cities.forEach(city => console.log(`- ${city}`));
  console.log('\nTotal cities:', cities.length);

  return cities;
}

getCities().then(() => process.exit(0)).catch(console.error);