const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAndCreateTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    // First, let's see what tables we can access
    console.log('📋 Attempting to list tables...');

    // Try to check if golf_ranges exists by querying its schema
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'golf_ranges');

    console.log('Table info result:', tableInfo, tableError);

    // Create the golf_ranges table if it doesn't exist
    const createGolfRangesSQL = `
    CREATE TABLE IF NOT EXISTS golf_ranges (
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
      num_bays INTEGER,
      facilities TEXT[],
      features TEXT,
      special_features TEXT,
      pricing TEXT,
      opening_hours JSONB,
      images TEXT[],
      meta_title VARCHAR(255),
      meta_description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_golf_ranges_city ON golf_ranges(city);
    CREATE INDEX IF NOT EXISTS idx_golf_ranges_county ON golf_ranges(county);
    CREATE INDEX IF NOT EXISTS idx_golf_ranges_location ON golf_ranges(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_golf_ranges_slug ON golf_ranges(slug);
    `;

    console.log('🏗️ Creating golf_ranges table...');

    // Since we can't use raw SQL with the anon key, let's try a different approach
    // Let's try to insert a test record to see if the table exists
    const { data: testData, error: testError } = await supabase
      .from('golf_ranges')
      .insert([{
        name: 'Test Range',
        slug: 'test-range-temp',
        address: 'Test Address',
        city: 'Test City',
        county: 'Test County'
      }])
      .select();

    if (testError) {
      if (testError.message.includes('relation "golf_ranges" does not exist')) {
        console.log('❌ golf_ranges table does not exist!');
        console.log('\n🛠️ You need to create the golf_ranges table in your Supabase dashboard.');
        console.log('Go to your Supabase dashboard > SQL Editor and run this SQL:');
        console.log('\n' + createGolfRangesSQL);
      } else {
        console.log('❌ Other error:', testError);
      }
    } else {
      console.log('✅ golf_ranges table exists! Test insert successful.');

      // Clean up test record
      await supabase
        .from('golf_ranges')
        .delete()
        .eq('slug', 'test-range-temp');

      console.log('🧹 Cleaned up test record.');

      // Check how many records are in the table
      const { count, error: countError } = await supabase
        .from('golf_ranges')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`📊 Found ${count} records in golf_ranges table.`);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkAndCreateTables();