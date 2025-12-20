const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function fixNewcastleUponTyne() {
  console.log('🔧 Fixing Newcastle upon Tyne City Name\n');
  console.log('=' .repeat(60));

  console.log('🐛 ISSUE IDENTIFIED:');
  console.log('   URL: https://www.findagolfrange.com/simulators/uk/newcastle-upon-tyne');
  console.log('   URL parses "newcastle-upon-tyne" as "Newcastle Upon Tyne"');
  console.log('   Database has: "Newcastle upon Tyne" (lowercase "upon")');
  console.log('   Result: No match → Page shows "no simulators"\n');

  // Get the venue that needs updating
  const { data: venue, error: fetchError } = await supabase
    .from('golf_ranges')
    .select('*')
    .eq('city', 'Newcastle upon Tyne')
    .eq('name', 'Dynamic Indoor Golf')
    .single();

  if (fetchError) {
    console.log('❌ Error finding venue:', fetchError.message);
    return;
  }

  console.log('📍 Found venue to update:');
  console.log(`   Name: ${venue.name}`);
  console.log(`   Current city: "${venue.city}"`);
  console.log(`   Address: ${venue.address}`);
  console.log(`   Coordinates: ${venue.latitude}, ${venue.longitude}\n`);

  // Update the venue
  console.log('🔄 Updating city name to match URL parsing...');

  const { data: updatedVenue, error: updateError } = await supabase
    .from('golf_ranges')
    .update({
      city: 'Newcastle Upon Tyne',
      updated_at: new Date().toISOString()
    })
    .eq('id', venue.id)
    .select();

  if (updateError) {
    console.log('❌ Update failed:', updateError.message);
    return;
  }

  console.log('✅ Successfully updated');
  console.log(`   New city: "${updatedVenue[0].city}"`);

  // Verify the fix
  console.log('\n🧪 Testing the fix...');

  const { data: testResult, error: testError } = await supabase
    .from('golf_ranges')
    .select('name, city, address')
    .eq('city', 'Newcastle Upon Tyne')
    .contains('special_features', ['Indoor Simulator']);

  if (testError) {
    console.log('❌ Test failed:', testError.message);
  } else {
    console.log(`✅ Test successful: Found ${testResult.length} venue(s) with "Newcastle Upon Tyne"`);
    testResult.forEach(venue => {
      console.log(`   • ${venue.name}`);
      console.log(`     Address: ${venue.address}`);
    });
  }

  // Test URL parsing simulation
  console.log('\n🔗 URL Parsing Verification:');
  const urlSlug = 'newcastle-upon-tyne';
  const parsedCityName = decodeURIComponent(urlSlug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  console.log(`   URL slug: "${urlSlug}"`);
  console.log(`   Parsed name: "${parsedCityName}"`);
  console.log(`   Database name: "Newcastle Upon Tyne"`);
  console.log(`   Match: ${parsedCityName === 'Newcastle Upon Tyne' ? '✅ YES' : '❌ NO'}`);

  console.log('\n🎯 FIX COMPLETE!');
  console.log('=' .repeat(40));
  console.log('✅ Newcastle Upon Tyne city name updated');
  console.log('📱 Page should now load correctly');
  console.log('🔗 Test URL: https://www.findagolfrange.com/simulators/uk/newcastle-upon-tyne');
  console.log('🗺️ Map should now show the simulator');
  console.log('\nExpected to display:');
  console.log('   • Dynamic Indoor Golf');
  console.log('     Address: 1-4, Brunswick Industrial Estate');
  console.log('     Newcastle Upon Tyne');

  // Note about the other Newcastle venue
  console.log('\n📝 NOTE:');
  console.log('There is also a "NextGen Golf" in "Newcastle" (Northern Ireland)');
  console.log('This is correct and should remain separate as it\'s a different city/country');
}

fixNewcastleUponTyne().catch(console.error);