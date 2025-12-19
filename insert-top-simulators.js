const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Geocoding function to get coordinates
async function getCoordinates(address, city, county) {
  const fullAddress = `${address}, ${city}, ${county}, UK`;
  const encodedAddress = encodeURIComponent(fullAddress);

  try {
    // Using Nominatim OpenStreetMap geocoding service (free)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.log(`⚠️ Geocoding failed for ${city}: ${error.message}`);
  }

  return { latitude: null, longitude: null };
}

async function insertTopSimulators() {
  console.log('🏌️ Starting top simulator insertion...\n');

  // Read the valid simulators
  const validSimulators = JSON.parse(
    fs.readFileSync('/Users/edwelton/Documents/Welto Digital/find-a-golf-range/valid-simulators.json', 'utf8')
  );

  // Filter for high-quality simulators (good ratings and reviews)
  const topSimulators = validSimulators
    .filter(sim =>
      (sim.totalScore >= 4.5 && sim.reviewsCount >= 20) || // High quality with good reviews
      (sim.totalScore >= 4.8 && sim.reviewsCount >= 5) || // Very high quality
      sim.reviewsCount >= 100 // Popular venues
    )
    .slice(0, 30); // Limit to top 30

  console.log(`📊 Selected ${topSimulators.length} top simulators from ${validSimulators.length} total\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const insertedSimulators = [];

  for (const simulator of topSimulators) {
    try {
      // Get coordinates for each simulator
      console.log(`📍 Processing: ${simulator.name}, ${simulator.city} (${simulator.totalScore}★, ${simulator.reviewsCount} reviews)`);

      const { latitude, longitude } = await getCoordinates(
        simulator.address,
        simulator.city,
        simulator.county
      );

      // Prepare the data for insertion
      const rangeData = {
        name: simulator.name,
        slug: simulator.slug,
        address: simulator.address,
        city: simulator.city,
        county: simulator.county,
        postcode: simulator.postcode || '',
        phone: simulator.phone || '',
        website: simulator.website || '',
        email: simulator.email || '',
        latitude: latitude,
        longitude: longitude,
        description: simulator.description,
        detailed_description: `${simulator.description}. Google rating: ${simulator.totalScore}★ (${simulator.reviewsCount} reviews)`,
        facilities: [],
        num_bays: simulator.num_simulators || 1,
        special_features: ['Indoor Simulator', 'Virtual Golf', 'Year-Round Practice']
      };

      // Insert into database
      const { data, error } = await supabase
        .from('golf_ranges')
        .insert([rangeData])
        .select();

      if (error) {
        console.log(`❌ Error inserting ${simulator.name}: ${error.message}`);
        errors.push({ simulator: simulator.name, error: error.message });
        errorCount++;
      } else {
        console.log(`✅ Inserted: ${simulator.name} (${latitude ? latitude.toFixed(4) : 'no coords'}, ${longitude ? longitude.toFixed(4) : 'no coords'})`);
        insertedSimulators.push({
          name: simulator.name,
          city: simulator.city,
          id: data[0].id,
          rating: simulator.totalScore,
          reviews: simulator.reviewsCount
        });
        successCount++;
      }

      // Small delay to be respectful to geocoding service
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.log(`❌ Failed to process ${simulator.name}: ${error.message}`);
      errors.push({ simulator: simulator.name, error: error.message });
      errorCount++;
    }
  }

  console.log('\n🎯 INSERTION SUMMARY');
  console.log(`✅ Successfully inserted: ${successCount} simulators`);
  console.log(`❌ Failed insertions: ${errorCount} simulators`);

  if (insertedSimulators.length > 0) {
    console.log('\n✅ SUCCESSFULLY INSERTED SIMULATORS:');
    insertedSimulators.forEach((sim, index) => {
      console.log(`${index + 1}. ${sim.name} - ${sim.city} (${sim.rating}★, ${sim.reviews} reviews)`);
    });

    // Save successful insertions
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/inserted-simulators.json',
      JSON.stringify(insertedSimulators, null, 2)
    );
    console.log('\n💾 Successful insertions saved to inserted-simulators.json');
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.simulator}: ${err.error}`);
    });

    // Save errors to file
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/insertion-errors.json',
      JSON.stringify(errors, null, 2)
    );
    console.log('\n💾 Errors saved to insertion-errors.json');
  }

  console.log('\n📝 Note: Simulators added to golf_ranges table and can be identified by special_features');
  console.log('They will appear in your existing location pages automatically!');
}

insertTopSimulators().catch(console.error);