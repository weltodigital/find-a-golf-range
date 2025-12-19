const fs = require('fs');
const csv = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

async function processCsvWithCoordinates() {
  console.log('🎯 Processing CSV with latitude/longitude coordinates...\n');

  const csvFilePath = '/Users/edwelton/Downloads/dataset_google-maps-extractor_2025-11-27_14-40-43-449.csv';

  try {
    // Read and parse CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.split('\n').slice(1); // Skip first line (title)
    const csvContent = lines.join('\n');

    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });

    console.log(`📋 Found ${records.length} records in CSV\n`);

    // Process each record and extract coordinates
    const processedVenues = [];
    let validCoordinates = 0;
    let invalidCoordinates = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const {
        title,
        address,
        city,
        phone,
        website,
        'location/lat': latitude,
        'location/lng': longitude,
        placeId,
        categoryName
      } = record;

      // Parse coordinates
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      const isValidCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

      if (isValidCoordinates) {
        validCoordinates++;
        console.log(`✅ ${i + 1}/${records.length}: ${title}`);
        console.log(`   Coordinates: ${lat}, ${lng}`);
        console.log(`   City: ${city}`);
      } else {
        invalidCoordinates++;
        console.log(`❌ ${i + 1}/${records.length}: ${title} (Invalid coordinates)`);
      }

      processedVenues.push({
        name: title,
        address: address,
        city: city,
        phone: phone,
        website: website,
        latitude: isValidCoordinates ? lat : null,
        longitude: isValidCoordinates ? lng : null,
        placeId: placeId,
        categoryName: categoryName
      });

      // Progress update every 25 venues
      if (i > 0 && i % 25 === 0) {
        console.log(`\n📊 Progress: ${i}/${records.length} processed (${Math.round((i/records.length)*100)}%)\n`);
      }
    }

    console.log(`\n📈 Coordinate Processing Summary:`);
    console.log(`   Total venues: ${records.length}`);
    console.log(`   Valid coordinates: ${validCoordinates}`);
    console.log(`   Invalid coordinates: ${invalidCoordinates}`);

    // Save processed data
    const outputFile = '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/processed-venues-with-coordinates-final.json';
    fs.writeFileSync(outputFile, JSON.stringify(processedVenues, null, 2));
    console.log(`💾 Processed venues saved to: processed-venues-with-coordinates-final.json`);

    return processedVenues;

  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
    return null;
  }
}

async function matchAndPrepareUpdates(processedVenues) {
  console.log('\n🔍 Matching venues with database...\n');

  // Get all simulator venues from database that don't have coordinates
  const { data: simulators, error } = await supabase
    .from('golf_ranges')
    .select('id, name, latitude, longitude, phone, website, address, city, postcode')
    .contains('special_features', ['Indoor Simulator'])
    .or('latitude.is.null,longitude.is.null');

  if (error) {
    console.error('❌ Error fetching simulator venues:', error.message);
    return [];
  }

  console.log(`📍 Found ${simulators.length} simulator venues needing coordinates`);

  const updates = [];
  const matchedVenues = new Set();
  let exactMatches = 0;
  let fuzzyMatches = 0;
  let phoneMatches = 0;
  let websiteMatches = 0;
  let cityNameMatches = 0;

  // Helper function to normalize text for comparison
  function normalizeText(text) {
    return text?.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || '';
  }

  // Helper function to extract significant words
  function getSignificantWords(text) {
    return normalizeText(text)
      .split(' ')
      .filter(word => word.length > 2 && !['golf', 'ltd', 'limited', 'club', 'the', 'and'].includes(word));
  }

  for (const simulator of simulators) {
    let matchedVenue = null;
    let matchStrategy = '';

    // Strategy 1: Exact name match
    matchedVenue = processedVenues.find(venue => {
      return normalizeText(venue.name) === normalizeText(simulator.name);
    });
    if (matchedVenue) {
      matchStrategy = 'exact name';
      exactMatches++;
    }

    // Strategy 2: Phone number match (most reliable)
    if (!matchedVenue && simulator.phone) {
      const simPhoneDigits = simulator.phone.replace(/[^\d]/g, '');
      if (simPhoneDigits.length >= 8) {
        matchedVenue = processedVenues.find(venue => {
          if (!venue.phone) return false;
          const venuePhoneDigits = venue.phone.replace(/[^\d]/g, '');
          return venuePhoneDigits === simPhoneDigits;
        });
        if (matchedVenue) {
          matchStrategy = 'phone number';
          phoneMatches++;
        }
      }
    }

    // Strategy 3: Website domain match
    if (!matchedVenue && simulator.website && simulator.website.includes('http')) {
      try {
        const simDomain = new URL(simulator.website).hostname.toLowerCase().replace('www.', '');
        matchedVenue = processedVenues.find(venue => {
          if (!venue.website || !venue.website.includes('http')) return false;
          try {
            const venueDomain = new URL(venue.website).hostname.toLowerCase().replace('www.', '');
            return simDomain === venueDomain;
          } catch {
            return false;
          }
        });
        if (matchedVenue) {
          matchStrategy = 'website domain';
          websiteMatches++;
        }
      } catch {
        // Invalid URL
      }
    }

    // Strategy 4: Fuzzy name matching with significant words
    if (!matchedVenue) {
      const simWords = getSignificantWords(simulator.name);
      if (simWords.length >= 2) {
        matchedVenue = processedVenues.find(venue => {
          const venueWords = getSignificantWords(venue.name);
          if (venueWords.length === 0) return false;

          // Count matching words
          const matchingWords = simWords.filter(simWord =>
            venueWords.some(venueWord =>
              simWord.includes(venueWord) || venueWord.includes(simWord)
            )
          );

          // Require at least 2 matching words or 70% overlap
          const minWords = Math.min(simWords.length, venueWords.length);
          return matchingWords.length >= 2 || (matchingWords.length / minWords) >= 0.7;
        });
        if (matchedVenue) {
          matchStrategy = 'fuzzy name';
          fuzzyMatches++;
        }
      }
    }

    // Strategy 5: Same city + partial name match
    if (!matchedVenue && simulator.city) {
      matchedVenue = processedVenues.find(venue => {
        if (!venue.city || normalizeText(venue.city) !== normalizeText(simulator.city)) {
          return false;
        }

        // Check for any significant word overlap
        const simWords = getSignificantWords(simulator.name);
        const venueWords = getSignificantWords(venue.name);

        return simWords.some(simWord =>
          venueWords.some(venueWord =>
            simWord.includes(venueWord) || venueWord.includes(simWord)
          )
        );
      });
      if (matchedVenue) {
        matchStrategy = 'city + partial name';
        cityNameMatches++;
      }
    }

    // Check if venue has valid coordinates and hasn't been matched already
    if (matchedVenue &&
        matchedVenue.latitude &&
        matchedVenue.longitude &&
        !matchedVenues.has(processedVenues.indexOf(matchedVenue))) {

      matchedVenues.add(processedVenues.indexOf(matchedVenue));

      console.log(`✅ Match (${matchStrategy}): "${simulator.name}" → "${matchedVenue.name}"`);
      console.log(`   Location: ${simulator.city} → ${matchedVenue.city}`);
      console.log(`   Coordinates: ${matchedVenue.latitude}, ${matchedVenue.longitude}`);

      updates.push({
        id: simulator.id,
        name: simulator.name,
        latitude: matchedVenue.latitude,
        longitude: matchedVenue.longitude,
        matched_with: matchedVenue.name,
        match_strategy: matchStrategy,
        city: simulator.city
      });
    } else {
      console.log(`❌ No match: "${simulator.name}" (${simulator.city || 'No city'})`);
    }
  }

  console.log(`\n📊 Matching Results:`);
  console.log(`   Database venues needing coordinates: ${simulators.length}`);
  console.log(`   CSV venues with valid coordinates: ${processedVenues.filter(v => v.latitude && v.longitude).length}`);
  console.log(`   Total successful matches: ${updates.length}`);
  console.log(`   - Exact name matches: ${exactMatches}`);
  console.log(`   - Phone matches: ${phoneMatches}`);
  console.log(`   - Website matches: ${websiteMatches}`);
  console.log(`   - Fuzzy name matches: ${fuzzyMatches}`);
  console.log(`   - City + name matches: ${cityNameMatches}`);
  console.log(`   Unmatched database venues: ${simulators.length - updates.length}`);

  if (updates.length > 0) {
    // Save updates for execution
    const updateFile = '/Users/edwelton/Documents/Welto Digital/find-a-golf-range/final-coordinate-updates.json';
    fs.writeFileSync(updateFile, JSON.stringify(updates, null, 2));
    console.log(`\n💾 Coordinate updates saved to: final-coordinate-updates.json`);
  }

  return updates;
}

async function executeUpdates(updates) {
  if (updates.length === 0) {
    console.log('⚠️ No updates to execute');
    return;
  }

  console.log(`\n🚀 Executing ${updates.length} coordinate updates...\n`);

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const { id, name, latitude, longitude, match_strategy } = update;

    console.log(`Updating ${i + 1}/${updates.length}: ${name}`);
    console.log(`  Strategy: ${match_strategy}`);
    console.log(`  Coordinates: ${latitude}, ${longitude}`);

    try {
      const { data, error } = await supabase
        .from('golf_ranges')
        .update({
          latitude: latitude,
          longitude: longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, latitude, longitude');

      if (error) {
        console.log(`  ❌ Update failed: ${error.message}`);
        errorCount++;
        results.push({
          id, name, status: 'error', error: error.message
        });
      } else {
        console.log(`  ✅ Updated successfully`);
        successCount++;
        results.push({
          id, name, status: 'success',
          latitude: data[0]?.latitude,
          longitude: data[0]?.longitude
        });
      }

      // Small delay to be nice to the database
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      errorCount++;
      results.push({
        id, name, status: 'error', error: err.message
      });
    }
  }

  console.log(`\n📈 Update Results:`);
  console.log(`   Successful updates: ${successCount}`);
  console.log(`   Failed updates: ${errorCount}`);
  console.log(`   Total processed: ${updates.length}`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `/Users/edwelton/Documents/Welto Digital/find-a-golf-range/coordinate-update-results-${timestamp}.json`;

  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: updates.length,
    successful: successCount,
    failed: errorCount,
    results: results
  }, null, 2));

  console.log(`💾 Results saved to: ${resultsFile.split('/').pop()}`);

  return results;
}

async function verifyResults() {
  console.log('\n🔍 Verifying coordinate updates...\n');

  try {
    // Get updated counts
    const { count: withCoordinates } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator'])
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    const { count: withoutCoordinates } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator'])
      .is('latitude', null);

    const { count: total } = await supabase
      .from('golf_ranges')
      .select('*', { count: 'exact', head: true })
      .contains('special_features', ['Indoor Simulator']);

    console.log(`📊 Final Simulator Coordinates Status:`);
    console.log(`   Total simulators: ${total}`);
    console.log(`   With coordinates: ${withCoordinates}`);
    console.log(`   Without coordinates: ${withoutCoordinates}`);
    console.log(`   Coverage: ${total ? Math.round((withCoordinates / total) * 100) : 0}%`);

    // Show sample of updated venues
    const { data: sampleUpdated, error } = await supabase
      .from('golf_ranges')
      .select('name, latitude, longitude, city')
      .contains('special_features', ['Indoor Simulator'])
      .not('latitude', 'is', null)
      .limit(5);

    if (!error && sampleUpdated.length > 0) {
      console.log(`\n✅ Sample updated venues:`);
      sampleUpdated.forEach((venue, index) => {
        console.log(`  ${index + 1}. ${venue.name} (${venue.city})`);
        console.log(`     Coordinates: ${venue.latitude}, ${venue.longitude}`);
      });
    }

  } catch (error) {
    console.error('❌ Error verifying results:', error.message);
  }
}

async function main() {
  console.log('🎯 Starting complete coordinate update process...\n');

  // Step 1: Process CSV with coordinates
  const processedVenues = await processCsvWithCoordinates();
  if (!processedVenues) return;

  // Step 2: Match venues and prepare updates
  const updates = await matchAndPrepareUpdates(processedVenues);
  if (updates.length === 0) {
    console.log('\n⚠️ No coordinate updates to execute');
    return;
  }

  // Step 3: Execute updates
  const results = await executeUpdates(updates);

  // Step 4: Verify results
  await verifyResults();

  console.log('\n🎉 Coordinate update process complete!');
}

main().catch(console.error);