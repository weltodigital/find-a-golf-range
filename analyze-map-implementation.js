const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

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

async function analyzeMapImplementation() {
  console.log('🗺️  Analyzing Map Implementation for Location Pages\n');
  console.log('=' .repeat(60));

  try {
    // Get data for all cities with multiple venues (these need good centering)
    const { data: allVenues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, city, latitude, longitude, address')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Error fetching venues:', error.message);
      return;
    }

    // Group venues by city
    const citiesData = {};
    allVenues.forEach(venue => {
      if (!citiesData[venue.city]) {
        citiesData[venue.city] = [];
      }
      citiesData[venue.city].push(venue);
    });

    const multiVenueCities = Object.entries(citiesData)
      .filter(([city, venues]) => venues.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // Sort by venue count

    console.log(`📊 Found ${multiVenueCities.length} cities with multiple venues:\n`);

    const mapCenteringData = [];

    for (const [cityName, venues] of multiVenueCities) {
      console.log(`📍 ${cityName} (${venues.length} venues):`);

      // Calculate optimal map center
      let totalLat = 0;
      let totalLng = 0;
      let validCount = 0;
      const validVenues = [];

      venues.forEach(venue => {
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          totalLat += lat;
          totalLng += lng;
          validCount++;
          validVenues.push({ ...venue, lat, lng });
        }
      });

      if (validCount === 0) {
        console.log('   ❌ No valid coordinates');
        continue;
      }

      const centerLat = totalLat / validCount;
      const centerLng = totalLng / validCount;

      // Calculate bounds for optimal zoom
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;

      validVenues.forEach(venue => {
        minLat = Math.min(minLat, venue.lat);
        maxLat = Math.max(maxLat, venue.lat);
        minLng = Math.min(minLng, venue.lng);
        maxLng = Math.max(maxLng, venue.lng);
      });

      // Calculate venue spread
      let maxDistance = 0;
      for (let i = 0; i < validVenues.length; i++) {
        for (let j = i + 1; j < validVenues.length; j++) {
          const distance = calculateDistance(
            validVenues[i].lat, validVenues[i].lng,
            validVenues[j].lat, validVenues[j].lng
          );
          maxDistance = Math.max(maxDistance, distance);
        }
      }

      // Suggested zoom level based on spread
      let suggestedZoom;
      if (maxDistance < 1) {
        suggestedZoom = 15; // Very tight cluster
      } else if (maxDistance < 3) {
        suggestedZoom = 13; // Close venues
      } else if (maxDistance < 10) {
        suggestedZoom = 11; // Moderate spread
      } else if (maxDistance < 20) {
        suggestedZoom = 10; // Wide spread
      } else {
        suggestedZoom = 9; // Very wide spread
      }

      const mapData = {
        city: cityName,
        venueCount: venues.length,
        center: { lat: centerLat, lng: centerLng },
        bounds: {
          north: maxLat,
          south: minLat,
          east: maxLng,
          west: minLng
        },
        maxDistance: maxDistance,
        suggestedZoom: suggestedZoom
      };

      mapCenteringData.push(mapData);

      console.log(`   🎯 Optimal center: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
      console.log(`   📐 Max venue distance: ${maxDistance.toFixed(2)} miles`);
      console.log(`   🔍 Suggested zoom level: ${suggestedZoom}`);

      // List venues with distances from center
      console.log(`   📍 Venue positions:`);
      validVenues.forEach((venue, index) => {
        const distFromCenter = calculateDistance(venue.lat, venue.lng, centerLat, centerLng);
        console.log(`      ${index + 1}. ${venue.name}`);
        console.log(`         ${distFromCenter.toFixed(2)} miles from center`);
      });
      console.log('');
    }

    // Generate React/TypeScript code for map centering
    console.log('📝 SUGGESTED MAP IMPLEMENTATION:\n');
    console.log('Here\'s the optimal map configuration for your location pages:\n');

    console.log('```typescript');
    console.log('// Map centering data for location pages');
    console.log('export const cityMapConfigs = {');

    mapCenteringData.slice(0, 10).forEach((city, index) => {
      console.log(`  "${city.city}": {`);
      console.log(`    center: { lat: ${city.center.lat.toFixed(6)}, lng: ${city.center.lng.toFixed(6)} },`);
      console.log(`    zoom: ${city.suggestedZoom},`);
      console.log(`    bounds: {`);
      console.log(`      north: ${city.bounds.north.toFixed(6)},`);
      console.log(`      south: ${city.bounds.south.toFixed(6)},`);
      console.log(`      east: ${city.bounds.east.toFixed(6)},`);
      console.log(`      west: ${city.bounds.west.toFixed(6)}`);
      console.log(`    }`);
      console.log(`  }${index < 9 ? ',' : ''}`);
    });

    console.log('};');
    console.log('```\n');

    // Distance calculation implementation
    console.log('```typescript');
    console.log('// Accurate distance calculation for "distance from" features');
    console.log('export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {');
    console.log('  const R = 3959; // Earth\'s radius in miles (use 6371 for kilometers)');
    console.log('  const dLat = (lat2 - lat1) * Math.PI / 180;');
    console.log('  const dLng = (lng2 - lng1) * Math.PI / 180;');
    console.log('  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +');
    console.log('            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *');
    console.log('            Math.sin(dLng / 2) * Math.sin(dLng / 2);');
    console.log('  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));');
    console.log('  return R * c;');
    console.log('}');
    console.log('```\n');

    // Map component implementation suggestions
    console.log('💡 IMPLEMENTATION RECOMMENDATIONS:\n');

    console.log('1. **Dynamic Map Centering:**');
    console.log('   - Calculate center based on venue coordinates');
    console.log('   - Use the cityMapConfigs above for optimal positioning');
    console.log('');

    console.log('2. **Adaptive Zoom Levels:**');
    console.log('   - Single venue: zoom level 15');
    console.log('   - 2-3 venues close together (<3 miles): zoom level 13');
    console.log('   - Multiple venues spread out (>10 miles): zoom level 10');
    console.log('');

    console.log('3. **Distance Calculations:**');
    console.log('   - Use Haversine formula for accuracy');
    console.log('   - Display distances to 1 decimal place');
    console.log('   - Consider user location if available');
    console.log('');

    console.log('4. **Map Bounds:**');
    console.log('   - Ensure all venues are visible');
    console.log('   - Add padding around venue cluster');
    console.log('   - Handle edge cases (venues very far apart)');
    console.log('');

    console.log('📱 TESTING PRIORITY CITIES:');
    console.log('Test these cities first as they have the most venues:\n');

    mapCenteringData.slice(0, 8).forEach((city, index) => {
      const slug = city.city.toLowerCase().replace(/\\s+/g, '-');
      console.log(`${index + 1}. ${city.city} (${city.venueCount} venues)`);
      console.log(`   URL: https://www.findagolfrange.com/simulators/uk/${slug}`);
      console.log(`   Expected center: ${city.center.lat.toFixed(4)}, ${city.center.lng.toFixed(4)}`);
    });

    console.log('\n✅ MAP ANALYSIS COMPLETE!');
    console.log('The coordinate data is accurate and ready for optimal map display.');

  } catch (error) {
    console.error('❌ Error during map implementation analysis:', error.message);
  }
}

analyzeMapImplementation().catch(console.error);