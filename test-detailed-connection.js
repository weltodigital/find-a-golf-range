const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey?.length)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDetailedConnection() {
  try {
    // Test 1: Check if we can connect to auth
    console.log('\n📋 Test 1: Basic auth check...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Auth connection successful')
    }

    // Test 2: Try to list tables (this will fail if we don't have permissions but will tell us if the connection works)
    console.log('\n📋 Test 2: Checking table access...')
    const { data, error } = await supabase
      .from('golf_ranges')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.log('❌ Table access error:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Table access successful, count:', data)
    }

    // Test 3: Try a simple select
    console.log('\n📋 Test 3: Simple select query...')
    const { data: selectData, error: selectError } = await supabase
      .from('golf_ranges')
      .select('id, name, city')
      .limit(3)

    if (selectError) {
      console.log('❌ Select error:', selectError)
    } else {
      console.log('✅ Select successful, found', selectData?.length, 'rows')
      if (selectData && selectData.length > 0) {
        selectData.forEach(range => console.log(`   - ${range.name} in ${range.city}`))
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testDetailedConnection()