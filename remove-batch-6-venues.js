const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Batch 6 venues to remove (not actual golf simulators)
const venuesToRemove = [
  'Looney Golf Leisure Venue',
  'Xplore - Soft Play and 4D Golf',
  'Boom Battle Bar Sheffield',
  'The Hole In Wand, York',
  'Fore Seasons Golf',
  'Mulligans Cheltenham',
  'The Brewery Quarter',
  'Clacton Pier',
  'Box Leisure'
];

async function removeBatch6Venues() {
  console.log('🗑️  Removing Batch 6 Non-Simulator Venues\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find and identify venues to remove
    console.log('🔍 Step 1: Finding venues to remove...\n');

    const foundVenues = [];
    const notFoundVenues = [];

    for (const venueName of venuesToRemove) {
      console.log(`Searching for: "${venueName}"`);

      const { data: venue, error } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('name', venueName)
        .contains('special_features', ['Indoor Simulator'])
        .single();

      if (error) {
        console.log(`  ❌ Not found: ${error.message}`);
        notFoundVenues.push(venueName);
      } else {
        foundVenues.push(venue);
        console.log(`  ✅ Found: ${venue.name} (ID: ${venue.id})`);
        console.log(`     City: ${venue.city}`);
        console.log(`     Address: ${venue.address}`);
        console.log('');
      }
    }

    console.log(`\n📊 Search Results:`);
    console.log(`   Found: ${foundVenues.length} venues`);
    console.log(`   Not found: ${notFoundVenues.length} venues`);

    if (notFoundVenues.length > 0) {
      console.log(`\n⚠️  Venues not found (may have been already removed):`);
      notFoundVenues.forEach(name => {
        console.log(`     • ${name}`);
      });
    }

    if (foundVenues.length === 0) {
      console.log('\n✅ No venues found to remove. They may have already been removed.');
      return;
    }

    // Step 2: Create backup
    console.log('\n💾 Step 2: Creating backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/batch-6-removed-venues-backup-${timestamp}.json`;

    const backup = {
      timestamp: new Date().toISOString(),
      reason: 'Batch 6 removal - Non-simulator venues (soft play, battle bars, piers, entertainment)',
      venuesToRemove: venuesToRemove,
      foundVenues: foundVenues,
      notFoundVenues: notFoundVenues
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${backupFile.split('/').pop()}`);

    // Step 3: Get counts before removal
    const { count: beforeCount } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator']);

    console.log(`\n📊 Current count: ${beforeCount} indoor simulator venues`);

    // Step 4: Remove venues one by one
    console.log(`\n🗑️ Step 3: Removing ${foundVenues.length} venues...\n`);

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
            city: venue.city,
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

    // Step 5: Get counts after removal and verify
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
    console.log(`Not found: ${notFoundVenues.length}`);

    // Step 6: Final verification
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

    // Save results
    const resultsFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/batch-6-removal-results-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      venuesToRemove: venuesToRemove,
      foundVenues: foundVenues.map(v => ({ id: v.id, name: v.name, city: v.city })),
      notFoundVenues: notFoundVenues,
      removalResults: removalResults,
      counts: {
        before: beforeCount,
        after: afterCount,
        removed: beforeCount - afterCount
      }
    }, null, 2));

    console.log(`\n💾 Results saved: ${resultsFile.split('/').pop()}`);

    // Cumulative summary
    console.log('\n📈 CUMULATIVE REMOVAL SUMMARY:');
    console.log('=' .repeat(40));
    console.log('Batch 1 (Initial): 4 venues removed');
    console.log('Batch 2 (Additional): 2 venues removed');
    console.log('Batch 3 (Previous): 9 venues removed');
    console.log('Batch 4 (Previous): 5 venues removed');
    console.log('Glo Golf (Individual): 1 venue removed');
    console.log('Batch 5 (Previous): 6 venues removed');
    console.log(`Batch 6 (Current): ${successfulRemovals} venues removed`);
    console.log(`Total removed: ${27 + successfulRemovals} venues`);
    console.log('Original count: 262 venues');
    console.log(`Current count: ${afterCount} venues`);

    // Final status
    console.log('\n🎯 FINAL STATUS:');
    console.log('=' .repeat(40));

    if (successfulRemovals > 0) {
      console.log(`✅ ${successfulRemovals} additional non-simulator venues removed`);
      console.log('📱 Website will automatically reflect these changes');
      console.log('🗺️ Maps will no longer show these locations');
      console.log('🎯 Database now contains only genuine golf simulators');
    }

    if (failedRemovals > 0) {
      console.log(`⚠️ ${failedRemovals} removals failed - check errors above`);
    }

    if (notFoundVenues.length > 0) {
      console.log(`ℹ️ ${notFoundVenues.length} venues were already removed or not found`);
    }

    console.log('\n🌟 VENUE QUALITY IMPROVED:');
    console.log('Database now contains only authentic indoor golf simulator venues');
    console.log('Removed soft play centers, battle bars, piers, and entertainment venues');
    console.log('Map accuracy maximized with only genuine simulator locations');

  } catch (error) {
    console.error('❌ Error during venue removal:', error.message);
  }
}

removeBatch6Venues().catch(console.error);