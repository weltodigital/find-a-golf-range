const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testDirectAPI() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/golf_ranges`;
  const headers = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  console.log('🔍 Testing direct REST API call...');
  console.log('URL:', url);
  console.log('Headers present:', Object.keys(headers));

  try {
    const response = await fetch(`${url}?select=id,name,city&limit=3`, {
      method: 'GET',
      headers: headers
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Success! Found', data.length, 'ranges');
        data.forEach(range => console.log(`  - ${range.name} in ${range.city}`));
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError.message);
      }
    } else {
      console.log('❌ HTTP Error:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testDirectAPI();