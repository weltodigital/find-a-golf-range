const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Cities that need to be moved from "England - Other" to their correct regions
const cityRegionMappings = {
  // South East England
  'Abingdon': 'South East England',
  'Basingstoke': 'South East England',
  'Godstone': 'South East England',
  'Rochester': 'South East England',

  // South West England
  'Andover': 'South West England',
  'Bridgnorth': 'South West England',
  'Cheltenham': 'South West England',
  'Swindon': 'South West England',
  'Wimborne': 'South West England',

  // North West England
  'Ashton Under Lyne': 'North West England',
  'Birkenhead': 'North West England',
  'Poulton Le Fylde': 'North West England',

  // East of England
  'Clacton On Sea': 'East of England',

  // Midlands
  'Stoke On Trent': 'Midlands',
  'Stratford Upon Avon': 'Midlands',
  'Shrewsbury': 'Midlands',

  // South Coast England
  'Lee On The Solent': 'South Coast England',
  'Southend On Sea': 'South Coast England',

  // North East England
  'Bridgeworks': 'North East England'
};

async function movecitiesToRegions() {
  console.log('🗺️  Moving Cities from "England - Other" to Correct Regions\n');
  console.log('=' .repeat(70));

  try {
    // First, check current regional structure
    console.log('📊 Current regional structure check...\n');

    const { data: allVenues, error: checkError } = await supabase
      .from('golf_ranges')
      .select('region, city')
      .contains('special_features', ['Indoor Simulator'])
      .order('region, city');

    if (checkError) {
      console.error('❌ Error checking regions:', checkError.message);
      return;
    }

    // Group by region to show current structure
    const regionGroups = {};
    allVenues.forEach(venue => {
      const region = venue.region || 'No Region';
      if (!regionGroups[region]) {
        regionGroups[region] = new Set();
      }
      regionGroups[region].add(venue.city);
    });

    console.log('Current regions in database:');
    Object.keys(regionGroups).sort().forEach(region => {
      const cities = Array.from(regionGroups[region]).sort();
      console.log(`  🏴󠁧󠁢󠁥󠁮󠁧󠁿 ${region} (${cities.length} cities)`);
    });

    console.log('\n🎯 Cities to move:\n');

    let totalMoved = 0;
    const moveResults = [];

    // Process each city that needs to be moved
    for (const [city, newRegion] of Object.entries(cityRegionMappings)) {
      console.log(`📍 Processing: ${city} → ${newRegion}`);

      // Get venues in this city
      const { data: cityVenues, error: fetchError } = await supabase
        .from('golf_ranges')
        .select('*')
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator']);

      if (fetchError) {
        console.log(`   ❌ Error fetching venues: ${fetchError.message}`);
        continue;
      }

      if (!cityVenues || cityVenues.length === 0) {
        console.log(`   ⚠️  No venues found in ${city}`);
        continue;
      }

      console.log(`   Found ${cityVenues.length} venue(s):`);
      cityVenues.forEach(venue => {
        console.log(`      • ${venue.name}`);
        console.log(`        Current region: "${venue.region || 'None'}"`);
      });

      // Update all venues in this city
      const { data: updateResult, error: updateError } = await supabase
        .from('golf_ranges')
        .update({
          region: newRegion,
          updated_at: new Date().toISOString()
        })
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator'])
        .select('name, region');

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        moveResults.push({
          city: city,
          targetRegion: newRegion,
          status: 'failed',
          error: updateError.message
        });
      } else {
        const movedCount = updateResult.length;
        console.log(`   ✅ Updated ${movedCount} venue(s) to ${newRegion}`);
        totalMoved += movedCount;
        moveResults.push({
          city: city,
          targetRegion: newRegion,
          venueCount: movedCount,
          status: 'success'
        });
      }
      console.log('');
    }

    // Handle Wirral separately (it's shown in the image)
    console.log('📍 Processing: Wirral → North West England');
    const { data: wirralUpdate, error: wirralError } = await supabase
      .from('golf_ranges')
      .update({
        region: 'North West England',
        updated_at: new Date().toISOString()
      })
      .eq('city', 'Wirral')
      .contains('special_features', ['Indoor Simulator'])
      .select('name, region');

    if (wirralError) {
      console.log(`   ❌ Wirral update failed: ${wirralError.message}`);
    } else if (wirralUpdate && wirralUpdate.length > 0) {
      console.log(`   ✅ Updated ${wirralUpdate.length} venue(s) in Wirral to North West England`);
      totalMoved += wirralUpdate.length;
    } else {
      console.log(`   ⚠️  No venues found in Wirral`);
    }

    // Summary
    console.log('\n📊 MOVE SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Total venues moved: ${totalMoved}`);

    const successfulMoves = moveResults.filter(r => r.status === 'success');
    const failedMoves = moveResults.filter(r => r.status === 'failed');

    console.log(`Successful city moves: ${successfulMoves.length}`);
    console.log(`Failed moves: ${failedMoves.length}`);

    if (successfulMoves.length > 0) {
      console.log('\n✅ Successfully moved cities:');
      successfulMoves.forEach(move => {
        console.log(`   • ${move.city} → ${move.targetRegion} (${move.venueCount} venues)`);
      });
    }

    if (failedMoves.length > 0) {
      console.log('\n❌ Failed moves:');
      failedMoves.forEach(move => {
        console.log(`   • ${move.city} → ${move.targetRegion}: ${move.error}`);
      });
    }

    // Verify final regional structure
    console.log('\n🔍 Final verification - Updated regional structure:');

    const { data: finalCheck, error: finalError } = await supabase
      .from('golf_ranges')
      .select('region, city')
      .contains('special_features', ['Indoor Simulator'])
      .order('region, city');

    if (!finalError) {
      const finalRegionGroups = {};
      finalCheck.forEach(venue => {
        const region = venue.region || 'No Region';
        if (!finalRegionGroups[region]) {
          finalRegionGroups[region] = new Set();
        }
        finalRegionGroups[region].add(venue.city);
      });

      console.log('');
      Object.keys(finalRegionGroups).sort().forEach(region => {
        const cities = Array.from(finalRegionGroups[region]).sort();
        console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 ${region} (${cities.length} cities)`);
      });
    }

    console.log('\n🎯 REGIONAL ORGANIZATION COMPLETE!');
    console.log('Cities have been moved from "England - Other" to their proper regional categories');
    console.log('Website regional navigation should now be properly organized');

  } catch (error) {
    console.error('❌ Error during city region moves:', error.message);
  }
}

movecitiesToRegions().catch(console.error);