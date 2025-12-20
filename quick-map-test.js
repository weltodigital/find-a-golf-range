const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function quickMapTest() {
  try {
    console.log('🧪 Quick Map and Distance Test');
    console.log('====================================');

    // Test database connection
    const { data, error, count } = await supabase
      .from('golf_ranges')
      .select('name', { count: 'exact' })
      .contains('special_features', ['Indoor Simulator'])
      .limit(1);

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log(`✅ Database connected. Found ${count} simulator venues total.\n`);

    // Test a few specific cities that should have good map centering
    const testCities = ['London', 'Manchester', 'Bristol'];

    for (const city of testCities) {
      console.log(`📍 Testing: ${city}`);

      const { data: venues, error: venueError } = await supabase
        .from('golf_ranges')
        .select('name, latitude, longitude')
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator']);

      if (venueError) {
        console.log(`   ❌ Error: ${venueError.message}`);
        continue;
      }

      if (venues.length === 0) {
        console.log(`   ⚠️  No venues found`);
        continue;
      }

      console.log(`   📊 Found ${venues.length} venues:`);

      let validCoords = 0;
      let totalLat = 0;
      let totalLng = 0;

      venues.forEach((venue, index) => {
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);

        console.log(`      ${index + 1}. ${venue.name}`);

        if (isNaN(lat) || isNaN(lng)) {
          console.log(`         ❌ Invalid coordinates: ${venue.latitude}, ${venue.longitude}`);
        } else {
          console.log(`         ✅ Valid: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          totalLat += lat;
          totalLng += lng;
          validCoords++;
        }
      });

      if (validCoords > 0) {
        const centerLat = totalLat / validCoords;
        const centerLng = totalLng / validCoords;
        console.log(`   🎯 Map should center at: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);

        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        console.log(`   🔗 City page: https://www.findagolfrange.com/simulators/uk/${citySlug}`);

        // Test individual venue page
        if (venues.length > 0) {
          const venue = venues[0];
          const venueSlug = venue.name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
          console.log(`   🏠 Sample venue: https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`);
        }
      } else {
        console.log(`   ❌ No valid coordinates for map centering`);
      }

      console.log('');
    }

    console.log('✅ Quick test complete. If coordinates look good, individual pages should work.');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

quickMapTest();