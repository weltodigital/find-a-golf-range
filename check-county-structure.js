const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function checkCountyStructure() {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Checking Current County/Regional Structure\n');
  console.log('=' .repeat(60));

  try {
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('county, city, name')
      .contains('special_features', ['Indoor Simulator'])
      .order('county, city');

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    // Group by county
    const countyGroups = {};
    venues.forEach(venue => {
      const county = venue.county || 'No County';
      if (!countyGroups[county]) {
        countyGroups[county] = {};
      }
      if (!countyGroups[county][venue.city]) {
        countyGroups[county][venue.city] = [];
      }
      countyGroups[county][venue.city].push(venue.name);
    });

    console.log('📊 Current county structure:\n');

    Object.keys(countyGroups).sort().forEach(county => {
      const cities = Object.keys(countyGroups[county]);
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 ${county} (${cities.length} cities):`);
      cities.sort().forEach(city => {
        const venueCount = countyGroups[county][city].length;
        console.log(`   • ${city} (${venueCount} venue${venueCount === 1 ? '' : 's'})`);
      });
      console.log('');
    });

    // Check specifically for cities mentioned in the image that are in "England - Other"
    const citiesToCheck = [
      'Abingdon', 'Andover', 'Ashton Under Lyne', 'Basingstoke', 'Birkenhead',
      'Bridgeworks', 'Bridgnorth', 'Cheltenham', 'Clacton On Sea', 'Godstone',
      'Lee On The Solent', 'Poulton Le Fylde', 'Rochester', 'Shrewsbury',
      'Southend On Sea', 'Stoke On Trent', 'Stratford Upon Avon', 'Swindon',
      'Wimborne', 'Wirral'
    ];

    console.log('🎯 Cities from image - current county assignments:\n');

    for (const city of citiesToCheck) {
      const cityVenues = venues.filter(v => v.city === city);
      if (cityVenues.length > 0) {
        const county = cityVenues[0].county || 'No County';
        const venueCount = cityVenues.length;
        console.log(`📍 ${city} → ${county} (${venueCount} venue${venueCount === 1 ? '' : 's'})`);
      } else {
        console.log(`❌ ${city} → Not found in database`);
      }
    }

    // Suggest proper county assignments based on UK geography
    console.log('\n💡 SUGGESTED COUNTY CORRECTIONS:\n');
    console.log('These cities should have proper county assignments for regional organization:');

    const countySuggestions = {
      'Abingdon': 'Oxfordshire',
      'Andover': 'Hampshire',
      'Ashton Under Lyne': 'Greater Manchester',
      'Basingstoke': 'Hampshire',
      'Birkenhead': 'Merseyside',
      'Bridgnorth': 'Shropshire',
      'Cheltenham': 'Gloucestershire',
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
      'Wirral': 'Merseyside'
    };

    for (const [city, suggestedCounty] of Object.entries(countySuggestions)) {
      const cityVenues = venues.filter(v => v.city === city);
      if (cityVenues.length > 0) {
        const currentCounty = cityVenues[0].county || 'No County';
        if (currentCounty !== suggestedCounty) {
          console.log(`🔄 ${city}: "${currentCounty}" → "${suggestedCounty}"`);
        } else {
          console.log(`✅ ${city}: Already correctly assigned to "${suggestedCounty}"`);
        }
      }
    }

    console.log('\n📝 NOTES:');
    console.log('- The frontend likely maps counties to regions for display');
    console.log('- "England - Other" probably means venues with null/incorrect county data');
    console.log('- Updating county fields will automatically fix regional categorization');

  } catch (error) {
    console.error('❌ Error during county structure check:', error.message);
  }
}

checkCountyStructure().catch(console.error);