const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function testIndividualVenueMaps() {
  console.log('🔍 Testing Individual Venue Page Maps\n');
  console.log('=' .repeat(60));

  try {
    // Get a sample of venues across different cities to test
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, city, address, latitude, longitude, slug')
      .contains('special_features', ['Indoor Simulator'])
      .limit(20)
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    console.log(`📊 Testing ${venues.length} individual venue pages:\n`);

    let validMaps = 0;
    let invalidMaps = 0;
    const mapIssues = [];

    for (const venue of venues) {
      console.log(`🎯 Testing: ${venue.name} (${venue.city})`);
      console.log(`   Address: ${venue.address}`);

      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);

      // Check coordinate validity
      if (!venue.latitude || !venue.longitude) {
        console.log('   ❌ MISSING COORDINATES - Map will not display');
        invalidMaps++;
        mapIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Missing coordinates',
          severity: 'critical'
        });
      } else if (isNaN(lat) || isNaN(lng)) {
        console.log('   ❌ INVALID COORDINATES - Map will fail to load');
        invalidMaps++;
        mapIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Invalid coordinate format',
          severity: 'critical'
        });
      } else if (lat < 49.9 || lat > 61.0 || lng < -8.0 || lng > 2.0) {
        console.log('   ❌ COORDINATES OUTSIDE UK - Map will show wrong location');
        console.log(`   Current: ${lat}, ${lng}`);
        invalidMaps++;
        mapIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Coordinates outside UK: ${lat}, ${lng}`,
          severity: 'high'
        });
      } else {
        console.log(`   ✅ Valid coordinates: ${lat}, ${lng}`);
        validMaps++;

        // Additional checks for map display quality
        const precision = (venue.latitude.toString().split('.')[1] || '').length;
        if (precision < 5) {
          console.log(`   ⚠️  Low precision (${precision} decimals) - May be approximate`);
          mapIssues.push({
            venue: venue.name,
            city: venue.city,
            issue: `Low precision coordinates (${precision} decimals)`,
            severity: 'medium'
          });
        }
      }

      // Generate expected URL for this venue
      const venueSlug = venue.slug || venue.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      const citySlug = venue.city.toLowerCase().replace(/\s+/g, '-');
      const expectedUrl = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

      console.log(`   🔗 Venue URL: ${expectedUrl}`);
      console.log('');
    }

    // Summary
    console.log('📊 INDIVIDUAL VENUE MAP TEST SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Valid maps: ${validMaps}`);
    console.log(`Invalid maps: ${invalidMaps}`);
    console.log(`Total tested: ${venues.length}`);

    const mapHealthPercentage = Math.round((validMaps / venues.length) * 100);
    console.log(`Map health: ${mapHealthPercentage}%`);

    // Issue breakdown
    if (mapIssues.length > 0) {
      console.log('\n🚨 MAP ISSUES FOUND:\n');

      const criticalIssues = mapIssues.filter(i => i.severity === 'critical');
      const highIssues = mapIssues.filter(i => i.severity === 'high');
      const mediumIssues = mapIssues.filter(i => i.severity === 'medium');

      if (criticalIssues.length > 0) {
        console.log(`🔴 CRITICAL (${criticalIssues.length}) - Maps will not work:`);
        criticalIssues.forEach(issue => {
          console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
        });
        console.log('');
      }

      if (highIssues.length > 0) {
        console.log(`🟠 HIGH (${highIssues.length}) - Wrong map locations:`);
        highIssues.forEach(issue => {
          console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
        });
        console.log('');
      }

      if (mediumIssues.length > 0) {
        console.log(`🟡 MEDIUM (${mediumIssues.length}) - Map quality issues:`);
        mediumIssues.forEach(issue => {
          console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
        });
      }
    } else {
      console.log('\n✅ NO ISSUES FOUND - All individual venue maps should work correctly!');
    }

    // Test a few specific high-traffic venues
    console.log('\n🎯 TESTING KEY VENUES:\n');

    const keyVenues = [
      { name: 'Pitch Soho', city: 'London' },
      { name: 'Golf.One', city: 'Southend On Sea' },
      { name: 'The Golf Sim', city: 'Lee On The Solent' },
      { name: 'Pitch Manchester', city: 'Manchester' },
      { name: 'eGolf Swansea', city: 'Swansea' }
    ];

    for (const keyVenue of keyVenues) {
      const { data: venueData, error: venueError } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('name', keyVenue.name)
        .eq('city', keyVenue.city)
        .single();

      if (!venueError && venueData) {
        const lat = parseFloat(venueData.latitude);
        const lng = parseFloat(venueData.longitude);
        const isValid = !isNaN(lat) && !isNaN(lng) &&
                       lat >= 49.9 && lat <= 61.0 &&
                       lng >= -8.0 && lng <= 2.0;

        console.log(`${isValid ? '✅' : '❌'} ${keyVenue.name} (${keyVenue.city})`);
        console.log(`   Coordinates: ${venueData.latitude}, ${venueData.longitude}`);
        console.log(`   Address: ${venueData.address}`);

        const citySlug = keyVenue.city.toLowerCase().replace(/\s+/g, '-');
        const venueSlug = keyVenue.name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        console.log(`   Test URL: https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`);
        console.log('');
      } else {
        console.log(`❌ ${keyVenue.name} (${keyVenue.city}) - Not found`);
      }
    }

    // Recommendations
    console.log('💡 MAP TESTING RECOMMENDATIONS:\n');
    console.log('=' .repeat(50));

    if (mapHealthPercentage >= 95) {
      console.log('🎉 EXCELLENT: Individual venue maps are in great condition!');
      console.log('   • Maps should load correctly on all venue pages');
      console.log('   • Coordinates are accurate and precise');
      console.log('   • Consider spot-testing a few venue pages visually');
    } else if (mapHealthPercentage >= 90) {
      console.log('👍 VERY GOOD: Most venue maps will work correctly');
      console.log('   • Minor issues need addressing');
      console.log('   • Focus on critical and high-priority issues');
    } else if (mapHealthPercentage >= 80) {
      console.log('⚠️  GOOD: Majority of maps work, some fixes needed');
      console.log('   • Several venues need coordinate updates');
      console.log('   • Prioritize critical issues first');
    } else {
      console.log('🔧 NEEDS WORK: Significant map issues detected');
      console.log('   • Many venues have coordinate problems');
      console.log('   • Systematic review and fixes required');
    }

    console.log('\n📋 MANUAL TESTING CHECKLIST:');
    console.log('□ Visit a few venue pages and verify map displays');
    console.log('□ Check that map marker is in correct location');
    console.log('□ Verify address matches map marker position');
    console.log('□ Test map zoom level is appropriate');
    console.log('□ Confirm map loads without errors');
    console.log('□ Check mobile map display is responsive');

    console.log('\n🔧 IF ISSUES FOUND:');
    console.log('1. Update missing coordinates using address lookup');
    console.log('2. Correct coordinates outside UK bounds');
    console.log('3. Improve coordinate precision where needed');
    console.log('4. Re-run this test after fixes');

  } catch (error) {
    console.error('❌ Error during individual venue map testing:', error.message);
  }
}

testIndividualVenueMaps().catch(console.error);