const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// UK coordinate bounds for validation
const UK_BOUNDS = {
  north: 61.0,
  south: 49.9,
  east: 2.0,
  west: -8.0
};

function isValidUKCoordinate(lat, lng) {
  return lat >= UK_BOUNDS.south && lat <= UK_BOUNDS.north &&
         lng >= UK_BOUNDS.west && lng <= UK_BOUNDS.east;
}

async function verifyAllMapLocations() {
  console.log('🗺️  Verifying All Map Locations for Indoor Simulators\n');
  console.log('=' .repeat(70));

  try {
    // Get all indoor simulator venues with coordinates
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, city, address, latitude, longitude, phone, website')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    console.log(`📊 Total indoor simulator venues: ${venues.length}\n`);

    // Analyze coordinate data
    let validCoordinates = 0;
    let missingCoordinates = 0;
    let invalidCoordinates = 0;
    let suspiciousCoordinates = 0;

    const issues = [];
    const cityGroups = {};

    console.log('🔍 COORDINATE ANALYSIS:\n');

    for (const venue of venues) {
      // Group by city for city page verification
      if (!cityGroups[venue.city]) {
        cityGroups[venue.city] = [];
      }
      cityGroups[venue.city].push(venue);

      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);

      console.log(`📍 ${venue.name} (${venue.city})`);
      console.log(`   Address: ${venue.address}`);
      console.log(`   Coordinates: ${venue.latitude}, ${venue.longitude}`);

      if (!venue.latitude || !venue.longitude) {
        console.log('   ❌ MISSING COORDINATES');
        missingCoordinates++;
        issues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Missing coordinates',
          severity: 'high'
        });
      } else if (isNaN(lat) || isNaN(lng)) {
        console.log('   ❌ INVALID COORDINATES (not numbers)');
        invalidCoordinates++;
        issues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Invalid coordinate format',
          severity: 'high'
        });
      } else if (!isValidUKCoordinate(lat, lng)) {
        console.log('   ❌ COORDINATES OUTSIDE UK');
        console.log(`   Expected: lat ${UK_BOUNDS.south}-${UK_BOUNDS.north}, lng ${UK_BOUNDS.west}-${UK_BOUNDS.east}`);
        invalidCoordinates++;
        issues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Coordinates outside UK bounds',
          coordinates: `${lat}, ${lng}`,
          severity: 'high'
        });
      } else {
        // Check for suspicious coordinates (too precise or clearly wrong)
        const precision = (venue.latitude.toString().split('.')[1] || '').length;
        if (precision < 4) {
          console.log('   ⚠️  LOW PRECISION (may be approximate)');
          suspiciousCoordinates++;
          issues.push({
            venue: venue.name,
            city: venue.city,
            issue: `Low precision coordinates (${precision} decimal places)`,
            coordinates: `${lat}, ${lng}`,
            severity: 'medium'
          });
        } else {
          console.log('   ✅ Valid coordinates');
          validCoordinates++;
        }
      }
      console.log('');
    }

    // Summary
    console.log('📊 COORDINATE SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Valid coordinates: ${validCoordinates}`);
    console.log(`Missing coordinates: ${missingCoordinates}`);
    console.log(`Invalid coordinates: ${invalidCoordinates}`);
    console.log(`Suspicious coordinates: ${suspiciousCoordinates}`);
    console.log(`Total venues: ${venues.length}`);

    const healthPercentage = Math.round((validCoordinates / venues.length) * 100);
    console.log(`\nCoordinate health: ${healthPercentage}%`);

    // City page analysis
    console.log('\n🏙️  CITY PAGE MAP ANALYSIS:\n');
    const cities = Object.keys(cityGroups).sort();

    for (const city of cities) {
      const cityVenues = cityGroups[city];
      const validVenues = cityVenues.filter(v => {
        const lat = parseFloat(v.latitude);
        const lng = parseFloat(v.longitude);
        return !isNaN(lat) && !isNaN(lng) && isValidUKCoordinate(lat, lng);
      });

      console.log(`📍 ${city}: ${cityVenues.length} venues`);
      console.log(`   Valid coordinates: ${validVenues.length}/${cityVenues.length}`);

      if (validVenues.length < cityVenues.length) {
        console.log(`   ❌ ${cityVenues.length - validVenues.length} venues have coordinate issues`);
      } else {
        console.log(`   ✅ All venues have valid coordinates`);
      }

      // Calculate center point for city map
      if (validVenues.length > 0) {
        const avgLat = validVenues.reduce((sum, v) => sum + parseFloat(v.latitude), 0) / validVenues.length;
        const avgLng = validVenues.reduce((sum, v) => sum + parseFloat(v.longitude), 0) / validVenues.length;
        console.log(`   📍 Map center: ${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}`);
      }

      const urlSlug = city.toLowerCase().replace(/\s+/g, '-');
      console.log(`   🔗 URL: https://www.findagolfrange.com/simulators/uk/${urlSlug}`);
      console.log('');
    }

    // Issues report
    if (issues.length > 0) {
      console.log('🚨 ISSUES REQUIRING ATTENTION:\n');
      console.log('=' .repeat(50));

      const highSeverity = issues.filter(i => i.severity === 'high');
      const mediumSeverity = issues.filter(i => i.severity === 'medium');

      if (highSeverity.length > 0) {
        console.log(`❌ HIGH PRIORITY (${highSeverity.length} issues):`);
        highSeverity.forEach(issue => {
          console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
          if (issue.coordinates) {
            console.log(`     Coordinates: ${issue.coordinates}`);
          }
        });
        console.log('');
      }

      if (mediumSeverity.length > 0) {
        console.log(`⚠️  MEDIUM PRIORITY (${mediumSeverity.length} issues):`);
        mediumSeverity.forEach(issue => {
          console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
          if (issue.coordinates) {
            console.log(`     Coordinates: ${issue.coordinates}`);
          }
        });
      }
    } else {
      console.log('✅ NO ISSUES FOUND - All maps should display correctly!');
    }

    // Test URLs for city pages
    console.log('\n🧪 CITY PAGE TEST URLS:\n');
    console.log('Test these pages to verify maps display correctly:');
    cities.forEach(city => {
      const urlSlug = city.toLowerCase().replace(/\s+/g, '-');
      const venueCount = cityGroups[city].length;
      const validCount = cityGroups[city].filter(v => {
        const lat = parseFloat(v.latitude);
        const lng = parseFloat(v.longitude);
        return !isNaN(lat) && !isNaN(lng) && isValidUKCoordinate(lat, lng);
      }).length;

      const status = validCount === venueCount ? '✅' : '❌';
      console.log(`${status} https://www.findagolfrange.com/simulators/uk/${urlSlug} (${validCount}/${venueCount} valid)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:\n');
    console.log('=' .repeat(50));

    if (healthPercentage >= 95) {
      console.log('🎉 EXCELLENT: Map locations are in great condition!');
      console.log('   • All city pages should display correctly');
      console.log('   • Individual venue maps should be accurate');
      console.log('   • Consider spot-checking a few pages for visual verification');
    } else if (healthPercentage >= 80) {
      console.log('👍 GOOD: Most map locations are correct, minor issues to fix');
      console.log('   • Focus on high-priority coordinate issues');
      console.log('   • Most city pages should work correctly');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Significant coordinate issues detected');
      console.log('   • Multiple venues need coordinate updates');
      console.log('   • Some city pages may not display properly');
      console.log('   • Recommend systematic coordinate verification');
    }

    if (highSeverity.length > 0) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix missing coordinates for venues without lat/lng');
      console.log('2. Correct coordinates outside UK bounds');
      console.log('3. Re-run verification after fixes');
    }

    console.log('\n📱 TESTING CHECKLIST:');
    console.log('□ Visit city pages and verify map markers appear');
    console.log('□ Check that all venues show on city maps');
    console.log('□ Test individual venue pages for correct map location');
    console.log('□ Verify map zoom and centering looks appropriate');
    console.log('□ Confirm address matches map marker location');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyAllMapLocations().catch(console.error);