const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSimpleConnection() {
  console.log('🔍 Testing simple Supabase connection...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Test with different query approaches
  const tests = [
    {
      name: 'Simple count query',
      test: () => supabase.from('golf_ranges').select('*', { count: 'exact', head: true })
    },
    {
      name: 'Basic select with limit 1',
      test: () => supabase.from('golf_ranges').select('id, name').limit(1)
    },
    {
      name: 'Select specific ID',
      test: () => supabase.from('golf_ranges').select('*').eq('id', 1).single()
    },
    {
      name: 'London ranges only',
      test: () => supabase.from('golf_ranges').select('name, city').eq('city', 'London').limit(3)
    }
  ]

  for (const { name, test } of tests) {
    console.log(`\n📋 Running: ${name}`)
    try {
      const { data, error, count } = await test()

      if (error) {
        console.log(`❌ Error:`, error.message || error)
      } else {
        console.log(`✅ Success:`, { dataLength: data?.length || 0, count })
        if (data && data.length > 0) {
          console.log(`   First result:`, data[0])
        }
      }
    } catch (err) {
      console.log(`❌ Exception:`, err.message)
    }
  }
}

testSimpleConnection()