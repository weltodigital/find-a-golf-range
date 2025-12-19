const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function debugSouthendOnSea() {
  console.log('🔍 Debugging Southend-on-Sea Simulator Page\n');
  console.log('=' .repeat(60));

  // Test URL parsing logic for Southend-on-Sea
  const urlSlug = 'southend-on-sea';
  console.log(`🔗 URL slug: "${urlSlug}"`);

  // This is the exact conversion from the page component
  const parsedCityName = decodeURIComponent(urlSlug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  console.log(`🏙️ URL parsing creates: "${parsedCityName}"`);

  try {
    // Check what cities we actually have containing "southend"
    console.log('\n1. Searching for cities containing "southend"...\n');

    const { data: southendCities, error: cityError } = await supabase
      .from('golf_ranges')
      .select('city, name, address')
      .contains('special_features', ['Indoor Simulator'])
      .or('city.ilike.%southend%,address.ilike.%southend%');

    if (cityError) {
      console.log('❌ Error searching Southend cities:', cityError.message);
    } else {
      console.log(`📍 Found ${southendCities.length} venues with "southend" in city/address:`);
      if (southendCities.length > 0) {
        southendCities.forEach(venue => {
          console.log(`   • ${venue.name}`);
          console.log(`     City: "${venue.city}"`);
          console.log(`     Address: ${venue.address}`);
          console.log('');
        });
      }
    }

    // Test exact match with parsed city name
    console.log(`\n2. Testing exact match with parsed name "${parsedCityName}"...\n`);

    const { data: exactMatch, error: exactError } = await supabase
      .from('golf_ranges')
      .select('*')
      .eq('city', parsedCityName)
      .contains('special_features', ['Indoor Simulator']);

    if (exactError) {
      console.log('❌ Error with exact match:', exactError.message);
    } else {
      console.log(`📊 Found ${exactMatch.length} venues with exact city match "${parsedCityName}"`);
    }

    // Check for variations of Southend
    console.log('\n3. Testing city name variations...\n');

    const variations = [
      'Southend-on-Sea',
      'Southend on Sea',
      'Southend On Sea',
      'Southend-On-Sea',
      'southend-on-sea',
      'Southend'
    ];

    for (const variant of variations) {
      const { data: variantData, error: variantError } = await supabase
        .from('golf_ranges')
        .select('name, city')
        .eq('city', variant)
        .contains('special_features', ['Indoor Simulator']);

      if (!variantError && variantData) {
        console.log(`   "${variant}": ${variantData.length} venues`);
        if (variantData.length > 0) {
          variantData.forEach(venue => {
            console.log(`     • ${venue.name} (city: "${venue.city}")`);
          });
        }
      }
    }

    // Look for specific venues we know should be in Southend
    console.log('\n4. Searching for known Southend venues...\n');

    const knownSouthendVenues = [
      'Golf.One',
      'Richard McEvoy Golf Academy',
      'Bunker 19'
    ];

    for (const venueName of knownSouthendVenues) {
      const { data: venue, error: venueError } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('name', venueName)
        .contains('special_features', ['Indoor Simulator']);

      if (!venueError && venue && venue.length > 0) {
        console.log(`✅ Found: ${venue[0].name}`);
        console.log(`   City: "${venue[0].city}"`);
        console.log(`   Address: ${venue[0].address}`);
        console.log(`   Coordinates: ${venue[0].latitude}, ${venue[0].longitude}`);
        console.log('');
      } else {
        console.log(`❌ Not found: ${venueName}`);
      }
    }

    // Analysis and recommendations
    console.log('\n🎯 ANALYSIS AND RECOMMENDATIONS:');
    console.log('=' .repeat(50));

    console.log(`URL slug: ${urlSlug}`);
    console.log(`Parsed city name: "${parsedCityName}"`);
    console.log(`Issue: Same as Lee-on-Sea - hyphenated city names don't match URL parsing`);

    if (southendCities && southendCities.length > 0) {
      console.log('\n💡 Solution: Update city names to match URL parsing');
      console.log('Need to change:');
      southendCities.forEach(venue => {
        console.log(`   "${venue.city}" → "${parsedCityName}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

debugSouthendOnSea().catch(console.error);