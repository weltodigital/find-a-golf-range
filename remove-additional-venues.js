const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Additional venues to remove (not actual golf simulators)
const additionalVenuesToRemove = [
  'Waggle Golf',
  'Boom Battle Bar Eastbourne'
];

async function removeAdditionalVenues() {
  console.log('🗑️  Removing Additional Non-Simulator Venues\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find venues to be removed
    console.log('🔍 Step 1: Finding additional venues to remove...\n');

    const foundVenues = [];
    for (const venueName of additionalVenuesToRemove) {
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
      console.log('⚠️ No additional venues found to remove.');
      return;
    }

    // Step 2: Create backup
    console.log('\n💾 Step 2: Creating backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/additional-removed-venues-backup-${timestamp}.json`;

    const backup = {
      timestamp: new Date().toISOString(),
      reason: 'Additional removal of non-simulator venues',
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
    console.log('\n🗑️ Step 3: Removing additional venues...\n');

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

    // Step 6: Final verification
    console.log('\n✅ Step 5: Final verification...\n');

    for (const venueName of additionalVenuesToRemove) {
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

    // Save results
    const resultsFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/additional-venue-removal-results-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      venuesToRemove: additionalVenuesToRemove,
      foundVenues: foundVenues.map(v => ({ id: v.id, name: v.name, city: v.city })),
      removalResults: removalResults,
      counts: {
        before: beforeCount,
        after: afterCount,
        removed: beforeCount - afterCount
      }
    }, null, 2));

    console.log(`\n💾 Results saved: ${resultsFile.split('/').pop()}`);

    // Final status
    console.log('\n🎯 FINAL STATUS:');
    console.log('=' .repeat(40));
    console.log(`📊 Total venues now: ${afterCount} genuine indoor golf simulators`);

    if (successfulRemovals > 0) {
      console.log('✅ Additional venues successfully removed');
      console.log('📱 Website will automatically update');
      console.log('🗺️ Maps will no longer show these locations');
    }

    if (failedRemovals > 0) {
      console.log('⚠️ Some removals failed - check errors above');
    }

    // Total removals across both scripts
    console.log('\n📈 CUMULATIVE REMOVAL SUMMARY:');
    console.log('=' .repeat(40));
    console.log('Previous removal: 4 venues (Putt Putt, Puttshack, etc.)');
    console.log(`Current removal:  ${successfulRemovals} venues`);
    console.log(`Total removed:    ${4 + successfulRemovals} venues`);
    console.log(`Original count:   262 venues`);
    console.log(`Current count:    ${afterCount} venues`);

  } catch (error) {
    console.error('❌ Error during additional venue removal:', error.message);
  }
}

removeAdditionalVenues().catch(console.error);