const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Function to calculate distance between two points using Haversine formula
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

// Function to get the geographic center of a city's venues
function calculateCityCenter(venues) {
  if (venues.length === 0) return null;

  let totalLat = 0;
  let totalLng = 0;
  let validCount = 0;

  venues.forEach(venue => {
    const lat = parseFloat(venue.latitude);
    const lng = parseFloat(venue.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      totalLat += lat;
      totalLng += lng;
      validCount++;
    }
  });

  if (validCount === 0) return null;

  return {
    latitude: totalLat / validCount,
    longitude: totalLng / validCount
  };
}

// Known city centers for comparison (approximate)
const knownCityCenters = {
  'London': { lat: 51.5074, lng: -0.1278 },
  'Birmingham': { lat: 52.4862, lng: -1.8904 },
  'Manchester': { lat: 53.4808, lng: -2.2426 },
  'Liverpool': { lat: 53.4084, lng: -2.9916 },
  'Newcastle Upon Tyne': { lat: 54.9783, lng: -1.6174 },
  'Leeds': { lat: 53.8008, lng: -1.5491 },
  'Sheffield': { lat: 53.3811, lng: -1.4701 },
  'Bristol': { lat: 51.4545, lng: -2.5879 },
  'Edinburgh': { lat: 55.9533, lng: -3.1883 },
  'Glasgow': { lat: 55.8642, lng: -4.2518 },
  'Cardiff': { lat: 51.4816, lng: -3.1791 },
  'Belfast': { lat: 54.5973, lng: -5.9301 }
};

async function verifyMapCenteringAndDistances() {
  console.log('🗺️  Verifying Map Centering and Distance Calculations\n');
  console.log('=' .repeat(70));

  try {
    // Get all simulator venues grouped by city
    const { data: allVenues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, city, address, latitude, longitude')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    // Group venues by city
    const citiesByName = {};
    allVenues.forEach(venue => {
      if (!citiesByName[venue.city]) {
        citiesByName[venue.city] = [];
      }
      citiesByName[venue.city].push(venue);
    });

    console.log(`📊 Analyzing map centering for ${Object.keys(citiesByName).length} cities...\n`);

    const centeringIssues = [];
    const distanceIssues = [];
    const cities = Object.keys(citiesByName).sort();

    // Test map centering for each city
    for (const cityName of cities) {
      const venues = citiesByName[cityName];
      const venueCount = venues.length;

      console.log(`📍 ${cityName} (${venueCount} venue${venueCount === 1 ? '' : 's'}):`);

      // Calculate the center point based on venue locations
      const calculatedCenter = calculateCityCenter(venues);

      if (!calculatedCenter) {
        console.log('   ❌ Cannot calculate center - no valid coordinates');
        centeringIssues.push({
          city: cityName,
          issue: 'No valid coordinates for center calculation',
          severity: 'high'
        });
        continue;
      }

      console.log(`   🎯 Calculated map center: ${calculatedCenter.latitude.toFixed(6)}, ${calculatedCenter.longitude.toFixed(6)}`);

      // Compare with known city center if available
      const knownCenter = knownCityCenters[cityName];
      if (knownCenter) {
        const distanceFromKnown = calculateDistance(
          calculatedCenter.latitude,
          calculatedCenter.longitude,
          knownCenter.lat,
          knownCenter.lng
        );

        console.log(`   📏 Distance from known city center: ${distanceFromKnown.toFixed(2)} miles`);

        if (distanceFromKnown > 10) {
          console.log(`   ⚠️  Map center may be too far from actual city center`);
          centeringIssues.push({
            city: cityName,
            issue: `Calculated center ${distanceFromKnown.toFixed(2)} miles from known city center`,
            calculatedCenter: calculatedCenter,
            knownCenter: knownCenter,
            severity: 'medium'
          });
        } else {
          console.log(`   ✅ Map centering looks good`);
        }
      }

      // Check distance spread of venues (for zoom level assessment)
      if (venues.length > 1) {
        let maxDistance = 0;
        let minDistance = Infinity;
        const distances = [];

        for (let i = 0; i < venues.length; i++) {
          for (let j = i + 1; j < venues.length; j++) {
            const venue1 = venues[i];
            const venue2 = venues[j];

            const lat1 = parseFloat(venue1.latitude);
            const lng1 = parseFloat(venue1.longitude);
            const lat2 = parseFloat(venue2.latitude);
            const lng2 = parseFloat(venue2.longitude);

            if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
              const distance = calculateDistance(lat1, lng1, lat2, lng2);
              distances.push(distance);
              maxDistance = Math.max(maxDistance, distance);
              minDistance = Math.min(minDistance, distance);
            }
          }
        }

        if (distances.length > 0) {
          console.log(`   📐 Venue spread: ${minDistance.toFixed(2)} - ${maxDistance.toFixed(2)} miles apart`);

          if (maxDistance > 20) {
            console.log(`   ⚠️  Large venue spread - map zoom may need adjustment`);
            centeringIssues.push({
              city: cityName,
              issue: `Large venue spread (${maxDistance.toFixed(2)} miles) may affect zoom level`,
              maxDistance: maxDistance,
              severity: 'low'
            });
          }
        }
      }

      console.log('');
    }

    // Test distance calculations for sample venues
    console.log('🧮 Testing distance calculations for sample venues...\n');

    // Test with known coordinates
    const testDistances = [
      {
        name: 'London to Birmingham',
        lat1: 51.5074, lng1: -0.1278,  // London
        lat2: 52.4862, lng2: -1.8904,  // Birmingham
        expectedDistance: 101 // approximately 101 miles
      },
      {
        name: 'Manchester to Liverpool',
        lat1: 53.4808, lng1: -2.2426,  // Manchester
        lat2: 53.4084, lng2: -2.9916,  // Liverpool
        expectedDistance: 31 // approximately 31 miles
      },
      {
        name: 'Edinburgh to Glasgow',
        lat1: 55.9533, lng1: -3.1883,  // Edinburgh
        lat2: 55.8642, lng2: -4.2518,  // Glasgow
        expectedDistance: 42 // approximately 42 miles
      }
    ];

    for (const test of testDistances) {
      const calculatedDistance = calculateDistance(test.lat1, test.lng1, test.lat2, test.lng2);
      const difference = Math.abs(calculatedDistance - test.expectedDistance);
      const percentError = (difference / test.expectedDistance) * 100;

      console.log(`📏 ${test.name}:`);
      console.log(`   Expected: ~${test.expectedDistance} miles`);
      console.log(`   Calculated: ${calculatedDistance.toFixed(2)} miles`);
      console.log(`   Error: ${difference.toFixed(2)} miles (${percentError.toFixed(1)}%)`);

      if (percentError > 5) {
        console.log(`   ⚠️  Distance calculation may have issues`);
        distanceIssues.push({
          test: test.name,
          expected: test.expectedDistance,
          calculated: calculatedDistance,
          error: percentError
        });
      } else {
        console.log(`   ✅ Distance calculation looks accurate`);
      }
      console.log('');
    }

    // Test actual venue distances
    console.log('🎯 Testing distances for sample venue pairs...\n');

    // Get a few sample venues for distance testing
    const sampleCities = ['London', 'Manchester', 'Birmingham'].filter(city => citiesByName[city]);

    for (const cityName of sampleCities) {
      const cityVenues = citiesByName[cityName];
      if (cityVenues.length >= 2) {
        const venue1 = cityVenues[0];
        const venue2 = cityVenues[1];

        const lat1 = parseFloat(venue1.latitude);
        const lng1 = parseFloat(venue1.longitude);
        const lat2 = parseFloat(venue2.latitude);
        const lng2 = parseFloat(venue2.longitude);

        if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
          const distance = calculateDistance(lat1, lng1, lat2, lng2);

          console.log(`📍 ${cityName} venue distance test:`);
          console.log(`   ${venue1.name} → ${venue2.name}`);
          console.log(`   Distance: ${distance.toFixed(2)} miles`);

          // Check if distance seems reasonable for same city
          if (distance > 15) {
            console.log(`   ⚠️  Distance seems large for same city - check coordinates`);
            distanceIssues.push({
              city: cityName,
              venue1: venue1.name,
              venue2: venue2.name,
              distance: distance,
              issue: 'Large distance between venues in same city'
            });
          } else {
            console.log(`   ✅ Distance looks reasonable`);
          }
          console.log('');
        }
      }
    }

    // Summary and recommendations
    console.log('📊 MAP CENTERING AND DISTANCE ANALYSIS SUMMARY:');
    console.log('=' .repeat(60));

    console.log(`Cities analyzed: ${cities.length}`);
    console.log(`Map centering issues: ${centeringIssues.length}`);
    console.log(`Distance calculation issues: ${distanceIssues.length}`);

    if (centeringIssues.length > 0) {
      console.log('\n🗺️ MAP CENTERING ISSUES:');
      centeringIssues.forEach(issue => {
        console.log(`   • ${issue.city}: ${issue.issue}`);
        if (issue.calculatedCenter && issue.knownCenter) {
          console.log(`     Calculated: ${issue.calculatedCenter.latitude.toFixed(4)}, ${issue.calculatedCenter.longitude.toFixed(4)}`);
          console.log(`     Expected: ${issue.knownCenter.lat.toFixed(4)}, ${issue.knownCenter.lng.toFixed(4)}`);
        }
      });
    }

    if (distanceIssues.length > 0) {
      console.log('\n📏 DISTANCE CALCULATION ISSUES:');
      distanceIssues.forEach(issue => {
        if (issue.test) {
          console.log(`   • ${issue.test}: ${issue.error.toFixed(1)}% error`);
        } else {
          console.log(`   • ${issue.city}: ${issue.issue} (${issue.distance.toFixed(2)} miles)`);
        }
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:\n');

    if (centeringIssues.length === 0 && distanceIssues.length === 0) {
      console.log('🎉 EXCELLENT: Map centering and distance calculations are accurate!');
      console.log('   • City page maps should center correctly on venue clusters');
      console.log('   • Distance measurements should be precise');
      console.log('   • No adjustments needed');
    } else {
      if (centeringIssues.length > 0) {
        console.log('🗺️ MAP CENTERING IMPROVEMENTS:');
        console.log('   • Review venue coordinates for cities with large center offsets');
        console.log('   • Consider manual center point overrides for problematic cities');
        console.log('   • Adjust map zoom levels for cities with large venue spreads');
      }

      if (distanceIssues.length > 0) {
        console.log('📏 DISTANCE CALCULATION IMPROVEMENTS:');
        console.log('   • Verify Haversine formula implementation');
        console.log('   • Check coordinate precision in database');
        console.log('   • Consider using more accurate distance calculation libraries');
      }
    }

    console.log('\n📱 TESTING CHECKLIST:');
    console.log('□ Visit city pages and verify map centers on venue cluster');
    console.log('□ Check zoom level is appropriate for venue spread');
    console.log('□ Test distance measurements between venues');
    console.log('□ Verify "distance from" calculations are accurate');
    console.log('□ Check mobile map centering and zoom');

  } catch (error) {
    console.error('❌ Error during map and distance verification:', error.message);
  }
}

verifyMapCenteringAndDistances().catch(console.error);