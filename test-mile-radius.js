const { execSync } = require('child_process');

console.log('Testing mile radius calculation...\n');

const cities = ['london', 'birmingham', 'manchester', 'bradford', 'enfield'];

cities.forEach(city => {
  try {
    // Check if the page loads and look for pattern around Mile Radius
    const content = execSync(`curl -s http://localhost:3000/simulators/uk/${city}`).toString();

    // Look for the mile radius in the statistics section
    const mileRadiusMatch = content.match(/(\d+)\s*<\/div>\s*<div[^>]*>Mile Radius/);

    console.log(`${city.toUpperCase()}:`);
    if (mileRadiusMatch) {
      console.log(`  Mile Radius: ${mileRadiusMatch[1]}`);
    } else {
      // Look for any number patterns near "Mile Radius"
      const alternateMatch = content.match(/Mile Radius[^>]*>\s*(\d+)/);
      if (alternateMatch) {
        console.log(`  Mile Radius (alternate): ${alternateMatch[1]}`);
      } else {
        console.log('  Mile Radius: Not found in static content (client-side rendered)');
      }
    }

    // Check if page is loading properly
    const hasSimulators = content.includes('Indoor Simulators');
    console.log(`  Page loads: ${hasSimulators ? 'Yes' : 'No'}`);
    console.log('');

  } catch (error) {
    console.log(`${city.toUpperCase()}: Error - ${error.message.slice(0, 50)}...\n`);
  }
});