const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function debugAltonRanges() {
  try {
    console.log('🔍 Debugging Alton page range filtering...\n');

    const { data: allData, error } = await supabase
      .from('golf_ranges')
      .select('name, city, county, address, latitude, longitude')
      .gt('latitude', 0)
      .order('name');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Total UK ranges in database: ${allData.length}`);

    // Apply the same filter as the Alton page
    const altonRanges = allData.filter(range =>
      range.city?.toLowerCase() === 'alton' ||
      range.address?.toLowerCase().includes('alton')
    );

    console.log(`\nRanges that should show on Alton page: ${altonRanges.length}`);
    altonRanges.forEach(range => {
      console.log(`   - ${range.name} (${range.city}): ${range.address || 'No address'}`);
    });

    // Check for ranges that might match 'alton' in unexpected ways
    const addressMatches = allData.filter(range =>
      range.address?.toLowerCase().includes('alton') && range.city?.toLowerCase() !== 'alton'
    );

    if (addressMatches.length > 0) {
      console.log(`\n⚠️  Ranges with 'alton' in address but not in Alton city:`);
      addressMatches.forEach(range => {
        console.log(`   - ${range.name} (${range.city}): ${range.address}`);
      });
    }

    // Calculate distances to see what's happening
    const ALTON_CENTER = { lat: 51.150719, lng: -0.973177 };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    console.log(`\nCalculating distances from Alton center (${ALTON_CENTER.lat}, ${ALTON_CENTER.lng}):`);
    const rangesWithDistances = altonRanges.map(range => {
      let distance = 0;
      if (range.latitude && range.longitude) {
        distance = Math.round(calculateDistance(
          ALTON_CENTER.lat,
          ALTON_CENTER.lng,
          range.latitude,
          range.longitude
        ) * 10) / 10;
      }
      return { ...range, distance };
    });

    rangesWithDistances.forEach(range => {
      console.log(`   ${range.name}: ${range.distance} miles`);
    });

    const avgDistance = rangesWithDistances.length > 0 ?
      rangesWithDistances.reduce((sum, range) => sum + range.distance, 0) / rangesWithDistances.length :
      0;

    console.log(`\nAverage distance should be: ${avgDistance.toFixed(1)} miles`);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

debugAltonRanges().catch(console.error);