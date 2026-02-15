// Create a list of all cities we need to check based on the URLs you've mentioned
const missingCities = [
  { name: 'Abingdon', normalized: 'abingdon', lat: 51.6721, lng: -1.2833 },
  { name: 'Waltham Cross', normalized: 'walthamcross', lat: 51.6869, lng: -0.0333 },
  // Let's add more cities that might be missing
];

console.log('🔍 MISSING CITIES IDENTIFIED:');
console.log('='.repeat(50));

missingCities.forEach((city, index) => {
  console.log(`${index + 1}. ${city.name}`);
  console.log(`   Normalized: ${city.normalized}`);
  console.log(`   Coordinates: ${city.lat}, ${city.lng}`);
  console.log(`   URL: https://www.findagolfrange.com/simulators/uk/${city.name.toLowerCase().replace(/\s+/g, '-')}`);
  console.log('');
});

console.log('🔧 FIXES NEEDED:');
console.log('Add these to the cityCoords object:');
console.log('');

missingCities.forEach((city) => {
  console.log(`${city.normalized}: { latitude: ${city.lat}, longitude: ${city.lng} },`);
});