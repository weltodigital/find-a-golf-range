const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function checkTamworthVenues() {
  console.log('🔍 CHECKING TAMWORTH VENUES AND MAP CENTERING');
  console.log('='.repeat(60));

  try {
    // Check for Tamworth venues
    const { data: tamworthVenues, error } = await supabase
      .from('golf_ranges')
      .select('name, city, latitude, longitude, address')
      .ilike('city', '%tamworth%')
      .contains('special_features', ['Indoor Simulator']);

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log(`📊 Found ${tamworthVenues.length} venues matching "Tamworth":\n`);

    if (tamworthVenues.length === 0) {
      console.log('⚠️  No venues found with "Tamworth" in city name');
      console.log('Let me check for similar city names...\n');

      // Check for similar names
      const { data: allCities, error: cityError } = await supabase
        .from('golf_ranges')
        .select('city')
        .contains('special_features', ['Indoor Simulator']);

      if (!cityError) {
        const uniqueCities = [...new Set(allCities.map(v => v.city))];
        const tamworthLike = uniqueCities.filter(city =>
          city.toLowerCase().includes('tam') ||
          city.toLowerCase().includes('worth')
        );

        console.log('🔍 Cities containing "tam" or "worth":');
        tamworthLike.forEach(city => console.log(`   • ${city}`));
      }
    } else {
      // Tamworth city center coordinates (approximate)
      const tamworthCenter = { lat: 52.6336, lng: -1.6910 };

      tamworthVenues.forEach((venue, index) => {
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);

        console.log(`${index + 1}. ${venue.name}`);
        console.log(`   City: ${venue.city}`);
        console.log(`   Address: ${venue.address}`);
        console.log(`   Coordinates: ${lat}, ${lng}`);

        if (!isNaN(lat) && !isNaN(lng)) {
          const distanceFromCenter = calculateDistance(
            lat, lng, tamworthCenter.lat, tamworthCenter.lng
          );

          console.log(`   Distance from Tamworth center: ${distanceFromCenter.toFixed(2)} miles`);

          if (distanceFromCenter > 20) {
            console.log(`   ⚠️  This seems far from Tamworth center - verify coordinates`);
          } else {
            console.log(`   ✅ Distance looks reasonable for Tamworth`);
          }
        } else {
          console.log(`   ❌ Invalid coordinates`);
        }

        console.log('');
      });

      if (tamworthVenues.length > 0) {
        // Calculate map center for Tamworth page
        let totalLat = 0;
        let totalLng = 0;
        let validCount = 0;

        tamworthVenues.forEach(venue => {
          const lat = parseFloat(venue.latitude);
          const lng = parseFloat(venue.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            totalLat += lat;
            totalLng += lng;
            validCount++;
          }
        });

        if (validCount > 0) {
          const centerLat = totalLat / validCount;
          const centerLng = totalLng / validCount;

          console.log('🎯 TAMWORTH PAGE MAP CENTERING:');
          console.log('='.repeat(40));
          console.log(`Map should center at: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
          console.log(`Tamworth actual center: ${tamworthCenter.lat}, ${tamworthCenter.lng}`);

          const centerDistance = calculateDistance(
            centerLat, centerLng, tamworthCenter.lat, tamworthCenter.lng
          );

          console.log(`Distance from actual Tamworth center: ${centerDistance.toFixed(2)} miles`);

          if (centerDistance < 5) {
            console.log('✅ Map centering looks correct for Tamworth');
          } else {
            console.log('⚠️  Map center may be off - should be closer to Tamworth');
          }

          console.log('\n📍 DISTANCE CALCULATIONS:');
          console.log('Distances should be calculated FROM Tamworth center TO each venue:');
          tamworthVenues.forEach(venue => {
            const lat = parseFloat(venue.latitude);
            const lng = parseFloat(venue.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              const distance = calculateDistance(
                tamworthCenter.lat, tamworthCenter.lng, lat, lng
              );
              console.log(`• ${venue.name}: ${distance.toFixed(1)} miles from Tamworth center`);
            }
          });
        }
      }
    }

    console.log('\n🔧 FRONTEND MAP ISSUE:');
    console.log('The problem you\'re seeing suggests the frontend is:');
    console.log('❌ Using London as default center instead of calculating city center');
    console.log('❌ Calculating distances from London instead of from city center');
    console.log('\n✅ SOLUTION NEEDED:');
    console.log('Frontend code needs to:');
    console.log('1. Calculate map center based on venue coordinates in each city');
    console.log('2. Calculate distances from the actual city center, not London');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTamworthVenues();