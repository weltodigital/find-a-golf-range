const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Function to validate coordinates
function isValidCoordinate(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Basic coordinate validation
  const isLatValid = !isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const isLngValid = !isNaN(longitude) && longitude >= -180 && longitude <= 180;

  // UK-specific coordinate check (rough bounds)
  const isInUK = latitude >= 49.8 && latitude <= 60.9 && longitude >= -8.2 && longitude <= 1.8;

  return {
    isValid: isLatValid && isLngValid,
    isInUK: isInUK,
    latitude: latitude,
    longitude: longitude
  };
}

// Function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to get rough city center coordinates for comparison
function getCityCenter(cityName) {
  const cityCoords = {
    'London': { lat: 51.5074, lng: -0.1278 },
    'Birmingham': { lat: 52.4797, lng: -1.9027 },
    'Manchester': { lat: 53.4795, lng: -2.2451 },
    'Glasgow': { lat: 55.8642, lng: -4.2518 },
    'Leeds': { lat: 53.7974, lng: -1.5438 },
    'Sheffield': { lat: 53.3811, lng: -1.4701 },
    'Edinburgh': { lat: 55.9533, lng: -3.1883 },
    'Liverpool': { lat: 53.4072, lng: -2.9917 },
    'Bristol': { lat: 51.4538, lng: -2.5973 },
    'Cardiff': { lat: 51.4816, lng: -3.1791 },
    'Newcastle': { lat: 54.9738, lng: -1.6132 },
    'Leicester': { lat: 52.6369, lng: -1.1398 },
    'Nottingham': { lat: 52.9548, lng: -1.1581 },
    'Belfast': { lat: 54.5973, lng: -5.9301 }
  };

  return cityCoords[cityName] || null;
}

async function verifySimulatorMapLocations() {
  console.log('🗺️  Verifying Indoor Simulator Map Locations\n');
  console.log('=' .repeat(60));

  try {
    // Get all indoor simulator venues
    const { data: simulators, error } = await supabase
      .from('golf_ranges')
      .select('*')
      .contains('special_features', ['Indoor Simulator'])
      .order('name');

    if (error) {
      console.error('❌ Error fetching simulators:', error.message);
      return;
    }

    console.log(`📊 Total Indoor Simulators: ${simulators.length}\n`);

    let validCoords = 0;
    let invalidCoords = 0;
    let outsideUK = 0;
    let suspiciousLocations = [];
    let perfectLocations = [];
    let cityStats = {};

    console.log('🔍 Analyzing Coordinates...\n');

    // Analyze each simulator
    for (const simulator of simulators) {
      const coords = isValidCoordinate(simulator.latitude, simulator.longitude);
      const city = simulator.city || 'Unknown';

      // Initialize city stats
      if (!cityStats[city]) {
        cityStats[city] = { total: 0, valid: 0, invalid: 0, outsideUK: 0 };
      }
      cityStats[city].total++;

      if (!coords.isValid) {
        invalidCoords++;
        cityStats[city].invalid++;
        console.log(`❌ ${simulator.name} (${city}): Invalid coordinates`);
        console.log(`   Lat: ${simulator.latitude}, Lng: ${simulator.longitude}`);
      } else if (!coords.isInUK) {
        outsideUK++;
        cityStats[city].outsideUK++;
        console.log(`🌍 ${simulator.name} (${city}): Outside UK bounds`);
        console.log(`   Lat: ${coords.latitude}, Lng: ${coords.longitude}`);
      } else {
        validCoords++;
        cityStats[city].valid++;

        // Check if location seems reasonable for the city
        const cityCenter = getCityCenter(city);
        if (cityCenter) {
          const distance = calculateDistance(
            coords.latitude, coords.longitude,
            cityCenter.lat, cityCenter.lng
          );

          if (distance > 50) { // More than 50 miles from city center
            suspiciousLocations.push({
              name: simulator.name,
              city: city,
              distance: Math.round(distance * 10) / 10,
              coordinates: `${coords.latitude}, ${coords.longitude}`
            });
          } else {
            perfectLocations.push({
              name: simulator.name,
              city: city,
              distance: Math.round(distance * 10) / 10,
              coordinates: `${coords.latitude}, ${coords.longitude}`
            });
          }
        }
      }
    }

    // Summary
    console.log('\n📈 COORDINATE ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Valid coordinates: ${validCoords}`);
    console.log(`❌ Invalid coordinates: ${invalidCoords}`);
    console.log(`🌍 Outside UK bounds: ${outsideUK}`);
    console.log(`📍 Accuracy rate: ${Math.round((validCoords / simulators.length) * 100)}%`);

    // City breakdown
    console.log('\n🏙️  COORDINATES BY CITY');
    console.log('=' .repeat(60));
    Object.entries(cityStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 15) // Top 15 cities
      .forEach(([city, stats]) => {
        const percentage = Math.round((stats.valid / stats.total) * 100);
        console.log(`${city.padEnd(20)} ${stats.valid}/${stats.total} (${percentage}%)`);
      });

    // Suspicious locations (too far from city center)
    if (suspiciousLocations.length > 0) {
      console.log('\n⚠️  SUSPICIOUS LOCATIONS (>50 miles from city center)');
      console.log('=' .repeat(60));
      suspiciousLocations
        .sort((a, b) => b.distance - a.distance)
        .slice(0, 10)
        .forEach(location => {
          console.log(`${location.name} (${location.city})`);
          console.log(`  Distance: ${location.distance} miles from city center`);
          console.log(`  Coords: ${location.coordinates}`);
          console.log('');
        });
    }

    // Perfect locations (reasonable distance from city center)
    if (perfectLocations.length > 0) {
      console.log('\n✅ SAMPLE VERIFIED LOCATIONS');
      console.log('=' .repeat(60));
      perfectLocations
        .slice(0, 10)
        .forEach(location => {
          console.log(`${location.name} (${location.city}) - ${location.distance} miles from center`);
        });
    }

    // Check map functionality
    console.log('\n🗺️  MAP FUNCTIONALITY VERIFICATION');
    console.log('=' .repeat(60));

    // Sample cities with simulators for map testing
    const sampleCities = Object.keys(cityStats)
      .filter(city => cityStats[city].valid > 0)
      .slice(0, 5);

    console.log('Map URLs to test manually:');
    sampleCities.forEach(city => {
      const slug = city.toLowerCase().replace(/\s+/g, '-');
      console.log(`• ${city}: http://localhost:3000/simulators/uk/${slug}`);
    });

    // Individual simulator page testing
    console.log('\nSample simulator pages to test:');
    const sampleSims = simulators
      .filter(s => s.latitude && s.longitude && s.slug)
      .slice(0, 5);

    sampleSims.forEach(sim => {
      const citySlug = (sim.city || 'london').toLowerCase().replace(/\s+/g, '-');
      console.log(`• ${sim.name}: http://localhost:3000/simulators/uk/${citySlug}/${sim.slug}`);
    });

    // Generate map validation report
    const report = {
      summary: {
        total: simulators.length,
        validCoords: validCoords,
        invalidCoords: invalidCoords,
        outsideUK: outsideUK,
        accuracyRate: Math.round((validCoords / simulators.length) * 100)
      },
      cityStats: cityStats,
      suspiciousLocations: suspiciousLocations,
      perfectLocations: perfectLocations.slice(0, 20),
      testUrls: {
        cityPages: sampleCities.map(city => ({
          city: city,
          url: `http://localhost:3000/simulators/uk/${city.toLowerCase().replace(/\s+/g, '-')}`
        })),
        simulatorPages: sampleSims.map(sim => ({
          name: sim.name,
          city: sim.city,
          url: `http://localhost:3000/simulators/uk/${(sim.city || 'london').toLowerCase().replace(/\s+/g, '-')}/${sim.slug}`
        }))
      },
      timestamp: new Date().toISOString()
    };

    // Save report
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/map-location-verification-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n💾 Detailed report saved to: map-location-verification-report.json');

    // Final recommendations
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('=' .repeat(60));

    if (invalidCoords === 0 && outsideUK === 0) {
      console.log('✅ All coordinates are valid and within UK bounds');
      console.log('✅ Maps should display all simulators correctly');
    } else {
      if (invalidCoords > 0) {
        console.log(`❌ ${invalidCoords} venues have invalid coordinates - need fixing`);
      }
      if (outsideUK > 0) {
        console.log(`🌍 ${outsideUK} venues have coordinates outside UK - verify accuracy`);
      }
    }

    if (suspiciousLocations.length > 0) {
      console.log(`⚠️  ${suspiciousLocations.length} locations are unusually far from their city centers`);
      console.log('   Consider manual verification of these coordinates');
    }

    console.log('\n🚀 NEXT STEPS');
    console.log('=' .repeat(60));
    console.log('1. Test the sample URLs above to verify map display');
    console.log('2. Check individual simulator pages show correct locations');
    console.log('3. Verify markers appear at reasonable distances from city centers');
    console.log('4. Test map zoom and pan functionality');
    console.log('5. Ensure popup information is accurate');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifySimulatorMapLocations().catch(console.error);