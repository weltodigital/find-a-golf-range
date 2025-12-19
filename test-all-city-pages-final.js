const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testCityPages() {
  console.log('Testing final city page functionality on http://localhost:3001...\n');

  const testCities = [
    'London', 'Birmingham', 'Manchester', 'Bristol', 'Leeds',
    'Sheffield', 'Liverpool', 'Glasgow', 'Edinburgh', 'Cardiff',
    'Belfast', 'Newcastle', 'Nottingham', 'Leicester', 'Bradford'
  ];

  const results = [];

  for (const city of testCities) {
    const slug = city.toLowerCase().replace(/\s+/g, '-');
    const url = `http://localhost:3001/simulators/uk/${slug}`;

    try {
      // Test if page loads without "Loading" state
      const { stdout } = await execAsync(`curl -s "${url}" | grep -c "Loading ${city} simulators" || echo "0"`);
      const isLoading = parseInt(stdout.trim()) > 0;

      // Test if page shows simulator content
      const { stdout: contentTest } = await execAsync(`curl -s "${url}" | grep -c "Indoor Simulators" || echo "0"`);
      const hasContent = parseInt(contentTest.trim()) > 0;

      if (isLoading) {
        console.log(`❌ ${city}: Still stuck in loading state`);
        results.push({ city, status: 'loading' });
      } else if (!hasContent) {
        console.log(`⚠️  ${city}: No simulator content found`);
        results.push({ city, status: 'no_content' });
      } else {
        console.log(`✅ ${city}: Working correctly`);
        results.push({ city, status: 'working' });
      }
    } catch (error) {
      console.log(`❌ ${city}: Error testing page - ${error.message}`);
      results.push({ city, status: 'error' });
    }
  }

  console.log('\n=== FINAL TEST SUMMARY ===');
  console.log(`Total cities tested: ${results.length}`);
  console.log(`Working correctly: ${results.filter(r => r.status === 'working').length}`);
  console.log(`Still loading: ${results.filter(r => r.status === 'loading').length}`);
  console.log(`No content: ${results.filter(r => r.status === 'no_content').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);

  const workingCities = results.filter(r => r.status === 'working');
  if (workingCities.length === results.length) {
    console.log('\n🎉 ALL CITY PAGES ARE WORKING CORRECTLY!');
  } else {
    console.log('\nCities with issues:');
    results.filter(r => r.status !== 'working').forEach(({ city, status }) => {
      console.log(`- ${city}: ${status}`);
    });
  }
}

testCityPages().catch(console.error);