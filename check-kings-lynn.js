const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function checkKingsLynn() {
  console.log('🔍 CHECKING KINGS LYNN VENUE ISSUE');
  console.log('='.repeat(50));

  try {
    // Check what URL parsing produces
    const urlCity = 'kings-lynn';
    const parsedCityName = decodeURIComponent(urlCity)
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    console.log(`URL: /simulators/uk/${urlCity}`);
    console.log(`Parsed city name: "${parsedCityName}"`);
    console.log('');

    // Search for venues with different variations
    const variations = [
      'Kings Lynn',      // URL parsing result
      "King's Lynn",     // Common spelling
      'Kings Lyn',       // Possible variation
      "King's Lyn",      // Another variation
    ];

    for (const cityVariation of variations) {
      console.log(`🔍 Searching for: "${cityVariation}"`);

      const { data: venues, error } = await supabase
        .from('golf_ranges')
        .select('name, city, latitude, longitude')
        .eq('city', cityVariation)
        .contains('special_features', ['Indoor Simulator']);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else if (venues.length === 0) {
        console.log(`   ⚠️  No simulator venues found`);
      } else {
        console.log(`   ✅ Found ${venues.length} simulator venues:`);
        venues.forEach((venue, index) => {
          console.log(`      ${index + 1}. ${venue.name}`);
          console.log(`         City field: "${venue.city}"`);
          console.log(`         Coordinates: ${venue.latitude}, ${venue.longitude}`);
        });
      }
      console.log('');
    }

    // Also check for any venue containing "lynn" or "king"
    console.log('🔍 Searching for any venues containing "lynn" or "king":');
    const { data: lynnVenues, error: lynnError } = await supabase
      .from('golf_ranges')
      .select('name, city, latitude, longitude')
      .contains('special_features', ['Indoor Simulator'])
      .or('city.ilike.%lynn%,city.ilike.%king%');

    if (lynnError) {
      console.log(`❌ Error: ${lynnError.message}`);
    } else if (lynnVenues.length === 0) {
      console.log(`⚠️  No venues found with "lynn" or "king" in city name`);
    } else {
      console.log(`✅ Found ${lynnVenues.length} venues:`);
      lynnVenues.forEach((venue, index) => {
        console.log(`   ${index + 1}. ${venue.name} (${venue.city})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkKingsLynn();