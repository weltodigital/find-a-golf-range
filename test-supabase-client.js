const { createClient } = require('@supabase/supabase-js');

// Test client-side connection (same config as the app)
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function testClientConnection() {
  console.log('🧪 Testing client-side Supabase connection...\n');

  try {
    // Test the exact query from the Belfast page
    console.log('Testing Belfast query:');
    const { data: belfastData, error: belfastError } = await supabase
      .from('golf_ranges')
      .select('*')
      .gt('latitude', 0)
      .eq('city', 'Belfast')
      .order('name');

    console.log('Belfast Results:');
    console.log('- Data count:', belfastData?.length || 0);
    console.log('- Error:', belfastError);
    console.log('- Sample range:', belfastData?.[0]?.name);

    // Test Derry query
    console.log('\nTesting Derry query:');
    const { data: derryData, error: derryError } = await supabase
      .from('golf_ranges')
      .select('*')
      .gt('latitude', 0)
      .eq('city', 'Derry')
      .order('name');

    console.log('Derry Results:');
    console.log('- Data count:', derryData?.length || 0);
    console.log('- Error:', derryError);
    console.log('- Sample range:', derryData?.[0]?.name);

    // Test basic connection
    console.log('\nTesting basic connection:');
    const { data: testData, error: testError } = await supabase
      .from('golf_ranges')
      .select('count', { count: 'exact' });

    console.log('Connection test:');
    console.log('- Error:', testError);
    console.log('- Connection successful:', !testError);

    if (belfastData && belfastData.length > 0) {
      console.log('\n✅ Belfast ranges found with coordinates:');
      belfastData.forEach(range => {
        console.log(`- ${range.name}: ${range.latitude}, ${range.longitude}`);
      });
    }

    if (derryData && derryData.length > 0) {
      console.log('\n✅ Derry ranges found with coordinates:');
      derryData.forEach(range => {
        console.log(`- ${range.name}: ${range.latitude}, ${range.longitude}`);
      });
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testClientConnection();