const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function debugLeeOnTheSolent() {
  console.log('🔍 Debugging Lee-on-the-Solent Simulator Page\n');
  console.log('=' .repeat(60));

  try {
    // Check for exact match "Lee-on-the-Solent"
    console.log('1. Searching for "Lee-on-the-Solent" (exact match)...\n');

    const { data: exactMatch, error: exactError } = await supabase
      .from('golf_ranges')
      .select('*')
      .eq('city', 'Lee-on-the-Solent')
      .contains('special_features', ['Indoor Simulator']);

    if (exactError) {
      console.log('❌ Error with exact match:', exactError.message);
    } else {
      console.log(`✅ Found ${exactMatch.length} venues with exact city match`);
      if (exactMatch.length > 0) {
        exactMatch.forEach(venue => {
          console.log(`   • ${venue.name}`);
          console.log(`     Address: ${venue.address}`);
          console.log(`     City: "${venue.city}"`);
          console.log(`     Coordinates: ${venue.latitude}, ${venue.longitude}`);
          console.log('');
        });
      }
    }

    // Check for similar city names
    console.log('2. Searching for similar city names...\n');

    const { data: similarCities, error: similarError } = await supabase
      .from('golf_ranges')
      .select('city, name, address')
      .contains('special_features', ['Indoor Simulator'])
      .or('city.ilike.%lee%,city.ilike.%solent%');

    if (similarError) {
      console.log('❌ Error searching similar cities:', similarError.message);
    } else {
      console.log(`📍 Found ${similarCities.length} venues in cities containing "lee" or "solent"`);
      if (similarCities.length > 0) {
        similarCities.forEach(venue => {
          console.log(`   • ${venue.name} (${venue.city})`);
          console.log(`     Address: ${venue.address}`);
        });
        console.log('');
      }
    }

    // Check for venues in Hampshire/Portsmouth area
    console.log('3. Searching in Hampshire/Portsmouth area...\n');

    const { data: hampshireVenues, error: hampshireError } = await supabase
      .from('golf_ranges')
      .select('city, name, address, latitude, longitude')
      .contains('special_features', ['Indoor Simulator'])
      .or('city.ilike.%portsmouth%,city.ilike.%southsea%,city.ilike.%gosport%,city.ilike.%fareham%,county.ilike.%hampshire%')
      .order('city');

    if (hampshireError) {
      console.log('❌ Error searching Hampshire area:', hampshireError.message);
    } else {
      console.log(`🏠 Found ${hampshireVenues.length} venues in Hampshire/Portsmouth area:`);
      if (hampshireVenues.length > 0) {
        hampshireVenues.forEach(venue => {
          console.log(`   • ${venue.name} (${venue.city})`);
          console.log(`     Address: ${venue.address}`);
          if (venue.latitude && venue.longitude) {
            console.log(`     Coordinates: ${venue.latitude}, ${venue.longitude}`);
          }
          console.log('');
        });
      }
    }

    // Check our CSV data to see if there was a venue in Lee-on-the-Solent
    console.log('4. Checking if Lee-on-the-Solent venue was removed...\n');

    // Look for any venue that might have been in Lee-on-the-Solent from our processing logs
    const { data: allCities, error: citiesError } = await supabase
      .from('golf_ranges')
      .select('city, count()')
      .contains('special_features', ['Indoor Simulator'])
      .group('city')
      .order('city');

    if (!citiesError && allCities) {
      console.log('📊 All cities with simulators:');
      allCities.forEach(cityGroup => {
        if (cityGroup.city && (
          cityGroup.city.toLowerCase().includes('lee') ||
          cityGroup.city.toLowerCase().includes('solent') ||
          cityGroup.city.toLowerCase().includes('portsmouth') ||
          cityGroup.city.toLowerCase().includes('southsea')
        )) {
          console.log(`   • ${cityGroup.city}: ${cityGroup.count} venues`);
        }
      });
    }

    // Check if there's a venue that should be in Lee-on-the-Solent but has wrong city
    console.log('\n5. Searching for venues that might belong in Lee-on-the-Solent...\n');

    const { data: potentialVenues, error: potentialError } = await supabase
      .from('golf_ranges')
      .select('*')
      .contains('special_features', ['Indoor Simulator'])
      .or('address.ilike.%lee-on-the-solent%,address.ilike.%lee on the solent%,name.ilike.%lee%');

    if (!potentialError && potentialVenues.length > 0) {
      console.log(`🎯 Found ${potentialVenues.length} potential venues:`);
      potentialVenues.forEach(venue => {
        console.log(`   • ${venue.name}`);
        console.log(`     City: ${venue.city}`);
        console.log(`     Address: ${venue.address}`);
        console.log(`     Website: ${venue.website}`);
        console.log('');
      });
    } else {
      console.log('❌ No venues found that should be in Lee-on-the-Solent');
    }

    // Solution recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('=' .repeat(40));

    if (exactMatch && exactMatch.length === 0) {
      console.log('❌ No venues found in Lee-on-the-Solent');
      console.log('');
      console.log('Possible solutions:');
      console.log('1. Check if venue city name is incorrect (should be Lee-on-the-Solent)');
      console.log('2. Verify if venue was accidentally removed');
      console.log('3. Check if venue is categorized under nearby city (Portsmouth, Gosport, etc.)');
      console.log('4. Add proper venue if it exists and was missed');

      if (hampshireVenues && hampshireVenues.length > 0) {
        console.log('\n💡 Consider redirecting Lee-on-the-Solent to nearby venues in:');
        const nearbyCities = [...new Set(hampshireVenues.map(v => v.city))];
        nearbyCities.forEach(city => {
          console.log(`   • ${city}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

debugLeeOnTheSolent().catch(console.error);