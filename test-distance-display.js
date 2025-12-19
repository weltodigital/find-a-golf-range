const { execSync } = require('child_process');

console.log('Testing distance display functionality...\n');

const cities = ['bradford', 'birmingham', 'manchester', 'london'];

cities.forEach(city => {
  try {
    // Check if the page loads
    const content = execSync(`curl -s http://localhost:3000/simulators/uk/${city}`).toString();

    // Check for distance patterns
    const distanceMatches = content.match(/(\d+\.?\d*)\s*mi\s*from\s+[A-Z][a-z]+/g);
    const locatedInMatches = content.match(/Located in [A-Z][a-z]+/g);

    console.log(`${city.toUpperCase()}:`);
    console.log(`  Distance displays found: ${distanceMatches ? distanceMatches.length : 0}`);
    if (distanceMatches) {
      console.log(`  Examples: ${distanceMatches.slice(0, 3).join(', ')}`);
    }
    console.log(`  "Located in" displays found: ${locatedInMatches ? locatedInMatches.length : 0}`);
    console.log('');

  } catch (error) {
    console.log(`${city.toUpperCase()}: Error - ${error.message}\n`);
  }
});