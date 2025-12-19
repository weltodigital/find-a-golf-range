const fs = require('fs');
const csv = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

// Function to extract coordinates from Google Maps URL
function extractCoordinatesFromUrl(url) {
  try {
    // Google Maps URLs can have coordinates in different formats
    // Common patterns:
    // 1. @lat,lng,zoom
    // 2. query_place_id format (we'll need to use Google Places API for this)
    // 3. /maps/place/name/@lat,lng

    // Try to find @lat,lng pattern
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2])
      };
    }

    // If no direct coordinates found, we'll use Google Places API
    // For now, return null and we'll handle this separately
    return null;
  } catch (error) {
    console.log(`Error extracting coordinates from URL: ${url}`, error.message);
    return null;
  }
}

// Function to get coordinates using Google Places API
async function getCoordinatesFromPlaceId(placeId) {
  try {
    // Note: This requires a Google Places API key
    // For now, we'll return null and focus on direct coordinate extraction
    return null;
  } catch (error) {
    console.log(`Error getting coordinates for place ID: ${placeId}`, error.message);
    return null;
  }
}

async function processCsvData() {
  console.log('📊 Processing CSV data to extract coordinates...\n');

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

    for (const record of records) {
      const { title, url, street, city, phone, website } = record;

      // Extract coordinates from the Google Maps URL
      const coordinates = extractCoordinatesFromUrl(url);

      if (coordinates) {
        coordinatesFound++;
        console.log(`✅ ${title}: ${coordinates.latitude}, ${coordinates.longitude}`);
      } else {
        coordinatesNotFound++;
        console.log(`❌ ${title}: No coordinates found in URL`);
      }

      processedData.push({
        name: title,
        address: street,
        city: city,
        phone: phone,
        website: website,
        googleMapsUrl: url,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null
      });
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Coordinates found: ${coordinatesFound}`);
    console.log(`   Coordinates not found: ${coordinatesNotFound}`);
    console.log(`   Total records: ${records.length}`);

    // Save processed data to JSON file
    fs.writeFileSync(
      '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/processed-simulator-coordinates.json',
      JSON.stringify(processedData, null, 2)
    );

    console.log(`\n💾 Processed data saved to: processed-simulator-coordinates.json`);

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
    .select('id, name, latitude, longitude, phone, website')
    .contains('special_features', ['Indoor Simulator'])
    .is('latitude', null); // Only get venues without coordinates

  if (error) {
    console.error('❌ Error fetching simulator venues:', error.message);
    return;
  }

  console.log(`📍 Found ${simulators.length} simulator venues without coordinates\n`);

  let matched = 0;
  let updated = 0;
  const updates = [];

  // Try to match venues
  for (const simulator of simulators) {
    let matchedVenue = null;

    // Try exact name match first
    matchedVenue = processedData.find(venue =>
      venue.name.toLowerCase().trim() === simulator.name.toLowerCase().trim()
    );

    // If no exact match, try partial name match
    if (!matchedVenue) {
      matchedVenue = processedData.find(venue => {
        const venueName = venue.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const simName = simulator.name.toLowerCase().replace(/[^\w\s]/g, '').trim();

        // Check if one name contains the other (at least 70% overlap)
        return venueName.includes(simName) || simName.includes(venueName);
      });
    }

    // If still no match, try phone number match
    if (!matchedVenue && simulator.phone) {
      const cleanSimPhone = simulator.phone.replace(/[^\d]/g, '');
      matchedVenue = processedData.find(venue => {
        if (!venue.phone) return false;
        const cleanVenuePhone = venue.phone.replace(/[^\d]/g, '');
        return cleanSimPhone === cleanVenuePhone;
      });
    }

    if (matchedVenue && matchedVenue.latitude && matchedVenue.longitude) {
      matched++;
      console.log(`✅ Match found: "${simulator.name}" → "${matchedVenue.name}"`);
      console.log(`   Coordinates: ${matchedVenue.latitude}, ${matchedVenue.longitude}`);

      updates.push({
        id: simulator.id,
        latitude: matchedVenue.latitude,
        longitude: matchedVenue.longitude
      });
    } else {
      console.log(`❌ No match: "${simulator.name}"`);
    }
  }

  console.log(`\n📊 Matching Summary:`);
  console.log(`   Venues matched: ${matched}`);
  console.log(`   Venues to update: ${updates.length}`);

  return updates;
}

async function main() {
  const processedData = await processCsvData();

  if (processedData) {
    const updates = await matchAndUpdateVenues(processedData);

    if (updates.length > 0) {
      console.log(`\n🚀 Ready to update ${updates.length} venues with coordinates`);
      console.log('Run update-simulator-coordinates.js to execute the updates');

      // Save updates to file for the update script
      fs.writeFileSync(
        '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/coordinate-updates.json',
        JSON.stringify(updates, null, 2)
      );
      console.log('💾 Update data saved to: coordinate-updates.json');
    } else {
      console.log('\n⚠️ No coordinates to update');
    }
  }
}

main().catch(console.error);