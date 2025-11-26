const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function checkBasingstoke() {
  try {
    console.log('🔍 Checking Basingstoke ranges in database...\n');

    const { data, error } = await supabase
      .from('golf_ranges')
      .select('name, city, county, address, latitude, longitude')
      .eq('city', 'Basingstoke');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data.length} ranges for Basingstoke:\n`);
    data.forEach(range => {
      console.log(`📍 ${range.name}`);
      console.log(`   City: ${range.city}`);
      console.log(`   County: ${range.county}`);
      console.log(`   Address: ${range.address || 'Missing'}`);
      console.log(`   Coordinates: ${range.latitude || 'Missing'}, ${range.longitude || 'Missing'}`);
      console.log('');
    });

    // Also check for ranges that might be near Basingstoke but listed under different cities
    const { data: nearbyData, error: nearbyError } = await supabase
      .from('golf_ranges')
      .select('name, city, county, address')
      .eq('county', 'Hampshire');

    if (!nearbyError && nearbyData.length > 0) {
      console.log('\n📍 Other ranges in Hampshire:');
      nearbyData.forEach(range => {
        if (range.city !== 'Basingstoke') {
          console.log(`   ${range.name} - ${range.city}, ${range.county}`);
        }
      });
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkBasingstoke().catch(console.error);