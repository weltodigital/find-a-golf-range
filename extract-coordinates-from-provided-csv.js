const fs = require('fs');
const csv = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Google Places API key (set this as environment variable or replace with your key)
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY_HERE';

// Function to extract place ID from Google Maps URL
function extractPlaceId(url) {
  try {
    const placeIdMatch = url.match(/query_place_id=([^&]+)/);
    return placeIdMatch ? placeIdMatch[1] : null;
  } catch (error) {
    console.log(`Error extracting place ID from URL: ${url}`, error.message);
    return null;
  }
}

// Function to get coordinates from Google Places API using place ID
async function getCoordinatesFromPlaceId(placeId) {
  if (!placeId || GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE') {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result && data.result.geometry) {
      return {
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng
      };
    } else {
      console.log(`Places API error for place ID ${placeId}: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.log(`Error fetching coordinates for place ID: ${placeId}`, error.message);
    return null;
  }
}

async function processCsvData() {
  console.log('📊 Processing provided CSV data to extract coordinates...\n');

  const csvFilePath = '/Users/edwelton/Documents/dataset_google-maps-extractor_2025-11-27_14-25-38-278.csv';

  if (GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️ Warning: Google Places API key not set.');
    console.log('Please set your API key using one of these methods:');
    console.log('1. Environment variable: export GOOGLE_PLACES_API_KEY=your_api_key_here');
    console.log('2. Edit this script and replace YOUR_API_KEY_HERE with your actual key');
    console.log('\nNote: You can get a free API key from Google Cloud Console\n');

    // Continue without API key to at least process the venue names
    console.log('Continuing without API key to process venue names and matching...\n');
  }

  try {
    // Read and parse CSV file (skip the first line which appears to be a title)
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.split('\n').slice(1); // Skip first line
    const csvContent = lines.join('\n');

    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true // Handle BOM if present
    });

    console.log(`📋 Found ${records.length} records in CSV\n`);

    // Process each record
    const processedData = [];
    let coordinatesFound = 0;
    let coordinatesNotFound = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { title, url, street, city, phone, website } = record;

      console.log(`Processing ${i + 1}/${records.length}: ${title}`);

      // Extract place ID from URL
      const placeId = extractPlaceId(url);
      let coordinates = null;

      if (placeId && GOOGLE_PLACES_API_KEY !== 'YOUR_API_KEY_HERE') {
        // Fetch coordinates from Google Places API
        coordinates = await getCoordinatesFromPlaceId(placeId);

        if (coordinates) {
          coordinatesFound++;
          console.log(`  ✅ Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else {
          coordinatesNotFound++;
          console.log(`  ❌ No coordinates found`);
        }

        // Add delay to avoid rate limiting (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        coordinatesNotFound++;
        if (placeId) {
          console.log(`  ⏭️ Skipped (no API key)`);
        } else {
          console.log(`  ⏭️ Skipped (no place ID)`);
        }
      }

      processedData.push({
        name: title,
        address: street,
        city: city,
        phone: phone,
        website: website,
        googleMapsUrl: url,
        placeId: placeId,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null
      });

      // Progress update every 25 requests
      if (i > 0 && i % 25 === 0) {
        console.log(`\n📊 Progress: ${i}/${records.length} processed (${Math.round((i/records.length)*100)}%)\n`);
      }
    }

    console.log(`\n📈 Processing Summary:`);
    console.log(`   Total venues processed: ${records.length}`);
    console.log(`   Coordinates found: ${coordinatesFound}`);
    console.log(`   Coordinates not found: ${coordinatesNotFound}`);

    if (GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE') {
      console.log(`   Note: All coordinates marked as "not found" due to missing API key`);
    }

    // Save processed data to JSON file
    const outputFile = '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/processed-venues-with-coordinates.json';
    fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));

    console.log(`\n💾 Processed data saved to: processed-venues-with-coordinates.json`);

    return processedData;

  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
    return null;
  }
}

// Improved venue matching function
async function matchAndUpdateVenues(processedData) {
  console.log('\n🔄 Matching venues with database...\n');

  // Get all simulator venues from database that don't have coordinates
  const { data: simulators, error } = await supabase
    .from('golf_ranges')
    .select('id, name, latitude, longitude, phone, website, address, city, postcode')
    .contains('special_features', ['Indoor Simulator'])
    .or('latitude.is.null,longitude.is.null'); // Get venues with missing lat OR lng

  if (error) {
    console.error('❌ Error fetching simulator venues:', error.message);
    return;
  }

  console.log(`📍 Found ${simulators.length} simulator venues with missing coordinates\n`);

  let matched = 0;
  const updates = [];
  const unmatchedDbVenues = [];
  const unmatchedCsvVenues = [];

  // Create a copy of processed data for tracking unmatched venues
  const csvVenuesUsed = new Set();

  // Try to match venues using multiple strategies
  for (const simulator of simulators) {
    let matchedVenue = null;
    let matchStrategy = '';

    // Strategy 1: Exact name match
    matchedVenue = processedData.find(venue => {
      const venueName = venue.name.toLowerCase().trim();
      const simName = simulator.name.toLowerCase().trim();
      return venueName === simName;
    });
    if (matchedVenue) matchStrategy = 'exact name';

    // Strategy 2: Fuzzy name match (core words)
    if (!matchedVenue) {
      matchedVenue = processedData.find(venue => {
        const venueName = venue.name.toLowerCase().replace(/[^\w\s]/g, '');
        const simName = simulator.name.toLowerCase().replace(/[^\w\s]/g, '');

        // Extract significant words (length > 2)
        const venueWords = venueName.split(/\s+/).filter(w => w.length > 2);
        const simWords = simName.split(/\s+/).filter(w => w.length > 2);

        // Count matching words
        const matchingWords = venueWords.filter(word =>
          simWords.some(simWord => simWord.includes(word) || word.includes(simWord))
        );

        // Require at least 2 matching words or 70% word overlap
        return matchingWords.length >= 2 ||
               (matchingWords.length >= Math.min(venueWords.length, simWords.length) * 0.7);
      });
      if (matchedVenue) matchStrategy = 'fuzzy name';
    }

    // Strategy 3: Phone number match
    if (!matchedVenue && simulator.phone) {
      const cleanSimPhone = simulator.phone.replace(/[^\d+]/g, '');
      matchedVenue = processedData.find(venue => {
        if (!venue.phone) return false;
        const cleanVenuePhone = venue.phone.replace(/[^\d+]/g, '');
        return cleanSimPhone === cleanVenuePhone && cleanSimPhone.length > 5;
      });
      if (matchedVenue) matchStrategy = 'phone';
    }

    // Strategy 4: Website domain match
    if (!matchedVenue && simulator.website && simulator.website.includes('http')) {
      try {
        const simDomain = new URL(simulator.website).hostname.toLowerCase();
        matchedVenue = processedData.find(venue => {
          if (!venue.website || !venue.website.includes('http')) return false;
          try {
            const venueDomain = new URL(venue.website).hostname.toLowerCase();
            return simDomain === venueDomain;
          } catch {
            return false;
          }
        });
        if (matchedVenue) matchStrategy = 'website';
      } catch {
        // Invalid URL format
      }
    }

    // Strategy 5: City + partial name match
    if (!matchedVenue && simulator.city) {
      matchedVenue = processedData.find(venue => {
        if (!venue.city) return false;
        const sameCity = venue.city.toLowerCase() === simulator.city.toLowerCase();
        if (!sameCity) return false;

        // Check if names have some overlap
        const venueName = venue.name.toLowerCase().replace(/[^\w\s]/g, '');
        const simName = simulator.name.toLowerCase().replace(/[^\w\s]/g, '');

        return venueName.includes(simName.split(' ')[0]) ||
               simName.includes(venueName.split(' ')[0]) ||
               venueName.includes('golf') && simName.includes('golf');
      });
      if (matchedVenue) matchStrategy = 'city + partial name';
    }

    if (matchedVenue && (matchedVenue.latitude && matchedVenue.longitude)) {
      matched++;
      csvVenuesUsed.add(processedData.indexOf(matchedVenue));

      console.log(`✅ Match found (${matchStrategy}): "${simulator.name}" → "${matchedVenue.name}"`);
      console.log(`   City: ${simulator.city} → ${matchedVenue.city}`);
      console.log(`   Coordinates: ${matchedVenue.latitude}, ${matchedVenue.longitude}`);

      updates.push({
        id: simulator.id,
        name: simulator.name,
        latitude: matchedVenue.latitude,
        longitude: matchedVenue.longitude,
        matched_with: matchedVenue.name,
        match_strategy: matchStrategy
      });
    } else {
      console.log(`❌ No match: "${simulator.name}" (${simulator.city || 'No city'})`);
      unmatchedDbVenues.push({
        name: simulator.name,
        city: simulator.city,
        phone: simulator.phone
      });
    }
  }

  // Track unmatched CSV venues
  processedData.forEach((venue, index) => {
    if (!csvVenuesUsed.has(index) && venue.latitude && venue.longitude) {
      unmatchedCsvVenues.push({
        name: venue.name,
        city: venue.city,
        phone: venue.phone
      });
    }
  });

  console.log(`\n📊 Matching Summary:`);
  console.log(`   Database venues needing coordinates: ${simulators.length}`);
  console.log(`   CSV venues with coordinates: ${processedData.filter(v => v.latitude && v.longitude).length}`);
  console.log(`   Successful matches: ${matched}`);
  console.log(`   Venues ready to update: ${updates.length}`);
  console.log(`   Unmatched database venues: ${unmatchedDbVenues.length}`);
  console.log(`   Unmatched CSV venues: ${unmatchedCsvVenues.length}`);

  if (updates.length > 0) {
    // Save updates to file
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/coordinate-updates-ready.json',
      JSON.stringify(updates, null, 2)
    );
    console.log('\n💾 Update data saved to: coordinate-updates-ready.json');
  }

  // Save unmatched venues for manual review
  if (unmatchedDbVenues.length > 0 || unmatchedCsvVenues.length > 0) {
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/unmatched-venues-review.json',
      JSON.stringify({
        unmatched_database_venues: unmatchedDbVenues,
        unmatched_csv_venues: unmatchedCsvVenues
      }, null, 2)
    );
    console.log('📋 Unmatched venues saved to: unmatched-venues-review.json');
  }

  return updates;
}

async function main() {
  console.log('🚀 Starting coordinate extraction and venue matching...\n');

  const processedData = await processCsvData();

  if (processedData) {
    const updates = await matchAndUpdateVenues(processedData);

    if (updates && updates.length > 0) {
      console.log(`\n🎯 Ready to update ${updates.length} venues with coordinates!`);
      console.log('\nNext steps:');
      console.log('1. Review the matches in coordinate-updates-ready.json');
      console.log('2. Run: node update-simulator-coordinates.js');
      console.log('3. Check unmatched-venues-review.json for manual matching if needed');
    } else if (GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE') {
      console.log('\n⚠️ To get coordinates, you need to:');
      console.log('1. Get a Google Places API key from Google Cloud Console');
      console.log('2. Set the API key and run this script again');
      console.log('3. The script will then fetch coordinates and match venues');
    } else {
      console.log('\n⚠️ No coordinate updates possible');
      console.log('This could be because:');
      console.log('- All venues already have coordinates');
      console.log('- Venue names don\'t match between database and CSV');
      console.log('- API errors occurred while fetching coordinates');
    }
  }
}

main().catch(console.error);