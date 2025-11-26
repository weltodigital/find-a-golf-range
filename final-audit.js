const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function performFinalAudit() {
  try {
    const { data, error } = await supabase
      .from('golf_ranges')
      .select('name, city, county, num_bays, address, postcode, phone, email');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n🔍 FINAL DATA COMPLETENESS AUDIT\n');
    console.log(`Total ranges: ${data.length}`);

    const withBays = data.filter(r => r.num_bays);
    const withAddresses = data.filter(r => r.address && r.address.length > 5);
    const withPostcodes = data.filter(r => r.postcode);
    const withPhones = data.filter(r => r.phone);
    const withEmails = data.filter(r => r.email);
    const complete = data.filter(r => r.num_bays && r.address && r.postcode);

    console.log(`✅ With bay counts: ${withBays.length}/${data.length} (${Math.round(withBays.length/data.length*100)}%)`);
    console.log(`✅ With addresses: ${withAddresses.length}/${data.length} (${Math.round(withAddresses.length/data.length*100)}%)`);
    console.log(`✅ With postcodes: ${withPostcodes.length}/${data.length} (${Math.round(withPostcodes.length/data.length*100)}%)`);
    console.log(`📞 With phones: ${withPhones.length}/${data.length} (${Math.round(withPhones.length/data.length*100)}%)`);
    console.log(`📧 With emails: ${withEmails.length}/${data.length} (${Math.round(withEmails.length/data.length*100)}%)`);
    console.log(`🎯 Complete data (bays + address + postcode): ${complete.length}/${data.length} (${Math.round(complete.length/data.length*100)}%)`);

    // Show worst counties for missing data
    const missingData = data.filter(r => !r.num_bays || !r.address || !r.postcode);
    const countiesMissing = {};
    missingData.forEach(r => {
      if (!countiesMissing[r.county]) countiesMissing[r.county] = [];
      countiesMissing[r.county].push(r.name);
    });

    console.log('\n❌ Counties with most incomplete data:');
    Object.entries(countiesMissing)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .forEach(([county, ranges]) => {
        console.log(`   ${county}: ${ranges.length} incomplete ranges`);
      });

    // Show some examples of missing data
    console.log('\n🔍 Examples of ranges still missing data:');
    const missingBays = data.filter(r => !r.num_bays).slice(0, 10);
    console.log(`\nMissing bay counts (${missingBays.length} examples):`);
    missingBays.forEach(r => console.log(`   ${r.name} - ${r.city}, ${r.county}`));

    const missingAddresses = data.filter(r => !r.address || r.address.length <= 5).slice(0, 10);
    console.log(`\nMissing addresses (${missingAddresses.length} examples):`);
    missingAddresses.forEach(r => console.log(`   ${r.name} - ${r.city}, ${r.county}`));
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

performFinalAudit().catch(console.error);