const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function checkNewcastleVenues() {
  console.log('🔍 Debugging Newcastle upon Tyne Simulator Page\n');
  console.log('=' .repeat(60));

  // Test different city name variations
  const cityVariations = [
    'Newcastle upon Tyne',
    'Newcastle Upon Tyne',
    'Newcastle-upon-Tyne',
    'Newcastle',
    'Newcastle-Upon-Tyne'
  ];

  console.log('🏙️ Testing different city name variations:\n');

  for (const city of cityVariations) {
    console.log(`Searching for city: "${city}"`);

    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('*')
      .eq('city', city)
      .contains('special_features', ['Indoor Simulator']);

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else if (!venues || venues.length === 0) {
      console.log('  ❌ No venues found');
    } else {
      console.log(`  ✅ Found ${venues.length} venues:`);
      venues.forEach(venue => {
        console.log(`    • ${venue.name}`);
        console.log(`      Address: ${venue.address}`);
        console.log(`      City in DB: "${venue.city}"`);
        console.log(`      Coordinates: ${venue.latitude}, ${venue.longitude}`);
        console.log('');
      });
    }
    console.log('');
  }

  // Check if there are any venues with 'Newcastle' in the name or address
  console.log('🔍 Searching for any venues containing "Newcastle"...\n');

  const { data: anyNewcastle, error: searchError } = await supabase
    .from('golf_ranges')
    .select('*')
    .contains('special_features', ['Indoor Simulator'])
    .or('name.ilike.%Newcastle%,city.ilike.%Newcastle%,address.ilike.%Newcastle%');

  if (!searchError && anyNewcastle && anyNewcastle.length > 0) {
    console.log(`✅ Found ${anyNewcastle.length} venues with "Newcastle" in name/city/address:`);
    anyNewcastle.forEach(venue => {
      console.log(`  • ${venue.name}`);
      console.log(`    City: "${venue.city}"`);
      console.log(`    Address: ${venue.address}`);
      console.log('');
    });
  } else {
    console.log('❌ No venues found with "Newcastle" in name, city, or address');
  }

  // Test what the URL parsing would create
  const urlSlug = 'newcastle-upon-tyne';
  const parsedCityName = decodeURIComponent(urlSlug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  console.log('\n🔗 URL ANALYSIS:');
  console.log('=' .repeat(30));
  console.log(`URL slug: "${urlSlug}"`);
  console.log(`Parsed city name: "${parsedCityName}"`);
  console.log('This is what the database needs to match for the URL to work\n');

  // Check nearby cities that might be confused with Newcastle
  console.log('🌍 Checking nearby cities that might contain Newcastle venues:\n');

  const nearbyQueries = [
    'Newcastle',
    'Gateshead',
    'Sunderland',
    'Durham'
  ];

  for (const query of nearbyQueries) {
    const { data: nearbyVenues, error: nearbyError } = await supabase
      .from('golf_ranges')
      .select('name, city, address')
      .contains('special_features', ['Indoor Simulator'])
      .or(`city.ilike.%${query}%,address.ilike.%${query}%`);

    if (!nearbyError && nearbyVenues && nearbyVenues.length > 0) {
      console.log(`📍 Venues related to "${query}":`);
      nearbyVenues.forEach(venue => {
        console.log(`  • ${venue.name} (${venue.city})`);
        console.log(`    Address: ${venue.address}`);
      });
      console.log('');
    }
  }

  // Final diagnosis
  console.log('🩺 DIAGNOSIS:');
  console.log('=' .repeat(30));
  console.log('The page https://www.findagolfrange.com/simulators/uk/newcastle-upon-tyne');
  console.log(`expects to find venues with city = "${parsedCityName}"`);
  console.log('');

  if (anyNewcastle && anyNewcastle.length > 0) {
    console.log('💡 SOLUTION: Update city name(s) in database to match URL parsing');
    console.log('Current city names in database should be changed to:');
    console.log(`   "${parsedCityName}"`);
  } else {
    console.log('⚠️  No Newcastle venues found in database at all');
    console.log('Either:');
    console.log('1. Newcastle venues were accidentally removed');
    console.log('2. Newcastle venues are stored under a different city name');
    console.log('3. There genuinely are no simulators in Newcastle upon Tyne');
  }
}

checkNewcastleVenues().catch(console.error);