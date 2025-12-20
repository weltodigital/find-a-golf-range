const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Accurate distance calculation function (Haversine formula)
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

async function testDistanceFromAccuracy() {
  console.log('📏 Testing "Distance From" Calculation Accuracy\n');
  console.log('=' .repeat(60));

  try {
    // Get all venues
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('name, city, latitude, longitude, address')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    console.log(`📊 Testing distance calculations for ${venues.length} venues...\n`);

    // Test 1: Known accurate distances between major cities
    console.log('🧮 Test 1: Verifying calculation accuracy with known distances:\n');

    const knownDistances = [
      {
        name: 'London to Manchester',
        lat1: 51.5074, lng1: -0.1278,  // London center
        lat2: 53.4808, lng2: -2.2426,  // Manchester center
        expected: 163 // miles (verified)
      },
      {
        name: 'Birmingham to Leeds',
        lat1: 52.4862, lng1: -1.8904,  // Birmingham center
        lat2: 53.8008, lng2: -1.5491,  // Leeds center
        expected: 95 // miles (verified)
      },
      {
        name: 'Bristol to Cardiff',
        lat1: 51.4545, lng1: -2.5879,  // Bristol center
        lat2: 51.4816, lng2: -3.1791,  // Cardiff center
        expected: 26 // miles (verified)
      }
    ];

    let calculationAccurate = true;

    for (const test of knownDistances) {
      const calculated = calculateDistance(test.lat1, test.lng1, test.lat2, test.lng2);
      const difference = Math.abs(calculated - test.expected);
      const percentError = (difference / test.expected) * 100;

      console.log(`📏 ${test.name}:`);
      console.log(`   Expected: ${test.expected} miles`);
      console.log(`   Calculated: ${calculated.toFixed(2)} miles`);
      console.log(`   Error: ${difference.toFixed(2)} miles (${percentError.toFixed(1)}%)`);

      if (percentError > 3) {
        console.log(`   ❌ Error too high`);
        calculationAccurate = false;
      } else if (percentError < 1) {
        console.log(`   ✅ Excellent accuracy`);
      } else {
        console.log(`   ✅ Good accuracy`);
      }
      console.log('');
    }

    // Test 2: Sample venue-to-venue distance calculations
    console.log('🎯 Test 2: Sample venue distance calculations:\n');

    const testPairs = [
      // London venues
      { city: 'London', venue1: 'Pitch Soho', venue2: 'Urban Golf' },
      { city: 'London', venue1: 'Grip Golf', venue2: 'Tee Box Leadenhall' },

      // Manchester area
      { city: 'Manchester', venue1: 'Pitch Manchester', venue2: null }, // Will find nearest

      // Bristol area
      { city: 'Bristol', venue1: 'GolfBox Bristol', venue2: 'inPlayGolf - Bristol' },

      // Multi-venue cities
      { city: 'Southend On Sea', venue1: 'Golf.One', venue2: 'Bunker 19' },
      { city: 'Swindon', venue1: 'Swindon Indoor Golf Centre', venue2: '1 Fore 7' }
    ];

    for (const testPair of testPairs) {
      console.log(`📍 Testing distances in ${testPair.city}:`);

      // Get venues for this city
      const cityVenues = venues.filter(v => v.city === testPair.city);

      if (cityVenues.length === 0) {
        console.log(`   ❌ No venues found in ${testPair.city}`);
        continue;
      }

      const venue1 = cityVenues.find(v => v.name === testPair.venue1);

      if (!venue1) {
        console.log(`   ❌ Venue "${testPair.venue1}" not found`);
        continue;
      }

      let venue2;
      if (testPair.venue2) {
        venue2 = cityVenues.find(v => v.name === testPair.venue2);
        if (!venue2) {
          console.log(`   ❌ Venue "${testPair.venue2}" not found`);
          continue;
        }
      } else {
        // Find nearest venue
        venue2 = cityVenues.find(v => v.name !== venue1.name);
      }

      if (!venue2) {
        console.log(`   ⚠️  Only one venue in ${testPair.city}`);
        continue;
      }

      const lat1 = parseFloat(venue1.latitude);
      const lng1 = parseFloat(venue1.longitude);
      const lat2 = parseFloat(venue2.latitude);
      const lng2 = parseFloat(venue2.longitude);

      if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        console.log(`   ❌ Invalid coordinates for distance calculation`);
        continue;
      }

      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      console.log(`   📏 ${venue1.name} → ${venue2.name}: ${distance.toFixed(2)} miles`);

      // Sanity checks
      if (distance < 0.01) {
        console.log(`      ⚠️  Venues very close or duplicate coordinates`);
      } else if (distance > 20) {
        console.log(`      ⚠️  Large distance for same city - verify coordinates`);
      } else {
        console.log(`      ✅ Distance looks reasonable for same city`);
      }

      console.log('');
    }

    // Test 3: Distance from venue to major city centers
    console.log('🌍 Test 3: Sample distances from venues to major cities:\n');

    const majorCities = {
      'London': { lat: 51.5074, lng: -0.1278 },
      'Birmingham': { lat: 52.4862, lng: -1.8904 },
      'Manchester': { lat: 53.4808, lng: -2.2426 },
      'Leeds': { lat: 53.8008, lng: -1.5491 },
      'Liverpool': { lat: 53.4084, lng: -2.9916 }
    };

    // Test a few sample venues
    const sampleVenues = venues.slice(0, 8);

    for (const venue of sampleVenues) {
      const venueLat = parseFloat(venue.latitude);
      const venueLng = parseFloat(venue.longitude);

      if (isNaN(venueLat) || isNaN(venueLng)) continue;

      console.log(`📍 ${venue.name} (${venue.city}):`);

      // Calculate distance to all major cities, find closest
      const distancesToCities = Object.entries(majorCities).map(([cityName, coords]) => ({
        city: cityName,
        distance: calculateDistance(venueLat, venueLng, coords.lat, coords.lng)
      })).sort((a, b) => a.distance - b.distance);

      // Show nearest city and a couple others for context
      distancesToCities.slice(0, 3).forEach((cityDist, index) => {
        const prefix = index === 0 ? '   🎯 Nearest:' : '   📍';
        console.log(`${prefix} ${cityDist.distance.toFixed(1)} miles from ${cityDist.city}`);
      });

      console.log('');
    }

    // Summary and recommendations
    console.log('📊 DISTANCE CALCULATION SUMMARY:');
    console.log('=' .repeat(50));

    if (calculationAccurate) {
      console.log('✅ EXCELLENT: Distance calculations are highly accurate!');
      console.log('   • Haversine formula implementation is correct');
      console.log('   • "Distance from" features will be precise');
      console.log('   • Venue-to-venue distances are reliable');
    } else {
      console.log('⚠️  Distance calculation accuracy needs improvement');
      console.log('   • Check Haversine formula implementation');
      console.log('   • Verify coordinate precision in database');
    }

    console.log('\n💡 IMPLEMENTATION RECOMMENDATIONS:');
    console.log('• Display distances to 1 decimal place (e.g., "5.2 miles")');
    console.log('• Use "Distance from your location" if user location available');
    console.log('• Show distances to nearest major cities for context');
    console.log('• Consider showing travel time estimates alongside distance');

    console.log('\n🔧 FRONTEND IMPLEMENTATION:');
    console.log('```typescript');
    console.log('// Use this exact function for "distance from" calculations');
    console.log('export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {');
    console.log('  const R = 3959; // Earth\'s radius in miles');
    console.log('  const dLat = (lat2 - lat1) * Math.PI / 180;');
    console.log('  const dLng = (lng2 - lng1) * Math.PI / 180;');
    console.log('  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +');
    console.log('            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *');
    console.log('            Math.sin(dLng / 2) * Math.sin(dLng / 2);');
    console.log('  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));');
    console.log('  return R * c;');
    console.log('}');
    console.log('```');

  } catch (error) {
    console.error('❌ Error during distance calculation testing:', error.message);
  }
}

testDistanceFromAccuracy().catch(console.error);