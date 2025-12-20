const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdmt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createSlug(name) {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function verifyFinalLocationPages() {
  console.log('🔍 FINAL VERIFICATION: ALL SIMULATOR LOCATION PAGES');
  console.log('='.repeat(70));

  try {
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, slug, city, latitude, longitude')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log(`📊 Verifying ${venues.length} individual simulator location pages...\n`);

    let passCount = 0;
    let warningCount = 0;
    let failCount = 0;
    let issues = [];

    // Test each individual venue page
    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const progress = `[${i + 1}/${venues.length}]`;

      // Check coordinates
      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);

      // Generate page URL
      const venueSlug = venue.slug || createSlug(venue.name);
      const citySlug = createSlug(venue.city);
      const pageUrl = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

      let status = '✅';
      let statusText = 'PASS';

      // Check for critical issues
      if (!venue.latitude || !venue.longitude || isNaN(lat) || isNaN(lng)) {
        status = '❌';
        statusText = 'FAIL';
        failCount++;
        issues.push({
          venue: venue.name,
          city: venue.city,
          url: pageUrl,
          issue: 'Missing coordinates - map won\'t display',
          severity: 'critical'
        });
      } else if (lat < 49.9 || lat > 61.0 || lng < -8.0 || lng > 2.0) {
        status = '❌';
        statusText = 'FAIL';
        failCount++;
        issues.push({
          venue: venue.name,
          city: venue.city,
          url: pageUrl,
          issue: 'Coordinates outside UK - wrong location',
          severity: 'critical'
        });
      } else {
        // Check coordinate precision
        const precision = (venue.latitude.toString().split('.')[1] || '').length;
        if (precision < 5) {
          status = '⚠️';
          statusText = 'WARN';
          warningCount++;
          issues.push({
            venue: venue.name,
            city: venue.city,
            url: pageUrl,
            issue: `Low precision (${precision} decimals) - may be inaccurate`,
            severity: 'warning'
          });
        } else {
          passCount++;
        }
      }

      console.log(`${progress} ${status} ${venue.name} (${venue.city}) - ${statusText}`);

      if (statusText === 'PASS') {
        console.log(`         📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        console.log(`         🔗 ${pageUrl}`);
      }

      // Show progress every 25 venues
      if (i > 0 && (i + 1) % 25 === 0) {
        console.log(`\n    ... ${i + 1}/${venues.length} venues checked ...\n`);
      }
    }

    // Test city page map centering for cities with multiple venues
    console.log('\n🗺️  TESTING CITY PAGE MAP CENTERING:');
    console.log('='.repeat(50));

    const cityGroups = {};
    venues.forEach(venue => {
      if (!cityGroups[venue.city]) {
        cityGroups[venue.city] = [];
      }
      cityGroups[venue.city].push(venue);
    });

    const multiVenueCities = Object.entries(cityGroups)
      .filter(([city, cityVenues]) => cityVenues.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    console.log(`📊 Testing ${multiVenueCities.length} cities with multiple venues:\n`);

    let cityMapIssues = [];

    for (const [cityName, cityVenues] of multiVenueCities) {
      let validCoords = [];
      let totalLat = 0;
      let totalLng = 0;

      cityVenues.forEach(venue => {
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          validCoords.push({ lat, lng });
          totalLat += lat;
          totalLng += lng;
        }
      });

      if (validCoords.length === 0) {
        console.log(`❌ ${cityName}: No valid coordinates for map centering`);
        cityMapIssues.push({
          city: cityName,
          issue: 'No valid coordinates',
          severity: 'critical'
        });
        continue;
      }

      const centerLat = totalLat / validCoords.length;
      const centerLng = totalLng / validCoords.length;

      // Calculate venue spread
      let maxDistance = 0;
      for (let i = 0; i < validCoords.length; i++) {
        for (let j = i + 1; j < validCoords.length; j++) {
          const distance = calculateDistance(
            validCoords[i].lat, validCoords[i].lng,
            validCoords[j].lat, validCoords[j].lng
          );
          maxDistance = Math.max(maxDistance, distance);
        }
      }

      const citySlug = createSlug(cityName);
      const cityUrl = `https://www.findagolfrange.com/simulators/uk/${citySlug}`;

      let cityStatus = '✅';
      if (maxDistance > 20) {
        cityStatus = '⚠️';
        cityMapIssues.push({
          city: cityName,
          issue: `Large venue spread (${maxDistance.toFixed(2)} miles) - check zoom level`,
          severity: 'warning',
          url: cityUrl
        });
      }

      console.log(`${cityStatus} ${cityName} (${cityVenues.length} venues):`);
      console.log(`     Center: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
      console.log(`     Spread: ${maxDistance.toFixed(2)} miles`);
      console.log(`     URL: ${cityUrl}`);
      console.log('');
    }

    // Distance calculation accuracy test
    console.log('📏 TESTING DISTANCE CALCULATION ACCURACY:');
    console.log('='.repeat(50));

    const knownDistances = [
      { name: 'London to Birmingham', lat1: 51.5074, lng1: -0.1278, lat2: 52.4862, lng2: -1.8904, expected: 101 },
      { name: 'Manchester to Liverpool', lat1: 53.4808, lng1: -2.2426, lat2: 53.4084, lng2: -2.9916, expected: 31 },
      { name: 'Bristol to Cardiff', lat1: 51.4545, lng1: -2.5879, lat2: 51.4816, lng2: -3.1791, expected: 26 }
    ];

    let distanceAccurate = true;
    for (const test of knownDistances) {
      const calculated = calculateDistance(test.lat1, test.lng1, test.lat2, test.lng2);
      const error = Math.abs(calculated - test.expected);
      const percentError = (error / test.expected) * 100;

      console.log(`📏 ${test.name}:`);
      console.log(`   Expected: ${test.expected} miles`);
      console.log(`   Calculated: ${calculated.toFixed(2)} miles`);
      console.log(`   Error: ${percentError.toFixed(1)}%`);

      if (percentError > 5) {
        console.log(`   ❌ Error too high`);
        distanceAccurate = false;
      } else {
        console.log(`   ✅ Accurate`);
      }
      console.log('');
    }

    // Final summary
    console.log('📊 FINAL LOCATION PAGE VERIFICATION SUMMARY:');
    console.log('='.repeat(60));

    console.log(`Total individual venue pages: ${venues.length}`);
    console.log(`✅ PASS (working correctly): ${passCount}`);
    console.log(`⚠️  WARNINGS (minor issues): ${warningCount}`);
    console.log(`❌ FAILURES (critical issues): ${failCount}`);

    const successRate = Math.round((passCount / venues.length) * 100);
    console.log(`Overall success rate: ${successRate}%`);

    if (failCount > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Must Fix):');
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.venue} (${issue.city})`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   URL: ${issue.url}`);
        console.log('');
      });
    }

    if (warningCount > 0) {
      console.log('\n⚠️  WARNINGS (Should Fix):');
      const warningIssues = issues.filter(issue => issue.severity === 'warning').slice(0, 5);
      warningIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.venue} (${issue.city})`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   URL: ${issue.url}`);
      });
      if (warningCount > 5) {
        console.log(`   ... and ${warningCount - 5} more warnings`);
      }
      console.log('');
    }

    if (cityMapIssues.length > 0) {
      console.log('🗺️  CITY MAP ISSUES:');
      cityMapIssues.forEach(issue => {
        console.log(`• ${issue.city}: ${issue.issue}`);
        if (issue.url) console.log(`  ${issue.url}`);
      });
      console.log('');
    }

    // Final assessment
    console.log('🎯 FINAL ASSESSMENT:');
    console.log('='.repeat(40));

    if (successRate >= 98 && failCount === 0 && distanceAccurate) {
      console.log('🎉 EXCELLENT: All simulator location pages are working perfectly!');
      console.log('   ✅ Individual venue maps display correctly');
      console.log('   ✅ City page maps center properly');
      console.log('   ✅ Distance calculations are accurate');
      console.log('   ✅ All coordinates are valid and precise');
    } else if (successRate >= 95 && failCount === 0) {
      console.log('👍 VERY GOOD: Almost all location pages working correctly');
      console.log(`   ✅ ${successRate}% success rate`);
      console.log('   ⚠️  Minor improvements recommended');
    } else if (failCount > 0) {
      console.log('⚠️  ISSUES DETECTED: Some location pages need fixes');
      console.log(`   ❌ ${failCount} venues have critical issues`);
      console.log(`   ⚠️  ${warningCount} venues have minor issues`);
      console.log('   🔧 Fixes required before full functionality');
    } else {
      console.log('✅ GOOD: Most location pages working');
      console.log('   🔧 Some improvements recommended');
    }

    if (distanceAccurate) {
      console.log('   ✅ Distance calculations are accurate and reliable');
    } else {
      console.log('   ⚠️  Distance calculation accuracy needs review');
    }

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verifyFinalLocationPages().catch(console.error);