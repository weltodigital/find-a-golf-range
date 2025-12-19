const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// SQL to create the indoor_simulators table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS indoor_simulators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  county VARCHAR(100),
  postcode VARCHAR(20),
  phone VARCHAR(50),
  website TEXT,
  email VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  detailed_description TEXT,
  simulator_brand VARCHAR(100),
  num_simulators INTEGER DEFAULT 1,
  simulator_features TEXT,
  facilities TEXT[],
  pricing TEXT,
  opening_hours JSONB,
  images TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_indoor_simulators_city ON indoor_simulators(city);
CREATE INDEX IF NOT EXISTS idx_indoor_simulators_county ON indoor_simulators(county);
CREATE INDEX IF NOT EXISTS idx_indoor_simulators_location ON indoor_simulators(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_indoor_simulators_slug ON indoor_simulators(slug);
`;

async function createTable() {
  console.log('🏗️ Creating indoor_simulators table...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      console.log('❌ Failed to create table:', error.message);

      // Try alternative approach - check if we can at least test table creation
      console.log('\n🔄 Trying to create table using raw SQL execution...');

      // This won't work with anon key, but let's see what error we get
      const { error: rawError } = await supabase
        .from('_temp_test')
        .select('*');

      console.log('Raw error:', rawError);

      return false;
    } else {
      console.log('✅ Table created successfully!');
      return true;
    }
  } catch (err) {
    console.log('❌ Exception during table creation:', err.message);
    return false;
  }
}

async function checkExistingTables() {
  console.log('🔍 Checking existing tables...\n');

  // Let's see what tables we can access
  const tables = ['golf_ranges', 'indoor_simulators'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact' });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function main() {
  await checkExistingTables();

  console.log('\n📝 Note: Creating tables typically requires admin/service key access.');
  console.log('The anon key might not have table creation permissions.');
  console.log('You may need to create the table manually in the Supabase dashboard.');

  console.log('\n📋 Table creation SQL for manual execution:');
  console.log('=' .repeat(50));
  console.log(createTableSQL);
  console.log('=' .repeat(50));

  await createTable();
}

main().catch(console.error);