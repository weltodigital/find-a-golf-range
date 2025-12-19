const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function testUrlParsing() {
  console.log('🔍 Testing URL Parsing Logic\n');
  console.log('=' .repeat(60));

  // Simulate the exact URL parsing logic from the page
  const urlSlug = 'lee-on-the-solent';
  console.log(`🔗 URL slug: "${urlSlug}"`);

  // This is the exact conversion from the page component
  const cityName = decodeURIComponent(urlSlug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  console.log(`🏙️ Converted city name: "${cityName}"`);
  console.log(`📏 City name length: ${cityName.length} characters`);

  // Test the query with the exact converted name
  console.log('\n🔍 Testing database query...');

  const { data: simulatorData, error } = await supabase
    .from('golf_ranges')
    .select('*')
    .eq('city', cityName)
    .contains('special_features', ['Indoor Simulator'])
    .order('name');

  console.log('📊 Query Results:');
  console.log(`   Error: ${error ? error.message : 'None'}`);
  console.log(`   Venues found: ${simulatorData ? simulatorData.length : 0}`);

  if (simulatorData && simulatorData.length > 0) {
    console.log('\n✅ SUCCESS! Venues found:');
    simulatorData.forEach((venue, index) => {
      console.log(`   ${index + 1}. ${venue.name}`);
      console.log(`      City: "${venue.city}" (${venue.city.length} chars)`);
      console.log(`      Address: ${venue.address}`);
      console.log(`      Coordinates: ${venue.latitude}, ${venue.longitude}`);
      console.log('');
    });

    console.log('🎯 The Lee-on-the-Solent page should now work correctly!');
    console.log('🔗 Test URL: https://www.findagolfrange.com/simulators/uk/lee-on-the-solent');
  } else {
    console.log('\n❌ No venues found. Checking all possible matches...');

    // Check what cities we actually have that might match
    const { data: allCities, error: citiesError } = await supabase
      .from('golf_ranges')
      .select('city')
      .contains('special_features', ['Indoor Simulator'])
      .like('city', '%Lee%');

    if (!citiesError && allCities) {
      console.log('\n📍 Cities containing "Lee":');
      const uniqueCities = [...new Set(allCities.map(c => c.city))];
      uniqueCities.forEach(city => {
        console.log(`   • "${city}" (${city.length} chars)`);
      });
    }
  }

  // Test character-by-character comparison
  console.log('\n🔤 Character analysis:');
  const testCityName = 'Lee On The Solent';
  console.log(`Target: "${testCityName}"`);
  console.log(`Result: "${cityName}"`);
  console.log(`Match:  ${cityName === testCityName}`);

  for (let i = 0; i < Math.max(cityName.length, testCityName.length); i++) {
    const char1 = cityName[i] || '(end)';
    const char2 = testCityName[i] || '(end)';
    const match = char1 === char2 ? '✓' : '✗';
    console.log(`   ${i}: "${char1}" vs "${char2}" ${match}`);
  }
}

testUrlParsing().catch(console.error);