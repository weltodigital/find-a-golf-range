const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function checkFinalResults() {
  console.log('📊 Checking Final Coordinate Update Results\n');

  try {
    // Get count of simulators WITH coordinates
    const { count: withCoordinates } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator'])
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Get count of simulators WITHOUT coordinates
    const { count: withoutCoordinates } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator'])
      .is('latitude', null);

    // Get total count
    const { count: total } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator']);

    console.log('🎯 FINAL RESULTS:');
    console.log('=' .repeat(50));
    console.log(`Total Indoor Simulator venues: ${total}`);
    console.log(`✅ WITH coordinates: ${withCoordinates}`);
    console.log(`❌ WITHOUT coordinates: ${withoutCoordinates}`);
    console.log(`📈 Coverage: ${total ? Math.round((withCoordinates / total) * 100) : 0}%`);

    // Show some examples of updated venues
    const { data: sampleUpdated, error } = await supabase
      .from('golf_ranges')
      .select('name, latitude, longitude, city, updated_at')
      .contains('special_features', ['Indoor Simulator'])
      .not('latitude', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (!error && sampleUpdated.length > 0) {
      console.log('\n✅ Recently Updated Venues (Sample):');
      console.log('=' .repeat(50));
      sampleUpdated.forEach((venue, index) => {
        const updatedDate = new Date(venue.updated_at).toLocaleDateString();
        console.log(`${index + 1}. ${venue.name}`);
        console.log(`   📍 ${venue.city}: ${venue.latitude}, ${venue.longitude}`);
        console.log(`   📅 Updated: ${updatedDate}`);
        console.log('');
      });
    }

    // Show venues that still need coordinates
    const { data: stillNeedCoords, error: needError } = await supabase
      .from('golf_ranges')
      .select('name, city')
      .contains('special_features', ['Indoor Simulator'])
      .is('latitude', null)
      .limit(10);

    if (!needError && stillNeedCoords.length > 0) {
      console.log('❌ Venues Still Needing Coordinates (Sample):');
      console.log('=' .repeat(50));
      stillNeedCoords.forEach((venue, index) => {
        console.log(`${index + 1}. ${venue.name} (${venue.city || 'Unknown city'})`);
      });
      console.log('');
    }

    // Summary
    console.log('📋 SUMMARY:');
    console.log('=' .repeat(50));
    if (withCoordinates > 0) {
      console.log(`🎉 Successfully updated ${withCoordinates} venues with precise coordinates!`);
      console.log(`📍 These venues can now be displayed accurately on maps.`);
    }
    if (withoutCoordinates > 0) {
      console.log(`⚠️  ${withoutCoordinates} venues still need coordinates.`);
      console.log(`💡 These may need manual coordinate lookup or name matching.`);
    }

  } catch (error) {
    console.error('❌ Error checking results:', error.message);
  }
}

checkFinalResults().catch(console.error);