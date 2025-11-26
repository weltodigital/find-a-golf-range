const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Final critical updates from CSV files that were missed
const finalUpdates = {
  // Liverpool/Wirral area from CSV - these have bay counts in CSV but not in DB
  'Moreton Hills Golf Centre': {
    num_bays: 63,
    address: 'Tarran Way S, Moreton, Wirral',
    postcode: 'CH46 4TP',
    phone: '0151 243 1574',
    email: 'info@moretonhillsgolfcentre.co.uk'
  },
  'Clarkes Golf Driving Range': {
    num_bays: 27,
    address: 'Mill La, Saint Helens',
    postcode: 'WA11 8LN',
    phone: '01744 885294',
    email: 'admin@clarkesgolf.co.uk'
  },
  'Formby Golf Centre': {
    num_bays: 20,
    address: 'Moss Side, Formby, Liverpool',
    postcode: 'L37 0AF',
    phone: '1704875952',
    email: 'info@formbygolfcentre.co.uk'
  },

  // Missing addresses from previous audit
  'Stockwood Park Golf Centre': {
    address: 'Stockwood Park, London Road, Luton',
    postcode: 'LU1 4LX'
  },

  // Leeds area - Garforth has bay count in CSV
  'Garforth Golf Range': {
    num_bays: null, // Need to check CSV again or research
    address: 'Long Ln, Garforth, Leeds',
    postcode: 'LS25 2DN',
    phone: '0113 287 1111',
    email: 'hello@golfcrazy.co.uk'
  },

  // Glasgow ranges that might have bay data
  'Golf It!': {
    address: 'Renfrew Road, Paisley, Glasgow',
    postcode: 'PA3 4EA'
  },

  // Bath area
  'Saltford Golf Club': {
    address: 'Golf Course Ln, Saltford, Bristol',
    postcode: 'BS31 3AA'
  },

  // Other key missing ranges
  'Staining Lodge Golf Driving Range': {
    address: 'Staining Lodge, Mythop Road, Blackpool',
    postcode: 'FY3 0DE'
  }
};

async function performFinalUpdates() {
  console.log('🔧 PERFORMING FINAL DATA UPDATES...\n');

  let updated = 0;
  let errors = 0;
  let notFound = 0;

  for (const [rangeName, updateData] of Object.entries(finalUpdates)) {
    console.log(`Updating ${rangeName}...`);

    try {
      // Prepare update object (only include non-null values)
      const updateObj = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined) {
          updateObj[key] = updateData[key];
        }
      });

      const { data, error } = await supabase
        .from('golf_ranges')
        .update(updateObj)
        .eq('name', rangeName)
        .select();

      if (error) {
        console.log(`❌ Error updating ${rangeName}: ${error.message}`);
        errors++;
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${rangeName}`);

        const updates = [];
        if (updateData.num_bays) updates.push(`${updateData.num_bays} bays`);
        if (updateData.address) updates.push('address');
        if (updateData.postcode) updates.push(`postcode ${updateData.postcode}`);
        if (updateData.phone) updates.push('phone');
        if (updateData.email) updates.push('email');

        console.log(`   Added: ${updates.join(', ')}`);
        updated++;
      } else {
        // Try fuzzy matching
        const searchTerm = rangeName.split(' ')[0];
        const { data: fuzzyData, error: fuzzyError } = await supabase
          .from('golf_ranges')
          .update(updateObj)
          .ilike('name', `%${searchTerm}%`)
          .select();

        if (fuzzyError) {
          console.log(`❌ Fuzzy match error for ${rangeName}: ${fuzzyError.message}`);
          errors++;
        } else if (fuzzyData && fuzzyData.length > 0) {
          console.log(`✅ Updated ${rangeName} via fuzzy match (${fuzzyData.length} records)`);
          updated += fuzzyData.length;
        } else {
          console.log(`⚠️  ${rangeName} not found in database`);
          notFound++;
        }
      }
    } catch (err) {
      console.log(`❌ Exception updating ${rangeName}: ${err.message}`);
      errors++;
    }

    console.log(''); // Add spacing
  }

  console.log(`\n📈 FINAL UPDATE SUMMARY:`);
  console.log(`✅ Ranges updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`📊 Total attempted: ${Object.keys(finalUpdates).length}`);
}

performFinalUpdates().catch(console.error);