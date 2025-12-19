const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...')

    // Test basic connection with a simple count
    const { data, error, count } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log('✅ Connection successful!')
    console.log(`📊 Total ranges in database: ${count}`)
    console.log(`📝 Sample ranges (first 5):`)

    if (data && data.length > 0) {
      data.forEach((range, index) => {
        console.log(`   ${index + 1}. ${range.name} in ${range.city}`)
      })
    } else {
      console.log('   No ranges found in database')
    }

  } catch (err) {
    console.error('❌ Connection failed:', err)
  }
}

testConnection()