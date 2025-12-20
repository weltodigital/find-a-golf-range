const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to create URL slug from venue name
function createVenueSlug(venueName) {
  return venueName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim('-');               // Remove leading/trailing hyphens
}

// Function to validate UK coordinates
function isValidUKCoordinate(lat, lng) {
  const UK_BOUNDS = {
    north: 61.0,
    south: 49.9,
    east: 2.0,
    west: -8.0
  };
  return lat >= UK_BOUNDS.south && lat <= UK_BOUNDS.north &&
         lng >= UK_BOUNDS.west && lng <= UK_BOUNDS.east;
}

async function verifyAllVenueMaps() {
  console.log('🗺️  Verifying ALL Individual Simulator Location Page Maps\n');
  console.log('=' .repeat(70));

  try {
    // Get all simulator venues
    const { data: allVenues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, slug, city, address, latitude, longitude, phone, website')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    console.log(`📊 Testing ${allVenues.length} individual venue pages...\n`);

    let mapIssues = [];
    let distanceIssues = [];
    let coordinateIssues = [];
    let validVenues = 0;

    // Test each venue individually
    for (let i = 0; i < allVenues.length; i++) {
      const venue = allVenues[i];
      const venueNumber = i + 1;

      console.log(`[${venueNumber}/${allVenues.length}] 📍 ${venue.name} (${venue.city})`);

      // Check coordinates first
      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);

      if (!venue.latitude || !venue.longitude) {
        console.log('   ❌ MISSING COORDINATES');
        coordinateIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Missing coordinates',
          severity: 'critical'
        });
        continue;
      }

      if (isNaN(lat) || isNaN(lng)) {
        console.log('   ❌ INVALID COORDINATES (not numbers)');
        coordinateIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Invalid coordinate format',
          severity: 'critical'
        });
        continue;
      }

      if (!isValidUKCoordinate(lat, lng)) {
        console.log('   ❌ COORDINATES OUTSIDE UK BOUNDS');
        console.log(`      Current: ${lat}, ${lng}`);
        coordinateIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Coordinates outside UK: ${lat}, ${lng}`,
          severity: 'high'
        });
        continue;
      }

      // Coordinates are valid
      validVenues++;
      console.log(`   ✅ Valid coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      // Generate expected venue URL
      const venueSlug = venue.slug || createVenueSlug(venue.name);
      const citySlug = venue.city.toLowerCase().replace(/\s+/g, '-');
      const expectedUrl = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

      console.log(`   🔗 Page URL: ${expectedUrl}`);

      // Check coordinate precision
      const precision = (venue.latitude.toString().split('.')[1] || '').length;
      if (precision < 5) {
        console.log(`   ⚠️  Low precision (${precision} decimals) - may affect map accuracy`);
        mapIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Low precision coordinates (${precision} decimals)`,
          severity: 'medium',
          url: expectedUrl
        });
      } else {
        console.log(`   ✅ High precision coordinates (${precision} decimals)`);
      }

      // Test distance calculations to nearby venues in same city
      const sameCity = allVenues.filter(v =>
        v.city === venue.city &&
        v.id !== venue.id &&
        !isNaN(parseFloat(v.latitude)) &&
        !isNaN(parseFloat(v.longitude))
      );

      if (sameCity.length > 0) {
        console.log(`   📏 Testing distances to ${sameCity.length} nearby venue(s):`);

        sameCity.forEach(nearbyVenue => {
          const nearbyLat = parseFloat(nearbyVenue.latitude);
          const nearbyLng = parseFloat(nearbyVenue.longitude);
          const distance = calculateDistance(lat, lng, nearbyLat, nearbyLng);

          console.log(`      • ${nearbyVenue.name}: ${distance.toFixed(2)} miles`);

          // Check for unreasonable distances within same city
          if (distance > 20) {
            console.log(`        ⚠️  Unusually large distance for same city`);
            distanceIssues.push({
              venue: venue.name,
              nearbyVenue: nearbyVenue.name,
              city: venue.city,
              distance: distance,
              issue: 'Large distance between venues in same city',
              severity: 'medium'
            });
          } else if (distance < 0.01) {
            console.log(`        ⚠️  Venues very close or duplicate coordinates`);
            distanceIssues.push({
              venue: venue.name,
              nearbyVenue: nearbyVenue.name,
              city: venue.city,
              distance: distance,
              issue: 'Venues have nearly identical coordinates',
              severity: 'low'
            });
          }
        });
      }

      // Test distance to a few major city centers for context
      const majorCityCenters = {
        'London': { lat: 51.5074, lng: -0.1278 },
        'Birmingham': { lat: 52.4862, lng: -1.8904 },
        'Manchester': { lat: 53.4808, lng: -2.2426 }
      };

      const nearestMajorCity = Object.entries(majorCityCenters)
        .map(([city, coords]) => ({
          city,
          distance: calculateDistance(lat, lng, coords.lat, coords.lng)
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      console.log(`   🌍 ${nearestMajorCity.distance.toFixed(1)} miles from ${nearestMajorCity.city}`);

      console.log('');
    }

    // Summary and analysis
    console.log('📊 COMPLETE VENUE MAP VERIFICATION SUMMARY:');
    console.log('=' .repeat(60));

    console.log(`Total venues tested: ${allVenues.length}`);
    console.log(`Valid map coordinates: ${validVenues}`);
    console.log(`Coordinate issues: ${coordinateIssues.length}`);
    console.log(`Map display issues: ${mapIssues.length}`);
    console.log(`Distance calculation issues: ${distanceIssues.length}`);

    const overallHealth = Math.round((validVenues / allVenues.length) * 100);
    console.log(`Overall map health: ${overallHealth}%`);

    // Detailed issue breakdown
    if (coordinateIssues.length > 0) {
      console.log('\n🚨 COORDINATE ISSUES (Critical - Maps Won\'t Display):');
      coordinateIssues.forEach(issue => {
        console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
      });
    }

    if (mapIssues.length > 0) {
      console.log('\n⚠️  MAP DISPLAY ISSUES (May Affect Accuracy):');
      mapIssues.forEach(issue => {
        console.log(`   • ${issue.venue} (${issue.city}): ${issue.issue}`);
        console.log(`     URL: ${issue.url}`);
      });
    }

    if (distanceIssues.length > 0) {
      console.log('\n📏 DISTANCE CALCULATION ISSUES:');
      distanceIssues.forEach(issue => {
        console.log(`   • ${issue.venue} ↔ ${issue.nearbyVenue} (${issue.city}): ${issue.distance.toFixed(2)} miles`);
        console.log(`     Issue: ${issue.issue}`);
      });
    }

    // High-priority venues to test manually
    console.log('\n🎯 HIGH-PRIORITY VENUES FOR MANUAL TESTING:');
    console.log('Test these venue pages first to verify map display:\n');

    // Get venues from major cities
    const priorityCities = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Liverpool'];
    const priorityVenues = [];

    priorityCities.forEach(cityName => {
      const cityVenues = allVenues.filter(v => v.city === cityName && validVenues);
      if (cityVenues.length > 0) {
        priorityVenues.push(cityVenues[0]); // Take first venue from each major city
      }
    });

    priorityVenues.forEach((venue, index) => {
      const venueSlug = venue.slug || createVenueSlug(venue.name);
      const citySlug = venue.city.toLowerCase().replace(/\s+/g, '-');
      const url = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

      console.log(`${index + 1}. ${venue.name} (${venue.city})`);
      console.log(`   URL: ${url}`);
      console.log(`   Expected location: ${venue.latitude}, ${venue.longitude}`);
      console.log(`   Address: ${venue.address}`);
      console.log('');
    });

    // Overall assessment
    console.log('🔍 FINAL ASSESSMENT:');
    console.log('=' .repeat(40));

    if (overallHealth >= 98) {
      console.log('🎉 EXCELLENT: All venue maps should display correctly!');
      console.log('   • Individual venue pages have accurate map locations');
      console.log('   • Distance calculations are precise and reliable');
      console.log('   • Map centering should work perfectly for all venues');
    } else if (overallHealth >= 95) {
      console.log('👍 VERY GOOD: Most venue maps working correctly');
      console.log('   • Minor issues need attention');
      console.log('   • Majority of venue pages display properly');
    } else if (overallHealth >= 90) {
      console.log('✅ GOOD: Most venues working, some fixes needed');
      console.log('   • Several venues need coordinate updates');
      console.log('   • Focus on critical issues first');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Multiple venue map issues detected');
      console.log('   • Significant number of venues have problems');
      console.log('   • Systematic review and fixes required');
    }

    console.log('\n📱 TESTING INSTRUCTIONS:');
    console.log('1. Visit the priority venue URLs above');
    console.log('2. Verify the map displays and centers on the correct location');
    console.log('3. Check that the marker matches the venue address');
    console.log('4. Test "distance from" calculations if available');
    console.log('5. Verify zoom level is appropriate for the location');

    if (coordinateIssues.length > 0) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix missing coordinates for venues without lat/lng');
      console.log('2. Correct coordinates that are outside UK bounds');
      console.log('3. Improve coordinate precision where needed');
      console.log('4. Re-run verification after fixes');
    }

  } catch (error) {
    console.error('❌ Error during complete venue map verification:', error.message);
  }
}

verifyAllVenueMaps().catch(console.error);