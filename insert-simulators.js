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

async function checkTableExists() {
  console.log('🔍 Checking if indoor_simulators table exists...');

  const { data, error } = await supabase
    .from('indoor_simulators')
    .select('count', { count: 'exact' });

  if (error) {
    console.log('❌ Table does not exist or no access:', error.message);
    return false;
  }

  console.log('✅ Table exists and accessible');
  return true;
}

async function insertSimulators() {
  console.log('🏌️ Starting simulator insertion process...\n');

  // Check if table exists
  const tableExists = await checkTableExists();
  if (!tableExists) {
    console.log('❌ Cannot proceed: indoor_simulators table not accessible');
    return;
  }

  // Read the valid simulators
  const validSimulators = JSON.parse(
    fs.readFileSync('/Users/edwelton/Documents/Welto Digital/find-a-golf-range/valid-simulators.json', 'utf8')
  );

  console.log(`📊 Found ${validSimulators.length} simulators to process\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process simulators in batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < validSimulators.length; i += BATCH_SIZE) {
    const batch = validSimulators.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validSimulators.length / BATCH_SIZE)}...`);

    for (const simulator of batch) {
      try {
        // Get coordinates for each simulator
        console.log(`📍 Geocoding: ${simulator.name}, ${simulator.city}`);
        const { latitude, longitude } = await getCoordinates(
          simulator.address,
          simulator.city,
          simulator.county
        );

        // Prepare the data for insertion
        const simulatorData = {
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
          detailed_description: simulator.description,
          simulator_brand: simulator.simulator_brand || '',
          num_simulators: simulator.num_simulators,
          pricing: simulator.pricing || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert into database
        const { data, error } = await supabase
          .from('indoor_simulators')
          .insert([simulatorData])
          .select();

        if (error) {
          console.log(`❌ Error inserting ${simulator.name}: ${error.message}`);
          errors.push({ simulator: simulator.name, error: error.message });
          errorCount++;
        } else {
          console.log(`✅ Inserted: ${simulator.name} (${latitude ? latitude.toFixed(4) : 'no coords'}, ${longitude ? longitude.toFixed(4) : 'no coords'})`);
          successCount++;
        }

        // Small delay to be respectful to geocoding service
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`❌ Failed to process ${simulator.name}: ${error.message}`);
        errors.push({ simulator: simulator.name, error: error.message });
        errorCount++;
      }
    }
  }

  console.log('\n🎯 INSERTION SUMMARY');
  console.log(`✅ Successfully inserted: ${successCount} simulators`);
  console.log(`❌ Failed insertions: ${errorCount} simulators`);

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
}

insertSimulators().catch(console.error);