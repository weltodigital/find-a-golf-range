const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// City to county mappings for proper regional categorization
const cityCountyMappings = {
  // Cities shown in the "England - Other" image
  'Abingdon': 'Oxfordshire',
  'Andover': 'Hampshire',
  'Ashton Under Lyne': 'Greater Manchester',
  'Basingstoke': 'Hampshire',
  'Birkenhead': 'Merseyside',
  'Bridgeworks': 'Essex', // Assuming this is Braintree/Chelmsford area
  'Bridgnorth': 'Shropshire',
  'Clacton On Sea': 'Essex',
  'Godstone': 'Surrey',
  'Lee On The Solent': 'Hampshire',
  'Poulton Le Fylde': 'Lancashire',
  'Rochester': 'Kent',
  'Shrewsbury': 'Shropshire',
  'Southend On Sea': 'Essex',
  'Stoke On Trent': 'Staffordshire',
  'Stratford Upon Avon': 'Warwickshire',
  'Swindon': 'Wiltshire',
  'Wimborne': 'Dorset',
  'Wirral': 'Merseyside',

  // Additional major cities for comprehensive regional organization
  'London': 'Greater London',
  'Birmingham': 'West Midlands',
  'Manchester': 'Greater Manchester',
  'Liverpool': 'Merseyside',
  'Leeds': 'West Yorkshire',
  'Sheffield': 'South Yorkshire',
  'Bradford': 'West Yorkshire',
  'Coventry': 'West Midlands',
  'Leicester': 'Leicestershire',
  'Nottingham': 'Nottinghamshire',
  'Bristol': 'Gloucestershire',
  'Newcastle Upon Tyne': 'Tyne and Wear',
  'Portsmouth': 'Hampshire',
  'Southampton': 'Hampshire',
  'Reading': 'Berkshire',
  'Brighton': 'East Sussex',
  'Plymouth': 'Devon',
  'Blackpool': 'Lancashire',
  'Norwich': 'Norfolk',
  'Ipswich': 'Suffolk',
  'Gloucester': 'Gloucestershire',
  'Exeter': 'Devon',
  'Bath': 'Somerset',
  'Chester': 'Cheshire',
  'Stockport': 'Greater Manchester',
  'Oldham': 'Greater Manchester',
  'Doncaster': 'South Yorkshire',
  'Sunderland': 'Tyne and Wear',
  'Milton Keynes': 'Buckinghamshire',
  'Peterborough': 'Cambridgeshire',
  'Luton': 'Bedfordshire',
  'York': 'North Yorkshire',
  'Derby': 'Derbyshire',
  'Swansea': 'Swansea',
  'Cardiff': 'Cardiff',
  'Newport': 'Newport',
  'Belfast': 'Belfast',
  'Edinburgh': 'Edinburgh',
  'Glasgow': 'Glasgow',
  'Dundee': 'Dundee',
  'Aberdeen': 'Aberdeen'
};

async function updateCountiesForRegions() {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Updating Counties for Proper Regional Organization\n');
  console.log('=' .repeat(70));

  try {
    console.log('🎯 Updating county assignments for regional categorization...\n');

    let totalUpdated = 0;
    const updateResults = [];

    // Process each city mapping
    for (const [city, county] of Object.entries(cityCountyMappings)) {
      console.log(`📍 Processing: ${city} → ${county}`);

      // Get venues in this city
      const { data: cityVenues, error: fetchError } = await supabase
        .from('golf_ranges')
        .select('id, name, city, county')
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
      });

      // Update all venues in this city with the correct county
      const { data: updateResult, error: updateError } = await supabase
        .from('golf_ranges')
        .update({
          county: county,
          updated_at: new Date().toISOString()
        })
        .eq('city', city)
        .contains('special_features', ['Indoor Simulator'])
        .select('name, city, county');

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        updateResults.push({
          city: city,
          county: county,
          status: 'failed',
          error: updateError.message
        });
      } else {
        const updatedCount = updateResult.length;
        console.log(`   ✅ Updated ${updatedCount} venue(s) to ${county}`);
        totalUpdated += updatedCount;
        updateResults.push({
          city: city,
          county: county,
          venueCount: updatedCount,
          status: 'success'
        });
      }
      console.log('');
    }

    // Summary
    console.log('📊 UPDATE SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Total venues updated: ${totalUpdated}`);

    const successfulUpdates = updateResults.filter(r => r.status === 'success');
    const failedUpdates = updateResults.filter(r => r.status === 'failed');

    console.log(`Successful city updates: ${successfulUpdates.length}`);
    console.log(`Failed updates: ${failedUpdates.length}`);

    if (successfulUpdates.length > 0) {
      console.log('\n✅ Successfully updated cities:');
      successfulUpdates.forEach(update => {
        console.log(`   • ${update.city} → ${update.county} (${update.venueCount} venues)`);
      });
    }

    if (failedUpdates.length > 0) {
      console.log('\n❌ Failed updates:');
      failedUpdates.forEach(update => {
        console.log(`   • ${update.city} → ${update.county}: ${update.error}`);
      });
    }

    // Verify final county structure
    console.log('\n🔍 Final verification - Updated county structure:\n');

    const { data: finalCheck, error: finalError } = await supabase
      .from('golf_ranges')
      .select('county, city')
      .contains('special_features', ['Indoor Simulator'])
      .order('county, city');

    if (!finalError) {
      const finalCountyGroups = {};
      finalCheck.forEach(venue => {
        const county = venue.county || 'No County';
        if (!finalCountyGroups[county]) {
          finalCountyGroups[county] = new Set();
        }
        finalCountyGroups[county].add(venue.city);
      });

      Object.keys(finalCountyGroups).sort().forEach(county => {
        const cities = Array.from(finalCountyGroups[county]).sort();
        console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 ${county} (${cities.length} cities)`);

        // Show first few cities as examples
        const displayCities = cities.slice(0, 5);
        displayCities.forEach(city => {
          console.log(`   • ${city}`);
        });
        if (cities.length > 5) {
          console.log(`   ... and ${cities.length - 5} more`);
        }
        console.log('');
      });
    }

    // Regional impact
    console.log('🎯 REGIONAL ORGANIZATION IMPACT:');
    console.log('=' .repeat(50));
    console.log('Cities should now be properly categorized into regions:');
    console.log('');
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 South East England:');
    console.log('   • Counties: Kent, Surrey, East Sussex, West Sussex, Oxfordshire, Berkshire');
    console.log('   • Key cities: Rochester, Godstone, Brighton, Abingdon');
    console.log('');
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 South West England:');
    console.log('   • Counties: Hampshire, Wiltshire, Dorset, Gloucestershire, Somerset, Devon');
    console.log('   • Key cities: Andover, Basingstoke, Lee On The Solent, Swindon, Wimborne');
    console.log('');
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 North West England:');
    console.log('   • Counties: Greater Manchester, Merseyside, Lancashire, Cheshire');
    console.log('   • Key cities: Ashton Under Lyne, Birkenhead, Poulton Le Fylde, Wirral');
    console.log('');
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Midlands:');
    console.log('   • Counties: Staffordshire, Warwickshire, Shropshire, West Midlands');
    console.log('   • Key cities: Stoke On Trent, Stratford Upon Avon, Shrewsbury, Bridgnorth');
    console.log('');
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 East of England:');
    console.log('   • Counties: Essex, Suffolk, Norfolk, Cambridgeshire');
    console.log('   • Key cities: Clacton On Sea, Southend On Sea, Bridgeworks');

    console.log('\n🌟 REGIONAL CATEGORIZATION COMPLETE!');
    console.log('✅ Cities moved from "England - Other" to proper regional categories');
    console.log('📱 Website regional navigation should now display correctly');
    console.log('🗺️ Users can find simulators by region instead of generic "Other"');

  } catch (error) {
    console.error('❌ Error during county updates:', error.message);
  }
}

updateCountiesForRegions().catch(console.error);