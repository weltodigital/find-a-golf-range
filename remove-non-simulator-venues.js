const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// List of venues to remove (not actual golf simulators)
const venuesToRemove = [
  'Putt Putt & Karaoke Bar',
  'Puttshack, White City',
  'Shoreditch Balls',
  'Footsie Social'
];

async function removeNonSimulatorVenues() {
  console.log('🗑️  Removing Non-Simulator Venues from Database\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find and backup the venues to be removed
    console.log('🔍 Step 1: Finding venues to remove...\n');

    const foundVenues = [];
    for (const venueName of venuesToRemove) {
      const { data: venue, error } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('name', venueName)
        .contains('special_features', ['Indoor Simulator'])
        .single();

      if (error) {
        console.log(`❌ Could not find "${venueName}": ${error.message}`);
      } else {
        foundVenues.push(venue);
        console.log(`✅ Found: ${venue.name} (ID: ${venue.id})`);
        console.log(`   City: ${venue.city}`);
        console.log(`   Address: ${venue.address}`);
        console.log(`   Features: ${venue.special_features?.join(', ')}`);
        console.log('');
      }
    }

    if (foundVenues.length === 0) {
      console.log('⚠️ No venues found to remove. They may have already been removed.');
      return;
    }

    // Step 2: Create backup
    console.log('\n💾 Step 2: Creating backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/removed-venues-backup-${timestamp}.json`;

    const backup = {
      timestamp: new Date().toISOString(),
      reason: 'Removed non-simulator venues (putting/mini golf only)',
      venues: foundVenues
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${backupFile.split('/').pop()}`);

    // Step 3: Get counts before removal
    const { count: beforeCount } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator']);

    console.log(`\n📊 Current count: ${beforeCount} indoor simulator venues`);

    // Step 4: Remove venues
    console.log('\n🗑️ Step 3: Removing venues...\n');

    const removalResults = [];

    for (const venue of foundVenues) {
      console.log(`Removing: ${venue.name}...`);

      try {
        const { error } = await supabase
          .from('golf_ranges')
          .delete()
          .eq('id', venue.id);

        if (error) {
          console.log(`  ❌ Failed: ${error.message}`);
          removalResults.push({
            venue: venue.name,
            id: venue.id,
            status: 'failed',
            error: error.message
          });
        } else {
          console.log(`  ✅ Successfully removed`);
          removalResults.push({
            venue: venue.name,
            id: venue.id,
            status: 'success'
          });
        }
      } catch (err) {
        console.log(`  ❌ Exception: ${err.message}`);
        removalResults.push({
          venue: venue.name,
          id: venue.id,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Step 5: Verify removal and get new counts
    console.log('\n🔍 Step 4: Verifying removal...\n');

    const { count: afterCount } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator']);

    const successfulRemovals = removalResults.filter(r => r.status === 'success').length;
    const failedRemovals = removalResults.filter(r => r.status === 'failed').length;

    console.log('📊 REMOVAL SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`Before removal: ${beforeCount} venues`);
    console.log(`After removal:  ${afterCount} venues`);
    console.log(`Difference:     ${beforeCount - afterCount} venues`);
    console.log(`Successfully removed: ${successfulRemovals}`);
    console.log(`Failed removals: ${failedRemovals}`);

    // Step 6: Check that removed venues are no longer findable
    console.log('\n✅ Step 5: Final verification...\n');

    for (const venueName of venuesToRemove) {
      const { data: stillExists, error } = await supabase
        .from('golf_ranges')
        .select('name')
        .eq('name', venueName)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log(`✅ Confirmed removed: ${venueName}`);
      } else if (stillExists) {
        console.log(`❌ Still exists: ${venueName}`);
      } else {
        console.log(`❓ Uncertain status: ${venueName}`);
      }
    }

    // Save removal results
    const resultsFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/venue-removal-results-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      venuesToRemove: venuesToRemove,
      foundVenues: foundVenues.map(v => ({ id: v.id, name: v.name, city: v.city })),
      removalResults: removalResults,
      counts: {
        before: beforeCount,
        after: afterCount,
        removed: beforeCount - afterCount
      }
    }, null, 2));

    console.log(`\n💾 Removal results saved: ${resultsFile.split('/').pop()}`);

    // Step 7: Recommendations
    console.log('\n🎯 NEXT STEPS:');
    console.log('=' .repeat(40));

    if (successfulRemovals > 0) {
      console.log('✅ Venues successfully removed from database');
      console.log('📱 Website will automatically reflect these changes');
      console.log('🗺️ Maps will no longer show these locations');
      console.log('🔄 Consider regenerating sitemap if needed');
    }

    if (failedRemovals > 0) {
      console.log('⚠️ Some removals failed - check error messages above');
      console.log('🔄 May need to retry failed removals');
    }

    console.log('\n📋 Categories to consider for these venues:');
    console.log('• Mini Golf / Crazy Golf');
    console.log('• Entertainment Venues');
    console.log('• Social Golf Experiences');
    console.log('• Putting-Only Facilities');

  } catch (error) {
    console.error('❌ Error during venue removal:', error.message);
  }
}

removeNonSimulatorVenues().catch(console.error);