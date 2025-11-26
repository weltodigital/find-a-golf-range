const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Major cities to prioritize
const MAJOR_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool',
  'Sheffield', 'Bristol', 'Edinburgh', 'Glasgow', 'Newcastle',
  'Cardiff', 'Belfast', 'Bradford', 'Nottingham', 'Leicester',
  'Coventry', 'Hull', 'Stoke-on-Trent', 'Derby', 'Southampton'
];

async function getVenuesForPhase2() {
  try {
    console.log('🔍 Fetching venues without websites from major cities...\n');

    // Get venues from major cities first
    const { data: majorCityVenues, error: majorError } = await supabase
      .from('golf_ranges')
      .select('id, name, city, address, phone, postcode')
      .or('website.is.null,website.eq.""')
      .in('city', MAJOR_CITIES)
      .order('city, name')
      .limit(30);

    if (majorError) {
      console.error('❌ Error fetching major city venues:', majorError);
    }

    // Get additional venues from other cities if needed
    const { data: otherVenues, error: otherError } = await supabase
      .from('golf_ranges')
      .select('id, name, city, address, phone, postcode')
      .or('website.is.null,website.eq.""')
      .not('city', 'in', `(${MAJOR_CITIES.map(c => `'${c}'`).join(',')})`)
      .not('address', 'is', null)  // Prioritize venues with addresses
      .neq('address', '')
      .order('city, name')
      .limit(20);

    if (otherError) {
      console.error('❌ Error fetching other venues:', otherError);
    }

    // Combine and prioritize venues
    const allVenues = [
      ...(majorCityVenues || []),
      ...(otherVenues || [])
    ];

    // Group venues by city for easier processing
    const venuesByCity = {};
    allVenues.forEach(venue => {
      if (!venuesByCity[venue.city]) {
        venuesByCity[venue.city] = [];
      }
      venuesByCity[venue.city].push(venue);
    });

    console.log('📊 VENUES FOUND BY CITY:');
    console.log('='.repeat(50));

    let totalVenues = 0;
    Object.keys(venuesByCity).sort().forEach(city => {
      const venues = venuesByCity[city];
      const isMajorCity = MAJOR_CITIES.includes(city);
      console.log(`${isMajorCity ? '🏙️' : '🏘️'} ${city}: ${venues.length} venues`);
      totalVenues += venues.length;
    });

    console.log(`\n📈 Total venues to research: ${totalVenues}`);
    console.log(`🎯 Target for Phase 2: 15-20 websites added\n`);

    return allVenues.slice(0, 25); // Return first 25 venues for Phase 2
  } catch (err) {
    console.error('❌ Failed to fetch venues:', err.message);
    return [];
  }
}

// Export for use in other scripts
module.exports = { getVenuesForPhase2, supabase };

// CLI interface
if (require.main === module) {
  getVenuesForPhase2().then(venues => {
    console.log(`\n✅ Retrieved ${venues.length} venues for Phase 2 research`);
    console.log('\n📋 DETAILED VENUE LIST:');
    console.log('='.repeat(80));

    venues.forEach((venue, index) => {
      console.log(`\n${index + 1}. ${venue.name}`);
      console.log(`   📍 City: ${venue.city}`);
      console.log(`   🏠 Address: ${venue.address || 'Not provided'}`);
      console.log(`   📞 Phone: ${venue.phone || 'Not provided'}`);
      console.log(`   📮 Postcode: ${venue.postcode || 'Not provided'}`);
      console.log(`   🆔 ID: ${venue.id}`);
    });

    process.exit(0);
  }).catch(err => {
    console.error('❌ Failed to fetch venues:', err);
    process.exit(1);
  });
}