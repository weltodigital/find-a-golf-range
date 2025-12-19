const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Function to simulate URL parsing
function parseUrlSlug(slug) {
  return decodeURIComponent(slug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function checkAllHyphenatedCities() {
  console.log('🔍 Checking All Cities for Hyphen/URL Parsing Issues\n');
  console.log('=' .repeat(60));

  try {
    // Get all unique cities with simulators
    const { data: allVenues, error } = await supabase
      .from('golf_ranges')
      .select('city, name')
      .contains('special_features', ['Indoor Simulator'])
      .order('city');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    // Group venues by city
    const cityCounts = {};
    allVenues.forEach(venue => {
      if (venue.city) {
        if (!cityCounts[venue.city]) {
          cityCounts[venue.city] = [];
        }
        cityCounts[venue.city].push(venue.name);
      }
    });

    const cities = Object.keys(cityCounts).sort();
    console.log(`📊 Total cities with simulators: ${cities.length}\n`);

    // Check for cities that might have URL parsing issues
    const hyphenatedCities = [];
    const problematicCities = [];

    console.log('🔍 Analyzing city names for potential URL issues...\n');

    for (const city of cities) {
      const venueCount = cityCounts[city].length;

      // Check if city contains hyphens
      if (city.includes('-')) {
        hyphenatedCities.push({ city, count: venueCount });

        // Simulate what the URL would be
        const urlSlug = city.toLowerCase().replace(/\s+/g, '-');
        const parsedName = parseUrlSlug(urlSlug);

        // Check if parsing would create a different name
        if (parsedName !== city) {
          problematicCities.push({
            city: city,
            count: venueCount,
            urlSlug: urlSlug,
            parsedName: parsedName,
            venues: cityCounts[city]
          });
        }
      }
    }

    console.log(`🏷️  Cities with hyphens: ${hyphenatedCities.length}`);
    if (hyphenatedCities.length > 0) {
      hyphenatedCities.forEach(item => {
        console.log(`   • "${item.city}" (${item.count} venues)`);
      });
    }

    console.log(`\n⚠️  Cities with URL parsing mismatches: ${problematicCities.length}`);
    if (problematicCities.length > 0) {
      problematicCities.forEach(item => {
        console.log(`   • "${item.city}" → URL would parse as "${item.parsedName}"`);
        console.log(`     URL slug: ${item.urlSlug}`);
        console.log(`     Venues (${item.count}): ${item.venues.slice(0, 2).join(', ')}${item.count > 2 ? '...' : ''}`);
        console.log('');
      });
    }

    // Check for other potential issues
    console.log('🔍 Checking for other potential naming issues...\n');

    const specialCases = [];

    for (const city of cities) {
      const venueCount = cityCounts[city].length;

      // Check for cities with unusual characters or spacing
      if (city.includes('&') || city.includes('/') || city.includes("'") || city.includes('.')) {
        specialCases.push({
          city: city,
          count: venueCount,
          issue: 'Special characters',
          venues: cityCounts[city]
        });
      }

      // Check for very long city names that might cause URL issues
      if (city.length > 25) {
        specialCases.push({
          city: city,
          count: venueCount,
          issue: 'Very long name',
          venues: cityCounts[city]
        });
      }
    }

    if (specialCases.length > 0) {
      console.log(`📝 Cities with special naming considerations: ${specialCases.length}`);
      specialCases.forEach(item => {
        console.log(`   • "${item.city}" (${item.issue}) - ${item.count} venues`);
      });
    } else {
      console.log('✅ No other special naming issues found');
    }

    // Summary and recommendations
    console.log('\n🎯 SUMMARY AND RECOMMENDATIONS:');
    console.log('=' .repeat(50));

    if (problematicCities.length === 0) {
      console.log('✅ All city names should work correctly with URL parsing');
      console.log('✅ No further fixes needed for hyphenated city names');
    } else {
      console.log(`⚠️  ${problematicCities.length} cities need fixing:`);

      problematicCities.forEach(item => {
        console.log(`\nCity: "${item.city}"`);
        console.log(`   Should be: "${item.parsedName}"`);
        console.log(`   Affects: ${item.count} venues`);
        console.log(`   Test URL: https://www.findagolfrange.com/simulators/uk/${item.urlSlug}`);
      });

      console.log('\n🔧 Fix Command:');
      console.log('Update these city names in the database to match URL parsing expectations.');
    }

    // Test some known working URLs
    console.log('\n✅ Recently Fixed Cities (should work now):');
    const fixedCities = [
      { name: 'Lee On The Solent', url: 'lee-on-the-solent' },
      { name: 'Southend On Sea', url: 'southend-on-sea' }
    ];

    for (const fixed of fixedCities) {
      const { data: testData, error: testError } = await supabase
        .from('golf_ranges')
        .select('name', { count: 'exact' })
        .eq('city', fixed.name)
        .contains('special_features', ['Indoor Simulator']);

      if (!testError) {
        console.log(`   ✅ ${fixed.name}: ${testData ? testData.length : 0} venues`);
        console.log(`      URL: https://www.findagolfrange.com/simulators/uk/${fixed.url}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
}

checkAllHyphenatedCities().catch(console.error);