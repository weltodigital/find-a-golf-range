const fs = require('fs');
const csv = require('csv-parser');

// Keywords that indicate mini golf/adventure golf venues to exclude
const excludeKeywords = [
  'adventure golf',
  'crazy golf',
  'mini golf',
  'miniature golf',
  'lost city',
  'windmill adventure',
  'junkyard golf',
  'golf instructor',
  'golf coaching',
  'golf lesson',
  'putting green',
  'pitch and putt',
  'driving range' // Exclude driving ranges as we're looking for indoor simulators
];

// Keywords that indicate valid golf simulators to include
const includeKeywords = [
  'indoor golf',
  'golf simulator',
  'golf studio',
  'golf lounge',
  'golf tech',
  'golf lab',
  'golf sim',
  'trackman',
  'golf bay',
  'virtual golf'
];

const validSimulators = [];
const excludedVenues = [];

function isValidSimulator(venue) {
  const title = venue.title.toLowerCase();
  const category = venue.categoryName.toLowerCase();

  // Exclude based on keywords in title
  for (const keyword of excludeKeywords) {
    if (title.includes(keyword)) {
      excludedVenues.push({ venue, reason: `Excluded: contains "${keyword}"` });
      return false;
    }
  }

  // Include if category is "Indoor golf course" and doesn't contain exclude keywords
  if (category === 'indoor golf course') {
    return true;
  }

  // Include if title contains include keywords
  for (const keyword of includeKeywords) {
    if (title.includes(keyword)) {
      return true;
    }
  }

  // Exclude if it's just a "Golf instructor" without simulator keywords
  if (category === 'golf instructor') {
    excludedVenues.push({ venue, reason: 'Excluded: Golf instructor without simulator keywords' });
    return false;
  }

  return false;
}

function processAddress(street, city, state, countryCode) {
  let address = street || '';
  if (!address && city) {
    address = city;
  }
  return address;
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// Read and process the CSV
fs.createReadStream('/Users/edwelton/Documents/Welto Digital/find-a-golf-range/dataset_google-maps-extractor_2025-11-27_14-25-38-278.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (isValidSimulator(row)) {
      const processedVenue = {
        name: row.title,
        slug: generateSlug(row.title),
        address: processAddress(row.street, row.city, row.state, row.countryCode),
        city: row.city || '',
        county: row.state || '',
        postcode: '', // Not available in this dataset
        phone: row.phone || '',
        website: row.website || '',
        email: '', // Not available in this dataset
        latitude: null, // Would need geocoding
        longitude: null, // Would need geocoding
        description: `${row.categoryName} in ${row.city}`,
        simulator_brand: '', // Not available in this dataset
        num_simulators: 1, // Default assumption
        pricing: '', // Not available in this dataset
        totalScore: parseFloat(row.totalScore) || null,
        reviewsCount: parseInt(row.reviewsCount) || 0,
        google_url: row.url
      };

      validSimulators.push(processedVenue);
    }
  })
  .on('end', () => {
    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Total venues processed: ${validSimulators.length + excludedVenues.length}`);
    console.log(`Valid simulators found: ${validSimulators.length}`);
    console.log(`Excluded venues: ${excludedVenues.length}`);

    // Save valid simulators to JSON file
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/valid-simulators.json',
      JSON.stringify(validSimulators, null, 2)
    );

    // Save excluded venues for review
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/excluded-venues.json',
      JSON.stringify(excludedVenues, null, 2)
    );

    console.log('\n=== VALID SIMULATORS SAMPLE ===');
    validSimulators.slice(0, 10).forEach((sim, index) => {
      console.log(`${index + 1}. ${sim.name} - ${sim.city} (${sim.totalScore}★, ${sim.reviewsCount} reviews)`);
    });

    console.log('\n=== EXCLUDED VENUES SAMPLE ===');
    excludedVenues.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.venue.title} - ${item.reason}`);
    });

    console.log('\nFiles created:');
    console.log('- valid-simulators.json');
    console.log('- excluded-venues.json');
  });