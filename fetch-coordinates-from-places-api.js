const fs = require('fs');
const csv = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Google Places API key (you need to set this)
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

async function processCsvDataWithPlacesAPI() {
  console.log('📊 Processing CSV data to extract coordinates using Google Places API...\n');

  if (GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️ Warning: Google Places API key not set.');
    console.log('Set your API key using: export GOOGLE_PLACES_API_KEY=your_api_key_here');
    console.log('Or modify the script to include your API key directly.\n');
  }

  try {
    // Read and parse CSV file
    const csvData = fs.readFileSync('/Users/edwelton/Documents/Welto Digital/find-a-golf-range/dataset_google-maps-extractor_2025-11-27_14-25-38-278.csv', 'utf8');
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      bom: true // Handle BOM if present
    });

    console.log(`📋 Found ${records.length} records in CSV\n`);

    // Process each record
    const processedData = [];
    let coordinatesFound = 0;
    let coordinatesNotFound = 0;
    let rateLimited = false;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { title, url, street, city, phone, website } = record;

      console.log(`Processing ${i + 1}/${records.length}: ${title}`);

      // Extract place ID from URL
      const placeId = extractPlaceId(url);
      let coordinates = null;

      if (placeId && GOOGLE_PLACES_API_KEY !== 'YOUR_API_KEY_HERE' && !rateLimited) {
        // Fetch coordinates from Google Places API
        coordinates = await getCoordinatesFromPlaceId(placeId);

        if (coordinates) {
          coordinatesFound++;
          console.log(`  ✅ Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else {
          coordinatesNotFound++;
          console.log(`  ❌ No coordinates found`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      } else {
        coordinatesNotFound++;
        console.log(`  ⏭️ Skipped (${placeId ? 'no API key' : 'no place ID'})`);
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

      // Check for rate limiting every 10 requests
      if (i > 0 && i % 10 === 0) {
        console.log(`\n📊 Progress: ${i}/${records.length} processed\n`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Coordinates found: ${coordinatesFound}`);
    console.log(`   Coordinates not found: ${coordinatesNotFound}`);
    console.log(`   Total records: ${records.length}`);

    // Save processed data to JSON file
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/processed-simulator-coordinates-with-places-api.json',
      JSON.stringify(processedData, null, 2)
    );

    console.log(`\n💾 Processed data saved to: processed-simulator-coordinates-with-places-api.json`);

    return processedData;

  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
    return null;
  }
}

// Function to match venues with database and update coordinates
async function matchAndUpdateVenues(processedData) {
  console.log('\n🔄 Matching venues with database...\n');

  // Get all simulator venues from database that don't have coordinates
  const { data: simulators, error } = await supabase
    .from('golf_ranges')
    .select('id, name, latitude, longitude, phone, website, address, city')
    .contains('special_features', ['Indoor Simulator'])
    .is('latitude', null); // Only get venues without coordinates

  if (error) {
    console.error('❌ Error fetching simulator venues:', error.message);
    return;
  }

  console.log(`📍 Found ${simulators.length} simulator venues without coordinates\n`);

  let matched = 0;
  const updates = [];

  // Try to match venues using multiple strategies
  for (const simulator of simulators) {
    let matchedVenue = null;

    // Strategy 1: Exact name match
    matchedVenue = processedData.find(venue =>
      venue.name.toLowerCase().trim() === simulator.name.toLowerCase().trim()
    );

    // Strategy 2: Partial name match (fuzzy matching)
    if (!matchedVenue) {
      matchedVenue = processedData.find(venue => {
        const venueName = venue.name.toLowerCase().replace(/[^\w\s]/g, '');
        const simName = simulator.name.toLowerCase().replace(/[^\w\s]/g, '');

        // Check if core words match
        const venueWords = venueName.split(/\s+/).filter(w => w.length > 2);
        const simWords = simName.split(/\s+/).filter(w => w.length > 2);

        // If at least 2 significant words match
        const matchingWords = venueWords.filter(word =>
          simWords.some(simWord => simWord.includes(word) || word.includes(simWord))
        );

        return matchingWords.length >= 2 || venueName.includes(simName) || simName.includes(venueName);
      });
    }

    // Strategy 3: Phone number match
    if (!matchedVenue && simulator.phone) {
      const cleanSimPhone = simulator.phone.replace(/[^\d+]/g, '');
      matchedVenue = processedData.find(venue => {
        if (!venue.phone) return false;
        const cleanVenuePhone = venue.phone.replace(/[^\d+]/g, '');
        return cleanSimPhone === cleanVenuePhone;
      });
    }

    // Strategy 4: Address and city match
    if (!matchedVenue && simulator.address && simulator.city) {
      matchedVenue = processedData.find(venue => {
        if (!venue.address || !venue.city) return false;

        const simAddress = simulator.address.toLowerCase();
        const venueAddress = venue.address.toLowerCase();
        const simCity = simulator.city.toLowerCase();
        const venueCity = venue.city.toLowerCase();

        return venueAddress.includes(simAddress) || simAddress.includes(venueAddress) ||
               (simCity === venueCity && (simAddress.includes(venueAddress) || venueAddress.includes(simAddress)));
      });
    }

    if (matchedVenue && matchedVenue.latitude && matchedVenue.longitude) {
      matched++;
      console.log(`✅ Match found: "${simulator.name}" → "${matchedVenue.name}"`);
      console.log(`   Coordinates: ${matchedVenue.latitude}, ${matchedVenue.longitude}`);
      console.log(`   City: ${matchedVenue.city}`);

      updates.push({
        id: simulator.id,
        name: simulator.name,
        latitude: matchedVenue.latitude,
        longitude: matchedVenue.longitude,
        matched_with: matchedVenue.name
      });
    } else {
      console.log(`❌ No match: "${simulator.name}" (${simulator.city})`);
    }
  }

  console.log(`\n📊 Matching Summary:`);
  console.log(`   Total simulators without coordinates: ${simulators.length}`);
  console.log(`   Venues matched: ${matched}`);
  console.log(`   Venues to update: ${updates.length}`);

  if (updates.length > 0) {
    // Save updates to file for the update script
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/coordinate-updates-places-api.json',
      JSON.stringify(updates, null, 2)
    );
    console.log('💾 Update data saved to: coordinate-updates-places-api.json');
  }

  return updates;
}

async function main() {
  console.log('🚀 Starting coordinate extraction and matching process...\n');

  const processedData = await processCsvDataWithPlacesAPI();

  if (processedData) {
    const updates = await matchAndUpdateVenues(processedData);

    if (updates.length > 0) {
      console.log(`\n🎯 Ready to update ${updates.length} venues with coordinates`);
      console.log('Next step: Run update-simulator-coordinates.js to execute the updates');
    } else {
      console.log('\n⚠️ No coordinates to update');
      console.log('This could be because:');
      console.log('1. No Google Places API key was provided');
      console.log('2. Venue names don\'t match between database and CSV');
      console.log('3. All venues already have coordinates');
    }
  }
}

main().catch(console.error);