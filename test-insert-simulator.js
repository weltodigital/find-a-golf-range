const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function testInsert() {
  console.log('🧪 Testing single simulator insertion...\n');

  // Test data
  const testSimulator = {
    name: 'Test Indoor Golf Simulator',
    slug: 'test-indoor-golf-simulator',
    address: '123 Test Street',
    city: 'London',
    county: 'Greater London',
    postcode: 'SW1A 1AA',
    phone: '020 1234 5678',
    website: 'https://test.example.com',
    email: 'test@example.com',
    latitude: 51.5074,
    longitude: -0.1278,
    description: 'Test indoor golf simulator',
    detailed_description: 'Test indoor golf simulator with TrackMan technology',
    facilities: [],
    num_bays: 2,
    special_features: ['Indoor Simulator', 'TrackMan Technology', 'Virtual Golf']
  };

  try {
    console.log('Attempting to insert test simulator...');

    const { data, error } = await supabase
      .from('golf_ranges')
      .insert([testSimulator])
      .select();

    if (error) {
      console.log('❌ Insert failed:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Insert successful!');
      console.log('Inserted data:', data[0]);

      // Now delete the test record
      const deleteResult = await supabase
        .from('golf_ranges')
        .delete()
        .eq('slug', 'test-indoor-golf-simulator');

      if (deleteResult.error) {
        console.log('⚠️ Failed to delete test record:', deleteResult.error.message);
      } else {
        console.log('🗑️ Test record cleaned up successfully');
      }
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testInsert().catch(console.error);